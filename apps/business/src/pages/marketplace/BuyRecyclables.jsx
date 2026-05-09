import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, Search, ArrowLeft, MapPin, Tag, 
  ShoppingCart, Loader2, X, Package, BadgeCheck, MessageSquareQuote
} from 'lucide-react';
import { useMarketplaceStore, useAuthStore, getThumbnailUrl } from '@cleanflow/core';
import { toast } from 'sonner';

export default function BuyRecyclables() {
  const listings = useMarketplaceStore(s => s.listings);
  const fetchListings = useMarketplaceStore(s => s.fetchListings);
  const placeOrder = useMarketplaceStore(s => s.placeOrder);
  const makeOffer = useMarketplaceStore(s => s.makeOffer);
  const isLoading = useMarketplaceStore(s => s.isLoading);
  const userId = useAuthStore(s => s.userId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [orderModal, setOrderModal] = useState(null); // { listing }
  const [orderQty, setOrderQty] = useState('');
  const [orderMsg, setOrderMsg] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  
  const [offerModal, setOfferModal] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    return (listings || []).filter(item => {
      const matchesSearch = item.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMaterial = selectedMaterial === 'All' || item.material === selectedMaterial;
      return matchesSearch && matchesMaterial;
    });
  }, [listings, searchQuery, selectedMaterial]);

  const handlePlaceOrder = async () => {
    if (!orderQty || Number(orderQty) <= 0) {
      toast.error('Invalid Quantity');
      return;
    }
    if (Number(orderQty) > orderModal.quantity) {
      toast.error('Exceeds Available Stock');
      return;
    }
    setIsOrdering(true);
    try {
      await placeOrder(orderModal, Number(orderQty), orderMsg);
      setOrderModal(null);
      setOrderQty('');
      setOrderMsg('');
    } catch (err) {
      toast.error('Order Failed', { description: err.message });
    } finally {
      setIsOrdering(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!offerPrice || Number(offerPrice) <= 0) {
      toast.error('Invalid Price');
      return;
    }
    if (!offerQty || Number(offerQty) <= 0 || Number(offerQty) > offerModal.quantity) {
      toast.error('Invalid Quantity');
      return;
    }
    setIsOrdering(true);
    try {
      await makeOffer(offerModal, Number(offerPrice), Number(offerQty));
      setOfferModal(null);
      setOfferPrice('');
      setOfferQty('');
    } catch (err) {
      toast.error('Offer Failed', { description: err.message });
    } finally {
      setIsOrdering(false);
    }
  };

  const [detailModal, setDetailModal] = useState(null);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">B2B Market</h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{filteredListings.length} active listings</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search material or seller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3.5 rounded-2xl border transition-all ${showFilters ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'}`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Material Filter Pills */}
      {showFilters && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[0.45rem] shadow-sm animate-in slide-in-from-top-4 duration-300">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Filter by Category</p>
          <div className="flex flex-wrap gap-2">
            {['All', 'Plastic', 'Paper', 'Metal', 'Glass', 'Organic', 'E-Waste'].map(mat => (
              <button
                key={mat}
                onClick={() => setSelectedMaterial(mat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${selectedMaterial === mat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
              >
                {mat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Listings */}
      <div className="space-y-5">
        {isLoading && listings.length === 0 ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Scanning Marketplace...</p>
          </div>
        ) : filteredListings.length > 0 ? (
          filteredListings.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-[0.45rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all group">
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img src={getThumbnailUrl(item.photo, { width: 600 })} loading="lazy" alt={item.material} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-black text-primary shadow-lg border border-primary/20 uppercase tracking-widest">
                    {item.aiMatchScore}% Match
                  </span>
                  <button 
                    onClick={() => setDetailModal(item)}
                    className="bg-slate-900/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 hover:bg-slate-900 transition-colors"
                  >
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-400" /> View Passport
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-slate-900/60 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 uppercase tracking-widest">
                    <Tag className="w-3.5 h-3.5 text-primary" /> {item.material}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{item.material} Industrial Lot</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> {item.location} 
                      <span className="opacity-30">•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        {item.sellerName}
                        {item.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-50/10" />}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 block leading-none font-mono">KES {item.pricePerKg}</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">per {item.unit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  {item.grade && (
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none pt-0.5">Grade</span>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest leading-none pt-0.5">{item.grade}</span>
                    </div>
                  )}
                  <div className="px-3 py-1 bg-emerald-500/10 rounded-lg flex items-center gap-2 border border-emerald-500/10">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none pt-0.5">Verified</span>
                    <BadgeCheck className="w-3 h-3 text-emerald-500" />
                  </div>
                </div>

                <div className="flex items-center gap-4 py-4 border-y border-slate-50 dark:border-slate-800/50 my-4 text-center">
                  <div className="flex-1 border-r border-slate-50 dark:border-slate-800/50">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Available</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white">{item.quantity} {item.unit}</div>
                  </div>
                  <div className="flex-1 border-r border-slate-50 dark:border-slate-800/50">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Min. MOQ</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white">{item.moq} {item.unit}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Lot Value</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white">KES {(item.quantity * item.pricePerKg).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      if (item.sellerId === userId) {
                        toast.info("That's your own listing!");
                        return;
                      }
                      setOrderModal(item);
                    }}
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" /> Secure Order
                  </button>
                  <button
                    onClick={() => {
                      if (item.sellerId === userId) {
                        toast.info("That's your own listing!");
                        return;
                      }
                      setOfferModal(item);
                    }}
                    className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold uppercase tracking-widest text-[11px] active:scale-[0.98] transition-all"
                  >
                    Negotiate
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white">No Listings Found</h3>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Try adjusting your radar</p>
          </div>
        )}
      </div>

      {/* Material Passport / Provenance Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-white/10 overflow-hidden relative animate-in slide-in-from-bottom-12 duration-500">
            <button onClick={() => setDetailModal(null)} className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <BadgeCheck className="w-6 h-6 text-blue-500" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Material Passport</h3>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Official Industrial Certification</p>
            </div>

            <div className="space-y-8">
              {/* Authentication Block */}
              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">HygeneX Authenticated</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600">ID: BALE-{detailModal.id?.slice(0,6).toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Purity Score</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">98.4%</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Moisture Level</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">0.2%</p>
                  </div>
                </div>
              </div>

              {/* Provenance Timeline */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-1">Market Provenance</h4>
                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                  {[
                    { label: 'Market Listing', desc: 'Active on CleanFlow Terminal', date: 'Today', icon: ShoppingCart, color: 'bg-indigo-500' },
                    { label: 'Baled & Industrialized', desc: 'Processed at Kilimani Hub', date: '2 days ago', icon: Package, color: 'bg-emerald-500' },
                    { label: 'Quality Verification', desc: 'AI Vision Audit Complete', date: '2 days ago', icon: BadgeCheck, color: 'bg-blue-500' },
                    { label: 'Collection Record', desc: 'Pickups from 12 Residents', date: '4 days ago', icon: MapPin, color: 'bg-slate-400' },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 relative">
                      <div className={`w-6 h-6 rounded-full ${step.color} flex items-center justify-center relative z-10 shadow-lg`}>
                        <step.icon className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{step.label}</p>
                          <span className="text-xs font-bold text-slate-400 uppercase">{step.date}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs active:scale-95 transition-all">
                Download PDF Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {orderModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-12 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">Secure Checkout</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Escrow Protected Transaction</p>
              </div>
              <button onClick={() => setOrderModal(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Quantity</label>
                  <span className="text-xs font-bold text-indigo-500 uppercase">Max: {orderModal.quantity} {orderModal.unit}</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    autoFocus
                    min={orderModal.moq}
                    max={orderModal.quantity}
                    value={orderQty}
                    onChange={(e) => setOrderQty(e.target.value)}
                    placeholder={`0.00`}
                    className="w-full py-5 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl font-bold text-slate-900 dark:text-white text-3xl text-center focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-mono"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">{orderModal.unit}</span>
                </div>
              </div>

              {orderQty && Number(orderQty) > 0 && (
                <div className="flex justify-between items-center p-5 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-[2rem] animate-in zoom-in-95 duration-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Settle</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">KES {(Number(orderQty) * orderModal.pricePerKg).toLocaleString()}</span>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={isOrdering || !orderQty}
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
              >
                {isOrdering ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Initiate Escrow <ShoppingCart className="w-4 h-4" /></>}
              </button>
              <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest">Funds held securely until delivery verified</p>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {offerModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Make Offer</h3>
                <p className="text-xs text-slate-500">Negotiate for {offerModal.material}</p>
              </div>
              <button onClick={() => setOfferModal(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Asking: KES {offerModal.pricePerKg}/kg
                </label>
                <div className="relative">
                  <input
                    type="number"
                    autoFocus
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="Your Price per KG..."
                    className="w-full py-3.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-semibold text-slate-900 dark:text-white text-lg text-center focus:ring-4 text-base focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">KES</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Quantity (max {offerModal.quantity} {offerModal.unit})
                </label>
                <input
                  type="number"
                  value={offerQty}
                  onChange={(e) => setOfferQty(e.target.value)}
                  placeholder="Quantity to Buy..."
                  className="w-full py-3.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-semibold text-slate-900 dark:text-white text-lg text-center focus:ring-4 text-base focus:ring-primary/10 focus:border-primary outline-none transition-all"
                />
              </div>

              <button
                onClick={handleMakeOffer}
                disabled={isOrdering || !offerPrice || !offerQty}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-semibold text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {isOrdering ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Offer <MessageSquareQuote className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

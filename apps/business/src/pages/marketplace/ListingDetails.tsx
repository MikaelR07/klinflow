/**
 * ListingDetails — B2B Material Inspection Workstation
 * Follows the same design pattern as ArrivalDetails but for marketplace listings.
 */
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Scale, MapPin, Clock, Package, Building2,
  ShieldCheck, BadgeCheck, Loader2, User, Tag,
  ChevronDown, ChevronUp, Eye, MessageSquare
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { toast } from 'sonner';

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const userId = useAuthStore(s => s.userId);
  const listings = useMarketplaceStore(s => s.listings);
  const fetchListings = useMarketplaceStore(s => s.fetchListings);
  const makeOffer = useMarketplaceStore(s => s.makeOffer);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Offer State
  const [showOffer, setShowOffer] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState('');
  const [isOffering, setIsOffering] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        await fetchListings().catch(() => []);
        
        const found = (listings || []).find(l => String(l.id) === String(id));
        
        if (found) {
          setItem(found);
          setOfferQty(String(found.moq || Math.max(1, Math.round(found.quantity * 0.1))));
          setOfferPrice(String(found.pricePerKg || ''));
        } else {
          setError('Listing not found');
        }
      } catch (err) {
        console.error('[ListingDetails] Load error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, fetchListings]);

  // Re-match after listings refresh
  useEffect(() => {
    if (!item && listings.length > 0) {
      const found = listings.find(l => String(l.id) === String(id));
      if (found) {
        setItem(found);
        setOfferQty(String(found.moq || Math.max(1, Math.round(found.quantity * 0.1))));
        setOfferPrice(String(found.pricePerKg || ''));
        setError(null);
        setLoading(false);
      }
    }
  }, [listings, id, item]);

  const handleMakeOffer = async () => {
    if (!offerPrice || !offerQty) return toast.error('Enter price and quantity');
    if (Number(offerQty) < (item.moq || 1)) return toast.error(`Minimum order is ${item.moq || 1} ${item.unit || 'KG'}`);
    if (Number(offerQty) > item.quantity) return toast.error('Exceeds available stock');
    
    setIsOffering(true);
    try {
      await makeOffer(item, Number(offerPrice), Number(offerQty));
      setShowOffer(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsOffering(false);
    }
  };

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // ── LOADING STATE ──
  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20 animate-pulse">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
      <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Loading Listing...</p>
    </div>
  );

  // ── ERROR STATE ──
  if (error || !item) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <Package className="w-10 h-10 text-slate-500" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Listing Not Found</h2>
      <p className="text-xs text-slate-700 mb-8 max-w-[260px]">This listing may have been removed or is no longer available.</p>
      <button onClick={() => navigate(-1)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-all">
        Go Back
      </button>
    </div>
  );

  const photos = item.photos?.length > 0 ? item.photos : (item.photo ? [item.photo] : []);
  const isOwnListing = item.sellerId === userId;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-32">
      <div className="animate-fade-in -mx-2 -mt-5">
        {/* Edge-to-Edge Hero Image */}
        <div className="w-full aspect-[4/3] bg-slate-200 dark:bg-slate-800 overflow-hidden relative shadow-lg">
          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full w-full">
            {photos.length > 0 ? photos.map((url, i) => (
              <div key={i} className="flex-shrink-0 w-full h-full snap-center">
                <img src={url} alt={item.material} className="w-full h-full object-cover" />
              </div>
            )) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                <Package className="w-20 h-20 text-slate-600 dark:text-slate-600" />
              </div>
            )}
          </div>

          {/* Photo indicators */}
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60" />
              ))}
            </div>
          )}

          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)} 
            className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-xl rounded-full flex items-center justify-center active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* Status Badge */}
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-emerald-500/90 backdrop-blur-sm rounded-full">
            <span className="text-xs font-black text-white uppercase tracking-widest">{item.status || 'Active'}</span>
          </div>
        </div>

        {/* Content Sheet */}
        <div className="relative -mt-8 bg-slate-50 dark:bg-slate-900 rounded-t-3xl px-6 pt-8 pb-12 space-y-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none min-h-[60vh]">
          
          {/* Title & Seller */}
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{item.material}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-800">
                <User className="w-3.5 h-3.5" />
                <span className="font-semibold">{item.sellerName}</span>
                {item.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-indigo-500" />}
              </div>
              <span className="text-slate-600 dark:text-slate-600">·</span>
              <span className="text-xs font-medium text-slate-700">{timeAgo(item.createdAt)}</span>
            </div>
          </div>

          {/* Price Hero */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Asking Price</p>
                <p className="text-3xl font-black text-emerald-600 italic leading-none">
                  KSh {item.pricePerKg}<span className="text-sm text-slate-700 font-medium not-italic ml-1">/{item.unit || 'KG'}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1">Total Value</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white italic">
                  KSh {(item.pricePerKg * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
              <Scale className="w-4 h-4 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Available</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{item.quantity} <span className="text-xs text-slate-700">{item.unit || 'KG'}</span></p>
            </div>
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
              <Tag className="w-4 h-4 text-indigo-500 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Min. Order</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{item.moq || 1} <span className="text-xs text-slate-700">{item.unit || 'KG'}</span></p>
            </div>
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
              <ShieldCheck className="w-4 h-4 text-amber-500 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Grade</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{item.grade || 'Standard'}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Location */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Location</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.location}</p>
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Description</p>
                <p className="text-sm text-slate-900 dark:text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Activity Metrics */}
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <Eye className="w-4 h-4 text-slate-700" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{item.views || 0}</p>
                  <p className="text-xs text-slate-700 font-bold uppercase">Views</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <MessageSquare className="w-4 h-4 text-slate-700" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{item.offers || 0}</p>
                  <p className="text-xs text-slate-700 font-bold uppercase">Offers</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <Clock className="w-4 h-4 text-slate-700" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{timeAgo(item.createdAt)}</p>
                  <p className="text-xs text-slate-700 font-bold uppercase">Posted</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── ACTION SECTION ── */}
          {!isOwnListing && (
            <div className="space-y-3 pt-4">
              {/* Offer Toggle */}
              <button 
                onClick={() => setShowOffer(!showOffer)}
                className="w-full py-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-900 dark:text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {showOffer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showOffer ? 'Cancel' : 'Negotiate Price'}
              </button>

              {/* Offer Form */}
              {showOffer && (
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 block">Your Price</label>
                      <input
                        type="number"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 h-12 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-3 bottom-3.5 text-xs font-bold text-slate-600">KSh/KG</span>
                    </div>
                    <div className="relative">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 block">Quantity</label>
                      <input
                        type="number"
                        min={item.moq || 1}
                        max={item.quantity}
                        value={offerQty}
                        onChange={(e) => setOfferQty(Math.min(item.quantity, Number(e.target.value)))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 h-12 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-3 bottom-3.5 text-xs font-bold text-slate-600">KG</span>
                    </div>
                  </div>

                  {offerPrice && offerQty && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 text-center">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Offer Total</p>
                      <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 italic">
                        KSh {(Number(offerPrice) * Number(offerQty)).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleMakeOffer}
                    disabled={isOffering || !offerPrice || !offerQty}
                    className="w-full py-4 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isOffering ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isOffering ? 'Sending...' : 'Submit Offer'}
                  </button>
                </div>
              )}

              {/* Direct Buy */}
              <button
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                Buy at Asking Price
              </button>
            </div>
          )}

          {isOwnListing && (
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-5 text-center border border-indigo-100 dark:border-indigo-500/20">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">This is your listing</p>
              <p className="text-xs text-slate-700 mt-1">Manage it from your listings page.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Sourcing Page — Agent's marketplace portal for buying recyclable materials
 */
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Scale, TrendingUp,
  ChevronRight, MessageSquareQuote, Check,
  ArrowLeft, Clock, Package, CheckCircle2, Info, User, Users,
  SlidersHorizontal, X, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { toast } from 'sonner';
import { Virtuoso } from 'react-virtuoso';

// Category badge color map
const CATEGORY_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  plastic: { bg: 'bg-blue-200', text: 'text-blue-700', darkBg: 'dark:bg-blue-500/15', darkText: 'dark:text-blue-400' },
  metal: { bg: 'bg-amber-200', text: 'text-amber-700', darkBg: 'dark:bg-amber-500/15', darkText: 'dark:text-amber-400' },
  paper: { bg: 'bg-indigo-200', text: 'text-indigo-700', darkBg: 'dark:bg-indigo-500/15', darkText: 'dark:text-indigo-400' },
  organic: { bg: 'bg-green-200', text: 'text-green-700', darkBg: 'dark:bg-green-500/15', darkText: 'dark:text-green-400' },
  glass: { bg: 'bg-cyan-200', text: 'text-cyan-700', darkBg: 'dark:bg-cyan-500/15', darkText: 'dark:text-cyan-400' },
  'e-waste': { bg: 'bg-red-200', text: 'text-red-700', darkBg: 'dark:bg-red-500/15', darkText: 'dark:text-red-400' },
  textile: { bg: 'bg-purple-200', text: 'text-purple-700', darkBg: 'dark:bg-purple-500/15', darkText: 'dark:text-purple-400' },
};

const getCategoryStyle = (category: string) => {
  const key = category?.toLowerCase() || '';
  return CATEGORY_COLORS[key] || { bg: 'bg-slate-100', text: 'text-slate-600', darkBg: 'dark:bg-slate-700', darkText: 'dark:text-slate-400' };
};

export default function Sourcing() {
  const navigate = useNavigate();
  const listings = useMarketplaceStore(s => s.listings);
  const fetchListings = useMarketplaceStore(s => s.fetchListings);
  const makeOffer = useMarketplaceStore(s => s.makeOffer);
  const sentOffers = useMarketplaceStore(s => s.sentOffers);
  const fetchSentOffers = useMarketplaceStore(s => s.fetchSentOffers);
  const isLoading = useMarketplaceStore(s => s.isLoading);

  const profile = useAuthStore(s => s.profile);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTab, setSelectedTab] = useState<'All' | 'Individual' | 'Bulk Sells'>('All');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState(1);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterMaterial, setFilterMaterial] = useState('All');
  const [filterPriceRange, setFilterPriceRange] = useState('All');
  const [filterWeight, setFilterWeight] = useState('All');

  const [activeBidsCount, setActiveBidsCount] = useState(0);
  const [acceptedTradesCount, setAcceptedTradesCount] = useState(0);
  const [activeBidsVolume, setActiveBidsVolume] = useState(0);

  useEffect(() => {
    setActiveBidsCount(sentOffers.length || 0);

    // Fetch accepted trades count from bookings
    if (profile?.id) {
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', profile.id)
        .or('is_market_trade.eq.true,booking_type.eq.marketplace_pickup')
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .then(({ count }) => setAcceptedTradesCount(count || 0));
    }

    // Sum volume directly from active sent offers
    const volume = sentOffers
      .reduce((acc, o) => acc + (Number(o.quantity || 0)), 0);
    setActiveBidsVolume(volume);
  }, [sentOffers, listings, profile?.id]);

  useEffect(() => {
    fetchListings();
    fetchSentOffers();

    const mapListing = (l) => ({
      id: l.id,
      sellerId: l.seller_id,
      material: l.material,
      quantity: l.quantity,
      pricePerKg: l.price_per_kg,
      location: l.location,
      latitude: l.latitude,
      longitude: l.longitude,
      status: l.status,
      photo: l.photo_url,
      photoUrl: l.photo_url,
      grade: l.grade,
      sellerName: l.seller_id, // Simplified for realtime, actual name needs join
      createdAt: l.created_at || new Date().toISOString()
    });

    const channelName = `sourcing-radar-${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace_listings' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const mapped = mapListing(payload.new);
            useMarketplaceStore.setState(s => ({ listings: [mapped, ...s.listings] }));
          } else if (payload.eventType === 'UPDATE') {
            const mapped = mapListing(payload.new);
            useMarketplaceStore.setState(s => ({
              listings: s.listings.map(l => l.id === payload.new.id ? { ...l, ...mapped } : l)
            }));
          } else if (payload.eventType === 'DELETE') {
            useMarketplaceStore.setState(s => ({
              listings: s.listings.filter(l => l.id !== payload.old.id)
            }));
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace_offers', filter: `buyer_id=eq.${profile?.id}` },
        () => fetchSentOffers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchListings, fetchSentOffers]);

  const selectedListing = listings.find(l => l.id === selectedId);

  // Initialize offer fields when a listing is selected
  useEffect(() => {
    if (selectedListing) {
      setOfferPrice(selectedListing.pricePerKg?.toString() || '');
      setOfferQty(selectedListing.quantity || 1);
    }
  }, [selectedId, selectedListing]);

  const handleMakeOffer = async () => {
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (offerQty <= 0 || offerQty > selectedListing.quantity) {
      toast.error('Invalid quantity');
      return;
    }

    try {
      await makeOffer(selectedListing, parseFloat(offerPrice), offerQty);
      setSelectedId(null);
      setOfferPrice('');
      toast.success('Offer Sent! 🚀', { description: 'The seller will be notified of your bid.' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getHasOffer = (listingId) => {
    return sentOffers.some(o => o.listingId === listingId);
  };

  const filteredListings = useMemo(() => {
    let result = listings;

    if (selectedTab === 'Individual') {
      result = result.filter(l => !l.isBulkDrive);
    } else if (selectedTab === 'Bulk Sells') {
      result = result.filter(l => l.isBulkDrive);
    }

    if (filterMaterial !== 'All') {
      result = result.filter(l => {
        const cat = (l.materialCategory || l.material || '').toLowerCase();
        return cat.includes(filterMaterial.toLowerCase());
      });
    }

    if (filterWeight !== 'All') {
      result = result.filter(l => {
        const qty = parseFloat(l.quantity) || 0;
        if (filterWeight === 'small') return qty < 100;
        if (filterWeight === 'medium') return qty >= 100 && qty <= 500;
        if (filterWeight === 'large') return qty > 500;
        return true;
      });
    }

    if (filterPriceRange !== 'All') {
      result = result.filter(l => {
        const price = parseFloat(l.pricePerKg) || 0;
        if (filterPriceRange === 'low') return price < 50;
        if (filterPriceRange === 'medium') return price >= 50 && price <= 100;
        if (filterPriceRange === 'high') return price > 100;
        return true;
      });
    }

    if (!searchTerm) return result;
    const term = searchTerm.toLowerCase();
    return result.filter(l =>
      (l.material && l.material.toLowerCase().includes(term)) ||
      (l.location && l.location.toLowerCase().includes(term))
    );
  }, [listings, searchTerm, selectedTab, filterMaterial, filterWeight, filterPriceRange]);

  return (
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV (Edge to Edge PWA Style) ── */}
      {!selectedId && (
        <div className="h-[calc(env(safe-area-inset-top,1rem)+8.4rem)]" />
      )}
      {!selectedId && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800/90 pt-[calc(env(safe-area-inset-top,1rem)+0.8rem)] pb-1 px-4 border-b border-slate-200 dark:border-slate-900 max-w-lg mx-auto">
          <div className="max-w-lg mx-auto">
            {/* Header row */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
              </button>

              <div className="text-center">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none">Material Marketplace</h1>
                <p className="text-[10px] font-bold text-slate-500 capitalize tracking-[0.2em] mt-1">Sourcing Portal</p>
              </div>

              <div className="w-10" /> {/* Spacer */}
            </div>


            {/* Compact Search Bar & Filter Toggle */}
            <div className="mt-2 flex items-center gap-2">
              <div className="relative group flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search materials or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
              
              {/* Filter Panel Toggle */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`p-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all shrink-0 ${isFilterOpen || filterMaterial !== 'All' || filterPriceRange !== 'All' || filterWeight !== 'All'
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-750'
                  }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {(filterMaterial !== 'All' || filterPriceRange !== 'All' || filterWeight !== 'All') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
              </button>
            </div>

            {/* Dropdown Filters Expandable Panel */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <div className="p-3 grid grid-cols-3 gap-2">
                    {/* Material Filter */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Material</label>
                      <div className="relative">
                        <select
                          value={filterMaterial}
                          onChange={(e) => setFilterMaterial(e.target.value)}
                          className="w-full py-1.5 pl-2 pr-6 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 appearance-none focus:outline-none focus:border-indigo-500"
                        >
                          <option value="All">All Materials</option>
                          <option value="Plastic">Plastic</option>
                          <option value="Metal">Metal</option>
                          <option value="Paper">Paper</option>
                          <option value="Organic">Organic</option>
                          <option value="Glass">Glass</option>
                          <option value="E-waste">E-waste</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Weight Filter */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Weight</label>
                      <div className="relative">
                        <select
                          value={filterWeight}
                          onChange={(e) => setFilterWeight(e.target.value)}
                          className="w-full py-1.5 pl-2 pr-6 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 appearance-none focus:outline-none focus:border-indigo-500"
                        >
                          <option value="All">All Weights</option>
                          <option value="small">&lt; 100kg</option>
                          <option value="medium">100 - 500kg</option>
                          <option value="large">&gt; 500kg</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Price Filter */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Price/kg</label>
                      <div className="relative">
                        <select
                          value={filterPriceRange}
                          onChange={(e) => setFilterPriceRange(e.target.value)}
                          className="w-full py-1.5 pl-2 pr-6 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 appearance-none focus:outline-none focus:border-indigo-500"
                        >
                          <option value="All">All Prices</option>
                          <option value="low">&lt; 50/kg</option>
                          <option value="medium">50 - 100/kg</option>
                          <option value="high">&gt; 100/kg</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Clear filters bar */}
                  {(filterMaterial !== 'All' || filterWeight !== 'All' || filterPriceRange !== 'All') && (
                    <div className="px-3 pb-2 flex justify-end">
                      <button
                        onClick={() => {
                          setFilterMaterial('All');
                          setFilterWeight('All');
                          setFilterPriceRange('All');
                        }}
                        className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 uppercase tracking-wider flex items-center gap-1"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="mt-1 flex bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-xl">
              {(['All', 'Individual', 'Bulk Sells'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`flex-1 py-1.5 text-[10px] font-bold capitalize tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${selectedTab === tab
                    ? 'bg-indigo-600 shadow-sm text-white font-black'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                  <span className="truncate">{tab}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 space-y-0 pb-24 ${!selectedId ? 'pt-0' : 'pt-0'} relative max-w-lg mx-auto w-full`}>

        {/* ── CONTENT AREA ── */}
        <main>
          {selectedId && selectedListing ? (
            /* ── FOCUSED SOURCING VIEW (Immersive Kilimall Style) ── */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-800 overflow-y-auto no-scrollbar pb-6"
            >
              {/* ── FIXED TOP NAV ── */}
              <div className="fixed top-0 left-0 right-0 z-50 w-full max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
                <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
                  <button onClick={() => setSelectedId(null)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
                    <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                  </button>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Material Details</h1>
                    <p className="text-[10px] font-bold text-indigo-500 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Sourcing Portal
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)]">
                {/* ── IMAGE CAROUSEL ── */}
                <div className="relative h-[270px] w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-900">
                  <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                    {(selectedListing.photos?.length > 0 ? selectedListing.photos : [selectedListing.photoUrl || selectedListing.photo]).map((imgUrl, idx) => (
                      <div key={idx} className="w-full h-full shrink-0 snap-center">
                        {imgUrl ? (
                          <OptimizedImage src={getThumbnailUrl(imgUrl, { width: 800 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" alt={`${selectedListing.material} - View ${idx + 1}`} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                            <Package className="w-20 h-20 text-slate-200 dark:text-slate-700" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />

                  {(selectedListing.photos?.length > 1) && (
                    <>
                      <div className="absolute top-4 right-4 z-10 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                        <span>Photos ({selectedListing.photos.length})</span>
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {selectedListing.photos.map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white shadow-lg opacity-50 first:opacity-100" />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* ── MATERIAL SPECIFICATIONS CARD ── */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material</p>
                      <h2 className="text-[16px] text-indigo-700 font-bold dark:text-white capitalize leading-tight mb-2">
                        {selectedListing.materialSubcategory || selectedListing.material}
                      </h2>
                      {(() => {
                        const category = selectedListing.materialCategory || (selectedListing.materialSubcategory ? selectedListing.material : null);
                        if (!category) return null;
                        const style = getCategoryStyle(category);
                        return (
                          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}>
                            {category}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-200 dark:border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">Verified</span>
                    </div>
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800/60" />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Available Stock</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{selectedListing.quantity} KG</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Location</p>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{selectedListing.location}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{selectedListing.isBulkDrive ? 'Community Group' : 'Merchant'}</p>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{selectedListing.isBulkDrive ? 'Bulk Drive' : (selectedListing.sellerName || 'Verified')}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Time Posted</p>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {selectedListing.createdAt ? new Date(selectedListing.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ASAP'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedListing.description && (
                    <>
                      <hr className="border-slate-100  dark:border-slate-800/60" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" /> Seller Notes
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-350 italic">"{selectedListing.description}"</p>
                      </div>
                    </>
                  )}
                  
                  {selectedListing.isBulkDrive && selectedListing.groupMetadata && (
                    <>
                      <hr className="border-slate-100 dark:border-slate-800/60" />
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <h4 className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300">Community Contribution</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-bold text-indigo-400/80 capitalize tracking-widest mb-0.5">Contributors</p>
                            <p className="text-xs font-black text-indigo-700 dark:text-indigo-300">{selectedListing.groupMetadata.contributorCount || 0} Members</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-indigo-400/80 capitalize tracking-widest mb-0.5">Top Members</p>
                            <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 leading-tight">
                              {(selectedListing.groupMetadata.topContributors || []).join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Premium Bid Section */}
                <div className={`${getHasOffer(selectedListing.id) ? 'bg-primary' : 'bg-emerald-700'} p-2 rounded-[1rem] border border-white/10 space-y-4 transition-colors duration-500`}>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      {getHasOffer(selectedListing.id) ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <MessageSquareQuote className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <h3 className="text-[10px] font-bold text-white capitalize tracking-[0.2em]">
                      {getHasOffer(selectedListing.id) ? 'Bid Active' : 'Ready to negotiate?'}
                    </h3>
                  </div>

                  {getHasOffer(selectedListing.id) ? (
                    <div className="text-center py-4 space-y-2">
                      <p className="text-xs font-medium text-white/90 leading-relaxed italic px-4">
                        "Your offer for this material has been sent to the merchant. You'll be notified if they accept your bid."
                      </p>
                      <div className="pt-4">
                        <button
                          onClick={() => setSelectedId(null)}
                          className="w-full py-3 bg-white/20 text-white rounded-xl font-bold text-[10px] capitalize tracking-widest active:scale-95 transition-all"
                        >
                          Browse other materials
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Detailed Seller Asking Info */}
                      <div className="bg-emerald-900 rounded-xl p-2 border border-white/10">
                        <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" /> Seller's Asking Price
                        </p>
                        
                        <div className="flex items-end justify-between mb-1">
                           <div>
                             <p className="text-[10px] text-white/60 font-semibold mb-0.5">Price Per KG</p>
                             <p className="text-base font-black text-white">KSh {selectedListing.pricePerKg}</p>
                           </div>
                           <div className="text-white/40 pb-1 font-black">×</div>
                           <div className="text-right">
                             <p className="text-[10px] text-white/60 font-semibold mb-0.5">Total Quantity</p>
                             <p className="text-base font-black text-white">{selectedListing.quantity} KG</p>
                           </div>
                        </div>
                        
                        <div className="h-px bg-white/20 my-2" />
                        
                        <div className="flex items-center justify-between">
                           <p className="text-xs font-bold text-white/80">Total Asking Price</p>
                           <p className="text-xl font-black text-green-400">KSh {(selectedListing.pricePerKg * selectedListing.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-white capitalize tracking-widest ml-1">My Price Offer</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={offerPrice}
                              onChange={(e) => setOfferPrice(e.target.value)}
                              className="w-full bg-emerald-900 border border-white/20 h-12 rounded-xl px-4 text-sm font-black text-white outline-none transition-all placeholder:text-white/40"
                              placeholder="0.00"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/50">/KG</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-white capitalize tracking-widest ml-1">Total Weight</label>
                          <div className="relative">
                            <input
                              type="number"
                              max={selectedListing.quantity}
                              value={offerQty}
                              onChange={(e) => setOfferQty(e.target.value)}
                              className="w-full bg-emerald-900 border border-white/20 h-12 rounded-xl px-4 text-sm font-black text-white outline-none transition-all placeholder:text-white/40"
                              placeholder="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/50">KG</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-white/10">
                        <div className="flex items-center justify-between mb-4 px-1">
                          <p className="text-[10px] font-bold text-white/80 capitalize tracking-widest">Total Bid Value</p>
                          <p className="text-base font-black text-white tracking-tighter">KSh {(parseFloat(offerPrice || '0') * parseFloat(offerQty?.toString() || '0')).toLocaleString()}</p>
                        </div>

                        <button
                          onClick={handleMakeOffer}
                          disabled={isLoading || !offerPrice || !offerQty}
                          className="w-full py-4 bg-white text-primary rounded-2xl font-black text-xs capitalize tracking-[0.2em] shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {isLoading ? 'Processing...' : (
                            <>
                              <CheckCircle2 className="w-5 h-5" /> Send Offer Now
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Dismiss Detail */}
                <button
                  onClick={() => setSelectedId(null)}
                  className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 rounded-[1rem] font-black text-xs capitalize tracking-[0.2em] active:scale-95 transition-all"
                >
                  Back to marketplace
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── MAIN RADAR VIEW ── */
            <div className="space-y-1 pb-32">
              {filteredListings.length === 0 ? (
                <div className="py-20 text-center px-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">No materials found nearby</p>
                </div>
              ) : (
                <Virtuoso
                  useWindowScroll
                  data={filteredListings}
                  itemContent={(index, listing) => (
                    <div
                      onClick={() => setSelectedId(listing.id)}
                      className="bg-white dark:bg-slate-900/60 py-3 px-3.5 shadow-sm border-b border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800">
                          {(listing.photoUrl || listing.photo) ? (
                            <OptimizedImage src={getThumbnailUrl(listing.photoUrl || listing.photo, { width: 150 })} alt={listing.material} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          {/* Row 1: Material & Price */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                              <h3 className="text-[11px] font-bold text-slate-900 dark:text-white capitalize tracking-tight">
                                {listing.materialSubcategory || listing.material}
                              </h3>
                              {(() => {
                                const category = listing.materialCategory || (listing.materialSubcategory ? listing.material : null);
                                if (!category) return null;
                                const style = getCategoryStyle(category);
                                return (
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}>
                                    {category}
                                  </span>
                                );
                              })()}
                              {listing.isBulkDrive && (
                                <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center gap-0.5 shrink-0">
                                  <Users className="w-2.5 h-2.5" /> Bulk
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tighter shrink-0 ml-2">KSh {listing.pricePerKg}/kg</span>
                          </div>

                          {/* Row 2: Location & Optional Badge */}
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]">
                              <MapPin className="w-2.5 h-2.5 text-green-500" /> {listing.location}
                            </p>
                            {getHasOffer(listing.id) && (
                              <span className="px-1 py-0.5 bg-blue-500/10 text-blue-600 text-[6px] font-black capitalize tracking-[0.2em] rounded shrink-0">
                                ACTIVE BID
                              </span>
                            )}
                          </div>

                          {/* Row 3: Timestamp & Quantity */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/50">
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                              <Clock className="w-2.5 h-2.5 text-slate-400" /> {listing.createdAt ? new Date(listing.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ASAP'}
                            </p>
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0">
                              <span className="text-[9px] text-slate-400 not-italic font-bold mr-1 opacity-70">Quantity:</span>
                              <Scale className="w-2.5 h-2.5" /> {listing.quantity} KG
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center text-slate-300">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * Sourcing Page — Agent's marketplace portal for buying recyclable materials
 */
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Scale, TrendingUp,
  ChevronRight, MessageSquareQuote, Check,
  ArrowLeft, Clock, Package, CheckCircle2, Info, User, Users,
  SlidersHorizontal, X, ChevronDown, Receipt, Sparkles, FileText,
  Recycle, Droplets, Cog, ScrollText, Wine, Cpu, Shirt, Apple, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { toast } from 'sonner';

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
  const targetedDropoffs = useMarketplaceStore(s => s.targetedDropoffs);
  const fetchListings = useMarketplaceStore(s => s.fetchListings);
  const fetchTargetedDropoffs = useMarketplaceStore(s => s.fetchTargetedDropoffs);
  const makeOffer = useMarketplaceStore(s => s.makeOffer);
  const sentOffers = useMarketplaceStore(s => s.sentOffers);
  const fetchSentOffers = useMarketplaceStore(s => s.fetchSentOffers);
  const isLoading = useMarketplaceStore(s => s.isLoading);

  const profile = useAuthStore(s => s.profile);
  const currentCompanyId = useAuthStore(s => s.currentCompanyId);
  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTab, setSelectedTab] = useState<'All' | 'Direct Requests' | 'Bulk Sells'>('All');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState(1);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterMaterial, setFilterMaterial] = useState('All');
  const [filterPriceRange, setFilterPriceRange] = useState('All');
  const [filterWeight, setFilterWeight] = useState('All');
  const [isMoreCategoriesOpen, setIsMoreCategoriesOpen] = useState(false);

  const [activeBidsCount, setActiveBidsCount] = useState(0);
  const [acceptedTradesCount, setAcceptedTradesCount] = useState(0);
  const [activeBidsVolume, setActiveBidsVolume] = useState(0);

  // Memoize offer/recommendation lookup sets for O(1) checks
  const offerIdSet = useMemo(() => new Set(sentOffers.map(o => o.listingId)), [sentOffers]);
  const recommendationIdSet = useMemo(() => new Set(recommendations.map(r => r.listing_id)), [recommendations]);

  const getHasOfferMemo = useCallback((listingId: string) => offerIdSet.has(listingId), [offerIdSet]);
  const getHasRecommendedMemo = useCallback((listingId: string) => recommendationIdSet.has(listingId), [recommendationIdSet]);

  useEffect(() => {
    setActiveBidsCount(sentOffers.length || 0);

    // Sum volume directly from active sent offers
    const volume = sentOffers
      .reduce((acc, o) => acc + (Number(o.quantity || 0)), 0);
    setActiveBidsVolume(volume);
  }, [sentOffers]);

  // Fetch accepted trades count separately — only when profile changes
  useEffect(() => {
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
  }, [profile?.id]);

  useEffect(() => {
    fetchListings();
    fetchSentOffers();
    if (profile?.id && isFleetDriver) {
      fetchRecommendations();
    }
    if (!isFleetDriver) fetchTargetedDropoffs();

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
      pickupMode: l.pickup_mode,
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
            const currentUserId = useAuthStore.getState().userId;
            
            if (!payload.new.target_agent_id) {
              useMarketplaceStore.setState(s => ({ listings: [mapped, ...s.listings] }));
            } else if (payload.new.target_agent_id === currentUserId) {
              useMarketplaceStore.setState(s => ({ targetedDropoffs: [mapped, ...s.targetedDropoffs] }));
            }
          } else if (payload.eventType === 'UPDATE') {
            const mapped = mapListing(payload.new);
            const currentUserId = useAuthStore.getState().userId;
            
            if (!payload.new.target_agent_id) {
              useMarketplaceStore.setState(s => ({
                listings: s.listings.map(l => l.id === payload.new.id ? { ...l, ...mapped } : l)
              }));
            } else if (payload.new.target_agent_id === currentUserId) {
              useMarketplaceStore.setState(s => ({
                targetedDropoffs: s.targetedDropoffs.map(l => l.id === payload.new.id ? { ...l, ...mapped } : l)
              }));
            }
          } else if (payload.eventType === 'DELETE') {
            useMarketplaceStore.setState(s => ({
              listings: s.listings.filter(l => l.id !== payload.old.id)
            }));
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace_offers', filter: `buyer_id=eq.${useAuthStore.getState().userId}` },
        () => fetchSentOffers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchListings, fetchSentOffers, profile?.id]);

  const selectedListing = useMemo(() => {
    return listings.find(l => l.id === selectedId) || targetedDropoffs.find(l => l.id === selectedId);
  }, [listings, targetedDropoffs, selectedId]);

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

  const handleRecommendToHub = async () => {
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (offerQty <= 0 || offerQty > selectedListing.quantity) {
      toast.error('Invalid quantity');
      return;
    }

    try {
      const { error } = await supabase.from('agent_recommendations').insert({
        agent_id: profile?.id,
        hub_id: currentCompanyId,
        listing_id: selectedListing.id,
        recommended_price_per_kg: parseFloat(offerPrice),
        recommended_quantity: parseFloat(offerQty.toString())
      });
      if (error) throw error;

      setSelectedId(null);
      setOfferPrice('');
      toast.success('Recommendation Sent! 🚀', { description: 'The hub manager will review this material.' });
      fetchRecommendations();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchRecommendations = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('agent_recommendations')
        .select('listing_id')
        .eq('agent_id', profile.id);
      if (!error && data) {
        setRecommendations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getHasRecommended = getHasRecommendedMemo;
  const getHasOffer = getHasOfferMemo;

  const filteredListings = useMemo(() => {
    // If the Direct Requests tab is active, show targeted listings (both pickup & dropoff)
    if (selectedTab === 'Direct Requests') {
      let result = targetedDropoffs;
      
      if (!isFleetDriver) {
        result = result.filter(l => !getHasOffer(l.id));
      }

      if (!searchTerm) return result;
      const term = searchTerm.toLowerCase();
      return result.filter(l =>
        (l.material && l.material.toLowerCase().includes(term)) ||
        (l.location && l.location.toLowerCase().includes(term))
      );
    }

    let result = listings;

    // Filter out listings that the agent has already interacted with
    if (isFleetDriver) {
      result = result.filter(l => !getHasRecommended(l.id));
    } else {
      result = result.filter(l => !getHasOffer(l.id));
    }

    if (isFleetDriver) {
      result = result.filter(l => (l as any).pickupMode !== 'dropoff');
    }

    if (selectedTab === 'All') {
      // "All" tab shows all public marketplace listings
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
  }, [listings, targetedDropoffs, searchTerm, selectedTab, filterMaterial, filterWeight, filterPriceRange, isFleetDriver, recommendations, sentOffers]);

  return (
    <div className="-mx-1 px-1 flex flex-col bg-white dark:bg-slate-800 min-h-screen transition-colors relative overflow-x-hidden">
      {/* ── TOP NAV (Edge to Edge PWA Style) ── */}
      {!selectedId && (
        <div className="h-[calc(env(safe-area-inset-top,1rem)+9.25rem)]" />
      )}
      {!selectedId && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2.5 px-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-lg mx-auto space-y-2.5">
            {/* Header row */}
            <div className="relative flex items-center justify-between min-h-[40px]">
              <button onClick={() => navigate(-1)} className="p-2.5 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-all z-10">
                <ArrowLeft className="w-4 h-4 text-slate-800 dark:text-white" />
              </button>

              <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">Klinflow Marketplace</h1>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Explore &amp; Buy Materials</p>
              </div>

              <div className="w-9 shrink-0" />
            </div>

            {/* Compact Search Bar & Filter Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search materials or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500/40 transition-all"
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
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shrink-0 relative ${isFilterOpen || filterPriceRange !== 'All' || filterWeight !== 'All'
                  ? 'bg-emerald-950 border-emerald-950 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300'
                  }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {(filterPriceRange !== 'All' || filterWeight !== 'All') && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
                  className="overflow-hidden bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-xl"
                >
                  <div className="p-3 grid grid-cols-2 gap-2.5">
                    {/* Weight Filter */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Weight</label>
                      <div className="relative">
                        <select
                          value={filterWeight}
                          onChange={(e) => setFilterWeight(e.target.value)}
                          className="w-full py-2 pl-2.5 pr-6 text-xs font-semibold rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 appearance-none focus:outline-none focus:border-emerald-500"
                        >
                          <option value="All">All Weights</option>
                          <option value="small">&lt; 100kg</option>
                          <option value="medium">100 - 500kg</option>
                          <option value="large">&gt; 500kg</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Price Filter */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Price/kg</label>
                      <div className="relative">
                        <select
                          value={filterPriceRange}
                          onChange={(e) => setFilterPriceRange(e.target.value)}
                          className="w-full py-2 pl-2.5 pr-6 text-xs font-semibold rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 appearance-none focus:outline-none focus:border-emerald-500"
                        >
                          <option value="All">All Prices</option>
                          <option value="low">&lt; 50/kg</option>
                          <option value="medium">50 - 100/kg</option>
                          <option value="high">&gt; 100/kg</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Clear filters bar */}
                  {(filterWeight !== 'All' || filterPriceRange !== 'All') && (
                    <div className="px-3 pb-2.5 flex justify-end">
                      <button
                        onClick={() => {
                          setFilterWeight('All');
                          setFilterPriceRange('All');
                        }}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider flex items-center gap-1"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 gap-1">
              {([...(['All', 'Bulk Sells'] as const), ...(!isFleetDriver ? ['Direct Requests' as const] : [])] ).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${selectedTab === tab
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                  <span className="truncate">{tab}</span>
                  {tab === 'Direct Requests' && (() => {
                    const unbidCount = isFleetDriver
                      ? targetedDropoffs.length
                      : targetedDropoffs.filter(l => !getHasOffer(l.id)).length;
                    return unbidCount > 0 && selectedTab !== 'Direct Requests' ? (
                      <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full leading-none">{unbidCount > 9 ? '9+' : unbidCount}</span>
                    ) : null;
                  })()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 space-y-0 pb-5 ${!selectedId ? 'pt-0' : 'pt-0'} relative max-w-lg mx-auto w-full`}>

        {/* ── CONTENT AREA ── */}
        <main>
          {selectedId && selectedListing ? (
            /* ── FOCUSED SOURCING VIEW ── */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-white dark:bg-slate-900 overflow-y-auto no-scrollbar pb-8"
            >
              {/* ── FIXED TOP NAV ── */}
              <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
                <div className="max-w-lg mx-auto pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-2.5 px-3 relative flex items-center justify-between min-h-[48px]">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="p-2.5 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-all z-10"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-800 dark:text-white" />
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                    <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">Material Details</h1>
                    <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Sourcing Portal</p>
                  </div>
                  <div className="w-9 shrink-0" />
                </div>
              </div>

              <div className="max-w-lg mx-auto space-y-3 px-3 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)]">
                {/* ── IMAGE CAROUSEL ── */}
                <div className="relative h-[240px] w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800">
                  <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
                    {(selectedListing.photos?.length > 0 ? selectedListing.photos : [selectedListing.photoUrl || selectedListing.photo]).map((imgUrl, idx) => (
                      <div key={idx} className="w-full h-full shrink-0 snap-center">
                        {imgUrl ? (
                          <OptimizedImage src={getThumbnailUrl(imgUrl, { width: 800 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" alt={`${selectedListing.material} - View ${idx + 1}`} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                            <Package className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/40 pointer-events-none" />

                  {(selectedListing.photos?.length > 1) && (
                    <>
                      <div className="absolute top-3 right-3 z-10 bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-white flex items-center gap-1.5">
                        <span>{selectedListing.photos.length} Photos</span>
                      </div>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {selectedListing.photos.map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white shadow-sm opacity-60 first:opacity-100" />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* ── MATERIAL SPECIFICATIONS CARD ── */}
                <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Material</p>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white capitalize leading-tight mb-1.5">
                        {selectedListing.materialSubcategory || selectedListing.material}
                      </h2>
                      {(() => {
                        const category = selectedListing.materialCategory || (selectedListing.materialSubcategory ? selectedListing.material : null);
                        if (!category) return null;
                        const style = getCategoryStyle(category);
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}>
                            {category}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Verified</span>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200/80 dark:bg-slate-700/60" />

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex items-start gap-2.5">
                      <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Available Stock</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedListing.quantity} KG</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${(selectedListing as any).pickupMode === 'dropoff' ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                        {(selectedListing as any).pickupMode === 'dropoff' ? (
                          <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                            Seller Drop-off
                          </span>
                        ) : (
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{selectedListing.location}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <User className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{selectedListing.isBulkDrive ? 'Community Group' : 'Merchant'}</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{selectedListing.isBulkDrive ? 'Bulk Drive' : (selectedListing.sellerName || 'Verified')}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Time Posted</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {selectedListing.createdAt ? new Date(selectedListing.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ASAP'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedListing.description && (
                    <>
                      <div className="h-px bg-slate-200/80 dark:bg-slate-700/60" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" /> Seller Notes
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">"{selectedListing.description}"</p>
                      </div>
                    </>
                  )}
                  
                  {selectedListing.isBulkDrive && selectedListing.groupMetadata && (
                    <>
                      <div className="h-px bg-slate-200/80 dark:bg-slate-700/60" />
                      <div className="bg-indigo-50/80 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-200/60 dark:border-indigo-800/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <h4 className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">Community Contribution</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] font-semibold text-indigo-500/80 mb-0.5">Contributors</p>
                            <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300">{selectedListing.groupMetadata.contributorCount || 0} Members</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-indigo-500/80 mb-0.5">Top Members</p>
                            <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 leading-tight">
                              {(selectedListing.groupMetadata.topContributors || []).join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Bid / Recommendation Section */}
                <div className="bg-emerald-950 p-4 rounded-2xl border border-emerald-900/60 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                      {(isFleetDriver ? getHasRecommended(selectedListing.id) : getHasOffer(selectedListing.id)) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      ) : (
                        <MessageSquareQuote className="w-4 h-4 text-emerald-300" />
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-tight">
                      {(isFleetDriver ? getHasRecommended(selectedListing.id) : getHasOffer(selectedListing.id))
                        ? (isFleetDriver ? 'Recommendation Sent' : 'Bid Active')
                        : (isFleetDriver ? 'Recommend to Hub' : 'Place Your Offer')}
                    </h3>
                  </div>

                  {(isFleetDriver ? getHasRecommended(selectedListing.id) : getHasOffer(selectedListing.id)) ? (
                    <div className="text-center py-3 space-y-3">
                      <p className="text-xs font-medium text-emerald-100/90 leading-relaxed px-2">
                        {isFleetDriver 
                          ? "Your recommendation has been sent to the Hub. You will be dispatched to collect the material once the Hub Manager accepts it."
                          : "Your offer for this material has been sent to the merchant. You'll be notified if they accept your bid."}
                      </p>
                      <button
                        onClick={() => setSelectedId(null)}
                        className="w-full py-3 bg-white/15 hover:bg-white/20 text-white rounded-xl font-bold text-xs active:scale-95 transition-all"
                      >
                        Browse Other Materials
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Detailed Seller Asking Info */}
                      <div className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-2">
                        <p className="text-[10px] font-bold text-emerald-200/80 uppercase tracking-wider flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" /> Seller's Asking Price
                        </p>
                        
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-[10px] text-white/60 font-medium mb-0.5">Price Per KG</p>
                            <p className="text-sm font-bold text-white tabular-nums">KSh {selectedListing.pricePerKg}</p>
                          </div>
                          <div className="text-white/40 pb-0.5 font-bold text-xs">×</div>
                          <div className="text-right">
                            <p className="text-[10px] text-white/60 font-medium mb-0.5">Total Quantity</p>
                            <p className="text-sm font-bold text-white tabular-nums">{selectedListing.quantity} KG</p>
                          </div>
                        </div>
                        
                        <div className="h-px bg-white/15" />
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-white/80">Total Asking</p>
                          <p className="text-base font-extrabold text-emerald-300 tabular-nums">KSh {(selectedListing.pricePerKg * selectedListing.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-emerald-100/80 ml-0.5">{isFleetDriver ? 'Recommended Price' : 'My Price Offer'}</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={offerPrice}
                              onChange={(e) => setOfferPrice(e.target.value)}
                              className="w-full bg-white/10 border border-white/20 h-11 rounded-xl px-3 pr-10 text-sm font-bold text-white outline-none focus:border-emerald-400 transition-all placeholder:text-white/40 tabular-nums"
                              placeholder="0.00"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/50">/kg</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-emerald-100/80 ml-0.5">{isFleetDriver ? 'Recommended Weight' : 'Total Weight'}</label>
                          <div className="relative">
                            <input
                              type="number"
                              max={selectedListing.quantity}
                              value={offerQty}
                              onChange={(e) => setOfferQty(e.target.value)}
                              className="w-full bg-white/10 border border-white/20 h-11 rounded-xl px-3 pr-10 text-sm font-bold text-white outline-none focus:border-emerald-400 transition-all placeholder:text-white/40 tabular-nums"
                              placeholder="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/50">kg</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 space-y-3">
                        <div className="flex items-center justify-between px-0.5">
                          <p className="text-xs font-semibold text-white/80">{isFleetDriver ? 'Total Recommendation' : 'Total Bid Value'}</p>
                          <p className="text-base font-extrabold text-white tabular-nums">KSh {(parseFloat(offerPrice || '0') * parseFloat(offerQty?.toString() || '0')).toLocaleString()}</p>
                        </div>

                        <button
                          onClick={isFleetDriver ? handleRecommendToHub : handleMakeOffer}
                          disabled={isLoading || !offerPrice || !offerQty}
                          className="w-full py-3.5 bg-white text-emerald-950 rounded-xl font-bold text-xs shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? 'Processing...' : (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> {isFleetDriver ? 'Recommend to Hub' : 'Send Offer Now'}
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
                  className="w-full py-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs active:scale-[0.98] transition-all"
                >
                  Back to Marketplace
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2.5 pt-3 pb-5">
              {/* ── HERO BANNER ── */}
              <div className="px-1.5">
                <div className="relative w-full aspect-[3/1] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/60">
                  <img src="/vectors/banner1.webp" alt="Source and Earn" className="w-full h-full object-cover object-center" />
                </div>
              </div>

              {/* ── ACTION CARDS ── */}
              {!isFleetDriver ? (
                <div className="px-3 pb-1 grid grid-cols-2 gap-2.5">
                  {/* My Active Bids */}
                  <button
                    onClick={() => navigate('/bids')}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 flex items-center gap-3 active:scale-[0.98] transition-all group hover:border-emerald-500/40"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 text-white flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1 truncate">Bids History</h3>
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 leading-none truncate">
                        {activeBidsCount > 0 ? `${activeBidsCount} Active` : 'View offers'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
                  </button>

                  {/* Buyer Requests */}
                  <button
                    onClick={() => navigate('/rfqs')}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 flex items-center gap-3 active:scale-[0.98] transition-all group hover:border-emerald-500/40"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1 truncate">RFQ Requests</h3>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none truncate">Send requests</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
                  </button>
                </div>
              ) : (
                <div className="px-3 pb-1">
                  <button
                    onClick={() => navigate('/trades')}
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 flex items-center gap-3 active:scale-[0.98] transition-all group hover:border-emerald-500/40"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 text-white flex items-center justify-center shrink-0">
                      <History className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1 truncate">Recommendation History</h3>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none truncate">View past sourced drop-offs</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
                  </button>
                </div>
              )}

              {/* ── MATERIAL CATEGORY CHIPS ── */}
              <div className="relative pt-3 pb-2">
                <div className="flex justify-between items-center px-3 mb-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">Available Materials</p>
                  <span className="text-[11px] font-semibold text-slate-400">{filteredListings.length} listings</span>
                </div>
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 px-3 pb-1">
                  {[
                    { id: 'All', label: 'All', Icon: Recycle },
                    { id: 'Plastic', label: 'Plastic', Icon: Droplets },
                    { id: 'Metal', label: 'Metal', Icon: Cog },
                    { id: 'Paper', label: 'Paper', Icon: ScrollText },
                    { id: 'Glass', label: 'Glass', Icon: Wine }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setFilterMaterial(cat.id);
                        setIsMoreCategoriesOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                        filterMaterial === cat.id
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      <cat.Icon className={`w-3.5 h-3.5 ${filterMaterial === cat.id ? 'text-current' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{cat.label}</span>
                    </button>
                  ))}
                  
                  {/* More Dropdown Button */}
                  <div className="relative">
                    <button
                      onClick={() => setIsMoreCategoriesOpen(!isMoreCategoriesOpen)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                        ['Organic', 'E-waste', 'Textile'].includes(filterMaterial) || isMoreCategoriesOpen
                          ? 'bg-emerald-950 text-white border-emerald-950'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      <span>{['Organic', 'E-waste', 'Textile'].includes(filterMaterial) ? filterMaterial : 'More'}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${isMoreCategoriesOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isMoreCategoriesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-3 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-700 z-50 overflow-hidden"
                    >
                      {[
                        { id: 'Organic', label: 'Organic', Icon: Apple },
                        { id: 'E-waste', label: 'E-waste', Icon: Cpu },
                        { id: 'Textile', label: 'Textile', Icon: Shirt }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setFilterMaterial(cat.id);
                            setIsMoreCategoriesOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold transition-colors ${
                            filterMaterial === cat.id
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <cat.Icon className={`w-3.5 h-3.5 ${filterMaterial === cat.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── LISTINGS ── */}
              {filteredListings.length === 0 ? (
                <div className="mx-3 mt-1 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/60 py-14 px-6 text-center">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                    <TrendingUp className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No materials found nearby</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                    Try adjusting your category or search filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 px-1.5">
                  {filteredListings.map((listing) => {
                    const estValue = Number(listing.quantity || 0) * Number(listing.pricePerKg || 0);
                    const category = listing.materialCategory || (listing.materialSubcategory ? listing.material : null);
                    const catStyle = category ? getCategoryStyle(category) : null;
                    const hasInteracted = isFleetDriver ? getHasRecommended(listing.id) : getHasOffer(listing.id);

                    return (
                      <div
                        key={listing.id}
                        onClick={() => setSelectedId(listing.id)}
                        className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-3.5 cursor-pointer select-none hover:border-emerald-500/40 active:scale-[0.99] transition-all space-y-1.5 group"
                      >
                        {/* Top Row: Thumbnail, Material + Badges + Meta, Price */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                              {(listing.photoUrl || listing.photo) ? (
                                <OptimizedImage src={getThumbnailUrl(listing.photoUrl || listing.photo, { width: 150 })} alt={listing.material} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-[14px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                  {listing.materialSubcategory || listing.material}
                                </h3>
                                {category && catStyle && (
                                  <span className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold whitespace-nowrap ${catStyle.bg} ${catStyle.text} ${catStyle.darkBg} ${catStyle.darkText}`}>
                                    {category}
                                  </span>
                                )}
                                {listing.isBulkDrive && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center gap-0.5 shrink-0">
                                    <Users className="w-2.5 h-2.5" /> Bulk
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate">
                                  {(listing as any).pickupMode === 'dropoff' ? 'Seller Drop-off' : (listing.location || 'Nairobi')}
                                </span>
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                  <Scale className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  {listing.quantity} KG
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                  {listing.createdAt ? new Date(listing.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ASAP'}
                                </span>
                                {selectedTab === 'Direct Requests' && (
                                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                    (listing as any).pickupMode === 'dropoff'
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                      : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                                  }`}>
                                    {(listing as any).pickupMode === 'dropoff' ? 'Direct Drop-off' : 'Direct Pickup'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 mt-2">
                            <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 leading-none tabular-nums">
                              KSh {listing.pricePerKg}<span className="text-[10px] font-semibold text-slate-400">/kg</span>
                            </p>
                            {hasInteracted && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 text-[9px] font-bold rounded-md">
                                {isFleetDriver ? 'Recommended' : 'Active Bid'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer Row */}
                        <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Est. Value: <span className="font-bold text-slate-800 dark:text-white tabular-nums">KSh {estValue.toLocaleString()}</span>
                          </span>

                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            {isFleetDriver ? 'Review' : 'Place Bid'} <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

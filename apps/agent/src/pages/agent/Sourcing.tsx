/**
 * Sourcing Page — Agent's marketplace portal for buying recyclable materials
 */
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Scale, TrendingUp,
  ChevronRight, MessageSquareQuote, Check,
  ArrowLeft, Clock, Package, CheckCircle2, Info, User, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { toast } from 'sonner';
import { Virtuoso } from 'react-virtuoso';

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

    if (!searchTerm) return result;
    const term = searchTerm.toLowerCase();
    return result.filter(l =>
      (l.material && l.material.toLowerCase().includes(term)) ||
      (l.location && l.location.toLowerCase().includes(term))
    );
  }, [listings, searchTerm, selectedTab]);

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


            {/* Compact Search Bar */}
            <div className="mt-2">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search materials or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                />
              </div>
            </div>

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
              className="fixed inset-0 z-[9999] bg-[#F2F3F4] dark:bg-slate-800 overflow-y-auto no-scrollbar pb-6"
            >
              {/* Edge-to-Edge Hero Image */}
              <div className="w-full aspect-[4/5] sm:aspect-square bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full w-full">
                  {(selectedListing.photos?.length > 0 ? selectedListing.photos : [selectedListing.photoUrl || selectedListing.photo]).map((imgUrl, idx) => (
                    <div key={idx} className="flex-none w-full h-full snap-start">
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

                {/* Overlaid Back Button - Now with Notch Support */}
                <button
                  onClick={() => setSelectedId(null)}
                  style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
                  className="absolute left-6 z-20 p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-all shadow-xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>




                {/* Photo Indicators */}
                {(selectedListing.photos?.length > 1) && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {selectedListing.photos.map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-white shadow-lg opacity-50 first:opacity-100" />
                    ))}
                  </div>
                )}

              </div>

              {/* Content Sheet (Overlaps Image) */}
              <div className="relative -mt-[104px] bg-[#F2F3F4] dark:bg-slate-800 rounded-t-[1rem] px-3 pt-2 pb-2 space-y-4 shadow-[0_-20px_40px_rgba(0,0,0,0.15)]">

                {/* Unified Material, Merchant & Location Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                    <Package className="w-3.5 h-3.5 text-indigo-500 mb-2" />
                    <p className="text-[8px] font-bold text-slate-400 capitalize tracking-widest leading-none mb-1">Material</p>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{selectedListing.material}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                    <User className="w-3.5 h-3.5 text-emerald-500 mb-2" />
                    <p className="text-[8px] font-bold text-slate-400 capitalize tracking-widest leading-none mb-1">{selectedListing.isBulkDrive ? 'Community Group' : 'Merchant'}</p>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{selectedListing.isBulkDrive ? 'Bulk Drive' : (selectedListing.sellerName || 'Verified')}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 mb-2" />
                    <p className="text-[8px] font-bold text-slate-400 capitalize tracking-widest leading-none mb-1">Location</p>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{selectedListing.location}</p>
                  </div>
                </div>

                {/* Bulk Drive Community Details */}
                {selectedListing.isBulkDrive && selectedListing.groupMetadata && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 ">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Community Contribution</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-400/80 capitalize tracking-widest mb-1">Contributors</p>
                        <p className="text-sm font-black text-indigo-700 dark:text-indigo-300">{selectedListing.groupMetadata.contributorCount || 0} Members</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-indigo-400/80 capitalize tracking-widest mb-1">Top Members</p>
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 leading-tight">
                          {(selectedListing.groupMetadata.topContributors || []).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Merchant Stats Quick Card */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-0.5">Verification</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white capitalize tracking-tight">Grade {selectedListing.grade || 'A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-0.5">Time Posted</p>
                    <p className="text-xs font-black text-emerald-600 italic">{selectedListing.createdAt ? new Date(selectedListing.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ASAP'}</p>
                  </div>
                </div>

                {/* Unified Listing Stats Card */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-0.5">Merchant's Asking Price</p>
                      <p className="text-base font-black text-slate-900 dark:text-white">
                        KSh {(selectedListing.pricePerKg * selectedListing.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-700" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                        <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-0.5">Available Stock</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white capitalize tracking-tight">{selectedListing.quantity} KG</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Merchant Notes Section */}
                {selectedListing.description && (
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h4 className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-2 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5" /> Merchant Notes
                    </h4>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{selectedListing.description}"
                    </p>
                  </div>
                )}

                {/* Premium Bid Section */}
                <div className={`${getHasOffer(selectedListing.id) ? 'bg-indigo-600 dark:bg-indigo-500/10' : 'bg-emerald-600 dark:bg-emerald-500/10'} p-6 rounded-[1rem] border border-white/10  space-y-6 transition-colors duration-500`}>
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
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-white/60 capitalize tracking-widest ml-1">My Price Offer</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={offerPrice}
                              onChange={(e) => setOfferPrice(e.target.value)}
                              className="w-full bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700 h-12 rounded-xl px-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-white/30 transition-all placeholder:text-white/40"
                              placeholder="0.00"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/50">/KG</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-white/60 capitalize tracking-widest ml-1">Total Weight</label>
                          <div className="relative">
                            <input
                              type="number"
                              max={selectedListing.quantity}
                              value={offerQty}
                              onChange={(e) => setOfferQty(e.target.value)}
                              className="w-full bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700 h-12 rounded-xl px-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-white/30 transition-all placeholder:text-white/40"
                              placeholder="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/50">KG</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between mb-4 px-1">
                          <p className="text-[10px] font-bold text-white/60 capitalize tracking-widest">Total Bid Value</p>
                          <p className="text-base font-black text-white tracking-tighter">KSh {(parseFloat(offerPrice || 0) * parseFloat(offerQty || 0)).toLocaleString()}</p>
                        </div>

                        <button
                          onClick={handleMakeOffer}
                          disabled={isLoading || !offerPrice || !offerQty}
                          className="w-full py-4 bg-white text-emerald-600 dark:bg-emerald-500 dark:text-white rounded-2xl font-black text-xs capitalize tracking-[0.2em] shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
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
                  className="w-full py-4 bg-gray-800 dark:bg-slate-800 text-white dark:text-slate-400 rounded-[1rem] font-black text-xs capitalize tracking-[0.2em] active:scale-95 transition-all"
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
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h3 className="text-[11px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight">{listing.material}</h3>
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

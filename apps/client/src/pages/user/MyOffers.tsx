/**
 * MyOffers.jsx — Seller's negotiation dashboard for marketplace bids
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MessageSquareQuote, Check, X,
  TrendingUp, Scale, Clock, ShieldCheck,
  AlertCircle, Handshake, Sparkles,Coins, Filter, ChevronDown,
  Package, MapPin, Tag, User, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { Booking, MarketplaceOffer } from '@klinflow/core/validation';
import { toast } from 'sonner';

export default function MyOffers() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const {
    receivedOffers,
    fetchIncomingOffers,
    acceptOffer,
    declineOffer,
    subscribeToReceivedOffers,
    isLoading
  } = useMarketplaceStore();

  const {
    bookings,
    fetchBookings,
    cancelBooking
  } = useBookingStore();

  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  useEffect(() => {
    fetchIncomingOffers();
    fetchBookings();
    const channel = subscribeToReceivedOffers(profile?.id || '');
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [fetchIncomingOffers, fetchBookings, profile?.id, subscribeToReceivedOffers]);

  const handleAccept = async (offer: MarketplaceOffer) => {
    try {
      await acceptOffer(offer);
      toast.success('Offer accepted! Trade initiated.');
      setSelectedOfferId(null);
    } catch (err) {
      toast.error('Failed to accept offer');
    }
  };

  const handleDecline = async (offerId: string) => {
    if (!window.confirm('Decline this offer?')) return;
    try {
      await declineOffer(offerId);
      setSelectedOfferId(null);
      toast.info('Offer declined');
    } catch (err) {
      toast.error('Failed to decline offer');
    }
  };

  const handleAcceptCounterOffer = async (b: Booking) => {
    try {
      const { error } = await supabase.rpc('complete_booking_trade_payout', {
        p_booking_id: b.id,
        p_actual_weight: b.actualWeightKg || b.bags || 0,
        p_payout_amount: b.counterOfferAmount || 0
      });
      if (error) throw error;
      toast.success('Counter-Offer Accepted', { description: 'Funds have been transferred to your wallet.' });
      fetchBookings();
      setActiveTab('accepted');
    } catch (error) {
      toast.error('Failed to accept offer', { description: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  };

  const handleRejectCounterOffer = async (b: Booking) => {
    cancelBooking(b.id);
    toast.info('Trade Cancelled', { description: 'The counter-offer was rejected.' });
    fetchBookings();
  };

  // ── AUTO-CLEANUP LEGACY STUCK OFFERS ──
  useEffect(() => {
    const cleanupStuckOffers = async () => {
      if (!receivedOffers?.length || !bookings?.length) return;

      const stuck = receivedOffers.filter(o => {
        if (o.status !== 'accepted') return false;
        // Find a booking that matches this trade and is already completed
        return bookings.some(b =>
          b.status === 'completed' &&
          (b.wasteType === o.material || b.wasteType === o.material) &&
          b.agentId === o.buyerId &&
          new Date(b.createdAt || Date.now()) >= new Date(o.createdAt || Date.now())
        );
      });

      if (stuck.length > 0) {
        console.log(`[MyOffers] Healing ${stuck.length} stuck trades...`);
        for (const offer of stuck) {
          await supabase
            .from('marketplace_offers')
            .update({ status: 'completed' })
            .eq('id', offer.id);
        }
        fetchIncomingOffers(); // Refresh once done
      }
    };

    cleanupStuckOffers();
  }, [receivedOffers, bookings, fetchIncomingOffers]);

  const pendingOffers = (receivedOffers || []).filter(o => o.status === 'pending');

  // Smart filter: even if DB hasn't healed yet, hide from In-Progress if booking is done
  const inProgressOffers = (receivedOffers || []).filter(o => {
    if (o.status !== 'accepted') return false;
    const hasCompletedBooking = bookings?.some(b =>
      b.status === 'completed' &&
      (b.wasteType === o.material || b.wasteType === o.material) &&
      b.agentId === o.buyerId &&
      new Date(b.createdAt || Date.now()) >= new Date(o.createdAt || Date.now())
    );
    return !hasCompletedBooking;
  });

  // Smart filter: show in Confirmed if DB is completed OR if healing is pending
  const completedOffers = (receivedOffers || []).filter(o => {
    if (o.status === 'completed' || o.status === 'paid') return true;
    if (o.status !== 'accepted') return false;
    const hasCompletedBooking = bookings?.some(b =>
      b.status === 'completed' &&
      (b.wasteType === o.material || b.wasteType === o.material) &&
      b.agentId === o.buyerId &&
      new Date(b.createdAt || Date.now()) >= new Date(o.createdAt || Date.now())
    );
    return hasCompletedBooking;
  });

  const counterOffers = (bookings || []).filter((b: Booking) => b.counterOfferStatus === 'pending');

  const selectedOffer = receivedOffers?.find((o: MarketplaceOffer) => o.id === selectedOfferId);

  return (
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV (Edge to Edge PWA Style) ── */}
      {!selectedOfferId && (
        <div className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1rem)]  px-4 border-b border-slate-200 dark:border-slate-800  z-50 transition-colors">
          <div className="max-w-lg mx-auto space-y-2.5">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate(-1)} className="w-8 h-8 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </button>

              <div className="text-center">
                <h1 className="text-base font-bold text-slate-900 dark:text-white capitalize tracking-widest leading-none">MarketPlace Offers</h1>
                <p className="text-[9px] font-bold text-slate-500 capitalize tracking-[0.2em] mt-0.5">View offers Received from buyers</p>
              </div>

              <div className="w-8" /> {/* Spacer */}
            </div>

            {/* Integrated Tab Nav */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl">
              {[
                { id: 'pending', label: 'Bids', count: pendingOffers.length },
                { id: 'progress', label: 'On-going', count: inProgressOffers.length },
                { id: 'counter', label: 'Counters', count: counterOffers.length },
                { id: 'accepted', label: 'Confirmed', count: completedOffers.length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-1.5 text-[10px] font-bold capitalize tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === tab.id
                    ? 'bg-primary dark:bg-primary shadow-sm text-white dark:text-white font-black'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                  <span className="truncate">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-1 py-0.2 text-[8px] font-bold rounded ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-blue-300 dark:bg-blue-600 text-white dark:text-white'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 space-y-0 pb-24 ${!selectedOfferId ? 'pt-[calc(env(safe-area-inset-top,1rem)+4.25rem)]' : 'pt-0'} relative max-w-lg mx-auto w-full`}>
        {/* ── CONTENT AREA ── */}
        <div className={`pt-1 ${selectedOfferId ? "animate-fade-in" : ""}`}>
          <AnimatePresence mode="wait">
            {selectedOfferId && selectedOffer ? (
              /* ── FOCUSED OFFER DETAIL (Immersive Kilimall Style) ── */
              <motion.div
                key="offer-focus"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed top-0 left-0 right-0 bottom-[64px] z-[50] bg-slate-50 dark:bg-slate-800 flex flex-col"
              >
                {/* ── FIXED TOP NAV ── */}
                <div className="fixed top-0 left-0 right-0 z-[51] max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
                  <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
                    <button onClick={() => setSelectedOfferId(null)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
                      <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                    </button>
                    <div>
                      <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Offer Details</h1>
                      <p className="text-[10px] font-bold text-primary capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Incoming Bid
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)] pb-14">
                  {/* ── IMAGE CAROUSEL ── */}
                  <div className="relative h-[270px] w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-900">
                    {selectedOffer.photo ? (
                      <OptimizedImage src={getThumbnailUrl(selectedOffer.photo, { width: 800 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <Package className="w-12 h-12 mb-2 opacity-50" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">No photo provided</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />
                  </div>

                  {/* Title & Info */}
                  <div className="space-y-4">
                    {/* ── SPECIFICATIONS CARD ── */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material Type</p>
                          <h2 className="text-[16px] font-bold text-indigo-700 dark:text-white capitalize leading-tight">
                            {selectedOffer.material}
                          </h2>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-200 dark:border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">Pending</span>
                        </div>
                      </div>

                      <hr className="border-slate-100 dark:border-slate-800/60" />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <User className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Agent Name</p>
                            <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{selectedOffer.buyerName}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Coins className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Agent Bid</p>
                            <p className="text-xs font-black text-emerald-600 leading-none">KSh {selectedOffer.offeredPrice}/kg</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Requested Volume</p>
                            <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{selectedOffer.quantity} KG</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pickup Location</p>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate max-w-[120px]">{selectedOffer.listing?.location || 'Nairobi Hub'}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Time Sent</p>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{selectedOffer.createdAt ? new Date(selectedOffer.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expected Value Card (Dynamic Branding) */}
                  <div className="bg-emerald-600 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20  flex flex-col justify-center text-center">
                    <p className="text-[10px] font-bold text-emerald-100 dark:text-emerald-400/60 capitalize tracking-widest mb-1">Expected Value</p>
                    <p className="text-xl font-black text-white dark:text-emerald-400 leading-none">
                      KSh {(parseFloat(selectedOffer.listing?.pricePerKg || 0) * parseFloat(selectedOffer.listing?.quantity || 0)).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-200 dark:text-emerald-500/60 font-bold capitalize mt-1.5">
                      {selectedOffer.listing?.pricePerKg} × {selectedOffer.listing?.quantity}kg Total Stock
                    </p>
                  </div>

                  {/* Listing Details */}
                  <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-3">Bid Comparison</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Your Asking Price</span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">KSh {selectedOffer.listing?.pricePerKg || 'N/A'}/kg</span>
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-slate-700" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Buyer's Bid</span>
                        <span className="text-xs font-semibold text-emerald-600">KSh {selectedOffer.offeredPrice}/kg</span>
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-slate-700" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Difference</span>
                        {(() => {
                          const diff = (selectedOffer.offeredPrice || 0) - (selectedOffer.listing?.pricePerKg || 0);
                          return (
                            <span className={`text-xs font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {diff >= 0 ? '+' : ''}{diff.toFixed(2)}/kg
                            </span>
                          );
                        })()}
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-slate-700" />
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 dark:text-white capitalize tracking-widest">Your Pay</span>
                          <span className="text-[10px] font-semibold text-slate-400">KSh {selectedOffer.offeredPrice} × {selectedOffer.quantity}kg</span>
                        </div>
                        <span className="text-sm font-black text-emerald-600">KSh {(selectedOffer.offeredPrice * selectedOffer.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleDecline(selectedOffer.id)}
                      className="flex-1 py-4 bg-white dark:bg-slate-800 text-rose-500 border border-rose-100 dark:border-rose-900/30 rounded-2xl font-semibold text-xs capitalize tracking-widest shadow-sm active:scale-[0.97] transition-all"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(selectedOffer)}
                      className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-semibold text-xs capitalize tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Accept Offer
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'pending' ? (
              <motion.div key="pending-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {pendingOffers.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <MessageSquareQuote className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">No active bids yet</p>
                  </div>
                ) : (
                  pendingOffers.map((offer) => (
                    <motion.div
                      key={offer.id}
                      onClick={() => setSelectedOfferId(offer.id)}
                      className="bg-white dark:bg-slate-900/60 py-3 px-3.5 shadow-sm border-b border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800">
                          {offer.photo ? (
                            <OptimizedImage src={getThumbnailUrl(offer.photo, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          {/* Row 1: Material & Price */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h3 className="text-[11px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight">{offer.material}</h3>
                              <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 flex items-center gap-0.5 shrink-0">
                                BID
                              </span>
                            </div>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tighter shrink-0 ml-2">KSh {offer.offeredPrice}/kg</span>
                          </div>

                          {/* Row 2: Location/Buyer */}
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]">
                              <User className="w-2.5 h-2.5 text-slate-400" /> {offer.buyerName || 'Buyer'}
                            </p>
                          </div>

                          {/* Row 3: Timestamp & Quantity */}
                          <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-50 dark:border-slate-800/50">
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                              <Clock className="w-2.5 h-2.5 text-slate-400" /> {offer.createdAt ? new Date(offer.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </p>
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0">
                              <span className="text-[9px] text-slate-400 not-italic font-bold mr-1 opacity-70">Quantity:</span>
                              <Scale className="w-2.5 h-2.5" /> {offer.quantity}                             </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-center text-slate-300">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : activeTab === 'progress' ? (
              <motion.div key="progress-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {inProgressOffers.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Clock className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">No trades in progress</p>
                  </div>
                ) : (
                  inProgressOffers.map((offer) => {
                    const isExpanded = expandedTradeId === offer.id;
                    return (
                      <div key={offer.id} className="bg-white dark:bg-slate-900/60 transition-all border-b border-slate-100 dark:border-slate-700 relative overflow-hidden">
                        {/* Orange indicator line */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />

                        {/* Compact Row */}
                        <button
                          onClick={() => setExpandedTradeId(isExpanded ? null : offer.id)}
                          className="w-full py-3 px-3.5 pl-4 flex gap-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors text-left"
                        >
                          <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800">
                            {offer.photo ? (
                              <OptimizedImage src={getThumbnailUrl(offer.photo, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-200" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            {/* Row 1: Material & Status */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h3 className="text-[11px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight">{offer.material}</h3>
                                <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 flex items-center gap-0.5 shrink-0">
                                  AWAITING PICKUP
                                </span>
                              </div>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tighter shrink-0 ml-2">KSh {offer.offeredPrice}/kg</span>
                            </div>

                            {/* Row 2: Location/Buyer */}
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]">
                                <User className="w-2.5 h-2.5 text-slate-400" /> {offer.buyerName || 'Agent'}
                              </p>
                            </div>

                            {/* Row 3: Timestamp & Quantity */}
                            <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-50 dark:border-slate-800/50">
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                                <Clock className="w-2.5 h-2.5 text-slate-400" /> {offer.createdAt ? new Date(offer.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                              </p>
                              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0">
                                <span className="text-[9px] text-slate-400 not-italic font-bold mr-1 opacity-70">Qty:</span>
                                <Scale className="w-2.5 h-2.5" /> {offer.quantity} KG
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center text-slate-300">
                            <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        {/* Expanded View */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-5 pb-5 pt-0 overflow-hidden"
                            >
                              <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50 space-y-4">
                                {/* ── SPECIFICATIONS CARD ── */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4 shadow-sm">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                      <Coins className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Locked Price</p>
                                        <p className="text-xs font-black text-emerald-600 leading-none">KSh {offer.offeredPrice}/kg</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Contract Quantity</p>
                                        <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{offer.quantity} KG</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-emerald-600 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 shadow-xl shadow-emerald-500/10 flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] font-bold text-emerald-100 dark:text-emerald-400/60 capitalize tracking-widest mb-1">Expected Payout</p>
                                    <p className="text-lg font-black text-white dark:text-emerald-400 leading-none">
                                      KSh {(offer.offeredPrice * offer.quantity).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="w-12 h-12 bg-white/20 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-white dark:text-emerald-400" />
                                  </div>
                                </div>

                                <p className="text-[10px] font-medium text-slate-400 italic text-center px-4">
                                  Agent is currently dispatched. Funds will be released to your wallet upon weight verification.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </motion.div>
            ) : activeTab === 'counter' ? (
              <motion.div key="counter-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {counterOffers.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">No active counters</p>
                  </div>
                ) : (
                  counterOffers.map((b) => {
                    const isExpanded = expandedTradeId === b.id;
                    return (
                      <div key={b.id} className="bg-white dark:bg-slate-900/60 transition-all border-b border-slate-100 dark:border-slate-700 relative overflow-hidden">
                        {/* Amber indicator line */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />

                        {/* Compact Row */}
                        <button
                          onClick={() => setExpandedTradeId(isExpanded ? null : b.id)}
                          className="w-full py-3 px-3.5 pl-4 flex gap-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors text-left"
                        >
                          <div className="w-16 h-16 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-2xl shrink-0 border border-amber-100 dark:border-amber-500/20">
                            <AlertCircle className="w-6 h-6 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            {/* Row 1: Material & Status */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h3 className="text-[11px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight">{b.wasteType || 'Materials'}</h3>
                                <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 flex items-center gap-0.5 shrink-0">
                                  PRICE REVISED
                                </span>
                              </div>
                              <span className="text-sm font-black text-amber-600 tracking-tighter shrink-0 ml-2">KSh {((b as any).counterOfferAmount || 0).toLocaleString()}</span>
                            </div>

                            {/* Row 2: Location/Buyer */}
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]">
                                <User className="w-2.5 h-2.5 text-slate-400" /> {(b as any).buyerName || 'Agent'}
                              </p>
                            </div>

                            {/* Row 3: Timestamp & Quantity */}
                            <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-50 dark:border-slate-800/50">
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                                <Clock className="w-2.5 h-2.5 text-slate-400" /> {b.createdAt ? new Date(b.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                              </p>
                              <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 flex items-center gap-1 capitalize shrink-0">
                                <span className="text-[9px] text-slate-400 not-italic font-bold mr-1 opacity-70">Old:</span>
                                <span className="line-through">KSh {(b.totalPrice || 0).toLocaleString()}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center text-slate-300">
                            <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        {/* Expanded View */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-5 pb-5 pt-0 overflow-hidden"
                            >
                              <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50 space-y-4">
                                <div className="bg-amber-500/5 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                                  <div className="flex justify-between items-center mb-3">
                                    <p className="text-[10px] font-black text-amber-600 capitalize tracking-widest">Revision Details</p>
                                    <p className="text-[10px] font-black text-slate-400 capitalize tracking-widest">Agent: {(b as any).buyerName || 'Agent'}</p>
                                  </div>
                                  <div className="flex justify-between items-end">
                                    <div>
                                      <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest mb-0.5">Original Payout</p>
                                      <p className="text-xs font-bold text-slate-500 line-through">KSh {(b.totalPrice || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] font-semibold text-amber-600 capitalize tracking-widest mb-0.5">Counter-Offer</p>
                                      <p className="text-xl font-black text-amber-600 leading-none">KSh {((b as any).counterOfferAmount || 0).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRejectCounterOffer(b)}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-xs capitalize tracking-widest rounded-2xl active:scale-95 transition-all"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleAcceptCounterOffer(b)}
                                    className="flex-[2] py-4 bg-amber-500 text-white font-semibold text-xs capitalize tracking-widest rounded-2xl shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
                                  >
                                    Accept & Release
                                  </button>
                                </div>

                                <p className="text-xs font-medium text-slate-400 italic text-center px-4">
                                  Accepting this revision will finalize the trade at the new price.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </motion.div>
            ) : (
              <motion.div key="accepted-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {completedOffers.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">No completed trades</p>
                  </div>
                ) : (
                  completedOffers.map((offer) => {
                    const isExpanded = expandedTradeId === offer.id;
                    return (
                      <div key={offer.id} className="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-800 -mx-1 transition-all relative overflow-hidden">
                        {/* Green indicator line */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />

                        {/* Compact Row */}
                        <button
                          onClick={() => setExpandedTradeId(isExpanded ? null : offer.id)}
                          className="w-full p-4 pl-5 flex items-center gap-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-2xl shrink-0 border border-emerald-100 dark:border-emerald-500/20">
                            ♻️
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate capitalize tracking-tight">{offer.material}</h4>
                              <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2 py-0.5 rounded capitalize">Settled</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold capitalize tracking-widest truncate">Agent: {offer.buyerName}</p>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Expanded View */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-5 pb-5 pt-0 overflow-hidden"
                            >
                              <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50 space-y-4">
                                {/* ── SPECIFICATIONS CARD ── */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4 shadow-sm">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                      <Coins className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Final Price</p>
                                        <p className="text-xs font-black text-emerald-600 leading-none">KSh {offer.offeredPrice}/kg</p>
                                      </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                      <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Material Volume</p>
                                        <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{offer.quantity} KG</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-emerald-600 p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-600/20">
                                  <div>
                                    <p className="text-[10px] font-semibold text-white/70 capitalize tracking-widest mb-0.5">Total Payout</p>
                                    <p className="text-base font-bold text-white leading-none">KSh {(offer.offeredPrice * offer.quantity).toLocaleString()}</p>
                                  </div>
                                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Check className="w-5 h-5 text-white" />
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl justify-center">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span className="capitalize tracking-widest">Verified & Transferred to Wallet</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

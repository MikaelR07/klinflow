/**
 * MyOffers.jsx — Seller's negotiation dashboard for marketplace bids
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MessageSquareQuote, Check, X, 
  TrendingUp, Scale, Clock, ShieldCheck,
  AlertCircle, Handshake, Sparkles, Filter, ChevronDown,
  Package, MapPin, Tag, User, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceStore, useAuthStore, useBookingStore, supabase, getThumbnailUrl } from '@cleanflow/core';
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
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [expandedTradeId, setExpandedTradeId] = useState(null);

  useEffect(() => {
    fetchIncomingOffers();
    fetchBookings();
    const channel = subscribeToReceivedOffers(profile?.id);
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [fetchIncomingOffers, fetchBookings, profile?.id, subscribeToReceivedOffers]);

  const handleAccept = async (offer) => {
    try {
      await acceptOffer(offer);
      toast.success('Offer accepted! Trade initiated.');
      setSelectedOfferId(null);
    } catch (err) {
      toast.error('Failed to accept offer');
    }
  };

  const handleDecline = async (offerId) => {
    if (!window.confirm('Decline this offer?')) return;
    try {
      await declineOffer(offerId);
      setSelectedOfferId(null);
      toast.info('Offer declined');
    } catch (err) {
      toast.error('Failed to decline offer');
    }
  };

  const handleAcceptCounterOffer = async (b) => {
    try {
      const { error } = await supabase.rpc('complete_booking_trade_payout', {
        p_booking_id: b.id,
        p_actual_weight: b.bags || b.weight_kg || b.quantity || 0,
        p_payout_amount: b.counter_offer_amount
      });
      if (error) throw error;
      toast.success('Counter-Offer Accepted', { description: 'Funds have been transferred to your wallet.' });
      fetchBookings();
      setActiveTab('accepted');
    } catch (error) {
      toast.error('Failed to accept offer', { description: error.message });
    }
  };

  const handleRejectCounterOffer = async (b) => {
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
          (b.waste_type === o.material || b.wasteType === o.material) &&
          b.agent_id === o.buyer_id &&
          new Date(b.created_at) >= new Date(o.createdAt || o.created_at)
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
      (b.waste_type === o.material || b.wasteType === o.material) &&
      b.agent_id === o.buyer_id &&
      new Date(b.created_at) >= new Date(o.createdAt || o.created_at)
    );
    return !hasCompletedBooking;
  });

  // Smart filter: show in Confirmed if DB is completed OR if healing is pending
  const completedOffers = (receivedOffers || []).filter(o => {
    if (o.status === 'completed' || o.status === 'paid') return true;
    if (o.status !== 'accepted') return false;
    const hasCompletedBooking = bookings?.some(b => 
      b.status === 'completed' && 
      (b.waste_type === o.material || b.wasteType === o.material) &&
      b.agent_id === o.buyer_id &&
      new Date(b.created_at) >= new Date(o.createdAt || o.created_at)
    );
    return hasCompletedBooking;
  });

  const counterOffers = (bookings || []).filter(b => b.status === 'counter_offer_pending');

  const selectedOffer = receivedOffers?.find(o => o.id === selectedOfferId);

  return (
    <div className="relative px-4">
      
      {/* ── DASHBOARD AREA ── */}
      {!selectedOfferId && (
        <div className="pt-0 pb-2">
          <div className="bg-white dark:bg-slate-800 px-5 py-2.5 border border-slate-100 dark:border-slate-700 mb-4 relative overflow-hidden rounded-2xl">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold text-slate-500 dark:text-white/60 uppercase tracking-widest truncate">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Potential Earnings
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tighter leading-tight">
                  KSh {pendingOffers.reduce((sum, o) => sum + (o.offered_price * o.quantity), 0).toLocaleString()}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4 px-2">
            {[
              { id: 'pending', label: 'Bids', count: pendingOffers.length },
              { id: 'progress', label: 'On-going', count: inProgressOffers.length },
              { id: 'counter', label: 'Counters', count: counterOffers.length },
              { id: 'accepted', label: 'Confirmed', count: completedOffers.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTENT AREA ── */}
      <div className={selectedOfferId ? "animate-fade-in" : ""}>
        <AnimatePresence mode="wait">
          {selectedOfferId && selectedOffer ? (
            /* ── FOCUSED OFFER DETAIL (Immersive Kilimall Style) ── */
            <motion.div 
              key="offer-focus"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 left-0 right-0 bottom-[64px] z-[50] bg-[#F2F3F4] dark:bg-slate-900 overflow-y-auto no-scrollbar pb-10"
            >
              {/* Edge-to-Edge Hero Image */}
              <div className="w-full aspect-[4/5] sm:aspect-square bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                {selectedOffer.photo ? (
                  <img src={getThumbnailUrl(selectedOffer.photo, { width: 800 })} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <Package className="w-20 h-20 text-slate-200 dark:text-slate-700" />
                  </div>
                )}

                {/* Floating Back Button - Now with Notch Support */}
                <button 
                  onClick={() => setSelectedOfferId(null)}
                  style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
                  className="absolute left-6 z-20 p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white active:scale-95 transition-all shadow-xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>


              {/* Content Sheet */}
              <div className="bg-[#F2F3F4] dark:bg-slate-900 px-4 pt-10 pb-10 space-y-6 rounded-t-3xl -mt-32 relative z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                
                {/* Title & Info */}
                <div className="space-y-4">
                  {/* Unified Material & Asking Price Card */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material Type</p>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{selectedOffer.material}</h2>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">{selectedOffer.listing?.location || 'Nairobi Hub'}</span>
                      </div>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-slate-700" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Your Asking Price</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">KSh {selectedOffer.listing?.price_per_kg || 'N/A'}<span className="text-[10px] font-bold text-slate-400 ml-1">/KG</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Unified Offer Details Card */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Agent Name</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">{selectedOffer.buyerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/60 uppercase tracking-widest mb-0.5">Agent Bid</p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">
                          KSh {selectedOffer.offered_price} <span className="text-[10px] font-bold opacity-70">/KG</span>
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
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Requested Weight</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">{selectedOffer.quantity} KG</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Available Stock</p>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{selectedOffer.listing?.quantity || 0} KG</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expected Value Card (Dynamic Branding) */}
                <div className="bg-emerald-600 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 shadow-xl shadow-emerald-500/10 flex flex-col justify-center text-center">
                  <p className="text-[10px] font-bold text-emerald-100 dark:text-emerald-400/60 uppercase tracking-widest mb-1">Expected Value</p>
                  <p className="text-xl font-black text-white dark:text-emerald-400 leading-none">
                    KSh {(parseFloat(selectedOffer.listing?.price_per_kg || 0) * parseFloat(selectedOffer.listing?.quantity || 0)).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-200 dark:text-emerald-500/60 font-bold uppercase mt-1.5">
                    {selectedOffer.listing?.price_per_kg} × {selectedOffer.listing?.quantity}kg Total Stock
                  </p>
                </div>

                {/* Listing Details */}
                <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Bid Comparison</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Your Asking Price</span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">KSh {selectedOffer.listing?.price_per_kg || 'N/A'}/kg</span>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-slate-700" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Buyer's Bid</span>
                      <span className="text-xs font-semibold text-emerald-600">KSh {selectedOffer.offered_price}/kg</span>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-slate-700" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Difference</span>
                      {(() => {
                        const diff = (selectedOffer.offered_price || 0) - (selectedOffer.listing?.price_per_kg || 0);
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
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Your Pay</span>
                        <span className="text-[10px] font-semibold text-slate-400">KSh {selectedOffer.offered_price || selectedOffer.price} × {selectedOffer.quantity}kg</span>
                      </div>
                      <span className="text-sm font-black text-emerald-600">KSh {(parseFloat(selectedOffer.offered_price || selectedOffer.price || 0) * parseFloat(selectedOffer.quantity || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => handleDecline(selectedOffer.id)}
                    className="flex-1 py-4 bg-white dark:bg-slate-800 text-rose-500 border border-rose-100 dark:border-rose-900/30 rounded-2xl font-semibold text-xs uppercase tracking-widest shadow-sm active:scale-[0.97] transition-all"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={() => handleAccept(selectedOffer)}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
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
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">No active bids yet</p>
                </div>
              ) : (
                pendingOffers.map((offer) => (
                  <motion.div 
                    key={offer.id}
                    onClick={() => setSelectedOfferId(offer.id)}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                        {offer.photo ? (
                          <img src={getThumbnailUrl(offer.photo, { width: 200 })} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{offer.emoji || '♻️'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Incoming Bid</span>
                          <span className="text-[10px] font-semibold text-slate-900 dark:text-white">KSh {offer.offered_price}/kg</span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase truncate tracking-tight">{offer.material}</h4>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest truncate mt-1">From: {offer.buyerName}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-200" />
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
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">No trades in progress</p>
                </div>
              ) : (
                inProgressOffers.map((offer) => {
                  const isExpanded = expandedTradeId === offer.id;
                  return (
                    <div key={offer.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all relative overflow-hidden">
                      {/* Orange indicator line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                      
                      {/* Compact Row */}
                      <button 
                        onClick={() => setExpandedTradeId(isExpanded ? null : offer.id)}
                        className="w-full p-4 pl-5 flex items-center gap-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0 border border-slate-100 dark:border-slate-800">
                          {offer.emoji || '♻️'}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate uppercase tracking-tight">{offer.material}</h4>
                            <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                              <Clock className="w-2 h-2" /> Awaiting Pickup
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest truncate">Agent: {offer.buyerName}</p>
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
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Contract Quantity</p>
                                  <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Scale className="w-3 h-3" /> {offer.quantity} KG
                                  </p>
                                </div>
                                <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-1">Locked Price</p>
                                  <p className="text-[10px] font-bold text-emerald-600">KSh {offer.offered_price}/kg</p>
                                </div>
                              </div>
                              
                              <div className="bg-emerald-600 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 shadow-xl shadow-emerald-500/10 flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] font-bold text-emerald-100 dark:text-emerald-400/60 uppercase tracking-widest mb-1">Expected Payout</p>
                                  <p className="text-lg font-black text-white dark:text-emerald-400 leading-none">
                                    KSh {(offer.offered_price * offer.quantity).toLocaleString()}
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
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">No active counters</p>
                </div>
              ) : (
                counterOffers.map((b) => {
                  const isExpanded = expandedTradeId === b.id;
                  return (
                    <div key={b.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all relative overflow-hidden">
                      {/* Amber indicator line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                      
                      {/* Compact Row */}
                      <button 
                        onClick={() => setExpandedTradeId(isExpanded ? null : b.id)}
                        className="w-full p-4 pl-5 flex items-center gap-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-2xl shrink-0 border border-amber-100 dark:border-amber-500/20">
                          <AlertCircle className="w-6 h-6 text-amber-500" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate uppercase tracking-tight">{b.waste_type || 'Materials'}</h4>
                            <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                              Price Revised
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest truncate">New Offer: KSh {(b.counter_offer_amount || 0).toLocaleString()}</p>
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
                              <div className="bg-amber-500/5 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                                <div className="flex justify-between items-center mb-3">
                                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Revision Details</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent: {b.buyerName}</p>
                                </div>
                                <div className="flex justify-between items-end">
                                  <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Original Payout</p>
                                    <p className="text-xs font-bold text-slate-500 line-through">KSh {(b.total_price || 0).toLocaleString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mb-0.5">Counter-Offer</p>
                                    <p className="text-xl font-black text-amber-600 leading-none">KSh {(b.counter_offer_amount || 0).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleRejectCounterOffer(b)} 
                                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                                >
                                  Reject
                                </button>
                                <button 
                                  onClick={() => handleAcceptCounterOffer(b)} 
                                  className="flex-[2] py-4 bg-amber-500 text-white font-semibold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
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
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">No completed trades</p>
                </div>
              ) : (
                completedOffers.map((offer) => {
                  const isExpanded = expandedTradeId === offer.id;
                  return (
                    <div key={offer.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all relative overflow-hidden">
                      {/* Green indicator line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />

                      {/* Compact Row */}
                      <button 
                        onClick={() => setExpandedTradeId(isExpanded ? null : offer.id)}
                        className="w-full p-4 pl-5 flex items-center gap-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-2xl shrink-0 border border-emerald-100 dark:border-emerald-500/20">
                          {offer.emoji || '♻️'}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate uppercase tracking-tight">{offer.material}</h4>
                            <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2 py-0.5 rounded uppercase">Settled</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest truncate">Agent: {offer.buyerName}</p>
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
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Material Volume</p>
                                  <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Scale className="w-3 h-3" /> {offer.quantity} KG
                                  </p>
                                </div>
                                <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-1">Final Price</p>
                                  <p className="text-[10px] font-bold text-emerald-600">KSh {offer.offered_price}/kg</p>
                                </div>
                              </div>
                              
                              <div className="bg-emerald-600 p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-600/20">
                                <div>
                                  <p className="text-[10px] font-semibold text-white/70 uppercase tracking-widest mb-0.5">Total Payout</p>
                                  <p className="text-base font-bold text-white leading-none">KSh {(offer.offered_price * offer.quantity).toLocaleString()}</p>
                                </div>
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                  <Check className="w-5 h-5 text-white" />
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl justify-center">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="uppercase tracking-widest">Verified & Transferred to Wallet</span>
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
  );
}

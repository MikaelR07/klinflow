/**
 * My Trades Page — list of user's waste trades with marketplace status
 */
import { useState, useEffect } from 'react';
import { 
  Package, Clock, CheckCircle2, Truck, Star, XCircle, 
  CalendarClock, Zap, HandCoins, Home, ArrowRight, Store, 
  Info, ShieldCheck, MapPin, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore, WASTE_TYPES, supabase } from '@cleanflow/core';
import { EmptyState, AssetJourney, AssetBadge } from '@cleanflow/ui';
import { toast } from 'sonner';

const statusConfig = {
  'completed': { label: 'Settled', color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400', icon: CheckCircle2 },
  'in-progress': { label: 'In Transit', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', icon: Truck },
  'pending': { label: 'Waiting Approval', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400', icon: Clock },
  'confirmed': { label: 'Trade Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: HandCoins },
  'scheduled': { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', icon: Clock },
  'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', icon: XCircle },
  'counter_offer_pending': { label: 'Action Required', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', icon: Zap },
};

const TABS = ['Active', 'Settled', 'Cancelled'];

const TradeCounter = ({ count, active }) => (
  <span className={`ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full transition-all ${
    active 
      ? 'bg-emerald-600 text-white scale-110 shadow-sm shadow-emerald-500/30' 
      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
  }`}>
    {count}
  </span>
);

const MATERIAL_LABELS = {
  'plastic': 'Plastic Bottles',
  'paper': 'Paper & Card',
  'metal': 'Scrap Metal',
  'glass': 'Glass Containers',
  'organic': 'Organic Waste',
  'ewaste': 'Electronic Waste',
  'e-waste': 'Electronic Waste',
  'electronic': 'Electronic Waste',
  'recyclable': 'Mixed Recyclables',
  'general': 'General Stock',
  'bulky': 'Bulky Items',
  'appliances': 'Large Appliances'
};

const formatMaterial = (val) => {
  if (!val) return 'Premium Load';
  const slug = val.toLowerCase();
  if (MATERIAL_LABELS[slug]) return MATERIAL_LABELS[slug];
  
  // Smart ID Detection: Only flag long hexadecimal strings (UUIDs)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val) || 
                 (/^[0-9a-f]{15,}$/i.test(val) && !val.includes(' '));
  
  if (isUUID) {
    return 'Recyclable Load';
  }
  
  // Clean up hyphens and capitalize
  return val.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const TIME_SLOTS = [
  { id: 'morning', label: '09:00 AM', value: '09:00 AM' },
  { id: 'noon', label: '12:00 PM', value: '12:00 PM' },
  { id: 'afternoon', label: '04:00 PM', value: '04:00 PM' },
];

const to12h = (time24) => {
  if (!time24 || typeof time24 !== 'string' || !time24.includes(':')) return time24;
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

const to24h = (time12) => {
  if (!time12 || typeof time12 !== 'string') return '';
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return '';
  let h = parseInt(match[1]);
  const m = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m}`;
};

export default function MyTrades() {
  const navigate = useNavigate();
  const { bookings, fetchBookings, cancelBooking, clearBookingHistory, rescheduleBooking } = useBookingStore();
  const [activeTab, setActiveTab] = useState('Active');
  const [expandedId, setExpandedId] = useState(null);
  const [reschedulingTrade, setReschedulingTrade] = useState(null);
  const [newDate, setNewDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [newTime, setNewTime] = useState('09:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'Active') return b.status === 'pending' || b.status === 'confirmed' || b.status === 'scheduled' || b.status === 'in-progress' || b.status === 'counter_offer_pending';
    if (activeTab === 'Settled') return b.status === 'completed';
    if (activeTab === 'Cancelled') return b.status === 'cancelled';
    return true;
  });

  const handleCancel = (id) => {
    cancelBooking(id);
    setActiveTab('Cancelled');
    toast.success('Trade Cancelled', { 
      description: `Trade ${id} has been moved to history.` 
    });
  };

  const handleRescheduleSubmit = async () => {
    if (!reschedulingTrade) return;
    setIsSubmitting(true);
    try {
      const result = await rescheduleBooking(reschedulingTrade.id, newDate, newTime, {
        wasteType: reschedulingTrade.waste_type,
        weight: reschedulingTrade.actual_weight_kg || reschedulingTrade.bags,
        estate: reschedulingTrade.estate,
        latitude: reschedulingTrade.latitude,
        longitude: reschedulingTrade.longitude,
        notes: reschedulingTrade.notes,
        agentId: reschedulingTrade.agent_id,
        photoUrl: reschedulingTrade.photo_url
      });
      
      if (result.success) {
        toast.success('Trade Rescheduled! 📅', { 
          description: `Your pickup is now set for ${newDate} at ${newTime}.` 
        });
        setReschedulingTrade(null);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      toast.error('Reschedule failed', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearHistory = async (type) => {
    try {
      await clearBookingHistory(type);
      const label = type === 'completed' ? 'Settled' : 'Cancelled';
      toast.success(`${label} History Cleared ✨`, { 
        description: 'Past trades have been archived.' 
      });
    } catch (err) {
      toast.error('Clear failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-center px-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight text-center">Trade History</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        {TABS.map(tab => {
          const tabCount = bookings.filter(b => {
             if (tab === 'Active') return b.status === 'pending' || b.status === 'confirmed' || b.status === 'scheduled' || b.status === 'in-progress' || b.status === 'counter_offer_pending';
             if (tab === 'Settled') return b.status === 'completed';
             if (tab === 'Cancelled') return b.status === 'cancelled';
             return false;
          }).length;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[11px] font-semibold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center ${
                activeTab === tab 
                  ? 'bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {tab}
              <TradeCounter count={tabCount} active={activeTab === tab} />
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="pt-10">
              <EmptyState 
                icon={Store} 
                title={`No ${activeTab.toLowerCase()} trades`} 
                subtitle={
                  activeTab === 'Settled' ? "No settled trades in your ledger yet." : 
                  activeTab === 'Active' ? "You have no active recyclable postings." :
                  "Your cancelled history will appear here."
                } 
              />
          </div>
        ) : (
          <div className="space-y-3">
            {(activeTab === 'Cancelled' || activeTab === 'Settled') && (
              <div className="flex justify-end mb-2 px-1">
                <button 
                  onClick={() => handleClearHistory(activeTab === 'Settled' ? 'completed' : 'cancelled')}
                  className="text-xs font-semibold text-rose-600 uppercase tracking-widest hover:underline px-4 py-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center gap-2 border border-rose-100 dark:border-rose-900/30"
                >
                  Clear History
                </button>
              </div>
            )}
            
            {filteredBookings.map((b) => {
              const materialVal = b.waste_type || b.wasteType;
              const waste = WASTE_TYPES?.find?.((w) => w.slug === materialVal || w.id === materialVal);
              const bType = b.booking_type || b.bookingType || '';
              const isPickup = bType === 'pickup' || bType === 'marketplace_pickup' || b.logisticsMode === 'pickup';
              const isExpanded = expandedId === b.id;

              // Context-aware status: marketplace trades that are 'pending' mean the agent hasn't picked up yet
              let status = statusConfig[b.status] || statusConfig['pending'];
              if (b.is_market_trade && b.status === 'pending') {
                status = { label: 'Awaiting Pickup', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', icon: Truck };
              }

              return (
                <div key={b.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all">
                  
                  {/* ── COMPACT ROW (Always Visible) ── */}
                  <button 
                    onClick={() => setExpandedId(isExpanded ? null : b.id)}
                    className="w-full p-4 flex items-center gap-3 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 border border-slate-100 dark:border-slate-700">
                      {waste?.icon || '♻️'}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-slate-900 dark:text-white leading-none uppercase tracking-tight truncate">
                          {waste?.label || formatMaterial(materialVal)}
                        </h3>
                        <div className={`px-1.5 py-0.5 rounded-full text-[7px] font-semibold uppercase tracking-widest shrink-0 ${status.color}`}>
                          {status.label}
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                        {b.actual_weight_kg || b.actualWeightKg || b.bags || b.weightKg || b.quantity || 0}kg
                      </p>
                    </div>
                    <div className="text-right shrink-0 mr-1">
                      {b.status === 'counter_offer_pending' ? (
                        <>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest line-through">
                            KSh {(b.total_price || b.totalPrice || b.amount || 0).toLocaleString()}
                          </p>
                          <p className="text-sm font-semibold text-amber-500 tracking-tighter leading-none font-mono mt-0.5 animate-pulse">
                            KSh {(b.counter_offer_amount || 0).toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-emerald-600 tracking-tighter leading-none font-mono">
                          KSh {(b.total_price || b.totalPrice || b.amount || 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* ── EXPANDED DETAILS (Dropdown) ── */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                      {/* Logistics & ID */}
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700">
                            {isPickup ? <Truck className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Logistics</p>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">{isPickup ? 'Agent Dispatch' : 'Self Drop-off'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Listing ID</p>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">CF-{b.id?.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex items-center justify-between py-2 px-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Schedule</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{b.time_slot || b.time || 'ASAP'}</span>
                      </div>

                      {/* Action Hub */}
                      {activeTab === 'Active' && b.status === 'counter_offer_pending' ? (
                        <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 mb-2 mt-1">
                          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3 text-center">Open your Offers page to review the Agent's adjusted price proposal.</p>
                        </div>
                      ) : activeTab === 'Active' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setReschedulingTrade(b);
                              setNewDate(b.preferred_date || new Date().toLocaleDateString('en-CA'));
                              // If it's a non-numeric time string like 'Any Time' or 'ASAP', clear it to show placeholder
                              const currentTime = b.time_slot || '';
                              const isValidTime = /^([01]\d|2[0-3]):?([0-5]\d)$/.test(currentTime);
                              setNewTime(isValidTime ? currentTime : '');
                            }}
                            className="h-10 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-900 dark:text-white text-xs font-semibold uppercase tracking-widest transition-all active:scale-95 border border-slate-100 dark:border-slate-700"
                          >
                            <CalendarClock className="w-3.5 h-3.5 text-indigo-500" /> Reschedule
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCancel(b.id); }}
                            className="h-10 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl flex items-center justify-center gap-2 text-rose-600 text-xs font-semibold uppercase tracking-widest transition-all active:scale-95 border border-rose-100 dark:border-rose-900/10"
                          >
                             <XCircle className="w-3.5 h-3.5" /> Cancel
                           </button>
                        </div>
                      )}

                      {activeTab === 'Settled' && (
                        <div className="flex items-center justify-between pt-1">
                           <div className="flex items-center gap-2 text-emerald-500">
                              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/10" />
                              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Asset Settled</span>
                           </div>
                           <button className="text-xs font-semibold text-indigo-600 uppercase tracking-widest underline underline-offset-4">View Receipt</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RESCHEDULE MODAL ── */}
      <AnimatePresence>
        {reschedulingTrade && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setReschedulingTrade(null)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] rounded-b-2xl p-8 pb-10 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6" />
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                    <CalendarClock className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Reschedule Trade</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">CF-{reschedulingTrade.id?.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Quick Select Slot</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => setNewTime(slot.value)}
                          className={`py-3 px-1 rounded-xl text-[11px] font-bold uppercase tracking-tight transition-all border ${
                            newTime === slot.value
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Date</label>
                      <input 
                        type="text" 
                        value={newDate} 
                        placeholder="YYYY-MM-DD"
                        onFocus={(e) => (e.target.type = 'date')}
                        onBlur={(e) => !e.target.value && (e.target.type = 'text')}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-semibold dark:text-white outline-none border border-slate-100 dark:border-slate-700" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Custom Time</label>
                      <input 
                        type="text" 
                        value={newTime} 
                        placeholder="02:30 PM"
                        onFocus={(e) => {
                          const val24 = to24h(newTime);
                          e.target.type = 'time';
                          if (val24) e.target.value = val24;
                        }}
                        onBlur={(e) => {
                          const val12 = to12h(e.target.value);
                          e.target.type = 'text';
                          if (val12) setNewTime(val12);
                        }}
                        onChange={(e) => {
                          if (e.target.type === 'time') {
                             setNewTime(to12h(e.target.value));
                          } else {
                             setNewTime(e.target.value);
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-semibold dark:text-white outline-none border border-slate-100 dark:border-slate-700" 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex gap-3">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-amber-800/70 dark:text-amber-400 leading-relaxed">
                    Rescheduling will reset the trade status to **Pending Approval** so the agent can confirm they are available for the new slot.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setReschedulingTrade(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isSubmitting}
                    onClick={handleRescheduleSubmit}
                    className="flex-[2] py-4 bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Confirm New Time'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

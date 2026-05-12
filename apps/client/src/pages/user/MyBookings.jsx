/**
 * My Bookings Page — list of user's bookings with status badges
 */
import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, Truck, Star, XCircle, CalendarClock, Zap, ChevronDown, ArrowLeft, Info, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore, useServiceStore } from '@cleanflow/core';

import EmptyState from '@cleanflow/ui/components/EmptyState';
import { AssetJourney, AssetBadge } from '@cleanflow/ui';
import { toast } from 'sonner';

const statusConfig = {
  'completed': { label: 'completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  'in-progress': { label: 'in-progress', color: 'bg-blue-100 text-blue-700', icon: Truck },
  'pending': { label: 'pending', color: 'bg-orange-100 text-orange-700', icon: Clock },
  'confirmed': { label: 'confirmed', color: 'bg-blue-100 text-blue-700', icon: Clock },
  'scheduled': { label: 'scheduled', color: 'bg-orange-100 text-orange-700', icon: Clock },
  'cancelled': { label: 'cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

function BookingAmountDisplay({ b }) {
  if (b.status !== 'completed') {
    const fee = b.fee || 0;
    return (
      <span className={`text-lg font-semibold font-mono ${fee > 0 ? 'text-primary dark:text-primary-light' : 'text-slate-400 text-xs uppercase tracking-widest'}`}>
        {fee > 0 ? `KSh ${fee.toLocaleString()}` : 'Est. at Pickup'}
      </span>
    );
  }

  const paid = b.totalPrice || b.fee || 0;
  const earned = b.clientCashback || 0;
  const agentPaidClient = paid === 0; // Agent bought recyclables from client

  return (
    <div className="flex flex-col items-end gap-1">
      {!agentPaidClient && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-widest">You Paid</span>
          <span className="text-base font-semibold text-rose-600 dark:text-rose-400 font-mono">KSh {paid.toLocaleString()}</span>
        </div>
      )}
      {earned > 0 ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">
            {agentPaidClient ? 'Agent Paid You' : 'You Earned'}
          </span>
          <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400 font-mono">KSh {earned.toLocaleString()}</span>
        </div>
      ) : null}
    </div>
  );
}


const TABS = ['Upcoming', 'Completed', 'Cancelled'];


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

const BookingCounter = ({ count, active }) => (
  <span className={`ml-1.5 px-1.5 py-0.5 text-xs font-semibold rounded-full transition-all ${
    active 
      ? 'bg-primary text-white scale-110 shadow-sm shadow-primary/30' 
      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
  }`}>
    {count}
  </span>
);

export default function MyBookings() {
  const navigate = useNavigate();
  const { bookings, fetchBookings, cancelBooking, rescheduleBooking, clearBookingHistory } = useBookingStore();
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [expandedId, setExpandedId] = useState(null);
  
  // Reschedule Modal State
  const [reschedulingBooking, setReschedulingBooking] = useState(null);
  const [newDate, setNewDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [newTime, setNewTime] = useState('09:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { categories, fetchCategories } = useServiceStore();

  useEffect(() => {
    fetchBookings();
    fetchCategories();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'Upcoming') return b.status === 'pending' || b.status === 'confirmed' || b.status === 'scheduled' || b.status === 'in-progress';
    if (activeTab === 'Completed') return b.status === 'completed';
    if (activeTab === 'Cancelled') return b.status === 'cancelled';
    return true;
  });

  const handleCancel = (id) => {
    cancelBooking(id);
    setActiveTab('Cancelled');
    toast.success('Booking Cancelled', { 
      description: `Pickup ${id} has been moved to history.` 
    });
  };

  const handleReschedule = (b) => {
    setReschedulingBooking(b);
    setNewDate(b.date || new Date().toLocaleDateString('en-CA'));
    setNewTime(b.time || '09:00 AM');
  };

  const handleRescheduleSubmit = async () => {
    if (!reschedulingBooking) return;
    setIsSubmitting(true);
    try {
      const result = await rescheduleBooking(reschedulingBooking.id, newDate, newTime, {
        wasteType: reschedulingBooking.wasteType || reschedulingBooking.waste_type,
        estate: reschedulingBooking.estate,
        notes: reschedulingBooking.notes,
        phone: reschedulingBooking.phone
      });
      
      if (result.success) {
        toast.success('Pickup Rescheduled!', { 
          description: `Your pickup is now set for ${newDate} at ${newTime}.` 
        });
        setReschedulingBooking(null);
        fetchBookings(); // Refresh list
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
      const label = type === 'completed' ? 'Completed' : 'Cancelled';
      toast.success(`${label} History Cleared`, { 
        description: 'Past reports have been hidden from your view.' 
      });
    } catch (err) {
      toast.error('Clear failed');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F8FF] dark:bg-slate-900 transition-colors">
      {/* ── TOP NAV (Edge to Edge PWA Style) ── */}
      <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-white dark:bg-slate-900 pt-[calc(env(safe-area-inset-top,1.5rem)+0.75rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[100]">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-11 h-11 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tighter leading-none">My Bookings</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Pickup History</p>
          </div>
          
          <div className="w-11" /> {/* Spacer */}
        </div>
      </div>

      <div className="flex-1 space-y-2 pb-24 pt-0 relative max-w-lg mx-auto w-full">
        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 border-b border-slate-200 dark:border-slate-800">
          {TABS.map(tab => {
            const tabCount = bookings.filter(b => {
               if (tab === 'Upcoming') return b.status === 'pending' || b.status === 'confirmed' || b.status === 'scheduled' || b.status === 'in-progress';
               if (tab === 'Completed') return b.status === 'completed';
               if (tab === 'Cancelled') return b.status === 'cancelled';
               return false;
            }).length;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-primary dark:text-primary-light' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {tab}
                <BookingCounter count={tabCount} active={activeTab === tab} />
              </button>
            );
          })}
        </div>

      {filteredBookings.length === 0 ? (
        <EmptyState 
          icon={Package} 
          title={`No ${activeTab.toLowerCase()} bookings`} 
          subtitle={
            activeTab === 'Upcoming' ? "Book your first pickup to get started!" : 
            activeTab === 'Completed' ? "No completed bookings made yet." : 
            "Your cancelled history will appear here."
          } 
        />
      ) : (
        <div className="space-y-1">
          {(activeTab === 'Cancelled' || activeTab === 'Completed') && (
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => handleClearHistory(activeTab.toLowerCase())}
                className="text-xs font-bold text-rose-600 hover:underline px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg flex items-center gap-2"
              >
                clear
              </button>
            </div>
          )}
          {filteredBookings.map((b) => {
            const wasteTypeVal = b.wasteType || b.waste_type;
            const waste = categories.find((w) => w.slug === wasteTypeVal) || 
                          categories.find((w) => w.id === wasteTypeVal);
            const status = statusConfig[b.status];
            // Use completion date for completed bookings, otherwise the scheduled date
            const displayDate = b.status === 'completed' && b.createdAt
              ? new Date(b.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
              : b.date;
            const isExpanded = expandedId === b.id;
            return (
              <div 
                key={b.id} 
                className="card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden"
              >
                {/* Clickable Header */}
                <div 
                  className="p-4 cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-inner border border-slate-100 dark:border-slate-700 shrink-0">
                        {waste?.icon || '📦'}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          material-type:<span className="text-slate-900 dark:text-white">{waste?.label || wasteTypeVal}</span>
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          ID: <span className="text-primary font-mono">{b.id.slice(0, 8).toUpperCase()}</span>
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" /> {b.estate}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-lg ${status.color}`}>
                        {status.label}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Collapsible Detail Section */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-4 border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30 animate-in fade-in slide-in-from-top-1 duration-300">
                    {/* Primary Mission Info */}
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/50">
                       <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Scheduled Time</p>
                          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{b.time_slot || 'ASAP'}</p>
                       </div>
                       <div className="space-y-1 text-right">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Est. Weight</p>
                          <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{b.weight || b.bags || 0}kg</p>
                       </div>
                    </div>

                    <div className="py-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payout Value</p>
                       {b.status === 'completed' ? (
                          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                             KSh {(b.total_price || 0).toLocaleString()}
                          </p>
                       ) : b.status === 'cancelled' ? (
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">cancelled</p>
                       ) : (
                          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest italic flex items-center gap-1.5">
                             <Zap className="w-3 h-3 fill-emerald-500" /> awaiting verification
                          </p>
                       )}
                    </div>
                    
                    <div className="flex flex-col gap-3 py-4">
                      {b.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">M-Pesa Number</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                            {b.phone}
                          </span>
                        </div>
                      )}
                      
                      {b.agentName && (
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assigned Collector</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{b.agentName}</span>
                            {b.agentRating && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-400/10 rounded-md">
                                <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-[10px] text-yellow-600 dark:text-yellow-500">{b.agentRating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {b.status === 'completed' && (b.weaverId || b.assetId) && (
                      <div className="mt-2 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                        <AssetJourney currentStatus={b.weaverId ? 'matched' : 'completed'} />
                      </div>
                    )}

                    {activeTab === 'Upcoming' && (
                      <div className="flex gap-3 mt-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCancel(b.id); }}
                          className="flex-1 py-3 text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleReschedule(b); }}
                          className="flex-1 py-3 text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <CalendarClock className="w-3.5 h-3.5" /> Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* ── RESCHEDULE MODAL ── */}
      <AnimatePresence>
        {reschedulingBooking && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setReschedulingBooking(null)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-0 shadow-2xl overflow-hidden"
            >
              <div className="pt-3 pb-2">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
              </div>
              
              <div className="p-6 pt-2 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center">
                    <CalendarClock className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Reschedule Pickup</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">ID: {reschedulingBooking.id?.slice(0, 8).toUpperCase()}</p>
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
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
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

                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20 flex gap-3">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-blue-800/70 dark:text-blue-400 leading-relaxed">
                    Rescheduling will update your pickup time instantly. Ensure someone is available at the new slot.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setReschedulingBooking(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isSubmitting}
                    onClick={handleRescheduleSubmit}
                    className="flex-[2] py-4 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
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
  </div>
  );
}

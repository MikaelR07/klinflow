/**
 * My Bookings Page — list of user's bookings with status badges
 */
import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, Truck, Star, XCircle, CalendarClock, Zap, ChevronDown, ArrowLeft, Info, MapPin, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import AssetJourney from '@klinflow/ui/components/AssetJourney';
import { toast } from 'sonner';

const statusConfig = {
  'completed': { label: 'completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  'in-progress': { label: 'in-progress', color: 'bg-blue-100 text-blue-700', icon: Truck },
  'pending': { label: 'pending', color: 'bg-orange-100 text-orange-700', icon: Clock },
  'confirmed': { label: 'confirmed', color: 'bg-blue-100 text-blue-700', icon: Clock },
  'scheduled': { label: 'scheduled', color: 'bg-orange-100 text-orange-700', icon: Clock },
  'cancelled': { label: 'cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

function BookingAmountDisplay({ b }: { b: any }) {
  if (b.status !== 'completed') {
    const fee = b.fee || 0;
    return (
      <span className={`text-lg font-semibold font-mono ${fee > 0 ? 'text-primary dark:text-primary-light' : 'text-slate-400 text-xs capitalize tracking-widest'}`}>
        {fee > 0 ? `KSh ${fee.toLocaleString()}` : 'Est. at Pickup'}
      </span>
    );
  }

  const paid = b.totalPrice || b.fee || 0;
  const earned = b.client_cashback || 0;
  const agentPaidClient = paid === 0; // Agent bought recyclables from client

  return (
    <div className="flex flex-col items-end gap-1">
      {!agentPaidClient && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-rose-500 capitalize tracking-widest">You Paid</span>
          <span className="text-base font-semibold text-rose-600 dark:text-rose-400 font-mono">KSh {paid.toLocaleString()}</span>
        </div>
      )}
      {earned > 0 ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-emerald-500 capitalize tracking-widest">
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

const to12h = (time24: string) => {
  if (!time24 || typeof time24 !== 'string' || !time24.includes(':')) return time24;
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours || '0');
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

const to24h = (time12: string) => {
  if (!time12 || typeof time12 !== 'string') return '';
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return '';
  let h = parseInt(match[1] || '0');
  const m = match[2];
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m}`;
};

const BookingCounter = ({ count, active }: { count: number, active: boolean }) => (
  <span className={`ml-1.5 px-1.5 py-0.5 text-xs font-semibold rounded-full transition-all ${active
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
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Reschedule Modal State
  const [reschedulingBooking, setReschedulingBooking] = useState<any>(null);
  const [newDate, setNewDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [newTime, setNewTime] = useState('09:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { categories, fetchCategories } = useServiceStore();

  useEffect(() => {
    fetchBookings();
    fetchCategories();
  }, []);

  const { profile } = useAuthStore();

  const filteredBookings = bookings.filter((b: any) => {
    // Robust date parsing — use latest of createdAt or updatedAt to ensure 
    // recently status-changed items show up even after a clear.
    const rawDate = b.updatedAt || b.updated_at || b.createdAt || b.created_at || b.date;
    const bookingTime = rawDate ? new Date(rawDate).getTime() : 0;

    if (activeTab === 'Upcoming') {
      return ['pending', 'confirmed', 'scheduled', 'in-progress', 'assigned', 'arrived', 'picked_up'].includes(b.status);
    }

    // Privacy Clearing Logic (Timestamp Approach)
    const clearedAtStr = activeTab === 'Completed' ? profile?.completedClearedAt : profile?.cancelledClearedAt;
    let clearedAt = 0;
    if (clearedAtStr) {
      const parsed = new Date(clearedAtStr).getTime();
      if (!isNaN(parsed)) clearedAt = parsed;
    }

    if (b.hiddenForClient) return false;

    if (activeTab === 'Completed') {
      return b.status === 'completed' && bookingTime > clearedAt;
    }

    if (activeTab === 'Cancelled') {
      return b.status === 'cancelled' && bookingTime > clearedAt;
    }

    return true;
  });

  const handleCancel = (id: string) => {
    cancelBooking(id);
    setActiveTab('Cancelled');
    toast.success('Booking Cancelled', {
      description: `Pickup ${id} has been moved to history.`
    });
  };

  const handleReschedule = (b: any) => {
    setReschedulingBooking(b);
    setNewDate(b.date || new Date().toLocaleDateString('en-CA'));
    setNewTime(b.time || '09:00 AM');
  };

  const handleRescheduleSubmit = async () => {
    if (!reschedulingBooking) return;
    setIsSubmitting(true);
    try {
      const result = await rescheduleBooking(reschedulingBooking.id, newDate, newTime, {
        wasteType: reschedulingBooking.wasteType,
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
    } catch (err: any) {
      toast.error('Reschedule failed', { description: err?.message || String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearHistory = async (type: string) => {
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
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-900/50 ">
        <div className="w-full mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl active:scale-90 transition-all">
              <ArrowLeft className="w-4 h-4 dark:text-white" />
            </button>

            <div className="text-center">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none">My Bookings</h1>
              <p className="text-[10px] font-bold text-slate-500 capitalize tracking-[0.2em] mt-1">Pickup History</p>
            </div>

            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100/85 dark:bg-slate-800/85 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            {TABS.map(tab => {
              const tabCount = bookings.filter((b: any) => {
                const rawDate = b.updatedAt || b.updated_at || b.createdAt || b.created_at || b.date;
                const bookingTime = rawDate ? new Date(rawDate).getTime() : 0;

                if (tab === 'Upcoming') {
                  return ['pending', 'confirmed', 'scheduled', 'in-progress', 'assigned', 'arrived', 'picked_up'].includes(b.status);
                }

                const clearedAtStr = tab === 'Completed' ? profile?.completedClearedAt : profile?.cancelledClearedAt;
                let clearedAt = 0;
                if (clearedAtStr) {
                  const parsed = new Date(clearedAtStr).getTime();
                  if (!isNaN(parsed)) clearedAt = parsed;
                }

                if (b.hiddenForClient) return false;

                if (tab === 'Completed') return b.status === 'completed' && bookingTime > clearedAt;
                if (tab === 'Cancelled') return b.status === 'cancelled' && bookingTime > clearedAt;
                return false;
              }).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-[10px] font-bold capitalize tracking-widest rounded-lg transition-all flex items-center justify-center ${activeTab === tab
                    ? 'bg-primary dark:bg-primary text-white dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                >
                  {tab}
                  <BookingCounter count={tabCount} active={activeTab === tab} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 pb-24 pt-[calc(env(safe-area-inset-top,1rem)+6rem)] px-0 relative max-w-lg mx-auto w-full space-y-4">

        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{`No ${activeTab.toLowerCase()} bookings`}</p>
            <p className="text-xs font-medium text-slate-400">
              {activeTab === 'Upcoming' ? "Book your first pickup to get started!" :
                activeTab === 'Completed' ? "No completed bookings made yet." :
                  "Your cancelled history will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {(activeTab === 'Cancelled' || activeTab === 'Completed') && (
              <div className="flex justify-end mb-2 px-4">
                <button
                  onClick={() => handleClearHistory(activeTab.toLowerCase())}
                  className="text-xs font-bold text-rose-600 hover:underline px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg flex items-center gap-2"
                >
                  clear
                </button>
              </div>
            )}
            {filteredBookings.map((b: any) => {
              const wasteTypeVal = b.wasteType;
              const waste = categories.find((w: any) => w.slug === wasteTypeVal) ||
                categories.find((w: any) => w.id === wasteTypeVal);
              const status = (statusConfig as any)[b.status] || statusConfig.pending;
              const displayDate = b.status === 'completed'
                ? new Date((b as any).createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
                : b.date;

              return (
                <div
                  key={b.id}
                  className="w-full bg-white dark:bg-slate-900/50 rounded-none border-y border-x-0 border-slate-100 dark:border-slate-800/80 hover:shadow-lg transition-all overflow-hidden"
                >
                  {/* Clickable Header */}
                  <div
                    className="p-4 cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                    onClick={() => setSelectedBooking(b)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-inner border border-slate-100 dark:border-slate-700 shrink-0 overflow-hidden">
                          {b.photoUrl ? (
                            <OptimizedImage src={getThumbnailUrl(b.photoUrl, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                          ) : (
                            waste?.icon || '📦'
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">
                            material-type:<span className="text-slate-900 dark:text-white">{waste?.label || wasteTypeVal}</span>
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">
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
                        <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RESCHEDULE MODAL ── */}
      <AnimatePresence>
        {reschedulingBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarClock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize tracking-tighter">Reschedule</h3>
                <p className="text-xs font-medium text-slate-500">Pick a new pickup slot</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 capitalize tracking-widest px-1">New Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 capitalize tracking-widest px-1">New Time</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => setNewTime(slot.value)}
                        className={`py-3 rounded-xl text-[10px] font-black capitalize transition-all ${newTime === slot.value
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                          }`}
                      >
                        {slot.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setReschedulingBooking(null)}
                  className="flex-1 py-4 text-slate-400 font-bold text-[10px] capitalize tracking-widest active:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleRescheduleSubmit}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] capitalize tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? '...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FULL DETAIL VIEW OVERLAY ── */}
      <AnimatePresence>
        {selectedBooking && (() => {
          const b = selectedBooking;
          const wasteTypeVal = String(b.wasteType || '');
          const waste = categories.find((w: any) => w.slug === wasteTypeVal) ||
            categories.find((w: any) => w.id === wasteTypeVal);
          const status = (statusConfig as any)[b.status] || { label: String(b.status || ''), color: 'bg-slate-100 text-slate-600', icon: Info };

          return (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[1000] bg-white dark:bg-slate-800 flex flex-col"
            >
              <div className="bg-white dark:bg-slate-800 pt-[env(safe-area-inset-top,0px)] border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between px-4 py-3">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-all text-slate-600 dark:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <p className="text-xs font-bold text-slate-900 dark:text-white capitalize tracking-widest">Pickup Detail</p>
                  <div className="w-10" /> {/* Spacer for balance */}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="w-full aspect-[4/5] bg-slate-900 relative overflow-hidden">
                  {b.photoUrl ? (
                    <OptimizedImage
                      src={getThumbnailUrl(b.photoUrl, { width: 800 })}
                      className="w-full h-full object-cover"
                      wrapperClassName="w-full h-full"
                      alt="Material pickup"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-800 opacity-50">
                      <Package className="w-20 h-20 text-slate-300" />
                      <p className="text-xs font-bold text-slate-400 capitalize tracking-widest">No photo provided</p>
                    </div>
                  )}
                </div>

                <div className="relative -mt-24 bg-white dark:bg-slate-800 rounded-t-[1rem] px-4 pt-6 pb-24 space-y-4 z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
                  <div className="inline-flex items-center px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 capitalize tracking-widest">pickup id: <span className="text-slate-900 dark:text-white font-mono">{String(b.id || '').slice(0, 8).toUpperCase()}</span></p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center text-center">
                      <Package className="w-4 h-4 text-primary mb-2" />
                      <p className="text-[8px] font-bold text-slate-400 capitalize tracking-widest leading-none mb-1">Material</p>
                      <p className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{String(waste?.label || wasteTypeVal)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center text-center">
                      <Clock className="w-4 h-4 text-amber-500 mb-2" />
                      <p className="text-[8px] font-bold text-slate-400 capitalize tracking-widest leading-none mb-2">Status</p>
                      <span className={`text-[9px] font-black tracking-[0.05em] px-2 py-1 rounded-lg capitalize shadow-sm whitespace-nowrap ${status.color}`}>
                        {String(status.label)}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center text-center">
                      <MapPin className="w-4 h-4 text-rose-500 mb-2" />
                      <p className="text-[8px] font-bold text-slate-400 capitalize tracking-widest leading-none mb-1">Origin</p>
                      <p className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{String(b.estate || '')}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-[2rem]  space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-emerald-100 capitalize tracking-widest">Settlement Value</p>
                        {b.status === 'completed' ? (
                          <p className="text-3xl font-black text-white tracking-tighter leading-none">
                            KSh {(b.totalPrice || 0).toLocaleString()}
                          </p>
                        ) : b.status === 'cancelled' ? (
                          <p className="text-xl font-black text-emerald-200 capitalize tracking-[0.2em] italic leading-none opacity-50">Cancelled</p>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <p className="text-xl font-black text-white tracking-tighter flex items-center gap-2 leading-none">
                              <Zap className="w-4 h-4 fill-emerald-300" /> Awaiting Verification
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-emerald-100 capitalize tracking-widest mb-2">Est. Weight</p>
                        <div className="flex items-center gap-2 justify-end">
                          <Scale className="w-4 h-4 text-emerald-200" />
                          <p className="text-lg font-black text-white capitalize leading-none">{b.actualWeightKg || b.bags || 0} KG</p>
                        </div>
                      </div>
                    </div>
                    <div className="h-px bg-white/10 relative z-10" />
                    <div className="space-y-2 relative z-10">
                      <p className="text-[10px] font-bold text-emerald-100 capitalize tracking-widest">Scheduled Slot</p>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-emerald-200" />
                        <p className="text-base font-bold text-white capitalize tracking-tight">{String((b as any).timeSlot || 'ASAP Request')}</p>
                      </div>
                    </div>
                  </div>

                  {b.status === 'completed' && (b.weaver_id || b.asset_id) && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                      <AssetJourney currentStatus={b.weaver_id ? 'matched' : 'completed'} />
                    </div>
                  )}

                  {(b.notes || b.wasteType) && (
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                      <h4 className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" /> Collector Instructions
                      </h4>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{String(b.notes || `Please collect ${waste?.label || wasteTypeVal} from ${b.estate || 'location'}. Standard verification applies.`)}"
                      </p>
                    </div>
                  )}

                  {activeTab === 'Upcoming' && (
                    <div className="flex flex-row gap-2.5 pt-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReschedule(b); }}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] capitalize tracking-[0.1em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <CalendarClock className="w-4 h-4" /> Reschedule
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancel(b.id); setSelectedBooking(null); }}
                        className="flex-1 py-4 bg-white dark:bg-slate-800 text-red-600 border border-red-50 dark:border-red-900/20 rounded-2xl font-black text-[10px] capitalize tracking-[0.1em] active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="w-full py-4 text-slate-400 font-bold text-[10px] capitalize tracking-[0.3em] active:opacity-50"
                  >
                    Close Detail
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

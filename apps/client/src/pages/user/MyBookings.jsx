/**
 * My Bookings Page — list of user's bookings with status badges
 */
import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, Truck, Star, XCircle, CalendarClock, Zap, ChevronDown, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore, useServiceStore } from '@cleanflow/core';

import EmptyState from '@cleanflow/ui/components/EmptyState';
import { AssetJourney, AssetBadge } from '@cleanflow/ui';
import { toast } from 'sonner';

const statusConfig = {
  'completed': { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Truck },
  'pending': { label: 'Pending', color: 'bg-orange-100 text-orange-700', icon: Clock },
  'confirmed': { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: Clock },
  'scheduled': { label: 'Scheduled', color: 'bg-orange-100 text-orange-700', icon: Clock },
  'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
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

  const handleReschedule = (id) => {
    toast.info('Opening Schedule', { 
      description: 'Redirecting you to select a new pickup time...',
      icon: <CalendarClock className="w-4 h-4" />
    });
    // We navigate to BookPickup and pass the ID we want to reschedule
    navigate('/book-pickup', { state: { rescheduleId: id } });
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
    <div className="space-y-4 animate-fade-in pb-20 px-2">
      <div className="relative flex items-center justify-between min-h-[40px]">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-slate-100 z-10">
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </button>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white leading-none">My Bookings</h1>
        </div>
        
        <div className="w-9 h-9" /> {/* Spacer to balance the layout */}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
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
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center ${
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
        <div className="space-y-3">
          {(activeTab === 'Cancelled' || activeTab === 'Completed') && (
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => handleClearHistory(activeTab.toLowerCase())}
                className="text-xs font-semibold text-rose-600 uppercase tracking-widest hover:underline px-4 py-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg flex items-center gap-2"
              >
                Clear {activeTab} History
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
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-inner border border-slate-100 dark:border-slate-700 shrink-0">
                        {waste?.icon || '📦'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm dark:text-white leading-tight">{waste?.label || wasteTypeVal || 'General Waste'}</p>
                          {b.grade && <AssetBadge grade={b.grade} showLabel={false} />}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">ID: <span className="text-primary font-mono">{b.id.slice(0, 8).toUpperCase()}</span></p>
                          </div>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{displayDate}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs font-semibold uppercase tracking-[0.1em] px-3 py-1 rounded-full shadow-sm ${status.color}`}>
                        {status.label}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {/* Always Visible Base Info */}
                  <div className="flex items-center justify-between text-sm mt-1">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      <span className="flex items-center gap-1">📍 {b.estate}</span>
                      {b.status === 'completed' && b.actualWeightKg > 0 && (
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm">
                          <Zap className="w-2.5 h-2.5 fill-emerald-500" /> +{Math.floor(b.actualWeightKg * 2)} GFP
                        </div>
                      )}
                      <span className="flex items-center gap-1">🕐 {b.time}</span>
                    </div>

                    <BookingAmountDisplay b={b} />
                  </div>
                </div>

                {/* Collapsible Detail Section */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex flex-col gap-3">
                      {b.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">M-Pesa Number</span>
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                            {b.phone}
                          </span>
                        </div>
                      )}
                      
                      {b.agentName && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Collector</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">{b.agentName}</span>
                            {b.agentRating && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-400/10 rounded">
                                <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                                <span className="font-semibold text-xs text-yellow-600 dark:text-yellow-500">{b.agentRating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {b.status === 'completed' && (b.weaverId || b.assetId) && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                        <AssetJourney currentStatus={b.weaverId ? 'matched' : 'completed'} />
                      </div>
                    )}

                    {activeTab === 'Upcoming' && (
                      <div className="flex gap-3 mt-4">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCancel(b.id); }}
                          className="flex-1 py-2.5 text-xs font-semibold text-red-600 uppercase tracking-widest bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleReschedule(b.id); }}
                          className="flex-1 py-2.5 text-xs font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-xl transition-colors flex items-center justify-center gap-1.5"
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
    </div>
  );
}

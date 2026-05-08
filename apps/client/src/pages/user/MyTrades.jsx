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
  <span className={`ml-1.5 px-2 py-0.5 text-[9px] font-semibold rounded-full transition-all ${
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

export default function MyTrades() {
  const navigate = useNavigate();
  const { bookings, fetchBookings, cancelBooking, clearBookingHistory } = useBookingStore();
  const [activeTab, setActiveTab] = useState('Active');
  const [expandedId, setExpandedId] = useState(null);

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
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Trade History</h1>
        </div>
        <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Total Trades: {bookings.length}</p>
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
                  className="text-[9px] font-semibold text-rose-600 uppercase tracking-widest hover:underline px-4 py-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center gap-2 border border-rose-100 dark:border-rose-900/30"
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
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                        {b.actual_weight_kg || b.actualWeightKg || b.bags || b.weightKg || b.quantity || 0}kg
                      </p>
                    </div>
                    <div className="text-right shrink-0 mr-1">
                      {b.status === 'counter_offer_pending' ? (
                        <>
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest line-through">
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
                            <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Logistics</p>
                            <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase">{isPickup ? 'Agent Dispatch' : 'Self Drop-off'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Listing ID</p>
                          <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 font-mono">CF-{b.id?.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex items-center justify-between py-2 px-1">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Schedule</span>
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{b.time_slot || b.time || 'ASAP'}</span>
                      </div>

                      {/* Action Hub */}
                      {activeTab === 'Active' && b.status === 'counter_offer_pending' ? (
                        <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 mb-2 mt-1">
                          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3 text-center">Open your Offers page to review the Agent's adjusted price proposal.</p>
                        </div>
                      ) : activeTab === 'Active' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toast.info("Reschedule Request Sent", { description: "We'll notify the weaver." }); }}
                            className="h-10 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-900 dark:text-white text-[9px] font-semibold uppercase tracking-widest transition-all active:scale-95 border border-slate-100 dark:border-slate-700"
                          >
                            <CalendarClock className="w-3.5 h-3.5 text-indigo-500" /> Reschedule
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCancel(b.id); }}
                            className="h-10 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl flex items-center justify-center gap-2 text-rose-600 text-[9px] font-semibold uppercase tracking-widest transition-all active:scale-95 border border-rose-100 dark:border-rose-900/10"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Withdraw
                          </button>
                        </div>
                      )}

                      {activeTab === 'Settled' && (
                        <div className="flex items-center justify-between pt-1">
                           <div className="flex items-center gap-2 text-emerald-500">
                              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/10" />
                              <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">Asset Settled</span>
                           </div>
                           <button className="text-[9px] font-semibold text-indigo-600 uppercase tracking-widest underline underline-offset-4">View Receipt</button>
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
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, CheckCircle2, XCircle,
  MapPin, Scale, MessageSquare, ChevronRight, Package, Receipt,
  TrendingUp, Recycle, Droplets, Cog, ScrollText, Wine, ChevronDown, Apple, Cpu, Shirt, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { WASTE_CATEGORIES } from '@klinflow/core/data/wasteDefinitions';
import { toast } from 'sonner';
import { OptimizedImage } from '@klinflow/ui';

const getSubcategoryLabel = (catId: string, subId: string) => {
  const cat = WASTE_CATEGORIES.find(c => c.id === catId);
  const sub = cat?.subcategories.find(s => s.id === subId);
  return sub ? sub.label : subId;
};

export default function MyRFQs() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const { materialPrices, fetchMaterialPrices } = useServiceStore();
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'completed' | 'closed'>('pending');
  const [filterMaterial, setFilterMaterial] = useState('All');
  const [isMoreCategoriesOpen, setIsMoreCategoriesOpen] = useState(false);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';

  useEffect(() => {
    if (isFleetDriver) {
      toast.error('Unauthorized access');
      navigate('/');
    }
  }, [isFleetDriver, navigate]);

  useEffect(() => {
    fetchMaterialPrices();
  }, [fetchMaterialPrices]);

  useEffect(() => {
    const fetchRFQs = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from('rfqs')
        .select(`*, rfq_offers(count)`)
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false });

      if (data) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          material: r.material_grade,
          category: r.category,
          quantity: `${r.requested_weight} ${r.weight_unit || 'kg'}`,
          targetPrice: r.target_price?.toString() || '0',
          location: r.pickup_area,
          status: r.status === 'open' ? 'pending' : r.status === 'fulfilled' ? 'accepted' : r.status === 'completed' ? 'completed' : r.status,
          createdAt: new Date(r.created_at).toLocaleString(),
          bidsCount: r.rfq_offers?.[0]?.count || 0,
          description: r.notes || '',
          images: r.images || []
        }));
        setRfqs(mapped);
      }
    };

    fetchRFQs();

    if (profile?.id) {
      const channel = supabase.channel('my_incoming_offers_agent')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'rfq_offers',
          filter: `buyer_id=eq.${profile.id}`
        }, (payload) => {
          toast.info('New Bid Received!', { description: 'A seller has sent a proposal for your RFQ.' });
          fetchRFQs();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id]);

  const filteredRFQs = rfqs.filter(rfq => {
    if (filter === 'closed') {
      if (rfq.status !== 'closed' && rfq.status !== 'cancelled') return false;
    } else {
      if (rfq.status !== filter) return false;
    }

    if (filterMaterial !== 'All' && rfq.category !== filterMaterial && rfq.material !== filterMaterial) return false;
    return true;
  });

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 min-h-screen transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <h1 className="text-base font-bold text-slate-600 dark:text-white capitalize tracking-tighter leading-tight">My RFQ Requests</h1>
            <p className="text-[10px] font-bold text-slate-600 capitalize tracking-widest flex items-center justify-center gap-1.5 mt-0.5">
               Sourcing Pipeline
            </p>
          </div>
          <button
            onClick={() => navigate('/rfq/create')}
            className="px-3 h-[38px] shrink-0 rounded-xl bg-emerald-600 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-emerald-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            <span className="text-[11px] font-bold uppercase tracking-widest mt-0.5">Send</span>
          </button>
        </div>

        {/* Status Filters — segmented pills */}
        <div className="flex px-4 pb-3 gap-1.5 overflow-x-auto no-scrollbar">
          {(['pending', 'accepted', 'completed', 'closed'] as const).map((statusOption) => {
            const count = rfqs.filter(q => {
              if (statusOption === 'closed') return q.status === 'closed' || q.status === 'cancelled';
              return q.status === statusOption;
            }).length;
            const labelConfig = {
              pending: 'Pending',
              accepted: 'Accepted',
              completed: 'Completed',
              closed: 'Closed'
            }[statusOption];

            return (
              <button
                key={statusOption}
                onClick={() => setFilter(statusOption)}
                className={`flex-1 py-2 px-1 rounded-xl text-[11px] flex items-center justify-center gap-1.5 font-bold capitalize tracking-wider transition-all border shrink-0 ${filter === statusOption
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <span>{labelConfig}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[8px] leading-none ${filter === statusOption
                  ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <main className="flex-1 pb-10 max-w-lg mx-auto w-full px-1.5 space-y-2 pt-[calc(env(safe-area-inset-top,1rem)+5.85rem)]">
        
        {/* TOP WRAPPER FOR HERO & FILTERS */}
        <div className="pt-3 pb-2 space-y-4">
          {/* Top Hero Stats Card */}
          <div className="bg-gradient-to-r from-[#1178ab] to-[#085078] rounded-2xl p-4 text-white shadow-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-bold tracking-tight leading-none">Material Requests</p>
                <p className="text-[10.5px] text-sky-100/80 font-medium mt-0.5">Manage your requests and track incoming offers</p>
              </div>
            </div>
              
            <div className="flex gap-2">
              <div className="flex-1 bg-black/10 border border-black/10 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-sky-200 uppercase tracking-widest mb-0.5">Total Requests</p>
                  <h3 className="text-2xl font-bold text-white leading-none">{rfqs.length}</h3>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 bg-black/10 border border-black/10 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-sky-200 uppercase tracking-widest mb-0.5">Active Bids</p>
                  <h3 className="text-2xl font-bold text-white leading-none">
                    {rfqs.reduce((acc, curr) => acc + (curr.bidsCount || 0), 0)}
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* ── MATERIAL CATEGORY CHIPS ── */}
          <div className="relative">
            <div className="flex justify-between items-end mb-2">
               <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 capitalize tracking-widest">Filter by Category</p>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 -mx-4 px-4">
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                    filterMaterial === cat.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <cat.Icon className={`w-4 h-4 ${filterMaterial === cat.id ? 'text-white dark:text-slate-900' : 'text-slate-500'}`} />
                  <span>{cat.label}</span>
                </button>
              ))}
              
              {/* More Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => setIsMoreCategoriesOpen(!isMoreCategoriesOpen)}
                  className={`flex items-center gap-1.5 px-3.5 py-3 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                    ['Organic', 'E-waste', 'Textile'].includes(filterMaterial) || isMoreCategoriesOpen
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
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
                  className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-50 overflow-hidden"
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
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[11px] font-bold transition-colors ${
                        filterMaterial === cat.id
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <cat.Icon className={`w-3.5 h-3.5 ${filterMaterial === cat.id ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredRFQs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-dashed border-slate-200/80 dark:border-slate-700/60"
            >
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Receipt className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">No RFQs Found</h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto font-medium">No requests match this category.</p>
            </motion.div>
          ) : (
            <div className="space-y-1.5">
              {filteredRFQs.map((rfq) => {
                const statusConfig = {
                  pending: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100/80 dark:bg-amber-500/15', label: 'Bidding Open' },
                  accepted: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100/80 dark:bg-emerald-500/15', label: 'Accepted' },
                  completed: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100/80 dark:bg-emerald-500/15', label: 'Completed' },
                  closed: { icon: XCircle, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700/50', label: 'Closed' },
                  cancelled: { icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100/80 dark:bg-rose-500/15', label: 'Cancelled' },
                }[rfq.status as 'pending' | 'accepted' | 'completed' | 'closed' | 'cancelled'];

                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    key={rfq.id}
                    onClick={() => navigate(`/rfqs/${rfq.id}`)}
                    className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 cursor-pointer select-none group active:scale-[0.99] transition-all overflow-hidden"
                  >
                    <div className="flex gap-3 p-3">
                      {/* Image */}
                      <div className="relative w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60">
                        {rfq.images && rfq.images.length > 0 ? (
                          <OptimizedImage src={rfq.images[0]} alt={rfq.material} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                        ) : (
                          <Package className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        {/* Top: Material name */}
                        <div>
                          <h3 className="text-[14px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight leading-tight">
                            {materialPrices?.find(m => m.id === rfq.material)?.material_name || getSubcategoryLabel(rfq.category, rfq.material) || rfq.material}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 capitalize truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {rfq.location.split(',')[0]}
                            </p>
                            <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                            <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                              <Scale className="w-3 h-3 text-slate-400 shrink-0" /> {rfq.quantity}
                            </p>
                          </div>
                        </div>

                        {/* Bottom: Date & Bids */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-slate-400" /> {rfq.createdAt ? new Date(rfq.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </p>
                          {rfq.bidsCount > 0 && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {rfq.bidsCount} Bid{rfq.bidsCount !== 1 ? 's' : ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right column: Status badge + Price */}
                      <div className="flex flex-col items-end justify-between shrink-0 py-0.5">
                        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${statusConfig.bg}`}>
                          <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-wider leading-none ${statusConfig.color}`}>{statusConfig.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400 leading-none tracking-tight">KSh {rfq.targetPrice}</p>
                          <p className="text-[9px] font-semibold text-slate-400 mt-0.5">/kg target</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

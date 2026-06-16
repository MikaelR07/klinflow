import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, CheckCircle2, XCircle,
  MapPin, Scale, MessageSquare, ChevronRight, Package, Receipt
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
  const [rfqs, setRfqs] = useState<any[]>([]);

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
    if (filter === 'closed') return rfq.status === 'closed' || rfq.status === 'cancelled';
    return rfq.status === filter;
  });

  return (
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-500 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-600 dark:text-white capitalize tracking-tighter leading-tight">My RFQ Requests</h1>
              <p className="text-[10px] font-bold text-amber-500 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 " /> Sourcing Pipeline
              </p>
            </div>
          </div>
        </div>

        {/* Status Filters (Exactly styled like seller pipeline page) */}
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
                className={`flex-1 py-2 px-1 rounded-xl text-[9px] flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider transition-all border shrink-0 ${filter === statusOption
                  ? 'bg-primary text-white border-transparent shadow-md shadow-primary/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <span>{labelConfig}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[8px] leading-none ${filter === statusOption
                  ? 'bg-white/25 text-white'
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
      <main className="flex-1 pb-10 max-w-lg mx-auto w-full px-0 space-y-px pt-[calc(env(safe-area-inset-top,1rem)+5.85rem)] bg-slate-100 dark:bg-slate-800">
        <AnimatePresence mode="popLayout">
          {filteredRFQs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-800"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">No RFQs Found</h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto font-medium">No requests match this category.</p>
            </motion.div>
          ) : (
            filteredRFQs.map((rfq) => {
              const statusConfig = {
                pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', label: 'Bidding Open' },
                accepted: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Accepted' },
                completed: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Completed' },
                closed: { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-500/10', border: 'border-slate-200 dark:border-slate-500/20', label: 'Closed' },
                cancelled: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', label: 'Cancelled' },
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
                  className="bg-white dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 cursor-pointer select-none group"
                >
                  <div className="py-3 px-3.5">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800 relative">
                        {rfq.images && rfq.images.length > 0 ? (
                          <OptimizedImage src={rfq.images[0]} alt={rfq.material} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        {/* Row 1: Material & Budget */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white capitalize truncate tracking-tight">
                              {materialPrices?.find(m => m.id === rfq.material)?.material_name || getSubcategoryLabel(rfq.category, rfq.material) || rfq.material}
                            </h3>
                            <div className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border} shrink-0`}>
                              <StatusIcon className="w-2.5 h-2.5" />
                              <span className="text-[8px] font-semibold uppercase tracking-wider leading-none">{statusConfig.label}</span>
                            </div>
                          </div>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tighter shrink-0 ml-2">KSh {rfq.targetPrice}/kg</span>
                        </div>

                        {/* Row 2: Location & Bids */}
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]">
                            <MapPin className="w-2.5 h-2.5 text-green-500" /> {rfq.location.split(',')[0]}
                          </p>
                          {rfq.bidsCount > 0 && (
                            <span className="px-1 py-0.5 bg-amber-500/10 text-amber-600 text-[6px] font-black capitalize tracking-[0.2em] rounded shrink-0">
                              {rfq.bidsCount} BID{rfq.bidsCount !== 1 ? 'S' : ''}
                            </span>
                          )}
                        </div>

                        {/* Row 3: Quantity & Date */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/50 mt-1">
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                            <Clock className="w-2.5 h-2.5 text-slate-400" /> {rfq.createdAt ? new Date(rfq.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </p>
                          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0">
                            <span className="text-[9px] text-slate-400 not-italic font-bold mr-1 opacity-70">Quantity:</span>
                            <Scale className="w-2.5 h-2.5" /> {rfq.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center text-slate-300">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

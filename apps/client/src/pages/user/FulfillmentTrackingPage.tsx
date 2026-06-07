import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, Phone, MessageSquare, CheckCircle2, Navigation, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { FulfillmentOrder } from '@klinflow/core/stores/fulfillmentStore.types';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { getSubcategoryLabel } from '@klinflow/core/data/wasteDefinitions';
import { format } from 'date-fns';
import { supabase } from '@klinflow/supabase';

const STATUS_STEPS = [
  { id: 'pending_coordination', label: 'Accepted' },
  { id: 'pickup_scheduled', label: 'Scheduled' },
  { id: 'agent_assigned', label: 'Driver Assigned' },
  { id: 'agent_on_the_way', label: 'On The Way' },
  { id: 'arrived', label: 'Arrived' },
  { id: 'material_verification', label: 'Verifying' },
  { id: 'pickup_completed', label: 'Completed' },
];

export default function FulfillmentTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { materialPrices, fetchMaterialPrices, categories, fetchCategories } = useServiceStore();

  const [order, setOrder] = useState<FulfillmentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCodeRevealed, setIsCodeRevealed] = useState(false);

  useEffect(() => {
    fetchMaterialPrices();
    fetchCategories();
  }, [fetchMaterialPrices, fetchCategories]);

  useEffect(() => {
    if (!id || !profile?.id) return;

    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('fulfillment_orders')
          .select('*, rfq:rfqs(*), proposal:rfq_offers(*), buyer:profiles!fulfillment_orders_buyer_id_fkey(company_name, name, phone), agent:profiles!fulfillment_orders_assigned_agent_id_fkey(name, phone)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data as unknown as FulfillmentOrder);
      } catch (err) {
        console.error('Failed to fetch tracking', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Subscribe to realtime updates
    const channel = supabase.channel(`fulfillment_${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'fulfillment_orders',
        filter: `id=eq.${id}`
      }, (payload) => {
        setOrder(prev => prev ? { ...prev, ...payload.new } as FulfillmentOrder : null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, profile?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-800">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 p-4 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Order Not Found</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  const isCompleted = ['completed', 'pickup_completed', 'in_transit', 'delivered'].includes(order.status);

  return (
    <div className=" max-w-lg mx-auto bg-slate-50 dark:bg-slate-800 pb-10 px-1.5 transition-colors">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-900 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Tracking</h1>
          <p className="text-xs font-bold text-emerald-500 capitalize tracking-widest">
            {(() => {
              const rfq = (order as any).rfq;
              if (!rfq) return 'Material Pickup';
              const matName = materialPrices?.find(m => m.id === rfq.material_grade)?.material_name
                || getSubcategoryLabel(rfq.category, rfq.material_grade)
                || categories?.find(c => c.id === rfq.category)?.label
                || rfq.category
                || 'Material';
              return `${matName} Pickup`;
            })()}
          </p>
        </div>
      </div>

      <div className="p-1.5 space-y-4">
        {/* Verification Code Card */}
        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <ShieldCheck className="w-24 h-24" />
            </div>

            <div className="relative z-10">
              <h3 className="text-sm font-bold text-amber-100 uppercase tracking-widest mb-1">Pickup Verification Code</h3>
              <p className="text-sm text-amber-50 mb-4">Provide this code to the driver upon material handover. This triggers your payment release.</p>

              <div
                onClick={() => setIsCodeRevealed(!isCodeRevealed)}
                className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer border border-white/30"
              >
                {isCodeRevealed ? (
                  <span className="text-4xl font-black tracking-[0.3em] font-mono">{order.verification_code}</span>
                ) : (
                  <span className="text-lg font-bold">Tap to reveal code</span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 ">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Navigation className="w-4 h-4" /> Live Progress
            </h3>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' :
              currentStepIndex >= 0 ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' :
                'text-slate-400 bg-slate-50 dark:bg-slate-800'
              }`}>
              {STATUS_STEPS[currentStepIndex]?.label || 'Completed'}
            </span>
          </div>

          {/* Row 1: Steps 1-4 */}
          <div className="flex items-start relative mb-6">
            {STATUS_STEPS.slice(0, 4).map((step, i) => {
              const isPast = i < currentStepIndex || isCompleted;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step.id} className="flex flex-col items-center flex-1 relative">
                  {i < 3 && (
                    <div className={`absolute top-2.5 left-[50%] w-full h-[2px] ${isPast ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} style={{ zIndex: 0 }} />
                  )}
                  <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 mb-2 relative z-10 ${isPast ? 'bg-emerald-500 border-emerald-500' :
                    isCurrent ? 'bg-white border-blue-500 dark:bg-slate-900 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]' :
                      'bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700'
                    }`} />
                  <p className={`text-[9px] font-bold text-center uppercase tracking-wider leading-tight px-1 ${isPast ? 'text-slate-900 dark:text-white' :
                    isCurrent ? 'text-blue-600 dark:text-blue-400' :
                      'text-slate-400'
                    }`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Row 2: Steps 5-7 */}
          <div className="flex items-start relative">
            {STATUS_STEPS.slice(4).map((step, i) => {
              const realIdx = i + 4;
              const isPast = realIdx < currentStepIndex || isCompleted;
              const isCurrent = realIdx === currentStepIndex;
              return (
                <div key={step.id} className="flex flex-col items-center flex-1 relative">
                  {i < 2 && (
                    <div className={`absolute top-2.5 left-[50%] w-full h-[2px] ${isPast ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} style={{ zIndex: 0 }} />
                  )}
                  <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 mb-2 relative z-10 ${isPast ? 'bg-emerald-500 border-emerald-500' :
                    isCurrent ? 'bg-white border-blue-500 dark:bg-slate-900 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]' :
                      'bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700'
                    }`} />
                  <p className={`text-[9px] font-bold text-center uppercase tracking-wider leading-tight px-1 ${isPast ? 'text-slate-900 dark:text-white' :
                    isCurrent ? 'text-blue-600 dark:text-blue-400' :
                      'text-slate-400'
                    }`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-5">
          <h3 className="text-[11px] uppercase tracking-wider font-black text-slate-400">Logistics Details</h3>

          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800/60">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Accepted By</p>
              <p className="text-sm font-black text-slate-900 dark:text-white capitalize">
                {(order as any).buyer?.company_name || (order as any).buyer?.name || 'Company Name'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Company Contact</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{(order as any).buyer?.phone || 'Not provided'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/60">
            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
              <MapPin className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pickup Address</p>
              <p className="text-xs font-black text-slate-900 dark:text-white mt-1 capitalize">{order.pickup_address || 'TBD'}</p>
            </div>
          </div>

          {order.scheduled_date && (
            <div className="flex items-start gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Schedule</p>
                <p className="text-xs font-black text-slate-900 dark:text-white mt-1">{format(new Date(order.scheduled_date), 'PPP')}</p>
              </div>
            </div>
          )}

          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Assigned Fleet Agent</p>
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{(order as any).agent?.name || 'Pending Assignment'}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{(order as any).agent?.phone || 'Awaiting contact'}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.location.href = `tel:${(order as any).agent?.phone || ''}`}
                  disabled={!(order as any).agent?.phone}
                  className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  disabled={!(order as any).agent}
                  className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

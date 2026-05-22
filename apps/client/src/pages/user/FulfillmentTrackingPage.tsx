import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, Phone, MessageSquare, CheckCircle2, Navigation, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { FulfillmentOrder } from '@klinflow/core/stores/fulfillmentStore.types';
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
  
  const [order, setOrder] = useState<FulfillmentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCodeRevealed, setIsCodeRevealed] = useState(false);

  useEffect(() => {
    if (!id || !profile?.id) return;
    
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('fulfillment_orders')
          .select('*, rfq:rfqs(*), proposal:rfq_offers(*)')
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:bg-slate-100 dark:active:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Tracking</h1>
          <p className="text-xs font-bold text-emerald-500 capitalize tracking-widest">{(order as any).rfq?.category || 'Material'} Pickup</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Verification Code Card */}
        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden"
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Status Timeline</h3>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
            {STATUS_STEPS.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex || isCompleted;
              
              return (
                <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${
                    isActive ? 'bg-emerald-500 border-emerald-100 dark:border-emerald-900 text-white' : 
                    isPast ? 'bg-emerald-500 border-white dark:border-slate-800 text-white' : 
                    'bg-slate-100 dark:bg-slate-800 border-white dark:border-slate-800 text-slate-300 dark:text-slate-600'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                  
                  <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border ${
                    isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 
                    'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                  }`}>
                    <h4 className={`font-bold text-sm ${isActive ? 'text-emerald-700 dark:text-emerald-400' : isPast ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {step.label}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Logistics Details</h3>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pickup Address</p>
              <p className="font-medium text-slate-900 dark:text-white mt-1">{order.pickup_address || 'TBD'}</p>
            </div>
          </div>

          {order.scheduled_date && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Schedule</p>
                <p className="font-medium text-slate-900 dark:text-white mt-1">{format(new Date(order.scheduled_date), 'PPP')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Contact Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold active:scale-95 transition-all">
            <MessageSquare className="w-5 h-5" /> Chat
          </button>
          <button className="flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold active:scale-95 transition-all">
            <Phone className="w-5 h-5" /> Call Agent
          </button>
        </div>
      </div>
    </div>
  );
}

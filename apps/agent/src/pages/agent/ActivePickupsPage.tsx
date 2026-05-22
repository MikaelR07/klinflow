import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PackageCheck, MapPin, Phone, Truck, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { format } from 'date-fns';
import VerificationWorkflowModal from '../../components/fulfillment/VerificationWorkflowModal';
import { FulfillmentOrder } from '@klinflow/core/stores/fulfillmentStore.types';

export default function ActivePickupsPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { activeFulfillments, fetchActiveFulfillments, isLoading } = useFulfillmentStore();

  const [selectedOrder, setSelectedOrder] = useState<FulfillmentOrder | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      // Determine role context: company admin sees organization_id matching their ID
      // independent sees assigned_agent_id matching their ID
      const role = profile.agentAccountType === 'company_admin' ? 'company' : 'agent';
      fetchActiveFulfillments(profile.id, role);
    }
  }, [profile, fetchActiveFulfillments]);

  const handleStartVerification = (order: FulfillmentOrder) => {
    setSelectedOrder(order);
    setIsVerificationOpen(true);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending_coordination': return { label: 'Pending Coordination', color: 'bg-amber-100 text-amber-700' };
      case 'pickup_scheduled': return { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' };
      case 'agent_assigned': return { label: 'Assigned', color: 'bg-indigo-100 text-indigo-700' };
      case 'agent_on_the_way': return { label: 'On The Way', color: 'bg-purple-100 text-purple-700' };
      case 'arrived': return { label: 'Arrived', color: 'bg-emerald-100 text-emerald-700' };
      case 'material_verification': return { label: 'Verifying', color: 'bg-orange-100 text-orange-700' };
      default: return { label: status, color: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-slate-50 dark:bg-slate-800 pb-16 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3.5 px-4 flex items-center gap-3.5">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-500 transition-colors" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Active Pickups</h1>
            <p className="text-[10px] font-bold text-amber-500 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
              Fulfillment Orders
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)]">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeFulfillments.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageCheck className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Active Pickups</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">You don't have any pending fulfillment orders right now.</p>
          </div>
        ) : (
          activeFulfillments.map((order: any) => {
            const statusConfig = getStatusDisplay(order.status);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{order.rfq?.category || 'Material'} Pickup</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{order.proposal?.offered_weight}kg • KSh {order.proposal?.offered_price}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium truncate">{order.pickup_address || order.rfq?.pickup_area || 'Address not specified'}</span>
                  </div>
                  {order.scheduled_date && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{format(new Date(order.scheduled_date), 'PPP')} {order.scheduled_time && `at ${order.scheduled_time}`}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <Phone className="w-4 h-4" /> Call
                  </button>
                  <button
                    onClick={() => handleStartVerification(order)}
                    className="flex-[2] py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <ShieldCheck className="w-4 h-4" /> Verify Material
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {isVerificationOpen && selectedOrder && (
        <VerificationWorkflowModal
          isOpen={isVerificationOpen}
          onClose={() => setIsVerificationOpen(false)}
          order={selectedOrder}
        />
      )}
    </div>
  );
}

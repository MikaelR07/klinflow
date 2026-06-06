import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, PackageCheck, MapPin, Phone, Navigation, ShieldCheck, Clock, CheckCircle2, Truck, Eye, Scale, Calendar, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { getSubcategoryLabel } from '@klinflow/core/data/wasteDefinitions';
import { format } from 'date-fns';
import { toast } from 'sonner';
import VerificationWorkflowModal from '../../components/fulfillment/VerificationWorkflowModal';
import { FulfillmentOrder } from '@klinflow/core/stores/fulfillmentStore.types';

const STATUS_PIPELINE = [
  'agent_assigned',
  'agent_on_the_way',
  'arrived',
  'pickup_completed',
  'in_transit',
  'delivered',
];

export default function ActivePickupsPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { activeFulfillments, fetchActiveFulfillments, updateFulfillmentStatus, isLoading } = useFulfillmentStore();
  const { materialPrices, fetchMaterialPrices, categories, fetchCategories } = useServiceStore();

  const [selectedOrder, setSelectedOrder] = useState<FulfillmentOrder | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isCompanyAdmin = profile?.agentAccountType === 'company_admin';

  useEffect(() => {
    fetchMaterialPrices();
    fetchCategories();
  }, [fetchMaterialPrices, fetchCategories]);

  useEffect(() => {
    if (profile) {
      const role = isCompanyAdmin ? 'company' : 'agent';
      fetchActiveFulfillments(profile.id, role);
    }
  }, [profile, fetchActiveFulfillments]);

  const handleUpdateStatus = async (fulfillmentId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateFulfillmentStatus(fulfillmentId, newStatus as any, `Driver updated status to ${newStatus}`);
      toast.success('Status updated');
      if (profile) {
        const role = isCompanyAdmin ? 'company' : 'agent';
        fetchActiveFulfillments(profile.id, role);
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartVerification = (order: FulfillmentOrder) => {
    setSelectedOrder(order);
    setIsVerificationOpen(true);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending_coordination': return { label: 'Pending', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' };
      case 'pickup_scheduled': return { label: 'Scheduled', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' };
      case 'agent_assigned': return { label: 'Assigned', icon: Navigation, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20' };
      case 'agent_on_the_way': return { label: 'En Route', icon: Navigation, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20' };
      case 'arrived': return { label: 'Arrived', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' };
      case 'material_verification': return { label: 'Verifying', icon: ShieldCheck, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20' };
      case 'pickup_completed': return { label: 'Picked Up', icon: PackageCheck, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20' };
      case 'in_transit': return { label: 'In Transit', icon: Truck, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200 dark:border-sky-500/20' };
      case 'delivered': return { label: 'Delivered', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' };
      default: return { label: status?.replace(/_/g, ' '), icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-500/10', border: 'border-slate-200 dark:border-slate-500/20' };
    }
  };

  const resolveMaterialName = (rfq: any) => {
    if (!rfq) return 'Collect materials';
    return materialPrices?.find(m => m.id === rfq.material_grade)?.material_name
      || getSubcategoryLabel(rfq.category, rfq.material_grade)
      || categories?.find(c => c.id === rfq.category)?.label
      || rfq.category
      || 'Collect materials';
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3.5 px-4 flex items-center gap-3.5">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-500 transition-colors" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Active Pickups</h1>
            <p className="text-[10px] font-bold text-amber-500 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
              {isCompanyAdmin ? 'Fleet Monitoring' : 'Fulfillment Orders'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 pb-10 max-w-lg mx-auto w-full px-0 space-y-px pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)] bg-slate-100 dark:bg-slate-800">
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
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isCompanyAdmin
                ? 'No fulfillment orders are currently in progress.'
                : "You don't have any pending fulfillment orders right now."}
            </p>
          </div>
        ) : (
          activeFulfillments.map((order: any) => {
            const statusConfig = getStatusDisplay(order.status);
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-none relative overflow-hidden group"
              >
                {/* Status accent bar on left edge */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />

                <div
                  className="pl-5 pr-4 pt-4 pb-3 cursor-pointer select-none"
                  onClick={() => {
                    if (isCompanyAdmin) navigate(`/pickups/${order.id}`);
                    else setExpandedCardId(prev => prev === order.id ? null : order.id);
                  }}
                >
                  {/* Row 1: Material Name + Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[14px] font-black text-slate-900 dark:text-white capitalize leading-none truncate max-w-[200px]">
                      {resolveMaterialName(order.rfq)} Pickup
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="text-[8px] font-bold uppercase tracking-wider leading-none">{statusConfig.label}</span>
                      </div>
                      {!isCompanyAdmin && (
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedCardId === order.id ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </div>

                  {/* Row 2: Structured meta + Price */}
                  <div className="flex items-end justify-between">
                    {/* Left: Meta details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[11px] font-semibold text-slate-500">{order.proposal?.offered_weight}kg</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[120px]">{order.pickup_address || order.rfq?.pickup_area || 'TBD'}</span>
                        </div>
                      </div>
                      {order.scheduled_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[11px] font-semibold text-slate-500">
                            {format(new Date(order.scheduled_date), 'MMM d')} {order.scheduled_time && `• ${order.scheduled_time}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Price */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Offered Price</p>
                        <p className="text-sm font-black text-emerald-500 leading-none">
                          KSh {order.proposal?.offered_price}<span className="text-[9px] text-emerald-600/70">/kg</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── COMPANY ADMIN: Read-only status tracker ── */}
                {isCompanyAdmin ? (
                  <div className="px-5 pb-4 pt-1">
                    <hr className="border-slate-100 dark:border-slate-800/60 mb-3" />
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        Step {Math.max(STATUS_PIPELINE.indexOf(order.status) + 1, 1)} of {STATUS_PIPELINE.length}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-blue-500">
                        <Eye className="w-3 h-3" /> Monitoring
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {STATUS_PIPELINE.map((step, i) => {
                        const currentIdx = STATUS_PIPELINE.indexOf(order.status);
                        const isCompleted = i < currentIdx;
                        const isCurrent = i === currentIdx;
                        return (
                          <div key={step} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`h-1 w-full rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-800'
                              }`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* ── FLEET DRIVER / INDEPENDENT: Action buttons based on status ── */
                  <AnimatePresence>
                    {expandedCardId === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <hr className="border-slate-100 dark:border-slate-800/60 mb-3" />
                          {order.status === 'agent_assigned' && (
                            <button
                              onClick={async () => {
                                await handleUpdateStatus(order.id, 'agent_on_the_way');
                                navigate(`/pickups/navigate/${order.id}`);
                              }}
                              disabled={isUpdating}
                              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                            >
                              <Navigation className="w-4 h-4" /> Start Route
                            </button>
                          )}

                          {order.status === 'agent_on_the_way' && (
                            <button
                              onClick={() => navigate(`/pickups/navigate/${order.id}`)}
                              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                              <Navigation className="w-4 h-4" /> Open Map
                            </button>
                          )}

                          {order.status === 'arrived' && (
                            <button
                              onClick={() => handleStartVerification(order)}
                              className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                              <ShieldCheck className="w-4 h-4" /> Verify Material
                            </button>
                          )}

                          {order.status === 'pickup_completed' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'in_transit')}
                              disabled={isUpdating}
                              className="w-full py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                            >
                              <Truck className="w-4 h-4" /> Mark In Transit
                            </button>
                          )}

                          {order.status === 'in_transit' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'delivered')}
                              disabled={isUpdating}
                              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Confirm Dropoff
                            </button>
                          )}

                          {/* Fallback for statuses without a specific action */}
                          {!['agent_assigned', 'agent_on_the_way', 'arrived', 'pickup_completed', 'in_transit'].includes(order.status) && (
                            <div className="flex gap-2">
                              <button className="flex-[0.5] py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                                <Phone className="w-4 h-4" /> Call
                              </button>
                              <button
                                onClick={() => handleStartVerification(order)}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                              >
                                <ShieldCheck className="w-4 h-4" /> View Verification
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {isVerificationOpen && selectedOrder && (
        <VerificationWorkflowModal
          isOpen={isVerificationOpen}
          onClose={() => {
            setIsVerificationOpen(false);
            if (profile) {
              const role = isCompanyAdmin ? 'company' : 'agent';
              fetchActiveFulfillments(profile.id, role);
            }
          }}
          order={selectedOrder}
        />
      )}
    </div>
  );
}


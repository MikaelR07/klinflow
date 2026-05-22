import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, PackageCheck, Phone, Clock, ArrowRight, CheckCircle2, Truck } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { DeliveryAssignment } from '@klinflow/core/stores/fulfillmentStore.types';
import { format } from 'date-fns';
import VerificationWorkflowModal from '../../components/fulfillment/VerificationWorkflowModal';
import { toast } from 'sonner';

export default function FleetDriverPickups() {
  const { profile } = useAuthStore();
  const { fleetAssignments, fetchFleetAssignments, updateFulfillmentStatus, isLoading } = useFulfillmentStore();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchFleetAssignments(profile.id);
    }
  }, [profile?.id, fetchFleetAssignments]);

  const handleUpdateStatus = async (fulfillmentId: string, newStatus: any) => {
    setIsUpdating(true);
    try {
      await updateFulfillmentStatus(fulfillmentId, newStatus, `Driver updated status to ${newStatus}`);
      toast.success(`Status updated to ${newStatus}`);
      if (profile?.id) fetchFleetAssignments(profile.id);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartVerification = (order: any) => {
    setSelectedOrder(order);
    setIsVerificationOpen(true);
  };

  const activeAssignments = fleetAssignments.filter((a: any) => !['completed', 'cancelled'].includes(a.fulfillment?.status));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 pb-20">
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4">
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">My Route</h1>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 capitalize tracking-widest">Active Pickups ({activeAssignments.length})</p>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeAssignments.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageCheck className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Active Assignments</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">You don't have any pending pickups assigned to you.</p>
          </div>
        ) : (
          activeAssignments.map((assignment: any) => {
            const order = assignment.fulfillment;
            if (!order) return null;

            return (
              <motion.div 
                key={assignment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{order.rfq?.category || 'Material'}</h3>
                      <p className="text-sm font-bold text-emerald-600">{order.proposal?.offered_weight}kg Expected</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                    <span className="font-medium truncate">{order.pickup_address || order.rfq?.pickup_area || 'Address not specified'}</span>
                  </div>
                </div>

                {/* Actions based on state */}
                <div className="p-4 bg-white dark:bg-slate-800">
                  {order.status === 'agent_assigned' && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'agent_on_the_way')}
                      disabled={isUpdating}
                      className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Navigation className="w-5 h-5" /> Start Route
                    </button>
                  )}

                  {order.status === 'agent_on_the_way' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center gap-2">
                          <Phone className="w-4 h-4" /> Call
                        </button>
                        <button className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center gap-2">
                          <Navigation className="w-4 h-4" /> Map
                        </button>
                      </div>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'arrived')}
                        disabled={isUpdating}
                        className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <MapPin className="w-5 h-5" /> Confirm Arrival
                      </button>
                    </div>
                  )}

                  {order.status === 'arrived' && (
                    <button 
                      onClick={() => handleStartVerification(order)}
                      className="w-full py-4 rounded-xl bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                    >
                      <PackageCheck className="w-5 h-5" /> Start Material Verification
                    </button>
                  )}

                  {order.status === 'pickup_completed' && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'in_transit')}
                      disabled={isUpdating}
                      className="w-full py-4 rounded-xl bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <Truck className="w-5 h-5" /> Mark In Transit to Hub
                    </button>
                  )}

                  {order.status === 'in_transit' && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'delivered')}
                      disabled={isUpdating}
                      className="w-full py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Confirm Dropoff at Hub
                    </button>
                  )}
                </div>
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
            if (profile?.id) fetchFleetAssignments(profile.id);
          }}
          order={selectedOrder}
        />
      )}
    </div>
  );
}

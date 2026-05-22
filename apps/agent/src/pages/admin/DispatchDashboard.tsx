import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Clock, ArrowRight, CheckCircle2, UserPlus, Truck, ShieldCheck, X, Phone } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { FulfillmentOrder } from '@klinflow/core/stores/fulfillmentStore.types';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Simplified mock of fleet drivers - ideally fetched from your user store for the company
const MOCK_DRIVERS = [
  { id: '111', name: 'James Omondi', status: 'available', distance: '2km' },
  { id: '222', name: 'Peter Kamau', status: 'on_route', distance: '5km' },
  { id: '333', name: 'John Doe', status: 'available', distance: '1km' }
];

export default function DispatchDashboard() {
  const { profile } = useAuthStore();
  const { dispatchQueue, fetchDispatchQueue, assignDriver, isLoading } = useFulfillmentStore();
  const [selectedOrder, setSelectedOrder] = useState<FulfillmentOrder | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchDispatchQueue(profile.id);
    }
  }, [profile?.id, fetchDispatchQueue]);

  const handleOpenAssign = (order: FulfillmentOrder) => {
    setSelectedOrder(order);
    setIsAssignModalOpen(true);
  };

  const handleAssignDriver = async (driverId: string) => {
    if (!selectedOrder || !profile?.id) return;
    setIsAssigning(true);
    try {
      await assignDriver(selectedOrder.id, profile.id, driverId);
      toast.success('Driver assigned successfully!');
      setIsAssignModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign driver');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4">
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Fleet Dispatch</h1>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 capitalize tracking-widest">Awaiting Assignment ({dispatchQueue.length})</p>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : dispatchQueue.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Queue Empty</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">All fulfillment orders have been assigned to your fleet.</p>
          </div>
        ) : (
          dispatchQueue.map((order: any) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{order.rfq?.category || 'Material'} Pickup</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{order.proposal?.offered_weight}kg • Expected KSh {order.proposal?.offered_price}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">
                  Needs Driver
                </span>
              </div>

              <div className="space-y-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="font-medium truncate">{order.pickup_address || order.rfq?.pickup_area || 'Address not specified'}</span>
                </div>
                {order.scheduled_date && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{format(new Date(order.scheduled_date), 'PPP')}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => handleOpenAssign(order)}
                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <UserPlus className="w-4 h-4" /> Assign Fleet Driver
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* ASSIGNMENT MODAL */}
      <AnimatePresence>
        {isAssignModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Assign Driver</h2>
                  <p className="text-xs font-bold text-slate-500">Select an available driver for this pickup</p>
                </div>
                <button 
                  onClick={() => setIsAssignModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                {MOCK_DRIVERS.map(driver => (
                  <button 
                    key={driver.id}
                    onClick={() => handleAssignDriver(driver.id)}
                    disabled={isAssigning}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{driver.name}</p>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-500">{driver.status} • {driver.distance}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

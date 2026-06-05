/**
 * BookPickup Confirmation Modal
 * Extracted from BookPickup.tsx for modularity.
 */
import { CheckCircle2, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@klinflow/ui';

interface BookPickupConfirmModalProps {
  showEscrowModal: boolean;
  setShowEscrowModal: (v: boolean) => void;
  isSubmitting: boolean;
  handleBook: () => void;
  preselectedCompanyName: string | null;
}

export default function BookPickupConfirmModal({
  showEscrowModal, setShowEscrowModal,
  isSubmitting, handleBook, preselectedCompanyName
}: BookPickupConfirmModalProps) {
  return (
    <AnimatePresence>
      {showEscrowModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-28">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEscrowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[3rem] p-8 pb-10 shadow-2xl overflow-hidden">
            <div className="relative space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center">
                {preselectedCompanyName ? <span className="text-3xl">🏢</span> : <CheckCircle2 className="w-8 h-8 text-primary" />}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                  {preselectedCompanyName ? `Book with ${preselectedCompanyName}` : 'Confirm Pickup Request'}
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  {preselectedCompanyName
                    ? `Your request goes directly to ${preselectedCompanyName}. They will dispatch an agent to you.`
                    : 'An agent will be dispatched to your location to weigh and collect your items.'}
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full uppercase tracking-widest text-xs"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                onClick={() => handleBook()}
                rightIcon={!isSubmitting ? <Truck className="w-4 h-4" /> : null}
              >
                {isSubmitting ? 'OPTIMIZING & DISPATCHING...' : 'DISPATCH AGENT NOW'}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-xs font-semibold text-slate-400 capitalize tracking-widest mt-2"
                onClick={() => setShowEscrowModal(false)}
              >
                Go Back
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

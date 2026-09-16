import { useNetworkStatus, useOfflineQueue } from '@klinflow/core/offline';
import { WifiOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const { pendingCount } = useOfflineQueue();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-14 left-25 right-0 mx-auto w-max z-[100] bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 rounded-full shadow-lg shadow-red-900/20"
        >
          <WifiOff className="w-4 h-4 animate-pulse" />
          <p className="text-xs font-semibold tracking-wide">
            You are in offline mode.
            {pendingCount > 0 && (
              <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded ml-2">
                {pendingCount} actions queued
              </span>
            )}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

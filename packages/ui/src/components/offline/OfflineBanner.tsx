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
          className="fixed top-16 left-0 right-0 z-[100] bg-opacity-100 bg-red-500 backdrop-blur-md text-white px-4 py-2 flex items-center justify-center gap-3 shadow-lg "
        >
          <WifiOff className="w-4 h-4 animate-pulse" />
          <p className="text-xs font-semibold tracking-wide">
            You are offline.{' '}
            {pendingCount > 0 ? (
              <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded ml-1">
                {pendingCount} actions queued
              </span>
            ) : (
              <span className="opacity-90 font-medium ml-1">You are in offline mode</span>
            )}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

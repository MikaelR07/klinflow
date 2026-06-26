import { useSyncStatus } from '@klinflow/core/offline';
import { Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SyncStatusIndicator() {
  const isSyncing = useSyncStatus();

  return (
    <AnimatePresence>
      {isSyncing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-full shadow-lg border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          <p className="text-[10px] font-bold tracking-widest uppercase">Syncing</p>
          <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

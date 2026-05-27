import { useOfflineQueue } from '@klinflow/core/offline';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  actionType?: string; // If provided, only count pending actions of this type
}

export default function PendingChangesBadge({ actionType }: Props) {
  const { items } = useOfflineQueue();
  
  const relevantItems = actionType 
    ? items.filter(i => i.type === actionType) 
    : items;

  const count = relevantItems.length;

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm z-10"
        >
          {count}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

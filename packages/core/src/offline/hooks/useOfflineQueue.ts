import { useState, useEffect } from 'react';
import { OfflineQueue } from '../queue';
import { QueuedMutation } from '../db';
import { syncEngine } from '../sync';

export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [items, setItems] = useState<QueuedMutation[]>([]);

  useEffect(() => {
    let mounted = true;
    
    const fetchQueue = async () => {
      const pendingItems = await OfflineQueue.getPending();
      if (mounted) {
        setItems(pendingItems);
        setPendingCount(pendingItems.length);
      }
    };

    fetchQueue();
    
    // Poll or listen for changes. 
    // In a full implementation, we could hook this into Dexie's useLiveQuery
    // For now, we refresh when sync status changes to false
    const unsubscribe = syncEngine.subscribe((isSyncing) => {
      if (!isSyncing) fetchQueue();
    });

    // Also poll every few seconds just in case of local mutations
    const interval = setInterval(fetchQueue, 2000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { pendingCount, items };
}

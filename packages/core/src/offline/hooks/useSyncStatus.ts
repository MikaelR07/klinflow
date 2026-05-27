import { useState, useEffect } from 'react';
import { syncEngine } from '../sync';

export function useSyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    return syncEngine.subscribe(setIsSyncing);
  }, []);

  return isSyncing;
}

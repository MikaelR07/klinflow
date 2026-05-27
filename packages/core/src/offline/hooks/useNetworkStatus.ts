import { useState, useEffect } from 'react';
import { networkManager } from '../network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(networkManager.isOnline);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(
    networkManager.isOnline ? new Date() : null
  );

  useEffect(() => {
    const unsubscribe = networkManager.subscribe((online) => {
      setIsOnline(online);
      if (online) setLastOnlineAt(new Date());
    });
    return unsubscribe;
  }, []);

  return { isOnline, lastOnlineAt };
}

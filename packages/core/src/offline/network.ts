

/**
 * Global network state manager
 */
class NetworkManager {
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  
  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.notify(true));
      window.addEventListener('offline', () => this.notify(false));
    }
  }

  get isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  subscribe(listener: (isOnline: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(isOnline: boolean) {
    this.listeners.forEach(listener => listener(isOnline));
  }
}

export const networkManager = new NetworkManager();



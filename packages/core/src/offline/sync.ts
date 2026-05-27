import { OfflineQueue } from './queue';
import { networkManager } from './network';
import { supabase } from '@klinflow/supabase';

type SyncHandler = (payload: any) => Promise<void>;

class SyncEngine {
  private isSyncing = false;
  private handlers: Record<string, SyncHandler> = {};
  private syncListeners: Set<(isSyncing: boolean) => void> = new Set();

  constructor() {
    networkManager.subscribe((isOnline) => {
      if (isOnline) {
        this.triggerSync();
      }
    });
  }

  registerHandler(type: string, handler: SyncHandler) {
    this.handlers[type] = handler;
  }

  subscribe(listener: (isSyncing: boolean) => void) {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  private notify(syncing: boolean) {
    this.isSyncing = syncing;
    this.syncListeners.forEach(listener => listener(syncing));
  }

  async triggerSync() {
    if (this.isSyncing || !networkManager.isOnline) return;

    const pending = await OfflineQueue.getPending();
    if (pending.length === 0) return;

    this.notify(true);
    console.log(`[SyncEngine] Starting sync of ${pending.length} items`);

    for (const item of pending) {
      if (!item.id) continue;
      
      const handler = this.handlers[item.type];
      
      if (!handler) {
        console.error(`[SyncEngine] No handler registered for type: ${item.type}`);
        await OfflineQueue.markFailed(item.id, 'No handler registered');
        continue;
      }

      try {
        await OfflineQueue.markSyncing(item.id);
        
        // Execute the registered handler
        await handler(item.payload);
        
        // Success - remove from queue
        await OfflineQueue.remove(item.id);
        console.log(`[SyncEngine] Successfully synced item ${item.id}`);
        
      } catch (error: any) {
        console.error(`[SyncEngine] Failed to sync item ${item.id}`, error);
        await OfflineQueue.markFailed(item.id, error.message || 'Sync failed');
      }
    }

    this.notify(false);
  }
}

export const syncEngine = new SyncEngine();

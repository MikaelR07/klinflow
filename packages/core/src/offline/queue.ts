import { offlineDB, QueuedMutation } from './db';

export class OfflineQueue {
  /**
   * Adds a mutation to the offline queue to be processed later.
   */
  static async push(mutation: Omit<QueuedMutation, 'id' | 'status' | 'retries' | 'createdAt'>) {
    console.log('[OfflineQueue] Pushing mutation:', mutation.type);
    await offlineDB.queue.add({
      ...mutation,
      status: 'pending',
      retries: 0,
      createdAt: new Date().toISOString()
    });
  }

  static async getPending() {
    return await offlineDB.queue.where('status').equals('pending').toArray();
  }

  static async markSyncing(id: number) {
    await offlineDB.queue.update(id, { status: 'syncing' });
  }

  static async remove(id: number) {
    await offlineDB.queue.delete(id);
  }

  static async markFailed(id: number, errorMsg: string, maxRetries = 3) {
    const item = await offlineDB.queue.get(id);
    if (!item) return;

    if (item.retries >= maxRetries - 1) {
      await offlineDB.queue.update(id, { status: 'failed', error: errorMsg, retries: item.retries + 1 });
    } else {
      await offlineDB.queue.update(id, { status: 'pending', error: errorMsg, retries: item.retries + 1 });
    }
  }

  static subscribe(callback: () => void) {
    // Basic polling or Dexie observable could be used here
    // For simplicity, we just trigger when mutations happen
  }
}

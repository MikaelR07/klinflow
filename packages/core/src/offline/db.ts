import Dexie, { Table } from 'dexie';

export interface QueuedMutation {
  id?: number;
  type: string;
  payload: any;
  endpoint?: string;
  method?: string;
  status: 'pending' | 'syncing' | 'failed';
  retries: number;
  createdAt: string;
  error?: string;
}

export interface SyncMeta {
  key: string;
  lastSyncedAt: string;
  version?: number;
}

export class KlinflowOfflineDB extends Dexie {
  queue!: Table<QueuedMutation, number>;
  sync_meta!: Table<SyncMeta, string>;

  // Optional entity tables if we want manual indexedDB, but we'll use idb-keyval for Zustand persist
  
  constructor() {
    super('klinflow_offline_db');
    this.version(1).stores({
      queue: '++id, type, status, createdAt',
      sync_meta: 'key'
    });
  }
}

export const offlineDB = new KlinflowOfflineDB();

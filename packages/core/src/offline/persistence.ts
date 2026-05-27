import { StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

/**
 * Custom storage engine for Zustand's persist middleware.
 * Uses idb-keyval to store state in IndexedDB instead of localStorage,
 * allowing for much larger storage capacity (crucial for offline-first lists).
 */
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get(name);
      return value || null;
    } catch (e) {
      console.warn(`[idbStorage] Failed to read ${name}`, e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (e) {
      console.warn(`[idbStorage] Failed to save ${name}`, e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (e) {
      console.warn(`[idbStorage] Failed to delete ${name}`, e);
    }
  },
};

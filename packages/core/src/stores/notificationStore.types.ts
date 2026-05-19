import { AppNotification } from '../validation';

export type { AppNotification };

export interface NotificationStore {
  notifications: AppNotification[];
  subscription: any | null;
  userId: string | null;
  isLoading: boolean;
  fetchNotifications: (userId: string, role?: string) => Promise<void>;
  playNotificationSound: (title?: string, body?: string, soundFile?: string) => void;
  subscribeToRealtime: (userId: string, role?: string, agentAccountType?: string) => Promise<void>;
  cleanup: () => void;
  addNotification: (title: string, body: string, type?: string, targetRole?: string, targetUser?: string | string[] | null, metadata?: Record<string, any>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string, app?: string) => Promise<void>;
  clearAll: () => Promise<void>;
  getUnreadCount: () => number;
  subscribeToPush: () => Promise<boolean>;
  saveSubscription: (userId: string, subscription: any) => Promise<boolean>;
  urlBase64ToUint8Array: (base64String: string) => Uint8Array;
}

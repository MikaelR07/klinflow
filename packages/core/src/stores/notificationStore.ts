/**
 * notificationStore.ts — Klinflow KE Cross-App Notifications (Supabase)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage } from '../offline';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';
import { toast } from 'sonner';
import { NotificationStore, AppNotification } from './notificationStore.types';
import { normalizeKeys, AppNotificationSchema, safeParseArray, safeParseOrNull } from '../validation';

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  REWARD: 'reward',
  INFO: 'info',
  CARGO: 'cargo',
  SECURITY: 'security',
  FACILITY: 'facility',
  SYSTEM: 'system'
} as const;

const parseSerializedMetadata = (n: any) => {
  if (n && n.body && typeof n.body === 'string' && n.body.includes('===METADATA===')) {
    const parts = n.body.split('\n\n===METADATA===\n');
    n.body = parts[0];
    try {
      n.metadata = JSON.parse(parts[1]);
    } catch (e) {
      console.error('[NotificationStore] Failed to parse serialized metadata:', e);
    }
  }
  return n;
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
  notifications: [],
  subscription: null,
  userId: null,
  isLoading: false,

  fetchNotifications: async (userId, role) => {
    set({ isLoading: true });
    const lastCleared = localStorage.getItem(`cf_nots_cleared_${userId}`) || '1970-01-01T00:00:00Z';
    
    try {
      // Fetch v2 notifications only
      const { data, error } = await supabase
        .from('notifications_v2')
        .select('*')
        .eq('recipient_id', userId)
        .gt('created_at', lastCleared)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        const rawMapped = data.map((n: any) => {
          const normalized = normalizeKeys(n);
          // Standardize content/body mapping
          normalized.content = normalized.body;
          normalized.read = normalized.isRead;
          return normalized;
        });
        
        const validNotifications = safeParseArray(AppNotificationSchema, rawMapped, 'Notifications Fetch');
        set({ notifications: validNotifications });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  playNotificationSound: (title?: string, body?: string, soundFile?: string) => {
    try {
      const isForeground = typeof document !== 'undefined' && document.visibilityState === 'visible';

      if (isForeground) {
        // Foreground: Play custom in-app mp3 sound with Web Audio synth fallback
        const audio = new Audio(soundFile || '/notification.mp3');
        audio.volume = 1.0;
        
        audio.play().catch(() => {
          // Web Audio API synth fallback for browser autoplay policy
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const playTone = (freq: number, start: number, dur: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + start);
                osc.stop(ctx.currentTime + start + dur);
              };
              playTone(587.33, 0, 0.15); // D5
              playTone(880.00, 0.12, 0.35); // A5
            }
          } catch (e) {}
        });

        // Also vibrate the device if supported
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      } else {
        // Background / Phone locked: Show browser native notification banner
        if ('Notification' in window && Notification.permission === 'granted') {
          const nativeNotif = new Notification(title || 'KlinFlow', {
            body: body || 'You have a new alert',
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: `kf-${Date.now()}`,
            silent: false,
          });
          setTimeout(() => nativeNotif.close(), 5000);
        }
      }
    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  },

  subscribeToRealtime: async (userId, role, agentAccountType?: string) => {
    if (!userId || userId === '00000000-0000-0000-0000-000000000000') return;

    // Persist userId in store for strict filtering
    set({ userId });

    const isCompanyAdmin = agentAccountType === 'company_admin';
    const existing = get().subscription;
    if (existing) {
      supabase.removeChannel(existing);
    }

    const myRole = (role || '').toLowerCase();
    const uniqueId = Math.random().toString(36).substring(7);
    const channelName = `user-notifs-${userId}-${uniqueId}`; 
    
    const subV2 = supabase.channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications_v2',
        filter: `recipient_id=eq.${userId}`
      }, async (payload: any) => {
        const rawN = payload.new;
        const normalized = normalizeKeys(rawN);
        normalized.content = normalized.body;
        normalized.read = false;
        normalized.isRead = false;
        
        const finalNotif = safeParseOrNull(AppNotificationSchema, normalized, 'Realtime V2 Insert');
        if (finalNotif) {
          set((state) => {
            if (state.notifications.some(notif => notif.id === finalNotif.id)) return state;
            return { notifications: [finalNotif, ...state.notifications].slice(0, 50) };
          });
          
          const isTradeEvent = finalNotif.category === 'marketplace';
          const isHubApp = myRole === 'hub';

          if (!isHubApp) {
              const soundFile = isTradeEvent ? '/notification-sound/seller-notification.mp3' : '/notification.mp3';
              get().playNotificationSound(finalNotif.title, finalNotif.content, soundFile);
          }
          
          const isForeground = typeof document !== 'undefined' && document.visibilityState === 'visible';
          if (isForeground) {
              const toastOptions = { description: finalNotif.content, duration: finalNotif.priority === 'critical' ? 8000 : 5000 };
              if (finalNotif.category === 'earnings' || finalNotif.category === 'rewards') {
                toast.success(finalNotif.title, toastOptions);
              } else if (finalNotif.category === 'system' || finalNotif.priority === 'high') {
                toast.warning(finalNotif.title, toastOptions);
              } else {
                toast(finalNotif.title, { ...toastOptions, icon: '🔔' });
              }
          }
        }
      })
      .subscribe();
    
    set({ subscription: subV2 });
  },

  cleanup: () => {
    const existing = get().subscription;
    if (existing) {
      supabase.removeChannel(existing);
      set({ subscription: null });
    }
  },

  addNotification: async (title, content, category = 'system', targetRole = 'all', targetUser = null, metadata = undefined) => {
    // V3: Frontend should not insert into notifications natively anymore (handled by backend triggers).
    // However, if we need to show a local fake notification:
    const id = `NT-${Date.now()}`;
    const localNotif: AppNotification = {
      id, title, content, body: content, category: category as any, priority: 'normal',
      isRead: false, read: false, archived: false, createdAt: new Date().toISOString(), metadata
    };
    set((state) => ({
      notifications: [localNotif, ...state.notifications].slice(0, 50),
    }));
  },

  markAsRead: async (id) => {
    await supabase.from('notifications_v2').update({ is_read: true }).eq('id', id);
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true, isRead: true } : n),
    }));
  },

  markAllAsRead: async (userId, app) => {
    const { notifications } = get();
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true, isRead: true })),
    }));
    
    await supabase.from('notifications_v2').update({ is_read: true }).in('id', unreadIds);
  },

  clearAll: async () => {
    const { userId } = useAuthStore.getState();
    const { notifications } = get();

    // Mark all unread as read in DB (non-destructive)
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase.from('notifications_v2').update({ is_read: true }).in('id', unreadIds);
    }

    // Save a "cleared at" timestamp — fetchNotifications already uses this
    // to filter out older notifications, so they won't reappear
    const now = new Date().toISOString();
    if (userId) {
      localStorage.setItem(`cf_nots_cleared_${userId}`, now);
    }

    // Clear local state (notifications stay safe in DB)
    set({ notifications: [] });
  },

  getUnreadCount: () => get().notifications.filter(n => !n.read).length,

  subscribeToPush: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      // Wrap SW ready in a timeout to prevent hanging the UI
      const swReadyPromise = navigator.serviceWorker.ready;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service Worker timeout')), 5000)
      );

      const registration = await Promise.race([swReadyPromise, timeoutPromise]) as ServiceWorkerRegistration;
      
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY; 
      if (!vapidPublicKey) {
        console.error('[Push] Missing VAPID Public Key');
        return false;
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: get().urlBase64ToUint8Array(vapidPublicKey) as any
      });

      return await get().saveSubscription(userId, subscription);
    } catch (err) {
      console.error('[Push] Subscription failed:', err);
      return false;
    }
  },

  saveSubscription: async (userId, subscription) => {
    const subJson = subscription.toJSON();
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
        device_type: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      } as any, { onConflict: 'endpoint' });

    return !error;
  },

  urlBase64ToUint8Array: (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}),
    {
      name: 'notification-store',
      storage: idbStorage as any,
      partialize: (state: any) => ({
        notifications: state.notifications.slice(0, 100) as any
      })
    }
  )
);

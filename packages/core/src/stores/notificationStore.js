/**
 * notificationStore.js — CleanFlow KE Cross-App Notifications (Supabase)
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient.js';
import { useAuthStore } from './authStore.js';
import { toast } from 'sonner';

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  REWARD: 'reward',
  INFO: 'info',
};

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  subscription: null,

  fetchNotifications: async (userId, role) => {
    const lastCleared = localStorage.getItem(`cf_nots_cleared_${userId}`) || '1970-01-01T00:00:00Z';
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`target_user.eq.${userId},target_role.eq.${(role || '').toLowerCase()},target_role.eq.all`)
      .gt('created_at', lastCleared)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      set({ notifications: data.map(n => ({ ...n, read: n.is_read })) });
    }
  },

  playNotificationSound: () => {
    try {
      const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_7314540449.mp3?filename=notification-sound-7062.mp3');
      audio.volume = 0.5;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.warn('[NotificationStore] Audio play deferred until user interaction.');
        });
      }
    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  },

  subscribeToRealtime: async (userId, role) => {
    // ── DEV BYPASS ──
    if (!userId || userId === '00000000-0000-0000-0000-000000000000') return;

    // ── CLEANUP PREVIOUS ──
    const existing = get().subscription;
    if (existing) {
      try {
        await supabase.removeChannel(existing);
      } catch (e) {
        console.warn('[NotificationStore] Cleanup failed:', e);
      }
      set({ subscription: null });
    }

    const myRole = (role || '').toLowerCase();
    const uniqueId = Math.random().toString(36).substring(7);
    const channelName = `user-notifs-${userId}-${uniqueId}`; 
    
    console.log('[NotificationStore] Opening Channel:', channelName);

    const sub = supabase.channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload) => {
        const n = payload.new;
        const targetRole = (n.target_role || '').toLowerCase();
        const targeted = n.target_user === userId || targetRole === myRole || targetRole === 'all';
        
        if (targeted) {
          set((state) => ({
            notifications: [{ ...n, read: false, is_read: false }, ...state.notifications].slice(0, 50),
          }));
          get().playNotificationSound();
          toast(n.title, { description: n.body });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[NotificationStore] Live alerts active for:', userId);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[NotificationStore] Realtime subscription error');
        }
      });
    
    set({ subscription: sub });
  },

  cleanup: () => {
    const existing = get().subscription;
    if (existing) {
      supabase.removeChannel(existing);
      set({ subscription: null });
    }
  },

  addNotification: async (title, body, type = NOTIFICATION_TYPES.INFO, targetRole = 'all', targetUser = null) => {
    // Normalize 'client' role to 'user' to match the auth system
    const normalizedRole = targetRole === 'client' ? 'user' : targetRole;

    const { error } = await supabase.from('notifications').insert({
      title,
      body,
      type,
      target_role: (normalizedRole || 'all').toLowerCase(),
      target_user: targetUser,
    });

    if (error) {
      console.error('[NotificationStore] INSERT ERROR:', error.message, error.details);
      // Fallback: Add to local list anyway so UI doesn't break
      const id = `NT-${Date.now()}`;
      set((state) => ({
        notifications: [
          { id, title, body, type, target_role: targetRole, is_read: false, created_at: new Date().toISOString(), read: false },
          ...state.notifications,
        ].slice(0, 50),
      }));
    }
  },

  markAsRead: async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true, is_read: true } : n),
    }));
  },

  markAllAsRead: async () => {
    const { notifications } = get();
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true, is_read: true })),
    }));
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
  },

  clearAll: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) {
      set({ notifications: [] });
      return;
    }
    await supabase.from('notifications').delete().eq('target_user', userId);
    const now = new Date().toISOString();
    localStorage.setItem(`cf_nots_cleared_${userId}`, now);
    set({ notifications: [] });
  },

  getUnreadCount: () => get().notifications.filter(n => !n.read).length,


  // ── WEB PUSH SYSTEM ────────────────────────────────────────────────
  subscribeToPush: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Push not supported or user not logged in');
      return false;
    }

    try {
      // 1. Request Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[Push] Permission not granted');
        return false;
      }

      // 2. Register Service Worker (Standard for PWAs)
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe to Push Service (Google/Apple/Mozilla)
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY; 
      
      if (!vapidPublicKey) {
        console.warn('[Push] No VAPID public key found in environment variables');
        return false;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: get().urlBase64ToUint8Array(vapidPublicKey)
      });

      // 4. Save to Database
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
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        device_type: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      }, { onConflict: 'endpoint' });

    if (error) {
      console.error('[Push] Failed to save subscription:', error);
      return false;
    }
    return true;
  },

  urlBase64ToUint8Array: (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}));

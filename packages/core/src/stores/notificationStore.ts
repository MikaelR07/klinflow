/**
 * notificationStore.ts — Klinflow KE Cross-App Notifications (Supabase)
 */
import { create } from 'zustand';
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

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  subscription: null,
  userId: null,
  isLoading: false,

  fetchNotifications: async (userId, role) => {
    set({ isLoading: true });
    const lastCleared = localStorage.getItem(`cf_nots_cleared_${userId}`) || '1970-01-01T00:00:00Z';
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`target_user.eq.${userId},target_role.eq.${(role || '').toLowerCase()},target_role.eq.all`)
        .gt('created_at', lastCleared)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        const rawMapped = data.map((n: any) => {
          const parsed = parseSerializedMetadata(n);
          const normalized = normalizeKeys(parsed);
          // Standardize content/body mapping
          normalized.content = normalized.content || normalized.body;
          normalized.read = normalized.isRead;
          return normalized;
        });
        
        const validNotifications = safeParseArray(AppNotificationSchema, rawMapped, 'Notifications Fetch');
        
        // Filter out missions for Company Admins in history
        const isCompanyAdmin = (useAuthStore.getState().profile as any)?.agentAccountType === 'company_admin';
        const filtered = isCompanyAdmin 
          ? validNotifications.filter(n => {
              const title = n.title?.toLowerCase() || '';
              return !title.includes('mission') && !title.includes('dispatch');
            })
          : validNotifications;

        set({ notifications: filtered });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  playNotificationSound: (title?: string, body?: string, soundFile?: string) => {
    try {
      const isForeground = typeof document !== 'undefined' && document.visibilityState === 'visible';

      if (isForeground) {
        // Foreground: Play custom in-app mp3 sound
        const audio = new Audio(soundFile || '/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});

        // Also vibrate the device if supported
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      } else {
        // Background / Phone locked: Show browser native notification banner which plays the user's OS native notification ringtone/chime
        if ('Notification' in window && Notification.permission === 'granted') {
          const nativeNotif = new Notification(title || 'KlinFlow', {
            body: body || 'You have a new alert',
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: `kf-${Date.now()}`, // Unique tag prevents stacking
            silent: false, // Explicitly request OS sound
          });
          // Auto-close native notification after 5 seconds
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
    
    const sub = supabase.channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, async (payload: any) => {
        const rawN = payload.new;
        const n = parseSerializedMetadata(rawN);
        const targetRole = (n.target_role || '').toLowerCase();
        const targetUser = n.target_user;
        
        const isMission = n.title?.toLowerCase().includes('mission') || n.title?.toLowerCase().includes('dispatch');
        const isTradePost = n.title?.toLowerCase().includes('material') || n.title?.toLowerCase().includes('trade');
        
        // 1. COMPLETELY IGNORE missions for company admins
        if (isMission && isCompanyAdmin) return;
 
        // 2. TARGETING LOGIC & NORMALIZATION
        // Normalize 'client' role to 'user' to ensure cross-app compatibility
        const normalizedTargetRole = targetRole === 'client' ? 'user' : targetRole;
        const normalizedMyRole = myRole === 'client' ? 'user' : myRole;
 
        const currentUserId = get().userId;
        const isDirectPing = targetUser && targetUser === currentUserId;
        const isRolePing = 
          normalizedTargetRole === normalizedMyRole || 
          normalizedTargetRole === 'all' ||
          (normalizedTargetRole === 'agent' && normalizedMyRole === 'driver'); // Drivers are also targeted by Agent alerts
        
         let shouldProcess = isDirectPing || isRolePing;
 
         // 3. MATERIAL FILTERING (For open market missions & B2B trade posts)
         // NOTE: The agent config page saves WASTE_CATEGORIES[].id (e.g. 'recyclable' for plastic),
         // but the seller PostTrade sends DB waste_categories.slug (e.g. 'plastic').
         // We use a bidirectional alias map to bridge this naming drift.
         if (shouldProcess && !isDirectPing && (isMission || isTradePost) && n.metadata?.wasteType && (normalizedMyRole === 'agent' || normalizedMyRole === 'driver')) {
             try {
                 const { useAgentStore } = await import('./agentStore');
                 const accepted = (useAgentStore.getState().agentConfig?.accepted_materials || []) as any[];
                 if (accepted.length > 0) {
                     const wasteLower = String(n.metadata.wasteType).toLowerCase();

                     // Bidirectional alias map: maps between WASTE_CATEGORIES IDs and DB slugs/labels
                     const MATERIAL_ALIASES: Record<string, string[]> = {
                       'recyclable': ['plastic', 'plastics', 'pet', 'hdpe', 'ldpe', 'pp', 'mixed_plastic'],
                       'plastic': ['recyclable'],
                       'metal': ['aluminium', 'copper', 'steel', 'brass', 'scrap'],
                       'ewaste': ['e-waste', 'electronics', 'batteries', 'cables', 'screens', 'logic_boards'],
                       'paper': ['cardboard', 'newsprint', 'office_paper'],
                       'glass': ['clear_glass', 'colored_glass'],
                       'organic': ['food_scraps', 'green_waste', 'compost'],
                       'general': ['household_trash', 'mixed', 'general_waste'],
                     };

                     const isAccepted = accepted.some(mat => {
                       const matLower = String(mat).toLowerCase();
                       // Direct match
                       if (matLower === wasteLower) return true;
                       // Check if the incoming wasteType is an alias of any accepted material
                       const aliases = MATERIAL_ALIASES[matLower] || [];
                       return aliases.includes(wasteLower);
                     });

                     if (!isAccepted) {
                         shouldProcess = false; // Ignore notification — material not accepted
                     }
                 }
             } catch (e) {}
         }
        
        // A notification is valid if it's specifically for ME OR generally for my ROLE
        if (shouldProcess) {
          const normalized = normalizeKeys(n);
          normalized.content = normalized.content || normalized.body;
          normalized.read = false;
          normalized.isRead = false;
          
          const finalNotif = safeParseOrNull(AppNotificationSchema, normalized, 'Realtime Notification Insert');
          
          if (finalNotif) {
            set((state) => {
              if (state.notifications.some(notif => notif.id === finalNotif.id)) {
                return state; // Deduplicate
              }
              return {
                notifications: [finalNotif, ...state.notifications].slice(0, 50)
              };
            });
            
            // Handle sound and OS notification popup intelligently based on visibility
            const isTradeEvent = finalNotif.title?.toLowerCase().includes('offer') || 
                                 finalNotif.title?.toLowerCase().includes('order') ||
                                 finalNotif.title?.toLowerCase().includes('material') || 
                                 finalNotif.title?.toLowerCase().includes('trade');
            const soundFile = isTradeEvent ? '/notification-sound/seller-notification.mp3' : '/notification.mp3';
            get().playNotificationSound(finalNotif.title, finalNotif.content, soundFile);
            
            // Only trigger high-visibility green/red Sonner toasts when the app is actively open in the foreground
            const isForeground = typeof document !== 'undefined' && document.visibilityState === 'visible';
            if (isForeground) {
              const toastOptions = {
                description: finalNotif.content,
                duration: isMission ? 8000 : 5000,
                icon: isMission ? '🚛' : undefined
              };

              // High-visibility toasts for successes/rewards/missions
              if (isMission || finalNotif.type === 'success' || finalNotif.type === 'reward') {
                toast.success(finalNotif.title, toastOptions);
              } else if (finalNotif.type === 'warning') {
                toast.error(finalNotif.title, toastOptions);
              } else {
                toast(finalNotif.title, { ...toastOptions, icon: '🔔' });
              }
            }
          }
        }
      })
      .subscribe();
    
    set({ subscription: sub });
  },

  cleanup: () => {
    const existing = get().subscription;
    if (existing) {
      supabase.removeChannel(existing);
      set({ subscription: null });
    }
  },

  addNotification: async (title, content, type = NOTIFICATION_TYPES.INFO, targetRole = 'all', targetUser = null, metadata = undefined) => {
    const normalizedRole = targetRole === 'client' ? 'user' : targetRole;

    const serializeBody = (bodyContent: string, meta?: any) => {
      if (!meta) return bodyContent;
      return `${bodyContent}\n\n===METADATA===\n${JSON.stringify(meta)}`;
    };

    const insertData = Array.isArray(targetUser) ? targetUser.map(uid => ({
      title,
      body: serializeBody(content, metadata),
      type,
      target_role: (normalizedRole || 'all').toLowerCase(),
      target_user: uid
    })) : [{
      title,
      body: serializeBody(content, metadata),
      type,
      target_role: (normalizedRole || 'all').toLowerCase(),
      target_user: targetUser
    }];

    const { error } = await supabase.from('notifications').insert(insertData as any);

    if (error) {
      console.error('[NotificationStore] INSERT ERROR:', error.message);
      // Fallback local notification
      const id = `NT-${Date.now()}`;
      const localNotif: AppNotification = {
        id, title, content, type: type as any, 
        isRead: false, read: false, createdAt: new Date().toISOString()
      };
      set((state) => ({
        notifications: [localNotif, ...state.notifications].slice(0, 50),
      }));
    }
  },

  markAsRead: async (id) => {
    await supabase.from('notifications').update({ is_read: true } as any).eq('id', id);
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
    
    await supabase.from('notifications').update({ is_read: true } as any).in('id', unreadIds);
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
}));

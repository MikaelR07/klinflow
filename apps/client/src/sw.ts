/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// ── 1. PRECACHE ASSETS ──
// This tells Workbox to cache the assets built by Vite
precacheAndRoute(self.__WB_MANIFEST);

// ── 2. WEB PUSH LISTENER ──
// This is the core logic that handles background notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[Service Worker] Push event received with no data.');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data received:', data);

    const title = data.title || 'Klinflow Alert';
    const options = {
      body: data.body || 'You have a new update.',
      icon: '/logo.png', // Ensure this exists in your public folder
      badge: '/icons/icon-192.png',
      data: {
        url: data.data?.url || '/'
      },
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'View Details' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('[Service Worker] Error parsing push data:', err);
  }
});

// ── 3. NOTIFICATION CLICK HANDLER ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients: any) => {
      // If a window is already open, focus it and navigate
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// ── 4. HANDLE SERVICE WORKER UPDATES ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

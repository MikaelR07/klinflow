/// <reference lib="webworker" />

import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// ── 1. PRECACHE ASSETS ──
// This tells Workbox to cache the assets built by Vite
precacheAndRoute(self.__WB_MANIFEST);

// Fallback to index.html for Single Page App (SPA) routing when offline
import { RouteHandlerCallback } from 'workbox-core';
let navHandler;
try {
  navHandler = createHandlerBoundToURL('/index.html');
} catch (e) {
  console.log('Using NetworkFirst for navigation (dev mode fallback)');
  const strategy = new NetworkFirst({ cacheName: 'dev-nav-cache' });
  navHandler = async (options: any) => strategy.handle(options);
}
registerRoute(new NavigationRoute(navHandler));

// ── 1.5 RUNTIME CACHING & BACKGROUND SYNC ──
const bgSyncPlugin = new BackgroundSyncPlugin('klinflow-mutation-queue', {
  maxRetentionTime: 24 * 60 // Retry for up to 24 hours
});

// Cache API GET requests for offline read access
registerRoute(
  ({ url, request }) => url.href.includes('supabase.co/rest/v1') && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'supabase-api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 })
    ],
  })
);

// Apply Background Sync to API Mutations
registerRoute(
  ({ url, request }) => url.href.includes('supabase.co/rest/v1') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
  new NetworkOnly({
    plugins: [bgSyncPlugin]
  })
);

// Cache Supabase Storage images
registerRoute(
  ({ url }) => url.href.includes('supabase.co/storage/v1/object/public'),
  new StaleWhileRevalidate({
    cacheName: 'supabase-image-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

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

import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// ── 1. PRECACHE ASSETS ──
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
const bgSyncPlugin = new BackgroundSyncPlugin('klinflow-agent-mutation-queue', {
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

// ── 2. WEB PUSH LISTENER (Agent Specific) ──
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    console.log('[Agent SW] Push received:', data);

    const title = data.title || 'Klinflow Mission';
    const options = {
      body: data.body || 'You have a new task.',
      icon: '/logo.png',
      badge: '/icons/icon-192.png',
      data: {
        url: data.data?.url || '/'
      },
      vibrate: [200, 100, 200, 100, 200], // Stronger vibration for agents
      tag: 'mission-alert',
      actions: [
        { action: 'open', title: 'Open Radar' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('[Agent SW] Push parsing failed:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

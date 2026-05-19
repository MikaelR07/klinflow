import { precacheAndRoute } from 'workbox-precaching';

// ── 1. PRECACHE ASSETS ──
precacheAndRoute(self.__WB_MANIFEST);

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

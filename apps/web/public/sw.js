/**
 * HIVE Service Worker
 *
 * Provides:
 * - Offline caching for app shell
 * - Background sync for messages
 * - Push notification handling
 * - Cache-first strategy for static assets
 * - Network-first strategy for API calls
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `hive-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `hive-dynamic-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/assets/hive-logo-gold.svg',
  '/assets/hive-logo-white.svg',
  '/assets/hive-logo-black.svg',
];

// API routes that should use network-first strategy
const API_ROUTES = ['/api/'];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Pre-cache failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('hive-') &&
                     name !== STATIC_CACHE &&
                     name !== DYNAMIC_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Network-first for API routes
  if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets
  event.respondWith(cacheFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return offline fallback if available
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }

    throw error;
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful GET responses
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Handle skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
});

// Push notification handler (supports both FCM and generic push)
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();

    // FCM sends notifications under data.notification and data.data
    const notification = data.notification || data;
    const extraData = data.data || {};

    // Build action URL from FCM data or fcmOptions
    const actionUrl = data.fcmOptions?.link
      || extraData.actionUrl
      || notification.click_action
      || data.url
      || '/me/notifications';

    // Use notification type for tag deduplication
    const tag = extraData.type
      ? `hive-${extraData.type}-${Date.now()}`
      : (data.tag || `hive-notification-${Date.now()}`);

    const options = {
      body: notification.body || 'New notification from HIVE',
      icon: notification.image || notification.icon || '/assets/hive-logo-gold.svg',
      badge: '/assets/hive-logo-gold.svg',
      tag,
      data: {
        url: actionUrl,
        ...extraData,
      },
      actions: data.actions || [],
      requireInteraction: extraData.type === 'mention' || extraData.type === 'event_reminder',
      vibrate: [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification(notification.title || 'HIVE', options)
    );
  } catch (error) {
    console.error('[SW] Push notification error:', error);

    // Fallback: try showing raw text
    try {
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('HIVE', {
          body: text,
          icon: '/assets/hive-logo-gold.svg',
        })
      );
    } catch (fallbackError) {
      console.error('[SW] Push fallback failed:', fallbackError);
    }
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync handler
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Sync queued messages
async function syncMessages() {
  // This would typically fetch queued messages from IndexedDB
  // and send them to the server
  console.log('[SW] Syncing messages...');
}

console.log('[SW] Service worker loaded');

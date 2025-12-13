/**
 * HIVE Service Worker
 *
 * Provides offline support through:
 * - Cache-first for static assets
 * - Network-first for API calls with offline fallback
 * - Background sync for failed mutations
 * - Push notification handling
 */

// Cache version - increment to invalidate all caches
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `hive-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `hive-dynamic-${CACHE_VERSION}`;
const API_CACHE = `hive-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `hive-images-${CACHE_VERSION}`;

// Static assets to precache (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  // Add more static assets as needed
];

// API routes to cache for offline
const CACHEABLE_API_ROUTES = [
  '/api/spaces/browse',
  '/api/spaces/mine',
  '/api/profile/',
  '/api/feed',
];

// Max cache sizes
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_API_CACHE_SIZE = 30;
const MAX_IMAGE_CACHE_SIZE = 100;

// Cache expiration (24 hours for API, 7 days for images)
const API_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// =============================================================================
// Install Event - Precache static assets
// =============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Force activation without waiting
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// =============================================================================
// Activate Event - Clean up old caches
// =============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old version caches
              return name.startsWith('hive-') && !name.includes(CACHE_VERSION);
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// =============================================================================
// Fetch Event - Cache strategies
// =============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (handle them with background sync instead)
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Determine caching strategy based on request type
  if (isApiRequest(url)) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstWithNetwork(request, IMAGE_CACHE, IMAGE_CACHE_MAX_AGE));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
  } else {
    event.respondWith(networkFirstWithOfflineFallback(request));
  }
});

// =============================================================================
// Caching Strategies
// =============================================================================

/**
 * Network First with Cache fallback
 * Used for API requests - always try network first, fall back to cache
 */
async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Only cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      // Clone response before caching (response can only be read once)
      cache.put(request, networkResponse.clone());

      // Limit cache size
      limitCacheSize(cacheName, MAX_API_CACHE_SIZE);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline JSON response for API
    return new Response(
      JSON.stringify({
        success: false,
        error: 'You are offline. This data is not available.',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Cache First with Network fallback
 * Used for static assets and images - prefer cache, update in background
 */
async function cacheFirstWithNetwork(request, cacheName, maxAge = null) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Check if cache is still fresh (if maxAge specified)
    if (maxAge) {
      const cachedDate = cachedResponse.headers.get('sw-cached-date');
      if (cachedDate) {
        const age = Date.now() - parseInt(cachedDate, 10);
        if (age > maxAge) {
          // Cache is stale, fetch fresh in background
          fetchAndCache(request, cacheName);
        }
      }
    }
    return cachedResponse;
  }

  // Not in cache, fetch from network
  return fetchAndCache(request, cacheName);
}

/**
 * Network First with Offline page fallback
 * Used for navigation requests
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful navigation responses
    if (networkResponse.ok && request.mode === 'navigate') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation offline, checking cache:', request.url);

    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If it's a navigation request, show offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline');
      if (offlinePage) {
        return offlinePage;
      }
    }

    // Generic offline response
    return new Response('You are offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Helper: Fetch and cache a request
 */
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(cacheName);

      // Add custom header for cache date
      const responseWithDate = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });
      responseWithDate.headers.append('sw-cached-date', Date.now().toString());

      cache.put(request, responseWithDate.clone());

      // Limit cache size
      if (cacheName === IMAGE_CACHE) {
        limitCacheSize(cacheName, MAX_IMAGE_CACHE_SIZE);
      }
    }

    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isImageRequest(url) {
  return (
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i) ||
    url.hostname === 'storage.googleapis.com' ||
    url.hostname === 'firebasestorage.googleapis.com' ||
    url.hostname === 'api.dicebear.com'
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i)
  );
}

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    // Delete oldest entries (first in the list)
    const deleteCount = keys.length - maxSize;
    for (let i = 0; i < deleteCount; i++) {
      cache.delete(keys[i]);
    }
  }
}

// =============================================================================
// Background Sync - Queue failed mutations using IndexedDB
// =============================================================================

const SYNC_TAG = 'hive-background-sync';
const SYNC_DB_NAME = 'hive_sync_queue';
const SYNC_STORE_NAME = 'pending_requests';

/**
 * Open the sync queue IndexedDB database
 */
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        const store = db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Add a request to the sync queue
 */
async function addToSyncQueue(requestData) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SYNC_STORE_NAME);

    const data = {
      ...requestData,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const request = store.add(data);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log('[SW] Added to sync queue:', requestData.url);
      resolve(request.result);
    };
  });
}

/**
 * Get all pending requests from the sync queue
 */
async function getSyncQueue() {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SYNC_STORE_NAME, 'readonly');
    const store = transaction.objectStore(SYNC_STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Remove a request from the sync queue
 */
async function removeFromSyncQueue(id) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SYNC_STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Update retry count for a request
 */
async function updateRetryCount(id, retryCount) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SYNC_STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const data = getRequest.result;
      if (data) {
        data.retryCount = retryCount;
        store.put(data);
      }
      resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Handle background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === SYNC_TAG) {
    event.waitUntil(processSyncQueue());
  }
});

// Periodic sync for browsers that support it
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);

  if (event.tag === 'hive-periodic-sync') {
    event.waitUntil(processSyncQueue());
  }
});

/**
 * Process all pending requests in the sync queue
 */
async function processSyncQueue() {
  console.log('[SW] Processing sync queue...');

  const MAX_RETRIES = 3;
  const pendingRequests = await getSyncQueue();

  if (pendingRequests.length === 0) {
    console.log('[SW] Sync queue is empty');
    return;
  }

  console.log(`[SW] Found ${pendingRequests.length} pending requests`);

  let successCount = 0;
  let failCount = 0;

  for (const requestData of pendingRequests) {
    try {
      const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: requestData.headers,
        body: requestData.body,
        credentials: 'include',
      });

      if (response.ok) {
        await removeFromSyncQueue(requestData.id);
        successCount++;
        console.log('[SW] Synced request:', requestData.url);

        // Notify clients of successful sync
        notifyClients({
          type: 'SYNC_SUCCESS',
          requestId: requestData.id,
          url: requestData.url,
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('[SW] Sync failed for:', requestData.url, error);
      failCount++;

      const newRetryCount = (requestData.retryCount || 0) + 1;

      if (newRetryCount >= MAX_RETRIES) {
        // Too many retries, remove and notify failure
        await removeFromSyncQueue(requestData.id);
        notifyClients({
          type: 'SYNC_FAILED',
          requestId: requestData.id,
          url: requestData.url,
          error: error.message,
        });
      } else {
        // Update retry count
        await updateRetryCount(requestData.id, newRetryCount);
      }
    }
  }

  console.log(`[SW] Sync complete: ${successCount} succeeded, ${failCount} failed`);

  // Notify clients of overall sync status
  notifyClients({
    type: 'SYNC_COMPLETE',
    success: successCount,
    failed: failCount,
  });
}

/**
 * Register a sync when a mutation fails due to being offline
 */
async function registerBackgroundSync(requestData) {
  // Add to IndexedDB queue
  await addToSyncQueue(requestData);

  // Register for background sync if available
  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register(SYNC_TAG);
      console.log('[SW] Background sync registered');
    } catch (error) {
      console.error('[SW] Failed to register sync:', error);
    }
  }
}

/**
 * Notify all clients of sync events
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((client) => {
    client.postMessage(message);
  });
}

// =============================================================================
// Push Notifications
// =============================================================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = { title: 'HIVE', body: 'You have a new notification' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.actions || [],
    tag: data.tag || 'hive-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');

  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
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

// =============================================================================
// Message Handler - Communication with main thread
// =============================================================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(DYNAMIC_CACHE).then((cache) => {
      cache.addAll(urls);
    });
  }

  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.startsWith('hive-')) {
          caches.delete(name);
        }
      });
    });
  }

  // Queue a request for background sync
  if (event.data.type === 'QUEUE_REQUEST') {
    const { url, method, headers, body } = event.data;
    registerBackgroundSync({ url, method, headers, body })
      .then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
      .catch((error) => {
        event.ports[0]?.postMessage({ success: false, error: error.message });
      });
  }

  // Manually trigger sync (for testing or when coming back online)
  if (event.data.type === 'TRIGGER_SYNC') {
    processSyncQueue()
      .then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
      .catch((error) => {
        event.ports[0]?.postMessage({ success: false, error: error.message });
      });
  }

  // Get sync queue status
  if (event.data.type === 'GET_SYNC_STATUS') {
    getSyncQueue()
      .then((queue) => {
        event.ports[0]?.postMessage({ pending: queue.length, items: queue });
      })
      .catch((error) => {
        event.ports[0]?.postMessage({ pending: 0, error: error.message });
      });
  }
});

console.log('[SW] Service worker loaded');

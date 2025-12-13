/**
 * Background Sync Client
 *
 * Client-side helper for interacting with the service worker's background sync.
 * Queues failed requests and triggers sync when back online.
 */

export interface QueuedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export interface SyncStatus {
  pending: number;
  items: Array<QueuedRequest & { id: number; timestamp: number; retryCount: number }>;
}

/**
 * Send a message to the service worker and wait for a response
 */
async function sendMessageToSW<T>(message: Record<string, unknown>): Promise<T> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service worker not supported');
  }

  const registration = await navigator.serviceWorker.ready;
  if (!registration.active) {
    throw new Error('No active service worker');
  }

  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();

    channel.port1.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data as T);
      }
    };

    if (!registration.active) {
      reject(new Error('Service worker not active'));
      return;
    }
    registration.active.postMessage(message, [channel.port2]);

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Service worker message timeout'));
    }, 10000);
  });
}

/**
 * Queue a request for background sync
 *
 * Use this when a mutation fails due to being offline.
 * The request will be retried when connectivity is restored.
 */
export async function queueForSync(request: QueuedRequest): Promise<boolean> {
  try {
    const result = await sendMessageToSW<{ success: boolean }>({
      type: 'QUEUE_REQUEST',
      ...request,
    });
    return result.success;
  } catch (error) {
    console.error('[BackgroundSync] Failed to queue request:', error);
    return false;
  }
}

/**
 * Manually trigger background sync
 *
 * Call this when coming back online or for testing.
 */
export async function triggerSync(): Promise<boolean> {
  try {
    const result = await sendMessageToSW<{ success: boolean }>({
      type: 'TRIGGER_SYNC',
    });
    return result.success;
  } catch (error) {
    console.error('[BackgroundSync] Failed to trigger sync:', error);
    return false;
  }
}

/**
 * Get the current sync queue status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    return await sendMessageToSW<SyncStatus>({
      type: 'GET_SYNC_STATUS',
    });
  } catch (error) {
    console.error('[BackgroundSync] Failed to get sync status:', error);
    return { pending: 0, items: [] };
  }
}

/**
 * Register for background sync (if supported)
 */
export async function registerBackgroundSync(tag: string = 'hive-background-sync'): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('sync' in window)) {
    console.warn('[BackgroundSync] Background sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-expect-error - sync is not in the types yet
    await registration.sync.register(tag);
    console.log('[BackgroundSync] Registered for:', tag);
    return true;
  } catch (error) {
    console.error('[BackgroundSync] Failed to register:', error);
    return false;
  }
}

/**
 * Register for periodic background sync (if supported)
 *
 * Note: This requires permission and is only supported in Chrome.
 */
export async function registerPeriodicSync(
  tag: string = 'hive-periodic-sync',
  minInterval: number = 12 * 60 * 60 * 1000 // 12 hours
): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if periodic sync is supported
    if (!('periodicSync' in registration)) {
      console.warn('[BackgroundSync] Periodic sync not supported');
      return false;
    }

    // Check permission
    const status = await navigator.permissions.query({
      // @ts-expect-error - periodic-background-sync is not in the types yet
      name: 'periodic-background-sync',
    });

    if (status.state !== 'granted') {
      console.warn('[BackgroundSync] Periodic sync permission not granted');
      return false;
    }

    // @ts-expect-error - periodicSync is not in the types yet
    await registration.periodicSync.register(tag, {
      minInterval,
    });

    console.log('[BackgroundSync] Registered periodic sync:', tag);
    return true;
  } catch (error) {
    console.error('[BackgroundSync] Failed to register periodic sync:', error);
    return false;
  }
}

/**
 * Create a fetch wrapper that automatically queues failed requests
 *
 * Use this for mutations that should be retried when offline.
 */
export function createOfflineFetch(baseUrl: string = '') {
  return async function offlineFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const fullUrl = baseUrl + url;
    const method = options.method || 'GET';

    // Only queue mutating requests
    const shouldQueue = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

    try {
      const response = await fetch(fullUrl, {
        ...options,
        credentials: 'include',
      });

      return response;
    } catch (error) {
      // If offline and this is a mutation, queue for later
      if (!navigator.onLine && shouldQueue) {
        console.log('[BackgroundSync] Offline - queuing request:', fullUrl);

        const headers: Record<string, string> = {};
        if (options.headers) {
          if (options.headers instanceof Headers) {
            options.headers.forEach((value, key) => {
              headers[key] = value;
            });
          } else if (Array.isArray(options.headers)) {
            options.headers.forEach(([key, value]) => {
              headers[key] = value;
            });
          } else {
            Object.assign(headers, options.headers);
          }
        }

        const queued = await queueForSync({
          url: fullUrl,
          method,
          headers,
          body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body),
        });

        if (queued) {
          // Return a synthetic response indicating the request was queued
          return new Response(
            JSON.stringify({
              success: true,
              queued: true,
              message: 'Request queued for background sync',
            }),
            {
              status: 202,
              statusText: 'Accepted',
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      // Re-throw if we couldn't queue or it's not a mutation
      throw error;
    }
  };
}

/**
 * Listen for sync events from the service worker
 */
export function onSyncEvent(
  callback: (event: { type: string; [key: string]: unknown }) => void
): () => void {
  if (!('serviceWorker' in navigator)) {
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    if (
      event.data &&
      typeof event.data === 'object' &&
      ['SYNC_SUCCESS', 'SYNC_FAILED', 'SYNC_COMPLETE'].includes(event.data.type)
    ) {
      callback(event.data);
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}

/**
 * Offline Storage Service
 *
 * IndexedDB-based storage for offline data persistence.
 * Stores spaces, feed items, profile data, and pending mutations.
 */

const DB_NAME = 'hive_offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
  SPACES: 'spaces',
  FEED: 'feed',
  PROFILE: 'profile',
  PENDING_MUTATIONS: 'pending_mutations',
  CACHE_META: 'cache_meta',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

// Types for stored data
export interface CachedSpace {
  id: string;
  name: string;
  description?: string;
  category: string;
  memberCount: number;
  imageUrl?: string;
  bannerUrl?: string;
  isJoined: boolean;
  cachedAt: number;
}

export interface CachedFeedItem {
  id: string;
  type: 'post' | 'event' | 'announcement';
  spaceId: string;
  spaceName: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
  cachedAt: number;
}

export interface CachedProfile {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;
  campusId: string;
  cachedAt: number;
}

export interface PendingMutation {
  id: string;
  type: 'join_space' | 'leave_space' | 'create_post' | 'send_message' | 'rsvp_event';
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export interface CacheMeta {
  key: string;
  lastUpdated: number;
  expiresAt: number;
}

// IndexedDB instance
let db: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initOfflineStorage(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Spaces store
      if (!database.objectStoreNames.contains(STORES.SPACES)) {
        const spacesStore = database.createObjectStore(STORES.SPACES, { keyPath: 'id' });
        spacesStore.createIndex('category', 'category', { unique: false });
        spacesStore.createIndex('isJoined', 'isJoined', { unique: false });
        spacesStore.createIndex('cachedAt', 'cachedAt', { unique: false });
      }

      // Feed store
      if (!database.objectStoreNames.contains(STORES.FEED)) {
        const feedStore = database.createObjectStore(STORES.FEED, { keyPath: 'id' });
        feedStore.createIndex('spaceId', 'spaceId', { unique: false });
        feedStore.createIndex('createdAt', 'createdAt', { unique: false });
        feedStore.createIndex('cachedAt', 'cachedAt', { unique: false });
      }

      // Profile store
      if (!database.objectStoreNames.contains(STORES.PROFILE)) {
        database.createObjectStore(STORES.PROFILE, { keyPath: 'id' });
      }

      // Pending mutations store
      if (!database.objectStoreNames.contains(STORES.PENDING_MUTATIONS)) {
        const mutationsStore = database.createObjectStore(STORES.PENDING_MUTATIONS, { keyPath: 'id' });
        mutationsStore.createIndex('type', 'type', { unique: false });
        mutationsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Cache metadata store
      if (!database.objectStoreNames.contains(STORES.CACHE_META)) {
        database.createObjectStore(STORES.CACHE_META, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Get the database instance, initializing if needed
 */
async function getDB(): Promise<IDBDatabase> {
  if (!db) {
    await initOfflineStorage();
  }
  if (!db) {
    throw new Error('Failed to initialize offline storage');
  }
  return db;
}

/**
 * Generic get operation
 */
export async function get<T>(storeName: StoreName, key: string): Promise<T | undefined> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T | undefined);
  });
}

/**
 * Generic put operation
 */
export async function put<T>(storeName: StoreName, data: T): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Generic delete operation
 */
export async function remove(storeName: StoreName, key: string): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get all items from a store
 */
export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T[]);
  });
}

/**
 * Get items by index
 */
export async function getByIndex<T>(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T[]);
  });
}

/**
 * Clear a store
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Bulk put operation
 */
export async function putMany<T>(storeName: StoreName, items: T[]): Promise<void> {
  const database = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();

    for (const item of items) {
      store.put(item);
    }
  });
}

// =============================================================================
// High-level API for specific data types
// =============================================================================

/**
 * Cache spaces for offline access
 */
export async function cacheSpaces(spaces: CachedSpace[]): Promise<void> {
  const now = Date.now();
  const spacesWithTimestamp = spaces.map((s) => ({ ...s, cachedAt: now }));
  await putMany(STORES.SPACES, spacesWithTimestamp);

  // Update cache meta
  await put(STORES.CACHE_META, {
    key: 'spaces',
    lastUpdated: now,
    expiresAt: now + 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get cached spaces
 */
export async function getCachedSpaces(): Promise<CachedSpace[]> {
  return getAll<CachedSpace>(STORES.SPACES);
}

/**
 * Get joined spaces from cache
 */
export async function getCachedJoinedSpaces(): Promise<CachedSpace[]> {
  return getByIndex<CachedSpace>(STORES.SPACES, 'isJoined', 1);
}

/**
 * Cache feed items
 */
export async function cacheFeedItems(items: CachedFeedItem[]): Promise<void> {
  const now = Date.now();
  const itemsWithTimestamp = items.map((i) => ({ ...i, cachedAt: now }));
  await putMany(STORES.FEED, itemsWithTimestamp);

  await put(STORES.CACHE_META, {
    key: 'feed',
    lastUpdated: now,
    expiresAt: now + 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Get cached feed items
 */
export async function getCachedFeed(): Promise<CachedFeedItem[]> {
  const items = await getAll<CachedFeedItem>(STORES.FEED);
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Cache user profile
 */
export async function cacheProfile(profile: CachedProfile): Promise<void> {
  await put(STORES.PROFILE, { ...profile, cachedAt: Date.now() });
}

/**
 * Get cached profile
 */
export async function getCachedProfile(userId: string): Promise<CachedProfile | undefined> {
  return get<CachedProfile>(STORES.PROFILE, userId);
}

/**
 * Add a pending mutation to be synced when online
 */
export async function addPendingMutation(
  type: PendingMutation['type'],
  payload: Record<string, unknown>
): Promise<string> {
  const id = `mutation_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const mutation: PendingMutation = {
    id,
    type,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
  };
  await put(STORES.PENDING_MUTATIONS, mutation);
  return id;
}

/**
 * Get all pending mutations
 */
export async function getPendingMutations(): Promise<PendingMutation[]> {
  const mutations = await getAll<PendingMutation>(STORES.PENDING_MUTATIONS);
  return mutations.sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Remove a pending mutation (after successful sync)
 */
export async function removePendingMutation(id: string): Promise<void> {
  await remove(STORES.PENDING_MUTATIONS, id);
}

/**
 * Update a pending mutation (e.g., increment retry count)
 */
export async function updatePendingMutation(
  id: string,
  updates: Partial<PendingMutation>
): Promise<void> {
  const existing = await get<PendingMutation>(STORES.PENDING_MUTATIONS, id);
  if (existing) {
    await put(STORES.PENDING_MUTATIONS, { ...existing, ...updates });
  }
}

/**
 * Check if cache is still valid
 */
export async function isCacheValid(key: string): Promise<boolean> {
  const meta = await get<CacheMeta>(STORES.CACHE_META, key);
  if (!meta) return false;
  return Date.now() < meta.expiresAt;
}

/**
 * Get cache age in milliseconds
 */
export async function getCacheAge(key: string): Promise<number | null> {
  const meta = await get<CacheMeta>(STORES.CACHE_META, key);
  if (!meta) return null;
  return Date.now() - meta.lastUpdated;
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  await Promise.all([
    clearStore(STORES.SPACES),
    clearStore(STORES.FEED),
    clearStore(STORES.PROFILE),
    clearStore(STORES.CACHE_META),
    // Note: We don't clear pending mutations - those should sync first
  ]);
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
  const database = await getDB();
  const now = Date.now();

  // Get all cache meta entries
  const allMeta = await getAll<CacheMeta>(STORES.CACHE_META);

  for (const meta of allMeta) {
    if (now > meta.expiresAt) {
      // Clear the associated store
      if (meta.key === 'spaces') {
        await clearStore(STORES.SPACES);
      } else if (meta.key === 'feed') {
        await clearStore(STORES.FEED);
      }
      await remove(STORES.CACHE_META, meta.key);
    }
  }
}

/**
 * Get storage stats
 */
export async function getStorageStats(): Promise<{
  spaces: number;
  feed: number;
  pendingMutations: number;
}> {
  const [spaces, feed, mutations] = await Promise.all([
    getAll(STORES.SPACES),
    getAll(STORES.FEED),
    getAll(STORES.PENDING_MUTATIONS),
  ]);

  return {
    spaces: spaces.length,
    feed: feed.length,
    pendingMutations: mutations.length,
  };
}

'use client';

/**
 * useOfflineStorage Hook
 *
 * React hook for interacting with IndexedDB offline storage.
 * Provides caching, retrieval, and sync status management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnlineStatus } from './use-pwa';
import {
  initOfflineStorage,
  cacheSpaces,
  getCachedSpaces,
  cacheFeedItems,
  getCachedFeed,
  cacheProfile,
  getCachedProfile,
  addPendingMutation,
  getPendingMutations,
  removePendingMutation,
  updatePendingMutation,
  isCacheValid,
  getStorageStats,
  clearExpiredCache,
  type CachedSpace,
  type CachedFeedItem,
  type CachedProfile,
  type PendingMutation,
} from '@/lib/offline-storage';

// Export types for consumers
export type { CachedSpace, CachedFeedItem, CachedProfile, PendingMutation };

interface OfflineStorageState {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  stats: {
    spaces: number;
    feed: number;
    pendingMutations: number;
  };
}

interface OfflineStorageActions {
  // Spaces
  cacheSpaces: (spaces: CachedSpace[]) => Promise<void>;
  getCachedSpaces: () => Promise<CachedSpace[]>;

  // Feed
  cacheFeed: (items: CachedFeedItem[]) => Promise<void>;
  getCachedFeed: () => Promise<CachedFeedItem[]>;

  // Profile
  cacheProfile: (profile: CachedProfile) => Promise<void>;
  getCachedProfile: (userId: string) => Promise<CachedProfile | undefined>;

  // Mutations
  queueMutation: (
    type: PendingMutation['type'],
    payload: Record<string, unknown>
  ) => Promise<string>;
  getPendingMutations: () => Promise<PendingMutation[]>;
  completeMutation: (id: string) => Promise<void>;
  failMutation: (id: string, error: string) => Promise<void>;

  // Utilities
  isCacheValid: (key: string) => Promise<boolean>;
  refreshStats: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export function useOfflineStorage(): OfflineStorageState & OfflineStorageActions {
  const [state, setState] = useState<OfflineStorageState>({
    isInitialized: false,
    isLoading: true,
    error: null,
    stats: { spaces: 0, feed: 0, pendingMutations: 0 },
  });

  const initPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize on mount
  useEffect(() => {
    if (initPromiseRef.current) return;

    initPromiseRef.current = (async () => {
      try {
        await initOfflineStorage();
        const stats = await getStorageStats();
        setState((prev) => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          stats,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to initialize'),
        }));
      }
    })();
  }, []);

  // Periodic cleanup of expired cache
  useEffect(() => {
    if (!state.isInitialized) return;

    const cleanup = async () => {
      try {
        await clearExpiredCache();
      } catch {
        // Cleanup failed - will retry next interval
      }
    };

    // Run cleanup on init and every 5 minutes
    cleanup();
    const interval = setInterval(cleanup, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.isInitialized]);

  const refreshStats = useCallback(async () => {
    try {
      const stats = await getStorageStats();
      setState((prev) => ({ ...prev, stats }));
    } catch {
      // Failed to refresh stats - state will be stale
    }
  }, []);

  const handleCacheSpaces = useCallback(
    async (spaces: CachedSpace[]) => {
      await cacheSpaces(spaces);
      await refreshStats();
    },
    [refreshStats]
  );

  const handleCacheFeed = useCallback(
    async (items: CachedFeedItem[]) => {
      await cacheFeedItems(items);
      await refreshStats();
    },
    [refreshStats]
  );

  const handleCacheProfile = useCallback(async (profile: CachedProfile) => {
    await cacheProfile(profile);
  }, []);

  const queueMutation = useCallback(
    async (type: PendingMutation['type'], payload: Record<string, unknown>) => {
      const id = await addPendingMutation(type, payload);
      await refreshStats();
      return id;
    },
    [refreshStats]
  );

  const completeMutation = useCallback(
    async (id: string) => {
      await removePendingMutation(id);
      await refreshStats();
    },
    [refreshStats]
  );

  const failMutation = useCallback(async (id: string, error: string) => {
    await updatePendingMutation(id, {
      lastError: error,
      retryCount: (await getPendingMutations()).find((m) => m.id === id)?.retryCount ?? 0 + 1,
    });
  }, []);

  const cleanup = useCallback(async () => {
    await clearExpiredCache();
    await refreshStats();
  }, [refreshStats]);

  return {
    ...state,
    cacheSpaces: handleCacheSpaces,
    getCachedSpaces,
    cacheFeed: handleCacheFeed,
    getCachedFeed,
    cacheProfile: handleCacheProfile,
    getCachedProfile,
    queueMutation,
    getPendingMutations,
    completeMutation,
    failMutation,
    isCacheValid,
    refreshStats,
    cleanup,
  };
}

/**
 * useOfflineSync Hook
 *
 * Handles syncing pending mutations when coming back online.
 */
interface SyncState {
  isSyncing: boolean;
  lastSyncAt: number | null;
  syncErrors: Array<{ id: string; error: string }>;
}

interface SyncOptions {
  onSyncComplete?: (results: { success: number; failed: number }) => void;
  onMutationSync?: (mutation: PendingMutation, success: boolean) => void;
  maxRetries?: number;
}

export function useOfflineSync(options: SyncOptions = {}): SyncState & { sync: () => Promise<void> } {
  const { onSyncComplete, onMutationSync, maxRetries = 3 } = options;
  const isOnline = useOnlineStatus();
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSyncAt: null,
    syncErrors: [],
  });

  const syncMutation = useCallback(
    async (mutation: PendingMutation): Promise<boolean> => {
      try {
        // Map mutation types to API endpoints
        const endpoints: Record<PendingMutation['type'], { method: string; url: string | ((payload: Record<string, unknown>) => string) }> = {
          join_space: { method: 'POST', url: '/api/spaces/join-v2' },
          leave_space: { method: 'POST', url: '/api/spaces/leave' },
          create_post: { method: 'POST', url: '/api/feed' },
          send_message: { method: 'POST', url: (payload) => `/api/spaces/${payload.spaceId}/chat` },
          rsvp_event: { method: 'POST', url: '/api/events/rsvp' },
        };

        const endpoint = endpoints[mutation.type];
        if (!endpoint) {
          return false;
        }

        const resolvedUrl = typeof endpoint.url === 'function'
          ? endpoint.url(mutation.payload)
          : endpoint.url;

        const response = await fetch(resolvedUrl, {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutation.payload),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        await removePendingMutation(mutation.id);
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Update retry count
        await updatePendingMutation(mutation.id, {
          retryCount: mutation.retryCount + 1,
          lastError: errorMessage,
        });

        // Remove if max retries exceeded
        if (mutation.retryCount + 1 >= maxRetries) {
          await removePendingMutation(mutation.id);
        }

        return false;
      }
    },
    [maxRetries]
  );

  // Development-only logging helper
  const isDev = process.env.NODE_ENV === 'development';

  const sync = useCallback(async () => {
    if (!isOnline) {
      if (isDev) console.warn('[OfflineSync] Skipping sync - offline');
      return;
    }

    setState((prev) => ({ ...prev, isSyncing: true, syncErrors: [] }));

    try {
      const mutations = await getPendingMutations();

      if (mutations.length === 0) {
        setState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncAt: Date.now(),
        }));
        return;
      }

      if (isDev) console.warn(`[OfflineSync] Syncing ${mutations.length} pending mutations...`);

      let success = 0;
      let failed = 0;
      const errors: Array<{ id: string; error: string }> = [];

      // Process mutations sequentially to maintain order
      for (const mutation of mutations) {
        const result = await syncMutation(mutation);
        if (result) {
          success++;
        } else {
          failed++;
          errors.push({
            id: mutation.id,
            error: mutation.lastError || 'Sync failed',
          });
        }
        onMutationSync?.(mutation, result);
      }

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: Date.now(),
        syncErrors: errors,
      }));

      onSyncComplete?.({ success, failed });
      if (isDev) console.warn(`[OfflineSync] Sync complete: ${success} succeeded, ${failed} failed`);
    } catch (error) {
      if (isDev) console.error('[OfflineSync] Sync error:', error);
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        syncErrors: [{ id: 'global', error: error instanceof Error ? error.message : 'Sync failed' }],
      }));
    }
  }, [isOnline, syncMutation, onSyncComplete, onMutationSync]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && !state.isSyncing) {
      // Small delay to ensure network is stable
      const timeout = setTimeout(sync, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, state.isSyncing, sync]);

  return { ...state, sync };
}

/**
 * useOfflineData Hook
 *
 * High-level hook that combines caching with live data fetching.
 * Returns cached data immediately, then updates with fresh data when online.
 */
interface UseOfflineDataOptions<T> {
  cacheKey: string;
  fetchFn: () => Promise<T>;
  cacheFn: (data: T) => Promise<void>;
  getCacheFn: () => Promise<T | undefined>;
  staleTime?: number; // ms
}

interface UseOfflineDataResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isStale: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useOfflineData<T>(options: UseOfflineDataOptions<T>): UseOfflineDataResult<T> {
  const { cacheKey, fetchFn, cacheFn, getCacheFn, staleTime = 5 * 60 * 1000 } = options;

  const isOnline = useOnlineStatus();
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async () => {
    if (!isOnline) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[useOfflineData:${cacheKey}] Offline - using cache only`);
      }
      return;
    }

    try {
      setIsLoading(true);
      const freshData = await fetchFn();
      setData(freshData);
      setIsStale(false);
      lastFetchRef.current = Date.now();

      // Cache the fresh data
      await cacheFn(freshData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fetch failed'));
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, cacheKey, fetchFn, cacheFn]);

  // Load cached data on mount
  useEffect(() => {
    (async () => {
      try {
        const cached = await getCacheFn();
        if (cached) {
          setData(cached);
          setIsStale(true);
          setIsLoading(false);
        }
      } catch {
        // Cache read failed - will fetch fresh data
      }

      // Then fetch fresh data if online
      if (isOnline) {
        fetchData();
      } else {
        setIsLoading(false);
      }
    })();
  }, []);

  // Refetch when coming back online if data is stale
  useEffect(() => {
    if (isOnline && isStale && Date.now() - lastFetchRef.current > staleTime) {
      fetchData();
    }
  }, [isOnline, isStale, staleTime, fetchData]);

  return {
    data,
    isLoading,
    isStale,
    error,
    refetch: fetchData,
  };
}

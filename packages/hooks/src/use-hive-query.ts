/**
 * Core Query Hook for HIVE
 *
 * TanStack Query-inspired hook with Firebase real-time integration.
 * Provides caching, revalidation, real-time updates, and offline support.
 *
 * @module use-hive-query
 * @since 1.0.0
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  HiveQueryState,
  HiveQueryConfig,
  QueryKey,
  CacheEntry,
  PaginatedResponse,
  PaginationCursor,
  HiveError,
} from '@hive/core';
import { useLoadingContext } from './loading-context';

/**
 * In-memory query cache (shared across all instances)
 */
const queryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Active query deduplication (prevents duplicate requests)
 */
const activeQueries = new Map<string, Promise<unknown>>();

/**
 * Serialize query key to string for caching
 */
function serializeQueryKey(key: QueryKey): string {
  return JSON.stringify(key);
}

/**
 * Get data from localStorage cache
 */
function getOfflineCache<T>(cacheKey: string): CacheEntry<T> | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(`hive_query_${cacheKey}`);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as CacheEntry<T>;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save data to localStorage cache
 */
function setOfflineCache<T>(cacheKey: string, entry: CacheEntry<T>): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(`hive_query_${cacheKey}`, JSON.stringify(entry));
  } catch (_error) {
    // Quota exceeded or other storage error - fail silently
  }
}

/**
 * Core query hook with caching, real-time, and offline support
 *
 * @example
 * ```tsx
 * const { data, initial, error, refetch, loadMore } = useHiveQuery({
 *   queryKey: ['feed', { spaceId }],
 *   queryFn: () => getFeed({ spaceId, campusId: 'ub-buffalo' }),
 *   realtimeFn: (onUpdate) => subscribeFeed(spaceId, onUpdate),
 *   enableRealtime: true,
 *   staleTime: 30000,
 * });
 *
 * if (initial) return <FeedLoadingSkeleton />;
 * if (error) return <ErrorMessage error={error} retry={refetch} />;
 * return <FeedList posts={data} loadMore={loadMore} />;
 * ```
 */
export function useHiveQuery<T>(
  config: HiveQueryConfig<T>
): HiveQueryState<T> & {
  refetch: () => Promise<void>;
  loadMore: (cursor?: PaginationCursor) => Promise<void>;
  invalidate: () => void;
} {
  const {
    queryKey,
    queryFn,
    realtimeFn,
    enableRealtime = false,
    staleTime = 30000,
    cacheTime = 300000,
    refetchOnMount = true,
    refetchOnFocus = true,
    refetchOnReconnect = true,
    enableOfflineCache = true,
    onSuccess,
    onError,
    onStateChange,
  } = config;

  const loadingContext = useLoadingContext();
  const cacheKey = serializeQueryKey(queryKey);

  // State
  const [state, setState] = useState<HiveQueryState<T>>(() => {
    // Try to get from memory cache first
    const cached = queryCache.get(cacheKey) as CacheEntry<T> | undefined;
    if (cached) {
      const isStale = Date.now() - cached.timestamp > staleTime;
      return {
        data: cached.data,
        initial: false,
        refreshing: false,
        loadingMore: false,
        revalidating: isStale,
        error: null,
        isStale,
        isRealtime: false,
        lastUpdated: new Date(cached.timestamp),
        hasOfflineData: false,
        hasMore: true,
      };
    }

    // Try offline cache
    if (enableOfflineCache) {
      const offlineCache = getOfflineCache<T>(cacheKey);
      if (offlineCache) {
        const isStale = Date.now() - offlineCache.timestamp > staleTime;
        return {
          data: offlineCache.data,
          initial: false,
          refreshing: false,
          loadingMore: false,
          revalidating: true,
          error: null,
          isStale,
          isRealtime: false,
          lastUpdated: new Date(offlineCache.timestamp),
          hasOfflineData: true,
          hasMore: true,
        };
      }
    }

    // No cache - initial load state
    return {
      data: null,
      initial: true,
      refreshing: false,
      loadingMore: false,
      revalidating: false,
      error: null,
      isStale: false,
      isRealtime: false,
      lastUpdated: null,
      hasOfflineData: false,
      hasMore: true,
    };
  });

  // Refs
  const realtimeUnsubscribe = useRef<(() => void) | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const retryCount = useRef(0);
  const isMounted = useRef(true);

  /**
   * Execute the query function with deduplication
   */
  const executeQuery = useCallback(
    async (isBackground = false): Promise<T> => {
      // Check if query is already in progress
      const existing = activeQueries.get(cacheKey);
      if (existing && !isBackground) {
        return existing as Promise<T>;
      }

      // Create abort controller for this request
      abortController.current = new AbortController();

      // Execute query
      const queryPromise = queryFn();
      activeQueries.set(cacheKey, queryPromise);

      try {
        const data = await queryPromise;

        // Update cache
        const cacheEntry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          queryKey,
          isStale: false,
        };
        queryCache.set(cacheKey, cacheEntry);

        // Save to offline cache
        if (enableOfflineCache) {
          setOfflineCache(cacheKey, cacheEntry);
        }

        return data;
      } finally {
        activeQueries.delete(cacheKey);
      }
    },
    [cacheKey, queryFn, queryKey, enableOfflineCache]
  );

  /**
   * Fetch data (initial or refetch)
   */
  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isMounted.current) return;

      // Update loading state
      setState((prev: HiveQueryState<T>) => ({
        ...prev,
        initial: prev.data === null && !isRefresh,
        refreshing: isRefresh,
        revalidating: prev.data !== null && !isRefresh,
        error: null,
      }));

      // Register with loading context
      loadingContext?.registerQuery(cacheKey);

      try {
        const data = await executeQuery(false);

        if (!isMounted.current) return;

        // Update state
        setState((prev: HiveQueryState<T>) => ({
          ...prev,
          data,
          initial: false,
          refreshing: false,
          revalidating: false,
          error: null,
          isStale: false,
          lastUpdated: new Date(),
          hasOfflineData: false,
        }));

        // Call success callback
        onSuccess?.(data);

        // Reset retry count
        retryCount.current = 0;
      } catch (error) {
        if (!isMounted.current) return;

        const hiveError = error as HiveError;

        // Try to use offline cache on error
        if (enableOfflineCache && !navigator.onLine) {
          const offlineCache = getOfflineCache<T>(cacheKey);
          if (offlineCache) {
            setState((prev: HiveQueryState<T>) => ({
              ...prev,
              data: offlineCache.data,
              initial: false,
              refreshing: false,
              revalidating: false,
              error: hiveError,
              hasOfflineData: true,
              lastUpdated: new Date(offlineCache.timestamp),
            }));
            return;
          }
        }

        // Update error state
        setState((prev: HiveQueryState<T>) => ({
          ...prev,
          initial: false,
          refreshing: false,
          revalidating: false,
          error: hiveError,
        }));

        // Call error callback
        onError?.(hiveError);

        // Auto-retry with exponential backoff
        if (retryCount.current < 3) {
          retryCount.current++;
          const delay = Math.min(1000 * Math.pow(2, retryCount.current), 10000);
          setTimeout(() => fetchData(false), delay);
        }
      } finally {
        loadingContext?.unregisterQuery(cacheKey);
      }
    },
    [cacheKey, executeQuery, enableOfflineCache, onSuccess, onError, loadingContext]
  );

  /**
   * Load more data (pagination)
   */
  const loadMore = useCallback(
    async (cursor?: PaginationCursor) => {
      if (!isMounted.current || state.loadingMore || !state.hasMore) return;

      setState((prev: HiveQueryState<T>) => ({ ...prev, loadingMore: true, error: null }));

      try {
        // If queryFn returns paginated data, it should accept cursor
        const data = await queryFn();

        if (!isMounted.current) return;

        // Check if data is paginated response
        const isPaginated = data && typeof data === 'object' && 'items' in data;

        if (isPaginated) {
          const paginatedData = data as unknown as PaginatedResponse<unknown>;

          setState((prev: HiveQueryState<T>) => ({
            ...prev,
            data: prev.data
              ? (Array.isArray(prev.data)
                  ? ([...prev.data, ...paginatedData.items] as T)
                  : paginatedData.items as T)
              : (paginatedData.items as T),
            loadingMore: false,
            hasMore: paginatedData.hasMore,
          }));
        } else {
          // Non-paginated data
          setState((prev: HiveQueryState<T>) => ({
            ...prev,
            data: data as T,
            loadingMore: false,
            hasMore: false,
          }));
        }
      } catch (error) {
        if (!isMounted.current) return;

        setState((prev: HiveQueryState<T>) => ({
          ...prev,
          loadingMore: false,
          error: error as HiveError,
        }));

        onError?.(error as HiveError);
      }
    },
    [state.loadingMore, state.hasMore, queryFn, onError]
  );

  /**
   * Manual refetch
   */
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  /**
   * Invalidate cache and refetch
   */
  const invalidate = useCallback(() => {
    queryCache.delete(cacheKey);
    if (enableOfflineCache && typeof window !== 'undefined') {
      localStorage.removeItem(`hive_query_${cacheKey}`);
    }
    fetchData(false);
  }, [cacheKey, enableOfflineCache, fetchData]);

  /**
   * Setup real-time listener
   */
  useEffect(() => {
    if (!enableRealtime || !realtimeFn) return;

    const unsubscribe = realtimeFn((updatedData: T) => {
      if (!isMounted.current) return;

      setState((prev: HiveQueryState<T>) => ({
        ...prev,
        data: updatedData,
        isRealtime: true,
        lastUpdated: new Date(),
        isStale: false,
      }));

      // Update cache
      const cacheEntry: CacheEntry<T> = {
        data: updatedData,
        timestamp: Date.now(),
        queryKey,
        isStale: false,
      };
      queryCache.set(cacheKey, cacheEntry);

      if (enableOfflineCache) {
        setOfflineCache(cacheKey, cacheEntry);
      }
    });

    realtimeUnsubscribe.current = unsubscribe;

    setState((prev: HiveQueryState<T>) => ({ ...prev, isRealtime: true }));

    return () => {
      unsubscribe();
      setState((prev: HiveQueryState<T>) => ({ ...prev, isRealtime: false }));
    };
  }, [enableRealtime, realtimeFn, cacheKey, queryKey, enableOfflineCache]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    if (refetchOnMount || state.data === null) {
      fetchData(false);
    }
  }, [refetchOnMount]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Refetch on window focus
   */
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      if (state.isStale) {
        fetchData(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnFocus, state.isStale, fetchData]);

  /**
   * Refetch on reconnect
   */
  useEffect(() => {
    if (!refetchOnReconnect) return;

    const handleOnline = () => {
      fetchData(false);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [refetchOnReconnect, fetchData]);

  /**
   * Stale-while-revalidate: revalidate stale data in background
   */
  useEffect(() => {
    if (state.isStale && state.data !== null && !state.revalidating) {
      fetchData(false);
    }
  }, [state.isStale, state.data, state.revalidating]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * State change callback
   */
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMounted.current = false;
      abortController.current?.abort();
      realtimeUnsubscribe.current?.();
      loadingContext?.unregisterQuery(cacheKey);
    };
  }, [cacheKey, loadingContext]);

  return {
    ...state,
    refetch,
    loadMore,
    invalidate,
  };
}

/**
 * Prefetch query data (populate cache without rendering)
 *
 * @example
 * ```tsx
 * // Prefetch on hover
 * <Link
 *   href="/spaces/123"
 *   onMouseEnter={() => prefetchQuery({
 *     queryKey: ['space', { id: '123' }],
 *     queryFn: () => getSpace('123')
 *   })}
 * />
 * ```
 */
export async function prefetchQuery<T>(config: HiveQueryConfig<T>): Promise<void> {
  const { queryKey, queryFn, staleTime = 30000, enableOfflineCache = true } = config;
  const cacheKey = serializeQueryKey(queryKey);

  // Check if already cached and fresh
  const cached = queryCache.get(cacheKey) as CacheEntry<T> | undefined;
  if (cached && Date.now() - cached.timestamp < staleTime) {
    return;
  }

  try {
    const data = await queryFn();

    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      queryKey,
      isStale: false,
    };

    queryCache.set(cacheKey, cacheEntry);

    if (enableOfflineCache) {
      setOfflineCache(cacheKey, cacheEntry);
    }
  } catch (_error) {
    // Prefetch errors are silent
  }
}

/**
 * Invalidate query cache
 *
 * @example
 * ```tsx
 * // Invalidate all feed queries
 * invalidateQueries(['feed']);
 *
 * // Invalidate specific query
 * invalidateQueries(['feed', { spaceId: '123' }]);
 * ```
 */
export function invalidateQueries(partialKey: QueryKey): void {
  const partial = serializeQueryKey(partialKey);

  for (const [key] of queryCache.entries()) {
    if (key.startsWith(partial)) {
      queryCache.delete(key);

      if (typeof window !== 'undefined') {
        localStorage.removeItem(`hive_query_${key}`);
      }
    }
  }
}

/**
 * Clear all query cache
 */
export function clearQueryCache(): void {
  queryCache.clear();

  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('hive_query_')) {
        localStorage.removeItem(key);
      }
    }
  }
}

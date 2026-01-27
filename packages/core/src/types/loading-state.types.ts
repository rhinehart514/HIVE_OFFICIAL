/**
 * Unified Loading State Types for HIVE
 *
 * Provides standardized loading state interfaces across all data fetching patterns.
 * Supports: initial load, refresh, pagination, real-time, optimistic updates, offline.
 *
 * @module loading-state.types
 * @since 1.0.0
 */

import type { HiveError } from './error.types';

/**
 * Core query state for data fetching operations
 *
 * Separates different loading states for better UX:
 * - initial: First load (show full skeleton)
 * - refreshing: User-triggered refresh (show refresh spinner)
 * - loadingMore: Pagination (show inline loader)
 * - revalidating: Background revalidation (no UI change)
 *
 * @example
 * ```tsx
 * const { data, initial, loadingMore } = useHiveQuery(...);
 *
 * if (initial) return <FeedLoadingSkeleton />;
 * return (
 *   <>
 *     {data.map(item => <Card key={item.id} {...item} />)}
 *     {loadingMore && <InlineSpinner />}
 *   </>
 * );
 * ```
 */
export interface HiveQueryState<T> {
  /** The fetched data, null if not yet loaded */
  data: T | null;

  /** First load of this query (show full skeleton) */
  initial: boolean;

  /** User-triggered refresh (show refresh indicator) */
  refreshing: boolean;

  /** Loading next page of data (show inline loader) */
  loadingMore: boolean;

  /** Background revalidation (no UI indication needed) */
  revalidating: boolean;

  /** Error if fetch failed */
  error: HiveError | null;

  /** Data is older than staleTime threshold */
  isStale: boolean;

  /** Real-time listener is active */
  isRealtime: boolean;

  /** Timestamp of last successful fetch */
  lastUpdated: Date | null;

  /** Data is from offline cache (network unavailable) */
  hasOfflineData: boolean;

  /** Has more data to load (for pagination) */
  hasMore: boolean;
}

/**
 * Mutation state for create/update/delete operations
 *
 * Supports optimistic updates for instant UI feedback with automatic rollback on error.
 *
 * @example
 * ```tsx
 * const { mutate, loading, optimisticData } = useHiveMutation({
 *   mutationFn: createPost,
 *   optimisticUpdate: (vars) => ({ id: 'temp', ...vars, createdAt: new Date() })
 * });
 *
 * // UI shows optimistic post immediately
 * const posts = optimisticData ? [optimisticData, ...data] : data;
 * ```
 */
export interface HiveMutationState<TData = unknown, TVariables = unknown> {
  /** Result data from successful mutation */
  data: TData | null;

  /** Mutation is in progress */
  loading: boolean;

  /** Error if mutation failed */
  error: HiveError | null;

  /** Optimistic data shown while mutation in progress */
  optimisticData: TData | null;

  /** Original variables (for rollback) */
  variables: TVariables | null;

  /** Mutation has been called at least once */
  isIdle: boolean;

  /** Mutation completed successfully */
  isSuccess: boolean;

  /** Mutation failed */
  isError: boolean;
}

/**
 * Configuration for query behavior
 */
export interface HiveQueryConfig<T> {
  /** Unique key for this query (for caching and deduplication) */
  queryKey: QueryKey;

  /** Function to fetch the data (cursor optional for pagination) */
  queryFn: (cursor?: PaginationCursor) => Promise<T>;

  /** Optional real-time subscription function */
  realtimeFn?: (onUpdate: (data: T) => void) => () => void;

  /** Enable real-time listener (default: false) */
  enableRealtime?: boolean;

  /** Time in ms before data is considered stale (default: 30000) */
  staleTime?: number;

  /** Time in ms to keep unused data in cache (default: 300000) */
  cacheTime?: number;

  /** Refetch when component mounts (default: true) */
  refetchOnMount?: boolean;

  /** Refetch when window regains focus (default: true) */
  refetchOnFocus?: boolean;

  /** Refetch when network reconnects (default: true) */
  refetchOnReconnect?: boolean;

  /** Enable offline caching to localStorage (default: true) */
  enableOfflineCache?: boolean;

  /** Success callback */
  onSuccess?: (data: T) => void;

  /** Error callback */
  onError?: (error: HiveError) => void;

  /** Called on any state change */
  onStateChange?: (state: HiveQueryState<T>) => void;
}

/**
 * Configuration for mutation behavior
 */
export interface HiveMutationConfig<TData = unknown, TVariables = unknown> {
  /** Function to perform the mutation */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /** Generate optimistic data for instant UI update */
  optimisticUpdate?: (variables: TVariables) => TData;

  /** Success callback (receives mutation result) */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;

  /** Error callback (receives error, variables, and rollback function) */
  onError?: (error: HiveError, variables: TVariables, rollback: () => void) => void;

  /** Called when mutation is initiated */
  onMutate?: (variables: TVariables) => void;

  /** Called after success or error */
  onSettled?: (data: TData | null, error: HiveError | null, variables: TVariables) => void;

  /** Retry failed mutations (default: 0) */
  retry?: number;

  /** Retry delay in ms (default: 1000) */
  retryDelay?: number;
}

/**
 * Query key type (can be nested for complex queries)
 *
 * @example
 * ['feed'] // Simple key
 * ['feed', { spaceId: '123' }] // With filters
 * ['feed', { spaceId: '123', userId: 'abc' }] // Multiple filters
 */
export type QueryKey = ReadonlyArray<string | number | boolean | Record<string, unknown> | null | undefined>;

/**
 * Cache entry structure
 */
export interface CacheEntry<T> {
  /** Cached data */
  data: T;

  /** Timestamp when data was cached */
  timestamp: number;

  /** Query key */
  queryKey: QueryKey;

  /** Is data stale */
  isStale: boolean;
}

/**
 * Loading state context value
 * Provides global loading state coordination across the app
 */
export interface LoadingContextValue {
  /** All active query keys currently loading */
  activeQueries: Set<string>;

  /** All active mutations currently in progress */
  activeMutations: Set<string>;

  /** Is any critical query loading (blocks navigation) */
  isCriticalLoading: boolean;

  /** Register a query as loading */
  registerQuery: (key: string) => void;

  /** Unregister a query */
  unregisterQuery: (key: string) => void;

  /** Register a mutation as in progress */
  registerMutation: (key: string) => void;

  /** Unregister a mutation */
  unregisterMutation: (key: string) => void;
}

/**
 * Pagination cursor types
 */
export interface PaginationCursor {
  /** Firestore document snapshot for cursor-based pagination */
  lastDoc?: unknown;

  /** Offset for offset-based pagination */
  offset?: number;

  /** Page number for page-based pagination */
  page?: number;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  /** Page data items */
  items: T[];

  /** Cursor for next page */
  nextCursor?: PaginationCursor;

  /** Has more pages */
  hasMore: boolean;

  /** Total count (if available) */
  total?: number;
}

/**
 * Real-time update event types
 */
export type RealtimeUpdateType = 'added' | 'modified' | 'removed';

/**
 * Real-time update event
 */
export interface RealtimeUpdate<T> {
  /** Type of update */
  type: RealtimeUpdateType;

  /** Updated data */
  data: T;

  /** Timestamp of update */
  timestamp: Date;
}

/**
 * Offline queue entry for failed mutations
 */
export interface OfflineQueueEntry<TVariables = unknown> {
  /** Unique ID for this queued mutation */
  id: string;

  /** Mutation function to retry */
  mutationFn: (variables: TVariables) => Promise<unknown>;

  /** Variables to pass to mutation */
  variables: TVariables;

  /** Number of retry attempts */
  retryCount: number;

  /** Max retry attempts */
  maxRetries: number;

  /** Timestamp when queued */
  queuedAt: Date;

  /** Last retry attempt timestamp */
  lastRetryAt?: Date;
}

/**
 * Loading analytics event
 */
export interface LoadingAnalyticsEvent {
  /** Query key */
  queryKey: string;

  /** Duration in ms */
  duration: number;

  /** Was from cache */
  fromCache: boolean;

  /** Was real-time update */
  isRealtime: boolean;

  /** Error if failed */
  error?: string;

  /** Timestamp */
  timestamp: Date;
}

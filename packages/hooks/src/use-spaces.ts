'use client';

import { useHiveQuery } from './use-hive-query';
import { useAuth } from '@hive/auth-logic';

/**
 * Space data returned from the API
 */
export interface Space {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  type?: string;
  memberCount: number;
  isPublic: boolean;
  visibility?: 'public' | 'private' | 'members_only';
  isJoined?: boolean;
  bannerUrl?: string;
  iconUrl?: string;
  tags?: Array<{ sub_type: string }>;
  createdAt: Date;
  updatedAt?: Date;
  trendingScore?: number;
}

/**
 * Configuration for useSpaces hook
 */
export interface UseSpacesConfig {
  /** Filter by category (student_organizations, campus_living, etc.) */
  category?: string;
  /** Search term for filtering spaces */
  search?: string;
  /** Sort order */
  sortBy?: 'trending' | 'recent' | 'popular' | 'alphabetical';
  /** Maximum number of spaces to fetch */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
  /** Enable real-time updates */
  enableRealtime?: boolean;
  /** Stale time in milliseconds (default: 60s) */
  staleTime?: number;
}

/**
 * Fetch spaces from the API
 */
async function fetchSpaces(
  config: UseSpacesConfig = {},
  authToken?: string
): Promise<{
  spaces: Space[];
  hasMore: boolean;
  nextCursor?: string;
}> {
  const params = new URLSearchParams();

  if (config.category && config.category !== 'all') {
    params.set('category', config.category);
  }
  if (config.search) {
    params.set('q', config.search);
  }
  if (config.limit) {
    params.set('limit', String(config.limit));
  }
  if (config.cursor) {
    params.set('cursor', config.cursor);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`/api/spaces?${params.toString()}`, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch spaces: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch spaces');
  }

  // Transform API response to Space interface
  const spaces: Space[] = (data.spaces || []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: s.name as string,
    slug: s.slug as string | undefined,
    description: s.description as string | undefined,
    category: s.category as string | undefined,
    type: s.type as string | undefined,
    memberCount: (s.memberCount as number) || 0,
    isPublic: s.visibility !== 'private',
    visibility: s.visibility as 'public' | 'private' | 'members_only' | undefined,
    isJoined: s.isJoined as boolean | undefined,
    bannerUrl: s.bannerUrl as string | undefined,
    iconUrl: s.iconUrl as string | undefined,
    tags: s.tags as Array<{ sub_type: string }> | undefined,
    createdAt: new Date(s.createdAt as string || Date.now()),
    updatedAt: s.updatedAt ? new Date(s.updatedAt as string) : undefined,
    trendingScore: s.trendingScore as number | undefined,
  }));

  // Sort on client if needed (API handles most sorting)
  if (config.sortBy === 'alphabetical') {
    spaces.sort((a, b) => a.name.localeCompare(b.name));
  } else if (config.sortBy === 'trending') {
    spaces.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
  } else if (config.sortBy === 'popular') {
    spaces.sort((a, b) => b.memberCount - a.memberCount);
  }

  return {
    spaces,
    hasMore: data.pagination?.hasMore ?? false,
    nextCursor: data.pagination?.nextCursor,
  };
}

/**
 * Hook for fetching and managing spaces data
 *
 * Uses useHiveQuery for caching, offline support, and real-time updates.
 *
 * @example
 * ```tsx
 * const { data, initial, error, refetch } = useSpaces({
 *   category: 'student_organizations',
 *   sortBy: 'trending',
 *   limit: 20,
 * });
 *
 * if (initial) return <SpacesSkeleton />;
 * if (error) return <ErrorMessage error={error} retry={refetch} />;
 * return <SpaceGrid spaces={data?.spaces || []} />;
 * ```
 */
export function useSpaces(config: UseSpacesConfig = {}) {
  const { getAuthToken, isAuthenticated } = useAuth();

  const queryState = useHiveQuery<{
    spaces: Space[];
    hasMore: boolean;
    nextCursor?: string;
  }>({
    queryKey: ['spaces', config as Record<string, unknown>],
    queryFn: async () => {
      const token = isAuthenticated && getAuthToken ? await getAuthToken() : undefined;
      return fetchSpaces(config, token);
    },
    staleTime: config.staleTime ?? 60_000, // 1 minute default
    enableRealtime: config.enableRealtime ?? false,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  return {
    // Data
    spaces: queryState.data?.spaces ?? [],
    hasMore: queryState.data?.hasMore ?? false,
    nextCursor: queryState.data?.nextCursor,

    // Loading states
    isLoading: queryState.initial,
    isRefreshing: queryState.refreshing,
    isRevalidating: queryState.revalidating,

    // Error state
    error: queryState.error?.message ?? null,

    // Actions
    refetch: queryState.refetch,
    invalidate: queryState.invalidate,

    // Raw query state for advanced usage
    queryState,
  };
}

/**
 * Hook for fetching a single space by ID
 */
export function useSpace(spaceId: string | undefined) {
  const { getAuthToken, isAuthenticated } = useAuth();

  return useHiveQuery<Space | null>({
    queryKey: ['space', spaceId],
    queryFn: async () => {
      if (!spaceId) return null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (isAuthenticated && getAuthToken) {
        const token = await getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`/api/spaces/${spaceId}`, { headers });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch space: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch space');
      }

      const s = data.space;
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        category: s.category,
        type: s.type,
        memberCount: s.memberCount || 0,
        isPublic: s.visibility !== 'private',
        visibility: s.visibility,
        isJoined: s.isJoined,
        bannerUrl: s.bannerUrl,
        iconUrl: s.iconUrl,
        tags: s.tags,
        createdAt: new Date(s.createdAt || Date.now()),
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
        trendingScore: s.trendingScore,
      };
    },
    staleTime: 30_000, // 30 seconds
    enableRealtime: false,
  });
}

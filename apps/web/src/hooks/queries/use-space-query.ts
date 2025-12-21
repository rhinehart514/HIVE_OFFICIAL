"use client";

/**
 * React Query hook for fetching space data
 *
 * Provides caching, background refetching, and stale-while-revalidate.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchSpace, type SpaceDTO } from "@/lib/fetchers/space-fetchers";

interface UseSpaceQueryOptions
  extends Omit<UseQueryOptions<SpaceDTO, Error>, "queryKey" | "queryFn"> {
  enabled?: boolean;
}

/**
 * Fetch a space by ID with React Query caching
 *
 * @example
 * const { data: space, isLoading, error } = useSpaceQuery('space-123');
 */
export function useSpaceQuery(spaceId: string, options?: UseSpaceQueryOptions) {
  return useQuery({
    queryKey: queryKeys.spaces.detail(spaceId),
    queryFn: () => fetchSpace(spaceId),
    enabled: Boolean(spaceId) && options?.enabled !== false,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
    retry: 1,
    ...options,
  });
}

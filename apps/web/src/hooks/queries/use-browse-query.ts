"use client";

/**
 * React Query hooks for space discovery
 *
 * Provides caching, pagination, and search with debouncing.
 */

import { useQuery, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchBrowseSpaces,
  searchSpaces,
  fetchRecommendedSpaces,
  fetchFeaturedSpace,
  type BrowseFilters,
  type BrowseResponse,
  type SearchResponse,
  type BrowseSpaceDTO,
} from "@/lib/fetchers";
import { useState, useEffect } from "react";

// ============================================================
// Browse Spaces (with infinite scroll)
// ============================================================

/**
 * Infinite scroll for browsing spaces
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetching } = useBrowseSpacesInfinite({
 *   category: 'student_org',
 *   limit: 20,
 * });
 */
export function useBrowseSpacesInfinite(filters: Omit<BrowseFilters, "offset"> = {}) {
  return useInfiniteQuery<BrowseResponse>({
    queryKey: queryKeys.spaces.list(filters as Record<string, unknown>),
    queryFn: ({ pageParam = 0 }) =>
      fetchBrowseSpaces({ ...filters, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Single page of browse results (for simple use cases)
 */
export function useBrowseSpaces(filters: BrowseFilters = {}) {
  return useQuery<BrowseResponse>({
    queryKey: queryKeys.spaces.list(filters as Record<string, unknown>),
    queryFn: () => fetchBrowseSpaces(filters),
    staleTime: 1000 * 60, // 1 minute
    placeholderData: keepPreviousData,
  });
}

// ============================================================
// Search (with debouncing)
// ============================================================

/**
 * Search spaces with automatic debouncing
 *
 * @example
 * const [query, setQuery] = useState('');
 * const { data, isLoading } = useSpaceSearch(query, { category: 'all' });
 */
export function useSpaceSearch(
  query: string,
  options: { category?: string; limit?: number; debounceMs?: number } = {}
) {
  const { debounceMs = 300, ...filters } = options;
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useQuery<SearchResponse>({
    queryKey: ["spaces", "search", debouncedQuery, filters],
    queryFn: () => searchSpaces({ query: debouncedQuery, ...filters }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
    placeholderData: keepPreviousData,
  });
}

// ============================================================
// Recommended & Featured
// ============================================================

/**
 * Fetch recommended spaces for the current user
 */
export function useRecommendedSpaces(limit: number = 5) {
  return useQuery<BrowseSpaceDTO[]>({
    queryKey: ["spaces", "recommended", limit],
    queryFn: () => fetchRecommendedSpaces(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch the featured/trending space (hero card)
 */
export function useFeaturedSpace() {
  return useQuery<BrowseSpaceDTO | null>({
    queryKey: ["spaces", "featured"],
    queryFn: fetchFeaturedSpace,
    staleTime: 1000 * 60, // 1 minute
  });
}

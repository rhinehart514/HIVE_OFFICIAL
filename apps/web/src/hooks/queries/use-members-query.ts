"use client";

/**
 * React Query hooks for space members
 *
 * Provides caching and pagination for member lists.
 */

import { useQuery, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchSpaceMembers,
  fetchOnlineCount,
  type MembersResponse,
  type MemberFilters,
  type SpaceMemberDTO,
} from "@/lib/fetchers";

// ============================================================
// Members List (with infinite scroll)
// ============================================================

/**
 * Infinite scroll for space members
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useSpaceMembersInfinite(spaceId);
 */
export function useSpaceMembersInfinite(
  spaceId: string,
  filters: Omit<MemberFilters, "offset"> = {}
) {
  return useInfiniteQuery<MembersResponse>({
    queryKey: [...queryKeys.spaces.members(spaceId), filters],
    queryFn: ({ pageParam = 0 }) =>
      fetchSpaceMembers(spaceId, { ...filters, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, page) => sum + page.members.length, 0);
      return lastPage.hasMore ? totalLoaded : undefined;
    },
    enabled: Boolean(spaceId),
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Single page of members (for simple use cases)
 */
export function useSpaceMembers(spaceId: string, filters: MemberFilters = {}) {
  return useQuery<MembersResponse>({
    queryKey: [...queryKeys.spaces.members(spaceId), filters],
    queryFn: () => fetchSpaceMembers(spaceId, filters),
    enabled: Boolean(spaceId),
    staleTime: 1000 * 60, // 1 minute
    placeholderData: keepPreviousData,
  });
}

// ============================================================
// Online Count
// ============================================================

/**
 * Fetch online members count with polling
 *
 * @example
 * const { data: onlineCount } = useOnlineCount(spaceId);
 */
export function useOnlineCount(
  spaceId: string,
  options?: { refetchInterval?: number; enabled?: boolean }
) {
  return useQuery<number>({
    queryKey: [...queryKeys.spaces.members(spaceId), "online"],
    queryFn: () => fetchOnlineCount(spaceId),
    enabled: Boolean(spaceId) && options?.enabled !== false,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: options?.refetchInterval ?? 1000 * 60, // Poll every minute by default
  });
}

// ============================================================
// Member Search
// ============================================================

/**
 * Search members within a space
 */
export function useMemberSearch(
  spaceId: string,
  query: string,
  options?: { limit?: number }
) {
  return useQuery<SpaceMemberDTO[]>({
    queryKey: [...queryKeys.spaces.members(spaceId), "search", query],
    queryFn: async () => {
      const result = await fetchSpaceMembers(spaceId, {
        query,
        limit: options?.limit ?? 10,
      });
      return result.members;
    },
    enabled: Boolean(spaceId) && query.length >= 1,
    staleTime: 1000 * 30, // 30 seconds
    placeholderData: keepPreviousData,
  });
}

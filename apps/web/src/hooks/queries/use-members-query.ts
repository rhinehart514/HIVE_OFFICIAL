"use client";

/**
 * React Query hooks for space members
 *
 * Provides caching and pagination for member lists.
 * Optimized to avoid N+1 queries via cursor-based pagination
 * and batch mutations.
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchSpaceMembers,
  batchInviteMembers,
  batchUpdateRoles,
  batchRemoveMembers,
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
 * Get online members count from members list
 * Derives count from members with presence.status === 'online'
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
    queryFn: async () => {
      const result = await fetchSpaceMembers(spaceId, { limit: 100 });
      return result.members.filter(m => m.presence?.status === 'online').length;
    },
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

// ============================================================
// Batch Mutations (N+1 Prevention)
// ============================================================

/**
 * Batch invite multiple members to a space
 * Use this instead of multiple individual invite calls
 *
 * @example
 * const { mutate } = useBatchInviteMembers(spaceId);
 * mutate([
 *   { userId: 'user1', role: 'member' },
 *   { userId: 'user2', role: 'moderator' }
 * ]);
 */
export function useBatchInviteMembers(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (members: Array<{ userId: string; role: "member" | "moderator" | "admin" }>) =>
      batchInviteMembers(spaceId, members),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.members(spaceId) });
    },
  });
}

/**
 * Batch update roles for multiple members
 * Use this instead of multiple individual role update calls
 *
 * @example
 * const { mutate } = useBatchUpdateRoles(spaceId);
 * mutate([
 *   { userId: 'user1', role: 'admin' },
 *   { userId: 'user2', role: 'member' }
 * ]);
 */
export function useBatchUpdateRoles(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Array<{ userId: string; role: "member" | "moderator" | "admin" }>) =>
      batchUpdateRoles(spaceId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.members(spaceId) });
    },
  });
}

/**
 * Batch remove multiple members from a space
 * Use this instead of multiple individual remove calls
 *
 * @example
 * const { mutate } = useBatchRemoveMembers(spaceId);
 * mutate({ userIds: ['user1', 'user2'], reason: 'Inactive' });
 */
export function useBatchRemoveMembers(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userIds, reason }: { userIds: string[]; reason?: string }) =>
      batchRemoveMembers(spaceId, userIds, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.members(spaceId) });
    },
  });
}

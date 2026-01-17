"use client";

/**
 * React Query mutation hooks for member management
 *
 * Provides mutations for role updates and member removal.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  updateMemberRole,
  removeMember,
  type SpaceMemberDTO,
  type MembersResponse,
} from "@/lib/fetchers";

interface UseMemberRoleMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for updating a member's role
 *
 * @example
 * const { mutate: updateRole } = useMemberRoleMutation(spaceId);
 * updateRole({ userId: 'user-123', role: 'moderator' });
 */
export function useMemberRoleMutation(
  spaceId: string,
  options?: UseMemberRoleMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: SpaceMemberDTO["role"];
    }) => updateMemberRole(spaceId, userId, role),
    onMutate: async ({ userId, role }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.spaces.members(spaceId),
      });

      // Get all member query caches and update optimistically
      const queries = queryClient.getQueriesData<MembersResponse>({
        queryKey: queryKeys.spaces.members(spaceId),
      });

      const previousData: Array<[readonly unknown[], MembersResponse | undefined]> = [];

      queries.forEach(([queryKey, data]) => {
        if (data) {
          previousData.push([queryKey, data]);
          queryClient.setQueryData<MembersResponse>(queryKey as readonly unknown[], {
            ...data,
            members: data.members.map((m) =>
              m.userId === userId ? { ...m, role } : m
            ),
          });
        }
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      context?.previousData.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData(queryKey, data);
        }
      });
      options?.onError?.(_error);
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.spaces.members(spaceId),
      });
      options?.onSuccess?.();
    },
  });
}

/**
 * Mutation hook for removing a member from a space
 *
 * @example
 * const { mutate: remove } = useRemoveMemberMutation(spaceId);
 * remove('user-123');
 */
export function useRemoveMemberMutation(
  spaceId: string,
  options?: UseMemberRoleMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeMember(spaceId, userId),
    onMutate: async (userId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.spaces.members(spaceId),
      });

      // Get all member query caches and update optimistically
      const queries = queryClient.getQueriesData<MembersResponse>({
        queryKey: queryKeys.spaces.members(spaceId),
      });

      const previousData: Array<[readonly unknown[], MembersResponse | undefined]> = [];

      queries.forEach(([queryKey, data]) => {
        if (data) {
          previousData.push([queryKey, data]);
          queryClient.setQueryData<MembersResponse>(queryKey as readonly unknown[], {
            ...data,
            members: data.members.filter((m) => m.userId !== userId),
            total: data.total - 1,
          });
        }
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      context?.previousData.forEach(([queryKey, data]) => {
        if (data) {
          queryClient.setQueryData(queryKey, data);
        }
      });
      options?.onError?.(_error);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.spaces.members(spaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.spaces.detail(spaceId),
      });
      options?.onSuccess?.();
    },
  });
}

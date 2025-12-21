"use client";

/**
 * React Query mutation hook for leaving a space
 *
 * Provides optimistic updates and automatic cache invalidation.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { leaveSpace, type SpaceDTO } from "@/lib/fetchers/space-fetchers";

interface UseLeaveSpaceMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for leaving a space with optimistic updates
 *
 * @example
 * const { mutate: leave, isPending } = useLeaveSpaceMutation('space-123');
 * <Button onClick={() => leave()} disabled={isPending}>Leave</Button>
 */
export function useLeaveSpaceMutation(
  spaceId: string,
  options?: UseLeaveSpaceMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => leaveSpace(spaceId),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.spaces.detail(spaceId),
      });

      // Snapshot previous value
      const previousSpace = queryClient.getQueryData<SpaceDTO>(
        queryKeys.spaces.detail(spaceId)
      );

      // Optimistically update
      if (previousSpace) {
        queryClient.setQueryData<SpaceDTO>(
          queryKeys.spaces.detail(spaceId),
          {
            ...previousSpace,
            memberCount: Math.max(0, previousSpace.memberCount - 1),
            membership: {
              isMember: false,
              isLeader: false,
            },
          }
        );
      }

      return { previousSpace };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousSpace) {
        queryClient.setQueryData(
          queryKeys.spaces.detail(spaceId),
          context.previousSpace
        );
      }
      options?.onError?.(_error);
    },
    onSuccess: () => {
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.spaces.detail(spaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.spaces.members(spaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.current(),
      });
      options?.onSuccess?.();
    },
  });
}

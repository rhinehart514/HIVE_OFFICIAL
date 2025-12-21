"use client";

/**
 * React Query mutation hook for joining a space
 *
 * Provides optimistic updates and automatic cache invalidation.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { joinSpace, type SpaceDTO } from "@/lib/fetchers/space-fetchers";

interface UseJoinSpaceMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for joining a space with optimistic updates
 *
 * @example
 * const { mutate: join, isPending } = useJoinSpaceMutation('space-123');
 * <Button onClick={() => join()} disabled={isPending}>Join</Button>
 */
export function useJoinSpaceMutation(
  spaceId: string,
  options?: UseJoinSpaceMutationOptions
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => joinSpace(spaceId),
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
            memberCount: previousSpace.memberCount + 1,
            membership: {
              ...previousSpace.membership,
              isMember: true,
              isLeader: false,
              role: "member",
              status: "active",
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

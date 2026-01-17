"use client";

/**
 * React Query mutation hook for updating profile
 *
 * Provides optimistic updates and automatic cache invalidation.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { updateProfile, type ProfileDTO, type ProfileUpdateDTO } from "@/lib/fetchers";

interface UseProfileMutationOptions {
  onSuccess?: (data: ProfileDTO) => void;
  onError?: (error: Error) => void;
}

/**
 * Mutation hook for updating the current user's profile
 *
 * @example
 * const { mutate: update, isPending } = useProfileMutation();
 * update({ fullName: 'New Name', bio: 'Updated bio' });
 */
export function useProfileMutation(options?: UseProfileMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: ProfileUpdateDTO) => updateProfile(updates),
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.users.current(),
      });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<ProfileDTO>(
        queryKeys.users.current()
      );

      // Optimistically update
      if (previousProfile) {
        queryClient.setQueryData<ProfileDTO>(queryKeys.users.current(), {
          ...previousProfile,
          ...updates,
        });
      }

      return { previousProfile };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          queryKeys.users.current(),
          context.previousProfile
        );
      }
      options?.onError?.(_error);
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.users.current(), data);
      options?.onSuccess?.(data);
    },
  });
}

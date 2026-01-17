"use client";

/**
 * React Query mutation hook for saving tool state
 *
 * Provides optimistic updates and debounced auto-save.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { saveToolState, type ToolStateDTO } from "@/lib/fetchers";
import { useRef, useCallback } from "react";

interface UseToolStateMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  /** Debounce time for auto-save (default: 1000ms) */
  debounceMs?: number;
}

interface SaveStateParams {
  state: Record<string, unknown>;
  toolId?: string;
  spaceId?: string;
  merge?: boolean;
}

/**
 * Mutation hook for saving tool state
 *
 * @example
 * const { mutate: save, saveDebounced } = useToolStateMutation(deploymentId);
 *
 * // Immediate save
 * save({ state: { count: 1 } });
 *
 * // Debounced save (for auto-save)
 * saveDebounced({ state: { count: 1 } });
 */
export function useToolStateMutation(
  deploymentId: string,
  options?: UseToolStateMutationOptions
) {
  const queryClient = useQueryClient();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const debounceMs = options?.debounceMs ?? 1000;

  const mutation = useMutation({
    mutationFn: (params: SaveStateParams) =>
      saveToolState(deploymentId, params.state, {
        toolId: params.toolId,
        spaceId: params.spaceId,
        merge: params.merge,
      }),
    onMutate: async (params) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.tools.state(deploymentId),
      });

      // Snapshot previous value
      const previousState = queryClient.getQueryData<ToolStateDTO>(
        queryKeys.tools.state(deploymentId)
      );

      // Optimistically update
      if (previousState) {
        const newState = params.merge
          ? { ...previousState.state, ...params.state }
          : params.state;

        queryClient.setQueryData<ToolStateDTO>(
          queryKeys.tools.state(deploymentId),
          {
            ...previousState,
            state: newState,
            metadata: {
              ...previousState.metadata,
              lastSaved: new Date().toISOString(),
            },
          }
        );
      }

      return { previousState };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousState) {
        queryClient.setQueryData(
          queryKeys.tools.state(deploymentId),
          context.previousState
        );
      }
      options?.onError?.(_error);
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.tools.state(deploymentId),
      });
      options?.onSuccess?.();
    },
  });

  // Debounced save for auto-save functionality
  const saveDebounced = useCallback(
    (params: SaveStateParams) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        mutation.mutate(params);
      }, debounceMs);
    },
    [mutation, debounceMs]
  );

  // Cancel pending debounced save
  const cancelDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  return {
    ...mutation,
    saveDebounced,
    cancelDebounce,
  };
}

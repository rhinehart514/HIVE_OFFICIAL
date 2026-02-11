"use client";

/**
 * React Query hook for fetching tool with state
 *
 * Uses the combined endpoint to fetch both tool and state in one request.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchToolWithState,
  saveToolState,
  type ToolWithStateDTO,
} from "@/lib/fetchers/tool-fetchers";

interface UseToolRuntimeQueryOptions
  extends Omit<UseQueryOptions<ToolWithStateDTO, Error>, "queryKey" | "queryFn"> {
  enabled?: boolean;
}

/**
 * Generate deployment ID from space and placement
 */
function generateDeploymentId(spaceId: string, placementId: string): string {
  return `space:${spaceId}_${placementId}`;
}

/**
 * Fetch tool with state using React Query
 *
 * @example
 * const { data, isLoading } = useToolRuntimeQuery({
 *   toolId: 'tool-123',
 *   deploymentId: 'deployment-456'
 * });
 */
export function useToolRuntimeQuery(
  {
    toolId,
    deploymentId,
    spaceId,
    placementId,
  }: {
    toolId: string;
    deploymentId?: string;
    spaceId?: string;
    placementId?: string;
  },
  options?: UseToolRuntimeQueryOptions
) {
  // Calculate effective deployment ID
  const effectiveDeploymentId =
    deploymentId ||
    (spaceId && placementId ? generateDeploymentId(spaceId, placementId) : undefined);

  return useQuery({
    queryKey: queryKeys.tools.withState(toolId, effectiveDeploymentId),
    queryFn: () => fetchToolWithState(toolId, effectiveDeploymentId),
    enabled: Boolean(toolId) && options?.enabled !== false,
    staleTime: 1000 * 30, // 30 seconds - tools may update frequently
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    ...options,
  });
}

/**
 * Mutation hook for saving tool state
 *
 * @example
 * const { mutate: saveState, isPending } = useToolStateMutation('deployment-123');
 * saveState({ counter: 5 });
 */
export function useToolStateMutation(
  deploymentId: string,
  options?: {
    toolId?: string;
    spaceId?: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (state: Record<string, unknown>) =>
      saveToolState(deploymentId, state, {
        toolId: options?.toolId,
        spaceId: options?.spaceId,
      }),
    onSuccess: () => {
      // Invalidate the tool state cache
      if (options?.toolId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tools.withState(options.toolId, deploymentId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.tools.state(deploymentId),
      });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}

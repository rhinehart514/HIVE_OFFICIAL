"use client";

/**
 * React Query hooks for HiveLab tools
 *
 * Provides caching for tool data and state.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchTool,
  fetchToolWithState,
  fetchToolState,
  fetchUserTools,
  type ToolDTO,
  type ToolWithStateDTO,
  type ToolStateDTO,
} from "@/lib/fetchers";

// ============================================================
// Single Tool
// ============================================================

interface UseToolQueryOptions
  extends Omit<UseQueryOptions<ToolDTO, Error>, "queryKey" | "queryFn"> {
  enabled?: boolean;
}

/**
 * Fetch a single tool by ID
 *
 * @example
 * const { data: tool, isLoading } = useToolQuery(toolId);
 */
export function useToolQuery(toolId: string, options?: UseToolQueryOptions) {
  return useQuery<ToolDTO, Error>({
    queryKey: queryKeys.tools.detail(toolId),
    queryFn: () => fetchTool(toolId),
    enabled: Boolean(toolId) && options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    ...options,
  });
}

// ============================================================
// Tool with State (for runtime)
// ============================================================

interface UseToolWithStateOptions
  extends Omit<UseQueryOptions<ToolWithStateDTO, Error>, "queryKey" | "queryFn"> {
  enabled?: boolean;
}

/**
 * Fetch tool with its state (combined request for runtime)
 *
 * @example
 * const { data } = useToolWithState(toolId, deploymentId);
 */
export function useToolWithState(
  toolId: string,
  deploymentId?: string,
  options?: UseToolWithStateOptions
) {
  return useQuery<ToolWithStateDTO, Error>({
    queryKey: queryKeys.tools.withState(toolId, deploymentId),
    queryFn: () => fetchToolWithState(toolId, deploymentId),
    enabled: Boolean(toolId) && options?.enabled !== false,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

// ============================================================
// Tool State Only
// ============================================================

/**
 * Fetch tool state by deployment ID
 *
 * @example
 * const { data: state } = useToolState(deploymentId);
 */
export function useToolStateQuery(
  deploymentId: string,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery<ToolStateDTO>({
    queryKey: queryKeys.tools.state(deploymentId),
    queryFn: () => fetchToolState(deploymentId),
    enabled: Boolean(deploymentId) && options?.enabled !== false,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: options?.refetchInterval,
  });
}

// ============================================================
// User's Tools
// ============================================================

/**
 * Fetch current user's tools
 *
 * @example
 * const { data: tools } = useUserTools({ status: 'published' });
 */
export function useUserTools(filters?: { status?: string }) {
  return useQuery<ToolDTO[]>({
    queryKey: queryKeys.tools.list(filters),
    queryFn: () => fetchUserTools(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

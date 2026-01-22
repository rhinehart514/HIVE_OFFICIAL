'use client';

/**
 * useSpaceTools - React Query hook for fetching space tools
 *
 * Provides tools deployed to a space with filtering by placement.
 * Integrates with the existing space tools API.
 *
 * @version 1.0.0 - HiveLab Sprint 1 (Jan 2026)
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

// ============================================================
// Types
// ============================================================

export type PlacementLocation = 'sidebar' | 'inline' | 'modal' | 'tab';
export type PlacementVisibility = 'all' | 'members' | 'leaders';

export interface PlacedToolDTO {
  // Placement info
  placementId: string;
  toolId: string;
  placement: PlacementLocation;
  order: number;
  isActive: boolean;
  source: 'leader' | 'system' | 'inherited';
  visibility: PlacementVisibility;
  titleOverride?: string;
  isEditable: boolean;
  configOverrides?: Record<string, unknown>;
  state?: Record<string, unknown>;
  placedAt: string;
  placedBy?: string;

  // Tool metadata
  name: string;
  description: string;
  category: string;
  version: string;
  elementType: string;

  // Surface modes for "View Full" link
  surfaceModes: {
    widget: boolean;
    app: boolean;
  };
  deploymentId: string;

  // Tool stats
  originalTool?: {
    averageRating: number;
    ratingCount: number;
    totalDeployments: number;
    isVerified: boolean;
    creatorId?: string;
  };

  // Activity metrics (added by Sprint 1)
  activityCount?: number;
  lastActivityAt?: string;
}

export interface UseSpaceToolsOptions {
  /** Space ID to fetch tools for */
  spaceId: string | undefined;
  /** Filter by placement location */
  placement?: PlacementLocation | 'all';
  /** Filter by active status */
  status?: 'active' | 'inactive' | 'all';
  /** Enable/disable the query */
  enabled?: boolean;
}

export interface UseSpaceToolsReturn {
  /** All tools matching the filter */
  tools: PlacedToolDTO[];
  /** Tools specifically placed in sidebar */
  sidebarTools: PlacedToolDTO[];
  /** Tools placed inline in the feed */
  inlineTools: PlacedToolDTO[];
  /** Whether the query is loading */
  isLoading: boolean;
  /** Whether the query is fetching (includes background refetch) */
  isFetching: boolean;
  /** Error from the query */
  error: Error | null;
  /** Manually refetch tools */
  refetch: () => Promise<void>;
  /** Invalidate the cache (e.g., after deploying a new tool) */
  invalidate: () => Promise<void>;
}

// ============================================================
// Query Key Factory
// ============================================================

export const spaceToolsKeys = {
  all: ['space-tools'] as const,
  space: (spaceId: string) => [...spaceToolsKeys.all, spaceId] as const,
  filtered: (spaceId: string, placement: string, status: string) =>
    [...spaceToolsKeys.space(spaceId), { placement, status }] as const,
};

// ============================================================
// Fetcher
// ============================================================

async function fetchSpaceTools(
  spaceId: string,
  placement: string,
  status: string
): Promise<PlacedToolDTO[]> {
  const params = new URLSearchParams({
    placement,
    status,
    limit: '50', // Reasonable limit for sidebar
    sortBy: 'order',
  });

  const response = await fetch(`/api/spaces/${spaceId}/tools?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 404) {
      return []; // Space not found or no tools
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch space tools');
  }

  const data = await response.json();
  return data.tools || [];
}

// ============================================================
// Hook
// ============================================================

export function useSpaceTools({
  spaceId,
  placement = 'all',
  status = 'active',
  enabled = true,
}: UseSpaceToolsOptions): UseSpaceToolsReturn {
  const queryClient = useQueryClient();

  const queryKey = spaceId
    ? spaceToolsKeys.filtered(spaceId, placement, status)
    : spaceToolsKeys.all;

  const {
    data: tools = [],
    isLoading,
    isFetching,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchSpaceTools(spaceId!, placement, status),
    enabled: enabled && !!spaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes (matches API cache)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Filter tools by placement
  const sidebarTools = tools.filter((t) => t.placement === 'sidebar');
  const inlineTools = tools.filter((t) => t.placement === 'inline');

  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  const invalidate = useCallback(async () => {
    if (spaceId) {
      await queryClient.invalidateQueries({
        queryKey: spaceToolsKeys.space(spaceId),
      });
    }
  }, [queryClient, spaceId]);

  return {
    tools,
    sidebarTools,
    inlineTools,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
    invalidate,
  };
}

export default useSpaceTools;

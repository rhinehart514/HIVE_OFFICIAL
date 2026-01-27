'use client';

/**
 * useSpaceContext - Loads space metadata and assembles SpaceContext for HiveLab tools
 *
 * This hook fetches space data from the API and transforms it into the SpaceContext
 * type defined in @hive/core for use with HiveLab tool runtime context.
 *
 * @version 1.0.0 - HiveLab Phase 1 (Jan 2026)
 */

import * as React from 'react';
import type { SpaceContext } from '@hive/core';

// ============================================================================
// Types
// ============================================================================

interface UseSpaceContextOptions {
  /** Optional callback to use custom fetch (for testing or server components) */
  fetch?: typeof globalThis.fetch;
}

interface UseSpaceContextReturn {
  /** The assembled space context */
  spaceContext: SpaceContext | null;
  /** Whether the context is still loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Refresh the space context */
  refresh: () => Promise<void>;
}

// ============================================================================
// API Response Types
// ============================================================================

interface SpaceAPIResponse {
  data?: SpaceDataResponse;
  // Direct response format (no wrapper)
  id?: string;
  name?: string;
  description?: string;
  category?: string;
  slug?: string;
  iconUrl?: string;
  icon?: string;
  bannerUrl?: string;
  memberCount?: number;
  onlineCount?: number;
  isVerified?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  settings?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
}

interface SpaceDataResponse {
  id: string;
  name: string;
  description?: string;
  category?: string;
  slug?: string;
  iconUrl?: string;
  icon?: string;
  bannerUrl?: string;
  banner?: string;
  memberCount?: number;
  onlineCount?: number;
  isVerified?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  settings?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to load and assemble SpaceContext for HiveLab tool runtime
 *
 * @param spaceId - The ID of the space to load context for
 * @param options - Optional configuration
 * @returns SpaceContext, loading state, and error
 *
 * @example
 * ```tsx
 * function ToolDisplay({ spaceId }: { spaceId: string }) {
 *   const { spaceContext, isLoading, error } = useSpaceContext(spaceId);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Error message={error} />;
 *   if (!spaceContext) return null;
 *
 *   return <ToolCanvas context={{ space: spaceContext }} />;
 * }
 * ```
 */
export function useSpaceContext(
  spaceId: string | undefined,
  options: UseSpaceContextOptions = {}
): UseSpaceContextReturn {
  const { fetch: customFetch = globalThis.fetch } = options;

  const [spaceContext, setSpaceContext] = React.useState<SpaceContext | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSpaceContext = React.useCallback(async () => {
    if (!spaceId) {
      setSpaceContext(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await customFetch(`/api/spaces/${spaceId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Space not found');
        }
        throw new Error(`Failed to load space: ${response.status}`);
      }

      const json: SpaceAPIResponse = await response.json();

      // Handle both wrapped and direct response formats
      const data = json.data || json;

      if (!data.id && !json.id) {
        throw new Error('Invalid space response');
      }

      // Map API response to SpaceContext
      const context: SpaceContext = {
        spaceId: data.id || json.id || spaceId,
        spaceName: data.name || json.name || 'Unnamed Space',
        memberCount: data.memberCount ?? json.memberCount ?? 0,
        onlineCount: data.onlineCount ?? json.onlineCount,
        category: data.category || json.category || 'club',
        isVerified: data.isVerified ?? json.isVerified ?? false,
        brand: buildBrand(data, json),
      };

      setSpaceContext(context);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load space context';
      setError(message);
      setSpaceContext(null);
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, customFetch]);

  // Initial fetch
  React.useEffect(() => {
    void fetchSpaceContext();
  }, [fetchSpaceContext]);

  const refresh = React.useCallback(async () => {
    await fetchSpaceContext();
  }, [fetchSpaceContext]);

  return {
    spaceContext,
    isLoading,
    error,
    refresh,
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build brand configuration from API response
 */
function buildBrand(
  data: SpaceAPIResponse | SpaceDataResponse,
  fallback: SpaceAPIResponse
): SpaceContext['brand'] | undefined {
  const primaryColor =
    data.primaryColor ||
    data.settings?.primaryColor ||
    fallback.primaryColor;

  const secondaryColor =
    data.secondaryColor ||
    data.settings?.secondaryColor ||
    fallback.secondaryColor;

  const iconUrl = data.iconUrl || data.icon || fallback.iconUrl;

  // Only return brand if at least one field is present
  if (!primaryColor && !secondaryColor && !iconUrl) {
    return undefined;
  }

  return {
    primaryColor,
    secondaryColor,
    iconUrl,
  };
}

export default useSpaceContext;

/**
 * HIVE Feature Flags Hook
 * Client-side hook for checking feature flag state
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@hive/auth-logic';

// Feature flag IDs - keep in sync with server-side HIVE_FEATURE_FLAGS
export const FEATURE_FLAGS = {
  // Social features
  ENABLE_DMS: 'enable_dms',
  ENABLE_CONNECTIONS: 'enable_connections',

  // Core features
  SPACES_V2: 'spaces_v2',
  HIVELAB: 'hivelab',
  CHAT_BOARD: 'chat_board',
  GHOST_MODE: 'ghost_mode',
  REALTIME_FEED: 'realtime_feed',
  CALENDAR_SYNC: 'calendar_sync',
  RITUALS: 'rituals',
} as const;

export type FeatureFlagId = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

interface FeatureFlagState {
  flags: Record<string, boolean>;
  isLoading: boolean;
  error: Error | null;
}

interface UseFeatureFlagsReturn extends FeatureFlagState {
  isEnabled: (flagId: string) => boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to check feature flags for the current user
 *
 * @param flagIds - Optional array of specific flag IDs to fetch. If not provided, fetches all predefined flags.
 * @returns Feature flag state and utilities
 *
 * @example
 * ```tsx
 * const { isEnabled, isLoading } = useFeatureFlags();
 *
 * if (isLoading) return <Spinner />;
 * if (isEnabled('enable_dms')) return <DMButton />;
 * ```
 */
export function useFeatureFlags(flagIds?: string[]): UseFeatureFlagsReturn {
  const { user } = useAuth();
  const [state, setState] = useState<FeatureFlagState>({
    flags: {},
    isLoading: true,
    error: null,
  });

  const flagsToFetch = useMemo(() => {
    return flagIds || Object.values(FEATURE_FLAGS);
  }, [flagIds]);

  const fetchFlags = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/feature-flags?flags=${flagsToFetch.join(',')}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }

      const data = await response.json();

      // Extract enabled state from response
      const flags: Record<string, boolean> = {};
      if (data.flags) {
        for (const [flagId, result] of Object.entries(data.flags)) {
          flags[flagId] = (result as { enabled: boolean }).enabled;
        }
      }

      setState({
        flags,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [flagsToFetch]);

  // Fetch flags on mount and when user changes
  useEffect(() => {
    fetchFlags();
  }, [fetchFlags, user?.id]);

  const isEnabled = useCallback(
    (flagId: string): boolean => {
      return state.flags[flagId] === true;
    },
    [state.flags]
  );

  return {
    ...state,
    isEnabled,
    refresh: fetchFlags,
  };
}

/**
 * Convenience hook for checking a single feature flag
 */
export function useFeatureFlag(flagId: FeatureFlagId): {
  enabled: boolean;
  isLoading: boolean;
} {
  const { isEnabled, isLoading } = useFeatureFlags([flagId]);
  return {
    enabled: isEnabled(flagId),
    isLoading,
  };
}

/**
 * Convenience hooks for common feature flags
 */
export function useDMsEnabled(): { enabled: boolean; isLoading: boolean } {
  return useFeatureFlag(FEATURE_FLAGS.ENABLE_DMS);
}

export function useConnectionsEnabled(): { enabled: boolean; isLoading: boolean } {
  return useFeatureFlag(FEATURE_FLAGS.ENABLE_CONNECTIONS);
}

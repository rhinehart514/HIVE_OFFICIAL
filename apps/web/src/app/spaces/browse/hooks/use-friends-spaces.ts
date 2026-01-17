/**
 * useFriendsSpaces - Fetch spaces where user's friends/connections are
 *
 * Uses /api/spaces/browse-v2 and filters for spaces with mutualCount > 0.
 * Returns spaces the user is NOT in but their friends ARE in.
 */

'use client';

import * as React from 'react';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { logger } from '@/lib/logger';
import type { SpaceSearchResult } from './use-browse-page-state';

// ============================================================
// Types
// ============================================================

export interface FriendsSpace extends SpaceSearchResult {
  /** Friends in this space (guaranteed > 0) */
  mutualCount: number;
  /** Avatar URLs of friends in this space */
  mutualAvatars: string[];
}

export interface UseFriendsSpacesReturn {
  spaces: FriendsSpace[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasFriendsInSpaces: boolean;
}

// ============================================================
// Hook Implementation
// ============================================================

export function useFriendsSpaces(
  /** Space IDs the user is already in (to exclude) */
  excludeSpaceIds: string[] = []
): UseFriendsSpacesReturn {
  const { user } = useAuth();
  const [spaces, setSpaces] = React.useState<FriendsSpace[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const excludeSet = React.useMemo(
    () => new Set(excludeSpaceIds),
    [excludeSpaceIds]
  );

  const fetchFriendsSpaces = React.useCallback(async () => {
    if (!user) {
      setSpaces([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all spaces with mutual enrichment
      const res = await secureApiFetch('/api/spaces/browse-v2?limit=50&sort=trending', {
        method: 'GET',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch spaces: ${res.status}`);
      }

      const response = await res.json();
      const allSpaces: SpaceSearchResult[] = response?.data?.spaces || response?.spaces || [];

      // Filter for:
      // 1. Spaces with friends (mutualCount > 0)
      // 2. Spaces the user is NOT already in
      const friendsSpaces = allSpaces
        .filter((space): space is FriendsSpace => {
          const hasFriends = (space.mutualCount ?? 0) > 0;
          const notMember = !excludeSet.has(space.id);
          return hasFriends && notMember;
        })
        // Sort by friend count (most friends first)
        .sort((a, b) => (b.mutualCount ?? 0) - (a.mutualCount ?? 0))
        // Limit to top 10
        .slice(0, 10);

      setSpaces(friendsSpaces);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load friends spaces';
      setError(message);
      logger.error('Failed to fetch friends spaces', { component: 'useFriendsSpaces' }, err instanceof Error ? err : undefined);
    } finally {
      setLoading(false);
    }
  }, [user, excludeSet]);

  // Refetch when excludeSpaceIds changes
  React.useEffect(() => {
    fetchFriendsSpaces();
  }, [fetchFriendsSpaces]);

  return {
    spaces,
    loading,
    error,
    refetch: fetchFriendsSpaces,
    hasFriendsInSpaces: spaces.length > 0,
  };
}

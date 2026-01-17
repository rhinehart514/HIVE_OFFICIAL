/**
 * useMySpaces - Fetch user's joined spaces
 *
 * Uses /api/spaces/my to get spaces the user has joined.
 * Returns data needed for the "Your Spaces" dashboard view.
 */

'use client';

import * as React from 'react';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { logger } from '@/lib/logger';

// ============================================================
// Types
// ============================================================

export interface SpaceMembership {
  role: string;
  joinedAt: string | null;
  lastVisited: string;
  notifications: number;
  pinned: boolean;
}

export interface MySpace {
  id: string;
  name: string;
  description: string;
  slug?: string;
  category: string;
  memberCount: number;
  bannerImage?: string;
  isActive: boolean;
  membership: SpaceMembership;
  // Enhanced fields (to be added)
  nextEvent?: {
    id: string;
    title: string;
    startAt: string;
    attendeeCount: number;
  } | null;
  unreadCount?: number;
  onlineCount?: number;
}

export interface MySpacesStats {
  totalSpaces: number;
  adminSpaces: number;
  totalNotifications: number;
  weeklyActivity: number;
}

export interface MySpacesResponse {
  activeSpaces: MySpace[];
  pinnedSpaces: MySpace[];
  stats: MySpacesStats;
}

export interface UseMySpacesReturn {
  spaces: MySpace[];
  pinnedSpaces: MySpace[];
  stats: MySpacesStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasSpaces: boolean;
}

// ============================================================
// Hook Implementation
// ============================================================

export function useMySpaces(): UseMySpacesReturn {
  const { user } = useAuth();
  const [spaces, setSpaces] = React.useState<MySpace[]>([]);
  const [pinnedSpaces, setPinnedSpaces] = React.useState<MySpace[]>([]);
  const [stats, setStats] = React.useState<MySpacesStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSpaces = React.useCallback(async () => {
    if (!user) {
      setSpaces([]);
      setPinnedSpaces([]);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use /api/profile/my-spaces which has proper fallbacks for createdBy and leaders
      const res = await secureApiFetch('/api/profile/my-spaces?limit=50', {
        method: 'GET',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch spaces: ${res.status}`);
      }

      const data = await res.json();

      if (data.success !== false) {
        // Map profile/my-spaces response to MySpace format
        const allSpaces: MySpace[] = (data.spaces || []).map((space: {
          id: string;
          name: string;
          description?: string;
          bannerUrl?: string;
          type?: string;
          metrics?: { memberCount?: number };
          membership?: { role?: string; joinedAt?: unknown; isPinned?: boolean };
        }) => ({
          id: space.id,
          name: space.name,
          description: space.description || '',
          slug: undefined,
          category: space.type || 'student_org',
          memberCount: space.metrics?.memberCount || 0,
          bannerImage: space.bannerUrl,
          isActive: true,
          membership: {
            role: space.membership?.role || 'member',
            joinedAt: space.membership?.joinedAt ? String(space.membership.joinedAt) : null,
            lastVisited: new Date().toISOString(),
            notifications: 0,
            pinned: space.membership?.isPinned || false,
          },
        }));

        setSpaces(allSpaces);
        setPinnedSpaces(allSpaces.filter(s => s.membership.pinned));
        setStats({
          totalSpaces: data.totalCount || allSpaces.length,
          adminSpaces: (data.categorized?.owned || []).length,
          totalNotifications: 0,
          weeklyActivity: 0,
        });
      } else {
        throw new Error(data.error || 'Failed to load spaces');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load spaces';
      setError(message);
      logger.error('Failed to fetch my spaces', {
        component: 'useMySpaces',
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  React.useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  return {
    spaces,
    pinnedSpaces,
    stats,
    loading,
    error,
    refetch: fetchSpaces,
    hasSpaces: spaces.length > 0,
  };
}

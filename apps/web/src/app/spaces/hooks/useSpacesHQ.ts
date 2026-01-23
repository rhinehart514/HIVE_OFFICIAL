'use client';

import * as React from 'react';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';

// ============================================================
// Types
// ============================================================

export interface Space {
  id: string;
  name: string;
  handle?: string;
  description?: string;
  avatarUrl?: string;
  category: string;
  memberCount: number;
  isVerified?: boolean;
  onlineCount?: number;
  unreadCount?: number;
}

export interface IdentityClaim {
  id: string;
  type: 'residential' | 'major' | 'greek';
  spaceId: string;
  spaceName: string;
  spaceAvatarUrl?: string;
  memberCount: number;
  claimedAt: Date;
}

export interface AttentionItem {
  id: string;
  type: 'vote' | 'rsvp' | 'deadline' | 'mention';
  spaceId: string;
  spaceName: string;
  spaceAvatarUrl?: string;
  title: string;
  urgency: 'low' | 'medium' | 'high';
  deadline?: Date;
}

export interface LiveSpace {
  id: string;
  name: string;
  avatarUrl?: string;
  eventName?: string;
  participantCount: number;
}

export interface RecentActivity {
  id: string;
  spaceId: string;
  spaceName: string;
  spaceAvatarUrl?: string;
  type: 'message' | 'event' | 'post';
  preview: string;
  timestamp: Date;
}

export type HQState = 'empty' | 'onboarding' | 'active';

interface SpaceMembershipDTO {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  category: string;
  memberCount: number;
  isVerified?: boolean;
  membership: {
    role: string;
    joinedAt: string;
    lastVisited: string;
    notifications: number;
    pinned: boolean;
  };
}

interface IdentityClaimsResponse {
  claims: {
    residential: IdentityClaim | null;
    major: IdentityClaim | null;
    greek: IdentityClaim | null;
  };
}

// ============================================================
// Hook
// ============================================================

export interface UseSpacesHQReturn {
  // State
  state: HQState;
  loading: boolean;
  error: string | null;

  // Identity spaces
  identityClaims: {
    major: IdentityClaim | null;
    home: IdentityClaim | null;
    greek: IdentityClaim | null;
  };
  identityProgress: number; // 0-3 for onboarding progress

  // Organizations (non-identity spaces)
  organizations: Space[];

  // Attention items
  actions: AttentionItem[];
  liveSpaces: LiveSpace[];

  // Recent activity
  recentActivity: RecentActivity[];

  // Actions
  refresh: () => void;
}

export function useSpacesHQ(): UseSpacesHQReturn {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Data
  const [allSpaces, setAllSpaces] = React.useState<SpaceMembershipDTO[]>([]);
  const [identityClaims, setIdentityClaims] = React.useState<{
    major: IdentityClaim | null;
    home: IdentityClaim | null;
    greek: IdentityClaim | null;
  }>({
    major: null,
    home: null,
    greek: null,
  });

  // Fetch data
  const fetchData = React.useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch in parallel
      const [spacesRes, identityRes] = await Promise.all([
        secureApiFetch('/api/spaces/my', { method: 'GET' }),
        secureApiFetch('/api/spaces/identity', { method: 'GET' }),
      ]);

      // Process spaces
      const spacesData = await spacesRes.json();
      const activeSpaces = spacesData.data?.activeSpaces || spacesData.activeSpaces || [];
      setAllSpaces(
        activeSpaces.map((s: SpaceMembershipDTO) => ({
          id: s.id,
          name: s.name,
          handle: s.handle,
          avatarUrl: s.avatarUrl,
          category: s.category || 'general',
          memberCount: s.memberCount || 0,
          isVerified: s.isVerified,
          membership: s.membership,
        }))
      );

      // Process identity claims
      const identityData: IdentityClaimsResponse = await identityRes.json();
      const claims = identityData.claims || { residential: null, major: null, greek: null };
      setIdentityClaims({
        major: claims.major,
        home: claims.residential, // Map residential to home
        greek: claims.greek,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load spaces');
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute state
  const identityProgress = [
    identityClaims.major,
    identityClaims.home,
    identityClaims.greek,
  ].filter(Boolean).length;

  const state: HQState = React.useMemo(() => {
    if (allSpaces.length === 0 && identityProgress === 0) return 'empty';
    if (identityProgress < 3) return 'onboarding';
    return 'active';
  }, [allSpaces.length, identityProgress]);

  // Filter organizations (non-identity spaces)
  const organizations: Space[] = React.useMemo(() => {
    const identitySpaceIds = new Set(
      [identityClaims.major, identityClaims.home, identityClaims.greek]
        .filter(Boolean)
        .map((c) => c!.spaceId)
    );

    return allSpaces
      .filter((s) => !identitySpaceIds.has(s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        handle: s.handle,
        avatarUrl: s.avatarUrl,
        category: s.category,
        memberCount: s.memberCount,
        isVerified: s.isVerified,
        unreadCount: s.membership?.notifications || 0,
      }));
  }, [allSpaces, identityClaims]);

  // Mock attention items (would come from API in production)
  const actions: AttentionItem[] = React.useMemo(() => {
    // TODO: Fetch from /api/spaces/attention or similar
    return [];
  }, []);

  // Mock live spaces (would come from presence API)
  const liveSpaces: LiveSpace[] = React.useMemo(() => {
    // TODO: Fetch from presence/realtime API
    return organizations
      .slice(0, 2)
      .map((s) => ({
        id: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl,
        participantCount: Math.floor(Math.random() * 20) + 5,
      }));
  }, [organizations]);

  // Mock recent activity
  const recentActivity: RecentActivity[] = React.useMemo(() => {
    return allSpaces.slice(0, 4).map((s, i) => ({
      id: `activity-${s.id}`,
      spaceId: s.id,
      spaceName: s.name,
      spaceAvatarUrl: s.avatarUrl,
      type: ['message', 'event', 'post'][i % 3] as 'message' | 'event' | 'post',
      preview: 'New activity in this space',
      timestamp: new Date(Date.now() - i * 3600000),
    }));
  }, [allSpaces]);

  return {
    state,
    loading,
    error,
    identityClaims,
    identityProgress,
    organizations,
    actions,
    liveSpaces,
    recentActivity,
    refresh: fetchData,
  };
}

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
  recentMessageCount?: number; // Messages in last 24h for energy calculation
}

export interface IdentityClaim {
  id: string;
  type: 'residential' | 'major' | 'greek';
  spaceId: string;
  spaceName: string;
  spaceAvatarUrl?: string;
  memberCount: number;
  claimedAt: Date;
  recentMessageCount?: number; // Messages in last 24h for energy calculation
  onlineCount?: number; // Current presence count
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
  recentMessageCount?: number;
  onlineCount?: number;
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
        secureApiFetch('/api/spaces/mine', { method: 'GET' }),
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
          recentMessageCount: s.recentMessageCount || 0,
          onlineCount: s.onlineCount || 0,
          membership: s.membership,
        }))
      );

      // Process identity claims - enrich with energy data from spaces
      const identityData: IdentityClaimsResponse = await identityRes.json();
      const claims = identityData.claims || { residential: null, major: null, greek: null };

      // Create a map for quick lookup of space energy data
      type EnergyData = { recentMessageCount: number; onlineCount: number };
      const spaceEnergyMap = new Map<string, EnergyData>(
        activeSpaces.map((s: SpaceMembershipDTO) => [
          s.id,
          { recentMessageCount: s.recentMessageCount || 0, onlineCount: s.onlineCount || 0 },
        ])
      );

      // Enrich identity claims with energy data
      const enrichClaim = (claim: IdentityClaim | null): IdentityClaim | null => {
        if (!claim) return null;
        const energyData = spaceEnergyMap.get(claim.spaceId);
        return {
          ...claim,
          recentMessageCount: energyData?.recentMessageCount ?? 0,
          onlineCount: energyData?.onlineCount ?? 0,
        };
      };

      setIdentityClaims({
        major: enrichClaim(claims.major),
        home: enrichClaim(claims.residential), // Map residential to home
        greek: enrichClaim(claims.greek),
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
        recentMessageCount: s.recentMessageCount || 0,
        onlineCount: s.onlineCount || 0,
      }));
  }, [allSpaces, identityClaims]);

  return {
    state,
    loading,
    error,
    identityClaims,
    identityProgress,
    organizations,
    refresh: fetchData,
  };
}

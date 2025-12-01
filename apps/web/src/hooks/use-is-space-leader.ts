"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@hive/auth-logic';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';

interface SpaceLeadershipState {
  isSpaceLeader: boolean;
  ownedSpacesCount: number;
  adminSpacesCount: number;
  isLoading: boolean;
  error: string | null;
  ledSpaceIds: string[];
}

/**
 * Hook to check if the current user is a leader of any space.
 * A "space leader" is someone who is an owner or admin of at least one space.
 * This determines access to HiveLAB and other leader-specific features.
 */
export function useIsSpaceLeader(): SpaceLeadershipState {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<SpaceLeadershipState>({
    isSpaceLeader: false,
    ownedSpacesCount: 0,
    adminSpacesCount: 0,
    isLoading: true,
    error: null,
    ledSpaceIds: [],
  });

  const checkLeadership = useCallback(async () => {
    if (!user?.uid) {
      setState({
        isSpaceLeader: false,
        ownedSpacesCount: 0,
        adminSpacesCount: 0,
        isLoading: false,
        error: null,
        ledSpaceIds: [],
      });
      return;
    }

    try {
      const response = await apiClient.get('/api/profile/my-spaces?limit=50', {
        suppressToast: true,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch spaces: ${response.status}`);
      }

      const data = await response.json();

      // Extract counts from response
      const ownedCount = data.counts?.owned ?? data.categorized?.owned?.length ?? 0;
      const adminCount = data.counts?.adminned ?? data.categorized?.adminned?.length ?? 0;

      // Get IDs of spaces user leads
      const ownedIds = (data.categorized?.owned ?? []).map((s: { id: string }) => s.id);
      const adminIds = (data.categorized?.adminned ?? []).map((s: { id: string }) => s.id);
      const ledSpaceIds = [...new Set([...ownedIds, ...adminIds])];

      const isLeader = ownedCount > 0 || adminCount > 0;

      logger.debug('Space leadership check', {
        userId: user.uid,
        ownedCount,
        adminCount,
        isLeader,
        component: 'useIsSpaceLeader',
      });

      setState({
        isSpaceLeader: isLeader,
        ownedSpacesCount: ownedCount,
        adminSpacesCount: adminCount,
        isLoading: false,
        error: null,
        ledSpaceIds,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check leadership';
      logger.error('Space leadership check failed', {
        userId: user?.uid,
        component: 'useIsSpaceLeader',
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      setState({
        isSpaceLeader: false,
        ownedSpacesCount: 0,
        adminSpacesCount: 0,
        isLoading: false,
        error: errorMessage,
        ledSpaceIds: [],
      });
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!authLoading) {
      checkLeadership();
    }
  }, [authLoading, checkLeadership]);

  return state;
}

/**
 * Lightweight version that just returns boolean.
 * Use this when you only need to know if user can access HiveLAB.
 */
export function useCanAccessHiveLab(): { canAccess: boolean; isLoading: boolean } {
  const { isSpaceLeader, isLoading } = useIsSpaceLeader();
  return { canAccess: isSpaceLeader, isLoading };
}

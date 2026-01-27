'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@hive/firebase';
import { logger } from '@/lib/logger';

/**
 * Real-time space membership state
 */
interface SpaceMembershipState {
  memberCount: number;
  recentMembers: Array<{
    userId: string;
    joinedAt: Date;
    role: string;
  }>;
  isConnected: boolean;
  lastUpdated: Date | null;
}

/**
 * Hook for real-time space membership updates
 *
 * Listens to membership changes for a specific space and provides
 * live member count and recent members list.
 *
 * Features:
 * - Mount-safe: Only listens when component is mounted
 * - Auto-cleanup: Unsubscribes on unmount
 * - Zero polling: Pure Firestore onSnapshot
 * - Cost controlled: Single listener per space
 *
 * @example
 * ```tsx
 * function SpaceHeader({ spaceId }: { spaceId: string }) {
 *   const { memberCount, isConnected } = useSpaceMembership(spaceId);
 *
 *   return (
 *     <div>
 *       <span>{memberCount} members</span>
 *       {isConnected && <span className="text-green-500">Live</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSpaceMembership(spaceId: string | undefined) {
  const [state, setState] = useState<SpaceMembershipState>({
    memberCount: 0,
    recentMembers: [],
    isConnected: false,
    lastUpdated: null,
  });

  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    if (!spaceId) {
      setState((prev) => ({ ...prev, isConnected: false }));
      return;
    }

    // Clean up any existing listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    try {
      // Listen to space members collection
      const membersRef = collection(db, 'spaceMembers');
      const membersQuery = query(
        membersRef,
        where('spaceId', '==', spaceId),
        where('isActive', '==', true),
        orderBy('joinedAt', 'desc'),
        limit(50) // Limit for efficiency
      );

      unsubscribeRef.current = onSnapshot(
        membersQuery,
        (snapshot) => {
          if (!isMountedRef.current) return;

          const members = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              userId: data.userId as string,
              joinedAt: data.joinedAt?.toDate() || new Date(),
              role: (data.role as string) || 'member',
            };
          });

          setState({
            memberCount: snapshot.size,
            recentMembers: members.slice(0, 10), // Keep only 10 most recent
            isConnected: true,
            lastUpdated: new Date(),
          });
        },
        (error) => {
          if (!isMountedRef.current) return;

          logger.error('Space membership listener error', {
            spaceId,
            error: error.message,
          });

          setState((prev) => ({
            ...prev,
            isConnected: false,
          }));
        }
      );

      logger.info('Started space membership listener', { spaceId });
    } catch (error) {
      logger.error('Failed to start space membership listener', {
        spaceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Cleanup on unmount or spaceId change
    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        logger.info('Cleaned up space membership listener', { spaceId });
      }
    };
  }, [spaceId]);

  return state;
}

/**
 * Real-time space activity state
 */
interface SpaceActivityState {
  recentActivity: Array<{
    id: string;
    type: string;
    userId: string;
    timestamp: Date;
    details?: Record<string, unknown>;
  }>;
  isConnected: boolean;
  lastUpdated: Date | null;
}

/**
 * Hook for real-time space activity updates
 *
 * Listens to activity feed for a specific space (posts, events, joins).
 *
 * @example
 * ```tsx
 * function SpaceActivityFeed({ spaceId }: { spaceId: string }) {
 *   const { recentActivity, isConnected } = useSpaceActivity(spaceId);
 *
 *   return (
 *     <ul>
 *       {recentActivity.map((activity) => (
 *         <li key={activity.id}>{activity.type}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useSpaceActivity(spaceId: string | undefined) {
  const [state, setState] = useState<SpaceActivityState>({
    recentActivity: [],
    isConnected: false,
    lastUpdated: null,
  });

  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    if (!spaceId) {
      setState((prev) => ({ ...prev, isConnected: false }));
      return;
    }

    // Clean up any existing listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    try {
      // Listen to space activity subcollection
      const activityRef = collection(db, 'spaces', spaceId, 'activity');
      const activityQuery = query(
        activityRef,
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      unsubscribeRef.current = onSnapshot(
        activityQuery,
        (snapshot) => {
          if (!isMountedRef.current) return;

          const activities = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              type: (data.type as string) || 'unknown',
              userId: (data.performedBy as string) || (data.userId as string) || '',
              timestamp: data.timestamp?.toDate() || new Date(),
              details: data.details as Record<string, unknown> | undefined,
            };
          });

          setState({
            recentActivity: activities,
            isConnected: true,
            lastUpdated: new Date(),
          });
        },
        (error) => {
          if (!isMountedRef.current) return;

          logger.error('Space activity listener error', {
            spaceId,
            error: error.message,
          });

          setState((prev) => ({
            ...prev,
            isConnected: false,
          }));
        }
      );

      logger.info('Started space activity listener', { spaceId });
    } catch (error) {
      logger.error('Failed to start space activity listener', {
        spaceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Cleanup on unmount or spaceId change
    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        logger.info('Cleaned up space activity listener', { spaceId });
      }
    };
  }, [spaceId]);

  return state;
}

/**
 * Combined hook for all real-time space data
 *
 * Use this when you need both membership and activity data.
 *
 * @example
 * ```tsx
 * function SpaceDashboard({ spaceId }: { spaceId: string }) {
 *   const { membership, activity, isConnected } = useSpaceRealtime(spaceId);
 *
 *   return (
 *     <div>
 *       <p>{membership.memberCount} members</p>
 *       <p>{activity.recentActivity.length} recent activities</p>
 *       {isConnected && <span>Live</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSpaceRealtime(spaceId: string | undefined) {
  const membership = useSpaceMembership(spaceId);
  const activity = useSpaceActivity(spaceId);

  return {
    membership,
    activity,
    isConnected: membership.isConnected || activity.isConnected,
    lastUpdated: membership.lastUpdated || activity.lastUpdated,
  };
}

'use client';

/**
 * useElementState Hook
 *
 * Centralizes the tri-layer state extraction pattern used across all elements:
 * 1. sharedState - Aggregate data visible to all users (counters, collections)
 * 2. userState - Per-user data (selections, participation, UI state)
 * 3. data - Legacy flat data (deprecated, for backward compatibility)
 *
 * This hook eliminates the repeated state extraction logic in every element.
 */

import { useMemo } from 'react';
import type { ElementSharedState, ElementUserState } from '../../../../lib/hivelab/element-system';
import type { ElementState, ElementStatus } from './types';

// ============================================================
// Hook Types
// ============================================================

interface UseElementStateOptions<T> {
  /** Element instance ID */
  id: string;
  /** Shared state from props */
  sharedState?: ElementSharedState;
  /** User state from props */
  userState?: ElementUserState;
  /** Legacy data prop (deprecated) */
  data?: unknown;
  /** Transform function to extract typed value */
  transform: (context: StateContext) => T;
  /** Determine element status from state */
  getStatus?: (value: T, context: StateContext) => ElementStatus;
}

interface StateContext {
  id: string;
  sharedState?: ElementSharedState;
  userState?: ElementUserState;
  data?: unknown;
  /** Helper to get a counter value */
  getCounter: (counterKey: string) => number;
  /** Helper to get a collection */
  getCollection: <T = unknown>(collectionKey: string) => Record<string, T>;
  /** Helper to get a user selection */
  getSelection: <T = unknown>(selectionKey: string) => T | null;
  /** Helper to get user participation flag */
  getParticipation: (key: string) => boolean;
  /** Helper to check if user has participated */
  hasUserParticipated: (elementId: string) => boolean;
}

interface UseElementStateResult<T> extends ElementState<T> {
  /** Helper to get a counter by key */
  getCounter: (counterKey: string) => number;
  /** Helper to get user's selection */
  getSelection: <S = unknown>(key: string) => S | null;
  /** Helper to check participation */
  hasParticipated: (key: string) => boolean;
  /** Raw shared state */
  sharedState?: ElementSharedState;
  /** Raw user state */
  userState?: ElementUserState;
}

// ============================================================
// Hook Implementation
// ============================================================

export function useElementState<T>({
  id,
  sharedState,
  userState,
  data,
  transform,
  getStatus,
}: UseElementStateOptions<T>): UseElementStateResult<T> {
  // Create stable helper functions
  const helpers = useMemo(() => ({
    getCounter: (counterKey: string): number => {
      if (!sharedState?.counters) return 0;
      // Support both full key and auto-prefixed key
      const fullKey = counterKey.includes(':') ? counterKey : `${id}:${counterKey}`;
      return sharedState.counters[fullKey] ?? 0;
    },

    getCollection: <C = unknown>(collectionKey: string): Record<string, C> => {
      if (!sharedState?.collections) return {};
      const fullKey = collectionKey.includes(':') ? collectionKey : `${id}:${collectionKey}`;
      const collection = sharedState.collections[fullKey];
      if (!collection) return {};
      // Extract just the data from each entry
      const result: Record<string, C> = {};
      for (const [entryId, entry] of Object.entries(collection)) {
        result[entryId] = entry.data as C;
      }
      return result;
    },

    getSelection: <S = unknown>(selectionKey: string): S | null => {
      if (!userState?.selections) return null;
      const fullKey = selectionKey.includes(':') ? selectionKey : `${id}:${selectionKey}`;
      return (userState.selections[fullKey] as S) ?? null;
    },

    getParticipation: (key: string): boolean => {
      if (!userState?.participation) return false;
      const fullKey = key.includes(':') ? key : `${id}:${key}`;
      return userState.participation[fullKey] ?? false;
    },

    hasUserParticipated: (elementId: string): boolean => {
      if (!userState?.participation) return false;
      // Check if any participation key starts with this element ID
      return Object.keys(userState.participation).some(
        key => key.startsWith(`${elementId}:`) && userState.participation![key]
      );
    },
  }), [id, sharedState, userState]);

  // Create state context
  const context: StateContext = useMemo(() => ({
    id,
    sharedState,
    userState,
    data,
    ...helpers,
  }), [id, sharedState, userState, data, helpers]);

  // Transform state to typed value
  const value = useMemo(() => transform(context), [transform, context]);

  // Determine status
  const status = useMemo(() => {
    if (getStatus) {
      return getStatus(value, context);
    }
    // Default status logic
    if (value === null || value === undefined) return 'empty';
    if (Array.isArray(value) && value.length === 0) return 'empty';
    return 'complete';
  }, [value, getStatus, context]);

  return {
    status,
    value,
    ...helpers,
    getSelection: helpers.getSelection,
    hasParticipated: helpers.getParticipation,
    sharedState,
    userState,
  };
}

// ============================================================
// Specialized Hooks for Common Patterns
// ============================================================

/**
 * Hook for poll-style elements (voting, selections)
 */
export interface PollState {
  voteCounts: Record<string, number>;
  userVote: string | null;
  totalVotes: number;
  hasVoted: boolean;
}

export function usePollState(
  id: string,
  options: Array<{ id: string }>,
  sharedState?: ElementSharedState,
  userState?: ElementUserState
): UseElementStateResult<PollState> {
  return useElementState<PollState>({
    id,
    sharedState,
    userState,
    transform: (ctx) => {
      const voteCounts: Record<string, number> = {};
      let totalVotes = 0;

      for (const opt of options) {
        const count = ctx.getCounter(`${opt.id}`);
        voteCounts[opt.id] = count;
        totalVotes += count;
      }

      const userVote = ctx.getSelection<string>('selectedOption');

      return {
        voteCounts,
        userVote,
        totalVotes,
        hasVoted: userVote !== null,
      };
    },
    getStatus: (value) => {
      if (value.totalVotes === 0 && !value.hasVoted) return 'empty';
      return 'complete';
    },
  });
}

/**
 * Hook for counter-style elements
 */
export interface CounterState {
  count: number;
  userIncrement: number;
}

export function useCounterState(
  id: string,
  sharedState?: ElementSharedState,
  userState?: ElementUserState
): UseElementStateResult<CounterState> {
  return useElementState<CounterState>({
    id,
    sharedState,
    userState,
    transform: (ctx) => ({
      count: ctx.getCounter('value'),
      userIncrement: ctx.getSelection<number>('increment') ?? 0,
    }),
    getStatus: () => 'complete',
  });
}

/**
 * Hook for RSVP-style elements (capacity tracking)
 */
export interface RsvpState {
  attendeeCount: number;
  maxCapacity: number;
  isRsvped: boolean;
  isWaitlisted: boolean;
  waitlistPosition: number | null;
  isFull: boolean;
}

export function useRsvpState(
  id: string,
  maxCapacity: number,
  sharedState?: ElementSharedState,
  userState?: ElementUserState
): UseElementStateResult<RsvpState> {
  return useElementState<RsvpState>({
    id,
    sharedState,
    userState,
    transform: (ctx) => {
      const attendeeCount = ctx.getCounter('attendees');
      const waitlistCount = ctx.getCounter('waitlist');
      const isRsvped = ctx.getParticipation('rsvped');
      const isWaitlisted = ctx.getParticipation('waitlisted');
      const waitlistPosition = isWaitlisted
        ? ctx.getSelection<number>('waitlistPosition')
        : null;

      return {
        attendeeCount,
        maxCapacity,
        isRsvped,
        isWaitlisted,
        waitlistPosition,
        isFull: attendeeCount >= maxCapacity,
      };
    },
    getStatus: (value) => {
      if (value.attendeeCount === 0) return 'empty';
      if (value.isFull) return 'complete';
      return 'partial';
    },
  });
}

/**
 * Hook for leaderboard-style elements
 */
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  rank: number;
  avatar?: string;
}

export interface LeaderboardState {
  entries: LeaderboardEntry[];
  userRank: number | null;
  userScore: number | null;
}

export function useLeaderboardState(
  id: string,
  sharedState?: ElementSharedState,
  userState?: ElementUserState,
  userId?: string
): UseElementStateResult<LeaderboardState> {
  return useElementState<LeaderboardState>({
    id,
    sharedState,
    userState,
    transform: (ctx) => {
      const scores = ctx.getCollection<{ displayName: string; score: number; avatar?: string }>('scores');

      // Convert to entries and sort by score
      const entries: LeaderboardEntry[] = Object.entries(scores)
        .map(([id, data]) => ({
          userId: id,
          displayName: data.displayName,
          score: data.score,
          avatar: data.avatar,
          rank: 0, // Will be set after sorting
        }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      // Find user's position
      const userEntry = userId ? entries.find(e => e.userId === userId) : null;

      return {
        entries,
        userRank: userEntry?.rank ?? null,
        userScore: userEntry?.score ?? null,
      };
    },
    getStatus: (value) => {
      if (value.entries.length === 0) return 'empty';
      return 'complete';
    },
  });
}

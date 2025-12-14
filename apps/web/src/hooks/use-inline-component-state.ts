/**
 * useInlineComponentState
 *
 * Client-side hook for managing inline component state in chat.
 * Provides:
 * - Fetching component state with user's participation
 * - Optimistic updates for participation
 * - SSE subscription for real-time sync (with polling fallback)
 *
 * @example
 * ```tsx
 * function InlinePoll({ spaceId, componentId }) {
 *   const { state, submitParticipation, isSubmitting, error } = useInlineComponentState(
 *     spaceId,
 *     componentId
 *   );
 *
 *   if (!state) return <Skeleton />;
 *
 *   return (
 *     <PollElement
 *       question={state.config.question}
 *       options={state.config.options}
 *       counts={state.aggregations.optionCounts}
 *       userVote={state.userParticipation?.selectedOptions?.[0]}
 *       onVote={(option) => submitParticipation({ selectedOptions: [option] })}
 *       disabled={isSubmitting || !state.isActive}
 *     />
 *   );
 * }
 * ```
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Types matching the domain entity
export interface PollConfig {
  question: string;
  options: string[];
  allowMultiple: boolean;
  showResults: 'always' | 'after_vote' | 'after_close';
  closesAt?: string;
}

export interface CountdownConfig {
  title: string;
  targetDate: string;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
}

export interface RsvpConfig {
  eventId?: string;
  eventTitle: string;
  eventDate: string;
  maxCapacity?: number;
  allowMaybe: boolean;
}

export interface CustomConfig {
  elementType: string;
  toolId: string;
  settings: Record<string, unknown>;
}

export type ComponentConfig = PollConfig | CountdownConfig | RsvpConfig | CustomConfig;

export interface SharedState {
  optionCounts?: Record<string, number>;
  rsvpCounts?: {
    yes: number;
    no: number;
    maybe: number;
  };
  totalResponses: number;
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isComplete: boolean;
  };
}

export interface ParticipantRecord {
  userId: string;
  selectedOptions?: string[];
  response?: 'yes' | 'no' | 'maybe';
  data?: Record<string, unknown>;
  participatedAt: string;
}

export interface ComponentDisplayState {
  componentId: string;
  elementType: string;
  config: ComponentConfig;
  aggregations: SharedState;
  userParticipation?: ParticipantRecord;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  version: number;
}

export interface ParticipationInput {
  selectedOptions?: string[];
  response?: 'yes' | 'no' | 'maybe';
  data?: Record<string, unknown>;
}

interface UseInlineComponentStateResult {
  /** Current component state */
  state: ComponentDisplayState | null;
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Whether a participation submission is in progress */
  isSubmitting: boolean;
  /** Error message if any operation failed */
  error: string | null;
  /** Submit participation (vote, RSVP, etc.) */
  submitParticipation: (input: ParticipationInput) => Promise<boolean>;
  /** Refresh the component state */
  refresh: () => Promise<void>;
}

/**
 * Compute optimistic aggregation update for polls
 */
function computeOptimisticPollAggregation(
  current: SharedState,
  newOptions: string[],
  previousOptions?: string[]
): SharedState {
  const newCounts = { ...current.optionCounts };

  // Decrement previous vote(s)
  if (previousOptions) {
    for (const opt of previousOptions) {
      if (newCounts[opt] !== undefined) {
        newCounts[opt] = Math.max(0, newCounts[opt] - 1);
      }
    }
  }

  // Increment new vote(s)
  for (const opt of newOptions) {
    if (newCounts[opt] !== undefined) {
      newCounts[opt] = newCounts[opt] + 1;
    }
  }

  return {
    ...current,
    optionCounts: newCounts,
    totalResponses: previousOptions ? current.totalResponses : current.totalResponses + 1,
  };
}

/**
 * Compute optimistic aggregation update for RSVP
 */
function computeOptimisticRsvpAggregation(
  current: SharedState,
  newResponse: 'yes' | 'no' | 'maybe',
  previousResponse?: 'yes' | 'no' | 'maybe'
): SharedState {
  const baseCounts = current.rsvpCounts ?? { yes: 0, no: 0, maybe: 0 };
  const newCounts = { yes: baseCounts.yes, no: baseCounts.no, maybe: baseCounts.maybe };

  // Decrement previous response
  if (previousResponse) {
    newCounts[previousResponse] = Math.max(0, newCounts[previousResponse] - 1);
  }

  // Increment new response
  newCounts[newResponse] = newCounts[newResponse] + 1;

  return {
    ...current,
    rsvpCounts: newCounts,
    totalResponses: previousResponse ? current.totalResponses : current.totalResponses + 1,
  };
}

export function useInlineComponentState(
  spaceId: string,
  componentId: string,
  options?: {
    /** Enable polling fallback interval (ms). Default: 30000 */
    pollingInterval?: number;
    /** Enable SSE for real-time updates. Default: true */
    enableRealtime?: boolean;
  }
): UseInlineComponentStateResult {
  const [state, setState] = useState<ComponentDisplayState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track previous state for rollback
  const previousStateRef = useRef<ComponentDisplayState | null>(null);

  // Polling interval ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollingInterval = options?.pollingInterval ?? 30000;
  const enableRealtime = options?.enableRealtime ?? true;

  /**
   * Fetch component state from API
   */
  const fetchState = useCallback(async () => {
    if (!spaceId || !componentId) return;

    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/components/${componentId}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch component: ${response.status}`);
      }

      const data = await response.json();

      if (data.component) {
        setState(data.component);
        setError(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch component state';
      setError(message);
      console.error('[useInlineComponentState] Fetch error:', message);
    }
  }, [spaceId, componentId]);

  /**
   * Initial fetch and setup
   */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setIsLoading(true);
      await fetchState();
      if (mounted) {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [fetchState]);

  /**
   * Setup polling fallback for real-time updates
   */
  useEffect(() => {
    if (!enableRealtime || !state) return;

    // Start polling
    pollingIntervalRef.current = setInterval(() => {
      fetchState();
    }, pollingInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [enableRealtime, pollingInterval, fetchState, state]);

  /**
   * Submit participation with optimistic update
   */
  const submitParticipation = useCallback(async (input: ParticipationInput): Promise<boolean> => {
    if (!state || !state.isActive) {
      setError('Component is not active');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    // Save current state for potential rollback
    previousStateRef.current = state;

    // Apply optimistic update
    let optimisticAggregations = state.aggregations;
    let optimisticParticipation: ParticipantRecord = {
      userId: 'current-user', // Will be replaced by server
      participatedAt: new Date().toISOString(),
    };

    if (input.selectedOptions) {
      optimisticAggregations = computeOptimisticPollAggregation(
        state.aggregations,
        input.selectedOptions,
        state.userParticipation?.selectedOptions
      );
      optimisticParticipation.selectedOptions = input.selectedOptions;
    }

    if (input.response) {
      optimisticAggregations = computeOptimisticRsvpAggregation(
        state.aggregations,
        input.response,
        state.userParticipation?.response
      );
      optimisticParticipation.response = input.response;
    }

    if (input.data) {
      optimisticParticipation.data = input.data;
    }

    // Apply optimistic update
    setState(prev => prev ? {
      ...prev,
      aggregations: optimisticAggregations,
      userParticipation: optimisticParticipation,
    } : null);

    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/components/${componentId}/participate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to submit participation: ${response.status}`);
      }

      const data = await response.json();

      // Update with server response (authoritative state)
      if (data.component) {
        setState(data.component);
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit participation';
      setError(message);

      // Rollback optimistic update
      setState(previousStateRef.current);

      console.error('[useInlineComponentState] Submit error:', message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [state, spaceId, componentId]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    setError(null);
    await fetchState();
  }, [fetchState]);

  return {
    state,
    isLoading,
    isSubmitting,
    error,
    submitParticipation,
    refresh,
  };
}

/**
 * Type guard to check if config is a poll
 */
export function isPollConfig(config: ComponentConfig): config is PollConfig {
  return 'question' in config && 'options' in config;
}

/**
 * Type guard to check if config is a countdown
 */
export function isCountdownConfig(config: ComponentConfig): config is CountdownConfig {
  return 'targetDate' in config && 'title' in config && !('eventDate' in config);
}

/**
 * Type guard to check if config is an RSVP
 */
export function isRsvpConfig(config: ComponentConfig): config is RsvpConfig {
  return 'eventDate' in config && 'eventTitle' in config;
}

/**
 * Type guard to check if config is custom
 */
export function isCustomConfig(config: ComponentConfig): config is CustomConfig {
  return 'elementType' in config && 'toolId' in config && 'settings' in config;
}

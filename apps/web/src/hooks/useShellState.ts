/**
 * useShellState - Real-time shell state via Firebase RTDB
 *
 * Subscribes to shell_states/{shellId} for live updates.
 * Provides optimistic mutations for votes and RSVPs.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase, ref, onValue, off, set, update, type DataSnapshot } from 'firebase/database';
import { app } from '@hive/core';
import type { ShellState, ShellAction, PollState, BracketState, RSVPState } from '@/lib/shells/types';

/**
 * Fire-and-forget call to check if this interaction crossed a social-proof threshold.
 * Auth'd users write to RTDB directly (fast), then this async call triggers
 * the server-side notification check so creators get pull-back notifications.
 */
function notifyThresholdCheck(
  toolId: string,
  actionType: 'poll_vote' | 'bracket_vote' | 'rsvp_toggle' | 'poll_close',
  displayName?: string,
) {
  fetch(`/api/tools/${toolId}/check-threshold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType, displayName }),
  }).catch(() => {
    // Non-blocking — threshold check is best-effort
  });
}

export interface UseShellStateResult {
  state: ShellState | null;
  isConnected: boolean;
  error: Error | null;
  dispatch: (action: ShellAction, userId: string, meta?: Record<string, string>) => void;
}

export function useShellState(shellId: string | null): UseShellStateResult {
  const [state, setState] = useState<ShellState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const dbRef = useRef<ReturnType<typeof ref> | null>(null);

  useEffect(() => {
    if (!shellId) {
      setState(null);
      setIsConnected(false);
      return;
    }

    try {
      const database = getDatabase(app);
      const stateRef = ref(database, `shell_states/${shellId}`);
      dbRef.current = stateRef;

      const handleValue = (snapshot: DataSnapshot) => {
        if (snapshot.exists()) {
          setState(snapshot.val() as ShellState);
        } else {
          setState(null);
        }
        setIsConnected(true);
        setError(null);
      };

      const handleError = (err: Error) => {
        setError(err);
        setIsConnected(false);
      };

      onValue(stateRef, handleValue, handleError);

      return () => {
        off(stateRef, 'value', handleValue);
        setIsConnected(false);
        dbRef.current = null;
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [shellId]);

  const dispatch = useCallback(
    (action: ShellAction, userId: string, meta?: Record<string, string>) => {
      if (!shellId) return;

      const database = getDatabase(app);
      const basePath = `shell_states/${shellId}`;

      try {
        switch (action.type) {
          case 'poll_vote': {
            // Optimistic: update local state immediately
            setState((prev) => {
              if (!prev) return prev;
              const poll = prev as PollState;
              const newCounts = [...(poll.voteCounts || [])];
              // Remove previous vote if exists
              const prevVote = poll.votes?.[userId];
              if (prevVote !== undefined) {
                const prevIdx = typeof prevVote === 'object' ? prevVote.optionIndex : prevVote;
                if (newCounts[prevIdx] !== undefined) newCounts[prevIdx]--;
              }
              newCounts[action.optionIndex] = (newCounts[action.optionIndex] || 0) + 1;
              return {
                ...poll,
                votes: {
                  ...poll.votes,
                  [userId]: { userId, optionIndex: action.optionIndex, votedAt: Date.now() },
                },
                voteCounts: newCounts,
              };
            });

            // Fire-and-forget RTDB write
            const voteRef = ref(database, `${basePath}/votes/${userId}`);
            set(voteRef, {
              userId,
              optionIndex: action.optionIndex,
              votedAt: Date.now(),
            }).catch(() => {});

            // Check social-proof threshold (fire-and-forget)
            notifyThresholdCheck(shellId, 'poll_vote', meta?.displayName);
            break;
          }

          case 'poll_close': {
            setState((prev) => {
              if (!prev) return prev;
              return { ...prev, closed: true, closedAt: Date.now() } as PollState;
            });
            update(ref(database, basePath), { closed: true, closedAt: Date.now() }).catch(() => {});

            // Notify voters about poll results (fire-and-forget)
            notifyThresholdCheck(shellId, 'poll_close');
            break;
          }

          case 'bracket_vote': {
            setState((prev) => {
              if (!prev) return prev;
              const bracket = prev as BracketState;
              return {
                ...bracket,
                matchups: bracket.matchups.map((m) =>
                  m.id === action.matchupId
                    ? { ...m, votes: { ...m.votes, [userId]: action.choice } }
                    : m
                ),
              };
            });

            const matchupVoteRef = ref(
              database,
              `${basePath}/matchups`
            );
            // Find matchup index and update vote
            // Since RTDB uses arrays, we need the index — read from state
            const currentState = state as BracketState | null;
            if (currentState) {
              const idx = currentState.matchups.findIndex((m) => m.id === action.matchupId);
              if (idx >= 0) {
                const votePathRef = ref(database, `${basePath}/matchups/${idx}/votes/${userId}`);
                set(votePathRef, action.choice).catch(() => {});
              }
            }

            // Check social-proof threshold (fire-and-forget)
            notifyThresholdCheck(shellId, 'bracket_vote');
            break;
          }

          case 'rsvp_toggle': {
            setState((prev) => {
              if (!prev) return prev;
              const rsvp = prev as RSVPState;
              const isIn = !!rsvp.attendees?.[userId];
              if (isIn) {
                const { [userId]: _, ...rest } = rsvp.attendees || {};
                return { ...rsvp, attendees: rest, count: Math.max(0, (rsvp.count || 0) - 1) };
              }
              return {
                ...rsvp,
                attendees: {
                  ...rsvp.attendees,
                  [userId]: {
                    userId,
                    displayName: meta?.displayName || 'Member',
                    photoURL: meta?.photoURL || undefined,
                    rsvpAt: Date.now(),
                  },
                },
                count: (rsvp.count || 0) + 1,
              };
            });

            // Check current state to toggle
            const rsvpState = state as RSVPState | null;
            const isCurrentlyIn = !!rsvpState?.attendees?.[userId];
            if (isCurrentlyIn) {
              set(ref(database, `${basePath}/attendees/${userId}`), null).catch(() => {});
            } else {
              set(ref(database, `${basePath}/attendees/${userId}`), {
                userId,
                displayName: meta?.displayName || 'Member',
                photoURL: meta?.photoURL ?? null,
                rsvpAt: Date.now(),
              }).catch(() => {});

              // Check social-proof threshold (fire-and-forget, only on RSVP add)
              notifyThresholdCheck(shellId, 'rsvp_toggle', meta?.displayName);
            }
            break;
          }

          case 'rsvp_cancel': {
            setState((prev) => {
              if (!prev) return prev;
              const rsvp = prev as RSVPState;
              const { [userId]: _, ...rest } = rsvp.attendees || {};
              return { ...rsvp, attendees: rest, count: Math.max(0, (rsvp.count || 0) - 1) };
            });
            set(ref(database, `${basePath}/attendees/${userId}`), null).catch(() => {});
            break;
          }
        }
      } catch {
        // RTDB write failed — state will reconcile on next onValue
      }
    },
    [shellId, state]
  );

  return { state, isConnected, error, dispatch };
}

export default useShellState;

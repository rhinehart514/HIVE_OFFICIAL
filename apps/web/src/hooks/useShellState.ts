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
import { increment } from 'firebase/database';
import type {
  ShellState, ShellAction, PollState, BracketState, RSVPState,
  HotTakesState, TierListState, ThisOrThatState, SignupListState,
  SuperlativesState, PersonalityQuizState,
} from '@/lib/shells/types';

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
  const pendingAction = useRef(false);

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
      // Debounce rapid clicks — ignore if previous action is still in flight
      if (pendingAction.current) return;
      pendingAction.current = true;
      setTimeout(() => { pendingAction.current = false; }, 300);

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

          case 'hottake_react': {
            setState((prev) => {
              if (!prev) return prev;
              const ht = prev as HotTakesState;
              const newReactions = { ...ht.reactions };
              newReactions[action.statementIdx] = {
                ...(newReactions[action.statementIdx] ?? {}),
                [userId]: action.reaction,
              };
              const newAgree = [...(ht.agreeCounts || [])];
              const newDisagree = [...(ht.disagreeCounts || [])];
              if (action.reaction === 'agree') {
                newAgree[action.statementIdx] = (newAgree[action.statementIdx] || 0) + 1;
              } else {
                newDisagree[action.statementIdx] = (newDisagree[action.statementIdx] || 0) + 1;
              }
              return { ...ht, reactions: newReactions, agreeCounts: newAgree, disagreeCounts: newDisagree };
            });
            set(ref(database, `${basePath}/reactions/${action.statementIdx}/${userId}`), action.reaction).catch(() => {});
            const countField = action.reaction === 'agree' ? 'agreeCounts' : 'disagreeCounts';
            update(ref(database, basePath), {
              [`${countField}/${action.statementIdx}`]: increment(1),
            }).catch(() => {});
            break;
          }

          case 'tierlist_place': {
            setState((prev) => {
              if (!prev) return prev;
              const tl = prev as TierListState;
              return {
                ...tl,
                placements: {
                  ...tl.placements,
                  [userId]: { ...(tl.placements?.[userId] ?? {}), [action.item]: action.tier },
                },
              };
            });
            set(ref(database, `${basePath}/placements/${userId}/${action.item}`), action.tier).catch(() => {});
            break;
          }

          case 'tierlist_submit': {
            setState((prev) => {
              if (!prev) return prev;
              const tl = prev as TierListState;
              return { ...tl, participantCount: (tl.participantCount || 0) + 1 };
            });
            update(ref(database, basePath), {
              participantCount: increment(1),
            }).catch(() => {});
            break;
          }

          case 'thisorthat_vote': {
            setState((prev) => {
              if (!prev) return prev;
              const tot = prev as ThisOrThatState;
              const newVotes = { ...tot.votes };
              newVotes[action.pairIdx] = { ...(newVotes[action.pairIdx] ?? {}), [userId]: action.choice };
              const newCounts = [...(tot.counts || [])];
              const pair = newCounts[action.pairIdx] || { a: 0, b: 0 };
              newCounts[action.pairIdx] = { ...pair, [action.choice]: pair[action.choice] + 1 };
              return { ...tot, votes: newVotes, counts: newCounts };
            });
            set(ref(database, `${basePath}/votes/${action.pairIdx}/${userId}`), action.choice).catch(() => {});
            update(ref(database, basePath), {
              [`counts/${action.pairIdx}/${action.choice}`]: increment(1),
            }).catch(() => {});
            break;
          }

          case 'signup_join': {
            setState((prev) => {
              if (!prev) return prev;
              const sl = prev as SignupListState;
              const slotSignups = [...(sl.signups?.[action.slotLabel] ?? [])];
              slotSignups.push({ userId, displayName: meta?.displayName || 'Member', signedUpAt: Date.now() });
              const newCounts = { ...sl.counts };
              newCounts[action.slotLabel] = (newCounts[action.slotLabel] || 0) + 1;
              return { ...sl, signups: { ...sl.signups, [action.slotLabel]: slotSignups }, counts: newCounts };
            });
            const pushKey = `${userId}_${Date.now()}`;
            set(ref(database, `${basePath}/signups/${action.slotLabel}/${pushKey}`), {
              userId,
              displayName: meta?.displayName || 'Member',
              signedUpAt: Date.now(),
            }).catch(() => {});
            update(ref(database, basePath), {
              [`counts/${action.slotLabel}`]: increment(1),
            }).catch(() => {});
            break;
          }

          case 'signup_leave': {
            setState((prev) => {
              if (!prev) return prev;
              const sl = prev as SignupListState;
              const slotSignups = (sl.signups?.[action.slotLabel] ?? []).filter((s) => s.userId !== userId);
              const newCounts = { ...sl.counts };
              newCounts[action.slotLabel] = Math.max(0, (newCounts[action.slotLabel] || 0) - 1);
              return { ...sl, signups: { ...sl.signups, [action.slotLabel]: slotSignups }, counts: newCounts };
            });
            // Remove by finding the key — read snapshot first
            onValue(ref(database, `${basePath}/signups/${action.slotLabel}`), (snap) => {
              const entries = snap.val();
              if (entries && typeof entries === 'object') {
                for (const [key, val] of Object.entries(entries)) {
                  if ((val as { userId: string }).userId === userId) {
                    set(ref(database, `${basePath}/signups/${action.slotLabel}/${key}`), null).catch(() => {});
                    update(ref(database, basePath), {
                      [`counts/${action.slotLabel}`]: increment(-1),
                    }).catch(() => {});
                    break;
                  }
                }
              }
            }, { onlyOnce: true });
            break;
          }

          case 'superlative_nominate': {
            setState((prev) => {
              if (!prev) return prev;
              const sup = prev as SuperlativesState;
              const newNoms = { ...sup.nominations };
              newNoms[action.categoryIdx] = { ...(newNoms[action.categoryIdx] ?? {}), [userId]: action.name };
              const newTallies = { ...sup.tallies };
              newTallies[action.categoryIdx] = { ...(newTallies[action.categoryIdx] ?? {}) };
              newTallies[action.categoryIdx][action.name] = (newTallies[action.categoryIdx][action.name] || 0) + 1;
              return { ...sup, nominations: newNoms, tallies: newTallies, participantCount: (sup.participantCount || 0) + 1 };
            });
            set(ref(database, `${basePath}/nominations/${action.categoryIdx}/${userId}`), action.name).catch(() => {});
            update(ref(database, basePath), {
              [`tallies/${action.categoryIdx}/${action.name}`]: increment(1),
              participantCount: increment(1),
            }).catch(() => {});
            break;
          }

          case 'quiz_answer': {
            setState((prev) => {
              if (!prev) return prev;
              const quiz = prev as PersonalityQuizState;
              const myResp = quiz.responses?.[userId] ?? { answers: [], result: '' };
              const newAnswers = [...(myResp.answers || [])];
              newAnswers[action.questionIdx] = action.optionText;
              return {
                ...quiz,
                responses: { ...quiz.responses, [userId]: { ...myResp, answers: newAnswers } },
              };
            });
            set(ref(database, `${basePath}/responses/${userId}/answers/${action.questionIdx}`), action.optionText).catch(() => {});
            break;
          }

          case 'quiz_complete': {
            setState((prev) => {
              if (!prev) return prev;
              const quiz = prev as PersonalityQuizState;
              return { ...quiz, participantCount: (quiz.participantCount || 0) + 1 };
            });
            update(ref(database, basePath), {
              participantCount: increment(1),
            }).catch(() => {});
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

/**
 * useParticipationCount - Counts how many apps a member has participated in within a space.
 *
 * Reads shell_states/{toolId} from RTDB for each placed tool and checks
 * if the user's uid appears in votes, attendees, or bracket matchup votes.
 * Returns the count of tools the user has engaged with.
 */

'use client';

import { useState, useEffect } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '@hive/core';
import type { PollState, BracketState, RSVPState } from '@/lib/shells/types';

interface UseParticipationCountOptions {
  toolIds: string[];
  userId: string | undefined;
  enabled: boolean;
}

export function useParticipationCount({
  toolIds,
  userId,
  enabled,
}: UseParticipationCountOptions): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled || !userId || toolIds.length === 0) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const uid = userId;
    async function checkParticipation() {
      const database = getDatabase(app);
      let participated = 0;

      // Check each tool's shell state for user participation
      const checks = toolIds.map(async (toolId) => {
        try {
          const snapshot = await get(ref(database, `shell_states/${toolId}`));
          if (!snapshot.exists()) return false;

          const state = snapshot.val();

          // Poll: check votes map
          if (state.votes && typeof state.votes === 'object') {
            const votes = state.votes as PollState['votes'];
            if (uid in votes) return true;
          }

          // RSVP: check attendees map
          if (state.attendees && typeof state.attendees === 'object') {
            const attendees = state.attendees as RSVPState['attendees'];
            if (uid in attendees) return true;
          }

          // Bracket: check matchup votes
          if (state.matchups && Array.isArray(state.matchups)) {
            const matchups = state.matchups as BracketState['matchups'];
            for (const matchup of matchups) {
              if (matchup.votes && uid in matchup.votes) return true;
            }
          }

          return false;
        } catch {
          return false;
        }
      });

      const results = await Promise.all(checks);
      participated = results.filter(Boolean).length;

      if (!cancelled) {
        setCount(participated);
      }
    }

    checkParticipation();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolIds.join(','), userId, enabled]);

  return count;
}

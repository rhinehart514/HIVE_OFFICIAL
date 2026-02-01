'use client';

/**
 * NarrativeEntry - Main Orchestrator for Narrative Entry Flow
 *
 * Orchestrates the 3-act cinematic entry experience:
 * - Act I: The Invitation (school → email → code)
 * - Act II: The Claiming (role → name → handle → field)
 * - Act III: The Crossing (interests → arrival)
 *
 * Handles act transitions with cinematic cuts and gold line draws.
 */

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import { NarrativeShell } from './NarrativeShell';
import { ActOne, ActTwo, ActThree } from './acts';
import { useNarrativeEntry, type ActId } from './hooks/useNarrativeEntry';
import { AVAILABLE_SCHOOLS } from './scenes';

interface NarrativeEntryProps {
  /** Callback when emotional state changes (for shell integration) */
  onEmotionalStateChange?: (state: 'neutral' | 'anticipation' | 'celebration') => void;
  /** Callback when loading state changes */
  onLoadingStateChange?: (loading: boolean) => void;
}

export function NarrativeEntry({
  onEmotionalStateChange,
  onLoadingStateChange,
}: NarrativeEntryProps) {
  // Get default school for domain
  const defaultSchool = AVAILABLE_SCHOOLS[0];
  const domain = defaultSchool?.domain || 'buffalo.edu';
  const campusId = defaultSchool?.id || 'ub-buffalo';
  const schoolId = defaultSchool?.id || 'ub-buffalo';

  // Narrative entry state
  const entry = useNarrativeEntry({
    domain,
    campusId,
    schoolId,
    defaultRedirect: '/spaces',
  });

  const { state, isLoading } = entry;
  const [previousAct, setPreviousAct] = React.useState<ActId>(state.act);

  // Notify parent of emotional state changes
  React.useEffect(() => {
    onEmotionalStateChange?.(state.emotionalState);
  }, [state.emotionalState, onEmotionalStateChange]);

  // Notify parent of loading state changes
  React.useEffect(() => {
    onLoadingStateChange?.(isLoading);
  }, [isLoading, onLoadingStateChange]);

  // Track act transitions
  React.useEffect(() => {
    if (state.act !== previousAct) {
      // Act changed - could trigger transition animation here
      setPreviousAct(state.act);
    }
  }, [state.act, previousAct]);

  return (
    <NarrativeShell
      act={state.act}
      emotionalState={state.emotionalState}
      isTransitioning={state.isTransitioning}
      isLoading={isLoading}
    >
      <AnimatePresence mode="wait">
        {state.act === 'invitation' && (
          <ActOne key="act-1" entry={entry} domain={domain} />
        )}

        {state.act === 'claiming' && (
          <ActTwo key="act-2" entry={entry} />
        )}

        {state.act === 'crossing' && (
          <ActThree key="act-3" entry={entry} />
        )}
      </AnimatePresence>
    </NarrativeShell>
  );
}

NarrativeEntry.displayName = 'NarrativeEntry';

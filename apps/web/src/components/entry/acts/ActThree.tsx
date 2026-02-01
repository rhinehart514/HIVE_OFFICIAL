'use client';

/**
 * ActThree - The Crossing
 *
 * Scenes: Interests → Arrival
 * Emotional beat: Celebration. The user is welcomed home.
 * Gold: Chips, borders, CTA, final flash
 */

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  PassionsScene,
  ArrivalScene,
} from '../scenes';
import type { UseNarrativeEntryReturn } from '../hooks/useNarrativeEntry';

interface ActThreeProps {
  entry: UseNarrativeEntryReturn;
}

export function ActThree({ entry }: ActThreeProps) {
  const { state, data } = entry;
  const currentScene = state.scene;

  // Only render if we're in Act III
  if (state.act !== 'crossing') {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {currentScene === 'interests' && (
        <PassionsScene
          key="interests"
          interests={data.interests}
          onInterestsChange={entry.setInterests}
          onComplete={entry.completeEntry}
          isLoading={entry.isSubmittingIdentity}
          error={entry.error || undefined}
        />
      )}

      {currentScene === 'arrival' && (
        <ArrivalScene
          key="arrival"
          firstName={data.firstName}
          lastName={data.lastName}
          handle={data.handle}
          major={data.major}
          graduationYear={data.graduationYear}
          interests={data.interests}
          isNewUser={entry.isNewUser}
          isReturningUser={entry.isReturningUser}
          onComplete={entry.handleArrivalComplete}
        />
      )}
    </AnimatePresence>
  );
}

ActThree.displayName = 'ActThree';

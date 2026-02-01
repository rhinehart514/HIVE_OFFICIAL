'use client';

/**
 * ActTwo - The Claiming
 *
 * Scenes: Role → Name → Handle → Field
 * Emotional beat: Identity. The user claims who they are.
 * Gold: Input focus rings, handle validation checkmark
 */

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  RoleScene,
  NameScene,
  HandleScene,
  FieldScene,
} from '../scenes';
import type { UseNarrativeEntryReturn } from '../hooks/useNarrativeEntry';

interface ActTwoProps {
  entry: UseNarrativeEntryReturn;
}

export function ActTwo({ entry }: ActTwoProps) {
  const { state, data } = entry;
  const currentScene = state.scene;

  // Only render if we're in Act II
  if (state.act !== 'claiming') {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {currentScene === 'role' && (
        <RoleScene
          key="role"
          role={data.role}
          alumniSpace=""
          onRoleSelect={entry.setRole}
          onAlumniSpaceChange={() => {}}
          onSubmit={entry.submitRole}
          isLoading={entry.isSubmittingRole}
          error={entry.error || undefined}
        />
      )}

      {currentScene === 'name' && (
        <NameScene
          key="name"
          firstName={data.firstName}
          lastName={data.lastName}
          onFirstNameChange={entry.setFirstName}
          onLastNameChange={entry.setLastName}
          onContinue={entry.advanceToHandle}
          error={entry.error || undefined}
        />
      )}

      {currentScene === 'handle' && (
        <HandleScene
          key="handle"
          handle={data.handle}
          onHandleChange={entry.setHandle}
          onSuggestionSelect={entry.selectHandleSuggestion}
          onContinue={entry.advanceToField}
          handleStatus={entry.handleStatus}
          suggestions={entry.handleSuggestions}
          error={entry.error || undefined}
        />
      )}

      {currentScene === 'field' && (
        <FieldScene
          key="field"
          major={data.major}
          graduationYear={data.graduationYear}
          onMajorChange={entry.setMajor}
          onGraduationYearChange={entry.setGraduationYear}
          onContinue={entry.advanceToInterests}
          error={entry.error || undefined}
        />
      )}
    </AnimatePresence>
  );
}

ActTwo.displayName = 'ActTwo';

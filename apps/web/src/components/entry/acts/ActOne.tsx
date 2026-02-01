'use client';

/**
 * ActOne - The Invitation
 *
 * Scenes: School → Email → Code
 * Emotional beat: Trust. The user proves they belong.
 * Gold: None until code verified (first gold moment)
 */

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  InvitationScene,
  ProofScene,
  GateScene,
} from '../scenes';
import type { UseNarrativeEntryReturn, SceneId } from '../hooks/useNarrativeEntry';
import type { School } from '../hooks/useEvolvingEntry';

interface ActOneProps {
  entry: UseNarrativeEntryReturn;
  domain: string;
}

export function ActOne({ entry, domain }: ActOneProps) {
  const { state, data } = entry;
  const currentScene = state.scene;

  // Only render if we're in Act I
  if (state.act !== 'invitation') {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {currentScene === 'school' && (
        <InvitationScene
          key="school"
          school={data.school}
          onSchoolSelect={entry.setSchool}
          onContinue={entry.confirmSchool}
          error={entry.error || undefined}
        />
      )}

      {currentScene === 'email' && (
        <ProofScene
          key="email"
          email={data.email}
          domain={domain}
          onEmailChange={entry.setEmail}
          onSubmit={entry.submitEmail}
          isLoading={entry.isSubmittingEmail}
          error={entry.error || undefined}
        />
      )}

      {currentScene === 'code' && (
        <GateScene
          key="code"
          email={data.fullEmail}
          code={data.code}
          onCodeChange={entry.setCode}
          onVerify={entry.verifyCode}
          onResend={entry.resendCode}
          onEditEmail={entry.editEmail}
          isLoading={entry.isVerifyingCode}
          resendCooldown={entry.resendCooldown}
          error={entry.error || undefined}
        />
      )}
    </AnimatePresence>
  );
}

ActOne.displayName = 'ActOne';

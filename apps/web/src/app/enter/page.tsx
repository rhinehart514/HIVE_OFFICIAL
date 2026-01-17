'use client';

/**
 * /enter - Unified Entry Flow
 *
 * IA Spec: docs/IA_PHASE1_AUTH_ONBOARDING.md
 *
 * States: email → sending → code → verifying → identity (new users) → arrival
 * Goal: 60-90 seconds from landing to inside
 *
 * Uses modular component library with maximum craft motion
 */

import { Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  EntryShell,
  EntryShellStatic,
  EmailState,
  CodeState,
  IdentityState,
  ArrivalState,
  useEntryMachine,
  type EmotionalState,
} from '@/components/entry';

export const dynamic = 'force-dynamic';

// Campus configuration
const CAMPUS_CONFIG = {
  id: process.env.NEXT_PUBLIC_CAMPUS_ID || 'ub-buffalo',
  domain: process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || 'buffalo.edu',
  schoolId: process.env.NEXT_PUBLIC_SCHOOL_ID || 'ub-buffalo',
};

/**
 * Map entry state to emotional state for ambient glow
 */
function getEmotionalState(state: string): EmotionalState {
  switch (state) {
    case 'email':
    case 'sending':
      return 'neutral';
    case 'code':
    case 'verifying':
      return 'anticipation';
    case 'identity':
    case 'submitting':
      return 'anticipation';
    case 'arrival':
      return 'celebration';
    default:
      return 'neutral';
  }
}

/**
 * Static loading fallback
 */
function EntryPageFallback() {
  return (
    <EntryShellStatic>
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-[32px] font-semibold tracking-tight text-white">
            Enter
          </h1>
          <div className="flex items-center gap-2 text-white/50">
            <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <span className="text-[15px]">Loading</span>
          </div>
        </div>
      </div>
    </EntryShellStatic>
  );
}

/**
 * Main entry content with state machine
 */
function EntryContent() {
  const {
    // State
    state,
    data,
    error,
    isNewUser,
    // Handle
    handleStatus,
    handleSuggestions,
    // Resend
    resendCooldown,
    // Setters
    setEmail,
    setCode,
    setFirstName,
    setLastName,
    setHandle,
    selectSuggestion,
    // Transitions
    sendCode,
    verifyCode,
    completeEntry,
    goBackToEmail,
    resendCode,
    // Navigation
    handleArrivalComplete,
  } = useEntryMachine({
    domain: CAMPUS_CONFIG.domain,
    campusId: CAMPUS_CONFIG.id,
    schoolId: CAMPUS_CONFIG.schoolId,
  });

  const emotionalState = getEmotionalState(state);

  // Full email for display
  const fullEmail = data.email.includes('@')
    ? data.email
    : `${data.email}@${CAMPUS_CONFIG.domain}`;

  return (
    <EntryShell emotionalState={emotionalState}>
      <AnimatePresence mode="wait">
        {/* EMAIL STATE */}
        {(state === 'email' || state === 'sending') && (
          <EmailState
            key="email"
            email={data.email}
            onEmailChange={setEmail}
            onSubmit={sendCode}
            error={error}
            isLoading={state === 'sending'}
            domain={CAMPUS_CONFIG.domain}
          />
        )}

        {/* CODE STATE */}
        {(state === 'code' || state === 'verifying') && (
          <CodeState
            key="code"
            email={fullEmail}
            code={data.code}
            onCodeChange={setCode}
            onComplete={verifyCode}
            onResend={resendCode}
            onChangeEmail={goBackToEmail}
            error={error}
            isLoading={state === 'verifying'}
            resendCooldown={resendCooldown}
          />
        )}

        {/* IDENTITY STATE (new users only) */}
        {(state === 'identity' || state === 'submitting') && (
          <IdentityState
            key="identity"
            firstName={data.firstName}
            lastName={data.lastName}
            handle={data.handle}
            handleStatus={handleStatus}
            handleSuggestions={handleSuggestions}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onHandleChange={setHandle}
            onSuggestionClick={selectSuggestion}
            onSubmit={completeEntry}
            error={error}
            isLoading={state === 'submitting'}
          />
        )}

        {/* ARRIVAL STATE */}
        {state === 'arrival' && (
          <ArrivalState
            key="arrival"
            firstName={data.firstName || 'there'}
            handle={data.handle}
            isNewUser={isNewUser}
            onComplete={handleArrivalComplete}
          />
        )}
      </AnimatePresence>
    </EntryShell>
  );
}

/**
 * Entry page with Suspense boundary
 */
export default function EnterPage() {
  return (
    <Suspense fallback={<EntryPageFallback />}>
      <EntryContent />
    </Suspense>
  );
}

'use client';

/**
 * /enter - Unified Entry Flow
 * REDESIGNED: Jan 18, 2026
 *
 * Split-screen immersive layout with progress indicator.
 *
 * States: email → sending → code → verifying → identity (new users) → arrival
 * Goal: 60-90 seconds from landing to inside
 *
 * New design:
 * - 40/60 split (brand/content) on desktop
 * - Progress indicator shows journey
 * - Arrival is a celebration, not a loading screen
 */

import { Suspense, useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MAJOR_CATALOG } from '@hive/core/domain/profile/value-objects/major';
import {
  EntryShell,
  EntryShellStatic,
  SchoolState,
  EmailState,
  CodeState,
  RoleState,
  IdentityState,
  ArrivalState,
  AlumniWaitlistState,
  useEntryMachine,
  type EmotionalState,
  type EntryStep,
} from '@/components/entry';

export const dynamic = 'force-dynamic';

// Campus configuration
const CAMPUS_CONFIG = {
  id: process.env.NEXT_PUBLIC_CAMPUS_ID || 'ub-buffalo',
  domain: process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || 'buffalo.edu',
  schoolId: process.env.NEXT_PUBLIC_SCHOOL_ID || 'ub-buffalo',
};

/**
 * Map entry machine state to emotional state for ambient glow
 */
function getEmotionalState(state: string): EmotionalState {
  switch (state) {
    case 'school':
    case 'email':
      return 'neutral';
    case 'role':
    case 'sending':
      return 'neutral';
    case 'code':
    case 'verifying':
      return 'anticipation';
    case 'identity':
    case 'submitting':
      return 'anticipation';
    case 'arrival':
    case 'alumni-waitlist':
      return 'celebration';
    default:
      return 'neutral';
  }
}

/**
 * Map entry machine state to progress step
 * Flow: school → email → role → code → identity → arrival
 */
function getProgressStep(state: string, role?: string | null): EntryStep {
  switch (state) {
    case 'school':
      return 'school';
    case 'email':
      return 'email';
    case 'role':
    case 'sending':
      return 'role';
    case 'code':
    case 'verifying':
      return 'code';
    case 'submitting':
      // Faculty submit after code, students after identity
      return role === 'faculty' ? 'code' : 'identity';
    case 'identity':
      return 'identity';
    case 'arrival':
      return 'arrival';
    case 'alumni-waitlist':
      return 'alumni-waitlist';
    default:
      return 'school';
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
            Get in
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
    setSchool,
    setEmail,
    setCode,
    setRole,
    setAlumniSpace,
    setMajor,
    setGraduationYear,
    setResidentialSpaceId,
    setFirstName,
    setLastName,
    setHandle,
    selectSuggestion,
    // Transitions
    selectSchool,
    proceedToRole,
    verifyCode,
    submitRole,
    completeEntry,
    goBackToSchool,
    goBackToEmail,
    goBackToRole,
    resendCode,
    // Navigation
    handleArrivalComplete,
  } = useEntryMachine({
    domain: CAMPUS_CONFIG.domain,
    campusId: CAMPUS_CONFIG.id,
    schoolId: CAMPUS_CONFIG.schoolId,
  });

  const emotionalState = getEmotionalState(state);
  const currentStep = getProgressStep(state, data.role);

  // Use selected school domain or fall back to default
  const activeDomain = data.school?.domain || CAMPUS_CONFIG.domain;

  // Compute majors list from catalog
  const majors = useMemo(() => Object.keys(MAJOR_CATALOG).sort(), []);

  // Compute graduation years (current year + 4 years ahead)
  const graduationYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4];
  }, []);

  // Residential spaces state
  const [residentialSpaces, setResidentialSpaces] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch residential spaces when school is selected
  useEffect(() => {
    const campusId = data.school?.id || CAMPUS_CONFIG.id;
    fetch(`/api/spaces/residential?campusId=${campusId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.spaces) {
          setResidentialSpaces(result.spaces);
        }
      })
      .catch(() => {
        // Fail silently - residential is optional
        setResidentialSpaces([]);
      });
  }, [data.school?.id]);

  // Full email for display
  const fullEmail = data.email.includes('@')
    ? data.email
    : `${data.email}@${activeDomain}`;

  return (
    <EntryShell
      emotionalState={emotionalState}
      currentStep={currentStep}
      showProgress={true}
    >
      <AnimatePresence mode="wait" initial={false}>
        {/* SCHOOL STATE - Select campus */}
        {state === 'school' && (
          <SchoolState
            key="school"
            school={data.school}
            onSchoolSelect={selectSchool}
            error={error}
            isLoading={false}
          />
        )}

        {/* EMAIL STATE - Enter campus email */}
        {state === 'email' && (
          <EmailState
            key="email"
            email={data.email}
            onEmailChange={setEmail}
            onSubmit={proceedToRole}
            error={error}
            isLoading={false}
            domain={activeDomain}
          />
        )}

        {/* ROLE STATE - Student/Faculty/Alumni selection */}
        {(state === 'role' || state === 'sending') && (
          <RoleState
            key="role"
            role={data.role}
            onRoleChange={setRole}
            onSubmit={submitRole}
            alumniSpace={data.alumniSpace}
            onAlumniSpaceChange={setAlumniSpace}
            error={error}
            isLoading={state === 'sending'}
          />
        )}

        {/* CODE STATE - Verify email */}
        {(state === 'code' || state === 'verifying') && (
          <CodeState
            key="code"
            email={fullEmail}
            code={data.code}
            onCodeChange={setCode}
            onComplete={verifyCode}
            onResend={resendCode}
            onChangeEmail={goBackToRole}
            error={error}
            isLoading={state === 'verifying'}
            resendCooldown={resendCooldown}
          />
        )}

        {/* IDENTITY STATE - Students only (profile + interests) */}
        {(state === 'identity' || (state === 'submitting' && data.role !== 'faculty')) && (
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
            // Identity fields for decision-reducing onboarding
            major={data.major}
            graduationYear={data.graduationYear}
            residentialSpaceId={data.residentialSpaceId}
            onMajorChange={setMajor}
            onGraduationYearChange={setGraduationYear}
            onResidentialChange={setResidentialSpaceId}
            majors={majors}
            graduationYears={graduationYears}
            residentialSpaces={residentialSpaces}
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

        {/* ALUMNI WAITLIST STATE */}
        {state === 'alumni-waitlist' && (
          <AlumniWaitlistState
            key="alumni-waitlist"
            spaces={data.alumniSpace}
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

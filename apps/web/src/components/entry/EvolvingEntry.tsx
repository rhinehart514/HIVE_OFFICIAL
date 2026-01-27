'use client';

/**
 * EvolvingEntry - Single-page evolving entry flow orchestrator
 * UPDATED: Jan 26, 2026 - Sprint 1: Entry Flow Polish
 *
 * Coordinates all sections in a single scrollable page that evolves
 * as the user progresses through entry.
 *
 * Flow: school → email → code → role → identity-* → arrival
 *
 * Identity is now paginated into 4 steps:
 * name → handle → field (major/year) → interests
 *
 * Motion philosophy (aligned with /about):
 * - Luxuriously slow hero entrance (1.2s)
 * - Word-by-word text reveals
 * - Animated line separators
 * - Gold glow for emotional moments
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvolvingEntry } from './hooks/useEvolvingEntry';
import {
  SchoolSection,
  EmailSection,
  CodeSection,
  RoleSection,
  ArrivalSection,
  AlumniWaitlistSection,
} from './sections';
import { IdentityNameSection } from './sections/IdentityNameSection';
import { IdentityHandleSection } from './sections/IdentityHandleSection';
import { IdentityFieldSection } from './sections/IdentityFieldSection';
import { IdentityInterestsSection } from './sections/IdentityInterestsSection';
import {
  heroEntranceVariants,
  lineDrawVariants,
  wordRevealVariants,
  createWordReveal,
  type EmotionalState,
} from './motion/entry-motion';
import { OfflineBanner } from './primitives';

// Interest category type
interface InterestCategory {
  id: string;
  title: string;
  icon?: string;
  items: string[];
}

// Campus configuration
const CAMPUS_CONFIG = {
  id: process.env.NEXT_PUBLIC_CAMPUS_ID || 'ub-buffalo',
  domain: process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || 'buffalo.edu',
  schoolId: process.env.NEXT_PUBLIC_SCHOOL_ID || 'ub-buffalo',
};

interface EvolvingEntryProps {
  /** Callback to report emotional state for ambient glow */
  onEmotionalStateChange?: (state: EmotionalState) => void;
  /** Callback to report loading state for overlay */
  onLoadingStateChange?: (isLoading: boolean) => void;
}

export function EvolvingEntry({ onEmotionalStateChange, onLoadingStateChange }: EvolvingEntryProps) {
  const entry = useEvolvingEntry({
    domain: CAMPUS_CONFIG.domain,
    campusId: CAMPUS_CONFIG.id,
    schoolId: CAMPUS_CONFIG.schoolId,
  });

  // Fetch interest categories from onboarding catalog
  const [interestCategories, setInterestCategories] = useState<InterestCategory[]>([]);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const response = await fetch('/api/onboarding/catalog');
        if (response.ok) {
          const data = await response.json();
          if (data.data?.interests) {
            setInterestCategories(data.data.interests);
          }
        }
      } catch {
        // Silently fail - will use empty array
      }
    }
    fetchCatalog();
  }, []);

  // Report loading state for overlay
  useEffect(() => {
    if (!onLoadingStateChange) return;

    const isLoading =
      entry.isSubmittingEmail ||
      entry.isVerifyingCode ||
      entry.isSubmittingRole ||
      entry.isSubmittingIdentity;

    onLoadingStateChange(isLoading);
  }, [
    entry.isSubmittingEmail,
    entry.isVerifyingCode,
    entry.isSubmittingRole,
    entry.isSubmittingIdentity,
    onLoadingStateChange,
  ]);

  // Report emotional state for ambient glow
  useEffect(() => {
    if (!onEmotionalStateChange) return;

    const { activeSection, sections } = entry;

    // Terminal sections get celebration
    if (
      sections.arrival.status === 'active' ||
      sections['alumni-waitlist'].status === 'active'
    ) {
      onEmotionalStateChange('celebration');
      return;
    }

    // Email verification and code get anticipation
    if (activeSection === 'email' || activeSection === 'code' || activeSection === 'role') {
      onEmotionalStateChange('anticipation');
      return;
    }

    // Identity sections (building profile) get anticipation
    if (
      activeSection === 'identity' ||
      activeSection === 'identity-name' ||
      activeSection === 'identity-handle' ||
      activeSection === 'identity-field' ||
      activeSection === 'identity-interests'
    ) {
      onEmotionalStateChange('anticipation');
      return;
    }

    // Default is neutral
    onEmotionalStateChange('neutral');
  }, [entry.activeSection, entry.sections, onEmotionalStateChange]);

  // Determine if we're in a terminal state (arrival or alumni-waitlist)
  const isTerminal =
    entry.sections.arrival.status === 'active' ||
    entry.sections.arrival.status === 'complete' ||
    entry.sections['alumni-waitlist'].status === 'active';

  // Word-by-word reveal for headline - The Threshold
  const headlineWords = ['The', 'Threshold'];
  const subtitleWords = ['Prove', 'you', 'belong.'];

  return (
    <div className="space-y-6">
      {/* Header - only show when not in terminal state */}
      {!isTerminal && (
        <motion.div
          variants={heroEntranceVariants}
          initial="initial"
          animate="animate"
          className="mb-12"
        >
          {/* Word-by-word headline - larger, more dramatic */}
          <h1
            className="text-heading-lg md:text-display font-semibold tracking-tight text-white leading-[1.0]"
            style={{
              fontFamily: 'var(--font-display)',
              textShadow: '0 0 80px rgba(255, 215, 0, 0.08)',
            }}
          >
            {headlineWords.map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-[0.25em]"
                variants={wordRevealVariants}
                initial="initial"
                animate="animate"
                transition={createWordReveal(i, 0.12)}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Subtitle with word reveal - more evocative copy */}
          <p className="mt-4 text-body-lg text-white/40 leading-relaxed">
            {subtitleWords.map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-[0.2em]"
                variants={wordRevealVariants}
                initial="initial"
                animate="animate"
                transition={createWordReveal(i, 0.06)}
                style={{ transitionDelay: `${0.4 + i * 0.06}s` }}
              >
                {word}
              </motion.span>
            ))}
          </p>

          {/* Animated separator line - more subtle */}
          <motion.div
            className="mt-10 h-px bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent"
            variants={lineDrawVariants}
            initial="initial"
            animate="animate"
            style={{ transformOrigin: 'left' }}
          />
        </motion.div>
      )}

      {/* Sections stack */}
      <div className="space-y-5">
        {/* School section */}
        {!isTerminal && entry.sections.school.status !== 'hidden' && (
          <SchoolSection
            section={entry.sections.school}
            school={entry.data.school}
            onSchoolSelect={entry.setSchool}
            onConfirm={entry.confirmSchool}
            onEdit={entry.editSchool}
          />
        )}

        {/* Email section */}
        {!isTerminal && entry.sections.email.status !== 'hidden' && (
          <EmailSection
            section={entry.sections.email}
            email={entry.data.email}
            fullEmail={entry.fullEmail}
            domain={CAMPUS_CONFIG.domain}
            onEmailChange={entry.setEmail}
            onSubmit={entry.submitEmail}
            onEdit={entry.editEmail}
            onRetry={entry.submitEmail}
            isLoading={entry.isSubmittingEmail}
          />
        )}

        {/* Code verification section */}
        {!isTerminal && entry.sections.code.status !== 'hidden' && (
          <CodeSection
            section={entry.sections.code}
            email={entry.fullEmail}
            code={entry.data.verificationCode}
            onCodeChange={entry.setVerificationCode}
            onVerify={entry.verifyEmailCode}
            onResend={entry.resendCode}
            onChangeEmail={entry.editEmail}
            onRetry={() => entry.verifyEmailCode(entry.data.verificationCode.join(''))}
            isLoading={entry.isVerifyingCode}
            resendCooldown={entry.resendCooldown}
          />
        )}

        {/* Role section */}
        {!isTerminal && entry.sections.role.status !== 'hidden' && (
          <RoleSection
            section={entry.sections.role}
            role={entry.data.role}
            alumniSpace={entry.data.alumniSpace}
            onRoleChange={entry.setRole}
            onAlumniSpaceChange={entry.setAlumniSpace}
            onSubmit={entry.submitRole}
            isLoading={entry.isSubmittingRole}
          />
        )}

        {/* Paginated Identity Flow - Building your profile */}

        {/* Step 1: Name */}
        {!isTerminal && entry.sections['identity-name'].status === 'active' && (
          <IdentityNameSection
            section={entry.sections['identity-name']}
            firstName={entry.data.firstName}
            lastName={entry.data.lastName}
            onFirstNameChange={entry.setFirstName}
            onLastNameChange={entry.setLastName}
            onAdvance={entry.advanceToHandle}
          />
        )}

        {/* Step 2: Handle */}
        {!isTerminal && entry.sections['identity-handle'].status === 'active' && (
          <IdentityHandleSection
            section={entry.sections['identity-handle']}
            handle={entry.data.handle}
            handleStatus={entry.handleStatus}
            handleSuggestions={entry.handleSuggestions}
            onHandleChange={entry.setHandle}
            onSuggestionClick={entry.selectSuggestion}
            onAdvance={entry.advanceToField}
          />
        )}

        {/* Step 3: Field (Major + Year) */}
        {!isTerminal && entry.sections['identity-field'].status === 'active' && (
          <IdentityFieldSection
            section={entry.sections['identity-field']}
            major={entry.data.major}
            graduationYear={entry.data.graduationYear}
            onMajorChange={entry.setMajor}
            onYearChange={entry.setGraduationYear}
            onAdvance={entry.advanceToInterests}
          />
        )}

        {/* Step 4: Interests */}
        {!isTerminal && entry.sections['identity-interests'].status === 'active' && (
          <IdentityInterestsSection
            section={entry.sections['identity-interests']}
            interests={entry.data.interests}
            categories={interestCategories}
            onInterestsChange={entry.setInterests}
            onSubmit={entry.completeIdentity}
            isLoading={entry.isSubmittingIdentity}
          />
        )}

        {/* Terminal states - The Crossing */}
        <AnimatePresence>
          {entry.sections.arrival.status === 'active' && (
            <ArrivalSection
              section={entry.sections.arrival}
              firstName={entry.data.firstName || 'there'}
              handle={entry.data.handle}
              major={entry.data.major}
              graduationYear={entry.data.graduationYear}
              interests={entry.data.interests}
              isNewUser={entry.isNewUser}
              isReturningUser={entry.isReturningUser}
              onComplete={entry.handleArrivalComplete}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {entry.sections['alumni-waitlist'].status === 'active' && (
            <AlumniWaitlistSection
              section={entry.sections['alumni-waitlist']}
              spaces={entry.data.alumniSpace}
              onComplete={entry.handleArrivalComplete}
            />
          )}
        </AnimatePresence>

        {/* Offline banner - shows when network is unavailable */}
        {!isTerminal && <OfflineBanner />}
      </div>
    </div>
  );
}

EvolvingEntry.displayName = 'EvolvingEntry';

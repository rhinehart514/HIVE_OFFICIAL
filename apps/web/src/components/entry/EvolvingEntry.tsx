'use client';

/**
 * EvolvingEntry - Single-page evolving entry flow orchestrator
 * ENHANCED: Jan 21, 2026
 *
 * Coordinates all sections in a single scrollable page that evolves
 * as the user progresses through entry.
 *
 * Flow: school → email → code → role → identity → arrival
 *
 * Motion philosophy (aligned with /about):
 * - Luxuriously slow hero entrance (1.2s)
 * - Word-by-word text reveals
 * - Animated line separators
 * - Gold glow for emotional moments
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MAJOR_CATALOG } from '@hive/core/domain/profile/value-objects/major';
import { useEvolvingEntry } from './hooks/useEvolvingEntry';
import {
  SchoolSection,
  EmailSection,
  CodeSection,
  RoleSection,
  IdentitySection,
  ArrivalSection,
  AlumniWaitlistSection,
} from './sections';
import {
  DURATION,
  EASE_PREMIUM,
  heroEntranceVariants,
  subtitleEntranceVariants,
  lineDrawVariants,
  wordRevealVariants,
  createWordReveal,
  type EmotionalState,
} from './motion/entry-motion';

// Campus configuration
const CAMPUS_CONFIG = {
  id: process.env.NEXT_PUBLIC_CAMPUS_ID || 'ub-buffalo',
  domain: process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || 'buffalo.edu',
  schoolId: process.env.NEXT_PUBLIC_SCHOOL_ID || 'ub-buffalo',
};

interface EvolvingEntryProps {
  /** Callback to report emotional state for ambient glow */
  onEmotionalStateChange?: (state: EmotionalState) => void;
}

export function EvolvingEntry({ onEmotionalStateChange }: EvolvingEntryProps) {
  const entry = useEvolvingEntry({
    domain: CAMPUS_CONFIG.domain,
    campusId: CAMPUS_CONFIG.id,
    schoolId: CAMPUS_CONFIG.schoolId,
  });

  // Compute majors list from catalog
  const majors = useMemo(() => Object.keys(MAJOR_CATALOG).sort(), []);

  // Compute graduation years
  const graduationYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4];
  }, []);

  // Residential spaces
  const [residentialSpaces, setResidentialSpaces] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch residential spaces when school is selected
  useEffect(() => {
    const campusId = entry.data.school?.id || CAMPUS_CONFIG.id;
    fetch(`/api/spaces/residential?campusId=${campusId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.spaces) {
          setResidentialSpaces(result.spaces);
        }
      })
      .catch(() => {
        setResidentialSpaces([]);
      });
  }, [entry.data.school?.id]);

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

    // Code verification gets anticipation
    if (activeSection === 'code' || activeSection === 'role') {
      onEmotionalStateChange('anticipation');
      return;
    }

    // Identity section (almost there) gets anticipation
    if (activeSection === 'identity') {
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

  // Domain for email section
  const activeDomain = entry.data.school?.domain || CAMPUS_CONFIG.domain;

  // Word-by-word reveal for headline
  const headlineWords = ['Enter', 'HIVE'];
  const subtitleWords = ['Your', 'campus', 'is', 'waiting.'];

  return (
    <div className="space-y-6">
      {/* Header - only show when not in terminal state */}
      {!isTerminal && (
        <motion.div
          variants={heroEntranceVariants}
          initial="initial"
          animate="animate"
          className="mb-10"
        >
          {/* Word-by-word headline */}
          <h1
            className="text-[36px] md:text-[44px] font-semibold tracking-tight text-white leading-[1.0]"
            style={{
              fontFamily: 'var(--font-display)',
              textShadow: '0 0 80px rgba(255, 215, 0, 0.06)',
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

          {/* Subtitle with word reveal */}
          <p className="mt-3 text-[16px] text-white/40">
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

          {/* Animated separator line */}
          <motion.div
            className="mt-8 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent"
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
        {!isTerminal && (
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
            domain={activeDomain}
            onEmailChange={entry.setEmail}
            onSubmit={entry.submitEmail}
            onEdit={entry.editEmail}
            isLoading={entry.isSendingCode}
          />
        )}

        {/* Code section */}
        {!isTerminal && entry.sections.code.status !== 'hidden' && (
          <CodeSection
            section={entry.sections.code}
            email={entry.fullEmail}
            code={entry.data.code}
            onCodeChange={entry.setCode}
            onVerify={entry.verifyCode}
            onResend={entry.resendCode}
            onChangeEmail={entry.editEmail}
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

        {/* Identity section (students only) */}
        {!isTerminal && entry.sections.identity.status !== 'hidden' && (
          <IdentitySection
            section={entry.sections.identity}
            firstName={entry.data.firstName}
            lastName={entry.data.lastName}
            handle={entry.data.handle}
            handleStatus={entry.handleStatus}
            handleSuggestions={entry.handleSuggestions}
            major={entry.data.major}
            graduationYear={entry.data.graduationYear}
            residenceType={entry.data.residenceType}
            residentialSpaceId={entry.data.residentialSpaceId}
            interests={entry.data.interests}
            communityIdentities={entry.data.communityIdentities}
            onFirstNameChange={entry.setFirstName}
            onLastNameChange={entry.setLastName}
            onHandleChange={entry.setHandle}
            onSuggestionClick={entry.selectSuggestion}
            onMajorChange={entry.setMajor}
            onGraduationYearChange={entry.setGraduationYear}
            onResidenceTypeChange={entry.setResidenceType}
            onResidentialChange={entry.setResidentialSpaceId}
            onInterestsChange={entry.setInterests}
            onCommunityIdentitiesChange={entry.setCommunityIdentities}
            onSubmit={entry.completeIdentity}
            isLoading={entry.isSubmittingIdentity}
            majors={majors}
            graduationYears={graduationYears}
            residentialSpaces={residentialSpaces}
          />
        )}

        {/* Terminal states */}
        <AnimatePresence>
          {entry.sections.arrival.status === 'active' && (
            <ArrivalSection
              section={entry.sections.arrival}
              firstName={entry.data.firstName || 'there'}
              handle={entry.data.handle}
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
      </div>
    </div>
  );
}

EvolvingEntry.displayName = 'EvolvingEntry';

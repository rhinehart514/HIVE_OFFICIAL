'use client';

/**
 * EvolvingEntry - Single-page evolving entry flow orchestrator
 *
 * Coordinates all sections in a single scrollable page that evolves
 * as the user progresses through entry.
 *
 * Flow: school → email → code → role → identity → arrival
 *
 * Sections:
 * - Completed sections collapse to locked chips (remain visible)
 * - Active section expands with full input
 * - Hidden sections don't render
 * - Terminal sections (arrival, alumni-waitlist) take over
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
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
import { DURATION, EASE_PREMIUM, type EmotionalState } from './motion/entry-motion';

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

  return (
    <LayoutGroup>
      <motion.div
        className="space-y-4"
        layout
        transition={{
          layout: {
            duration: DURATION.smooth,
            ease: EASE_PREMIUM,
          },
        }}
      >
        {/* Header - only show when not in terminal state */}
        <AnimatePresence mode="wait">
          {!isTerminal && (
            <motion.div
              key="header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: DURATION.quick, ease: EASE_PREMIUM }}
              className="mb-6"
            >
              <h1 className="text-[24px] font-semibold tracking-tight text-white">
                Get in
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sections stack */}
        <div className="space-y-4">
          {/* School section */}
          <AnimatePresence mode="wait">
            {!isTerminal && (
              <SchoolSection
                section={entry.sections.school}
                school={entry.data.school}
                onSchoolSelect={entry.setSchool}
                onConfirm={entry.confirmSchool}
                onEdit={entry.editSchool}
              />
            )}
          </AnimatePresence>

          {/* Email section */}
          <AnimatePresence mode="wait">
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
          </AnimatePresence>

          {/* Code section */}
          <AnimatePresence mode="wait">
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
          </AnimatePresence>

          {/* Role section */}
          <AnimatePresence mode="wait">
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
          </AnimatePresence>

          {/* Identity section (students only) */}
          <AnimatePresence mode="wait">
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
                residentialSpaceId={entry.data.residentialSpaceId}
                onFirstNameChange={entry.setFirstName}
                onLastNameChange={entry.setLastName}
                onHandleChange={entry.setHandle}
                onSuggestionClick={entry.selectSuggestion}
                onMajorChange={entry.setMajor}
                onGraduationYearChange={entry.setGraduationYear}
                onResidentialChange={entry.setResidentialSpaceId}
                onSubmit={entry.completeIdentity}
                isLoading={entry.isSubmittingIdentity}
                majors={majors}
                graduationYears={graduationYears}
                residentialSpaces={residentialSpaces}
              />
            )}
          </AnimatePresence>

          {/* Terminal states */}
          <AnimatePresence mode="wait">
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

          <AnimatePresence mode="wait">
            {entry.sections['alumni-waitlist'].status === 'active' && (
              <AlumniWaitlistSection
                section={entry.sections['alumni-waitlist']}
                spaces={entry.data.alumniSpace}
                onComplete={entry.handleArrivalComplete}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </LayoutGroup>
  );
}

EvolvingEntry.displayName = 'EvolvingEntry';

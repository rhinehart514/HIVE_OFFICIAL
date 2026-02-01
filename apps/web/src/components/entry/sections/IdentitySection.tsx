'use client';

/**
 * IdentitySection - The Naming Phase
 * UPDATED: Jan 26, 2026 - The Threshold Entry Flow
 *
 * Collects identity for the ceremonial entry:
 * - First name + Last name
 * - Handle (the earned moment)
 * - Major (dropdown)
 * - Graduation year (dropdown)
 * - Interests (multi-select chips)
 *
 * Premium form design:
 * - Apple-style inputs (h-14, rounded-2xl)
 * - Clash Display for headers
 * - Multi-select interest chips
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import {
  HandleInput,
  HandleStatusBadge,
  Button,
  type HandleStatus,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import type { SectionState } from '../hooks/useEvolvingEntry';

// Major options
const MAJOR_OPTIONS = [
  'Undeclared',
  'Accounting',
  'Architecture',
  'Art',
  'Biology',
  'Business',
  'Chemistry',
  'Communications',
  'Computer Science',
  'Economics',
  'Education',
  'Engineering',
  'English',
  'Film',
  'Finance',
  'History',
  'Information Science',
  'Journalism',
  'Law',
  'Marketing',
  'Mathematics',
  'Medicine',
  'Music',
  'Nursing',
  'Philosophy',
  'Physics',
  'Political Science',
  'Psychology',
  'Sociology',
  'Theater',
  'Other',
];

// Graduation year options (current year to +6)
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => currentYear + i);

// Interest options
const INTEREST_OPTIONS = [
  'Startups',
  'Tech',
  'Arts',
  'Music',
  'Climate',
  'Politics',
  'Health',
  'Sports',
  'Business',
  'Science',
  'Culture',
  'Social Justice',
  'Gaming',
  'Media',
];

interface IdentitySectionProps {
  section: SectionState;
  firstName: string;
  lastName: string;
  handle: string;
  handleStatus: HandleStatus;
  handleSuggestions: string[];
  major: string;
  graduationYear: number | null;
  interests: string[];
  onFirstNameChange: (name: string) => void;
  onLastNameChange: (name: string) => void;
  onHandleChange: (handle: string) => void;
  onSuggestionClick: (handle: string) => void;
  onMajorChange: (major: string) => void;
  onYearChange: (year: number | null) => void;
  onInterestsChange: (interests: string[]) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function IdentitySection({
  section,
  firstName,
  lastName,
  handle,
  handleStatus,
  handleSuggestions,
  major,
  graduationYear,
  interests,
  onFirstNameChange,
  onLastNameChange,
  onHandleChange,
  onSuggestionClick,
  onMajorChange,
  onYearChange,
  onInterestsChange,
  onSubmit,
  isLoading,
}: IdentitySectionProps) {
  const [majorOpen, setMajorOpen] = React.useState(false);
  const [yearOpen, setYearOpen] = React.useState(false);
  const majorRef = React.useRef<HTMLDivElement>(null);
  const yearRef = React.useRef<HTMLDivElement>(null);

  const hasError = !!section.error;

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (majorRef.current && !majorRef.current.contains(event.target as Node)) {
        setMajorOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setYearOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle interest selection
  const toggleInterest = React.useCallback(
    (interest: string) => {
      if (interests.includes(interest)) {
        onInterestsChange(interests.filter((i) => i !== interest));
      } else if (interests.length < 5) {
        onInterestsChange([...interests, interest]);
      }
    },
    [interests, onInterestsChange]
  );

  // Validation: name + available handle + at least 2 interests
  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    handle.trim() &&
    handleStatus === 'available' &&
    interests.length >= 2 &&
    !isLoading;

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && canSubmit) {
        onSubmit();
      }
    },
    [canSubmit, onSubmit]
  );

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Locked/complete state - identity section doesn't show a chip
  // (crossing/arrival section takes over)
  if (section.status === 'locked' || section.status === 'complete') {
    return null;
  }

  // Active state - show identity form
  return (
    <motion.div
      variants={sectionEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      {/* Header - The Naming */}
      <motion.div variants={sectionChildVariants} className="space-y-2 mb-2">
        <h2
          className="text-title-lg font-semibold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Create your identity
        </h2>
        <p className="text-body text-white/40 leading-relaxed">
          How you'll show up across campus
        </p>
      </motion.div>

      {/* Form */}
      <div className="space-y-4">
        {/* Name row */}
        <motion.div
          variants={sectionChildVariants}
          className="grid grid-cols-2 gap-3"
        >
          <div
            className={cn(
              'flex items-center h-14 rounded-2xl border transition-all duration-200',
              'bg-white/[0.03] border-white/[0.08]',
              'focus-within:bg-white/[0.05] focus-within:border-white/20'
            )}
          >
            <input
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="First name"
              disabled={isLoading}
              autoFocus
              className={cn(
                'w-full h-full px-4 bg-transparent text-body-lg text-white',
                'placeholder:text-white/25',
                'focus:outline-none',
                'disabled:opacity-50'
              )}
            />
          </div>
          <div
            className={cn(
              'flex items-center h-14 rounded-2xl border transition-all duration-200',
              'bg-white/[0.03] border-white/[0.08]',
              'focus-within:bg-white/[0.05] focus-within:border-white/20'
            )}
          >
            <input
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Last name"
              disabled={isLoading}
              className={cn(
                'w-full h-full px-4 bg-transparent text-body-lg text-white',
                'placeholder:text-white/25',
                'focus:outline-none',
                'disabled:opacity-50'
              )}
            />
          </div>
        </motion.div>

        {/* Handle */}
        <motion.div variants={sectionChildVariants}>
          <motion.div
            variants={shakeVariants}
            animate={hasError && !firstName && !lastName ? 'shake' : 'idle'}
          >
            <HandleInput
              value={handle}
              onChange={(e) => onHandleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              status={handleStatus}
              placeholder="yourhandle"
              disabled={isLoading}
              size="default"
            />
          </motion.div>

          <HandleStatusBadge
            status={handleStatus}
            suggestions={handleSuggestions}
            onSuggestionClick={onSuggestionClick}
          />
        </motion.div>

        {/* Major and Year row */}
        <motion.div
          variants={sectionChildVariants}
          className="grid grid-cols-2 gap-3"
        >
          {/* Major dropdown */}
          <div ref={majorRef} className="relative">
            <button
              type="button"
              onClick={() => setMajorOpen(!majorOpen)}
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-between h-14 px-4 rounded-2xl border transition-all duration-200',
                'bg-white/[0.03] border-white/[0.08]',
                majorOpen && 'bg-white/[0.05] border-white/20',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                'disabled:opacity-50'
              )}
            >
              <span className={cn('text-body-lg', major ? 'text-white' : 'text-white/25')}>
                {major || 'Major'}
              </span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-white/40 transition-transform',
                  majorOpen && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence>
              {majorOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 z-50 py-2 bg-elevated border border-white/[0.08] rounded-xl shadow-xl max-h-[240px] overflow-y-auto"
                >
                  {MAJOR_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        onMajorChange(m);
                        setMajorOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors',
                        'hover:bg-white/[0.04]',
                        major === m && 'bg-white/[0.06]'
                      )}
                    >
                      <span className={cn('text-body', major === m ? 'text-white' : 'text-white/70')}>
                        {m}
                      </span>
                      {major === m && <Check size={16} className="text-[var(--life-gold)]" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Year dropdown */}
          <div ref={yearRef} className="relative">
            <button
              type="button"
              onClick={() => setYearOpen(!yearOpen)}
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-between h-14 px-4 rounded-2xl border transition-all duration-200',
                'bg-white/[0.03] border-white/[0.08]',
                yearOpen && 'bg-white/[0.05] border-white/20',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                'disabled:opacity-50'
              )}
            >
              <span className={cn('text-body-lg', graduationYear ? 'text-white' : 'text-white/25')}>
                {graduationYear || 'Year'}
              </span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-white/40 transition-transform',
                  yearOpen && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence>
              {yearOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 z-50 py-2 bg-elevated border border-white/[0.08] rounded-xl shadow-xl"
                >
                  {YEAR_OPTIONS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        onYearChange(y);
                        setYearOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors',
                        'hover:bg-white/[0.04]',
                        graduationYear === y && 'bg-white/[0.06]'
                      )}
                    >
                      <span className={cn('text-body', graduationYear === y ? 'text-white' : 'text-white/70')}>
                        {y}
                      </span>
                      {graduationYear === y && <Check size={16} className="text-[var(--life-gold)]" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Interests - multi-select chips */}
        <motion.div variants={sectionChildVariants} className="space-y-3">
          <p className="text-body-sm text-white/40">
            Interests <span className="text-white/25">(select 2-5)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const isSelected = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  disabled={isLoading || (!isSelected && interests.length >= 5)}
                  className={cn(
                    'px-3.5 py-2 rounded-full text-body-sm font-medium transition-all duration-200',
                    'border focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                    isSelected
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-white/[0.04] hover:border-white/[0.08] hover:text-white/70',
                    'disabled:opacity-40 disabled:cursor-not-allowed'
                  )}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {hasError && (
            <motion.p
              variants={errorInlineVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-body-sm text-red-400/90"
            >
              {section.error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* CTA Button - Continue to preview */}
        <motion.div variants={sectionChildVariants}>
          <Button
            variant="cta"
            size="lg"
            onClick={onSubmit}
            disabled={!canSubmit}
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? 'Setting up...' : 'Continue'}
          </Button>
        </motion.div>

        {/* Manifesto line */}
        <motion.p
          variants={sectionChildVariants}
          className="text-body-sm text-white/30 text-center"
        >
          Your handle is permanent. Your profile is yours.
        </motion.p>
      </div>
    </motion.div>
  );
}

IdentitySection.displayName = 'IdentitySection';

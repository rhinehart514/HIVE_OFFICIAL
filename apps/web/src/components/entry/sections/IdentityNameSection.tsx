'use client';

/**
 * IdentityNameSection - Step 1 of paginated identity flow
 *
 * Collects first and last name.
 * Auto-advances to handle step when both fields are filled.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  sectionEnterVariants,
  sectionChildVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { StepCounter } from '../primitives';
import type { SectionState } from '../hooks/useEvolvingEntry';

interface IdentityNameSectionProps {
  section: SectionState;
  firstName: string;
  lastName: string;
  onFirstNameChange: (name: string) => void;
  onLastNameChange: (name: string) => void;
  onAdvance: () => void;
  isLoading?: boolean;
}

export function IdentityNameSection({
  section,
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  onAdvance,
  isLoading = false,
}: IdentityNameSectionProps) {
  const hasError = !!section.error;

  const canAdvance = firstName.trim().length >= 1 && lastName.trim().length >= 1 && !isLoading;

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && canAdvance) {
        onAdvance();
      }
    },
    [canAdvance, onAdvance]
  );

  if (section.status === 'hidden' || section.status === 'locked' || section.status === 'complete') {
    return null;
  }

  return (
    <motion.div
      variants={sectionEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Progress indicator */}
      <motion.div variants={sectionChildVariants}>
        <StepCounter current={1} total={4} />
      </motion.div>

      {/* Header */}
      <motion.div variants={sectionChildVariants} className="space-y-3">
        <h2
          className="text-title-lg font-semibold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          What's your name?
        </h2>
        <p className="text-body text-white/40 leading-relaxed">
          This is how you'll appear to others
        </p>
      </motion.div>

      {/* Name inputs */}
      <motion.div variants={sectionChildVariants} className="space-y-3">
        <div
          className={cn(
            'flex items-center h-14 rounded-2xl border transition-all duration-200',
            'bg-white/[0.03] border-white/[0.08]',
            'focus-within:bg-white/[0.05] focus-within:border-[var(--color-gold)]/30',
            'focus-within:shadow-[0_0_0_4px_rgba(255,215,0,0.06)]'
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
            'focus-within:bg-white/[0.05] focus-within:border-[var(--color-gold)]/30',
            'focus-within:shadow-[0_0_0_4px_rgba(255,215,0,0.06)]'
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

      {/* CTA */}
      <motion.div variants={sectionChildVariants}>
        <Button
          variant="cta"
          size="lg"
          onClick={onAdvance}
          disabled={!canAdvance}
          loading={isLoading}
          className="w-full"
        >
          Continue
        </Button>
      </motion.div>

      {/* Manifesto line */}
      <motion.p
        variants={sectionChildVariants}
        className="text-body-sm text-white/30 text-center"
      >
        Your profile is yours to shape.
      </motion.p>
    </motion.div>
  );
}

IdentityNameSection.displayName = 'IdentityNameSection';

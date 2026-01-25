'use client';

/**
 * EntryCodeSection - 6-digit entry code verification
 * Created: Jan 22, 2026
 *
 * Primary entry mechanism for HIVE.
 * Users enter a 6-digit code distributed by admins to gain access.
 *
 * Pattern follows OTP input styling with:
 * - Lockout UI with countdown
 * - Attempts remaining feedback
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OTPInput } from '@hive/ui/design-system/primitives';
import { Lock, Clock } from 'lucide-react';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import { LockedFieldChip } from '../primitives/LockedFieldChip';
import type { SectionState, AccessCodeLockout } from '../hooks/useEvolvingEntry';

interface EntryCodeSectionProps {
  section: SectionState;
  code: string[];
  onCodeChange: (code: string[]) => void;
  onVerify: (codeString: string) => Promise<void>;
  isLoading: boolean;
  lockout: AccessCodeLockout | null;
}

export function EntryCodeSection({
  section,
  code,
  onCodeChange,
  onVerify,
  isLoading,
  lockout,
}: EntryCodeSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const isLocked = section.status === 'locked' || section.status === 'complete';
  const hasError = !!section.error;
  const isLockedOut = lockout?.locked ?? false;

  // Handle code completion
  const handleComplete = React.useCallback(
    (codeString: string) => {
      if (isLockedOut || isLoading) return;
      onVerify(codeString);
    },
    [onVerify, isLockedOut, isLoading]
  );

  // Reset code on error
  React.useEffect(() => {
    if (hasError) {
      onCodeChange(['', '', '', '', '', '']);
    }
  }, [hasError, onCodeChange]);

  // Locked state - minimal verified indicator
  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
        className="space-y-2"
      >
        <p className="text-body-sm text-white/40 font-medium">Entry Code</p>
        <LockedFieldChip value="Verified" allowChange={false} />
      </motion.div>
    );
  }

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Active state
  return (
    <motion.div
      variants={sectionEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={sectionChildVariants} className="space-y-2">
        <h2
          className="text-title font-semibold text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Enter your code
        </h2>
        <p className="text-body text-white/50">
          Enter the 6-digit code you received to continue.
        </p>
      </motion.div>

      {/* Lockout State */}
      {isLockedOut && lockout && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <Lock size={18} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-body text-red-400 font-medium">
              Too many attempts
            </p>
            <p className="text-body-sm text-white/50 flex items-center gap-1.5 mt-0.5">
              <Clock size={12} />
              Try again in {lockout.remainingMinutes} minute
              {lockout.remainingMinutes !== 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>
      )}

      {/* OTP Input */}
      {!isLockedOut && (
        <motion.div variants={sectionChildVariants} className="space-y-4">
          <motion.div
            variants={shakeVariants}
            animate={hasError ? 'shake' : 'idle'}
          >
            <OTPInput
              value={code}
              onChange={onCodeChange}
              onComplete={handleComplete}
              error={hasError}
              disabled={isLoading || isLockedOut}
              autoFocus
              reduceMotion={shouldReduceMotion ?? false}
            />
          </motion.div>

          {/* Error or loading */}
          <AnimatePresence mode="wait">
            {hasError && (
              <motion.p
                variants={errorInlineVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="text-body-sm text-red-400"
              >
                {section.error}
              </motion.p>
            )}
            {isLoading && !hasError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                <span className="text-body-sm text-white/50">Verifying...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attempts remaining indicator */}
          {lockout && !lockout.locked && lockout.attemptsRemaining !== undefined && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-body-sm text-amber-400/80"
            >
              {lockout.attemptsRemaining} attempt
              {lockout.attemptsRemaining !== 1 ? 's' : ''} remaining
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Help text */}
      <motion.p
        variants={sectionChildVariants}
        className="text-body-sm text-white/40"
      >
        Don&apos;t have a code? Contact your campus ambassador.
      </motion.p>
    </motion.div>
  );
}

EntryCodeSection.displayName = 'EntryCodeSection';

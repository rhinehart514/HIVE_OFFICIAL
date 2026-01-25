'use client';

/**
 * CodeSection - OTP verification
 * REDESIGNED: Jan 21, 2026
 *
 * Clean verification flow:
 * - Clear messaging about where code was sent
 * - Premium OTP input styling
 * - Subtle loading states
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OTPInput, CountdownTimer } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import { LockedFieldChip } from '../primitives/LockedFieldChip';
import type { SectionState } from '../hooks/useEvolvingEntry';

interface CodeSectionProps {
  section: SectionState;
  email: string;
  code: string[];
  onCodeChange: (code: string[]) => void;
  onVerify: (codeString: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
  isLoading: boolean;
  resendCooldown: number;
}

export function CodeSection({
  section,
  email,
  code,
  onCodeChange,
  onVerify,
  onResend,
  onChangeEmail,
  isLoading,
  resendCooldown,
}: CodeSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const isLocked = section.status === 'locked' || section.status === 'complete';
  const hasError = !!section.error;

  // Locked state - minimal verified indicator
  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
        className="space-y-2"
      >
        <p className="text-body-sm text-white/40 font-medium">Verification</p>
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
          Check your email
        </h2>
        <p className="text-body text-white/50">
          We sent a code to <span className="text-white/70">{email}</span>
        </p>
      </motion.div>

      {/* OTP Input */}
      <motion.div variants={sectionChildVariants} className="space-y-4">
        <motion.div
          variants={shakeVariants}
          animate={hasError ? 'shake' : 'idle'}
        >
          <OTPInput
            value={code}
            onChange={onCodeChange}
            onComplete={onVerify}
            error={hasError}
            disabled={isLoading}
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
      </motion.div>

      {/* Actions */}
      <motion.div
        variants={sectionChildVariants}
        className="flex items-center gap-4 text-body-sm"
      >
        <CountdownTimer
          seconds={resendCooldown}
          prefix="Resend in "
          format={resendCooldown >= 60 ? 'mm:ss' : 'ss'}
          completedContent={
            <button
              onClick={onResend}
              disabled={isLoading}
              className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
            >
              Resend code
            </button>
          }
        />
        <span className="text-white/20">·</span>
        <button
          onClick={onChangeEmail}
          disabled={isLoading}
          className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
        >
          Change email
        </button>
      </motion.div>
    </motion.div>
  );
}

CodeSection.displayName = 'CodeSection';

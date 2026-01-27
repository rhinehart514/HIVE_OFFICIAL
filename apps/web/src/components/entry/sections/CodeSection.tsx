'use client';

/**
 * CodeSection - OTP verification
 * REDESIGNED: Jan 21, 2026
 * UPDATED: Jan 26, 2026 - Added error taxonomy, timeout handling, code expiration
 *
 * Clean verification flow:
 * - Clear messaging about where code was sent
 * - Premium OTP input styling
 * - Subtle loading states
 * - Error recovery with auto-retry for timeouts
 * - Code expiration handling (15 min)
 */

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OTPInput, CountdownTimer } from '@hive/ui/design-system/primitives';
import {
  sectionChildVariants,
  shakeVariants,
} from '../motion/section-motion';
import {
  sectionMorphVariants,
  contentFadeVariants,
} from '../motion/morph-transition';
import { LockedFieldChip, EntryError, VerificationPending } from '../primitives';
import type { SectionState } from '../hooks/useEvolvingEntry';

// Code expiration time in milliseconds (15 minutes)
const CODE_EXPIRATION_MS = 15 * 60 * 1000;

// Timeout threshold in milliseconds (10 seconds)
const TIMEOUT_THRESHOLD_MS = 10 * 1000;

interface CodeSectionProps {
  section: SectionState;
  email: string;
  code: string[];
  onCodeChange: (code: string[]) => void;
  onVerify: (codeString: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
  onRetry?: () => void;
  isLoading: boolean;
  resendCooldown: number;
  /** Timestamp when code was sent (for expiration tracking) */
  codeSentAt?: number;
}

export function CodeSection({
  section,
  email,
  code,
  onCodeChange,
  onVerify,
  onResend,
  onChangeEmail,
  onRetry,
  isLoading,
  resendCooldown,
  codeSentAt,
}: CodeSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  // Track if code has expired
  const [isCodeExpired, setIsCodeExpired] = useState(false);

  // Track verification timeout
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [verifyStartTime, setVerifyStartTime] = useState<number | null>(null);

  const isLocked = section.status === 'locked' || section.status === 'complete';
  const hasError = !!section.error;

  // Check for code expiration
  useEffect(() => {
    if (!codeSentAt || isLocked) {
      setIsCodeExpired(false);
      return;
    }

    const checkExpiration = () => {
      const elapsed = Date.now() - codeSentAt;
      setIsCodeExpired(elapsed >= CODE_EXPIRATION_MS);
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, [codeSentAt, isLocked]);

  // Track verification timeout
  useEffect(() => {
    if (isLoading && !verifyStartTime) {
      setVerifyStartTime(Date.now());
      setIsTimedOut(false);
    } else if (!isLoading) {
      setVerifyStartTime(null);
      setIsTimedOut(false);
    }
  }, [isLoading, verifyStartTime]);

  // Check for timeout during verification
  useEffect(() => {
    if (!verifyStartTime || !isLoading) return;

    const checkTimeout = setInterval(() => {
      const elapsed = Date.now() - verifyStartTime;
      if (elapsed >= TIMEOUT_THRESHOLD_MS) {
        setIsTimedOut(true);
      }
    }, 1000);

    return () => clearInterval(checkTimeout);
  }, [verifyStartTime, isLoading]);

  // Handle retry with backoff
  const handleRetry = useCallback(() => {
    setIsTimedOut(false);
    onRetry?.();
  }, [onRetry]);

  // Handle resend (also clears expiration)
  const handleResend = useCallback(() => {
    setIsCodeExpired(false);
    onResend();
  }, [onResend]);

  // Effective error - timeout state takes precedence
  const displayError = isTimedOut
    ? 'Request timed out. Trying again...'
    : isCodeExpired
      ? 'Code expired. Request a new one.'
      : section.error;

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Unified container with morph animation
  return (
    <motion.div
      layout
      variants={sectionMorphVariants}
      initial={isLocked ? 'collapsed' : 'expanded'}
      animate={isLocked ? 'collapsed' : 'expanded'}
      className="overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {isLocked ? (
          // Locked state - compact chip
          <motion.div
            key="locked"
            variants={contentFadeVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-2"
          >
            <p className="text-body-sm text-white/40 font-medium">Verification</p>
            <LockedFieldChip value="Verified" allowChange={false} />
          </motion.div>
        ) : (
          // Active state - full verification form
          <motion.div
            key="active"
            variants={contentFadeVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
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
                animate={hasError || isCodeExpired ? 'shake' : 'idle'}
              >
                <OTPInput
                  value={code}
                  onChange={onCodeChange}
                  onComplete={onVerify}
                  error={hasError || isCodeExpired}
                  disabled={isLoading || isCodeExpired}
                  autoFocus
                  reduceMotion={shouldReduceMotion ?? false}
                />
              </motion.div>

              {/* Error, timeout indicator, or verification pending */}
              <AnimatePresence mode="wait">
                {(hasError || isCodeExpired || isTimedOut) && (
                  <EntryError
                    key="error"
                    error={displayError}
                    onRetry={handleRetry}
                    onResend={handleResend}
                    isRetrying={isLoading}
                    autoRetry={isTimedOut}
                    autoRetryDelay={3}
                  />
                )}
                {isLoading && !hasError && !isTimedOut && (
                  <VerificationPending key="pending" />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Actions */}
            <motion.div
              variants={sectionChildVariants}
              className="flex items-center gap-4 text-body-sm"
            >
              {/* Resend with cooldown or expiration state */}
              {isCodeExpired ? (
                <button
                  onClick={handleResend}
                  disabled={isLoading || resendCooldown > 0}
                  className="text-[var(--life-gold)] hover:text-[var(--life-gold)]/80 transition-colors disabled:opacity-50 font-medium"
                >
                  Get a new code
                </button>
              ) : (
                <CountdownTimer
                  seconds={resendCooldown}
                  prefix="Resend in "
                  format={resendCooldown >= 60 ? 'mm:ss' : 'ss'}
                  completedContent={
                    <button
                      onClick={handleResend}
                      disabled={isLoading}
                      className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  }
                />
              )}
              <span className="text-white/20">·</span>
              <button
                onClick={onChangeEmail}
                disabled={isLoading}
                className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
              >
                Change email
              </button>
            </motion.div>

            {/* Manifesto line */}
            <motion.p
              variants={sectionChildVariants}
              className="text-body-sm text-white/30 text-center"
            >
              Your campus email is your only key.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

CodeSection.displayName = 'CodeSection';

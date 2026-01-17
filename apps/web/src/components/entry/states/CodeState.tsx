'use client';

/**
 * CodeState - OTP Verification Step
 *
 * Second state in the /enter flow
 * Verifies 6-digit code sent to email
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OTPInput, CountdownTimer } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import {
  stateVariants,
  childVariants,
  errorVariants,
  EASE_PREMIUM,
  DURATION,
} from '../motion/entry-motion';

export interface CodeStateProps {
  /** Email address code was sent to */
  email: string;
  /** Current OTP value */
  code: string[];
  /** Code change handler */
  onCodeChange: (code: string[]) => void;
  /** Called when all 6 digits entered */
  onComplete: (code: string) => void;
  /** Resend code handler */
  onResend: () => void;
  /** Change email handler */
  onChangeEmail: () => void;
  /** Error message */
  error: string | null;
  /** Loading state (verifying) */
  isLoading: boolean;
  /** Seconds until resend available */
  resendCooldown: number;
}

export function CodeState({
  email,
  code,
  onCodeChange,
  onComplete,
  onResend,
  onChangeEmail,
  error,
  isLoading,
  resendCooldown,
}: CodeStateProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={stateVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={childVariants} className="space-y-3">
        <h1 className="text-[32px] font-semibold tracking-tight text-white">
          Check your email
        </h1>
        <p className="text-[15px] leading-relaxed text-white/50">
          Code sent to {email}.
        </p>
      </motion.div>

      {/* OTP Input */}
      <motion.div variants={childVariants} className="space-y-6">
        <OTPInput
          value={code}
          onChange={onCodeChange}
          onComplete={onComplete}
          error={!!error}
          disabled={isLoading}
          autoFocus
          reduceMotion={shouldReduceMotion ?? false}
        />

        {/* Error or verifying state */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              variants={errorVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: DURATION.fast, ease: EASE_PREMIUM }}
            >
              <p className="text-sm text-red-400/90">{error}</p>
            </motion.div>
          )}
          {isLoading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <span className="text-sm text-white/50">Verifying</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Actions */}
      <motion.div variants={childVariants}>
        <div className="flex items-center gap-4 text-sm">
          <CountdownTimer
            seconds={resendCooldown}
            prefix="Resend in "
            format={resendCooldown >= 60 ? 'mm:ss' : 'ss'}
            completedContent={
              <button
                onClick={onResend}
                disabled={isLoading}
                className="text-white/50 hover:text-white focus:text-white focus:outline-none transition-colors disabled:opacity-50"
              >
                Resend code
              </button>
            }
          />
          <span className="text-white/20 select-none">·</span>
          <button
            onClick={onChangeEmail}
            disabled={isLoading}
            className="text-white/50 hover:text-white focus:text-white focus:outline-none transition-colors disabled:opacity-50"
          >
            Change email
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

CodeState.displayName = 'CodeState';

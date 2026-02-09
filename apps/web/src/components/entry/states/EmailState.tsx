'use client';

/**
 * EmailState - Email Entry Step
 *
 * First state in the /enter flow
 * Captures campus email address
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { EmailInput, Button, Input } from '@hive/ui/design-system/primitives';
import {
  stateVariants,
  childVariants,
  errorVariants,
  EASE_PREMIUM,
  DURATION,
} from '../motion/constants';

export interface EmailStateProps {
  /** Current email value */
  email: string;
  /** Email change handler */
  onEmailChange: (email: string) => void;
  /** Submit handler */
  onSubmit: () => void;
  /** Error message */
  error: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Campus email domain (e.g., "buffalo.edu") - optional for multi-campus */
  domain?: string;
  /** Whether user is returning (show "Enter" vs "Claim your spot") */
  isReturning?: boolean;
}

export function EmailState({
  email,
  onEmailChange,
  onSubmit,
  error,
  isLoading,
  domain,
  isReturning: _isReturning = false,
}: EmailStateProps) {
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading && email.trim()) {
        onSubmit();
      }
    },
    [isLoading, email, onSubmit]
  );

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
        <h1 className="text-heading font-semibold tracking-tight text-white">
          Get in
        </h1>
        <p className="text-body leading-relaxed text-white/50">
          Your campus. Your people. Your tools.
        </p>
      </motion.div>

      {/* Email Input + Button */}
      <motion.div variants={childVariants} className="space-y-4">
        {domain ? (
          <EmailInput
            domain={domain}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="you"
            disabled={isLoading}
            error={!!error}
            autoFocus
            size="lg"
          />
        ) : (
          <Input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="you@school.edu"
            disabled={isLoading}
            error={!!error}
            autoFocus
            size="lg"
            className="w-full"
          />
        )}

        {/* Error message */}
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
        </AnimatePresence>

        {/* Continue Button - white pill, not gold (not earned yet) */}
        <Button
          onClick={onSubmit}
          disabled={isLoading || !email.trim()}
          size="lg"
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              Sending
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Continue
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.div variants={childVariants}>
        <p className="text-xs text-white/30">
          <a
            href="/legal/terms"
            className="hover:text-white/50 focus:text-white/50 focus:outline-none transition-colors underline-offset-2 hover:underline"
          >
            Terms
          </a>
          <span className="mx-2 select-none">·</span>
          <a
            href="/legal/privacy"
            className="hover:text-white/50 focus:text-white/50 focus:outline-none transition-colors underline-offset-2 hover:underline"
          >
            Privacy
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}

EmailState.displayName = 'EmailState';

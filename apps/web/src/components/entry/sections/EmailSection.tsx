'use client';

/**
 * EmailSection - Premium email input
 * REDESIGNED: Jan 21, 2026
 *
 * Apple/OpenAI inspired input design:
 * - Clean, minimal borders
 * - Large touch targets
 * - Subtle focus states
 * - Gold CTA button
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@hive/ui/design-system/primitives';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import { LockedFieldChip } from '../primitives/LockedFieldChip';
import type { SectionState } from '../hooks/useEvolvingEntry';

interface EmailSectionProps {
  section: SectionState;
  email: string;
  fullEmail: string;
  domain: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  onEdit: () => void;
  isLoading: boolean;
}

export function EmailSection({
  section,
  email,
  fullEmail,
  domain,
  onEmailChange,
  onSubmit,
  onEdit,
  isLoading,
}: EmailSectionProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isLocked = section.status === 'locked' || section.status === 'complete';
  const isActive = section.status === 'active';
  const hasError = !!section.error;

  // Focus input when section becomes active
  React.useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Locked state - show chip
  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.smooth, ease: EASE_PREMIUM }}
        className="space-y-2"
      >
        <p className="text-[13px] text-white/40 font-medium">Email</p>
        <LockedFieldChip
          value={fullEmail}
          allowChange={true}
          onChangeClick={onEdit}
        />
      </motion.div>
    );
  }

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Active state - show input
  return (
    <motion.div
      variants={sectionEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      <motion.div variants={sectionChildVariants} className="space-y-3">
        <label className="text-[13px] text-white/40 font-medium">
          Your .edu email
        </label>

        <motion.div
          variants={shakeVariants}
          animate={hasError ? 'shake' : 'idle'}
        >
          <div
            className={cn(
              'flex items-center h-14 rounded-2xl border transition-all duration-200',
              'bg-white/[0.03]',
              'focus-within:bg-white/[0.05] focus-within:border-white/20',
              hasError
                ? 'border-red-500/50 bg-red-500/[0.03]'
                : 'border-white/[0.08]'
            )}
          >
            <input
              ref={inputRef}
              type="text"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="you"
              disabled={isLoading}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              className={cn(
                'flex-1 h-full px-5 bg-transparent text-[16px] text-white',
                'placeholder:text-white/25',
                'focus:outline-none',
                'disabled:opacity-50'
              )}
            />
            <span className="pr-5 text-[16px] text-white/30 select-none">
              @{domain}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Inline error */}
      <AnimatePresence>
        {hasError && (
          <motion.p
            variants={errorInlineVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-[13px] text-red-400"
          >
            {section.error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit button - Gold CTA */}
      <motion.div variants={sectionChildVariants}>
        <Button
          variant="cta"
          size="lg"
          onClick={onSubmit}
          disabled={isLoading || !email.trim()}
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Sending code...' : 'Continue'}
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.p
        variants={sectionChildVariants}
        className="text-[12px] text-white/25 text-center"
      >
        By continuing, you agree to our{' '}
        <a href="/legal/terms" className="text-white/40 hover:text-white/60 transition-colors">
          Terms
        </a>{' '}
        and{' '}
        <a href="/legal/privacy" className="text-white/40 hover:text-white/60 transition-colors">
          Privacy Policy
        </a>
      </motion.p>
    </motion.div>
  );
}

EmailSection.displayName = 'EmailSection';

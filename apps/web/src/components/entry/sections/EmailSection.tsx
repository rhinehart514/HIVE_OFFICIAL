'use client';

/**
 * EmailSection - Email input with domain suffix
 *
 * Second section in the evolving entry flow.
 * - Shows email input with school domain suffix when active
 * - Collapses to chip when locked (code sent)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
  errorInlineVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM, GOLD } from '../motion/entry-motion';
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
        <p className="text-[13px] text-white/40">Email</p>
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
      className="space-y-4"
    >
      <motion.div variants={sectionChildVariants} className="space-y-2">
        <p className="text-[13px] text-white/40">Email</p>

        <motion.div
          variants={shakeVariants}
          animate={hasError ? 'shake' : 'idle'}
        >
          <div
            className={cn(
              'flex items-center h-14 rounded-xl border transition-all',
              'bg-white/[0.04]',
              'focus-within:border-white/20',
              hasError ? 'border-red-400/50' : 'border-white/[0.08]'
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
                'flex-1 h-full px-4 bg-transparent text-[15px] text-white',
                'placeholder:text-white/30',
                'focus:outline-none',
                'disabled:opacity-50'
              )}
            />
            <span className="pr-4 text-[15px] text-white/40 select-none">
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
            className="text-[13px] text-red-400/90"
          >
            {section.error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <motion.button
        variants={sectionChildVariants}
        type="button"
        onClick={onSubmit}
        disabled={isLoading || !email.trim()}
        className={cn(
          'w-full h-12 rounded-xl font-medium text-[15px] transition-all',
          'flex items-center justify-center gap-2',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          email.trim() && !isLoading
            ? 'bg-white text-black hover:bg-white/90'
            : 'bg-white/10 text-white/30 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending code...</span>
          </>
        ) : (
          <span>Continue</span>
        )}
      </motion.button>

      {/* Footer links */}
      <motion.p
        variants={sectionChildVariants}
        className="text-[12px] text-white/30 text-center"
      >
        By continuing, you agree to our{' '}
        <a href="/terms" className="text-white/50 hover:text-white/70 underline">
          Terms
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-white/50 hover:text-white/70 underline">
          Privacy Policy
        </a>
      </motion.p>
    </motion.div>
  );
}

EmailSection.displayName = 'EmailSection';

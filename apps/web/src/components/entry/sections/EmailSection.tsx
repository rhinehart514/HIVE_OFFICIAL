'use client';

/**
 * EmailSection - Premium email input
 * REDESIGNED: Jan 23, 2026
 *
 * Apple/OpenAI inspired input design:
 * - Clean, minimal borders with integrated domain suffix
 * - Large touch targets
 * - Subtle focus states with gold ring
 * - Gold CTA button for primary action
 *
 * FIXED: Domain suffix visual integration - no separate containers
 * FIXED: Handle browser autocomplete stripping domain from pasted emails
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@hive/ui/design-system/primitives';
import {
  sectionEnterVariants,
  sectionChildVariants,
  shakeVariants,
} from '../motion/section-motion';
import {
  sectionMorphVariants,
  contentFadeVariants,
} from '../motion/morph-transition';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';
import { LockedFieldChip, ErrorWithRetry } from '../primitives';
import type { SectionState } from '../hooks/useEvolvingEntry';

interface EmailSectionProps {
  section: SectionState;
  email: string;
  fullEmail: string;
  domain: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  onEdit: () => void;
  onRetry?: () => void;
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
  onRetry,
  isLoading,
}: EmailSectionProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  const isLocked = section.status === 'locked' || section.status === 'complete';
  const isActive = section.status === 'active';
  const hasError = !!section.error;

  // Focus input when section becomes active
  React.useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Handle email change - strip domain if user pastes full email
  const handleEmailChange = (value: string) => {
    // If user pasted full email with domain, strip it
    let cleanValue = value.toLowerCase().trim();

    // Remove the @domain.edu suffix if present (handles autocomplete/paste)
    if (cleanValue.includes('@')) {
      cleanValue = cleanValue.split('@')[0];
    }

    // Remove any non-alphanumeric characters except . _ -
    cleanValue = cleanValue.replace(/[^a-z0-9._-]/g, '');

    onEmailChange(cleanValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && email.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

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
            <p className="text-body-sm text-white/40 font-medium">Email</p>
            <LockedFieldChip
              value={fullEmail}
              allowChange={true}
              onChangeClick={onEdit}
            />
          </motion.div>
        ) : (
          // Active state - full input form
          <motion.div
            key="active"
            variants={contentFadeVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-5"
          >
            <motion.div variants={sectionChildVariants} className="space-y-3">
              <label className="text-body-sm text-white/40 font-medium">
                Your .edu email
              </label>

              <motion.div
                variants={shakeVariants}
                animate={hasError ? 'shake' : 'idle'}
              >
                {/* Unified input container - domain suffix is visually integrated */}
                <div
                  className={cn(
                    'relative flex items-center h-14 rounded-2xl border transition-all duration-200',
                    'bg-white/[0.03]',
                    hasError
                      ? 'border-red-500/50 bg-red-500/[0.03]'
                      : isFocused
                        ? 'border-[var(--color-gold)]/30 bg-white/[0.05] shadow-[0_0_0_4px_rgba(255,215,0,0.06)]'
                        : 'border-white/[0.08]'
                  )}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="you"
                    disabled={isLoading}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    data-form-type="other"
                    className={cn(
                      'flex-1 h-full px-5 bg-transparent text-body-lg text-white',
                      'placeholder:text-white/25',
                      'focus:outline-none',
                      'disabled:opacity-50'
                    )}
                  />
                  {/* Domain suffix - seamlessly integrated, no separate container */}
                  <span
                    className={cn(
                      'pr-5 text-body-lg select-none pointer-events-none whitespace-nowrap transition-colors',
                      isFocused ? 'text-white/45' : 'text-white/30'
                    )}
                  >
                    @{domain}
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Inline error with retry */}
            <AnimatePresence>
              {hasError && (
                <ErrorWithRetry
                  error={section.error}
                  onRetry={onRetry}
                  isRetrying={isLoading}
                />
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

            {/* Manifesto line */}
            <motion.p
              variants={sectionChildVariants}
              className="text-body-sm text-white/30 text-center"
            >
              No application. No approval. Just your .edu.
            </motion.p>

            {/* Footer */}
            <motion.p
              variants={sectionChildVariants}
              className="text-label text-white/25 text-center"
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
        )}
      </AnimatePresence>
    </motion.div>
  );
}

EmailSection.displayName = 'EmailSection';

'use client';

/**
 * AuthSuccessState Component
 * Source: Onboarding & Auth Vertical Slice
 *
 * Minimal success celebration: check icon + "You're in" + loading dots.
 * Clean, confident, not over-the-top.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN PHILOSOPHY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Success should feel confident, not carnival. The animation is:
 * 1. Check icon springs in with rotation (satisfying micro-moment)
 * 2. "You're in" fades up (simple statement of fact)
 * 3. Loading dots pulse (indicates redirect in progress)
 *
 * Gold is earned here - the check icon is the one gold element,
 * representing achievement (from LANGUAGE.md gold budget rules).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { motion } from 'framer-motion';

// ============================================
// TYPES
// ============================================

export interface AuthSuccessStateProps {
  /** Main headline text */
  headline?: string;
  /** Subtext message */
  subtext?: string;
  /** Whether this is a new user (affects subtext) */
  isNewUser?: boolean;
  /** Callback when animation completes (for redirect timing) */
  onAnimationComplete?: () => void;
  /** Additional CSS class */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * AuthSuccessState - Minimal success celebration
 *
 * Displays a check icon, success message, and loading dots.
 * Used after successful authentication/verification.
 *
 * @example
 * ```tsx
 * {loginState === 'success' && (
 *   <AuthSuccessState
 *     isNewUser={needsOnboarding}
 *     onAnimationComplete={() => router.push(redirectUrl)}
 *   />
 * )}
 * ```
 */
export function AuthSuccessState({
  headline = "You're in",
  subtext,
  isNewUser = false,
  onAnimationComplete,
  className,
}: AuthSuccessStateProps) {
  // Determine subtext based on user status
  const displaySubtext = subtext ?? (isNewUser
    ? 'Setting up your account...'
    : 'Taking you home...');

  // Call onAnimationComplete after all animations settle
  React.useEffect(() => {
    if (onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 1800); // Match the redirect timing from original
      return () => clearTimeout(timer);
    }
  }, [onAnimationComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`text-center ${className ?? ''}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_PREMIUM }}
        className="space-y-6"
      >
        {/* Main headline with check */}
        <div className="flex items-center justify-center gap-3">
          {/* Animated check icon */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 15,
              delay: 0.2
            }}
          >
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--color-gold)' }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>

          {/* Headline */}
          <h1
            className="text-3xl font-semibold tracking-[-0.02em]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {headline}
          </h1>
        </div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-[15px]"
          style={{ color: 'rgba(255, 255, 255, 0.4)' }}
        >
          {displaySubtext}
        </motion.p>

        {/* Minimal loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-1.5 pt-4"
          aria-label="Loading"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut'
              }}
              className="w-1 h-1 rounded-full bg-white/60"
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * AuthSuccessStateCompact - Even more minimal version
 *
 * Just the check and text, no loading dots.
 * For inline success states or quick confirmations.
 */
export function AuthSuccessStateCompact({
  message = 'Done',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center justify-center gap-2 ${className ?? ''}`}
    >
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 15,
        }}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--color-gold)' }}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.div>
      <span
        className="text-sm font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {message}
      </span>
    </motion.div>
  );
}

// Default export for convenience
export default AuthSuccessState;

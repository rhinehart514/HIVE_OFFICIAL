'use client';

/**
 * ArrivalState - The Doors Open
 * REDESIGNED: Jan 18, 2026
 *
 * Final state in the /enter flow.
 * This is THE celebration moment - make it feel like coming home.
 *
 * Changes from previous:
 * - "Welcome home" instead of "You're in"
 * - Preview of what's waiting (spaces, community)
 * - Manual CTA (user controls when to proceed)
 * - Confetti burst + gold glow (dramatic celebration)
 * - No rushed auto-redirect
 *
 * GOLD BUDGET: Full celebration mode - gold CTA, particles, glow
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { ConfettiBurst } from '../motion/ConfettiBurst';
import {
  stateVariants,
  childVariants,
  EASE_PREMIUM,
  DURATION,
  GOLD,
} from '../motion/entry-motion';

export interface ArrivalStateProps {
  /** User's first name */
  firstName: string;
  /** User's handle (without @) */
  handle: string;
  /** Whether this is a new user (show handle) or returning */
  isNewUser: boolean;
  /** Callback when user clicks to proceed */
  onComplete: () => void;
}

// Stats to show what's waiting (creates anticipation)
const WAITING_STATS = [
  { label: '400+ communities', delay: 0.8 },
  { label: '35 AI tools', delay: 0.9 },
  { label: '20+ events this week', delay: 1.0 },
];

export function ArrivalState({
  firstName,
  handle,
  isNewUser,
  onComplete,
}: ArrivalStateProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [showContent, setShowContent] = React.useState(false);

  // Staggered reveal: confetti → content
  React.useEffect(() => {
    const timers = [
      setTimeout(() => setShowConfetti(true), 200),
      setTimeout(() => setShowContent(true), 400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Greeting based on user type
  const greeting = isNewUser ? 'Welcome home' : 'Welcome back';
  const subtext = isNewUser
    ? `You're officially part of HIVE, @${handle}.`
    : `Good to see you again.`;

  return (
    <motion.div
      variants={stateVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center text-center relative py-8"
    >
      {/* Confetti burst - dramatic celebration */}
      <ConfettiBurst trigger={showConfetti} />

      {/* Main message */}
      <motion.div
        variants={childVariants}
        className="mb-10"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.gentle,
          ease: EASE_PREMIUM,
        }}
      >
        <motion.h1
          className="text-heading-lg lg:text-display-sm font-semibold tracking-tight text-white mb-3"
          style={{
            textShadow: '0 0 40px rgba(255, 215, 0, 0.15)',
          }}
        >
          {greeting}
          {firstName && (
            <>
              ,<br />
              <span
                className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text"
              >
                {firstName}
              </span>
            </>
          )}
        </motion.h1>

        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{
            duration: DURATION.smooth,
            delay: 0.2,
            ease: EASE_PREMIUM,
          }}
          className="text-body text-white/50"
        >
          {subtext}
        </motion.p>
      </motion.div>

      {/* What's waiting - stats preview */}
      <motion.div
        variants={childVariants}
        className="mb-10 flex flex-col gap-3"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.3,
          ease: EASE_PREMIUM,
        }}
      >
        <p className="text-xs uppercase tracking-wide text-white/30 mb-2">
          What's waiting for you
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {WAITING_STATS.map((stat) => (
            <motion.div
              key={stat.label}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: DURATION.smooth,
                delay: stat.delay,
                ease: EASE_PREMIUM,
              }}
              className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06]"
            >
              <span className="text-sm text-white/50">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Button - GOLD (earned moment) */}
      <motion.div
        variants={childVariants}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
        animate={showContent ? { opacity: 1, scale: 1 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.6,
          ease: EASE_PREMIUM,
        }}
        className="w-full max-w-[280px]"
      >
        <Button
          onClick={onComplete}
          variant="cta"
          size="lg"
          className="w-full gap-2 group"
        >
          <span>Explore your campus</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </motion.div>

      {/* Subtle hint */}
      <motion.p
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={showContent ? { opacity: 0.3 } : {}}
        transition={{
          duration: DURATION.smooth,
          delay: 1,
          ease: EASE_PREMIUM,
        }}
        className="mt-6 text-xs text-white/30"
      >
        Join spaces, connect with people, build tools
      </motion.p>
    </motion.div>
  );
}

ArrivalState.displayName = 'ArrivalState';

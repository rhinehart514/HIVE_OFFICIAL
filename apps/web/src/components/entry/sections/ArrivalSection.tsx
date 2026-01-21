'use client';

/**
 * ArrivalSection - Welcome celebration
 * REDESIGNED: Jan 21, 2026
 *
 * Minimal, confident celebration:
 * - Clean typography with Clash Display
 * - Subtle gold glow (no confetti noise)
 * - Premium CTA button
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@hive/ui/design-system/primitives';
import { ConfettiBurst } from '../motion/ConfettiBurst';
import {
  arrivalRevealVariants,
  arrivalGlowVariants,
} from '../motion/section-motion';
import { DURATION, EASE_PREMIUM, GOLD } from '../motion/entry-motion';
import type { SectionState } from '../hooks/useEvolvingEntry';

interface ArrivalSectionProps {
  section: SectionState;
  firstName: string;
  handle: string;
  isNewUser: boolean;
  isReturningUser: boolean;
  onComplete: () => void;
}

export function ArrivalSection({
  section,
  firstName,
  handle,
  isNewUser,
  isReturningUser,
  onComplete,
}: ArrivalSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [showContent, setShowContent] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Staggered reveal: confetti → content
  React.useEffect(() => {
    if (section.status === 'active' || section.status === 'complete') {
      const timers = [
        setTimeout(() => setShowConfetti(true), 200),
        setTimeout(() => setShowContent(true), 400),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [section.status]);

  // Greeting based on user type
  const greeting = isReturningUser ? 'Welcome back' : "You're in";
  const subtext = isReturningUser
    ? 'Good to see you again.'
    : handle
      ? `@${handle} is yours.`
      : "Your campus awaits.";

  const handleComplete = () => {
    setIsNavigating(true);
    onComplete();
  };

  return (
    <motion.div
      variants={arrivalRevealVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center text-center relative py-12"
    >
      {/* Confetti burst (subtle) */}
      <ConfettiBurst trigger={showConfetti} />

      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        variants={arrivalGlowVariants}
        initial="initial"
        animate="animate"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 30%, ${GOLD.glowSubtle}, transparent)`,
        }}
      />

      {/* Main message */}
      <motion.div
        className="mb-10 relative z-10"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.gentle,
          ease: EASE_PREMIUM,
        }}
      >
        <motion.h1
          className="text-[36px] md:text-[44px] font-semibold tracking-tight text-white mb-3"
          style={{
            fontFamily: 'var(--font-display)',
            textShadow: '0 0 60px rgba(255, 215, 0, 0.12)',
          }}
        >
          {greeting}
          {firstName && !isReturningUser && (
            <>
              ,<br />
              <span className="text-white">{firstName}</span>
            </>
          )}
          {firstName && isReturningUser && (
            <span className="text-white">, {firstName}</span>
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
          className="text-[16px] text-white/50"
        >
          {subtext}
        </motion.p>
      </motion.div>

      {/* CTA - Gold */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.4,
          ease: EASE_PREMIUM,
        }}
        className="w-full max-w-[280px] relative z-10"
      >
        <Button
          variant="cta"
          size="lg"
          onClick={handleComplete}
          disabled={isNavigating}
          loading={isNavigating}
          className="w-full"
        >
          {isNavigating ? 'Loading...' : 'Explore your campus'}
        </Button>
      </motion.div>

      {/* Subtle hint */}
      <motion.p
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={showContent ? { opacity: 1 } : {}}
        transition={{
          duration: DURATION.smooth,
          delay: 0.8,
          ease: EASE_PREMIUM,
        }}
        className="mt-8 text-[12px] text-white/25 relative z-10"
      >
        400+ spaces waiting
      </motion.p>
    </motion.div>
  );
}

ArrivalSection.displayName = 'ArrivalSection';

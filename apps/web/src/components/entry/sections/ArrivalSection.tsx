'use client';

/**
 * ArrivalSection - Welcome celebration
 * REDESIGNED: Jan 21, 2026
 *
 * Triumphant arrival moment:
 * - Gold checkmark icon as hero
 * - Handle displayed prominently
 * - Luxurious glow effects
 * - Confident, forward-looking copy
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { ConfettiBurst } from '../motion/ConfettiBurst';
import {
  arrivalRevealVariants,
  arrivalGlowVariants,
} from '../motion/section-motion';
import {
  DURATION,
  EASE_PREMIUM,
  GOLD,
  SPRING_BOUNCY,
  wordRevealVariants,
  createWordReveal,
} from '../motion/entry-motion';
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

  // Staggered reveal: checkmark → content → CTA
  React.useEffect(() => {
    if (section.status === 'active' || section.status === 'complete') {
      const timers = [
        setTimeout(() => setShowConfetti(true), 100),
        setTimeout(() => setShowContent(true), 300),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [section.status]);

  const handleComplete = () => {
    setIsNavigating(true);
    onComplete();
  };

  // Word-by-word for the headline
  const headlineWords = isReturningUser
    ? ['Welcome', 'back,', firstName || 'friend']
    : ["You're", 'in,', firstName || 'friend'];

  return (
    <motion.div
      variants={arrivalRevealVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center text-center relative py-8"
    >
      {/* Confetti burst */}
      <ConfettiBurst trigger={showConfetti} />

      {/* Layered glow effects */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        variants={arrivalGlowVariants}
        initial="initial"
        animate="animate"
        style={{
          background: `radial-gradient(ellipse 100% 60% at 50% 20%, ${GOLD.glow}, transparent 60%)`,
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2, ease: EASE_PREMIUM }}
        style={{
          background: `radial-gradient(circle at 50% 30%, ${GOLD.glowSoft}, transparent 50%)`,
        }}
      />

      {/* Gold checkmark hero */}
      <motion.div
        className="relative z-10 mb-8"
        initial={shouldReduceMotion ? { scale: 1 } : { scale: 0, opacity: 0 }}
        animate={showContent ? { scale: 1, opacity: 1 } : {}}
        transition={SPRING_BOUNCY}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${GOLD.primary}, ${GOLD.dark})`,
            boxShadow: `0 0 60px ${GOLD.glow}, 0 0 120px ${GOLD.glowSubtle}`,
          }}
        >
          <Check className="w-10 h-10 text-black" strokeWidth={3} />
        </div>
      </motion.div>

      {/* Main message */}
      <motion.div
        className="mb-6 relative z-10"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.slow,
          delay: 0.2,
          ease: EASE_PREMIUM,
        }}
      >
        {/* Word-by-word headline */}
        <h1
          className="text-[40px] md:text-[52px] font-semibold tracking-tight text-white leading-[1.0]"
          style={{
            fontFamily: 'var(--font-display)',
            textShadow: `0 0 80px ${GOLD.glowSubtle}`,
          }}
        >
          {headlineWords.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.2em]"
              variants={wordRevealVariants}
              initial="initial"
              animate={showContent ? 'animate' : 'initial'}
              transition={createWordReveal(i, 0.1)}
            >
              {word}
            </motion.span>
          ))}
        </h1>
      </motion.div>

      {/* Handle badge - the earned moment */}
      {handle && !isReturningUser && (
        <motion.div
          className="mb-10 relative z-10"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
          animate={showContent ? { opacity: 1, scale: 1 } : {}}
          transition={{
            duration: DURATION.gentle,
            delay: 0.5,
            ease: EASE_PREMIUM,
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border"
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.08)',
              borderColor: 'rgba(255, 215, 0, 0.2)',
            }}
          >
            <span
              className="text-[18px] font-medium"
              style={{ color: GOLD.primary }}
            >
              @{handle}
            </span>
            <span className="text-[14px] text-white/40">is yours</span>
          </div>
        </motion.div>
      )}

      {/* Returning user message */}
      {isReturningUser && (
        <motion.p
          className="mb-10 text-[16px] text-white/50 relative z-10"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{
            duration: DURATION.smooth,
            delay: 0.4,
            ease: EASE_PREMIUM,
          }}
        >
          Your campus is ready.
        </motion.p>
      )}

      {/* CTA - Gold, prominent */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={showContent ? { opacity: 1, y: 0 } : {}}
        transition={{
          duration: DURATION.gentle,
          delay: 0.6,
          ease: EASE_PREMIUM,
        }}
        className="w-full max-w-[300px] relative z-10"
      >
        <Button
          variant="cta"
          size="lg"
          onClick={handleComplete}
          disabled={isNavigating}
          loading={isNavigating}
          className="w-full text-[16px]"
        >
          {isNavigating ? 'Loading...' : 'Enter HIVE'}
        </Button>
      </motion.div>

      {/* Teaser */}
      <motion.div
        className="mt-10 relative z-10"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={showContent ? { opacity: 1 } : {}}
        transition={{
          duration: DURATION.smooth,
          delay: 1,
          ease: EASE_PREMIUM,
        }}
      >
        <p className="text-[13px] text-white/30 mb-3">Your campus is waiting</p>
        <div className="flex items-center justify-center gap-2">
          {/* Mini space indicators */}
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={showContent ? { opacity: 1, scale: 1 } : {}}
              transition={{
                duration: 0.4,
                delay: 1.1 + i * 0.05,
                ease: EASE_PREMIUM,
              }}
            />
          ))}
          <motion.span
            className="text-[12px] text-white/20 ml-1"
            initial={{ opacity: 0 }}
            animate={showContent ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 1.4 }}
          >
            +400
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}

ArrivalSection.displayName = 'ArrivalSection';

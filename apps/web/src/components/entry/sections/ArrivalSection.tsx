'use client';

/**
 * ArrivalSection - Welcome celebration
 * REDESIGNED: Jan 21, 2026
 *
 * Triumphant arrival moment with weight:
 * - 800ms "Preparing your campus..." pause builds anticipation
 * - Gold checkmark icon scales in with glow
 * - Word-by-word reveal for "You're in, {name}."
 * - Handle badge fades in
 * - No confetti - gold glow is the celebration
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import {
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
  const [phase, setPhase] = React.useState<'preparing' | 'revealing' | 'ready'>('preparing');
  const [isNavigating, setIsNavigating] = React.useState(false);

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Phased reveal: preparing → revealing → ready
  React.useEffect(() => {
    if (section.status === 'active' || section.status === 'complete') {
      // Phase 1: Show "Preparing your campus..." for 800ms
      const preparingTimer = setTimeout(() => {
        setPhase('revealing');
      }, 800);

      // Phase 2: After reveal animations complete, mark as ready
      const readyTimer = setTimeout(() => {
        setPhase('ready');
      }, 2000);

      return () => {
        clearTimeout(preparingTimer);
        clearTimeout(readyTimer);
      };
    }
  }, [section.status]);

  const handleComplete = () => {
    setIsNavigating(true);
    onComplete();
  };

  // Word-by-word for the headline
  const headlineWords = isReturningUser
    ? ['Welcome', 'back,', firstName || 'friend']
    : ["You're", 'in,', firstName || 'friend'] ;

  const isRevealing = phase === 'revealing' || phase === 'ready';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.slow, ease: EASE_PREMIUM }}
      className="flex flex-col items-center text-center relative py-8"
    >
      {/* Layered glow effects */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        variants={arrivalGlowVariants}
        initial="initial"
        animate={isRevealing ? 'animate' : 'initial'}
        style={{
          background: `radial-gradient(ellipse 100% 60% at 50% 20%, ${GOLD.glow}, transparent 60%)`,
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isRevealing ? 0.5 : 0 }}
        transition={{ duration: 2, ease: EASE_PREMIUM }}
        style={{
          background: `radial-gradient(circle at 50% 30%, ${GOLD.glowSoft}, transparent 50%)`,
        }}
      />

      {/* Preparing state - pulse animation */}
      {phase === 'preparing' && (
        <motion.div
          className="relative z-10 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center mb-6"
            animate={{
              scale: [1, 1.05, 1],
              borderColor: ['rgba(255,255,255,0.2)', 'rgba(255,215,0,0.3)', 'rgba(255,255,255,0.2)'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-white/40"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
          <p className="text-body-lg text-white/50">Preparing your campus...</p>
        </motion.div>
      )}

      {/* Reveal state */}
      {isRevealing && (
        <>
          {/* Gold checkmark hero */}
          <motion.div
            className="relative z-10 mb-8"
            initial={shouldReduceMotion ? { scale: 1 } : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING_BOUNCY}
          >
            <motion.div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${GOLD.primary}, ${GOLD.dark})`,
              }}
              animate={{
                boxShadow: [
                  `0 0 40px ${GOLD.glow}, 0 0 80px ${GOLD.glowSubtle}`,
                  `0 0 60px ${GOLD.glow}, 0 0 120px ${GOLD.glowSubtle}`,
                  `0 0 40px ${GOLD.glow}, 0 0 80px ${GOLD.glowSubtle}`,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Check className="w-10 h-10 text-black" strokeWidth={3} />
            </motion.div>
          </motion.div>

          {/* Main message - word-by-word */}
          <motion.div
            className="mb-6 relative z-10"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: DURATION.slow,
              delay: 0.3,
              ease: EASE_PREMIUM,
            }}
          >
            <h1
              className="text-heading-lg md:text-display font-semibold tracking-tight text-white leading-[1.0]"
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
                  animate="animate"
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
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: DURATION.gentle,
                delay: 0.6,
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
                  className="text-title-sm font-medium"
                  style={{ color: GOLD.primary }}
                >
                  @{handle}
                </span>
                <span className="text-body text-white/40">is yours</span>
              </div>
            </motion.div>
          )}

          {/* Returning user message */}
          {isReturningUser && (
            <motion.p
              className="mb-10 text-body-lg text-white/50 relative z-10"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: DURATION.smooth,
                delay: 0.5,
                ease: EASE_PREMIUM,
              }}
            >
              Your campus is ready.
            </motion.p>
          )}

          {/* CTA - Gold, prominent */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: DURATION.gentle,
              delay: 0.8,
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
              className="w-full text-body-lg"
            >
              {isNavigating ? 'Loading...' : 'Enter HIVE'}
            </Button>
          </motion.div>

          {/* Teaser */}
          <motion.div
            className="mt-10 relative z-10"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: DURATION.smooth,
              delay: 1.2,
              ease: EASE_PREMIUM,
            }}
          >
            <p className="text-body-sm text-white/30 mb-3">Your campus is waiting</p>
            <div className="flex items-center justify-center gap-2">
              {/* Mini space indicators */}
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 1.3 + i * 0.05,
                    ease: EASE_PREMIUM,
                  }}
                />
              ))}
              <motion.span
                className="text-label text-white/20 ml-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.6 }}
              >
                +400
              </motion.span>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

ArrivalSection.displayName = 'ArrivalSection';

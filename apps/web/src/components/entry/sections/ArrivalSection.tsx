'use client';

/**
 * ArrivalSection - The Crossing
 * REDESIGNED: Jan 26, 2026 - The Threshold Entry Flow
 *
 * The final ceremonial moment:
 * - Identity card preview showing @handle, major, year, interests
 * - Word-by-word manifesto reveal: "We stopped waiting for institutions."
 * - Gold "Enter HIVE" CTA with pulse animation
 * - Celebration flash transition to /spaces
 *
 * For returning users: Simple "Welcome back" without the ceremony
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
  major?: string;
  graduationYear?: number | null;
  interests?: string[];
  isNewUser: boolean;
  isReturningUser: boolean;
  onComplete: () => void;
}

export function ArrivalSection({
  section,
  firstName,
  handle,
  major,
  graduationYear,
  interests = [],
  isNewUser,
  isReturningUser,
  onComplete,
}: ArrivalSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = React.useState<'preparing' | 'revealing' | 'ready'>('preparing');
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [showFlash, setShowFlash] = React.useState(false);

  // Hidden state
  if (section.status === 'hidden') {
    return null;
  }

  // Phased reveal: preparing → revealing → ready
  React.useEffect(() => {
    if (section.status === 'active' || section.status === 'complete') {
      // Phase 1: Brief pause for anticipation
      const preparingTimer = setTimeout(() => {
        setPhase('revealing');
      }, 400);

      // Phase 2: After reveal animations complete
      const readyTimer = setTimeout(() => {
        setPhase('ready');
      }, 1600);

      return () => {
        clearTimeout(preparingTimer);
        clearTimeout(readyTimer);
      };
    }
  }, [section.status]);

  const handleComplete = () => {
    setIsNavigating(true);
    // Celebration flash
    setShowFlash(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  // Word-by-word for the manifesto
  const manifestoWords = ['We', 'stopped', 'waiting', 'for', 'institutions.'];

  const isRevealing = phase === 'revealing' || phase === 'ready';

  // Returning user - simple welcome back
  if (isReturningUser) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.slow, ease: EASE_PREMIUM }}
        className="flex flex-col items-center text-center relative py-8"
      >
        {/* Simple welcome */}
        <motion.h1
          className="text-heading-lg font-semibold text-white mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Welcome back, {firstName || 'friend'}
        </motion.h1>

        <motion.p
          className="text-body-lg text-white/50 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Your campus is ready.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="w-full max-w-[300px]"
        >
          <Button
            variant="cta"
            size="lg"
            onClick={handleComplete}
            disabled={isNavigating}
            loading={isNavigating}
            className="w-full"
          >
            {isNavigating ? 'Loading...' : 'Enter HIVE'}
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // New user - The Crossing ceremony
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.slow, ease: EASE_PREMIUM }}
      className="flex flex-col items-center text-center relative py-8"
    >
      {/* Celebration flash overlay */}
      {showFlash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ backgroundColor: GOLD.primary }}
        />
      )}

      {/* Background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        variants={arrivalGlowVariants}
        initial="initial"
        animate={isRevealing ? 'animate' : 'initial'}
        style={{
          background: `radial-gradient(ellipse 100% 60% at 50% 20%, ${GOLD.glow}, transparent 60%)`,
        }}
      />

      {/* Preparing state */}
      {phase === 'preparing' && (
        <motion.div
          className="relative z-10 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center"
            animate={{
              borderColor: ['rgba(255,255,255,0.2)', 'rgba(255,215,0,0.3)', 'rgba(255,255,255,0.2)'],
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-white/40"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Reveal state - The Crossing */}
      {isRevealing && (
        <>
          {/* Identity Card Preview */}
          <motion.div
            className="relative z-10 w-full max-w-[340px] mb-10"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING_BOUNCY, delay: 0.1 }}
          >
            <div
              className="p-6 rounded-2xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                borderColor: 'rgba(255,215,0,0.15)',
                boxShadow: `0 0 40px ${GOLD.glowSubtle}, inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}
            >
              {/* Handle - hero element */}
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <span
                  className="text-heading font-semibold"
                  style={{
                    color: GOLD.primary,
                    textShadow: `0 0 30px ${GOLD.glowSubtle}`,
                  }}
                >
                  @{handle}
                </span>
              </motion.div>

              {/* Name */}
              <motion.p
                className="text-body-lg text-white font-medium mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                {firstName}
              </motion.p>

              {/* Major & Year */}
              {(major || graduationYear) && (
                <motion.div
                  className="flex items-center gap-2 mb-4 text-body text-white/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  {major && <span>{major}</span>}
                  {major && graduationYear && <span className="text-white/30">·</span>}
                  {graduationYear && <span>Class of {graduationYear}</span>}
                </motion.div>
              )}

              {/* Interests */}
              {interests.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  {interests.map((interest, idx) => (
                    <motion.span
                      key={interest}
                      className="px-2.5 py-1 rounded-full text-label-sm bg-white/[0.06] text-white/60 border border-white/[0.08]"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.65 + idx * 0.05, duration: 0.3 }}
                    >
                      {interest}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Manifesto - word by word */}
          <motion.div
            className="mb-10 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <p
              className="text-body-lg text-white/60 leading-relaxed"
              style={{
                fontFamily: 'var(--font-display)',
                textShadow: `0 0 40px ${GOLD.glowSubtle}`,
              }}
            >
              {manifestoWords.map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block mr-[0.25em]"
                  variants={wordRevealVariants}
                  initial="initial"
                  animate="animate"
                  transition={createWordReveal(i, 0.08)}
                  style={{ transitionDelay: `${0.9 + i * 0.08}s` }}
                >
                  {word}
                </motion.span>
              ))}
            </p>
          </motion.div>

          {/* CTA - Gold with pulse */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: DURATION.gentle,
              delay: 1.4,
              ease: EASE_PREMIUM,
            }}
            className="w-full max-w-[300px] relative z-10"
          >
            <motion.div
              animate={
                phase === 'ready' && !isNavigating
                  ? {
                      boxShadow: [
                        `0 0 20px ${GOLD.glowSubtle}`,
                        `0 0 40px ${GOLD.glow}`,
                        `0 0 20px ${GOLD.glowSubtle}`,
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="rounded-xl"
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
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

ArrivalSection.displayName = 'ArrivalSection';

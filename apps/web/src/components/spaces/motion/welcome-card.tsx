'use client';

/**
 * WelcomeCard - "Welcome to X" identity moment
 *
 * Shown after joining a space during the crossing ceremony.
 *
 * Timing:
 * - Border draws (0.5s)
 * - Content reveals (0.5s)
 * - Hold visible (0.5s)
 * - Fade up and exit (0.2s)
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  motion,
  MOTION,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@hive/ui/design-system/primitives';
import { SPACES_MOTION, SPACES_GOLD } from '@hive/ui/tokens';

// ============================================================
// Types
// ============================================================

interface WelcomeCardProps {
  /** Whether the card is visible */
  show: boolean;
  /** Space information */
  space: {
    name: string;
    avatarUrl?: string;
  };
  /** Callback when animation completes */
  onComplete?: () => void;
}

// ============================================================
// Component
// ============================================================

export function WelcomeCard({
  show,
  space,
  onComplete,
}: WelcomeCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const {
    enter: enterDuration,
    hold: holdDuration,
    exit: exitDuration,
  } = SPACES_MOTION.crossing.welcomeCard;

  const totalDuration = enterDuration + holdDuration + exitDuration;

  // Trigger onComplete after full animation
  React.useEffect(() => {
    if (!show || !onComplete) return;

    const timer = setTimeout(() => {
      onComplete();
    }, (shouldReduceMotion ? 0.1 : totalDuration) * 1000);

    return () => clearTimeout(timer);
  }, [show, onComplete, totalDuration, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{
            duration: shouldReduceMotion ? 0 : exitDuration,
            delay: shouldReduceMotion ? 0 : enterDuration + holdDuration,
          }}
        >
          {/* Card */}
          <motion.div
            className="relative px-12 py-10 rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              boxShadow: `0 0 60px ${SPACES_GOLD.glowSubtle}, inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: shouldReduceMotion ? 0 : enterDuration,
              ease: MOTION.ease.premium,
            }}
          >
            {/* Animated*/}
            {!shouldReduceMotion && (
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={{
                  boxShadow: `inset 0 0 0 1px ${SPACES_GOLD.glowSubtle}`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: enterDuration,
                  ease: MOTION.ease.premium,
                }}
              />
            )}

            {/* Content */}
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : enterDuration * 0.8,
                delay: shouldReduceMotion ? 0 : enterDuration * 0.3,
                ease: MOTION.ease.premium,
              }}
            >
              {/* Space avatar */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.3,
                  delay: shouldReduceMotion ? 0 : enterDuration * 0.4,
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
              >
                <Avatar size="lg" className="ring-2 ring-[#FFD700]/30 mb-5">
                  {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                  <AvatarFallback className="text-xl bg-white/[0.06]">
                    {getInitials(space.name)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              {/* Welcome text */}
              <motion.p
                className="text-sm uppercase tracking-wider text-white/50 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.3,
                  delay: shouldReduceMotion ? 0 : enterDuration * 0.5,
                }}
              >
                Welcome to
              </motion.p>

              <motion.h2
                className="text-2xl font-semibold text-white tracking-tight"
                style={{ fontFamily: 'var(--font-clash)' }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.4,
                  delay: shouldReduceMotion ? 0 : enterDuration * 0.6,
                  ease: MOTION.ease.premium,
                }}
              >
                {space.name}
              </motion.h2>
            </motion.div>

            {/* Gold accent glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0.1] }}
              transition={{
                duration: shouldReduceMotion ? 0 : totalDuration * 0.8,
                delay: shouldReduceMotion ? 0 : enterDuration * 0.2,
              }}
              style={{
                background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${SPACES_GOLD.glowSoft}, transparent)`,
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

WelcomeCard.displayName = 'WelcomeCard';

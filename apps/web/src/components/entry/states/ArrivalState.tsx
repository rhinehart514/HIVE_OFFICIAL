'use client';

/**
 * ArrivalState - Celebration Step
 *
 * Final state in the /enter flow
 * Shows success animation, then redirects to /spaces/browse
 *
 * GOLD BUDGET: Checkmark + particles are allowed (celebration)
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CircularProgress } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { GoldCheckmark } from '../motion/GoldCheckmark';
import { ParticleField } from '../motion/ParticleField';
import {
  stateVariants,
  childVariants,
  EASE_PREMIUM,
  DURATION,
} from '../motion/entry-motion';

export interface ArrivalStateProps {
  /** User's first name */
  firstName: string;
  /** User's handle (without @) */
  handle: string;
  /** Whether this is a new user (show handle) or returning */
  isNewUser: boolean;
  /** Callback when celebration completes (triggers redirect) */
  onComplete: () => void;
  /** Auto-redirect delay in seconds */
  redirectDelay?: number;
}

const REDIRECT_DELAY_MS = 2000; // 2 seconds

export function ArrivalState({
  firstName,
  handle,
  isNewUser,
  onComplete,
  redirectDelay = 2,
}: ArrivalStateProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showCheckmark, setShowCheckmark] = React.useState(false);
  const [showParticles, setShowParticles] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // Start checkmark animation on mount
  React.useEffect(() => {
    const timer = setTimeout(() => setShowCheckmark(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle checkmark completion -> particles
  const handleCheckmarkComplete = React.useCallback(() => {
    setShowParticles(true);
  }, []);

  // Auto-redirect countdown
  React.useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + REDIRECT_DELAY_MS;

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const newProgress = Math.min((elapsed / REDIRECT_DELAY_MS) * 100, 100);
      setProgress(newProgress);

      if (now >= endTime) {
        onComplete();
      } else {
        requestAnimationFrame(updateProgress);
      }
    };

    const animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [onComplete]);

  return (
    <motion.div
      variants={stateVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center text-center relative"
    >
      {/* Particle field background */}
      <ParticleField
        trigger={showParticles}
        particleCount={24}
        radius={150}
        duration={1.5}
      />

      {/* Checkmark */}
      <motion.div variants={childVariants} className="mb-8">
        <GoldCheckmark
          show={showCheckmark}
          size="xl"
          delay={0}
          showRing={true}
          onAnimationComplete={handleCheckmarkComplete}
        />
      </motion.div>

      {/* Message */}
      <motion.div variants={childVariants} className="mb-8">
        <motion.h1
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: DURATION.gentle,
            delay: 0.5,
            ease: EASE_PREMIUM,
          }}
          className="text-[32px] font-semibold tracking-tight text-white"
        >
          You're in{firstName ? `, ${firstName}` : ''}.
        </motion.h1>

        {isNewUser && handle && (
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: DURATION.smooth,
              delay: 0.7,
              ease: EASE_PREMIUM,
            }}
            className="text-[15px] mt-2 text-white/50"
          >
            @{handle}
          </motion.p>
        )}

        {!isNewUser && (
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: DURATION.smooth,
              delay: 0.7,
              ease: EASE_PREMIUM,
            }}
            className="text-[15px] mt-2 text-white/50"
          >
            Welcome back.
          </motion.p>
        )}

        {/* Destination hint */}
        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: DURATION.smooth,
            delay: 0.9,
            ease: EASE_PREMIUM,
          }}
          className="text-[13px] mt-4 text-white/30"
        >
          {isNewUser ? 'Discover your spaces →' : 'Back to your spaces →'}
        </motion.p>
      </motion.div>

      {/* Redirect indicator */}
      <motion.div
        variants={childVariants}
        className="flex items-center gap-3"
      >
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: DURATION.smooth,
            delay: 1.1,
            ease: EASE_PREMIUM,
          }}
        >
          <CircularProgress
            value={progress}
            size={20}
            variant="gold"
            showLabel={false}
          />
        </motion.div>

        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: DURATION.smooth,
            delay: 1,
            ease: EASE_PREMIUM,
          }}
          className="text-sm text-white/40"
        >
          Loading spaces
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

ArrivalState.displayName = 'ArrivalState';

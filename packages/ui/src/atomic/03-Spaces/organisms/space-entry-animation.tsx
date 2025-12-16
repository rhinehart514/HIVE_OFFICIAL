'use client';

/**
 * SpaceEntryAnimation - Signature moment when entering a space
 *
 * Design Direction:
 * - Space name fills screen (1s)
 * - Hold for dramatic effect (800ms)
 * - Fade to conversation (400ms)
 * - You ARRIVE. Not just navigate.
 *
 * The interface should feel like 11pm on campus - dark because it's night,
 * alive because people are everywhere.
 *
 * @author HIVE Frontend Team
 * @version 2.0.0 - Dark-first design
 */

import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';

import { cn } from '../../../lib/utils';
import { PresenceDot } from '../../../identity/presence';

// ============================================================
// Types
// ============================================================

export interface SpaceEntryAnimationProps {
  /** Space name to display */
  spaceName: string;
  /** Space category (e.g., "Design Club", "Academic") */
  spaceCategory?: string;
  /** Number of members currently online */
  onlineCount?: number;
  /** Whether the animation is active */
  isActive: boolean;
  /** Called when animation completes */
  onComplete?: () => void;
  /** Children to reveal after animation */
  children?: React.ReactNode;
  /** Skip animation (for reduced motion) */
  skipAnimation?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================
// Animation Timings (from design direction)
// ============================================================

const TIMINGS = {
  /** Name fade in duration */
  fadeIn: 0.3,
  /** Name scale/settle duration */
  settle: 0.5,
  /** Hold duration before fade out */
  hold: 0.8,
  /** Fade out duration */
  fadeOut: 0.4,
};

// ============================================================
// Component
// ============================================================

export function SpaceEntryAnimation({
  spaceName,
  spaceCategory,
  onlineCount,
  isActive,
  onComplete,
  children,
  skipAnimation = false,
  className,
}: SpaceEntryAnimationProps) {
  const [phase, setPhase] = React.useState<'enter' | 'hold' | 'exit' | 'done'>(
    skipAnimation ? 'done' : 'enter'
  );

  // Handle animation phases
  React.useEffect(() => {
    if (!isActive || skipAnimation) {
      setPhase('done');
      return;
    }

    setPhase('enter');

    // Enter → Hold
    const enterTimer = setTimeout(() => {
      setPhase('hold');
    }, (TIMINGS.fadeIn + TIMINGS.settle) * 1000);

    // Hold → Exit
    const holdTimer = setTimeout(() => {
      setPhase('exit');
    }, (TIMINGS.fadeIn + TIMINGS.settle + TIMINGS.hold) * 1000);

    // Exit → Done
    const exitTimer = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, (TIMINGS.fadeIn + TIMINGS.settle + TIMINGS.hold + TIMINGS.fadeOut) * 1000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
    };
  }, [isActive, skipAnimation, onComplete]);

  const showOverlay = phase !== 'done';

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Animated Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TIMINGS.fadeOut }}
            className={cn(
              'absolute inset-0 z-50',
              'flex flex-col items-center justify-center',
              'bg-[#0A0A0A]'
            )}
          >
            {/* Ambient glow effect */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: phase === 'enter' ? 0.3 : phase === 'hold' ? 0.4 : 0,
                  scale: phase === 'enter' ? 1 : phase === 'hold' ? 1.1 : 1.2,
                }}
                transition={{ duration: 0.8 }}
                className={cn(
                  'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                  'w-[600px] h-[600px] rounded-full',
                  'bg-gradient-radial from-[#FFD700]/20 via-[#FFD700]/5 to-transparent',
                  'blur-3xl'
                )}
              />
            </div>

            {/* Space name */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{
                opacity: phase === 'exit' ? 0 : 1,
                scale: phase === 'enter' ? 1 : phase === 'hold' ? 1.02 : 0.95,
                y: phase === 'enter' ? 0 : phase === 'hold' ? -5 : -20,
              }}
              transition={{
                duration: phase === 'enter' ? TIMINGS.settle : TIMINGS.fadeOut,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className={cn(
                'relative z-10 text-center px-8',
                'text-5xl md:text-6xl lg:text-7xl font-bold',
                'text-[#FAFAFA] tracking-tight'
              )}
            >
              {spaceName}
            </motion.h1>

            {/* Category */}
            {spaceCategory && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: phase === 'exit' ? 0 : phase === 'enter' ? 0 : 0.6,
                  y: phase === 'exit' ? -10 : 0,
                }}
                transition={{
                  duration: 0.3,
                  delay: phase === 'hold' ? 0.1 : 0,
                }}
                className="relative z-10 mt-4 text-lg text-[#818187] font-medium"
              >
                {spaceCategory}
              </motion.p>
            )}

            {/* Online count indicator */}
            {onlineCount !== undefined && onlineCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: phase === 'exit' ? 0 : phase === 'enter' ? 0 : 1,
                  y: phase === 'exit' ? -10 : 0,
                }}
                transition={{
                  duration: 0.3,
                  delay: phase === 'hold' ? 0.2 : 0,
                }}
                className="relative z-10 flex items-center gap-2 mt-6"
              >
                <PresenceDot status="online" size="sm" />
                <span className="text-sm text-[#A1A1A6]">
                  {onlineCount} {onlineCount === 1 ? 'member' : 'members'} here
                </span>
              </motion.div>
            )}

            {/* Subtle "entering" indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: phase === 'enter' ? 0.5 : 0,
              }}
              className="absolute bottom-12 text-sm text-[#52525B]"
            >
              Entering...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content (revealed after animation) */}
      <motion.div
        initial={{ opacity: skipAnimation ? 1 : 0 }}
        animate={{ opacity: phase === 'done' ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

export default SpaceEntryAnimation;

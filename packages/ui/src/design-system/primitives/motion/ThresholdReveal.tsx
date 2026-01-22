'use client';

/**
 * ThresholdReveal — Dramatic pause → reveal pattern
 *
 * DRAMA.md: "400-800ms anticipation pauses before reveals"
 * Creates tension before showing content.
 *
 * Flow:
 * 1. Show "preparing" state with subtle animation
 * 2. Pause for anticipation (400-800ms)
 * 3. Reveal content with premium motion
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MOTION } from '../../../tokens/motion';
import { cn } from '../../../lib/utils';

export interface ThresholdRevealProps {
  /** Content to reveal after threshold */
  children: React.ReactNode;
  /** Whether to start the reveal sequence */
  isReady?: boolean;
  /** Message during preparation phase */
  preparingMessage?: string;
  /** Anticipation pause duration in ms (default: 600) */
  pauseDuration?: number;
  /** Additional className for container */
  className?: string;
  /** Called when preparation phase starts */
  onPreparing?: () => void;
  /** Called when content is revealed */
  onReveal?: () => void;
}

type Phase = 'idle' | 'preparing' | 'revealing' | 'complete';

export function ThresholdReveal({
  children,
  isReady = false,
  preparingMessage = 'Preparing...',
  pauseDuration = 600,
  className,
  onPreparing,
  onReveal,
}: ThresholdRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = React.useState<Phase>('idle');

  React.useEffect(() => {
    if (!isReady) {
      setPhase('idle');
      return;
    }

    // Phase 1: Preparing
    setPhase('preparing');
    onPreparing?.();

    // Phase 2: Pause for anticipation
    const revealTimer = setTimeout(() => {
      setPhase('revealing');
      onReveal?.();
    }, pauseDuration);

    // Phase 3: Mark complete after reveal animation
    const completeTimer = setTimeout(() => {
      setPhase('complete');
    }, pauseDuration + (MOTION.duration.slow * 1000));

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, [isReady, pauseDuration, onPreparing, onReveal]);

  if (shouldReduceMotion && isReady) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {/* Preparing phase */}
        {phase === 'preparing' && (
          <motion.div
            key="preparing"
            className="flex flex-col items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
          >
            {/* Pulsing indicator */}
            <motion.div
              className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center mb-6"
              animate={{
                scale: [1, 1.05, 1],
                borderColor: [
                  'rgba(255,255,255,0.2)',
                  'rgba(255,215,0,0.3)',
                  'rgba(255,255,255,0.2)',
                ],
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
            <p className="text-[16px] text-white/50">{preparingMessage}</p>
          </motion.div>
        )}

        {/* Revealing/Complete phase */}
        {(phase === 'revealing' || phase === 'complete') && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: MOTION.duration.slow,
              ease: MOTION.ease.premium,
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

ThresholdReveal.displayName = 'ThresholdReveal';

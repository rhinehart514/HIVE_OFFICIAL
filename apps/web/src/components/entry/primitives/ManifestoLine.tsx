'use client';

/**
 * ManifestoLine - Word-by-word Reveal
 *
 * Animates text word by word with premium timing.
 * Used for dramatic copy in the narrative entry flow.
 *
 * Timing:
 * - Word stagger: 0.08s each
 * - Total duration: depends on word count
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EASE_PREMIUM, DURATION } from '../motion/entry-motion';

interface ManifestoLineProps {
  /** The text to reveal word by word */
  children: string;
  /** Additional class names */
  className?: string;
  /** Delay before starting the animation (seconds) */
  delay?: number;
  /** Stagger delay between words (seconds) */
  stagger?: number;
  /** Duration per word (seconds) */
  duration?: number;
  /** Whether animation is triggered */
  animate?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
}

const wordVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
};

export function ManifestoLine({
  children,
  className,
  delay = 0,
  stagger = 0.08,
  duration = DURATION.gentle,
  animate = true,
  onComplete,
}: ManifestoLineProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = children.split(' ');
  const totalDuration = delay + words.length * stagger + duration;

  // Trigger onComplete after animation
  React.useEffect(() => {
    if (!animate || !onComplete) return;

    const timer = setTimeout(() => {
      onComplete();
    }, totalDuration * 1000);

    return () => clearTimeout(timer);
  }, [animate, onComplete, totalDuration]);

  if (shouldReduceMotion) {
    return (
      <span className={className}>
        {children}
      </span>
    );
  }

  return (
    <span className={cn('inline', className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block mr-[0.25em] last:mr-0"
          variants={wordVariants}
          initial="initial"
          animate={animate ? 'animate' : 'initial'}
          transition={{
            duration,
            delay: delay + i * stagger,
            ease: EASE_PREMIUM,
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

ManifestoLine.displayName = 'ManifestoLine';

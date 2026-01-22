'use client';

/**
 * WordReveal — Word-by-word text animation
 *
 * DRAMA.md: "Headlines earn visibility word by word"
 * Used for peak moments like "It's yours." and "Your territory is ready."
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION } from '../../../tokens/motion';
import { cn } from '../../../lib/utils';

export interface WordRevealProps {
  /** Text to reveal word by word */
  text: string;
  /** Additional className */
  className?: string;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Stagger delay between words (default: MOTION.stagger.words) */
  stagger?: number;
  /** Duration per word (default: MOTION.duration.fast) */
  duration?: number;
  /** Text color variant */
  variant?: 'default' | 'gold' | 'muted';
  /** Called when all words have revealed */
  onComplete?: () => void;
  /** Element type */
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

const variantStyles = {
  default: 'text-white',
  gold: 'text-[#FFD700]',
  muted: 'text-white/50',
};

export function WordReveal({
  text,
  className,
  delay = 0,
  stagger = MOTION.stagger.words,
  duration = MOTION.duration.fast,
  variant = 'default',
  onComplete,
  as: Component = 'span',
}: WordRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(' ');
  const totalDuration = delay + (words.length * stagger) + duration;

  React.useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, totalDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [onComplete, totalDuration]);

  if (shouldReduceMotion) {
    return (
      <Component className={cn(variantStyles[variant], className)}>
        {text}
      </Component>
    );
  }

  return (
    <Component className={cn(variantStyles[variant], className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration,
            delay: delay + (i * stagger),
            ease: MOTION.ease.premium,
          }}
        >
          {word}
        </motion.span>
      ))}
    </Component>
  );
}

WordReveal.displayName = 'WordReveal';

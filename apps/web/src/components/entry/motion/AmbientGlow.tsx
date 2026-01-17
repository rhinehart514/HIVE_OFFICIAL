'use client';

/**
 * AmbientGlow - Entry Flow Background Effect
 *
 * Subtle animated background glow that shifts with emotional state
 * - neutral: subtle white warmth
 * - anticipation: hint of gold (during code entry)
 * - celebration: full gold glow (arrival)
 */

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  type EmotionalState,
  glowVariants,
  glowTransition,
  EASE_PREMIUM,
  DURATION,
} from './entry-motion';

export interface AmbientGlowProps {
  /** Current emotional state of the entry flow */
  state: EmotionalState;
  /** Height of the glow area */
  height?: string;
  /** Additional class names */
  className?: string;
}

export function AmbientGlow({
  state,
  height = '40vh',
  className,
}: AmbientGlowProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        'absolute bottom-0 left-0 right-0 pointer-events-none z-0',
        className
      )}
      style={{ height }}
      variants={glowVariants}
      initial={state}
      animate={state}
      transition={shouldReduceMotion ? { duration: 0 } : glowTransition}
    >
      {/* Additional pulse for celebration */}
      {state === 'celebration' && !shouldReduceMotion && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: DURATION.breathe,
            ease: EASE_PREMIUM,
            repeat: Infinity,
          }}
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255,215,0,0.12), transparent)',
          }}
        />
      )}
    </motion.div>
  );
}

AmbientGlow.displayName = 'AmbientGlow';

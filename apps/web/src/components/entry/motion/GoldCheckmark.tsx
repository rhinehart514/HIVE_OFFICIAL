'use client';

/**
 * GoldCheckmark - Entry Flow Success Indicator
 *
 * Wraps the SuccessCheckmark primitive with entry-specific
 * animations and celebration effects.
 *
 * GOLD BUDGET: This is an allowed gold use (arrival celebration)
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SuccessCheckmark } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { SPRING_BOUNCY, GOLD, DURATION, EASE_PREMIUM } from './entry-motion';

export interface GoldCheckmarkProps {
  /** Whether to show/animate the checkmark */
  show: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Animation delay */
  delay?: number;
  /** Show glow ring effect */
  showRing?: boolean;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  /** Additional class names */
  className?: string;
}

export function GoldCheckmark({
  show,
  size = 'xl',
  delay = 0,
  showRing = true,
  onAnimationComplete,
  className,
}: GoldCheckmarkProps) {
  const shouldReduceMotion = useReducedMotion();
  const [ringAnimated, setRingAnimated] = React.useState(false);

  // Trigger ring animation after checkmark completes
  const handleCheckmarkComplete = React.useCallback(() => {
    setRingAnimated(true);
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  if (!show) {
    return null;
  }

  return (
    <motion.div
      className={cn('relative inline-flex items-center justify-center', className)}
      initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              ...SPRING_BOUNCY,
              delay,
            }
      }
    >
      {/* Background glow pulse */}
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: [0.5, 1.5, 1.2],
            opacity: [0, 0.4, 0.2],
          }}
          transition={{
            duration: DURATION.dramatic,
            delay: delay + 0.1,
            ease: EASE_PREMIUM,
          }}
          style={{
            background: `radial-gradient(circle, ${GOLD.glow} 0%, transparent 70%)`,
            filter: 'blur(12px)',
          }}
        />
      )}

      {/* Main checkmark */}
      <SuccessCheckmark
        size={size}
        animate={!shouldReduceMotion}
        delay={delay}
        showGlow={true}
        onAnimationComplete={handleCheckmarkComplete}
      />

      {/* Expanding ring effect */}
      {showRing && ringAnimated && !shouldReduceMotion && (
        <>
          <motion.div
            className="absolute rounded-full border-2"
            style={{
              width: '100%',
              height: '100%',
              borderColor: GOLD.primary,
            }}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{
              scale: 1.8,
              opacity: 0,
            }}
            transition={{
              duration: DURATION.slow,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className="absolute rounded-full border"
            style={{
              width: '100%',
              height: '100%',
              borderColor: GOLD.light,
            }}
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{
              scale: 2.2,
              opacity: 0,
            }}
            transition={{
              duration: DURATION.dramatic,
              delay: 0.1,
              ease: 'easeOut',
            }}
          />
        </>
      )}
    </motion.div>
  );
}

GoldCheckmark.displayName = 'GoldCheckmark';

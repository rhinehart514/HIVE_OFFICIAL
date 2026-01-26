'use client';

/**
 * SuccessCheckmark Primitive - LOCKED 2026-01-14
 *
 * Animated gold checkmark for success/achievement states
 * Uses SVG path drawing animation with scale spring and glow pulse
 *
 * GOLD BUDGET: This is an allowed gold use (achievement/success indicator)
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { EASE_PREMIUM } from '../layout-tokens';

export interface SuccessCheckmarkProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to animate on mount */
  animate?: boolean;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Show gold glow effect */
  showGlow?: boolean;
  /** Additional class names */
  className?: string;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

// LOCKED: Size configurations
const sizeConfig = {
  sm: { size: 24, strokeWidth: 2 },
  md: { size: 48, strokeWidth: 2.5 },
  lg: { size: 72, strokeWidth: 3 },
  xl: { size: 96, strokeWidth: 3 },
};

// LOCKED: Gold color palette
const GOLD = {
  primary: '#FFD700',
  light: '#FFDF33',
  dark: '#B8860B',
  glow: 'rgba(255, 215, 0, 0.4)',
  glowSubtle: 'rgba(255, 215, 0, 0.15)',
};

function SuccessCheckmark({
  size = 'md',
  animate = true,
  delay = 0,
  showGlow = true,
  className,
  onAnimationComplete,
}: SuccessCheckmarkProps) {
  const shouldReduceMotion = useReducedMotion();
  const config = sizeConfig[size];
  const [hasAnimated, setHasAnimated] = React.useState(false);

  // SVG viewBox is 24x24, scale path accordingly
  const viewBoxSize = 24;

  // Checkmark path (optimized for smooth drawing)
  const checkPath = 'M5 12.5l5 5L19 7';

  // Circle path for optional background
  const circleRadius = 10;

  const handleAnimationComplete = React.useCallback(() => {
    setHasAnimated(true);
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  // Skip animations if reduced motion preferred
  const shouldAnimate = animate && !shouldReduceMotion;

  return (
    <motion.div
      className={cn('relative inline-flex items-center justify-center', className)}
      initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : { scale: 1, opacity: 1 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={
        shouldAnimate
          ? {
              scale: { type: 'spring', stiffness: 400, damping: 20, delay },
              opacity: { duration: 0.2, delay },
            }
          : { duration: 0 }
      }
    >
      {/* Glow effect */}
      {showGlow && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
          animate={{
            opacity: [0, 1, 0.6],
            scale: [0.8, 1.2, 1],
          }}
          transition={
            shouldAnimate
              ? {
                  duration: 0.8,
                  delay: delay + 0.2,
                  ease: EASE_PREMIUM,
                }
              : { duration: 0 }
          }
          style={{
            width: config.size,
            height: config.size,
            background: `radial-gradient(circle, ${GOLD.glow} 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />
      )}

      {/* Main SVG */}
      <svg
        width={config.size}
        height={config.size}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        fill="none"
        className="relative z-10"
      >
        {/* Background circle */}
        <motion.circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={circleRadius}
          fill="none"
          stroke={GOLD.glowSubtle}
          strokeWidth={config.strokeWidth / 2}
          initial={shouldAnimate ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={
            shouldAnimate
              ? {
                  pathLength: { duration: 0.4, delay, ease: EASE_PREMIUM },
                  opacity: { duration: 0.2, delay },
                }
              : { duration: 0 }
          }
        />

        {/* Checkmark path with gradient */}
        <defs>
          <linearGradient id={`gold-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={GOLD.light} />
            <stop offset="50%" stopColor={GOLD.primary} />
            <stop offset="100%" stopColor={GOLD.dark} />
          </linearGradient>
          <filter id={`gold-glow-${size}`}>
            <feGaussianBlur stdDeviation="1" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shadow/glow layer */}
        <motion.path
          d={checkPath}
          fill="none"
          stroke={GOLD.glow}
          strokeWidth={config.strokeWidth * 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#gold-glow-${size})`}
          initial={shouldAnimate ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 0.5 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={
            shouldAnimate
              ? {
                  pathLength: { duration: 0.4, delay: delay + 0.1, ease: EASE_PREMIUM },
                  opacity: { duration: 0.2, delay: delay + 0.1 },
                }
              : { duration: 0 }
          }
        />

        {/* Main checkmark */}
        <motion.path
          d={checkPath}
          fill="none"
          stroke={`url(#gold-gradient-${size})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={shouldAnimate ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={
            shouldAnimate
              ? {
                  duration: 0.4,
                  delay: delay + 0.1,
                  ease: EASE_PREMIUM,
                }
              : { duration: 0 }
          }
          onAnimationComplete={handleAnimationComplete}
        />
      </svg>

      {/* Pulse ring on completion */}
      {showGlow && shouldAnimate && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{
            width: config.size,
            height: config.size,
            borderColor: GOLD.primary,
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={
            hasAnimated
              ? {
                  scale: [1, 1.4],
                  opacity: [0.6, 0],
                }
              : {}
          }
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.div>
  );
}

SuccessCheckmark.displayName = 'SuccessCheckmark';

export { SuccessCheckmark, GOLD as CHECKMARK_GOLD };

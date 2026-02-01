'use client';

/**
 * GoldFlash - Celebration Overlay
 *
 * Full-screen gold flash for celebration moments:
 * - Code verified (0.2s)
 * - Handle available
 * - Final "Enter HIVE" (0.3s)
 *
 * Triggered at earned moments in the narrative.
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { GOLD } from '../motion/entry-motion';

interface GoldFlashProps {
  /** Whether to show the flash */
  show: boolean;
  /** Flash duration in seconds (default: 0.3s) */
  duration?: number;
  /** Flash intensity 0-1 (default: 0.6) */
  intensity?: number;
  /** Callback when flash completes */
  onComplete?: () => void;
}

export function GoldFlash({
  show,
  duration = 0.3,
  intensity = 0.6,
  onComplete,
}: GoldFlashProps) {
  const shouldReduceMotion = useReducedMotion();

  // Trigger onComplete after animation
  React.useEffect(() => {
    if (!show || !onComplete) return;

    const timer = setTimeout(() => {
      onComplete();
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [show, duration, onComplete]);

  // Skip animation for reduced motion
  if (shouldReduceMotion) {
    return null;
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, intensity, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration,
            ease: 'easeOut',
          }}
          style={{
            backgroundColor: GOLD.primary,
          }}
        />
      )}
    </AnimatePresence>
  );
}

/**
 * Subtle gold flash for inline celebrations (handle available, etc.)
 */
interface GoldPulseProps {
  /** Whether to show the pulse */
  show: boolean;
  /** Class name for positioning */
  className?: string;
  /** Duration in seconds */
  duration?: number;
}

export function GoldPulse({
  show,
  className,
  duration = 0.6,
}: GoldPulseProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return null;
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={className}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0, 0.4, 0],
            scale: [0.8, 1.2, 1.4],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: 'inherit',
            background: `radial-gradient(circle, ${GOLD.glow} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )}
    </AnimatePresence>
  );
}

GoldFlash.displayName = 'GoldFlash';
GoldPulse.displayName = 'GoldPulse';

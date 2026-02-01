'use client';

/**
 * WarmthGlow - Activity-based card glow
 *
 * Features:
 * - Hot (20+ messages): Gold glow, pulse animation
 * - Warm (5-19): Subtle gold glow
 * - Cool (1-4): Faint white glow
 * - Dormant (0): No glow
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  motion,
} from '@hive/ui/design-system/primitives';
import {
  SPACES_MOTION,
  SPACES_GOLD,
  type WarmthLevel,
} from '@hive/ui/tokens';

// ============================================================
// Types
// ============================================================

interface WarmthGlowProps {
  /** Warmth level (hot/warm/cool/dormant) */
  level: WarmthLevel;
  /** Whether the parent is hovered */
  isHovered?: boolean;
  /** Optional className */
  className?: string;
}

// ============================================================
// Warmth Color Map
// ============================================================

const WARMTH_COLORS: Record<WarmthLevel, string> = {
  hot: SPACES_GOLD.glow,
  warm: SPACES_GOLD.glowSubtle,
  cool: 'rgba(255, 255, 255, 0.15)',
  dormant: 'transparent',
};

// ============================================================
// Main Component
// ============================================================

export function WarmthGlow({
  level,
  isHovered = false,
  className,
}: WarmthGlowProps) {
  const shouldReduceMotion = useReducedMotion();
  const config = SPACES_MOTION.warmth[level];

  if (config.glow === 0) return null;

  const baseOpacity = config.glow;
  const hoverOpacity = config.glow * SPACES_MOTION.card.hoverGlowMultiplier;
  const shouldPulse = config.pulse && !shouldReduceMotion;

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none rounded-inherit ${className || ''}`}
      initial={{ opacity: 0 }}
      animate={{
        opacity: isHovered ? hoverOpacity : baseOpacity,
        scale: shouldPulse ? [1, 1.02, 1] : 1,
      }}
      transition={{
        opacity: { duration: SPACES_MOTION.card.duration },
        scale: shouldPulse ? {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        } : undefined,
      }}
      style={{
        background: `radial-gradient(ellipse at center, ${WARMTH_COLORS[level]}, transparent 70%)`,
      }}
    />
  );
}

// ============================================================
// Ambient Glow (for containers)
// ============================================================

interface AmbientGlowProps {
  /** Intensity 0-1 */
  intensity: number;
  /** Color variant */
  variant?: 'gold' | 'white';
  /** Position of glow origin */
  position?: 'top' | 'center' | 'bottom';
  /** Optional className */
  className?: string;
}

export function AmbientGlow({
  intensity,
  variant = 'gold',
  position = 'top',
  className,
}: AmbientGlowProps) {
  const shouldReduceMotion = useReducedMotion();

  if (intensity === 0) return null;

  const color = variant === 'gold'
    ? `rgba(255, 215, 0, ${intensity * 0.15})`
    : `rgba(255, 255, 255, ${intensity * 0.08})`;

  const positionMap = {
    top: '50% 0%',
    center: '50% 50%',
    bottom: '50% 100%',
  };

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none ${className || ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0 : SPACES_MOTION.page.glowPulse,
      }}
      style={{
        background: `radial-gradient(ellipse 80% 60% at ${positionMap[position]}, ${color}, transparent)`,
      }}
    />
  );
}

// ============================================================
// Card Border Glow (hover effect)
// ============================================================

interface BorderGlowProps {
  /** Whether glow is active */
  active: boolean;
  /** Color variant */
  variant?: 'gold' | 'white';
  /** Optional className */
  className?: string;
}

export function BorderGlow({
  active,
  variant = 'white',
  className,
}: BorderGlowProps) {
  const color = variant === 'gold'
    ? SPACES_GOLD.glowSubtle
    : 'rgba(255, 255, 255, 0.1)';

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none rounded-inherit ${className || ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: SPACES_MOTION.card.duration }}
      style={{
        boxShadow: `0 0 20px ${color}, inset 0 0 1px ${color}`,
      }}
    />
  );
}

WarmthGlow.displayName = 'WarmthGlow';
AmbientGlow.displayName = 'AmbientGlow';
BorderGlow.displayName = 'BorderGlow';

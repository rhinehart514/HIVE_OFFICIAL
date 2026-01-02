'use client';

/**
 * AmbientGlow - Warmth-based glow effect for space cards
 *
 * Phase 3: Visual Warmth
 * Spaces feel warmer as they get more active. This creates
 * life without breaking monochrome discipline.
 *
 * Usage:
 * <AmbientGlow warmth="live" className="absolute inset-0" />
 */

import { motion } from 'framer-motion';
import * as React from 'react';
import { warmthSpectrum, type WarmthLevel, getWarmthLevel } from '@hive/tokens';

import { cn } from '../../../lib/utils';

export interface AmbientGlowProps {
  /** Warmth level - determines glow intensity */
  warmth: WarmthLevel;
  /** Additional className */
  className?: string;
  /** Whether to animate the glow (subtle pulse for live) */
  animated?: boolean;
}

/**
 * AmbientGlow - Adds warmth-based ambient glow to containers
 *
 * Warmth spectrum:
 * - empty: No glow, pure cool neutral
 * - quiet: No glow, barely perceptible warm shift
 * - active: Subtle amber glow
 * - live: Gold presence glow with pulse
 */
export const AmbientGlow: React.FC<AmbientGlowProps> = ({
  warmth,
  className,
  animated = true,
}) => {
  const state = warmthSpectrum[warmth];

  // No glow for empty/quiet states
  if (state.glow === 'none') {
    return null;
  }

  const isLive = warmth === 'live';

  return (
    <motion.div
      className={cn(
        'pointer-events-none rounded-xl',
        className
      )}
      style={{
        boxShadow: state.glow,
      }}
      animate={animated && isLive ? {
        opacity: [0.6, 1, 0.6],
      } : undefined}
      transition={animated && isLive ? {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      } : undefined}
    />
  );
};

AmbientGlow.displayName = 'AmbientGlow';

// ============================================
// WARMTH BACKGROUND
// ============================================

export interface WarmthBackgroundProps {
  /** Member count for warmth calculation */
  memberCount: number;
  /** Active users now (weights heavily) */
  activeNow?: number;
  /** Additional className */
  className?: string;
  /** Whether to show border */
  showBorder?: boolean;
  /** Whether to show glow */
  showGlow?: boolean;
  /** Children to render */
  children?: React.ReactNode;
}

/**
 * WarmthBackground - Container with warmth-based styling
 *
 * Automatically calculates warmth level from member count
 * and applies appropriate background, border, and glow.
 */
export const WarmthBackground: React.FC<WarmthBackgroundProps> = ({
  memberCount,
  activeNow = 0,
  className,
  showBorder = true,
  showGlow = true,
  children,
}) => {
  const warmthLevel = getWarmthLevel(memberCount, activeNow);
  const state = warmthSpectrum[warmthLevel];

  return (
    <div
      className={cn(
        'relative rounded-xl transition-all duration-300',
        className
      )}
      style={{
        backgroundColor: state.bg,
        border: showBorder ? `1px solid ${state.border}` : undefined,
      }}
    >
      {/* Ambient glow */}
      {showGlow && (
        <AmbientGlow
          warmth={warmthLevel}
          className="absolute inset-0"
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

WarmthBackground.displayName = 'WarmthBackground';

// ============================================
// SPACE WARMTH INDICATOR
// ============================================

export interface SpaceWarmthIndicatorProps {
  /** Member count */
  memberCount: number;
  /** Active users now */
  activeNow?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const warmthSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

/**
 * SpaceWarmthIndicator - Small dot showing space activity warmth
 *
 * Shows the warmth level as a colored dot:
 * - empty: gray
 * - quiet: slightly warm gray
 * - active: amber
 * - live: gold with pulse
 */
export const SpaceWarmthIndicator: React.FC<SpaceWarmthIndicatorProps> = ({
  memberCount,
  activeNow = 0,
  size = 'md',
  className,
}) => {
  const warmthLevel = getWarmthLevel(memberCount, activeNow);
  const isLive = warmthLevel === 'live';
  const isActive = warmthLevel === 'active';

  // Color based on warmth
  const dotColor = isLive
    ? '#FFD700'
    : isActive
      ? 'rgba(255, 215, 0, 0.6)'
      : warmthLevel === 'quiet'
        ? 'rgba(255, 255, 255, 0.3)'
        : 'rgba(255, 255, 255, 0.15)';

  return (
    <motion.div
      className={cn(
        'rounded-full',
        warmthSizes[size],
        className
      )}
      style={{
        backgroundColor: dotColor,
      }}
      animate={isLive ? {
        scale: [1, 1.2, 1],
        opacity: [1, 0.8, 1],
      } : undefined}
      transition={isLive ? {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      } : undefined}
    />
  );
};

SpaceWarmthIndicator.displayName = 'SpaceWarmthIndicator';

export default AmbientGlow;

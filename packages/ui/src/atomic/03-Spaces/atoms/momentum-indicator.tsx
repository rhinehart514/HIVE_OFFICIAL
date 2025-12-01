'use client';

/**
 * MomentumIndicator - Activity level visual strip
 *
 * Design Token Compliance:
 * - Colors: gold-500 (brand), status-success (#00D46A), neutral-600 (gray)
 * - Animation: Pulse for 'live' state with success glow
 *
 * Usage: Left border strip on space cards showing activity level
 * - high/trending: Gold - trending spaces
 * - live: Green with pulse - currently active
 * - quiet: Gray - low activity
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../../lib/utils';

const momentumVariants = cva(
  'w-1 rounded-full flex-shrink-0 transition-colors duration-200',
  {
    variants: {
      level: {
        high: 'bg-gold-500', // Gold - trending
        live: 'bg-status-success animate-pulse shadow-[0_0_8px_rgba(0,212,106,0.8)]', // Green with pulse + glow
        quiet: 'bg-neutral-600', // Gray - quiet
      },
      size: {
        sm: 'h-8',
        md: 'h-12',
        lg: 'h-16',
        full: 'h-full min-h-[60px]',
      },
    },
    defaultVariants: {
      level: 'quiet',
      size: 'full',
    },
  }
);

/** Activity momentum level type */
export type MomentumLevel = 'high' | 'live' | 'quiet';

export interface MomentumIndicatorProps
  extends VariantProps<typeof momentumVariants> {
  /** Activity level determines color */
  level?: MomentumLevel;
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Optional className */
  className?: string;
}

export function MomentumIndicator({
  level = 'quiet',
  size = 'full',
  className,
}: MomentumIndicatorProps) {
  const ariaLabel = {
    high: 'Trending - high activity',
    live: 'Live - active now',
    quiet: 'Quiet - low activity',
  }[level || 'quiet'];

  return (
    <div
      className={cn(momentumVariants({ level, size }), className)}
      role="img"
      aria-label={ariaLabel}
      data-momentum={level}
    />
  );
}

export default MomentumIndicator;

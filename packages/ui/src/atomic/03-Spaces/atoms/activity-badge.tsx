'use client';

/**
 * ActivityBadge - Activity level text indicator
 *
 * Design Token Compliance:
 * - Colors: Gold for high activity, emerald for live, neutral for quiet
 * - Typography: 11px uppercase tracking-wider
 *
 * Usage: Text badge showing "Very active" / "Active" / "Quiet"
 * Pairs with MomentumIndicator for visual consistency
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 text-[11px] font-medium',
  {
    variants: {
      level: {
        high: 'text-gold-500', // Gold
        live: 'text-status-success', // Emerald
        quiet: 'text-neutral-500', // Gray
      },
      showDot: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      level: 'quiet',
      showDot: true,
    },
  }
);

const dotVariants = cva('w-1.5 h-1.5 rounded-full', {
  variants: {
    level: {
      high: 'bg-gold-500',
      live: 'bg-status-success animate-pulse shadow-[0_0_6px_rgba(0,212,106,0.8)]',
      quiet: 'bg-neutral-600',
    },
  },
  defaultVariants: {
    level: 'quiet',
  },
});

const activityLabels = {
  high: 'Very active',
  live: 'Live now',
  quiet: 'Quiet',
};

export interface ActivityBadgeProps extends VariantProps<typeof badgeVariants> {
  /** Activity level */
  level?: 'high' | 'live' | 'quiet';
  /** Whether to show the dot indicator */
  showDot?: boolean;
  /** Custom label override */
  label?: string;
  /** Optional className */
  className?: string;
}

export function ActivityBadge({
  level = 'quiet',
  showDot = true,
  label,
  className,
}: ActivityBadgeProps) {
  const displayLabel = label || activityLabels[level || 'quiet'];

  return (
    <span
      className={cn(badgeVariants({ level, showDot }), className)}
      role="status"
      aria-label={`Activity: ${displayLabel}`}
    >
      {showDot && (
        <span
          className={dotVariants({ level })}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

export default ActivityBadge;

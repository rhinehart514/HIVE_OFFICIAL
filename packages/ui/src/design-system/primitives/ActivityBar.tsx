'use client';

/**
 * ActivityBar Primitive
 *
 * Visual indicator of space activity level using a segmented bar.
 * Displays activity percentage as filled segments (0-100%).
 *
 * Design Notes:
 * - 10 segments by default (can be customized)
 * - Gold fill for active segments (within gold budget - activity is "life")
 * - Muted fill for inactive segments
 * - Compact density for space cards
 *
 * CRITICAL: Gold is allowed here - activity bars are presence indicators (gold budget).
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// ============================================
// ACTIVITY CALCULATION
// ============================================

/**
 * Calculate activity percentage from various metrics
 * Can be extended to factor in multiple signals
 */
export function getActivityPercentage(
  onlineCount: number,
  memberCount: number,
  recentMessages?: number
): number {
  // Base: online ratio (0-50%)
  const onlineRatio = memberCount > 0 ? Math.min((onlineCount / memberCount) * 100, 50) : 0;

  // Boost: recent activity (0-30%)
  const activityBoost = recentMessages !== undefined
    ? Math.min((recentMessages / 10) * 30, 30)
    : 0;

  // Minimum presence (20% if anyone online)
  const presenceBonus = onlineCount > 0 ? 20 : 0;

  return Math.min(Math.round(onlineRatio + activityBoost + presenceBonus), 100);
}

/**
 * Get activity level label for accessibility
 */
export function getActivityLabel(percentage: number): string {
  if (percentage >= 80) return 'very active';
  if (percentage >= 60) return 'active';
  if (percentage >= 40) return 'moderate';
  if (percentage >= 20) return 'quiet';
  return 'inactive';
}

// ============================================
// CVA VARIANTS
// ============================================

const activityBarContainerVariants = cva(
  'inline-flex items-center',
  {
    variants: {
      size: {
        xs: 'gap-px h-1.5',
        sm: 'gap-0.5 h-2',
        md: 'gap-0.5 h-2.5',
        lg: 'gap-1 h-3',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

const activitySegmentVariants = cva(
  'rounded-sm transition-colors duration-[var(--duration-snap)]',
  {
    variants: {
      size: {
        xs: 'w-1',
        sm: 'w-1.5',
        md: 'w-2',
        lg: 'w-2.5',
      },
      filled: {
        true: 'bg-[var(--color-accent-gold)]/80',
        false: 'bg-white/10',
      },
    },
    defaultVariants: {
      size: 'sm',
      filled: false,
    },
  }
);

// ============================================
// COMPONENT TYPES
// ============================================

export interface ActivityBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof activityBarContainerVariants> {
  /** Activity percentage 0-100 */
  value: number;
  /** Number of segments (default 10) */
  segments?: number;
  /** Show percentage as text label */
  showLabel?: boolean;
  /** Animate the bar on value change */
  animate?: boolean;
}

// ============================================
// COMPONENT
// ============================================

const ActivityBar = React.forwardRef<HTMLDivElement, ActivityBarProps>(
  (
    {
      className,
      size = 'sm',
      value,
      segments = 10,
      showLabel = false,
      animate = false,
      ...props
    },
    ref
  ) => {
    // Clamp value between 0-100
    const clampedValue = Math.max(0, Math.min(100, value));

    // Calculate filled segments
    const filledCount = Math.round((clampedValue / 100) * segments);

    // Activity label for a11y
    const label = getActivityLabel(clampedValue);

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2',
          className
        )}
        role="meter"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Activity: ${label} (${clampedValue}%)`}
        {...props}
      >
        <div className={cn(activityBarContainerVariants({ size }))}>
          {Array.from({ length: segments }).map((_, index) => {
            const isFilled = index < filledCount;
            return (
              <div
                key={index}
                className={cn(
                  activitySegmentVariants({ size, filled: isFilled }),
                  'h-full',
                  // Stagger animation for fill effect
                  animate && isFilled && 'animate-in fade-in',
                  animate && isFilled && `animation-delay-${index * 50}`
                )}
                style={animate && isFilled ? { animationDelay: `${index * 30}ms` } : undefined}
              />
            );
          })}
        </div>
        {showLabel && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {clampedValue}%
          </span>
        )}
      </div>
    );
  }
);

ActivityBar.displayName = 'ActivityBar';

// ============================================
// COMPACT VARIANT (for inline use)
// ============================================

export interface ActivityBarCompactProps
  extends Omit<ActivityBarProps, 'showLabel'> {
  /** Online count to display before bar */
  onlineCount?: number;
  /** Member count suffix (e.g., "234m") */
  memberCount?: number;
}

const ActivityBarCompact = React.forwardRef<HTMLDivElement, ActivityBarCompactProps>(
  ({ onlineCount, memberCount, value, className, ...props }, ref) => {
    // Format member count compactly
    const formatCount = (n: number): string => {
      if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
      return n.toString();
    };

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center gap-2', className)}
      >
        {onlineCount !== undefined && (
          <span className="inline-flex items-center gap-1 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)]" />
            <span className="tabular-nums text-muted-foreground">{onlineCount}</span>
          </span>
        )}
        {memberCount !== undefined && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatCount(memberCount)}m
          </span>
        )}
        <ActivityBar value={value} size="xs" {...props} />
      </div>
    );
  }
);

ActivityBarCompact.displayName = 'ActivityBarCompact';

// ============================================
// EXPORTS
// ============================================

export {
  ActivityBar,
  ActivityBarCompact,
  activityBarContainerVariants,
  activitySegmentVariants,
};

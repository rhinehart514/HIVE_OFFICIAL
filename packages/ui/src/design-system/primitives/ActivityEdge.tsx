'use client';

/**
 * ActivityEdge Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Style: Inset gold border (doesn't expand bounds)
 * - Levels: Subtle 4-level progression (none/low/medium/high)
 * - Gold allowed: This IS activity/life indication
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import type { WarmthLevel } from '../AtmosphereProvider';

const activityEdgeVariants = cva(
  [
    'relative',
    'transition-shadow duration-[var(--duration-smooth)]',
  ].join(' '),
  {
    variants: {
      warmth: {
        // No activity - no edge
        none: '',
        // Low activity (1-2 users) - subtle gold edge
        low: 'shadow-[inset_0_0_0_1px_rgba(255,215,0,0.15)]',
        // Medium activity (3-10 users) - visible gold edge
        medium: 'shadow-[inset_0_0_0_2px_rgba(255,215,0,0.3)]',
        // High activity (10+ users) - prominent gold edge + subtle glow
        high: 'shadow-[inset_0_0_0_2px_rgba(255,215,0,0.5),0_0_12px_rgba(255,215,0,0.15)]',
      },
      rounded: {
        none: '',
        sm: 'rounded-md',
        default: 'rounded-lg',
        lg: 'rounded-xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      warmth: 'none',
      rounded: 'default',
    },
  }
);

export interface ActivityEdgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof activityEdgeVariants> {
  /** Activity level (maps to warmth) */
  activity?: WarmthLevel;
  /** Number of active users (auto-calculates warmth) */
  activeUsers?: number;
}

/**
 * Calculate warmth level from active user count
 */
function getWarmthFromActiveUsers(count: number): WarmthLevel {
  if (count === 0) return 'none';
  if (count <= 2) return 'low';
  if (count <= 10) return 'medium';
  return 'high';
}

const ActivityEdge = React.forwardRef<HTMLDivElement, ActivityEdgeProps>(
  (
    {
      className,
      warmth,
      rounded,
      activity,
      activeUsers,
      children,
      ...props
    },
    ref
  ) => {
    // Calculate warmth from props
    let effectiveWarmth = warmth;
    if (activity !== undefined) {
      effectiveWarmth = activity;
    } else if (activeUsers !== undefined) {
      effectiveWarmth = getWarmthFromActiveUsers(activeUsers);
    }

    return (
      <div
        ref={ref}
        className={cn(
          activityEdgeVariants({ warmth: effectiveWarmth, rounded }),
          className
        )}
        data-warmth={effectiveWarmth}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ActivityEdge.displayName = 'ActivityEdge';

export { ActivityEdge, activityEdgeVariants, getWarmthFromActiveUsers };

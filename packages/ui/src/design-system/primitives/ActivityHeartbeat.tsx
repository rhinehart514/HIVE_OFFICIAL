'use client';

/**
 * ActivityHeartbeat Primitive
 *
 * Animated strip showing space vitality. A visual "pulse" that indicates
 * how alive a space or community is right now.
 *
 * Activity Levels:
 * - live: Gold pulsing glow (active chat/users online now)
 * - recent: White subtle pulse (activity in last hour)
 * - quiet: Static dim white (no recent activity)
 *
 * CRITICAL: Gold is allowed here - activity is one of the gold budget uses.
 *
 * @version 1.0.0 - January 2026
 */

import * as React from 'react';
import { motion, useReducedMotion, type TargetAndTransition, type Transition } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// ============================================
// TYPES
// ============================================

export type ActivityLevel = 'live' | 'recent' | 'quiet';

// ============================================
// ACTIVITY DETECTION
// ============================================

/**
 * Determine activity level from a timestamp
 */
export function getActivityLevel(lastActivityAt: string | Date | null | undefined): ActivityLevel {
  if (!lastActivityAt) return 'quiet';

  const lastActive = typeof lastActivityAt === 'string'
    ? new Date(lastActivityAt)
    : lastActivityAt;
  const now = new Date();
  const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);

  if (diffMinutes < 5) return 'live';
  if (diffMinutes < 60) return 'recent';
  return 'quiet';
}

/**
 * Check if space is "live" (has active users or very recent activity)
 */
export function isSpaceLive(space: {
  onlineCount?: number;
  lastActivityAt?: string | Date | null;
}): boolean {
  if (space.onlineCount && space.onlineCount > 0) return true;
  return getActivityLevel(space.lastActivityAt) === 'live';
}

// ============================================
// MOTION CONFIG
// ============================================

const heartbeatAnimations: Record<ActivityLevel, TargetAndTransition> = {
  live: {
    opacity: [0.6, 1, 0.6],
    boxShadow: [
      '0 0 0px rgba(255,215,0,0)',
      '0 0 12px rgba(255,215,0,0.4)',
      '0 0 0px rgba(255,215,0,0)',
    ],
  },
  recent: {
    opacity: [0.3, 0.7, 0.3],
  },
  quiet: { opacity: 0.2 },
};

const heartbeatTransitions: Record<ActivityLevel, Transition> = {
  live: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  recent: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  quiet: {},
};

// ============================================
// CVA VARIANTS
// ============================================

const activityHeartbeatVariants = cva(
  'flex-shrink-0 transition-colors duration-[var(--duration-snap)]',
  {
    variants: {
      orientation: {
        vertical: 'w-[3px] h-full rounded-full',
        horizontal: 'h-[3px] w-full rounded-full',
      },
      size: {
        sm: '', // Uses default 3px
        md: '', // Uses 4px
        lg: '', // Uses 5px
      },
    },
    compoundVariants: [
      { orientation: 'vertical', size: 'sm', className: 'w-[2px]' },
      { orientation: 'vertical', size: 'md', className: 'w-[3px]' },
      { orientation: 'vertical', size: 'lg', className: 'w-[4px]' },
      { orientation: 'horizontal', size: 'sm', className: 'h-[2px]' },
      { orientation: 'horizontal', size: 'md', className: 'h-[3px]' },
      { orientation: 'horizontal', size: 'lg', className: 'h-[4px]' },
    ],
    defaultVariants: {
      orientation: 'vertical',
      size: 'md',
    },
  }
);

// ============================================
// COMPONENT TYPES
// ============================================

export interface ActivityHeartbeatProps
  extends VariantProps<typeof activityHeartbeatVariants> {
  /** Activity level: live, recent, or quiet */
  level: ActivityLevel;
  /** Whether to animate (respects reduced motion preference) */
  animate?: boolean;
  /** Custom live color (defaults to gold) */
  liveColor?: string;
  /** Custom recent color (defaults to white/60) */
  recentColor?: string;
  /** Custom quiet color (defaults to white/15) */
  quietColor?: string;
  /** Additional className */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

// ============================================
// COLOR HELPERS
// ============================================

function getHeartbeatColor(
  level: ActivityLevel,
  liveColor: string = 'var(--color-accent-gold, #FFD700)',
  recentColor: string = 'rgba(255, 255, 255, 0.6)',
  quietColor: string = 'rgba(255, 255, 255, 0.15)'
): string {
  switch (level) {
    case 'live':
      return liveColor;
    case 'recent':
      return recentColor;
    case 'quiet':
      return quietColor;
    default:
      return quietColor;
  }
}

// ============================================
// COMPONENT
// ============================================

const ActivityHeartbeat = React.forwardRef<HTMLDivElement, ActivityHeartbeatProps>(
  (
    {
      className,
      orientation = 'vertical',
      size = 'md',
      level,
      animate = true,
      liveColor,
      recentColor,
      quietColor,
      style,
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();
    const shouldAnimate = animate && !shouldReduceMotion && level !== 'quiet';
    const color = getHeartbeatColor(level, liveColor, recentColor, quietColor);

    return (
      <motion.div
        ref={ref}
        className={cn(activityHeartbeatVariants({ orientation, size }), className)}
        style={{
          backgroundColor: color,
          ...style,
        }}
        animate={shouldAnimate ? heartbeatAnimations[level] : { opacity: level === 'quiet' ? 0.2 : 1 }}
        transition={shouldAnimate ? heartbeatTransitions[level] : undefined}
        role="presentation"
        aria-hidden="true"
      />
    );
  }
);

ActivityHeartbeat.displayName = 'ActivityHeartbeat';

// ============================================
// POSITIONED VARIANT (for cards)
// ============================================

export interface ActivityHeartbeatStripProps extends ActivityHeartbeatProps {
  /** Position of the strip */
  position?: 'left' | 'right' | 'top' | 'bottom';
}

const positionClasses: Record<string, string> = {
  left: 'absolute left-0 top-0 bottom-0',
  right: 'absolute right-0 top-0 bottom-0',
  top: 'absolute top-0 left-0 right-0',
  bottom: 'absolute bottom-0 left-0 right-0',
};

const ActivityHeartbeatStrip = React.forwardRef<HTMLDivElement, ActivityHeartbeatStripProps>(
  ({ position = 'left', className, orientation, ...props }, ref) => {
    // Auto-determine orientation based on position
    const autoOrientation = position === 'left' || position === 'right' ? 'vertical' : 'horizontal';

    return (
      <ActivityHeartbeat
        ref={ref}
        className={cn(positionClasses[position], className)}
        orientation={orientation ?? autoOrientation}
        {...props}
      />
    );
  }
);

ActivityHeartbeatStrip.displayName = 'ActivityHeartbeatStrip';

// ============================================
// EXPORTS
// ============================================

export {
  ActivityHeartbeat,
  ActivityHeartbeatStrip,
  activityHeartbeatVariants,
  getHeartbeatColor,
};

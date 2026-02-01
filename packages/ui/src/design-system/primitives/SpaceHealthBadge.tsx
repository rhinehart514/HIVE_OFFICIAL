'use client';

/**
 * SpaceHealthBadge Primitive
 *
 * Visual indicator for space health/activity level.
 * Combines lastActivityAt, onlineCount, and message metrics
 * to show whether a space is active, moderate, or quiet.
 *
 * Health Levels:
 * - active: Recent activity (<1h) OR users online OR 10+ messages/24h
 * - moderate: Activity in last 24h OR 1-9 messages/24h
 * - quiet: No recent activity (>24h) OR dormant (>7d)
 * - dormant: No activity for 7+ days
 *
 * Visual Design:
 * - Dot + text label format (compact)
 * - Badge format (full)
 * - Edge strip format (for cards)
 *
 * Color system (from design tokens):
 * - Active: emerald (green)
 * - Moderate: amber (yellow)
 * - Quiet: neutral (gray)
 * - Dormant: dim neutral
 *
 * @version 1.0.0 - Sprint 3 (Jan 2026)
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// ============================================
// TYPES
// ============================================

export type SpaceHealthLevel = 'active' | 'moderate' | 'quiet' | 'dormant';

export interface SpaceHealthMetrics {
  /** Last activity timestamp */
  lastActivityAt?: string | Date | null;
  /** Currently online users */
  onlineCount?: number;
  /** Messages in last 24 hours */
  recentMessageCount?: number;
  /** Member count (for growth context) */
  memberCount?: number;
  /** New members in last 7 days (for growth trend) */
  newMembers7d?: number;
}

// ============================================
// HEALTH CALCULATION
// ============================================

/**
 * Calculate health level from space metrics
 */
export function getSpaceHealthLevel(metrics: SpaceHealthMetrics): SpaceHealthLevel {
  const { lastActivityAt, onlineCount = 0, recentMessageCount = 0 } = metrics;

  // Active: users online OR high message count OR very recent activity
  if (onlineCount > 0) return 'active';
  if (recentMessageCount >= 10) return 'active';

  // Calculate time since last activity
  if (lastActivityAt) {
    const lastActive = typeof lastActivityAt === 'string'
      ? new Date(lastActivityAt)
      : lastActivityAt;
    const now = new Date();
    const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return 'active';
    if (diffHours < 24) {
      // Within 24h: check message count for moderate vs active
      return recentMessageCount >= 5 ? 'active' : 'moderate';
    }
    if (diffHours < 24 * 7) return 'quiet';
    return 'dormant';
  }

  // No activity data
  if (recentMessageCount >= 1) return 'moderate';
  return 'quiet';
}

/**
 * Get human-readable label for health level
 */
export function getHealthLabel(level: SpaceHealthLevel): string {
  switch (level) {
    case 'active':
      return 'Active';
    case 'moderate':
      return 'Moderate';
    case 'quiet':
      return 'Quiet';
    case 'dormant':
      return 'Dormant';
  }
}

/**
 * Get detailed description for health level (for tooltips)
 */
export function getHealthDescription(level: SpaceHealthLevel): string {
  switch (level) {
    case 'active':
      return 'Active in the last hour';
    case 'moderate':
      return 'Active in the last 24 hours';
    case 'quiet':
      return 'No recent activity';
    case 'dormant':
      return 'Inactive for over a week';
  }
}

/**
 * Calculate growth trend from member metrics
 * Returns: 'growing' | 'stable' | 'declining' | null
 */
export function getMemberGrowthTrend(metrics: SpaceHealthMetrics): 'growing' | 'stable' | 'declining' | null {
  const { memberCount = 0, newMembers7d } = metrics;

  if (newMembers7d === undefined || memberCount === 0) return null;

  const growthRate = newMembers7d / memberCount;

  if (growthRate > 0.1) return 'growing'; // >10% growth
  if (newMembers7d > 0) return 'stable';
  return 'declining';
}

// ============================================
// CVA VARIANTS
// ============================================

const healthBadgeContainerVariants = cva(
  'inline-flex items-center transition-colors duration-150',
  {
    variants: {
      variant: {
        badge: 'px-2 py-0.5 rounded-full text-xs font-medium',
        compact: 'gap-1.5',
        dot: '',
        edge: 'w-0.5 rounded-r',
      },
      level: {
        active: '',
        moderate: '',
        quiet: '',
        dormant: '',
      },
    },
    compoundVariants: [
      // Badge variant colors
      { variant: 'badge', level: 'active', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
      { variant: 'badge', level: 'moderate', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
      { variant: 'badge', level: 'quiet', className: 'bg-white/[0.04] text-white/40 border border-white/[0.06]' },
      { variant: 'badge', level: 'dormant', className: 'bg-white/[0.02] text-white/25 border border-white/[0.04]' },
      // Compact variant (dot + text)
      { variant: 'compact', level: 'active', className: 'text-emerald-400' },
      { variant: 'compact', level: 'moderate', className: 'text-amber-400' },
      { variant: 'compact', level: 'quiet', className: 'text-white/40' },
      { variant: 'compact', level: 'dormant', className: 'text-white/25' },
    ],
    defaultVariants: {
      variant: 'compact',
      level: 'quiet',
    },
  }
);

const healthDotVariants = cva(
  'rounded-full flex-shrink-0',
  {
    variants: {
      size: {
        xs: 'w-1 h-1',
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
      },
      level: {
        active: 'bg-emerald-400',
        moderate: 'bg-amber-400',
        quiet: 'bg-white/30',
        dormant: 'bg-white/15',
      },
      animated: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { level: 'active', animated: true, className: 'animate-pulse' },
    ],
    defaultVariants: {
      size: 'sm',
      level: 'quiet',
      animated: false,
    },
  }
);

const healthEdgeVariants = cva(
  'transition-colors duration-150',
  {
    variants: {
      level: {
        active: 'bg-emerald-400',
        moderate: 'bg-amber-400',
        quiet: 'bg-white/20',
        dormant: 'bg-white/10',
      },
      size: {
        sm: 'h-6',
        md: 'h-8',
        lg: 'h-10',
        full: 'h-full',
      },
    },
    defaultVariants: {
      level: 'quiet',
      size: 'md',
    },
  }
);

// ============================================
// COMPONENT TYPES
// ============================================

export interface SpaceHealthBadgeProps
  extends VariantProps<typeof healthBadgeContainerVariants> {
  /** Space metrics to calculate health from */
  metrics?: SpaceHealthMetrics;
  /** Direct level override (skips calculation) */
  level?: SpaceHealthLevel;
  /** Show label text */
  showLabel?: boolean;
  /** Animate active state */
  animated?: boolean;
  /** Size of the dot */
  dotSize?: 'xs' | 'sm' | 'md';
  /** Additional className */
  className?: string;
}

export interface SpaceHealthDotProps {
  /** Health level */
  level: SpaceHealthLevel;
  /** Dot size */
  size?: 'xs' | 'sm' | 'md';
  /** Animate active state */
  animated?: boolean;
  /** Additional className */
  className?: string;
}

export interface SpaceHealthEdgeProps {
  /** Health level */
  level: SpaceHealthLevel;
  /** Edge size */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Additional className */
  className?: string;
}

// ============================================
// COMPONENTS
// ============================================

/**
 * Health Dot - Just the colored dot
 */
const SpaceHealthDot = React.forwardRef<HTMLSpanElement, SpaceHealthDotProps>(
  ({ level, size = 'sm', animated = false, className }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(healthDotVariants({ level, size, animated }), className)}
        aria-hidden="true"
      />
    );
  }
);

SpaceHealthDot.displayName = 'SpaceHealthDot';

/**
 * Health Edge - Vertical strip indicator for cards
 */
const SpaceHealthEdge = React.forwardRef<HTMLDivElement, SpaceHealthEdgeProps>(
  ({ level, size = 'md', className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r',
          healthEdgeVariants({ level, size }),
          className
        )}
        aria-hidden="true"
      />
    );
  }
);

SpaceHealthEdge.displayName = 'SpaceHealthEdge';

/**
 * Health Badge - Full badge component with multiple variants
 */
const SpaceHealthBadge = React.forwardRef<HTMLDivElement, SpaceHealthBadgeProps>(
  (
    {
      metrics,
      level: levelProp,
      variant = 'compact',
      showLabel = true,
      animated = true,
      dotSize = 'sm',
      className,
    },
    ref
  ) => {
    // Calculate level from metrics if not provided
    const level = levelProp ?? (metrics ? getSpaceHealthLevel(metrics) : 'quiet');
    const label = getHealthLabel(level);
    const description = getHealthDescription(level);

    // Badge variant - full pill
    if (variant === 'badge') {
      return (
        <div
          ref={ref}
          className={cn(healthBadgeContainerVariants({ variant, level }), className)}
          title={description}
        >
          <SpaceHealthDot
            level={level}
            size="xs"
            animated={animated && level === 'active'}
          />
          <span className="ml-1.5">{label}</span>
        </div>
      );
    }

    // Dot variant - just the dot
    if (variant === 'dot') {
      return (
        <SpaceHealthDot
          level={level}
          size={dotSize}
          animated={animated && level === 'active'}
          className={className}
        />
      );
    }

    // Edge variant - vertical strip
    if (variant === 'edge') {
      return (
        <SpaceHealthEdge
          ref={ref}
          level={level}
          className={className}
        />
      );
    }

    // Compact variant (default) - dot + optional label
    return (
      <div
        ref={ref}
        className={cn(healthBadgeContainerVariants({ variant, level }), className)}
        title={description}
      >
        <SpaceHealthDot
          level={level}
          size={dotSize}
          animated={animated && level === 'active'}
        />
        {showLabel && (
          <span className="text-xs">{label}</span>
        )}
      </div>
    );
  }
);

SpaceHealthBadge.displayName = 'SpaceHealthBadge';

// ============================================
// GROWTH INDICATOR
// ============================================

export interface SpaceGrowthIndicatorProps {
  /** Growth trend */
  trend: 'growing' | 'stable' | 'declining';
  /** Size variant */
  size?: 'sm' | 'md';
  /** Show label */
  showLabel?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Growth Indicator - Shows member growth trend
 */
const SpaceGrowthIndicator = React.forwardRef<HTMLDivElement, SpaceGrowthIndicatorProps>(
  ({ trend, size = 'sm', showLabel = false, className }, ref) => {
    const colors = {
      growing: 'text-emerald-400',
      stable: 'text-white/40',
      declining: 'text-red-400',
    };

    const labels = {
      growing: 'Growing',
      stable: 'Stable',
      declining: 'Declining',
    };

    const icons = {
      growing: (
        <svg
          width={size === 'sm' ? 12 : 14}
          height={size === 'sm' ? 12 : 14}
          viewBox="0 0 12 12"
          fill="none"
          className="flex-shrink-0"
        >
          <path
            d="M6 9V3M6 3L3 6M6 3L9 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      stable: (
        <svg
          width={size === 'sm' ? 12 : 14}
          height={size === 'sm' ? 12 : 14}
          viewBox="0 0 12 12"
          fill="none"
          className="flex-shrink-0"
        >
          <path
            d="M3 6H9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
      declining: (
        <svg
          width={size === 'sm' ? 12 : 14}
          height={size === 'sm' ? 12 : 14}
          viewBox="0 0 12 12"
          fill="none"
          className="flex-shrink-0"
        >
          <path
            d="M6 3V9M6 9L3 6M6 9L9 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    };

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center gap-1', colors[trend], className)}
        title={`Member growth: ${labels[trend]}`}
      >
        {icons[trend]}
        {showLabel && (
          <span className={cn('font-medium', size === 'sm' ? 'text-xs' : 'text-sm')}>
            {labels[trend]}
          </span>
        )}
      </div>
    );
  }
);

SpaceGrowthIndicator.displayName = 'SpaceGrowthIndicator';

// ============================================
// COMBINED HEALTH INDICATOR
// ============================================

export interface SpaceHealthIndicatorProps {
  /** Space metrics */
  metrics: SpaceHealthMetrics;
  /** Show growth trend alongside health */
  showGrowth?: boolean;
  /** Variant */
  variant?: 'compact' | 'badge' | 'detailed';
  /** Additional className */
  className?: string;
}

/**
 * Full Health Indicator - Combines health level and optional growth
 */
const SpaceHealthIndicator = React.forwardRef<HTMLDivElement, SpaceHealthIndicatorProps>(
  ({ metrics, showGrowth = false, variant = 'compact', className }, ref) => {
    const healthLevel = getSpaceHealthLevel(metrics);
    const growthTrend = getMemberGrowthTrend(metrics);

    if (variant === 'detailed') {
      return (
        <div ref={ref} className={cn('flex items-center gap-3', className)}>
          <SpaceHealthBadge
            level={healthLevel}
            variant="badge"
            animated
          />
          {showGrowth && growthTrend && (
            <SpaceGrowthIndicator
              trend={growthTrend}
              size="sm"
              showLabel
            />
          )}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('flex items-center gap-2', className)}>
        <SpaceHealthBadge
          level={healthLevel}
          variant={variant === 'badge' ? 'badge' : 'compact'}
          animated
        />
        {showGrowth && growthTrend && (
          <SpaceGrowthIndicator trend={growthTrend} size="sm" />
        )}
      </div>
    );
  }
);

SpaceHealthIndicator.displayName = 'SpaceHealthIndicator';

// ============================================
// EXPORTS
// ============================================

export {
  SpaceHealthBadge,
  SpaceHealthDot,
  SpaceHealthEdge,
  SpaceGrowthIndicator,
  SpaceHealthIndicator,
  healthBadgeContainerVariants,
  healthDotVariants,
  healthEdgeVariants,
};

'use client';

/**
 * SpaceHealthBadge Primitive
 *
 * Visual indicator for space health/activity level.
 * Dot, badge, compact, and edge variants.
 *
 * Health logic lives in ./space-health-utils.ts
 * Growth/combined indicators live in ./SpaceHealthIndicator.tsx
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import type { SpaceHealthLevel, SpaceHealthMetrics } from './space-health-utils';
import { getSpaceHealthLevel, getHealthLabel, getHealthDescription } from './space-health-utils';

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
      { variant: 'badge', level: 'active', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
      { variant: 'badge', level: 'moderate', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
      { variant: 'badge', level: 'quiet', className: 'bg-white/[0.05] text-white/30 border border-white/[0.05]' },
      { variant: 'badge', level: 'dormant', className: 'bg-white/[0.03] text-white/25 border border-white/[0.05]' },
      { variant: 'compact', level: 'active', className: 'text-emerald-400' },
      { variant: 'compact', level: 'moderate', className: 'text-amber-400' },
      { variant: 'compact', level: 'quiet', className: 'text-white/30' },
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
  metrics?: SpaceHealthMetrics;
  level?: SpaceHealthLevel;
  showLabel?: boolean;
  animated?: boolean;
  dotSize?: 'xs' | 'sm' | 'md';
  className?: string;
}

export interface SpaceHealthDotProps {
  level: SpaceHealthLevel;
  size?: 'xs' | 'sm' | 'md';
  animated?: boolean;
  className?: string;
}

export interface SpaceHealthEdgeProps {
  level: SpaceHealthLevel;
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

// ============================================
// COMPONENTS
// ============================================

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

const SpaceHealthBadge = React.forwardRef<HTMLDivElement, SpaceHealthBadgeProps>(
  ({ metrics, level: levelProp, variant = 'compact', showLabel = true, animated = true, dotSize = 'sm', className }, ref) => {
    const level = levelProp ?? (metrics ? getSpaceHealthLevel(metrics) : 'quiet');
    const label = getHealthLabel(level);
    const description = getHealthDescription(level);

    if (variant === 'badge') {
      return (
        <div ref={ref} className={cn(healthBadgeContainerVariants({ variant, level }), className)} title={description}>
          <SpaceHealthDot level={level} size="xs" animated={animated && level === 'active'} />
          <span className="ml-1.5">{label}</span>
        </div>
      );
    }

    if (variant === 'dot') {
      return (
        <SpaceHealthDot level={level} size={dotSize} animated={animated && level === 'active'} className={className} />
      );
    }

    if (variant === 'edge') {
      return <SpaceHealthEdge ref={ref} level={level} className={className} />;
    }

    return (
      <div ref={ref} className={cn(healthBadgeContainerVariants({ variant, level }), className)} title={description}>
        <SpaceHealthDot level={level} size={dotSize} animated={animated && level === 'active'} />
        {showLabel && <span className="text-xs">{label}</span>}
      </div>
    );
  }
);

SpaceHealthBadge.displayName = 'SpaceHealthBadge';

export {
  SpaceHealthBadge,
  SpaceHealthDot,
  SpaceHealthEdge,
  healthBadgeContainerVariants,
  healthDotVariants,
  healthEdgeVariants,
};

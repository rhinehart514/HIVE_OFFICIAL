'use client';

/**
 * SpaceGrowthIndicator + SpaceHealthIndicator
 *
 * Growth trend arrows and combined health+growth indicators.
 * Split from SpaceHealthBadge.tsx for modularity.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import type { SpaceHealthMetrics } from './space-health-utils';
import { getSpaceHealthLevel, getMemberGrowthTrend } from './space-health-utils';
import { SpaceHealthBadge } from './SpaceHealthBadge';

// ============================================
// GROWTH INDICATOR
// ============================================

export interface SpaceGrowthIndicatorProps {
  trend: 'growing' | 'stable' | 'declining';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

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

    const iconSize = size === 'sm' ? 12 : 14;

    const icons = {
      growing: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
          <path d="M6 9V3M6 3L3 6M6 3L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      stable: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
          <path d="M3 6H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      declining: (
        <svg width={iconSize} height={iconSize} viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
          <path d="M6 3V9M6 9L3 6M6 9L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
  metrics: SpaceHealthMetrics;
  showGrowth?: boolean;
  variant?: 'compact' | 'badge' | 'detailed';
  className?: string;
}

const SpaceHealthIndicator = React.forwardRef<HTMLDivElement, SpaceHealthIndicatorProps>(
  ({ metrics, showGrowth = false, variant = 'compact', className }, ref) => {
    const healthLevel = getSpaceHealthLevel(metrics);
    const growthTrend = getMemberGrowthTrend(metrics);

    if (variant === 'detailed') {
      return (
        <div ref={ref} className={cn('flex items-center gap-3', className)}>
          <SpaceHealthBadge level={healthLevel} variant="badge" animated />
          {showGrowth && growthTrend && (
            <SpaceGrowthIndicator trend={growthTrend} size="sm" showLabel />
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

export { SpaceGrowthIndicator, SpaceHealthIndicator };

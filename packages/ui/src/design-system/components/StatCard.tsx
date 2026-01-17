'use client';

/**
 * StatCard Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Displays a single metric/KPI with optional trend indicator.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DEFAULT STAT CARD:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                                                                         │
 * │  ┌──────┐                                                               │
 * │  │ ICON │   32x32 icon container (optional)                             │
 * │  └──────┘   bg-elevated, rounded-xl                                     │
 * │                                                                         │
 * │  Active Users                                   Label: text-sm, muted   │
 * │                                                                         │
 * │  2,847                    ↑ 12.5%               Value: text-3xl, bold   │
 * │                           Trend: green/red      vs last week            │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * COMPACT STAT CARD:
 * ┌────────────────────────────────┐
 * │  Active Users                  │
 * │  2,847         ↑ 12.5%        │
 * └────────────────────────────────┘
 *
 * MINI STAT CARD (inline):
 * │ 📊 2,847 active │   Icon + value + optional label
 *
 * LARGE STAT CARD (dashboard hero):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                                                                         │
 * │      Monthly Active Users                                               │
 * │                                                                         │
 * │              32,847                              Value: text-5xl        │
 * │                                                                         │
 * │      ↑ 15.3% vs last month                      Trend + context         │
 * │                                                                         │
 * │      ▂▃▄▅▆▇█▇▆▅                                  Optional sparkline      │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * TREND INDICATORS:
 * - Positive: ↑ with green color (#22C55E / var(--color-status-success))
 * - Negative: ↓ with red color (#FF6B6B / var(--color-status-error))
 * - Neutral: → with gray color
 * - None: No trend shown
 *
 * VALUE FORMATTING:
 * - Numbers: 1,234,567 (comma-separated)
 * - Percentages: 12.5%
 * - Currency: $1,234
 * - Compact: 1.2K, 3.4M, 1.5B
 *
 * LOADING STATE:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ████████████████                                                       │
 * │  ████████████                                 Skeleton animation        │
 * │  ████                                                                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * SIZE VARIANTS:
 * - sm: Compact, padding 3, value text-xl
 * - default: Standard, padding 5, value text-3xl
 * - lg: Hero, padding 6, value text-5xl
 *
 * COLORS:
 * - Label: text-muted (gray)
 * - Value: text-primary (white)
 * - Trend positive: #22C55E
 * - Trend negative: #FF6B6B
 * - Icon container: bg-elevated
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';
import { Card } from '../primitives/Card';

const statCardVariants = cva(
  'relative overflow-hidden',
  {
    variants: {
      size: {
        sm: 'p-3',
        default: 'p-5',
        lg: 'p-6',
      },
      variant: {
        default: '',
        outline: 'bg-transparent',
        ghost: 'bg-transparent border-none shadow-none',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

export interface StatCardProps extends VariantProps<typeof statCardVariants> {
  /** Stat label/title */
  label: string;
  /** Stat value */
  value: string | number;
  /** Previous value (for calculating trend) */
  previousValue?: number;
  /** Pre-calculated trend percentage */
  trend?: number;
  /** Trend comparison text (e.g., "vs last week") */
  trendLabel?: string;
  /** Override trend direction */
  trendDirection?: 'up' | 'down' | 'neutral';
  /** Icon element */
  icon?: React.ReactNode;
  /** Sparkline data points */
  sparkline?: number[];
  /** Format value as currency */
  currency?: string;
  /** Use compact notation (K, M, B) */
  compact?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Additional info shown on hover */
  tooltip?: string;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Format large numbers with commas or compact notation
 */
function formatValue(
  value: string | number,
  options?: { compact?: boolean; currency?: string }
): string {
  if (typeof value === 'string') return value;

  const num = value as number;

  if (options?.compact) {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  }

  const formatted = num.toLocaleString();

  if (options?.currency) {
    return `${options.currency}${formatted}`;
  }

  return formatted;
}

/**
 * Calculate trend percentage
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * StatCard - Metric display component
 */
const StatCard: React.FC<StatCardProps> = ({
  size = 'default',
  variant = 'default',
  label,
  value,
  previousValue,
  trend: trendProp,
  trendLabel,
  trendDirection: directionProp,
  icon,
  sparkline,
  currency,
  compact,
  loading = false,
  tooltip,
  onClick,
  className,
}) => {
  // Calculate trend
  const trend = trendProp ?? (previousValue !== undefined && typeof value === 'number'
    ? calculateTrend(value, previousValue)
    : undefined);

  // Determine direction
  const trendDirection = directionProp ?? (trend !== undefined
    ? trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'
    : undefined);

  // Format the value
  const formattedValue = formatValue(value, { compact, currency });

  // Size-based typography
  const valueSizes = {
    sm: 'text-xl',
    default: 'text-3xl',
    lg: 'text-5xl',
  };

  // Trend colors
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-[var(--color-text-muted)]',
  };

  // Loading skeleton
  if (loading) {
    return (
      <Card className={cn(statCardVariants({ size, variant }), className)}>
        <div className="space-y-3 animate-pulse">
          {icon && (
            <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-elevated)]" />
          )}
          <div className="h-4 w-24 bg-[var(--color-bg-elevated)] rounded" />
          <div className="h-8 w-32 bg-[var(--color-bg-elevated)] rounded" />
          {trend !== undefined && (
            <div className="h-3 w-20 bg-[var(--color-bg-elevated)] rounded" />
          )}
        </div>
      </Card>
    );
  }

  const isClickable = !!onClick;

  return (
    <Card
      className={cn(
        statCardVariants({ size, variant }),
        isClickable && 'cursor-pointer hover:border-[var(--color-border-hover)] transition-colors',
        className
      )}
      onClick={onClick}
      title={tooltip}
    >
      {/* Icon */}
      {icon && (
        <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center mb-3">
          {icon}
        </div>
      )}

      {/* Label */}
      <Text size="sm" tone="muted" className="mb-1">
        {label}
      </Text>

      {/* Value row with trend */}
      <div className="flex items-baseline gap-3">
        {/* Value */}
        <Text
          className={cn(
            valueSizes[size || 'default'],
            'font-bold tracking-tight'
          )}
        >
          {formattedValue}
        </Text>

        {/* Trend indicator */}
        {trendDirection && trend !== undefined && (
          <div className={cn('flex items-center gap-1', trendColors[trendDirection])}>
            {/* Arrow */}
            {trendDirection === 'up' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            )}
            {trendDirection === 'down' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            )}
            {trendDirection === 'neutral' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15" />
              </svg>
            )}

            {/* Percentage */}
            <Text size="sm" className="font-medium">
              {Math.abs(trend).toFixed(1)}%
            </Text>
          </div>
        )}
      </div>

      {/* Trend label */}
      {trendLabel && (
        <Text size="xs" tone="muted" className="mt-1">
          {trendLabel}
        </Text>
      )}

      {/* Sparkline */}
      {sparkline && sparkline.length > 0 && (
        <div className="mt-4">
          <Sparkline data={sparkline} />
        </div>
      )}
    </Card>
  );
};

StatCard.displayName = 'StatCard';

/**
 * Sparkline - Mini line chart
 */
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 24,
  className,
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Generate SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Determine color based on trend
  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
    >
      {/* Gradient fill */}
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <path
        d={`${pathD} L ${width},${height} L 0,${height} Z`}
        fill="url(#sparkline-gradient)"
      />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r={2}
        fill={strokeColor}
      />
    </svg>
  );
};

/**
 * StatCardGroup - Grid of stat cards
 */
export interface StatCardGroupProps {
  /** Stat cards */
  children: React.ReactNode;
  /** Number of columns */
  columns?: 2 | 3 | 4;
  /** Additional className */
  className?: string;
}

const StatCardGroup: React.FC<StatCardGroupProps> = ({
  children,
  columns = 4,
  className,
}) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
};

StatCardGroup.displayName = 'StatCardGroup';

/**
 * StatCardSkeleton - Loading placeholder
 */
const StatCardSkeleton: React.FC<{ size?: 'sm' | 'default' | 'lg'; className?: string }> = ({
  size = 'default',
  className,
}) => (
  <StatCard
    label=""
    value=""
    loading
    size={size}
    className={className}
  />
);

StatCardSkeleton.displayName = 'StatCardSkeleton';

export { StatCard, StatCardGroup, StatCardSkeleton, Sparkline };

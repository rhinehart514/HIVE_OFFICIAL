'use client';

/**
 * ProgressBar Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Visual indicator for progress, completion, or loading.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC PROGRESS:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  65%     │
 * └─────────────────────────────────────────────────────────────────────────┘
 *                         │                                          │
 *                         │                                          └── Optional label
 *                         └── Filled portion (gold for key actions)
 *
 * WITH LABEL:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Profile Completion                                              65%   │
 * │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * SIZES:
 *
 * xs (2px):
 * ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░
 *
 * sm (4px):
 * ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░
 *
 * default (8px):
 * ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░
 *
 * lg (12px):
 * ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░
 *
 * VARIANTS:
 *
 * Default (muted):
 * ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░
 * - Fill: white/30
 * - Track: bg-elevated
 *
 * Gold (key progress):
 * ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░
 * - Fill: #FFD700
 * - Track: bg-elevated
 *
 * Success:
 * ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░
 * - Fill: #22C55E
 *
 * Warning:
 * ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░
 * - Fill: #FFA500
 *
 * Error:
 * ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░
 * - Fill: #FF6B6B
 *
 * INDETERMINATE (loading):
 * ░░░░░░▓▓▓▓▓▓░░░░░░░░░░░░
 *            ↓
 * ░░░░░░░░░░░░▓▓▓▓▓▓░░░░░░
 * - Animated shimmer moving left to right
 *
 * SEGMENTED (steps):
 * ▓▓▓▓▓▓ ▓▓▓▓▓▓ ░░░░░░ ░░░░░░
 *    │       │       │       │
 *    └───────┴───────┴───────┴── 4 segments, 2 complete
 *
 * STRIPED:
 * ▓╱▓╱▓╱▓╱▓╱░░░░░░░░░░░░
 * - Diagonal stripes for visual interest
 *
 * WITH VALUE INSIDE:
 * ▓▓▓▓▓▓▓▓ 65% ░░░░░░░░░░
 *
 * CIRCULAR VARIANT:
 *     ╭───────╮
 *    ╱  65%   ╲
 *   │          │
 *    ╲        ╱
 *     ╰───────╯
 * - Ring that fills clockwise
 *
 * STATES:
 * - Active: Filled to current value
 * - Complete: 100% filled, optional checkmark
 * - Indeterminate: Animated shimmer
 *
 * ANIMATIONS:
 * - Fill: 300ms ease-out
 * - Indeterminate: continuous shimmer
 * - Complete: optional pulse/celebration
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

const progressVariants = cva('w-full overflow-hidden rounded-full bg-elevated', {
  variants: {
    size: {
      xs: 'h-0.5',
      sm: 'h-1',
      default: 'h-2',
      lg: 'h-3',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

const progressFillVariants = cva('h-full transition-all duration-300 ease-out', {
  variants: {
    variant: {
      default: 'bg-white/30',
      gold: 'bg-life-gold',
      success: 'bg-green-500',
      warning: 'bg-amber-500',
      error: 'bg-red-500',
      gradient: 'bg-gradient-to-r from-life-gold to-red-500',
    },
    striped: {
      true: 'bg-stripes',
      false: '',
    },
    animated: {
      true: 'animate-stripes',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    striped: false,
    animated: false,
  },
});

export interface ProgressBarProps extends VariantProps<typeof progressVariants> {
  /** Progress value (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Color variant */
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'error' | 'gradient';
  /** Show label */
  label?: string;
  /** Show percentage */
  showValue?: boolean;
  /** Value position */
  valuePosition?: 'right' | 'inside' | 'above';
  /** Indeterminate loading state */
  indeterminate?: boolean;
  /** Striped pattern */
  striped?: boolean;
  /** Animate stripes */
  animatedStripes?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * ProgressBar - Linear progress indicator
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'default',
  variant = 'default',
  label,
  showValue = false,
  valuePosition = 'right',
  indeterminate = false,
  striped = false,
  animatedStripes = false,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {/* Label row */}
      {(label || (showValue && valuePosition === 'above')) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <Text size="sm" tone="muted">
              {label}
            </Text>
          )}
          {showValue && valuePosition === 'above' && (
            <Text size="sm" weight="medium">
              {Math.round(percentage)}%
            </Text>
          )}
        </div>
      )}

      {/* Progress bar row */}
      <div className="flex items-center gap-3">
        <div className={cn(progressVariants({ size }), 'flex-1')}>
          {indeterminate ? (
            <div
              className={cn(
                progressFillVariants({ variant }),
                'w-1/3 animate-indeterminate'
              )}
            />
          ) : (
            <div
              className={cn(
                progressFillVariants({ variant, striped, animated: animatedStripes }),
                size === 'lg' && 'rounded-full'
              )}
              style={{ width: `${percentage}%` }}
            >
              {showValue && valuePosition === 'inside' && size === 'lg' && (
                <span className="flex items-center justify-center h-full text-[10px] font-medium text-black">
                  {Math.round(percentage)}%
                </span>
              )}
            </div>
          )}
        </div>

        {showValue && valuePosition === 'right' && (
          <Text size="sm" weight="medium" className="min-w-[3ch] text-right">
            {Math.round(percentage)}%
          </Text>
        )}
      </div>
    </div>
  );
};

ProgressBar.displayName = 'ProgressBar';

/**
 * ProgressCircle - Circular progress indicator
 */
export interface ProgressCircleProps {
  /** Progress value (0-100) */
  value: number;
  /** Circle size in pixels */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Color variant */
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'error';
  /** Show value inside */
  showValue?: boolean;
  /** Custom content inside */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

const variantStrokeColors: Record<string, string> = {
  default: 'stroke-white/30',
  gold: 'stroke-life-gold',
  success: 'stroke-green-500',
  warning: 'stroke-amber-500',
  error: 'stroke-red-500',
};

const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  size = 64,
  strokeWidth = 4,
  variant = 'default',
  showValue = false,
  children,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-elevated"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(variantStrokeColors[variant], 'transition-all duration-300 ease-out')}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showValue && (
          <Text size={size < 48 ? 'xs' : 'sm'} weight="medium">
            {Math.round(percentage)}%
          </Text>
        ))}
      </div>
    </div>
  );
};

ProgressCircle.displayName = 'ProgressCircle';

/**
 * ProgressSteps - Segmented step progress
 */
export interface ProgressStepsProps {
  /** Total steps */
  total: number;
  /** Current step (1-indexed) */
  current: number;
  /** Color variant */
  variant?: 'default' | 'gold' | 'success';
  /** Size */
  size?: 'sm' | 'default' | 'lg';
  /** Additional className */
  className?: string;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({
  total,
  current,
  variant = 'gold',
  size = 'default',
  className,
}) => {
  const heights = { sm: 'h-1', default: 'h-2', lg: 'h-3' };

  return (
    <div className={cn('flex gap-1', className)}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 rounded-full transition-colors',
            heights[size],
            i < current
              ? progressFillVariants({ variant }).replace('h-full transition-all duration-300 ease-out', '')
              : 'bg-elevated'
          )}
        />
      ))}
    </div>
  );
};

ProgressSteps.displayName = 'ProgressSteps';

export { ProgressBar, ProgressCircle, ProgressSteps, progressVariants, progressFillVariants };

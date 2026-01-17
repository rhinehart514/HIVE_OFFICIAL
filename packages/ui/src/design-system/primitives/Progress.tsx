'use client';

/**
 * Progress Primitive - LOCKED 2026-01-10
 *
 * LOCKED: Inset track, solid white/gold gradient, smooth ease animation
 * Gold gradient for achievements - one of the sacred gold uses.
 *
 * Recipe:
 *   track: Inset (carved into surface)
 *   indicator: Solid white default, Gold gradient for achievements
 *   size: 4px default (sm)
 *   animation: Smooth ease 0.5s
 */

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Inset track surface
const trackSurface = {
  background: 'rgba(0,0,0,0.4)',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
};

// LOCKED: Gold gradient for achievements
const goldGradient = {
  background: 'linear-gradient(90deg, #B8860B 0%, #FFD700 50%, #FFF8DC 100%)',
  boxShadow: '0 0 8px rgba(255,215,0,0.4)',
};

const progressVariants = cva(
  [
    'relative',
    'w-full',
    'overflow-hidden',
    'rounded-full',
  ].join(' '),
  {
    variants: {
      size: {
        xs: 'h-0.5',
        sm: 'h-1',
        default: 'h-1',
        lg: 'h-2',
        xl: 'h-3',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const progressIndicatorVariants = cva(
  [
    'h-full',
    'w-full',
    'flex-1',
    'rounded-full',
    // LOCKED: Smooth ease animation
    'transition-transform duration-500',
  ].join(' '),
  {
    variants: {
      variant: {
        // Default: Solid white
        default: 'bg-white',
        // Gold: Achievement progress - GOLD GRADIENT
        gold: '',
        // Success: Green progress
        success: 'bg-[var(--color-status-success)]',
        // Error: Red progress
        error: 'bg-[var(--color-status-error)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressIndicatorVariants> {
  /** Progress value (0-100) */
  value?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Indeterminate loading state */
  indeterminate?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value = 0,
      size,
      variant,
      showLabel = false,
      indeterminate = false,
      ...props
    },
    ref
  ) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div className="flex items-center gap-3">
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(progressVariants({ size }), className)}
          style={trackSurface}
          value={clampedValue}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              progressIndicatorVariants({ variant }),
              indeterminate && 'animate-indeterminate-progress'
            )}
            style={{
              transform: indeterminate
                ? undefined
                : `translateX(-${100 - clampedValue}%)`,
              // LOCKED: Gold gradient styling
              ...(variant === 'gold' ? goldGradient : {}),
              // LOCKED: Smooth ease
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </ProgressPrimitive.Root>
        {showLabel && !indeterminate && (
          <span className="text-sm font-medium text-white/60 min-w-[3ch] text-right">
            {Math.round(clampedValue)}%
          </span>
        )}
      </div>
    );
  }
);

Progress.displayName = ProgressPrimitive.Root.displayName;

// Circular progress variant
export interface CircularProgressProps {
  /** Progress value (0-100) */
  value?: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color variant */
  variant?: 'default' | 'gold' | 'success' | 'error';
  /** Show percentage in center */
  showLabel?: boolean;
  /** Indeterminate loading */
  indeterminate?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value = 0,
  size = 48,
  strokeWidth = 4,
  variant = 'default',
  showLabel = false,
  indeterminate = false,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedValue / 100) * circumference;

  // LOCKED: Simple white default, gold gradient for achievements
  const getStrokeProps = () => {
    if (variant === 'gold') {
      return { stroke: 'url(#goldProgressGrad)' };
    }
    const strokeColor = {
      default: 'white',
      success: 'var(--color-status-success)',
      error: 'var(--color-status-error)',
    }[variant] || 'white';
    return { stroke: strokeColor };
  };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        className={cn(
          'transform -rotate-90',
          indeterminate && 'animate-spin'
        )}
        width={size}
        height={size}
      >
        {/* LOCKED: Gold gradient definition */}
        <defs>
          <linearGradient id="goldProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B8860B" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFF8DC" />
          </linearGradient>
        </defs>
        {/* Background circle - inset style */}
        <circle
          strokeWidth={strokeWidth}
          stroke="rgba(0,0,0,0.4)"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            transition: indeterminate
              ? undefined
              : 'stroke-dashoffset 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          {...getStrokeProps()}
        />
      </svg>
      {showLabel && !indeterminate && (
        <span className="absolute text-xs font-medium text-white">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
};

export {
  Progress,
  CircularProgress,
  progressVariants,
  progressIndicatorVariants,
  trackSurface,
  goldGradient,
};

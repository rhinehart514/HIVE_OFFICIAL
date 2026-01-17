'use client';

/**
 * ConnectionStrengthIndicator Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Visual indicator showing connection strength between users
 * Uses warmth dots or bar visualization, gold for strong connections.
 *
 * Recipe:
 *   container: Horizontal bar or dots
 *   levels: weak (1), light (2), moderate (3), strong (4), close (5)
 *   colors: White progression, gold for highest level
 *   animation: Smooth fill transitions
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Strength levels with colors
const STRENGTH_LEVELS = {
  none: { level: 0, label: 'Not connected', color: 'bg-white/10' },
  weak: { level: 1, label: 'Weak', color: 'bg-white/20' },
  light: { level: 2, label: 'Light', color: 'bg-white/40' },
  moderate: { level: 3, label: 'Moderate', color: 'bg-white/60' },
  strong: { level: 4, label: 'Strong', color: 'bg-white/80' },
  close: { level: 5, label: 'Close', color: 'bg-[#D4AF37]' },
} as const;

// Container variants
const connectionContainerVariants = cva(
  [
    'flex items-center',
  ].join(' '),
  {
    variants: {
      variant: {
        bar: 'gap-0',
        dots: 'gap-1',
        segments: 'gap-0.5',
      },
    },
    defaultVariants: {
      variant: 'dots',
    },
  }
);

// Dot variants
const connectionDotVariants = cva(
  [
    'rounded-full',
    'transition-all duration-300 ease-out',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'w-1.5 h-1.5',
        default: 'w-2 h-2',
        lg: 'w-2.5 h-2.5',
      },
      filled: {
        true: '',
        false: 'bg-white/10',
      },
    },
    defaultVariants: {
      size: 'default',
      filled: false,
    },
  }
);

// Bar segment variants
const connectionBarVariants = cva(
  [
    'h-1',
    'transition-all duration-300 ease-out',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-0.5',
        default: 'h-1',
        lg: 'h-1.5',
      },
      position: {
        first: 'rounded-l-full',
        middle: '',
        last: 'rounded-r-full',
        only: 'rounded-full',
      },
    },
    defaultVariants: {
      size: 'default',
      position: 'middle',
    },
  }
);

// Types
export type StrengthLevel = 'none' | 'weak' | 'light' | 'moderate' | 'strong' | 'close';

export interface ConnectionStrengthIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Strength value (0-100) or level */
  strength: number | StrengthLevel;
  /** Display variant */
  variant?: 'bar' | 'dots' | 'segments';
  /** Size */
  size?: 'sm' | 'default' | 'lg';
  /** Show label */
  showLabel?: boolean;
  /** Show percentage */
  showPercentage?: boolean;
  /** Number of segments/dots (for dots/segments variant) */
  segments?: number;
  /** Total width (for bar variant) */
  width?: number;
  /** Animate on mount */
  animated?: boolean;
}

// Convert percentage to level
function strengthToLevel(strength: number): StrengthLevel {
  if (strength <= 0) return 'none';
  if (strength <= 20) return 'weak';
  if (strength <= 40) return 'light';
  if (strength <= 60) return 'moderate';
  if (strength <= 80) return 'strong';
  return 'close';
}

// Convert level to percentage
function levelToStrength(level: StrengthLevel): number {
  return STRENGTH_LEVELS[level].level * 20;
}

// Get color for strength level
function getStrengthColor(strength: number): string {
  if (strength <= 0) return 'bg-white/10';
  if (strength <= 20) return 'bg-white/20';
  if (strength <= 40) return 'bg-white/40';
  if (strength <= 60) return 'bg-white/60';
  if (strength <= 80) return 'bg-white/80';
  return 'bg-[#D4AF37]';
}

// Dots visualization
const DotsVisualization: React.FC<{
  strength: number;
  segments: number;
  size: 'sm' | 'default' | 'lg';
  animated: boolean;
}> = ({ strength, segments, size, animated }) => {
  const filledCount = Math.round((strength / 100) * segments);
  const isMaxStrength = strength >= 90;

  return (
    <div className={cn(connectionContainerVariants({ variant: 'dots' }))}>
      {Array.from({ length: segments }).map((_, index) => {
        const isFilled = index < filledCount;
        const isGold = isMaxStrength && index === segments - 1 && isFilled;

        const dot = (
          <div
            key={index}
            className={cn(
              connectionDotVariants({ size, filled: isFilled }),
              isFilled && (isGold ? 'bg-[#D4AF37]' : 'bg-white/60')
            )}
          />
        );

        if (animated && isFilled) {
          return (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.2 }}
            >
              {dot}
            </motion.div>
          );
        }

        return dot;
      })}
    </div>
  );
};

// Segments visualization
const SegmentsVisualization: React.FC<{
  strength: number;
  segments: number;
  size: 'sm' | 'default' | 'lg';
  animated: boolean;
}> = ({ strength, segments, size, animated }) => {
  const filledCount = Math.round((strength / 100) * segments);
  const isMaxStrength = strength >= 90;

  return (
    <div className={cn(connectionContainerVariants({ variant: 'segments' }), 'w-full')}>
      {Array.from({ length: segments }).map((_, index) => {
        const isFilled = index < filledCount;
        const isGold = isMaxStrength && index === segments - 1 && isFilled;
        const position = segments === 1 ? 'only' : index === 0 ? 'first' : index === segments - 1 ? 'last' : 'middle';

        const segment = (
          <div
            key={index}
            className={cn(
              connectionBarVariants({ size, position }),
              'flex-1',
              isFilled
                ? isGold ? 'bg-[#D4AF37]' : 'bg-white/60'
                : 'bg-white/10'
            )}
          />
        );

        if (animated && isFilled) {
          return (
            <motion.div
              key={index}
              className="flex-1"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1, duration: 0.2 }}
            >
              {segment}
            </motion.div>
          );
        }

        return segment;
      })}
    </div>
  );
};

// Bar visualization
const BarVisualization: React.FC<{
  strength: number;
  size: 'sm' | 'default' | 'lg';
  width: number;
  animated: boolean;
}> = ({ strength, size, width, animated }) => {
  const isMaxStrength = strength >= 90;
  const heightClass = size === 'sm' ? 'h-0.5' : size === 'lg' ? 'h-1.5' : 'h-1';

  return (
    <div
      className={cn('rounded-full bg-white/10 overflow-hidden', heightClass)}
      style={{ width }}
    >
      <motion.div
        className={cn(
          'h-full rounded-full',
          isMaxStrength ? 'bg-[#D4AF37]' : 'bg-white/60'
        )}
        initial={animated ? { width: 0 } : { width: `${strength}%` }}
        animate={{ width: `${strength}%` }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
};

// Main component
const ConnectionStrengthIndicator = React.forwardRef<HTMLDivElement, ConnectionStrengthIndicatorProps>(
  (
    {
      className,
      strength,
      variant = 'dots',
      size = 'default',
      showLabel = false,
      showPercentage = false,
      segments = 5,
      width = 64,
      animated = true,
      ...props
    },
    ref
  ) => {
    // Normalize strength to number
    const strengthValue = typeof strength === 'string'
      ? levelToStrength(strength)
      : Math.min(100, Math.max(0, strength));

    const level = strengthToLevel(strengthValue);
    const levelInfo = STRENGTH_LEVELS[level];

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        {/* Visualization */}
        {variant === 'dots' && (
          <DotsVisualization
            strength={strengthValue}
            segments={segments}
            size={size}
            animated={animated}
          />
        )}
        {variant === 'segments' && (
          <SegmentsVisualization
            strength={strengthValue}
            segments={segments}
            size={size}
            animated={animated}
          />
        )}
        {variant === 'bar' && (
          <BarVisualization
            strength={strengthValue}
            size={size}
            width={width}
            animated={animated}
          />
        )}

        {/* Label */}
        {showLabel && (
          <span className={cn(
            'text-xs font-medium',
            level === 'close' ? 'text-[#D4AF37]' : 'text-white/50'
          )}>
            {levelInfo.label}
          </span>
        )}

        {/* Percentage */}
        {showPercentage && (
          <span className="text-xs text-white/40 tabular-nums">
            {Math.round(strengthValue)}%
          </span>
        )}
      </div>
    );
  }
);

ConnectionStrengthIndicator.displayName = 'ConnectionStrengthIndicator';

// Compact inline version
interface ConnectionStrengthInlineProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Strength value (0-100) or level */
  strength: number | StrengthLevel;
  /** Show text */
  showText?: boolean;
}

const ConnectionStrengthInline = React.forwardRef<HTMLDivElement, ConnectionStrengthInlineProps>(
  ({ className, strength, showText = true, ...props }, ref) => {
    const strengthValue = typeof strength === 'string'
      ? levelToStrength(strength)
      : Math.min(100, Math.max(0, strength));

    const level = strengthToLevel(strengthValue);
    const levelInfo = STRENGTH_LEVELS[level];
    const isClose = level === 'close';

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center gap-1.5', className)}
        {...props}
      >
        {/* Single dot indicator */}
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isClose ? 'bg-[#D4AF37]' : getStrengthColor(strengthValue)
          )}
        />

        {showText && (
          <span className={cn(
            'text-xs',
            isClose ? 'text-[#D4AF37]' : 'text-white/50'
          )}>
            {levelInfo.label}
          </span>
        )}
      </div>
    );
  }
);

ConnectionStrengthInline.displayName = 'ConnectionStrengthInline';

export {
  ConnectionStrengthIndicator,
  ConnectionStrengthInline,
  // Export variants
  connectionContainerVariants,
  connectionDotVariants,
  connectionBarVariants,
  // Export utilities
  strengthToLevel,
  levelToStrength,
  getStrengthColor,
  // Export constants
  STRENGTH_LEVELS,
};

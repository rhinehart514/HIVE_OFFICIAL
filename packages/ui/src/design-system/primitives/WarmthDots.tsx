'use client';

/**
 * WarmthDots Primitive
 *
 * Visual indicator of space activity level using a 5-dot system.
 * Maps activity count to warmth levels.
 *
 * Warmth Levels:
 * - Hot (50+ online): 5 gold dots
 * - Warm (15-50 online): 4 gold dots
 * - Cool (5-15 online): 2 gray dots
 * - Quiet (1-5 online): 1 gray dot
 * - Waiting (0 online): 0 dots (all dim)
 *
 * CRITICAL: Gold is allowed here - warmth is a presence indicator (gold budget).
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// ============================================
// WARMTH CALCULATION
// ============================================

export type WarmthLevel = 'hot' | 'warm' | 'cool' | 'quiet' | 'waiting';

/**
 * Calculate warmth level from online count
 */
export function getWarmthLevel(onlineCount: number): WarmthLevel {
  if (onlineCount >= 50) return 'hot';
  if (onlineCount >= 15) return 'warm';
  if (onlineCount >= 5) return 'cool';
  if (onlineCount >= 1) return 'quiet';
  return 'waiting';
}

/**
 * Get number of filled dots for each warmth level
 */
export function getFilledDots(level: WarmthLevel): number {
  switch (level) {
    case 'hot': return 5;
    case 'warm': return 4;
    case 'cool': return 2;
    case 'quiet': return 1;
    case 'waiting': return 0;
  }
}

/**
 * Check if level uses gold color (hot/warm only)
 */
export function usesGold(level: WarmthLevel): boolean {
  return level === 'hot' || level === 'warm';
}

// ============================================
// CVA VARIANTS
// ============================================

const warmthDotsContainerVariants = cva(
  'inline-flex items-center',
  {
    variants: {
      size: {
        xs: 'gap-px',
        sm: 'gap-0.5',
        md: 'gap-1',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

const warmthDotVariants = cva(
  'rounded-full transition-colors duration-[var(--duration-snap)]',
  {
    variants: {
      size: {
        xs: 'w-1 h-1',
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
      },
      filled: {
        true: '',
        false: 'bg-neutral-700',
      },
      gold: {
        true: 'bg-[var(--color-accent-gold)]',
        false: 'bg-neutral-500',
      },
    },
    compoundVariants: [
      // Unfilled dots are always dim gray
      {
        filled: false,
        className: 'bg-neutral-700',
      },
      // Filled gold dots
      {
        filled: true,
        gold: true,
        className: 'bg-[var(--color-accent-gold)]',
      },
      // Filled gray dots (cool/quiet)
      {
        filled: true,
        gold: false,
        className: 'bg-neutral-500',
      },
    ],
    defaultVariants: {
      size: 'sm',
      filled: false,
      gold: false,
    },
  }
);

// ============================================
// COMPONENT TYPES
// ============================================

export interface WarmthDotsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof warmthDotsContainerVariants> {
  /** Warmth level (calculated or provided) */
  level?: WarmthLevel;
  /** Online count (alternative to level - will calculate) */
  onlineCount?: number;
  /** Total dots to show */
  total?: number;
  /** Show pulse animation for hot spaces */
  animate?: boolean;
  /** Simplified mode (only show active/quiet, no middle states) */
  simplified?: boolean;
}

// ============================================
// COMPONENT
// ============================================

const WarmthDots = React.forwardRef<HTMLDivElement, WarmthDotsProps>(
  (
    {
      className,
      size = 'sm',
      level: levelProp,
      onlineCount,
      total = 5,
      animate = false,
      simplified = false,
      ...props
    },
    ref
  ) => {
    // Calculate level from onlineCount if not provided
    const level = levelProp ?? (onlineCount !== undefined ? getWarmthLevel(onlineCount) : 'waiting');

    // In simplified mode, only show active (any activity) or quiet (none)
    const effectiveLevel = simplified
      ? (level === 'waiting' ? 'waiting' : 'warm')
      : level;

    const filledCount = getFilledDots(effectiveLevel);
    const isGold = usesGold(effectiveLevel);

    return (
      <div
        ref={ref}
        className={cn(warmthDotsContainerVariants({ size }), className)}
        role="img"
        aria-label={`Activity level: ${effectiveLevel} (${filledCount} of ${total})`}
        {...props}
      >
        {Array.from({ length: total }).map((_, index) => {
          const isFilled = index < filledCount;
          return (
            <span
              key={index}
              className={cn(
                warmthDotVariants({
                  size,
                  filled: isFilled,
                  gold: isFilled && isGold,
                }),
                // Pulse animation for hot spaces
                animate && effectiveLevel === 'hot' && isFilled && 'animate-pulse'
              )}
            />
          );
        })}
      </div>
    );
  }
);

WarmthDots.displayName = 'WarmthDots';

// ============================================
// INLINE WARMTH (text + dots)
// ============================================

export interface InlineWarmthProps extends WarmthDotsProps {
  /** Show online count as text */
  showCount?: boolean;
}

const InlineWarmth = React.forwardRef<HTMLDivElement, InlineWarmthProps>(
  ({ showCount = false, onlineCount, className, ...props }, ref) => {
    const level = onlineCount !== undefined ? getWarmthLevel(onlineCount) : 'waiting';
    const isGold = usesGold(level);

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center gap-1.5', className)}
      >
        {showCount && onlineCount !== undefined && (
          <span
            className={cn(
              'text-xs tabular-nums',
              isGold ? 'text-[var(--color-accent-gold)]' : 'text-neutral-500'
            )}
          >
            {onlineCount}
          </span>
        )}
        <WarmthDots onlineCount={onlineCount} {...props} />
      </div>
    );
  }
);

InlineWarmth.displayName = 'InlineWarmth';

// ============================================
// EXPORTS
// ============================================

export {
  WarmthDots,
  InlineWarmth,
  warmthDotsContainerVariants,
  warmthDotVariants,
};

'use client';

/**
 * LiveCounter Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Number color: Gold (#FFD700) when > 0
 * - Dot indicator: None (cleaner, just number + label)
 * - Zero state: Muted gray (clearly inactive)
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const liveCounterVariants = cva(
  [
    'inline-flex items-center gap-1',
    'font-[var(--font-family-mono)]',
    'transition-all duration-[var(--duration-smooth)]',
  ].join(' '),
  {
    variants: {
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        default: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
      },
      // Whether to animate number changes
      animate: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      animate: true,
    },
  }
);

export interface LiveCounterProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof liveCounterVariants> {
  /** The count to display */
  count: number;
  /** Label text (e.g., "online", "members", "active") */
  label?: string;
  /** Show the dot indicator */
  showDot?: boolean;
  /** Format large numbers (1000 → 1K) */
  compact?: boolean;
  /** Prefix for the count */
  prefix?: string;
  /** Suffix for the count (alternative to label) */
  suffix?: string;
}

/**
 * Format number for compact display
 */
function formatCompact(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 10000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000) return `${Math.floor(num / 1000)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}

const LiveCounter = React.forwardRef<HTMLSpanElement, LiveCounterProps>(
  (
    {
      className,
      size,
      animate,
      count,
      label,
      showDot = false,
      compact = false,
      prefix,
      suffix,
      ...props
    },
    ref
  ) => {
    const displayCount = compact ? formatCompact(count) : count.toLocaleString();

    return (
      <span
        ref={ref}
        className={cn(liveCounterVariants({ size, animate }), className)}
        data-count={count}
        {...props}
      >
        {/* Optional dot indicator */}
        {showDot && (
          <span
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              count > 0
                ? 'bg-[var(--color-accent-gold)]'
                : 'bg-[var(--color-text-muted)]'
            )}
            aria-hidden="true"
          />
        )}

        {/* Prefix */}
        {prefix && (
          <span className="text-[var(--color-text-muted)]">{prefix}</span>
        )}

        {/* GOLD number */}
        <span
          className={cn(
            'font-semibold tabular-nums',
            count > 0
              ? 'text-[var(--color-accent-gold)]'
              : 'text-[var(--color-text-muted)]',
            animate && 'transition-all duration-[var(--duration-smooth)]'
          )}
        >
          {displayCount}
        </span>

        {/* Gray label or suffix */}
        {(label || suffix) && (
          <span className="text-[var(--color-text-muted)]">
            {label || suffix}
          </span>
        )}
      </span>
    );
  }
);

LiveCounter.displayName = 'LiveCounter';

/**
 * LiveCounterGroup - Display multiple counters
 */
export interface LiveCounterGroupProps {
  /** Array of counter data */
  counters: Array<{
    count: number;
    label: string;
    showDot?: boolean;
  }>;
  /** Size for all counters */
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  /** Separator between counters */
  separator?: React.ReactNode;
  /** Additional className */
  className?: string;
}

const LiveCounterGroup: React.FC<LiveCounterGroupProps> = ({
  counters,
  size = 'default',
  separator = <span className="text-[var(--color-text-muted)]">·</span>,
  className,
}) => {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {counters.map((counter, index) => (
        <React.Fragment key={index}>
          {index > 0 && separator}
          <LiveCounter
            count={counter.count}
            label={counter.label}
            showDot={counter.showDot}
            size={size}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

export { LiveCounter, LiveCounterGroup, liveCounterVariants, formatCompact };

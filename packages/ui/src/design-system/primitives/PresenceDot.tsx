'use client';

/**
 * PresenceDot Primitive
 * LOCKED: January 11, 2026
 *
 * Decisions:
 * - Online: Gold (`var(--color-accent-gold)`) - ALWAYS gold, this is allowed
 * - Away: Gold at 50% opacity
 * - Offline: Muted gray
 * - DND: Red (status-error)
 * - Shape: Fully rounded (circle)
 * - Sizes: xs (6px), sm (8px), default (10px), lg (12px)
 *
 * CRITICAL: Gold is allowed here - presence is one of the gold budget uses.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const presenceDotVariants = cva(
  [
    'rounded-full',
    'flex-shrink-0',
    'transition-colors duration-[var(--duration-snap)]',
  ].join(' '),
  {
    variants: {
      status: {
        // CRITICAL: Online is ALWAYS gold
        online: 'bg-[var(--color-accent-gold)]',
        // Away/idle
        away: 'bg-[var(--color-accent-gold)]/50',
        // Offline
        offline: 'bg-[var(--color-text-muted)]',
        // Do not disturb
        dnd: 'bg-[var(--color-status-error)]',
      },
      size: {
        xs: 'w-1.5 h-1.5',
        sm: 'w-2 h-2',
        default: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
      },
      // Animate the dot (subtle pulse for online)
      animate: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // Pulse animation only for online status
      {
        status: 'online',
        animate: true,
        className: 'animate-pulse',
      },
    ],
    defaultVariants: {
      status: 'offline',
      size: 'default',
      animate: false,
    },
  }
);

export interface PresenceDotProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof presenceDotVariants> {
  /** Ring around the dot for visibility on dark backgrounds */
  withRing?: boolean;
}

const PresenceDot = React.forwardRef<HTMLSpanElement, PresenceDotProps>(
  ({ className, status, size, animate, withRing = false, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          presenceDotVariants({ status, size, animate }),
          withRing && 'ring-2 ring-[var(--color-bg-page)]',
          className
        )}
        aria-label={`Status: ${status || 'offline'}`}
        {...props}
      />
    );
  }
);

PresenceDot.displayName = 'PresenceDot';

// Wrapper to position presence dot on an avatar
export interface PresenceWrapperProps {
  /** User status */
  status: 'online' | 'away' | 'offline' | 'dnd';
  /** Dot size */
  size?: 'xs' | 'sm' | 'default' | 'lg';
  /** Position of the dot */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Children (typically an Avatar) */
  children: React.ReactNode;
}

const positionClasses = {
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
};

const PresenceWrapper: React.FC<PresenceWrapperProps> = ({
  status,
  size = 'default',
  position = 'bottom-right',
  children,
}) => {
  return (
    <div className="relative inline-flex">
      {children}
      <PresenceDot
        status={status}
        size={size}
        withRing
        className={cn('absolute', positionClasses[position])}
      />
    </div>
  );
};

export { PresenceDot, PresenceWrapper, presenceDotVariants };

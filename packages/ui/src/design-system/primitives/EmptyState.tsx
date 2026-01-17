'use client';

/**
 * EmptyState Primitive - LOCKED 2026-01-13
 *
 * Consistent empty state pattern for lists, grids, and search results.
 * Uses gold subtle background for warmth, rounded-lg icon containers.
 *
 * Recipe:
 *   icon: Rounded-lg container with gold subtle bg
 *   title: Primary text, medium weight
 *   description: Secondary text, regular weight
 *   action: Optional CTA button
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Button } from './Button';

const emptyStateVariants = cva(
  [
    'flex flex-col items-center justify-center',
    'text-center',
    'py-12 px-6',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'py-8 px-4',
        default: 'py-12 px-6',
        lg: 'py-16 px-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const iconContainerVariants = cva(
  [
    'flex items-center justify-center',
    // LOCKED: rounded-lg, not circles
    'rounded-lg',
    'mb-4',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'w-12 h-12',
        default: 'w-16 h-16',
        lg: 'w-20 h-20',
      },
      variant: {
        default: 'bg-[var(--bg-muted)]',
        gold: 'bg-[var(--life-subtle)]',
        error: 'bg-[var(--status-error-subtle)]',
        success: 'bg-[var(--status-success-subtle)]',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'gold',
    },
  }
);

const iconVariants = cva('', {
  variants: {
    size: {
      sm: 'w-6 h-6',
      default: 'w-8 h-8',
      lg: 'w-10 h-10',
    },
    variant: {
      default: 'text-[var(--text-secondary)]',
      gold: 'text-[var(--life-gold)]',
      error: 'text-[var(--status-error)]',
      success: 'text-[var(--status-success)]',
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'gold',
  },
});

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  /** Icon to display (typically from heroicons) */
  icon?: React.ReactNode;
  /** Main title */
  title: string;
  /** Supporting description */
  description?: string;
  /** Primary action button text */
  actionLabel?: string;
  /** Primary action handler */
  onAction?: () => void;
  /** Secondary action button text */
  secondaryActionLabel?: string;
  /** Secondary action handler */
  onSecondaryAction?: () => void;
  /** Color variant */
  variant?: 'default' | 'gold' | 'error' | 'success';
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      size,
      icon,
      title,
      description,
      actionLabel,
      onAction,
      secondaryActionLabel,
      onSecondaryAction,
      variant = 'gold',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ size }), className)}
        {...props}
      >
        {icon && (
          <div className={cn(iconContainerVariants({ size, variant }))}>
            <div className={cn(iconVariants({ size, variant }))}>
              {icon}
            </div>
          </div>
        )}

        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6">
            {description}
          </p>
        )}

        {(actionLabel || secondaryActionLabel) && (
          <div className="flex gap-3 flex-wrap justify-center">
            {actionLabel && onAction && (
              <Button variant="cta" onClick={onAction}>
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <Button variant="secondary" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

// ============================================
// PRESET EMPTY STATES
// Common patterns for quick usage
// ============================================

export interface NoResultsProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

const NoResults: React.FC<NoResultsProps> = ({ searchQuery, onClearSearch }) => (
  <EmptyState
    icon={
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    }
    title="No results found"
    description={searchQuery ? `No matches for "${searchQuery}"` : "Try adjusting your search or filters"}
    actionLabel={onClearSearch ? "Clear search" : undefined}
    onAction={onClearSearch}
    variant="default"
  />
);

export interface NoItemsProps {
  itemType?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const NoItems: React.FC<NoItemsProps> = ({ itemType = 'items', actionLabel, onAction }) => (
  <EmptyState
    icon={
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    }
    title={`No ${itemType} yet`}
    description={`Get started by adding your first ${itemType.replace(/s$/, '')}`}
    actionLabel={actionLabel}
    onAction={onAction}
    variant="gold"
  />
);

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <EmptyState
    icon={
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    }
    title="Something went wrong"
    description={message || "We couldn't load this content. Please try again."}
    actionLabel={onRetry ? "Try again" : undefined}
    onAction={onRetry}
    variant="error"
  />
);

export {
  EmptyState,
  NoResults,
  NoItems,
  ErrorState,
  emptyStateVariants,
  iconContainerVariants,
  iconVariants,
};

'use client';

/**
 * LoadingOverlay Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * P0 Blocker - Used across all slices for loading states.
 * Two variants: fullscreen (page-level) and inline (component-level).
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

// Spinner component used in both variants
const Spinner: React.FC<{ size?: 'sm' | 'default' | 'lg'; className?: string }> = ({
  size = 'default',
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    default: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-[var(--color-text-muted)] border-t-[var(--color-accent-gold)]',
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    />
  );
};

export interface LoadingOverlayProps {
  /** Loading message */
  message?: string;
  /** Sub-message for additional context */
  subMessage?: string;
  /** Variant type */
  variant?: 'fullscreen' | 'inline' | 'card';
  /** Spinner size */
  size?: 'sm' | 'default' | 'lg';
  /** Show the overlay */
  visible?: boolean;
  /** Blur background (fullscreen only) */
  blur?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * LoadingOverlay - Fullscreen loading state
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message,
  subMessage,
  variant = 'fullscreen',
  size = 'default',
  visible = true,
  blur = true,
  className,
}) => {
  if (!visible) return null;

  // Inline variant - small centered spinner
  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 py-8',
          className
        )}
        role="status"
        aria-busy="true"
      >
        <Spinner size={size} />
        {message && (
          <Text size="sm" tone="secondary">
            {message}
          </Text>
        )}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Card variant - fits within a card container
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-3',
          'bg-[var(--color-bg-card)]/90 backdrop-blur-sm',
          'rounded-lg z-10',
          className
        )}
        role="status"
        aria-busy="true"
      >
        <Spinner size={size} />
        {message && (
          <Text size="sm" tone="secondary">
            {message}
          </Text>
        )}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Fullscreen variant - covers entire viewport
  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        'flex flex-col items-center justify-center gap-4',
        'bg-[var(--color-bg-page)]',
        blur && 'bg-[var(--color-bg-page)]/95 backdrop-blur-md',
        'transition-opacity duration-300',
        className
      )}
      role="status"
      aria-busy="true"
    >
      {/* HIVE Logo pulse effect */}
      <div className="relative">
        <Spinner size="lg" />
        {/* Gold accent glow */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            boxShadow: '0 0 40px rgba(255, 215, 0, 0.15)',
          }}
        />
      </div>

      {/* Loading message */}
      {message && (
        <div className="text-center mt-4">
          <Text size="lg" weight="medium">
            {message}
          </Text>
          {subMessage && (
            <Text size="sm" tone="muted" className="mt-1">
              {subMessage}
            </Text>
          )}
        </div>
      )}

      <span className="sr-only">Loading...</span>
    </div>
  );
};

LoadingOverlay.displayName = 'LoadingOverlay';

/**
 * LoadingSpinner - Standalone spinner for custom layouts
 */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'default', className }) => {
  return <Spinner size={size} className={className} />;
};

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * LoadingDots - Animated dots loading indicator
 */
const LoadingDots: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('flex items-center gap-1', className)} role="status" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)]',
            'animate-bounce'
          )}
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: '600ms',
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

LoadingDots.displayName = 'LoadingDots';

export { LoadingOverlay, LoadingSpinner, LoadingDots };

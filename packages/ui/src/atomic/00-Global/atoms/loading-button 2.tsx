/**
 * Loading Button Component
 *
 * Button with integrated loading state for mutation actions.
 * Automatically disables interaction and shows spinner when loading.
 *
 * @module loading-button
 * @since 1.0.0
 */

'use client';

import React, { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

export interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button loading state */
  loading?: boolean;

  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';

  /** Button size */
  size?: 'sm' | 'md' | 'lg';

  /** Success state (shows checkmark) */
  success?: boolean;

  /** Error state (shows error styling) */
  error?: boolean;

  /** Icon to show before text */
  icon?: React.ReactNode;

  /** Full width button */
  fullWidth?: boolean;
}

/**
 * Loading Button
 *
 * @example
 * ```tsx
 * const { mutate, loading } = useHiveMutation({
 *   mutationFn: createPost,
 * });
 *
 * <LoadingButton
 *   loading={loading}
 *   onClick={() => mutate(data)}
 *   variant="primary"
 * >
 *   Create Post
 * </LoadingButton>
 * ```
 */
export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      loading = false,
      success = false,
      error = false,
      disabled,
      variant = 'primary',
      size = 'md',
      icon,
      children,
      className,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center gap-2',
          'font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed',

          // Size variants
          size === 'sm' && 'h-8 px-3 text-sm rounded-md',
          size === 'md' && 'h-10 px-4 text-base rounded-lg',
          size === 'lg' && 'h-12 px-6 text-lg rounded-lg',

          // Variant styles using semantic tokens
          variant === 'primary' && [
            'bg-[var(--hive-button-primary-background)]',
            'text-[var(--hive-button-primary-text)]',
            'hover:bg-[var(--hive-button-primary-background-hover)]',
            'active:bg-[var(--hive-button-primary-background-active)]',
            'disabled:bg-[var(--hive-button-primary-background-disabled)]',
            'disabled:text-[var(--hive-button-primary-text-disabled)]',
            'focus-visible:ring-[var(--hive-button-primary-ring)]',
          ],

          variant === 'secondary' && [
            'bg-[var(--hive-button-secondary-background)]',
            'text-[var(--hive-button-secondary-text)]',
            'border border-[var(--hive-button-secondary-border)]',
            'hover:bg-[var(--hive-button-secondary-background-hover)]',
            'active:bg-[var(--hive-button-secondary-background-active)]',
            'disabled:bg-[var(--hive-button-secondary-background-disabled)]',
            'disabled:text-[var(--hive-button-secondary-text-disabled)]',
            'focus-visible:ring-[var(--hive-button-secondary-ring)]',
          ],

          variant === 'ghost' && [
            'bg-transparent',
            'text-[var(--hive-text-primary)]',
            'hover:bg-[var(--hive-background-tertiary)]',
            'active:bg-[var(--hive-background-quaternary)]',
            'disabled:text-[var(--hive-text-disabled)]',
            'focus-visible:ring-[var(--hive-border-focus)]',
          ],

          variant === 'destructive' && [
            'bg-[var(--hive-button-destructive-background)]',
            'text-[var(--hive-button-destructive-text)]',
            'hover:bg-[var(--hive-button-destructive-background-hover)]',
            'active:bg-[var(--hive-button-destructive-background-active)]',
            'disabled:bg-[var(--hive-button-destructive-background-disabled)]',
            'disabled:text-[var(--hive-button-destructive-text-disabled)]',
            'focus-visible:ring-[var(--hive-button-destructive-ring)]',
          ],

          // Success state
          success && [
            'bg-[var(--hive-semantic-success-background)] !important',
            'text-[var(--hive-semantic-success-text)] !important',
          ],

          // Error state
          error && [
            'bg-[var(--hive-semantic-error-background)] !important',
            'text-[var(--hive-semantic-error-text)] !important',
            'border-[var(--hive-semantic-error-border)] !important',
          ],

          // Full width
          fullWidth && 'w-full',

          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-label="Loading"
          />
        )}

        {/* Success checkmark */}
        {success && !loading && (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-label="Success"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}

        {/* Icon */}
        {icon && !loading && !success && <span className="inline-flex">{icon}</span>}

        {/* Button text */}
        {children && (
          <span
            className={cn(
              'inline-flex items-center',
              loading && 'opacity-0' // Hide text during loading but keep layout
            )}
          >
            {children}
          </span>
        )}
      </button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

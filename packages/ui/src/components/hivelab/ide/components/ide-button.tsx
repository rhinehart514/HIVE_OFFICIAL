'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';
import { FOCUS_RING } from '../../tokens';

const ideButtonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-colors',
    FOCUS_RING,
    'disabled:opacity-50 disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--ide-interactive-default)]',
          'hover:bg-[var(--ide-interactive-hover)]',
          'active:bg-[var(--ide-interactive-active)]',
          'text-[var(--ide-text-primary)]',
        ],
        primary: [
          'bg-[var(--ide-accent-primary)]',
          'hover:bg-[var(--ide-accent-primary-hover)]',
          'text-[var(--ide-text-inverse)]',
        ],
        ghost: [
          'bg-transparent',
          'hover:bg-[var(--ide-interactive-hover)]',
          'text-[var(--ide-text-secondary)]',
          'hover:text-[var(--ide-text-primary)]',
        ],
        danger: [
          'bg-[var(--ide-status-error-bg)]',
          'hover:bg-[var(--ide-status-error)]/20',
          'text-[var(--ide-status-error)]',
        ],
      },
      size: {
        sm: 'h-7 px-2 text-xs rounded-md',
        md: 'h-8 px-3 text-sm rounded-lg',
        lg: 'h-10 px-4 text-sm rounded-lg',
        icon: 'h-8 w-8 rounded-lg',
        iconSm: 'h-7 w-7 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface IDEButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof ideButtonVariants> {
  isLoading?: boolean;
}

/**
 * IDE-styled button with variants for different contexts.
 * Uses IDE design tokens for consistent styling.
 */
export const IDEButton = forwardRef<HTMLButtonElement, IDEButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(ideButtonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

IDEButton.displayName = 'IDEButton';

export { ideButtonVariants };

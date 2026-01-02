'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';

const ideInputVariants = cva(
  [
    'w-full',
    'bg-[var(--ide-surface-elevated)]',
    'border border-[var(--ide-border-default)]',
    'text-[var(--ide-text-primary)]',
    'placeholder:text-[var(--ide-text-muted)]',
    'outline-none',
    'transition-colors',
    'focus:border-[var(--ide-border-focus)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      size: {
        sm: 'h-7 px-2 text-base md:text-xs rounded-md', // 16px mobile (iOS zoom fix)
        md: 'h-8 px-3 text-base md:text-sm rounded-lg',
        lg: 'h-10 px-4 text-base md:text-sm rounded-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface IDEInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof ideInputVariants> {
  label?: string;
  error?: string;
}

/**
 * IDE-styled input field with optional label and error state.
 * Uses IDE design tokens for consistent styling.
 */
export const IDEInput = forwardRef<HTMLInputElement, IDEInputProps>(
  ({ className, size, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs text-[var(--ide-text-muted)] mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            ideInputVariants({ size }),
            error && 'border-[var(--ide-status-error)]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--ide-status-error)]">{error}</p>
        )}
      </div>
    );
  }
);

IDEInput.displayName = 'IDEInput';

export { ideInputVariants };

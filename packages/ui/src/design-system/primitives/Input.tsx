'use client';

/**
 * Input Primitive
 * REFINED: Jan 29, 2026 - Matches /about aesthetic
 *
 * Design principles:
 * - Subtle border, not heavy shadows
 * - Flat background with slight transparency
 * - White focus ring
 * - Minimal, restrained
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const inputVariants = cva(
  [
    'w-full',
    'bg-white/[0.03]',
    'text-white',
    'placeholder:text-white/25',
    'border border-white/10',
    'rounded-xl',
    'outline-none',
    'transition-all duration-200 ease-out',
    'focus:border-white/20 focus:bg-white/[0.05]',
    'focus-visible:ring-2 focus-visible:ring-white/20',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-9 px-3 text-sm',
        default: 'h-11 px-4 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      variant: {
        default: '',
        pill: 'rounded-full px-5',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, variant, error, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          inputVariants({ size, variant }),
          error && 'border-red-500/40 focus:border-red-500/60',
          className
        )}
        aria-invalid={error}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };

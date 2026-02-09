'use client';

/**
 * Input Primitive
 * REFINED: Feb 9, 2026 - Cold, minimal spec
 *
 * Design principles:
 * - Flat cold surface
 * - 12px card radius
 * - Quiet borders with clear focus
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const inputVariants = cva(
  [
    'w-full',
    'bg-[#0A0A0A]',
    'text-white',
    'placeholder:text-white/40',
    'border border-white/[0.08]',
    'rounded-[12px]',
    'outline-none',
    'transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
    'focus:border-white/[0.2] focus:bg-[#141414]',
    'focus-visible:ring-2 focus-visible:ring-white/[0.20]',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000]',
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

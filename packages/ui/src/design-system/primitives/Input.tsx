'use client';

/**
 * Input Primitive - LOCKED 2026-01-12
 *
 * Pure Float style: Elevated input with shadow-based focus
 * NO ring/outline focus - shadows only
 * Glass activation via backdrop-blur-sm
 *
 * Recipe:
 *   background: linear-gradient(180deg, rgba(48,48,48,1), rgba(38,38,38,1))
 *   boxShadow: 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)
 *   focus: brighten + lift shadow
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const inputVariants = cva(
  [
    'w-full',
    'text-white',
    'placeholder:text-white/30',
    'rounded-xl',
    'border-0',
    // LOCKED: Glass activation via backdrop-blur
    'backdrop-blur-sm',
    // LOCKED: NO ring/outline - shadow focus only
    'outline-none focus:outline-none focus:ring-0',
    'transition-all duration-[var(--duration-snap)] ease-[var(--easing-default)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
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

// LOCKED: Pure Float shadow recipes
const shadowRecipes = {
  resting: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  focused: '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
  error: '0 0 20px rgba(239,68,68,0.15), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
};

const backgroundRecipes = {
  resting: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
  focused: 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)',
  error: 'linear-gradient(180deg, rgba(55,40,42,1) 0%, rgba(42,32,34,1) 100%)',
};

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Error state styling */
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, variant, error, type = 'text', style, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur]
    );

    // LOCKED: Pure Float style with shadow-based focus
    const inputStyles = React.useMemo(() => {
      if (error) {
        return {
          background: backgroundRecipes.error,
          boxShadow: shadowRecipes.error,
        };
      }
      return {
        background: isFocused ? backgroundRecipes.focused : backgroundRecipes.resting,
        boxShadow: isFocused ? shadowRecipes.focused : shadowRecipes.resting,
      };
    }, [error, isFocused]);

    return (
      <input
        ref={ref}
        type={type}
        className={cn(inputVariants({ size, variant }), className)}
        style={{ ...inputStyles, ...style }}
        aria-invalid={error}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };

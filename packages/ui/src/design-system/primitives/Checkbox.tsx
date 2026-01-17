'use client';

/**
 * Checkbox Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Checked bg: White solid (high contrast)
 * - Icon: Standard checkmark
 * - Animation: Snap 100ms (fast, responsive)
 */

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const checkboxVariants = cva(
  [
    'peer',
    'shrink-0',
    'border border-[var(--color-border)]',
    'bg-[var(--color-bg-elevated)]',
    'rounded',
    'transition-all duration-[var(--duration-snap)] ease-[var(--easing-default)]',
    // CRITICAL: Focus ring is WHITE, never gold
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-page)]',
    'disabled:cursor-not-allowed disabled:opacity-50',
    // Checked state: white background, dark check
    'data-[state=checked]:bg-[var(--color-text-primary)]',
    'data-[state=checked]:border-[var(--color-text-primary)]',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const checkIconVariants = cva(
  'text-[var(--color-bg-page)]', // White check on dark bg, dark check on white bg
  {
    variants: {
      size: {
        sm: 'h-3 w-3',
        default: 'h-3.5 w-3.5',
        lg: 'h-4 w-4',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, size, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(checkboxVariants({ size }), className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      <svg
        className={cn(checkIconVariants({ size }))}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox, checkboxVariants };

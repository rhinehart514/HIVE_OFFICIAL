'use client';

/**
 * Radio Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Selected: White fill (matches Checkbox)
 * - Indicator: Center dot (classic radio)
 * - Animation: Snap 100ms
 */

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// RadioGroup wrapper
const radioGroupVariants = cva('grid gap-2');

// Individual radio item
const radioItemVariants = cva(
  [
    'aspect-square',
    'rounded-full',
    'border border-[var(--color-border)]',
    'bg-[var(--color-bg-elevated)]',
    'transition-all duration-[var(--duration-snap)] ease-[var(--easing-default)]',
    // CRITICAL: Focus ring is WHITE, never gold
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-page)]',
    'disabled:cursor-not-allowed disabled:opacity-50',
    // Checked state
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

// Indicator dot
const radioIndicatorVariants = cva(
  [
    'flex items-center justify-center',
  ].join(' '),
  {
    variants: {
      size: {
        sm: '',
        default: '',
        lg: '',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const radioDotVariants = cva(
  [
    'rounded-full',
    'bg-[var(--color-text-primary)]', // White dot
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-2 w-2',
        default: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Types
export interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
    VariantProps<typeof radioGroupVariants> {}

export interface RadioItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioItemVariants> {}

// RadioGroup component
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn(radioGroupVariants(), className)}
    {...props}
  />
));

RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

// RadioItem component
const RadioItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioItemProps
>(({ className, size, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(radioItemVariants({ size }), className)}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className={cn(radioIndicatorVariants({ size }))}>
      <span className={cn(radioDotVariants({ size }))} />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));

RadioItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioItem, radioGroupVariants, radioItemVariants };

'use client';

/**
 * Toggle Primitives
 * REFINED: Feb 14, 2026 - Premium minimal, no gradients
 */

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// ============================================
// CHECKBOX
// ============================================

const checkboxVariants = cva(
  [
    'peer shrink-0',
    'rounded-[6px]',
    'border border-white/[0.06]',
    'bg-white/[0.04]',
    'transition-all duration-150',
    'hover:border-white/[0.08]',
    'data-[state=checked]:bg-[#FFD700] data-[state=checked]:border-transparent',
    'focus-visible:outline-none focus-visible:border-white/[0.15]',
    'disabled:cursor-not-allowed disabled:opacity-40',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: { size: 'default' },
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
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-black">
        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

Checkbox.displayName = 'Checkbox';

// ============================================
// RADIO GROUP
// ============================================

const radioItemVariants = cva(
  [
    'aspect-square rounded-full',
    'border border-white/[0.06]',
    'bg-white/[0.04]',
    'transition-all duration-150',
    'hover:border-white/[0.08]',
    'data-[state=checked]:border-[#FFD700]',
    'focus-visible:outline-none focus-visible:border-white/[0.15]',
    'disabled:cursor-not-allowed disabled:opacity-40',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn('grid gap-2', className)}
    {...props}
  />
));
RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioItemVariants> {}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, size, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(radioItemVariants({ size }), className)}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <div className="h-2 w-2 rounded-full bg-[#FFD700]" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';

// ============================================
// SWITCH
// ============================================

const switchVariants = cva(
  [
    'peer inline-flex shrink-0 cursor-pointer items-center',
    'rounded-full',
    'transition-colors duration-150',
    'bg-white/[0.06]',
    'data-[state=checked]:bg-[#FFD700]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
    'disabled:cursor-not-allowed disabled:opacity-40',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        default: 'h-6 w-11',
        lg: 'h-7 w-[52px]',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const thumbSizes = {
  sm: 'h-3.5 w-3.5 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5',
  default: 'h-4.5 w-4.5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5',
  lg: 'h-5.5 w-5.5 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0.5',
};

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, size = 'default', ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(switchVariants({ size }), className)}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block rounded-full bg-white shadow-sm',
        'transition-transform duration-150',
        thumbSizes[size ?? 'default']
      )}
    />
  </SwitchPrimitive.Root>
));

Switch.displayName = 'Switch';

// ============================================
// EXPORTS
// ============================================

export {
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Switch,
  checkboxVariants,
  radioItemVariants,
  switchVariants,
};

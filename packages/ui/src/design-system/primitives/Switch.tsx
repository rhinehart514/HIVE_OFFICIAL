'use client';

/**
 * Switch Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - On track: Gold gradient (allowed gold use)
 * - Off track: Subtle glass (rgba(255,255,255,0.1))
 * - Animation: Slow glide 300ms (deliberate, smooth)
 * - Thumb: White off, dark on (for contrast)
 */

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const switchVariants = cva(
  [
    'peer',
    'inline-flex shrink-0',
    'cursor-pointer',
    'rounded-full',
    'border-2 border-transparent',
    // Slow glide animation (300ms)
    'transition-all duration-300 ease-[var(--easing-default)]',
    // CRITICAL: Focus ring is WHITE, never gold
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-page)]',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        default: 'h-6 w-11',
        lg: 'h-7 w-14',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const thumbVariants = cva(
  [
    'pointer-events-none',
    'block',
    'rounded-full',
    'bg-white', // White thumb when off
    'shadow-sm',
    // Slow glide animation (300ms)
    'transition-all duration-300 ease-[var(--easing-default)]',
    // Checked thumb: dark color for contrast with gold
    'data-[state=checked]:bg-[#0a0a09]',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        default: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, size, checked, defaultChecked, onCheckedChange, ...props }, ref) => {
  // Track checked state for styling
  const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false);

  const handleCheckedChange = React.useCallback((value: boolean) => {
    setIsChecked(value);
    onCheckedChange?.(value);
  }, [onCheckedChange]);

  // Sync with controlled checked prop
  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked);
    }
  }, [checked]);

  return (
    <SwitchPrimitive.Root
      ref={ref}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={handleCheckedChange}
      className={cn(switchVariants({ size }), className)}
      style={{
        background: isChecked
          ? '#FFD700'
          : 'var(--bg-muted)',
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb className={cn(thumbVariants({ size }))} />
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch, switchVariants };

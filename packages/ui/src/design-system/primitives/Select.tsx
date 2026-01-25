'use client';

/**
 * Select Primitive - LOCKED 2026-01-10
 *
 * LOCKED: Pure Float trigger, Apple Glass Dark dropdown, Scale+Fade motion
 * Matches Input (trigger), Modal (dropdown), Badge (option highlight).
 *
 * Recipe:
 *   trigger: Pure Float (shadow-based, no border)
 *   dropdown: Apple Glass Dark with deep shadow
 *   motion: Scale 0.96→1 + Fade, 150ms ease-smooth
 *   options: Glass highlight on selected, white checkmark
 *   shape: rounded-xl trigger, rounded-lg options
 */

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Pure Float trigger surfaces
const triggerSurfaces = {
  resting: {
    background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  open: {
    background: 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
  },
};

// LOCKED: Apple Glass Dark dropdown surface
const dropdownSurface = {
  background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
};

// LOCKED: Glass highlight for selected option
const selectedOptionSurface = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
};

// LOCKED: Motion config (matches Modal)
const dropdownMotion = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
};

// Size variants
const selectTriggerVariants = cva(
  [
    'flex items-center justify-between gap-2',
    'w-full',
    // LOCKED: rounded-xl (matches Input)
    'rounded-xl',
    'text-white',
    'font-medium',
    'transition-all duration-150',
    // Focus (WHITE, never gold) - but shadow-based primarily
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]',
    'disabled:cursor-not-allowed disabled:opacity-50',
    '[&>span]:line-clamp-1',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-9 px-3 text-xs',
        default: 'h-11 px-4 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Types
export interface SelectProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> {}

export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {}

export interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {}

export interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {}

export interface SelectLabelProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> {}

export interface SelectSeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> {}

// Components
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

// LOCKED: Pure Float trigger
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, size, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(selectTriggerVariants({ size }), className)}
      style={isOpen ? triggerSurfaces.open : triggerSurfaces.resting}
      onPointerDown={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <svg
          className={cn(
            'h-4 w-4 text-white/50 transition-transform duration-150',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

SelectTrigger.displayName = 'SelectTrigger';

// LOCKED: Apple Glass Dark dropdown with Scale+Fade motion
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50',
        'max-h-96 min-w-[8rem]',
        'overflow-hidden',
        // LOCKED: rounded-xl dropdown
        'rounded-xl',
        'p-1',
        // Animation classes
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-[0.96] data-[state=open]:zoom-in-[0.96]',
        'data-[side=bottom]:slide-in-from-top-2',
        'origin-top',
        className
      )}
      style={dropdownSurface}
      position={position}
      sideOffset={8}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));

SelectContent.displayName = 'SelectContent';

// LOCKED: Glass highlight option
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center',
      // LOCKED: rounded-lg options
      'rounded-lg',
      'py-2 pl-3 pr-8',
      'text-sm',
      'outline-none',
      'transition-all duration-150',
      // Default state
      'text-white/60',
      // Hover
      'hover:text-white hover:bg-white/5',
      // Focus/highlighted
      'focus:text-white',
      // Selected uses inline style for glass effect
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <svg
          className="h-4 w-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));

SelectItem.displayName = 'SelectItem';

// Label styles
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  SelectLabelProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'px-3 py-1.5',
      'text-label-xs font-medium text-white/40 uppercase tracking-wider',
      className
    )}
    {...props}
  />
));

SelectLabel.displayName = 'SelectLabel';

// Separator styles
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  SelectSeparatorProps
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('h-px bg-white/10 mx-2 my-1', className)}
    {...props}
  />
));

SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  selectTriggerVariants,
  // Export surfaces for composed components
  triggerSurfaces,
  dropdownSurface,
  selectedOptionSurface,
  dropdownMotion,
};

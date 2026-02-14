'use client';

/**
 * Button Primitive
 * REFINED: Feb 9, 2026 - Cold, minimal spec
 *
 * Design principles:
 * - Pill radius for all button forms
 * - Primary action is flat yellow (#FFD700), no gradient/glow
 * - No scale transforms on interaction
 * - Cold black focus offset
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  [
    'relative',
    'inline-flex items-center justify-center gap-2',
    'font-medium',
    'rounded-full',
    'transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000]',
    'disabled:pointer-events-none disabled:opacity-40',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-white/[0.06]',
          'text-white',
          'border-none',
          'hover:bg-white/[0.08]',
          'active:bg-white/[0.10]',
        ].join(' '),
        primary: [
          'bg-[#FFD700]',
          'text-black',
          'border border-[#FFD700]',
          'hover:bg-[#F2CC00]',
          'active:bg-[#E6BF00]',
        ].join(' '),
        secondary: [
          'bg-white/[0.06]',
          'text-white',
          'border-none',
          'hover:bg-white/[0.08]',
          'active:bg-white/[0.10]',
        ].join(' '),
        ghost: [
          'bg-transparent',
          'text-white/50',
          'border border-transparent',
          'hover:text-white/80 hover:bg-white/[0.04]',
          'active:bg-white/[0.08]',
        ].join(' '),
        destructive: [
          'bg-[#2A1212]',
          'text-[#EF4444]',
          'border border-[#EF4444]/30',
          'hover:bg-[#331515] hover:border-[#EF4444]/40',
          'active:bg-[#241010]',
        ].join(' '),
        link: [
          'bg-transparent',
          'text-white/70',
          'border-none',
          'underline underline-offset-4',
          'hover:text-white',
          'p-0 h-auto',
        ].join(' '),
        // Legacy aliases for backwards compatibility
        solid: 'bg-[#FFD700] text-black border border-[#FFD700] hover:bg-[#F2CC00] active:bg-[#E6BF00]',
        outline: 'bg-white/[0.06] text-white border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.16] active:bg-[#171717]',
        cta: 'bg-[#FFD700] text-black border border-[#FFD700] hover:bg-[#F2CC00] active:bg-[#E6BF00]',
        brand: 'bg-[#FFD700] text-black border border-[#FFD700] hover:bg-[#F2CC00] active:bg-[#E6BF00]',
      },
      size: {
        xs: 'h-8 px-3 text-xs',
        sm: 'h-9 px-4 text-sm',
        default: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-base',
        icon: 'h-11 w-11 p-0',
        'icon-sm': 'h-9 w-9 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leadingIcon,
      trailingIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    const iconSizeClass = {
      xs: '[&>svg]:h-3.5 [&>svg]:w-3.5',
      sm: '[&>svg]:h-4 [&>svg]:w-4',
      default: '[&>svg]:h-4 [&>svg]:w-4',
      lg: '[&>svg]:h-5 [&>svg]:w-5',
      xl: '[&>svg]:h-5 [&>svg]:w-5',
      icon: '[&>svg]:h-5 [&>svg]:w-5',
      'icon-sm': '[&>svg]:h-4 [&>svg]:w-4',
      'icon-lg': '[&>svg]:h-6 [&>svg]:w-6',
    }[size || 'default'];

    const IconWrapper = ({ children: icon }: { children: React.ReactNode }) => (
      <span className={cn('flex-shrink-0', iconSizeClass)}>{icon}</span>
    );

    if (asChild) {
      return (
        <Comp
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          disabled={isDisabled}
          aria-busy={loading}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="opacity-0 flex items-center gap-2">
              {leadingIcon && <IconWrapper>{leadingIcon}</IconWrapper>}
              {children}
              {trailingIcon && <IconWrapper>{trailingIcon}</IconWrapper>}
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden
              />
            </span>
          </>
        ) : (
          <>
            {leadingIcon && <IconWrapper>{leadingIcon}</IconWrapper>}
            {children}
            {trailingIcon && <IconWrapper>{trailingIcon}</IconWrapper>}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };

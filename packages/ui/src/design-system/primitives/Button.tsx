'use client';

/**
 * Button Primitive
 * REFINED: Jan 29, 2026 - Matches /about aesthetic
 *
 * Design principles:
 * - No gold fills - gold only as accent text when needed
 * - Subtle borders over heavy shadows
 * - White hierarchy for emphasis
 * - Minimal, restrained motion
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
    'rounded-xl',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]',
    'disabled:pointer-events-none disabled:opacity-40',
    // Spring-like active state
    'active:scale-[0.98] active:transition-transform',
  ].join(' '),
  {
    variants: {
      variant: {
        /**
         * Default: Subtle border, transparent background
         * The standard button - minimal, border-defined
         */
        default: [
          'bg-white/[0.03]',
          'text-white',
          'border border-white/10',
          'hover:bg-white/[0.06] hover:border-white/15',
          'active:bg-white/[0.04]',
        ].join(' '),
        /**
         * Primary: Solid white - for primary actions
         * Use for main CTAs
         */
        primary: [
          'bg-white',
          'text-[#0A0A09]',
          'border border-white/20',
          'hover:bg-white/90',
          'active:bg-white/80',
        ].join(' '),
        /**
         * Secondary: Lighter ghost for secondary actions
         */
        secondary: [
          'bg-transparent',
          'text-white/50',
          'border border-white/[0.06]',
          'hover:text-white/70 hover:bg-white/[0.03] hover:border-white/10',
          'active:bg-white/[0.02]',
        ].join(' '),
        /**
         * Ghost: Invisible until hovered
         */
        ghost: [
          'bg-transparent',
          'text-white/50',
          'border border-transparent',
          'hover:text-white hover:bg-white/[0.04]',
          'active:bg-white/[0.02]',
        ].join(' '),
        /**
         * Destructive: Red for dangerous actions
         */
        destructive: [
          'bg-red-500/10',
          'text-red-400',
          'border border-red-500/20',
          'hover:bg-red-500/15 hover:border-red-500/30',
          'active:bg-red-500/10',
        ].join(' '),
        /**
         * Link: Text-only style
         */
        link: [
          'bg-transparent',
          'text-white/50',
          'border-none',
          'underline underline-offset-4',
          'hover:text-white',
          'p-0 h-auto',
        ].join(' '),
        // Legacy aliases for backwards compatibility
        solid: [
          'bg-white',
          'text-[#0A0A09]',
          'border border-white/20',
          'hover:bg-white/90',
          'active:bg-white/80',
        ].join(' '),
        outline: [
          'bg-white/[0.03]',
          'text-white',
          'border border-white/10',
          'hover:bg-white/[0.06] hover:border-white/15',
          'active:bg-white/[0.04]',
        ].join(' '),
        /**
         * CTA: Gold gradient for primary call-to-action (1% rule)
         * Use sparingly - only for the most important action on screen
         */
        cta: [
          'bg-gradient-to-r from-[#FFD700] to-[#FFA500]',
          'text-black font-semibold',
          'border border-[#FFD700]/30',
          'shadow-[0_0_20px_rgba(255,215,0,0.3)]',
          'hover:shadow-[0_0_30px_rgba(255,215,0,0.4)]',
          'hover:from-[#FFE44D] hover:to-[#FFB833]',
          'active:from-[#E6C200] active:to-[#E69500]',
        ].join(' '),
        brand: [
          'bg-white',
          'text-[#0A0A09]',
          'border border-white/20',
          'hover:bg-white/90',
          'active:bg-white/80',
        ].join(' '),
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

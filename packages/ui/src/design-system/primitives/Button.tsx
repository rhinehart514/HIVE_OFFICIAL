'use client';

/**
 * Button Primitive
 * LOCKED: Jan 12, 2026 - Aligned with DECISIONS.md
 *
 * 5 variants: default, cta, secondary, ghost, destructive, link
 * CRITICAL: Gold (CTA) is the 1% rule - use sparingly!
 * Focus ring is WHITE, never gold.
 *
 * AESTHETIC: Apple-style pills with opacity hover (NO SCALE)
 * Scale transforms feel "playful/cheap" - restraint = premium
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  // LOCKED: Apple-style pills with opacity-based interaction
  [
    'relative',
    'inline-flex items-center justify-center gap-1.5',
    'font-medium tracking-tight',
    'rounded-full',                                    // Pill shape
    'backdrop-blur-sm',                                // Glass effect
    // Premium easing (NOT spring - DECISIONS.md says ease-smooth)
    'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
    // CRITICAL: Focus ring is WHITE, never gold
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-page)]',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        /**
         * Default: Solid white button
         * Hover: Opacity 90% + deeper shadow (NO SCALE per DECISIONS.md)
         * Press: Opacity 80% (tactile without scale)
         */
        default: [
          'bg-white',
          'text-[#0A0A09]',  // Dark text on white button (--color-bg-page value)
          'shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.8)]',
          // OPACITY hover (not scale) per DECISIONS.md line 40
          'hover:opacity-90 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_12px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.9)]',
          // OPACITY press (not scale) per DECISIONS.md line 41
          'active:opacity-80 active:shadow-[0_0_0_1px_rgba(0,0,0,0.12),0_6px_16px_rgba(0,0,0,0.5)]',
        ].join(' '),
        /**
         * CTA: Gold gradient with glass - THE 1% RULE
         * Hover: Gradient shift + glow intensify (per DECISIONS.md)
         */
        cta: [
          // Gold gradient glass (not solid gold - per DECISIONS.md line 37)
          'bg-gradient-to-b from-[rgba(255,215,0,0.15)] to-[rgba(184,134,11,0.12)]',
          'text-[#FFD700]',
          'font-semibold',
          'shadow-[0_0_0_1px_rgba(255,215,0,0.3),0_4px_16px_rgba(0,0,0,0.4),0_0_24px_rgba(255,215,0,0.15),inset_0_1px_0_rgba(255,255,255,0.15)]',
          // Gradient shift + glow intensify on hover
          'hover:from-[rgba(255,215,0,0.2)] hover:to-[rgba(184,134,11,0.18)]',
          'hover:shadow-[0_0_0_1px_rgba(255,215,0,0.4),0_6px_24px_rgba(0,0,0,0.5),0_0_40px_rgba(255,215,0,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]',
          // Press: Darker gradient
          'active:from-[rgba(184,134,11,0.2)] active:to-[rgba(139,101,8,0.15)]',
          'active:shadow-[0_0_0_1px_rgba(255,215,0,0.25),0_2px_8px_rgba(0,0,0,0.4),0_0_16px_rgba(255,215,0,0.1)]',
        ].join(' '),
        /**
         * Secondary: Glass outlined
         * Opacity-based hover (NO SCALE)
         */
        secondary: [
          'bg-white/[0.04]',
          'text-[var(--color-text-primary)]',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]',
          'hover:bg-white/[0.08] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_6px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]',
          'active:bg-white/[0.06] active:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_2px_8px_rgba(0,0,0,0.3)]',
        ].join(' '),
        /**
         * Ghost: Invisible until hovered
         * Opacity-based interaction
         */
        ghost: [
          'bg-transparent',
          'text-[var(--color-text-secondary)]',
          'hover:text-white hover:bg-white/[0.06]',
          'active:bg-white/[0.04]',
        ].join(' '),
        /**
         * Destructive: Red glow glass
         * Opacity-based hover
         */
        destructive: [
          'bg-[rgba(239,68,68,0.1)]',
          'text-[#ef4444]',
          'shadow-[0_0_0_1px_rgba(239,68,68,0.25),0_4px_16px_rgba(0,0,0,0.4),0_0_16px_rgba(239,68,68,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]',
          'hover:bg-[rgba(239,68,68,0.15)] hover:shadow-[0_0_0_1px_rgba(239,68,68,0.35),0_6px_24px_rgba(0,0,0,0.5),0_0_24px_rgba(239,68,68,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]',
          'active:bg-[rgba(239,68,68,0.12)] active:shadow-[0_0_0_1px_rgba(239,68,68,0.2),0_2px_8px_rgba(0,0,0,0.4)]',
        ].join(' '),
        /**
         * Link: Text-only style
         */
        link: [
          'bg-transparent',
          'text-[var(--color-text-secondary)]',
          'underline underline-offset-4',
          'hover:text-[var(--color-text-primary)]',
          'p-0 h-auto',
        ].join(' '),
        // LEGACY ALIASES (same treatment as secondary)
        outline: [
          'bg-white/[0.04]',
          'text-[var(--color-text-primary)]',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]',
          'hover:bg-white/[0.08] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_6px_24px_rgba(0,0,0,0.4)]',
          'active:bg-white/[0.06]',
        ].join(' '),
        // Brand = CTA alias
        brand: [
          'bg-gradient-to-b from-[rgba(255,215,0,0.15)] to-[rgba(184,134,11,0.12)]',
          'text-[#FFD700]',
          'font-semibold',
          'shadow-[0_0_0_1px_rgba(255,215,0,0.3),0_4px_16px_rgba(0,0,0,0.4),0_0_24px_rgba(255,215,0,0.15),inset_0_1px_0_rgba(255,255,255,0.15)]',
          'hover:from-[rgba(255,215,0,0.2)] hover:to-[rgba(184,134,11,0.18)]',
          'hover:shadow-[0_0_0_1px_rgba(255,215,0,0.4),0_6px_24px_rgba(0,0,0,0.5),0_0_40px_rgba(255,215,0,0.25)]',
          'active:from-[rgba(184,134,11,0.2)] active:to-[rgba(139,101,8,0.15)]',
        ].join(' '),
      },
      size: {
        xs: 'h-8 px-3 text-xs',       // 32px - compact
        sm: 'h-9 px-4 text-sm',       // 36px
        default: 'h-11 px-5 text-sm', // 44px - touch target
        lg: 'h-12 px-6 text-base',    // 48px
        xl: 'h-14 px-8 text-base',    // 56px - hero buttons
        icon: 'h-11 w-11 p-0',        // 44px square
        'icon-sm': 'h-9 w-9 p-0',     // 36px square
        'icon-lg': 'h-12 w-12 p-0',   // 48px square
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
  /** Render as child element (Radix pattern) */
  asChild?: boolean;
  /** Loading state - shows spinner, disables button */
  loading?: boolean;
  /** Icon before text */
  leadingIcon?: React.ReactNode;
  /** Icon after text */
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

    // Icon wrapper - scales with button size
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

    // When asChild, pass children directly - Slot merges props into the child
    // Cannot wrap in Fragment as Slot needs a single element child
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
            <span className="opacity-0 flex items-center gap-1.5">
              {leadingIcon && <IconWrapper>{leadingIcon}</IconWrapper>}
              {children}
              {trailingIcon && <IconWrapper>{trailingIcon}</IconWrapper>}
            </span>
            <span className="absolute inset-0 flex items-center justify-center">
              {/* LOCKED: Ring spinner style (per DECISIONS.md line 38) */}
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

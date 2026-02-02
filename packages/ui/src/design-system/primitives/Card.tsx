'use client';

/**
 * Card Primitive
 * REFINED: Jan 29, 2026 - Matches /about aesthetic
 *
 * Design principles:
 * - Simple dark surface with subtle border
 * - No heavy shadows or gradients
 * - Minimal warmth indication (subtle, not glowing)
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { useAtmosphereOptional, type AtmosphereLevel, type WarmthLevel } from '../AtmosphereProvider';

const cardVariants = cva(
  [
    // Glass surface treatment
    'relative overflow-hidden',
    'bg-gradient-to-br from-[#1c1c1c]/95 to-[#121212]/92',
    'border border-white/[0.08]',
    // Layered shadow system
    'shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]',
    'transition-all duration-200 ease-out',
  ].join(' '),
  {
    variants: {
      elevation: {
        resting: '',
        raised: 'border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]',
        floating: 'border-white/12 shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_16px_48px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.15)]',
      },
      size: {
        default: 'rounded-xl',
        compact: 'rounded-lg',
        modal: 'rounded-xl',
        tooltip: 'rounded-lg',
      },
    },
    defaultVariants: {
      elevation: 'resting',
      size: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  atmosphere?: AtmosphereLevel;
  warmth?: WarmthLevel;
  noPadding?: boolean;
  interactive?: boolean;
  as?: React.ElementType;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      atmosphere: atmosphereProp,
      warmth = 'none',
      elevation = 'resting',
      size,
      noPadding = false,
      interactive = false,
      as: Component = 'div',
      style,
      children,
      ...props
    },
    ref
  ) => {
    const atmosphereContext = useAtmosphereOptional();
    const atmosphere = atmosphereProp ?? atmosphereContext?.atmosphere ?? 'spaces';

    // Warmth system: border + glow for high warmth
    const warmthStyles = {
      none: '',
      low: 'border-[var(--color-gold)]/10',
      medium: 'border-[var(--color-gold)]/20',
      high: 'border-[var(--color-gold)]/30 shadow-[0_0_20px_rgba(255,215,0,0.15),0_0_0_1px_rgba(255,215,0,0.1)]',
    }[warmth];

    const sharedProps = {
      ref,
      className: cn(
        cardVariants({ elevation, size }),
        !noPadding && 'p-5',
        warmth !== 'none' && warmthStyles,
        interactive && [
          'cursor-pointer select-none',
          'hover:bg-[#1e1e1e]/95 hover:border-white/12',
          'hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]',
        ],
        className
      ),
      style,
      'data-atmosphere': atmosphere,
      'data-warmth': warmth,
      'data-elevation': elevation,
      'data-interactive': interactive || undefined,
      ...props,
    };

    return React.createElement(Component, sharedProps, children);
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1.5 pb-4', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-base font-medium leading-none tracking-tight text-white',
      className
    )}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-white/40', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};

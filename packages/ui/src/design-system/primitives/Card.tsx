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
    'bg-[#0A0A0A]',
    'border border-white/[0.08]',
    'transition-all duration-200 ease-out',
  ].join(' '),
  {
    variants: {
      elevation: {
        resting: '',
        raised: 'border-white/10',
        floating: 'border-white/12',
      },
      size: {
        default: 'rounded-2xl',
        compact: 'rounded-xl',
        modal: 'rounded-2xl',
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

    // Subtle warmth via border color only
    const warmthBorder = {
      none: '',
      low: 'border-[var(--color-gold)]/10',
      medium: 'border-[var(--color-gold)]/20',
      high: 'border-[var(--color-gold)]/30',
    }[warmth];

    const sharedProps = {
      ref,
      className: cn(
        cardVariants({ elevation, size }),
        !noPadding && 'p-5',
        warmth !== 'none' && warmthBorder,
        interactive && [
          'cursor-pointer select-none',
          'hover:bg-white/[0.02] hover:border-white/12',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]',
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

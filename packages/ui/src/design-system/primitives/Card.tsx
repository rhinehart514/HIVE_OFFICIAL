'use client';

/**
 * Card Primitive
 * REFINED: Feb 9, 2026 - Cold, minimal spec
 *
 * Design principles:
 * - Flat dark surfaces (no gradients, no glow)
 * - 12px radius card system
 * - Three practical tiers via elevation: standard, subtle, overlay
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { useAtmosphereOptional, type AtmosphereLevel, type WarmthLevel } from '../AtmosphereProvider';

const cardVariants = cva(
  [
    'relative overflow-hidden',
    'transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
  ].join(' '),
  {
    variants: {
      elevation: {
        subtle: 'bg-white/[0.02]',
        resting: 'bg-white/[0.02] border border-white/[0.06]',
        raised: 'bg-white/[0.04] border border-white/[0.06]',
        floating: 'bg-[#0D0D0D] border border-white/[0.08] shadow-[0_16px_32px_rgba(0,0,0,0.45)]',
      },
      size: {
        default: 'rounded-[16px]',
        compact: 'rounded-[12px]',
        modal: 'rounded-[12px]',
        tooltip: 'rounded-[12px]',
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

    const sharedProps = {
      ref,
      className: cn(
        cardVariants({ elevation, size }),
        !noPadding && 'p-5',
        interactive && [
          'cursor-pointer select-none',
          elevation === 'subtle'
            ? 'hover:bg-white/[0.04]'
            : 'hover:bg-white/[0.04] hover:border-white/[0.06]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000]',
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

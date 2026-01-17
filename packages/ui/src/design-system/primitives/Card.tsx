'use client';

/**
 * Card Primitive - LOCKED 2026-01-10
 *
 * Apple Glass Dark style: gradient bg, inset highlight, deep shadows
 *
 * Recipe:
 *   background: linear-gradient(135deg, rgba(28,28,28,0.95), rgba(18,18,18,0.92))
 *   boxShadow: 0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)
 *
 * CRITICAL: Warmth uses gold edge glow for active spaces
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { useAtmosphereOptional, getWarmthCSS, type AtmosphereLevel, type WarmthLevel } from '../AtmosphereProvider';

const cardVariants = cva(
  // LOCKED: Apple Glass Dark - rounded-2xl default, backdrop blur
  [
    'rounded-2xl',
    'backdrop-blur-xl',
    'transition-all duration-[var(--duration-smooth)] ease-[var(--easing-default)]',
  ].join(' '),
  {
    variants: {
      elevation: {
        resting: '', // Shadow handled in style prop for gradient compatibility
        raised: '',
        floating: '',
      },
      size: {
        default: 'rounded-2xl',  // Standard cards
        compact: 'rounded-xl',    // Sidebar items
        modal: 'rounded-3xl',     // Dialogs
        tooltip: 'rounded-lg',    // Small overlays
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
  /** Override inherited atmosphere level */
  atmosphere?: AtmosphereLevel;
  /** Activity indication via gold edge glow */
  warmth?: WarmthLevel;
  /** Remove padding for custom layouts */
  noPadding?: boolean;
  /** Interactive card with hover states (brightness, not scale) */
  interactive?: boolean;
  /** Render as a different element (button, anchor, etc.) */
  as?: React.ElementType;
}

// LOCKED: Apple Glass Dark shadow recipes
const shadowRecipes = {
  resting: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
  raised: '0 0 0 1px rgba(255,255,255,0.1), 0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)',
  floating: '0 0 0 1px rgba(255,255,255,0.1), 0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)',
};

// LOCKED: Warmth (gold edge glow for active spaces)
// Using WarmthLevel type: 'none' | 'low' | 'medium' | 'high'
const warmthRecipes: Record<WarmthLevel, string> = {
  none: '',
  low: '0 0 0 1px rgba(255,215,0,0.15), 0 0 12px rgba(255,215,0,0.08)',
  medium: '0 0 0 1px rgba(255,215,0,0.2), 0 0 20px rgba(255,215,0,0.1)',
  high: '0 0 0 2px rgba(255,215,0,0.3), 0 0 24px rgba(255,215,0,0.15)',
};

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
    // Get atmosphere from context or prop
    const atmosphereContext = useAtmosphereOptional();
    const atmosphere = atmosphereProp ?? atmosphereContext?.atmosphere ?? 'spaces';

    // LOCKED: Apple Glass Dark style
    const cardStyles = React.useMemo(() => {
      const baseShadow = shadowRecipes[elevation || 'resting'];
      const warmthShadow = warmthRecipes[warmth];

      return {
        background: 'linear-gradient(135deg, rgba(28,28,28,0.95) 0%, rgba(18,18,18,0.92) 100%)',
        boxShadow: warmth !== 'none'
          ? `${baseShadow}, ${warmthShadow}`
          : baseShadow,
      };
    }, [elevation, warmth]);

    const sharedProps = {
      ref,
      className: cn(
        cardVariants({ elevation, size }),
        !noPadding && 'p-5',
        interactive && [
          'cursor-pointer select-none',
          'transition-all duration-[var(--duration-snap)] ease-[var(--easing-default)]',
          // LOCKED: brightness hover, not scale
          'hover:brightness-110',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-page)]',
        ],
        className
      ),
      style: {
        ...cardStyles,
        ...style,
      },
      'data-atmosphere': atmosphere,
      'data-warmth': warmth,
      'data-elevation': elevation,
      'data-interactive': interactive || undefined,
      ...props,
    };

    // Use createElement for polymorphic support
    return React.createElement(Component, sharedProps, children);
  }
);

Card.displayName = 'Card';

// ============================================
// Card Composition Helpers
// Simple layout wrappers for consistent card structure
// ============================================

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
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
      'text-base font-medium leading-none tracking-tight text-[var(--color-text-primary)]',
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
    className={cn('text-sm text-[var(--color-text-secondary)]', className)}
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

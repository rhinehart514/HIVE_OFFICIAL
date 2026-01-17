'use client';

/**
 * Icon Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Stroke weight: 1.75 (slightly bolder than Heroicons default)
 * - Sizes: sm (16px), default (20px), lg (24px)
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const iconVariants = cva(
  // Base: current color, consistent stroke
  [
    'shrink-0',
    '[stroke-width:1.5px]',
    'text-current',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'w-4 h-4',      // 16px
        default: 'w-5 h-5', // 20px
        lg: 'w-6 h-6',      // 24px
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface IconProps
  extends React.SVGAttributes<SVGElement>,
    VariantProps<typeof iconVariants> {
  /** Heroicon component to render */
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
  /** Custom stroke width (default: 1.75) */
  strokeWidth?: number;
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size, icon: IconComponent, strokeWidth = 1.75, ...props }, ref) => {
    return (
      <IconComponent
        ref={ref}
        className={cn(iconVariants({ size }), className)}
        strokeWidth={strokeWidth}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

/**
 * Icon size reference (from PRIMITIVES.md):
 * - sm (16px): Badges, tight spaces
 * - default (20px): Buttons, navigation
 * - lg (24px): Headers, primary actions
 *
 * Variant usage:
 * - outline (24/outline): Navigation, buttons
 * - solid (24/solid): Status indicators, badges
 */

export { Icon, iconVariants };

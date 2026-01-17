'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const HIVE_MARK_PATH =
  'M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z';

export const logoVariants = cva('inline-flex items-center', {
  variants: {
    size: { xs: '', sm: '', md: '', lg: '', xl: '' },
    color: { gold: '', white: '', muted: '' },
  },
  defaultVariants: { size: 'md', color: 'gold' },
});

const SIZE_MAP = {
  xs: { mark: 16, text: 14, gap: 4 },
  sm: { mark: 24, text: 16, gap: 6 },
  md: { mark: 32, text: 20, gap: 8 },
  lg: { mark: 48, text: 28, gap: 10 },
  xl: { mark: 64, text: 36, gap: 12 },
} as const;

const COLOR_MAP = {
  gold: 'var(--gold, #FFD700)',
  white: 'var(--text-primary, #FAF9F7)',
  muted: 'var(--text-muted, #6B6B70)',
} as const;

export interface LogoProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof logoVariants> {
  variant?: 'mark' | 'wordmark' | 'full';
}

export const LogoMark = React.forwardRef<
  SVGSVGElement,
  React.SVGAttributes<SVGSVGElement> & { markSize?: number; markColor?: string }
>(({ markSize = 32, markColor = COLOR_MAP.gold, className, ...props }, ref) => (
  <svg ref={ref} viewBox="0 0 1500 1500" width={markSize} height={markSize} className={cn('flex-shrink-0', className)} aria-hidden="true" {...props}>
    <path d={HIVE_MARK_PATH} fill={markColor} />
  </svg>
));
LogoMark.displayName = 'LogoMark';

export const LogoWordmark = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { textSize?: number; textColor?: string }
>(({ textSize = 20, textColor = COLOR_MAP.gold, className, ...props }, ref) => (
  <span ref={ref} className={cn('font-bold tracking-tight', className)} style={{ fontSize: textSize, color: textColor, lineHeight: 1 }} {...props}>
    HIVE
  </span>
));
LogoWordmark.displayName = 'LogoWordmark';

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ variant = 'full', size = 'md', color = 'gold', className, ...props }, ref) => {
    const dimensions = SIZE_MAP[size || 'md'];
    const fillColor = COLOR_MAP[color || 'gold'];

    if (variant === 'mark') {
      return (
        <div ref={ref} className={cn(logoVariants({ size, color }), className)} {...props}>
          <LogoMark markSize={dimensions.mark} markColor={fillColor} />
        </div>
      );
    }
    if (variant === 'wordmark') {
      return (
        <div ref={ref} className={cn(logoVariants({ size, color }), className)} {...props}>
          <LogoWordmark textSize={dimensions.text} textColor={fillColor} />
        </div>
      );
    }
    return (
      <div ref={ref} className={cn(logoVariants({ size, color }), className)} style={{ gap: dimensions.gap }} {...props}>
        <LogoMark markSize={dimensions.mark} markColor={fillColor} />
        <LogoWordmark textSize={dimensions.text} textColor={fillColor} />
      </div>
    );
  }
);
Logo.displayName = 'Logo';

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const LOGO_ASSETS = {
  gold: '/assets/hive-logo-gold.svg',
  white: '/assets/hive-logo-white.svg',
  muted: '/assets/hive-logo-platinum.svg',
} as const;

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
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement> & { markSize?: number; markColor?: keyof typeof LOGO_ASSETS }
>(({ markSize = 32, markColor = 'gold', className, ...props }, ref) => (
  <img
    ref={ref}
    src={LOGO_ASSETS[markColor]}
    alt="HIVE"
    width={markSize}
    height={markSize}
    className={cn('flex-shrink-0', className)}
    {...props}
  />
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
    const colorKey = color || 'gold';
    const fillColor = COLOR_MAP[colorKey];

    if (variant === 'mark') {
      return (
        <div ref={ref} className={cn(logoVariants({ size, color }), className)} {...props}>
          <LogoMark markSize={dimensions.mark} markColor={colorKey} />
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
        <LogoMark markSize={dimensions.mark} markColor={colorKey} />
        <LogoWordmark textSize={dimensions.text} textColor={fillColor} />
      </div>
    );
  }
);
Logo.displayName = 'Logo';

/**
 * ShineBorder Component
 * Premium animated border effect - billion-dollar UI pattern
 *
 * Creates a rotating gradient border effect for cards and containers.
 * Based on Magic UI ShineBorder pattern.
 *
 * @example
 * ```tsx
 * <div className="relative rounded-xl bg-neutral-900">
 *   <ShineBorder shineColor={['#FFD700', '#FFA500']} />
 *   <div className="p-6">Content</div>
 * </div>
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Border width in pixels (default: 1) */
  borderWidth?: number;
  /** Animation duration in seconds (default: 14) */
  duration?: number;
  /** Shine color(s) - can be single color or array for gradient */
  shineColor?: string | string[];
  /** Border radius to match parent (default: inherit) */
  borderRadius?: number | string;
}

/**
 * ShineBorder - Animated rotating gradient border
 *
 * Premium card enhancement for profile bento grids.
 * Use sparingly on featured/important cards.
 */
export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = '#FFD700',
  borderRadius,
  className,
  style,
  ...props
}: ShineBorderProps) {
  const colors = Array.isArray(shineColor) ? shineColor.join(',') : shineColor;

  return (
    <div
      style={{
        '--shine-border-width': `${borderWidth}px`,
        '--shine-duration': `${duration}s`,
        '--shine-color': colors,
        borderRadius: borderRadius ?? 'inherit',
        backgroundImage: `radial-gradient(transparent, transparent, ${colors}, transparent, transparent)`,
        backgroundSize: '300% 300%',
        mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
        maskComposite: 'exclude',
        WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
        WebkitMaskComposite: 'xor',
        padding: `${borderWidth}px`,
        ...style,
      } as React.CSSProperties}
      className={cn(
        'pointer-events-none absolute inset-0 size-full rounded-[inherit]',
        'motion-safe:animate-shine-rotate',
        className
      )}
      {...props}
    />
  );
}

ShineBorder.displayName = 'ShineBorder';

/**
 * ShineBorderCard - Card wrapper with built-in shine effect
 *
 * Convenience wrapper for cards that need shine border.
 */
export interface ShineBorderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** ShineBorder props */
  shineProps?: Omit<ShineBorderProps, 'className' | 'style'>;
  /** Card content */
  children: React.ReactNode;
}

export function ShineBorderCard({
  shineProps,
  children,
  className,
  ...props
}: ShineBorderCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800',
        className
      )}
      {...props}
    >
      <ShineBorder {...shineProps} />
      {children}
    </div>
  );
}

ShineBorderCard.displayName = 'ShineBorderCard';

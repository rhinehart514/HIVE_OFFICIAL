/**
 * BorderBeam Component
 * Animated light beam traveling around borders - premium UI pattern
 *
 * Creates a single point of light that travels around the border of a card.
 * Based on Magic UI BorderBeam pattern.
 *
 * @example
 * ```tsx
 * <div className="relative rounded-xl bg-neutral-900 p-6">
 *   <BorderBeam size={80} duration={12} colorFrom="#FFD700" colorTo="#FFA500" />
 *   Content
 * </div>
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BorderBeamProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size of the beam in pixels (default: 80) */
  size?: number;
  /** Animation duration in seconds (default: 12) */
  duration?: number;
  /** Start color of the beam gradient */
  colorFrom?: string;
  /** End color of the beam gradient */
  colorTo?: string;
  /** Animation delay in seconds (default: 0) */
  delay?: number;
  /** Border width for the beam track (default: 1.5) */
  borderWidth?: number;
}

/**
 * BorderBeam - Single light point traveling around borders
 *
 * Premium effect for featured cards. More subtle than ShineBorder.
 * Works best on single important elements, not entire grids.
 */
export function BorderBeam({
  size = 80,
  duration = 12,
  colorFrom = '#FFD700',
  colorTo = '#FFA500',
  delay = 0,
  borderWidth = 1.5,
  className,
  style,
  ...props
}: BorderBeamProps) {
  return (
    <div
      style={{
        '--beam-size': `${size}px`,
        '--beam-duration': `${duration}s`,
        '--beam-delay': `-${delay}s`,
        '--beam-color-from': colorFrom,
        '--beam-color-to': colorTo,
        '--beam-border-width': `${borderWidth}px`,
        ...style,
      } as React.CSSProperties}
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        'overflow-hidden',
        '[mask:linear-gradient(#fff,#fff)_content-box,linear-gradient(#fff,#fff)]',
        '[mask-composite:exclude]',
        'p-[var(--beam-border-width)]',
        className
      )}
      {...props}
    >
      {/* The traveling beam */}
      <div
        className={cn(
          'absolute',
          'aspect-square',
          'w-[var(--beam-size)]',
          'motion-safe:animate-border-beam',
          'bg-[linear-gradient(var(--beam-color-from),var(--beam-color-to),transparent)]'
        )}
        style={{
          offsetPath: `rect(0 auto auto 0 round calc(var(--beam-size) / 2))`,
          animationDelay: `var(--beam-delay)`,
        }}
      />
    </div>
  );
}

BorderBeam.displayName = 'BorderBeam';

/**
 * BorderBeamCard - Card wrapper with built-in beam effect
 */
export interface BorderBeamCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** BorderBeam props */
  beamProps?: Omit<BorderBeamProps, 'className' | 'style'>;
  /** Card content */
  children: React.ReactNode;
}

export function BorderBeamCard({
  beamProps,
  children,
  className,
  ...props
}: BorderBeamCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800',
        className
      )}
      {...props}
    >
      <BorderBeam {...beamProps} />
      {children}
    </div>
  );
}

BorderBeamCard.displayName = 'BorderBeamCard';

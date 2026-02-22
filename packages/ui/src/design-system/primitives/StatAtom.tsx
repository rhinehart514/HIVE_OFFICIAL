'use client';

/**
 * StatAtom — number + label. One treatment everywhere.
 *
 * Used on profiles, tool pages, spaces. Uses AnimatedNumber from
 * motion-primitives for spring-based count-up on mount.
 * Respects prefers-reduced-motion.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { AnimatedNumber, numberSpringPresets } from '../../components/motion-primitives/animated-number';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StatAtomProps {
  value: number;
  label: string;
  /** Format: 'number' (1,234) | 'compact' (1.2K) | 'raw' (1234) */
  format?: 'number' | 'compact' | 'raw';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disable mount animation */
  noAnimation?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const sizeStyles = {
  sm: { number: 'text-[24px]', label: 'text-[10px]' },
  md: { number: 'text-[36px]', label: 'text-[11px]' },
  lg: { number: 'text-[48px]', label: 'text-[11px]' },
} as const;

function compactFormat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export const StatAtom = React.forwardRef<HTMLDivElement, StatAtomProps>(
  ({ value, label, format = 'number', size = 'md', noAnimation = false, className }, ref) => {
    const styles = sizeStyles[size];

    const formatFn = format === 'compact'
      ? compactFormat
      : format === 'raw'
        ? (n: number) => n.toString()
        : undefined; // default uses toLocaleString inside AnimatedNumber

    return (
      <div ref={ref} className={cn('flex flex-col', className)}>
        {noAnimation ? (
          <p className={cn(styles.number, 'font-semibold text-white leading-none tabular-nums')}>
            {formatFn ? formatFn(value) : value.toLocaleString()}
          </p>
        ) : (
          <AnimatedNumber
            value={value}
            springOptions={numberSpringPresets.quick}
            formatFn={formatFn}
            animateOnView
            className={cn(styles.number, 'font-semibold text-white leading-none')}
          />
        )}
        <p className={cn(styles.label, 'text-white/35 mt-1 uppercase tracking-[0.12em]')}>
          {label}
        </p>
      </div>
    );
  }
);

StatAtom.displayName = 'StatAtom';

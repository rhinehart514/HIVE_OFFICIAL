/**
 * BrandSpinner Component
 * Accessible loading spinner with configurable color
 *
 * Use for action-based loading states (form submissions, button actions)
 * For content loading, prefer skeleton loaders instead.
 *
 * @example
 * ```tsx
 * <BrandSpinner size="sm" />
 * <BrandSpinner size="md" variant="gold" />
 * <BrandSpinner size="lg" variant="neutral" />
 * ```
 */

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/** Color variants for the spinner */
const SPINNER_VARIANTS = {
  gold: {
    stroke: '#FFD700',
    track: 'rgba(255, 215, 0, 0.15)',
    glow: 'rgba(255, 215, 0, 0.3)',
  },
  neutral: {
    stroke: 'rgba(255, 255, 255, 0.9)',
    track: 'rgba(255, 255, 255, 0.1)',
    glow: 'rgba(255, 255, 255, 0.2)',
  },
  white: {
    stroke: '#FFFFFF',
    track: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(255, 255, 255, 0.3)',
  },
} as const;

export interface BrandSpinnerProps {
  /** Spinner size: sm (16px), md (24px), lg (32px) */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant (default: 'neutral') */
  variant?: keyof typeof SPINNER_VARIANTS;
  /** Additional className */
  className?: string;
  /** Label for screen readers (default: "Loading") */
  label?: string;
}

/** @deprecated Use BrandSpinnerProps instead */
export type GoldSpinnerProps = BrandSpinnerProps;

const sizeMap = {
  sm: { dimension: 16, strokeWidth: 2 },
  md: { dimension: 24, strokeWidth: 2.5 },
  lg: { dimension: 32, strokeWidth: 3 },
};

/**
 * BrandSpinner - Accessible loading indicator
 *
 * Features:
 * - Configurable color variants (neutral by default)
 * - Smooth rotation animation
 * - Respects prefers-reduced-motion
 * - Accessible with aria-label
 */
export const BrandSpinner = forwardRef<HTMLDivElement, BrandSpinnerProps>(
  ({ size = 'md', variant = 'neutral', className, label = 'Loading' }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const { dimension, strokeWidth } = sizeMap[size];
    const radius = (dimension - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const colors = SPINNER_VARIANTS[variant];

    // For reduced motion, show static partial circle
    if (prefersReducedMotion) {
      return (
        <div
          ref={ref}
          className={cn('inline-flex items-center justify-center', className)}
          role="status"
          aria-label={label}
        >
          <svg
            width={dimension}
            height={dimension}
            viewBox={`0 0 ${dimension} ${dimension}`}
            fill="none"
          >
            <circle
              cx={dimension / 2}
              cy={dimension / 2}
              r={radius}
              stroke={colors.track}
              strokeWidth={strokeWidth}
            />
            <circle
              cx={dimension / 2}
              cy={dimension / 2}
              r={radius}
              stroke={colors.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * 0.75}
              transform={`rotate(-90 ${dimension / 2} ${dimension / 2})`}
            />
          </svg>
          <span className="sr-only">{label}</span>
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={cn('inline-flex items-center justify-center', className)}
        role="status"
        aria-label={label}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          ease: 'linear',
          repeat: Infinity,
        }}
        style={{
          filter: `drop-shadow(0 0 4px ${colors.glow})`,
        }}
      >
        <svg
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
          fill="none"
        >
          {/* Background track */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={colors.track}
            strokeWidth={strokeWidth}
          />
          {/* Animated arc */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.75}
            transform={`rotate(-90 ${dimension / 2} ${dimension / 2})`}
          />
        </svg>
        <span className="sr-only">{label}</span>
      </motion.div>
    );
  }
);

BrandSpinner.displayName = 'BrandSpinner';

/**
 * @deprecated Use BrandSpinner with variant="gold" instead
 */
export const GoldSpinner = forwardRef<HTMLDivElement, BrandSpinnerProps>(
  (props, ref) => <BrandSpinner ref={ref} {...props} variant="gold" />
);

GoldSpinner.displayName = 'GoldSpinner';

/**
 * BrandSpinnerInline - For use inside buttons and text
 * Slightly smaller with automatic margin
 */
export const BrandSpinnerInline = forwardRef<HTMLDivElement, Omit<BrandSpinnerProps, 'size'>>(
  ({ className, variant = 'neutral', ...props }, ref) => (
    <BrandSpinner
      ref={ref}
      size="sm"
      variant={variant}
      className={cn('mr-2', className)}
      {...props}
    />
  )
);

BrandSpinnerInline.displayName = 'BrandSpinnerInline';

/**
 * @deprecated Use BrandSpinnerInline with variant="gold" instead
 */
export const GoldSpinnerInline = forwardRef<HTMLDivElement, Omit<BrandSpinnerProps, 'size'>>(
  (props, ref) => <BrandSpinnerInline ref={ref} {...props} variant="gold" />
);

GoldSpinnerInline.displayName = 'GoldSpinnerInline';

// Export variant type for external use
export { SPINNER_VARIANTS };

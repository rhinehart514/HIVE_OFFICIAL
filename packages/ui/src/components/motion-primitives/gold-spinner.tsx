/**
 * GoldSpinner Component
 * Brand-consistent loading spinner with gold accent
 *
 * Use for action-based loading states (form submissions, button actions)
 * For content loading, prefer skeleton loaders instead.
 *
 * @example
 * ```tsx
 * <GoldSpinner size="sm" />
 * <GoldSpinner size="md" className="mx-auto" />
 * ```
 */

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface GoldSpinnerProps {
  /** Spinner size: sm (16px), md (24px), lg (32px) */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
  /** Label for screen readers (default: "Loading") */
  label?: string;
}

const sizeMap = {
  sm: { dimension: 16, strokeWidth: 2 },
  md: { dimension: 24, strokeWidth: 2.5 },
  lg: { dimension: 32, strokeWidth: 3 },
};

/**
 * GoldSpinner - Premium loading indicator
 *
 * Features:
 * - Gold stroke with subtle glow
 * - Smooth rotation animation
 * - Respects prefers-reduced-motion
 * - Accessible with aria-label
 */
export const GoldSpinner = forwardRef<HTMLDivElement, GoldSpinnerProps>(
  ({ size = 'md', className, label = 'Loading' }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const { dimension, strokeWidth } = sizeMap[size];
    const radius = (dimension - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

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
              stroke="rgba(255, 215, 0, 0.2)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={dimension / 2}
              cy={dimension / 2}
              r={radius}
              stroke="#FFD700"
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
          filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.3))',
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
            stroke="rgba(255, 215, 0, 0.15)"
            strokeWidth={strokeWidth}
          />
          {/* Animated arc */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="#FFD700"
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

GoldSpinner.displayName = 'GoldSpinner';

/**
 * GoldSpinnerInline - For use inside buttons and text
 * Slightly smaller with automatic margin
 */
export const GoldSpinnerInline = forwardRef<HTMLDivElement, Omit<GoldSpinnerProps, 'size'>>(
  ({ className, ...props }, ref) => (
    <GoldSpinner
      ref={ref}
      size="sm"
      className={cn('mr-2', className)}
      {...props}
    />
  )
);

GoldSpinnerInline.displayName = 'GoldSpinnerInline';

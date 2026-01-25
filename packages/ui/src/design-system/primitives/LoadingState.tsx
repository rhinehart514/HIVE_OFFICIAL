/**
 * LoadingState - Unified loading indicator primitive
 *
 * Provides consistent loading patterns across the application:
 * - Skeleton: For page/section loads (preferred)
 * - Spinner: For inline/button actions only
 * - Card: For loading cards in grids
 * - Overlay: For modal/drawer loads
 *
 * Philosophy: Skeleton-first approach reduces perceived wait time
 * by showing the expected layout structure.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

// ============================================
// VARIANTS
// ============================================

type LoadingVariant = 'skeleton' | 'spinner' | 'card' | 'overlay' | 'inline';
type LoadingSize = 'sm' | 'md' | 'lg';

interface LoadingStateProps {
  /** Visual variant */
  variant?: LoadingVariant;
  /** Size preset */
  size?: LoadingSize;
  /** Number of skeleton lines (for skeleton variant) */
  lines?: number;
  /** Show avatar skeleton (for skeleton variant) */
  showAvatar?: boolean;
  /** Custom className */
  className?: string;
  /** Accessible label */
  label?: string;
}

// ============================================
// SKELETON PRIMITIVES
// ============================================

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

function SkeletonBox({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg',
        'bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04]',
        'bg-[length:200%_100%]',
        className
      )}
      style={style}
    />
  );
}

function SkeletonCircle({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-full',
        'bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04]',
        'bg-[length:200%_100%]',
        className
      )}
      style={style}
    />
  );
}

function SkeletonText({ className, width }: SkeletonProps & { width?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded h-4',
        'bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04]',
        'bg-[length:200%_100%]',
        className
      )}
      style={{ width: width || '100%' }}
    />
  );
}

// ============================================
// SPINNER
// ============================================

interface SpinnerProps {
  size?: LoadingSize;
  className?: string;
}

function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      className={cn(
        'animate-spin',
        sizeClasses[size],
        'text-white/50',
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ============================================
// VARIANT COMPONENTS
// ============================================

function SkeletonLoading({
  lines = 3,
  showAvatar = false,
  size = 'md',
  className,
}: Omit<LoadingStateProps, 'variant'>) {
  const avatarSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const lineWidths = ['100%', '80%', '60%', '90%', '70%'];

  return (
    <div className={cn('space-y-4', className)} role="status" aria-label="Loading">
      {showAvatar && (
        <div className="flex items-start gap-3">
          <SkeletonCircle className={avatarSizes[size]} />
          <div className="flex-1 space-y-2">
            <SkeletonText width="40%" />
            <SkeletonText width="60%" />
          </div>
        </div>
      )}
      {!showAvatar && (
        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonText key={i} width={lineWidths[i % lineWidths.length]} />
          ))}
        </div>
      )}
    </div>
  );
}

function CardLoading({ size = 'md', className }: Omit<LoadingStateProps, 'variant'>) {
  const heightClasses = {
    sm: 'h-24',
    md: 'h-32',
    lg: 'h-48',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4',
        'bg-white/[0.02] border border-white/[0.06]',
        'animate-pulse',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <div className={cn('rounded-lg bg-white/[0.04] mb-4', heightClasses[size])} />
      <div className="space-y-2">
        <SkeletonText width="60%" />
        <SkeletonText width="40%" />
      </div>
    </div>
  );
}

function OverlayLoading({ label, className }: Omit<LoadingStateProps, 'variant'>) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        'flex items-center justify-center',
        'bg-black/60 backdrop-blur-sm',
        className
      )}
      role="status"
      aria-label={label || 'Loading'}
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        {label && (
          <p className="text-body text-white/60">{label}</p>
        )}
      </div>
    </div>
  );
}

function InlineLoading({ size = 'md', label, className }: Omit<LoadingStateProps, 'variant'>) {
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="status"
      aria-label={label || 'Loading'}
    >
      <Spinner size={size} />
      {label && (
        <span className="text-body-sm text-white/50">{label}</span>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function LoadingState({
  variant = 'skeleton',
  size = 'md',
  lines = 3,
  showAvatar = false,
  label,
  className,
}: LoadingStateProps) {
  switch (variant) {
    case 'spinner':
      return <InlineLoading size={size} label={label} className={className} />;
    case 'card':
      return <CardLoading size={size} className={className} />;
    case 'overlay':
      return <OverlayLoading label={label} className={className} />;
    case 'inline':
      return <InlineLoading size={size} label={label} className={className} />;
    case 'skeleton':
    default:
      return (
        <SkeletonLoading
          lines={lines}
          showAvatar={showAvatar}
          size={size}
          className={className}
        />
      );
  }
}

// ============================================
// EXPORTS
// ============================================

export { SkeletonBox, SkeletonCircle, SkeletonText, Spinner };
export type { LoadingStateProps, LoadingVariant, LoadingSize };

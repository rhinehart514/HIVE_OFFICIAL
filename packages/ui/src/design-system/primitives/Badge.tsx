'use client';

/**
 * Badge Primitive
 * REFINED: Jan 29, 2026 - Matches /about aesthetic
 *
 * Design principles:
 * - Simple backgrounds with subtle opacity
 * - No heavy gradients or shadows
 * - Gold as accent text color only
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5',
    'rounded-full',
    'text-xs font-medium',
    'transition-colors duration-150',
  ].join(' '),
  {
    variants: {
      variant: {
        neutral: 'bg-white/[0.06] text-white/70',
        gold: 'bg-[#FFD700]/10 text-[#FFD700]',
        success: 'bg-green-500/10 text-green-400',
        error: 'bg-red-500/10 text-red-400',
        warning: 'bg-amber-500/10 text-amber-400',
        info: 'bg-blue-500/10 text-blue-400',
        default: 'bg-white/[0.06] text-white/70',
        secondary: 'bg-white/[0.06] text-white/70',
        outline: 'bg-transparent text-white/50 border border-white/[0.06]',
        destructive: 'bg-red-500/10 text-red-400',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        default: 'px-2.5 py-0.5 text-[11px]',
        lg: 'px-3 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'default',
    },
  }
);

export type BadgeVariant = 'neutral' | 'gold' | 'success' | 'error' | 'warning' | 'info' | 'default' | 'secondary' | 'outline' | 'destructive';

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  variant?: BadgeVariant;
  showDot?: boolean;
  children: React.ReactNode;
}

const dotColors: Record<string, string> = {
  neutral: 'bg-white/50',
  gold: 'bg-[var(--color-gold)]',
  success: 'bg-green-400',
  error: 'bg-red-400',
  warning: 'bg-amber-400',
  info: 'bg-blue-400',
  default: 'bg-white/50',
  secondary: 'bg-white/50',
  outline: 'bg-white/50',
  destructive: 'bg-red-400',
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', size, showDot = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {showDot && (
          <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge
export interface StatusBadgeProps {
  status: 'online' | 'away' | 'busy' | 'offline' | 'new' | 'beta' | 'verified';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const statusConfig: Record<StatusBadgeProps['status'], { label: string; variant: BadgeVariant }> = {
  online: { label: 'Online', variant: 'success' },
  away: { label: 'Away', variant: 'warning' },
  busy: { label: 'Busy', variant: 'error' },
  offline: { label: 'Offline', variant: 'neutral' },
  new: { label: 'New', variant: 'info' },
  beta: { label: 'Beta', variant: 'info' },
  verified: { label: 'Verified', variant: 'gold' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'default', className }) => {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} size={size} showDot className={className}>
      {config.label}
    </Badge>
  );
};

// Verified Badge
export interface VerifiedBadgeProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 'default', className }) => {
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <Badge variant="gold" size={size} className={className}>
      <svg
        className={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Verified
    </Badge>
  );
};

// Count Badge
export interface CountBadgeProps {
  count: number;
  max?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  variant?: 'gold' | 'neutral' | 'error';
  children: React.ReactNode;
}

const countPositionClasses = {
  'top-right': 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
  'top-left': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
  'bottom-left': 'bottom-0 left-0 translate-y-1/2 -translate-x-1/2',
};

const countVariantClasses = {
  gold: 'bg-[var(--color-gold)] text-black',
  neutral: 'bg-white/20 text-white',
  error: 'bg-red-500 text-white',
};

const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  position = 'top-right',
  variant = 'neutral',
  children,
}) => {
  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <div className="relative inline-flex">
      {children}
      {count > 0 && (
        <span
          className={cn(
            'absolute',
            'min-w-[18px] h-[18px]',
            'flex items-center justify-center',
            'rounded-full',
            'px-1',
            'text-[10px] font-semibold',
            'ring-2 ring-[#050505]',
            countPositionClasses[position],
            countVariantClasses[variant]
          )}
        >
          {displayCount}
        </span>
      )}
    </div>
  );
};

// Dot Badge
export interface DotBadgeProps {
  show?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const DotBadge: React.FC<DotBadgeProps> = ({
  show = true,
  position = 'top-right',
  variant = 'error',
  children,
}) => {
  return (
    <div className="relative inline-flex">
      {children}
      {show && (
        <span
          className={cn(
            'absolute w-2.5 h-2.5 rounded-full',
            'ring-2 ring-[#050505]',
            countPositionClasses[position],
            dotColors[variant]
          )}
        />
      )}
    </div>
  );
};

// Tag Badge
export interface TagBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'default' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const TagBadge: React.FC<TagBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'default',
  removable = false,
  onRemove,
  className,
}) => {
  return (
    <Badge variant={variant} size={size} className={className}>
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
        >
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </Badge>
  );
};

// Legacy exports for backwards compatibility
const glassSurface = {};
const glassGoldSurface = {};
const floatingSurface = {};

export {
  Badge,
  StatusBadge,
  VerifiedBadge,
  CountBadge,
  DotBadge,
  TagBadge,
  badgeVariants,
  glassSurface,
  glassGoldSurface,
  floatingSurface,
};

'use client';

/**
 * Badge Primitive - LOCKED 2026-01-10
 *
 * LOCKED: Glass style, Pill shape, Dot+Label status
 * Gold variant uses glass treatment (not solid gold).
 *
 * Recipe:
 *   style: Glass (gradient bg + inset highlight)
 *   shape: Pill (rounded-full)
 *   status: Dot + Label (colored dot before text)
 *   gold: Glass-like (gold-tinted glass, not solid)
 *   count: Gold count badges
 *   tags: Floating with optional remove
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Glass style surface
const glassSurface = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
};

// LOCKED: Glass + color tint surfaces
const glassGoldSurface = {
  background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.08) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,215,0,0.2)',
};

const glassSuccessSurface = {
  background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.08) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(34,197,94,0.2)',
};

const glassErrorSurface = {
  background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.08) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(239,68,68,0.2)',
};

const glassWarningSurface = {
  background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.08) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(245,158,11,0.2)',
};

const glassInfoSurface = {
  background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(59,130,246,0.2)',
};

// LOCKED: Floating tag surface
const floatingSurface = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
};

// LOCKED: Pill shape (rounded-full)
const badgeVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5',
    // LOCKED: Pill shape
    'rounded-full',
    'text-xs font-medium',
    'transition-all duration-[var(--duration-snap)]',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'px-2 py-0.5 text-label-xs',
        default: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Badge variant type
// Includes legacy aliases for backward compatibility (default, secondary, outline → neutral, destructive → error)
export type BadgeVariant = 'neutral' | 'gold' | 'success' | 'error' | 'warning' | 'info' | 'default' | 'secondary' | 'outline' | 'destructive';

// Normalize legacy variants to new variants
function normalizeVariant(variant: BadgeVariant): 'neutral' | 'gold' | 'success' | 'error' | 'warning' | 'info' {
  // Legacy aliases map to neutral
  if (variant === 'default' || variant === 'secondary' || variant === 'outline') {
    return 'neutral';
  }
  // destructive → error
  if (variant === 'destructive') {
    return 'error';
  }
  return variant;
}

// Get glass style for variant
function getGlassStyle(variant: BadgeVariant): React.CSSProperties {
  const normalized = normalizeVariant(variant);
  switch (normalized) {
    case 'gold':
      return glassGoldSurface;
    case 'success':
      return glassSuccessSurface;
    case 'error':
      return glassErrorSurface;
    case 'warning':
      return glassWarningSurface;
    case 'info':
      return glassInfoSurface;
    default:
      return glassSurface;
  }
}

// Get text color for variant - using CSS variables from tokens.css
function getTextColor(variant: BadgeVariant): string {
  const normalized = normalizeVariant(variant);
  switch (normalized) {
    case 'gold':
      return 'text-[var(--life-gold)]';
    case 'success':
      return 'text-[var(--status-success)]';
    case 'error':
      return 'text-[var(--status-error)]';
    case 'warning':
      return 'text-[var(--status-warning)]';
    case 'info':
      return 'text-[#3B82F6]'; // Blue not in status tokens, keeping explicit
    default:
      return 'text-white/70';
  }
}

// Get dot color for variant - using CSS variables from tokens.css
function getDotColor(variant: BadgeVariant): string {
  const normalized = normalizeVariant(variant);
  switch (normalized) {
    case 'gold':
      return 'bg-[var(--life-gold)]';
    case 'success':
      return 'bg-[var(--status-success)]';
    case 'error':
      return 'bg-[var(--status-error)]';
    case 'warning':
      return 'bg-[var(--status-warning)]';
    case 'info':
      return 'bg-[#3B82F6]'; // Blue not in status tokens, keeping explicit
    default:
      return 'bg-white/50';
  }
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Badge variant */
  variant?: BadgeVariant;
  /** Show status dot before label */
  showDot?: boolean;
  /** Badge content */
  children: React.ReactNode;
}

// LOCKED: Glass Badge with optional dot
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', size, showDot = false, style, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ size }), getTextColor(variant), className)}
        style={{ ...getGlassStyle(variant), ...style }}
        {...props}
      >
        {showDot && (
          <span className={cn('w-1.5 h-1.5 rounded-full', getDotColor(variant))} />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// ============================================
// STATUS BADGE (Dot + Label) - LOCKED
// ============================================

export interface StatusBadgeProps {
  /** Status type */
  status: 'online' | 'away' | 'busy' | 'offline' | 'new' | 'beta' | 'verified';
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Additional className */
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

// LOCKED: Status badge with dot + label
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'default', className }) => {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} showDot className={className}>
      {config.label}
    </Badge>
  );
};

// ============================================
// VERIFIED BADGE - LOCKED
// ============================================

export interface VerifiedBadgeProps {
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Additional className */
  className?: string;
}

// LOCKED: Verified badge with checkmark
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

// ============================================
// COUNT BADGE - LOCKED (Gold variant)
// ============================================

export interface CountBadgeProps {
  /** Count to display */
  count: number;
  /** Maximum before showing "+" */
  max?: number;
  /** Position */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Use gold variant (default) or neutral */
  variant?: 'gold' | 'neutral' | 'error';
  /** Children to wrap */
  children: React.ReactNode;
}

const countPositionClasses = {
  'top-right': 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
  'top-left': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
  'bottom-left': 'bottom-0 left-0 translate-y-1/2 -translate-x-1/2',
};

// LOCKED: Gold count badge with glass treatment
const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  position = 'top-right',
  variant = 'gold',
  children,
}) => {
  const displayCount = count > max ? `${max}+` : count.toString();

  // Get style based on variant
  const getCountStyle = (): React.CSSProperties => {
    if (variant === 'gold') {
      return {
        background: 'linear-gradient(135deg, rgba(255,215,0,0.9) 0%, rgba(255,180,0,0.85) 100%)',
        boxShadow: '0 2px 8px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
        color: '#0A0A09',
      };
    }
    if (variant === 'error') {
      return {
        background: 'linear-gradient(135deg, rgba(239,68,68,0.9) 0%, rgba(220,38,38,0.85) 100%)',
        boxShadow: '0 2px 8px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
        color: 'white',
      };
    }
    return glassSurface;
  };

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
            'text-label-xs font-semibold',
            'ring-2 ring-[var(--bg-surface)]',
            countPositionClasses[position],
            variant === 'neutral' && 'text-white/80'
          )}
          style={getCountStyle()}
        >
          {displayCount}
        </span>
      )}
    </div>
  );
};

// ============================================
// DOT BADGE (for notification dots)
// ============================================

export interface DotBadgeProps {
  /** Show the dot */
  show?: boolean;
  /** Position */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Variant */
  variant?: BadgeVariant;
  /** Children to wrap */
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
            'ring-2 ring-[var(--bg-surface)]',
            countPositionClasses[position],
            getDotColor(variant)
          )}
        />
      )}
    </div>
  );
};

// ============================================
// TAG BADGE - LOCKED (Floating + Removable)
// ============================================

export interface TagBadgeProps {
  /** Tag content */
  children: React.ReactNode;
  /** Variant */
  variant?: BadgeVariant;
  /** Size */
  size?: 'sm' | 'default' | 'lg';
  /** Show remove button */
  removable?: boolean;
  /** Remove handler */
  onRemove?: () => void;
  /** Additional className */
  className?: string;
}

// LOCKED: Floating tag with optional remove
const TagBadge: React.FC<TagBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'default',
  removable = false,
  onRemove,
  className,
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-label-xs',
    default: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'rounded-full',
        getTextColor(variant),
        sizeClasses[size],
        'font-medium',
        'transition-all duration-150',
        className
      )}
      style={floatingSurface}
    >
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'w-3.5 h-3.5 rounded-full',
            'flex items-center justify-center',
            'bg-white/10 hover:bg-white/20',
            'transition-colors duration-150',
            'focus:outline-none'
          )}
        >
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};

export {
  Badge,
  StatusBadge,
  VerifiedBadge,
  CountBadge,
  DotBadge,
  TagBadge,
  badgeVariants,
  // Export style helpers for composed components
  glassSurface,
  glassGoldSurface,
  floatingSurface,
};

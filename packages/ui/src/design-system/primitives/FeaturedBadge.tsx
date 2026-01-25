'use client';

/**
 * FeaturedBadge Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Badge showing why a space is featured/highlighted
 * Different colors for different reasons.
 *
 * Recipe:
 *   container: Rounded pill, subtle glow
 *   colors: Gold (trending), Blue (new), Purple (event), Green (friends)
 *   icon: Optional leading icon per reason type
 *   animation: Optional pulse for live reasons
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Reason colors (careful with gold budget)
const REASON_COLORS = {
  trending: {
    bg: 'bg-[#D4AF37]/15',
    text: 'text-[#D4AF37]',
    border: 'border-[#D4AF37]/30',
    glow: 'shadow-[0_0_12px_rgba(212,175,55,0.15)]',
  },
  new: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.15)]',
  },
  event: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.15)]',
  },
  friends: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.15)]',
  },
  popular: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    glow: 'shadow-[0_0_12px_rgba(249,115,22,0.15)]',
  },
  verified: {
    bg: 'bg-white/10',
    text: 'text-white/80',
    border: 'border-white/20',
    glow: '',
  },
} as const;

// Badge variants
const featuredBadgeVariants = cva(
  [
    'inline-flex items-center gap-1.5',
    'px-2.5 py-1',
    'rounded-full',
    'text-label-sm font-semibold',
    'border',
    'transition-all duration-200',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'px-2 py-0.5 text-label-xs',
        default: 'px-2.5 py-1 text-label-sm',
        lg: 'px-3 py-1.5 text-xs',
      },
      showGlow: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      showGlow: false,
    },
  }
);

// Types
export type FeaturedReason = 'trending' | 'new' | 'event' | 'friends' | 'popular' | 'verified';

export interface FeaturedBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Reason why this is featured */
  reason: FeaturedReason;
  /** Custom label (overrides default) */
  label?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Show glow effect */
  showGlow?: boolean;
  /** Pulse animation (for live/active reasons) */
  pulse?: boolean;
  /** Additional context (e.g., "2 friends here") */
  context?: string;
}

// Icons for each reason
const ReasonIcons: Record<FeaturedReason, React.FC<{ className?: string }>> = {
  trending: ({ className }) => (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2.5l2.5 3.5h-1.5v7h-2v-7H5.5L8 2.5z" />
      <path d="M3 12.5h10v1H3v-1z" />
    </svg>
  ),
  new: ({ className }) => (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 3.5l.94 2.84 3.06.22-2.35 2.03.71 2.91L8 9.75l-2.36 1.75.71-2.91-2.35-2.03 3.06-.22L8 3.5z" />
    </svg>
  ),
  event: ({ className }) => (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M11 2v1h1a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h1V2h2v1h2V2h2zm-7 4v7h8V6H4z" />
    </svg>
  ),
  friends: ({ className }) => (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M6 8a3 3 0 100-6 3 3 0 000 6zm5.5 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm3.25 6.25a4.75 4.75 0 00-5-4.5 4.5 4.5 0 00-8.5 2.5v1.5h13.5v-1.5l-.5 2h.5z" />
    </svg>
  ),
  popular: ({ className }) => (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z" />
    </svg>
  ),
  verified: ({ className }) => (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M10.067.87a2.89 2.89 0 00-4.134 0l-.622.638-.89-.011a2.89 2.89 0 00-2.924 2.924l.01.89-.636.622a2.89 2.89 0 000 4.134l.637.622-.011.89a2.89 2.89 0 002.924 2.924l.89-.01.622.636a2.89 2.89 0 004.134 0l.622-.637.89.011a2.89 2.89 0 002.924-2.924l-.01-.89.636-.622a2.89 2.89 0 000-4.134l-.637-.622.011-.89a2.89 2.89 0 00-2.924-2.924l-.89.01-.622-.636zm.287 5.984l-3 3a.5.5 0 01-.708 0l-1.5-1.5a.5.5 0 11.708-.708L7 8.793l2.646-2.647a.5.5 0 01.708.708z" />
    </svg>
  ),
};

// Default labels
const DEFAULT_LABELS: Record<FeaturedReason, string> = {
  trending: 'Trending',
  new: 'New',
  event: 'Event Soon',
  friends: 'Friends Here',
  popular: 'Popular',
  verified: 'Verified',
};

// Main component
const FeaturedBadge = React.forwardRef<HTMLDivElement, FeaturedBadgeProps>(
  (
    {
      className,
      reason,
      label,
      showIcon = true,
      size = 'default',
      showGlow = false,
      pulse = false,
      context,
      ...props
    },
    ref
  ) => {
    const colors = REASON_COLORS[reason];
    const Icon = ReasonIcons[reason];
    const displayLabel = label || DEFAULT_LABELS[reason];

    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';

    const content = (
      <div
        ref={ref}
        className={cn(
          featuredBadgeVariants({ size, showGlow }),
          colors.bg,
          colors.text,
          colors.border,
          showGlow && colors.glow,
          className
        )}
        {...props}
      >
        {showIcon && <Icon className={iconSize} />}
        <span>{displayLabel}</span>
        {context && (
          <span className="opacity-70 font-normal">· {context}</span>
        )}
      </div>
    );

    if (pulse) {
      return (
        <motion.div
          className="inline-flex"
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {content}
        </motion.div>
      );
    }

    return content;
  }
);

FeaturedBadge.displayName = 'FeaturedBadge';

// Multi-badge component for showing multiple reasons
interface FeaturedBadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of reasons */
  reasons: Array<{
    reason: FeaturedReason;
    label?: string;
    context?: string;
    pulse?: boolean;
  }>;
  /** Max badges to show */
  max?: number;
  /** Size for all badges */
  size?: 'sm' | 'default' | 'lg';
  /** Gap between badges */
  gap?: 'sm' | 'default' | 'lg';
}

const FeaturedBadgeGroup = React.forwardRef<HTMLDivElement, FeaturedBadgeGroupProps>(
  ({ className, reasons, max = 2, size = 'sm', gap = 'sm', ...props }, ref) => {
    const visibleReasons = reasons.slice(0, max);
    const hiddenCount = reasons.length - max;

    const gapClass = gap === 'sm' ? 'gap-1.5' : gap === 'lg' ? 'gap-3' : 'gap-2';

    return (
      <div ref={ref} className={cn('flex flex-wrap items-center', gapClass, className)} {...props}>
        {visibleReasons.map((item, index) => (
          <FeaturedBadge
            key={`${item.reason}-${index}`}
            reason={item.reason}
            label={item.label}
            context={item.context}
            pulse={item.pulse}
            size={size}
            showIcon
          />
        ))}
        {hiddenCount > 0 && (
          <span className="text-label-xs text-white/40 font-medium">
            +{hiddenCount} more
          </span>
        )}
      </div>
    );
  }
);

FeaturedBadgeGroup.displayName = 'FeaturedBadgeGroup';

export {
  FeaturedBadge,
  FeaturedBadgeGroup,
  // Export variants
  featuredBadgeVariants,
  // Export constants
  REASON_COLORS,
  DEFAULT_LABELS,
  ReasonIcons,
};

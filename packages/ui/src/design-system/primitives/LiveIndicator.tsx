'use client';

/**
 * LiveIndicator Primitive
 *
 * Pulsing gold dot with optional "LIVE" text. Used to show real-time
 * activity in spaces, chat, events, etc.
 *
 * Variants:
 * - dot: Just the pulsing dot
 * - badge: Dot + "LIVE" text
 * - count: Dot + online count (e.g., "12 online")
 *
 * CRITICAL: Gold is allowed here - live presence is one of the gold budget uses.
 *
 * @version 1.0.0 - January 2026
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// ============================================
// CVA VARIANTS
// ============================================

const liveIndicatorContainerVariants = cva(
  'inline-flex items-center gap-1.5',
  {
    variants: {
      size: {
        xs: 'gap-1',
        sm: 'gap-1.5',
        default: 'gap-2',
        lg: 'gap-2.5',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const liveDotVariants = cva(
  'rounded-full bg-[var(--color-accent-gold,#FFD700)] flex-shrink-0',
  {
    variants: {
      size: {
        xs: 'w-1.5 h-1.5',
        sm: 'w-2 h-2',
        default: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const liveTextVariants = cva(
  'font-medium text-[var(--color-accent-gold,#FFD700)] uppercase tracking-wider',
  {
    variants: {
      size: {
        xs: 'text-[9px]',
        sm: 'text-[10px]',
        default: 'text-[11px]',
        lg: 'text-xs',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const countTextVariants = cva(
  'font-medium text-[var(--color-accent-gold,#FFD700)]',
  {
    variants: {
      size: {
        xs: 'text-[10px]',
        sm: 'text-[11px]',
        default: 'text-xs',
        lg: 'text-sm',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// ============================================
// TYPES
// ============================================

export interface LiveIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof liveIndicatorContainerVariants> {
  /** Show pulsing animation (respects reduced motion) */
  animate?: boolean;
  /** Intensity of the glow effect */
  glowIntensity?: 'subtle' | 'normal' | 'strong';
}

// ============================================
// LIVE DOT COMPONENT
// ============================================

interface LiveDotProps extends VariantProps<typeof liveDotVariants> {
  animate?: boolean;
  glowIntensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
}

function LiveDot({
  size = 'default',
  animate = true,
  glowIntensity = 'normal',
  className,
}: LiveDotProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = animate && !shouldReduceMotion;

  const glowStrength = {
    subtle: { min: 'rgba(255,215,0,0.2)', max: 'rgba(255,215,0,0.4)' },
    normal: { min: 'rgba(255,215,0,0.3)', max: 'rgba(255,215,0,0.6)' },
    strong: { min: 'rgba(255,215,0,0.4)', max: 'rgba(255,215,0,0.8)' },
  };

  const { min, max } = glowStrength[glowIntensity];

  if (!shouldAnimate) {
    return (
      <span
        className={cn(liveDotVariants({ size }), className)}
        style={{ boxShadow: `0 0 6px ${min}` }}
      />
    );
  }

  return (
    <motion.span
      className={cn(liveDotVariants({ size }), className)}
      animate={{
        boxShadow: [
          `0 0 4px ${min}`,
          `0 0 12px ${max}`,
          `0 0 4px ${min}`,
        ],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const LiveIndicator = React.forwardRef<HTMLDivElement, LiveIndicatorProps>(
  (
    {
      className,
      size = 'default',
      animate = true,
      glowIntensity = 'normal',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(liveIndicatorContainerVariants({ size }), className)}
        role="status"
        aria-label="Live now"
        {...props}
      >
        <LiveDot size={size} animate={animate} glowIntensity={glowIntensity} />
        <span className={cn(liveTextVariants({ size }))}>Live</span>
      </div>
    );
  }
);

LiveIndicator.displayName = 'LiveIndicator';

// ============================================
// BADGE VARIANT (with background)
// ============================================

const liveBadgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 rounded-full',
    'bg-[var(--color-accent-gold,#FFD700)]/10',
    'border border-[var(--color-accent-gold,#FFD700)]/20',
  ].join(' '),
  {
    variants: {
      size: {
        xs: 'px-1.5 py-0.5 gap-1',
        sm: 'px-2 py-0.5 gap-1.5',
        default: 'px-2.5 py-1 gap-1.5',
        lg: 'px-3 py-1.5 gap-2',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface LiveBadgeProps extends LiveIndicatorProps {
  /** Text to show (default: "Live") */
  text?: string;
}

const LiveBadge = React.forwardRef<HTMLDivElement, LiveBadgeProps>(
  (
    {
      className,
      size = 'default',
      animate = true,
      glowIntensity = 'subtle',
      text = 'Live',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(liveBadgeVariants({ size }), className)}
        role="status"
        aria-label={text}
        {...props}
      >
        <LiveDot size={size} animate={animate} glowIntensity={glowIntensity} />
        <span className={cn(liveTextVariants({ size }))}>{text}</span>
      </div>
    );
  }
);

LiveBadge.displayName = 'LiveBadge';

// ============================================
// COUNT VARIANT (with online count)
// ============================================

export interface LiveCountIndicatorProps extends Omit<LiveIndicatorProps, 'children'> {
  /** Number of users online */
  count: number;
  /** Suffix after count (default: "online") */
  suffix?: string;
  /** Hide indicator if count is 0 */
  hideIfZero?: boolean;
}

const LiveCountIndicator = React.forwardRef<HTMLDivElement, LiveCountIndicatorProps>(
  (
    {
      className,
      size = 'default',
      animate = true,
      glowIntensity = 'normal',
      count,
      suffix = 'online',
      hideIfZero = true,
      ...props
    },
    ref
  ) => {
    if (hideIfZero && count === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(liveIndicatorContainerVariants({ size }), className)}
        role="status"
        aria-label={`${count} ${suffix}`}
        {...props}
      >
        <LiveDot size={size} animate={animate && count > 0} glowIntensity={glowIntensity} />
        <span className={cn(countTextVariants({ size }))}>
          {count} {suffix}
        </span>
      </div>
    );
  }
);

LiveCountIndicator.displayName = 'LiveCountIndicator';

// ============================================
// EXPLORING NOW VARIANT (for browse hero)
// ============================================

export interface ExploringNowProps extends Omit<LiveIndicatorProps, 'children'> {
  /** Number of students exploring */
  count: number;
  /** Custom text (default: "students exploring now") */
  text?: string;
}

const ExploringNow = React.forwardRef<HTMLDivElement, ExploringNowProps>(
  (
    {
      className,
      size = 'default',
      animate = true,
      glowIntensity = 'subtle',
      count,
      text = 'students exploring now',
      ...props
    },
    ref
  ) => {
    if (count === 0) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-white/[0.04] border border-white/[0.06]',
          className
        )}
        role="status"
        aria-label={`${count} ${text}`}
        {...props}
      >
        <LiveDot size={size} animate={animate} glowIntensity={glowIntensity} />
        <span className="text-xs text-white/50">
          <span className="text-[var(--color-accent-gold,#FFD700)] font-medium">{count}</span>
          {' '}{text}
        </span>
      </div>
    );
  }
);

ExploringNow.displayName = 'ExploringNow';

// ============================================
// DOT ONLY VARIANT
// ============================================

export interface LiveDotOnlyProps extends VariantProps<typeof liveDotVariants> {
  animate?: boolean;
  glowIntensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
}

const LiveDotOnly = React.forwardRef<HTMLSpanElement, LiveDotOnlyProps>(
  ({ size = 'default', animate = true, glowIntensity = 'normal', className }, ref) => {
    const shouldReduceMotion = useReducedMotion();
    const shouldAnimate = animate && !shouldReduceMotion;

    const glowStrength = {
      subtle: { min: 'rgba(255,215,0,0.2)', max: 'rgba(255,215,0,0.4)' },
      normal: { min: 'rgba(255,215,0,0.3)', max: 'rgba(255,215,0,0.6)' },
      strong: { min: 'rgba(255,215,0,0.4)', max: 'rgba(255,215,0,0.8)' },
    };

    const { min, max } = glowStrength[glowIntensity];

    if (!shouldAnimate) {
      return (
        <span
          ref={ref}
          className={cn(liveDotVariants({ size }), className)}
          style={{ boxShadow: `0 0 6px ${min}` }}
          aria-hidden="true"
        />
      );
    }

    return (
      <motion.span
        ref={ref}
        className={cn(liveDotVariants({ size }), className)}
        animate={{
          boxShadow: [
            `0 0 4px ${min}`,
            `0 0 12px ${max}`,
            `0 0 4px ${min}`,
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        aria-hidden="true"
      />
    );
  }
);

LiveDotOnly.displayName = 'LiveDotOnly';

// ============================================
// EXPORTS
// ============================================

export {
  LiveIndicator,
  LiveBadge,
  LiveCountIndicator,
  ExploringNow,
  LiveDotOnly,
  LiveDot,
  liveIndicatorContainerVariants,
  liveDotVariants,
  liveTextVariants,
  countTextVariants,
  liveBadgeVariants,
};

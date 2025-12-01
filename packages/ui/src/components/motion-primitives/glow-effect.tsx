/**
 * GlowEffect Component
 * Animated glow effect for highlighting achievements and important elements
 *
 * HIVE Brand: Gold glow ONLY for achievements, reputation, primary CTAs
 *
 * @example
 * ```tsx
 * <GlowEffect color="#FFD700" size="md">
 *   <Star className="text-[#FFD700]" />
 * </GlowEffect>
 * ```
 */

'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface GlowEffectProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Child elements to wrap with glow */
  children: ReactNode;

  /** Glow color (default: #FFD700 gold) */
  color?: string;

  /** Glow size preset */
  size?: 'sm' | 'md' | 'lg';

  /** Animation mode */
  mode?: 'static' | 'pulse' | 'breathe';

  /** Blur intensity */
  blur?: 'soft' | 'medium' | 'strong';

  /** Whether glow is active */
  active?: boolean;
}

const sizeMap = {
  sm: { spread: 8, opacity: 0.4 },
  md: { spread: 16, opacity: 0.5 },
  lg: { spread: 24, opacity: 0.6 },
};

const blurMap = {
  soft: 8,
  medium: 16,
  strong: 24,
};

/**
 * GlowEffect - Animated glow wrapper for achievements
 */
export const GlowEffect = forwardRef<HTMLDivElement, GlowEffectProps>(
  (
    {
      children,
      color = '#FFD700',
      size = 'md',
      mode = 'breathe',
      blur = 'medium',
      active = true,
      className,
      ...props
    },
    ref
  ) => {
    const { spread, opacity } = sizeMap[size];
    const blurValue = blurMap[blur];

    const glowVariants = {
      static: {
        boxShadow: active
          ? `0 0 ${spread}px ${blurValue}px ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
          : 'none',
      },
      pulse: {
        boxShadow: active
          ? [
              `0 0 ${spread}px ${blurValue}px ${color}${Math.round(opacity * 0.3 * 255).toString(16).padStart(2, '0')}`,
              `0 0 ${spread * 1.5}px ${blurValue * 1.5}px ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
              `0 0 ${spread}px ${blurValue}px ${color}${Math.round(opacity * 0.3 * 255).toString(16).padStart(2, '0')}`,
            ]
          : 'none',
      },
      breathe: {
        opacity: active ? [0.6, 1, 0.6] : 0,
        scale: active ? [1, 1.02, 1] : 1,
      },
    };

    const transitionConfig = {
      static: { duration: 0 },
      pulse: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      breathe: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    };

    return (
      <motion.div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        {...props}
      >
        {/* Glow layer */}
        {active && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
              filter: `blur(${blurValue}px)`,
            }}
            animate={glowVariants[mode]}
            transition={transitionConfig[mode]}
          />
        )}
        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

GlowEffect.displayName = 'GlowEffect';

/**
 * AnimatedStar - Pre-configured gold star with glow for achievements
 */
export const AnimatedGoldIcon = forwardRef<
  HTMLDivElement,
  { children: ReactNode; active?: boolean; className?: string }
>(({ children, active = true, className }, ref) => (
  <GlowEffect
    ref={ref}
    color="#FFD700"
    size="sm"
    mode="breathe"
    blur="soft"
    active={active}
    className={className}
  >
    {children}
  </GlowEffect>
));

AnimatedGoldIcon.displayName = 'AnimatedGoldIcon';

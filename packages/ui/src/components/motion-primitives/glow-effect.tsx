/**
 * GlowEffect Component
 * Animated glow effect for highlighting achievements and celebrations
 *
 * Use sparingly - only for:
 * - Achievement moments
 * - Celebration overlays
 * - Completion states
 *
 * NOT for: General decoration, hover states, featured items
 *
 * @example
 * ```tsx
 * <GlowEffect color="gold" size="md">
 *   <Trophy className="text-gold-400" />
 * </GlowEffect>
 * ```
 */

'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode, forwardRef } from 'react';
import { cn } from '../../lib/utils';

/** Preset colors for glow effects */
const GLOW_COLORS = {
  gold: '#FFD700',
  white: 'rgba(255, 255, 255, 0.8)',
  success: '#22C55E',
  neutral: 'rgba(255, 255, 255, 0.5)',
} as const;

export interface GlowEffectProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Child elements to wrap with glow */
  children: ReactNode;

  /** Glow color preset or custom hex (default: 'neutral') */
  color?: keyof typeof GLOW_COLORS | string;

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
      color = 'neutral',
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
    // Resolve color from preset or use as custom hex
    const resolvedColor = GLOW_COLORS[color as keyof typeof GLOW_COLORS] || color;

    const glowVariants = {
      static: {
        boxShadow: active
          ? `0 0 ${spread}px ${blurValue}px ${resolvedColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
          : 'none',
      },
      pulse: {
        boxShadow: active
          ? [
              `0 0 ${spread}px ${blurValue}px ${resolvedColor}${Math.round(opacity * 0.3 * 255).toString(16).padStart(2, '0')}`,
              `0 0 ${spread * 1.5}px ${blurValue * 1.5}px ${resolvedColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
              `0 0 ${spread}px ${blurValue}px ${resolvedColor}${Math.round(opacity * 0.3 * 255).toString(16).padStart(2, '0')}`,
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
              background: `radial-gradient(circle, ${resolvedColor}40 0%, transparent 70%)`,
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
 * AnimatedIcon - Pre-configured icon wrapper with subtle glow for achievements
 * @deprecated Use GlowEffect directly with color="gold" for achievements
 */
export const AnimatedGoldIcon = forwardRef<
  HTMLDivElement,
  { children: ReactNode; active?: boolean; className?: string; color?: keyof typeof GLOW_COLORS }
>(({ children, active = true, className, color = 'gold' }, ref) => (
  <GlowEffect
    ref={ref}
    color={color}
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

// Re-export color presets for external use
export { GLOW_COLORS };

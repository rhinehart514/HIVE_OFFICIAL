'use client';

/**
 * Gradient Motion Primitives
 *
 * Gradient backgrounds and text effects for HIVE's premium visual language.
 * Creates atmosphere and depth through subtle color transitions.
 *
 * Philosophy:
 * - Gradients create atmosphere, not decoration
 * - Void gradient = depth behind content
 * - Gold glow = life, presence, earned moments (1-2% budget)
 * - Warm glow = ambient comfort without gold
 */

import * as React from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================
// GRADIENT BACKGROUND
// ============================================

export interface GradientBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  /** Gradient variant */
  variant?: 'void' | 'gold-glow' | 'warm' | 'soft' | 'custom';
  /** Custom gradient (only used when variant='custom') */
  gradient?: string;
  /** Whether to animate the gradient position. Default: false */
  animated?: boolean;
  /** Animation duration in seconds. Default: 20 */
  animationDuration?: number;
  /** Whether gradient follows cursor. Default: false */
  followCursor?: boolean;
  /** Opacity of the gradient. Default: 1 */
  opacity?: number;
}

const GRADIENTS = {
  void: 'radial-gradient(ellipse at center, var(--bg-void) 0%, #000000 100%)',
  'gold-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,215,0,0.08) 0%, transparent 60%)',
  warm: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 245, 235, 0.03) 0%, transparent 60%)',
  soft: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.02) 0%, transparent 70%)',
  custom: '',
};

/**
 * Background gradient that creates atmosphere and depth.
 * Use 'void' for deep backgrounds, 'gold-glow' sparingly for life indicators.
 *
 * @example
 * // Deep void background
 * <GradientBackground variant="void">
 *   <HeroContent />
 * </GradientBackground>
 *
 * @example
 * // Subtle gold glow for presence
 * <GradientBackground variant="gold-glow" opacity={0.5} />
 */
export function GradientBackground({
  children,
  className,
  variant = 'void',
  gradient,
  animated = false,
  animationDuration = 20,
  followCursor = false,
  opacity = 1,
}: GradientBackgroundProps) {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const smoothX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  const backgroundPosition = useTransform(
    [smoothX, smoothY],
    ([x, y]) => `${(x as number) * 100}% ${(y as number) * 100}%`
  );

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!followCursor) return;
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [followCursor, mouseX, mouseY]
  );

  const gradientValue = variant === 'custom' && gradient ? gradient : GRADIENTS[variant];

  if (animated) {
    return (
      <motion.div
        className={cn('relative', className)}
        onMouseMove={handleMouseMove}
        style={{
          background: gradientValue,
          backgroundPosition: followCursor ? backgroundPosition : undefined,
          opacity,
        }}
        animate={
          !followCursor
            ? {
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }
            : undefined
        }
        transition={
          !followCursor
            ? {
                duration: animationDuration,
                repeat: Infinity,
                ease: 'linear',
              }
            : undefined
        }
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={cn('relative', className)}
      style={{
        background: gradientValue,
        opacity,
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// GRADIENT TEXT
// ============================================

export interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  /** Gradient variant */
  variant?: 'gold' | 'silver' | 'warm' | 'custom';
  /** Custom gradient (only used when variant='custom') */
  gradient?: string;
  /** Whether to animate the gradient. Default: false */
  animated?: boolean;
  /** Animation duration in seconds. Default: 3 */
  animationDuration?: number;
  /** HTML tag to render. Default: 'span' */
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
}

const TEXT_GRADIENTS = {
  gold: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
  silver: 'linear-gradient(135deg, #F5F5F5 0%, #A0A0A0 50%, #F5F5F5 100%)',
  warm: 'linear-gradient(135deg, #FAF9F7 0%, #E5E5E0 50%, #FAF9F7 100%)',
  custom: '',
};

/**
 * Text with gradient fill effect.
 * Gold gradient should be used sparingly (1-2% budget) for earned moments.
 *
 * @example
 * // Gold gradient for achievement
 * <GradientText variant="gold">
 *   Achievement Unlocked
 * </GradientText>
 *
 * @example
 * // Animated shimmer effect
 * <GradientText variant="gold" animated>
 *   Live Now
 * </GradientText>
 */
export function GradientText({
  children,
  className,
  variant = 'gold',
  gradient,
  animated = false,
  animationDuration = 3,
  as: Tag = 'span',
}: GradientTextProps) {
  const gradientValue = variant === 'custom' && gradient ? gradient : TEXT_GRADIENTS[variant];

  const baseStyles: React.CSSProperties = {
    backgroundImage: gradientValue,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    backgroundSize: animated ? '200% auto' : 'auto',
  };

  if (animated) {
    return (
      <motion.span
        className={className}
        style={baseStyles}
        animate={{
          backgroundPosition: ['0% center', '200% center'],
        }}
        transition={{
          duration: animationDuration,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <Tag className={className} style={baseStyles}>
      {children}
    </Tag>
  );
}

// ============================================
// GRADIENT ORBS (Ambient Background)
// ============================================

export interface GradientOrbProps {
  className?: string;
  /** Color of the orb */
  color?: 'gold' | 'white' | 'warm';
  /** Size in pixels. Default: 400 */
  size?: number;
  /** Opacity. Default: 0.15 */
  opacity?: number;
  /** Position as percentage. Default: { x: 50, y: 50 } */
  position?: { x: number; y: number };
  /** Whether orb slowly drifts. Default: true */
  animated?: boolean;
}

/**
 * Floating gradient orb for ambient background effects.
 * Creates depth and atmosphere when layered.
 *
 * @example
 * <div className="relative">
 *   <GradientOrb color="gold" position={{ x: 20, y: 30 }} opacity={0.1} />
 *   <GradientOrb color="warm" position={{ x: 80, y: 70 }} size={600} />
 *   <Content />
 * </div>
 */
export function GradientOrb({
  className,
  color = 'warm',
  size = 400,
  opacity = 0.15,
  position = { x: 50, y: 50 },
  animated = true,
}: GradientOrbProps) {
  const colors = {
    gold: 'rgba(255, 215, 0, 0.4)',
    white: 'rgba(255, 255, 255, 0.2)',
    warm: 'rgba(255, 245, 235, 0.3)',
  };

  return (
    <motion.div
      className={cn('absolute pointer-events-none rounded-full', className)}
      style={{
        width: size,
        height: size,
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${colors[color]} 0%, transparent 70%)`,
        opacity,
        filter: 'blur(60px)',
      }}
      animate={
        animated
          ? {
              x: [0, 20, -10, 0],
              y: [0, -15, 10, 0],
            }
          : undefined
      }
      transition={
        animated
          ? {
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
    />
  );
}

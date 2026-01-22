'use client';

/**
 * Border Glow Motion Primitives
 *
 * Animated border effects for HIVE's premium interaction states.
 * Pulse, trail, and breathe effects for earned moments and life indicators.
 *
 * Philosophy:
 * - Border glow = life, presence, achievement (gold)
 * - Pulse = heartbeat, activity, online status
 * - Trail = motion, following, attention
 * - Breathe = ambient life, calm presence
 * - White glow for focus states (never gold for focus)
 */

import * as React from 'react';
import { useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { MOTION } from '../../../tokens/motion';

// ============================================
// GLOW BORDER
// ============================================

export interface GlowBorderProps {
  children: React.ReactNode;
  className?: string;
  /** Glow color variant. Default: 'gold' */
  variant?: 'gold' | 'white' | 'success' | 'error';
  /** Glow intensity (0-1). Default: 0.15 */
  intensity?: number;
  /** Border radius. Default: '12px' */
  borderRadius?: string;
  /** Glow spread in pixels. Default: 20 */
  spread?: number;
  /** Whether glow is always visible or only on hover. Default: 'always' */
  mode?: 'always' | 'hover' | 'focus';
}

const GLOW_COLORS = {
  gold: 'rgba(255, 215, 0, 1)',
  white: 'rgba(255, 255, 255, 1)',
  success: 'rgba(34, 197, 94, 1)',
  error: 'rgba(239, 68, 68, 1)',
};

/**
 * Container with glowing border effect.
 * Use for achievement cards, active states, and premium CTAs.
 *
 * @example
 * // Gold glow for achievement
 * <GlowBorder variant="gold" intensity={0.2}>
 *   <AchievementCard />
 * </GlowBorder>
 *
 * @example
 * // White glow on hover for interactive cards
 * <GlowBorder variant="white" mode="hover" intensity={0.1}>
 *   <InteractiveCard />
 * </GlowBorder>
 */
export function GlowBorder({
  children,
  className,
  variant = 'gold',
  intensity = 0.15,
  borderRadius = '12px',
  spread = 20,
  mode = 'always',
}: GlowBorderProps) {
  const color = GLOW_COLORS[variant];
  const glowColor = color.replace('1)', `${intensity})`);

  const baseGlow = `0 0 ${spread}px ${glowColor}`;
  const hoverGlow = `0 0 ${spread * 1.5}px ${color.replace('1)', `${intensity * 1.5})`)}`;

  return (
    <motion.div
      className={cn('relative', className)}
      style={{ borderRadius }}
      initial={mode === 'always' ? { boxShadow: baseGlow } : { boxShadow: 'none' }}
      whileHover={
        mode === 'hover' || mode === 'always'
          ? { boxShadow: hoverGlow }
          : undefined
      }
      whileFocus={mode === 'focus' ? { boxShadow: baseGlow } : undefined}
      transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// PULSE BORDER
// ============================================

export interface PulseBorderProps {
  children: React.ReactNode;
  className?: string;
  /** Pulse color. Default: 'gold' */
  color?: 'gold' | 'white' | 'success';
  /** Pulse speed in ms. Default: 2000 */
  duration?: number;
  /** Border radius. Default: '12px' */
  borderRadius?: string;
  /** Whether pulse is active. Default: true */
  active?: boolean;
}

/**
 * Border with pulsing glow effect.
 * Use for live indicators, active presence, and attention-grabbing elements.
 *
 * @example
 * // Live indicator
 * <PulseBorder color="gold" active={isLive}>
 *   <LiveBadge />
 * </PulseBorder>
 */
export function PulseBorder({
  children,
  className,
  color = 'gold',
  duration = 2000,
  borderRadius = '12px',
  active = true,
}: PulseBorderProps) {
  const colors = {
    gold: ['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.25)', 'rgba(255, 215, 0, 0.1)'],
    white: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)'],
    success: ['rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.25)', 'rgba(34, 197, 94, 0.1)'],
  };

  const [minGlow, maxGlow, endGlow] = colors[color];

  return (
    <motion.div
      className={cn('relative', className)}
      style={{ borderRadius }}
      animate={
        active
          ? {
              boxShadow: [
                `0 0 20px ${minGlow}`,
                `0 0 40px ${maxGlow}`,
                `0 0 20px ${endGlow}`,
              ],
            }
          : { boxShadow: 'none' }
      }
      transition={
        active
          ? {
              duration: duration / 1000,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}

// ============================================
// TRAIL BORDER
// ============================================

export interface TrailBorderProps {
  children: React.ReactNode;
  className?: string;
  /** Trail color. Default: 'gold' */
  color?: 'gold' | 'white';
  /** Trail speed in ms. Default: 3000 */
  duration?: number;
  /** Border radius. Default: '12px' */
  borderRadius?: string;
  /** Border width. Default: 1 */
  borderWidth?: number;
  /** Whether trail is active. Default: true */
  active?: boolean;
}

/**
 * Border with trailing light effect.
 * Creates a light that moves around the border perimeter.
 *
 * @example
 * <TrailBorder color="gold" duration={2000}>
 *   <PremiumCard />
 * </TrailBorder>
 */
export function TrailBorder({
  children,
  className,
  color = 'gold',
  duration = 3000,
  borderRadius = '12px',
  borderWidth = 1,
  active = true,
}: TrailBorderProps) {
  const colors = {
    gold: '#FFD700',
    white: '#FFFFFF',
  };

  return (
    <div className={cn('relative', className)} style={{ borderRadius }}>
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          padding: borderWidth,
          background: active
            ? `conic-gradient(from 0deg, transparent, ${colors[color]}40, transparent 30%)`
            : 'transparent',
          borderRadius,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
        animate={
          active
            ? {
                rotate: 360,
              }
            : undefined
        }
        transition={
          active
            ? {
                duration: duration / 1000,
                repeat: Infinity,
                ease: 'linear',
              }
            : undefined
        }
      />

      {/* Static subtle border underneath */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          border: `${borderWidth}px solid rgba(255, 255, 255, 0.06)`,
          borderRadius,
        }}
      />

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
}

// ============================================
// BREATHE BORDER
// ============================================

export interface BreatheBorderProps {
  children: React.ReactNode;
  className?: string;
  /** Breathe color. Default: 'gold' */
  color?: 'gold' | 'white' | 'warm';
  /** Breathe cycle in ms. Default: 3000 */
  duration?: number;
  /** Border radius. Default: '12px' */
  borderRadius?: string;
  /** Whether breathe is active. Default: true */
  active?: boolean;
}

/**
 * Border with subtle breathing/pulsing border opacity.
 * More subtle than PulseBorder - for ambient life indication.
 *
 * @example
 * <BreatheBorder color="warm" active={hasActivity}>
 *   <SpaceCard />
 * </BreatheBorder>
 */
export function BreatheBorder({
  children,
  className,
  color = 'gold',
  duration = 3000,
  borderRadius = '12px',
  active = true,
}: BreatheBorderProps) {
  const colors = {
    gold: ['rgba(255, 215, 0, 0.08)', 'rgba(255, 215, 0, 0.15)'],
    white: ['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.10)'],
    warm: ['rgba(255, 245, 235, 0.04)', 'rgba(255, 245, 235, 0.10)'],
  };

  const [minOpacity, maxOpacity] = colors[color];

  return (
    <motion.div
      className={cn('relative', className)}
      style={{
        borderRadius,
        border: `1px solid ${minOpacity}`,
      }}
      animate={
        active
          ? {
              borderColor: [minOpacity, maxOpacity, minOpacity],
            }
          : undefined
      }
      transition={
        active
          ? {
              duration: duration / 1000,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}

// ============================================
// CURSOR TRAIL BORDER
// ============================================

export interface CursorTrailBorderProps {
  children: React.ReactNode;
  className?: string;
  /** Trail color. Default: 'gold' */
  color?: 'gold' | 'white';
  /** Glow size in pixels. Default: 100 */
  glowSize?: number;
  /** Border radius. Default: '12px' */
  borderRadius?: string;
}

/**
 * Border glow that follows cursor position.
 * Premium interaction for important cards and CTAs.
 *
 * @example
 * <CursorTrailBorder color="gold">
 *   <PremiumCTA />
 * </CursorTrailBorder>
 */
export function CursorTrailBorder({
  children,
  className,
  color = 'gold',
  glowSize = 100,
  borderRadius = '12px',
}: CursorTrailBorderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 200, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 200, damping: 30 });

  const colors = {
    gold: 'rgba(255, 215, 0, 0.3)',
    white: 'rgba(255, 255, 255, 0.2)',
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    // Fade out by moving to center
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      mouseX.set(rect.width / 2);
      mouseY.set(rect.height / 2);
    }
  }, [mouseX, mouseY]);

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      style={{ borderRadius }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cursor-following glow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: glowSize,
          height: glowSize,
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
          background: `radial-gradient(circle, ${colors[color]} 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Subtle base border */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius,
        }}
      />

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
}

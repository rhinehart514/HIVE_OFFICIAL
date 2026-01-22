'use client';

/**
 * Glass Motion Primitives
 *
 * Unified glass/blur pattern for HIVE's "Apple Glass Dark" aesthetic.
 * Consolidates scattered blur patterns across the codebase into reusable primitives.
 *
 * Philosophy:
 * - Glass = elevation and separation, not decoration
 * - Subtle blur (8px) = standard surfaces
 * - Heavy blur (16px) = modals, overlays
 * - Atmosphere blur (40px) = deep background separation
 * - Border is always subtle (6% white), never prominent
 */

import * as React from 'react';
import { motion, type MotionProps } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { MOTION } from '../../../tokens/motion';

// ============================================
// GLASS SURFACE
// ============================================

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  className?: string;
  /** Glass intensity. Default: 'standard' */
  intensity?: 'subtle' | 'standard' | 'heavy' | 'atmosphere';
  /** Background opacity (0-1). Default: 0.8 */
  backgroundOpacity?: number;
  /** Whether to show border. Default: true */
  border?: boolean;
  /** Border opacity (0-1). Default: 0.06 */
  borderOpacity?: number;
  /** Whether surface is interactive (adds hover states). Default: false */
  interactive?: boolean;
  /** Whether to animate on mount. Default: false */
  animate?: boolean;
  /** HTML tag. Default: 'div' */
  as?: 'div' | 'section' | 'article' | 'aside' | 'nav' | 'header' | 'footer';
}

const BLUR_VALUES = {
  subtle: 4,
  standard: 8,
  heavy: 16,
  atmosphere: 40,
};

/**
 * Glass surface with blur effect.
 * The primary surface primitive for cards, modals, and elevated content.
 *
 * @example
 * // Standard glass card
 * <GlassSurface className="p-6 rounded-xl">
 *   <CardContent />
 * </GlassSurface>
 *
 * @example
 * // Interactive glass button area
 * <GlassSurface interactive className="p-4 rounded-lg cursor-pointer">
 *   <ButtonContent />
 * </GlassSurface>
 *
 * @example
 * // Modal overlay
 * <GlassSurface intensity="heavy" backgroundOpacity={0.9} className="p-8 rounded-2xl">
 *   <ModalContent />
 * </GlassSurface>
 */
export function GlassSurface({
  children,
  className,
  intensity = 'standard',
  backgroundOpacity = 0.8,
  border = true,
  borderOpacity = 0.06,
  interactive = false,
  animate = false,
  as: Tag = 'div',
}: GlassSurfaceProps) {
  const blur = BLUR_VALUES[intensity];

  const baseStyles: React.CSSProperties = {
    backgroundColor: `rgba(20, 19, 18, ${backgroundOpacity})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    border: border ? `1px solid rgba(255, 255, 255, ${borderOpacity})` : 'none',
  };

  if (animate) {
    return (
      <motion.div
        className={cn(
          'relative',
          interactive && 'transition-colors hover:bg-white/[0.02]',
          className
        )}
        style={baseStyles}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: MOTION.duration.base,
          ease: MOTION.ease.premium,
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <Tag
      className={cn(
        'relative',
        interactive && 'transition-colors hover:bg-white/[0.02]',
        className
      )}
      style={baseStyles}
    >
      {children}
    </Tag>
  );
}

// ============================================
// GLASS PANEL
// ============================================

export interface GlassPanelProps extends GlassSurfaceProps {
  /** Panel has slight inset shadow for depth */
  inset?: boolean;
  /** Add warm edge glow (gold at 4% opacity) */
  warmth?: boolean;
}

/**
 * Glass panel with additional depth options.
 * Use for sidebars, cards, and contained content areas.
 *
 * @example
 * <GlassPanel inset className="p-4 rounded-lg">
 *   <SidebarContent />
 * </GlassPanel>
 */
export function GlassPanel({
  children,
  className,
  inset = false,
  warmth = false,
  ...props
}: GlassPanelProps) {
  return (
    <GlassSurface
      className={cn(
        inset && 'shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]',
        warmth && 'shadow-[inset_0_0_0_1px_rgba(255,215,0,0.04)]',
        className
      )}
      {...props}
    >
      {children}
    </GlassSurface>
  );
}

// ============================================
// GLASS OVERLAY
// ============================================

export interface GlassOverlayProps {
  children?: React.ReactNode;
  className?: string;
  /** Whether overlay is visible */
  visible: boolean;
  /** Called when clicking overlay background */
  onClose?: () => void;
  /** Blur intensity. Default: 'heavy' */
  intensity?: 'subtle' | 'standard' | 'heavy' | 'atmosphere';
  /** Background darkness (0-1). Default: 0.6 */
  darkness?: number;
}

/**
 * Full-screen glass overlay for modals and dialogs.
 * Handles backdrop blur and click-outside dismissal.
 *
 * @example
 * <GlassOverlay visible={isOpen} onClose={() => setIsOpen(false)}>
 *   <ModalContent />
 * </GlassOverlay>
 */
export function GlassOverlay({
  children,
  className,
  visible,
  onClose,
  intensity = 'heavy',
  darkness = 0.6,
}: GlassOverlayProps) {
  const blur = BLUR_VALUES[intensity];

  return (
    <motion.div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        !visible && 'pointer-events-none',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
      style={{
        backgroundColor: `rgba(0, 0, 0, ${darkness})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// GLASS PILL
// ============================================

export interface GlassPillProps {
  children: React.ReactNode;
  className?: string;
  /** Size variant. Default: 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Whether pill is active/selected */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Glass pill for tags, tabs, and selection states.
 * Commonly used in navigation and filters.
 *
 * @example
 * <GlassPill active={activeTab === 'chat'} onClick={() => setTab('chat')}>
 *   Chat
 * </GlassPill>
 */
export function GlassPill({
  children,
  className,
  size = 'md',
  active = false,
  onClick,
}: GlassPillProps) {
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <motion.button
      type="button"
      className={cn(
        'rounded-full font-medium transition-colors',
        'backdrop-blur-sm',
        active
          ? 'bg-white/10 text-white'
          : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/80',
        sizeStyles[size],
        className
      )}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}

// ============================================
// FROSTED EDGE
// ============================================

export interface FrostedEdgeProps {
  className?: string;
  /** Edge position. Default: 'bottom' */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Edge height/width in pixels. Default: 80 */
  size?: number;
}

/**
 * Frosted/blurred edge for scroll fade effects.
 * Creates smooth transition at edges of scrollable content.
 *
 * @example
 * <div className="relative overflow-hidden">
 *   <ScrollContent />
 *   <FrostedEdge position="bottom" />
 * </div>
 */
export function FrostedEdge({
  className,
  position = 'bottom',
  size = 80,
}: FrostedEdgeProps) {
  const positionStyles: Record<string, React.CSSProperties> = {
    top: {
      top: 0,
      left: 0,
      right: 0,
      height: size,
      background: 'linear-gradient(to bottom, var(--bg-ground) 0%, transparent 100%)',
    },
    bottom: {
      bottom: 0,
      left: 0,
      right: 0,
      height: size,
      background: 'linear-gradient(to top, var(--bg-ground) 0%, transparent 100%)',
    },
    left: {
      top: 0,
      bottom: 0,
      left: 0,
      width: size,
      background: 'linear-gradient(to right, var(--bg-ground) 0%, transparent 100%)',
    },
    right: {
      top: 0,
      bottom: 0,
      right: 0,
      width: size,
      background: 'linear-gradient(to left, var(--bg-ground) 0%, transparent 100%)',
    },
  };

  return (
    <div
      className={cn('absolute pointer-events-none z-10', className)}
      style={positionStyles[position]}
    />
  );
}

/**
 * GlassSurface - Glass morphism primitive for Spaces
 *
 * Provides consistent glass morphism styling with configurable variants.
 * Uses subtle 8px blur for elegant, non-distracting appearance.
 *
 * @example
 * <GlassSurface variant="card" glow="gold">
 *   <CardContent />
 * </GlassSurface>
 */
'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { glass, type GlassPanel, type GlassElevated, type GlassGlow, type GlassDepth } from '../../../lib/glass-morphism';

// Surface variant types
type SurfaceVariant = 'panel' | 'card' | 'modal' | 'dropdown' | 'header' | 'widget';

export interface GlassSurfaceProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Surface variant - determines base glass styling */
  variant?: SurfaceVariant;
  /** Optional glow effect */
  glow?: 'gold' | 'goldHover' | 'goldRing' | 'none';
  /** Shadow depth level */
  depth?: GlassDepth | 'none';
  /** Panel sub-variant when variant="panel" */
  panelType?: GlassPanel;
  /** Border radius preset */
  rounded?: 'none' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  /** Whether to include gold border accent */
  goldBorder?: boolean;
  /** Whether this is an interactive element (enables hover states) */
  interactive?: boolean;
  /** Children content */
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<SurfaceVariant, string> = {
  panel: glass.panel.default,
  card: glass.elevated.card,
  modal: glass.elevated.modal,
  dropdown: glass.elevated.dropdown,
  header: glass.sticky.header,
  widget: `${glass.panel.light} ${glass.depth.shallow}`,
};

const GLOW_CLASSES: Record<string, string> = {
  gold: glass.glow.gold,
  goldHover: glass.glow.goldHover,
  goldRing: glass.glow.goldRing,
  none: '',
};

const DEPTH_CLASSES: Record<GlassDepth | 'none', string> = {
  shallow: glass.depth.shallow,
  medium: glass.depth.medium,
  deep: glass.depth.deep,
  dramatic: glass.depth.dramatic,
  hoverLift: glass.depth.hoverLift,
  none: '',
};

const ROUNDED_CLASSES: Record<string, string> = {
  none: 'rounded-none',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  (
    {
      variant = 'panel',
      glow = 'none',
      depth = 'none',
      panelType = 'default',
      rounded = '2xl',
      goldBorder = false,
      interactive = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Build base classes from variant
    const baseClass = variant === 'panel'
      ? glass.panel[panelType]
      : VARIANT_CLASSES[variant];

    const classes = cn(
      // Base glass styling
      baseClass,
      // Glow effect
      GLOW_CLASSES[glow],
      // Depth/shadow
      DEPTH_CLASSES[depth],
      // Border radius
      ROUNDED_CLASSES[rounded],
      // Gold border accent
      goldBorder && glass.border.goldSubtle,
      goldBorder && interactive && glass.border.goldHover,
      // Interactive hover states
      interactive && variant === 'card' && glass.elevated.cardHover,
      // Overflow handling
      'overflow-hidden',
      // Relative for child positioning
      'relative',
      className
    );

    return (
      <motion.div ref={ref} className={classes} {...props}>
        {children}
      </motion.div>
    );
  }
);

GlassSurface.displayName = 'GlassSurface';

// Convenience presets for common use cases
export const GlassCard = React.forwardRef<HTMLDivElement, Omit<GlassSurfaceProps, 'variant'>>(
  (props, ref) => <GlassSurface ref={ref} variant="card" goldBorder interactive {...props} />
);
GlassCard.displayName = 'GlassCard';

export const GlassWidget = React.forwardRef<HTMLDivElement, Omit<GlassSurfaceProps, 'variant'>>(
  (props, ref) => <GlassSurface ref={ref} variant="widget" rounded="2xl" {...props} />
);
GlassWidget.displayName = 'GlassWidget';

export const GlassModal = React.forwardRef<HTMLDivElement, Omit<GlassSurfaceProps, 'variant'>>(
  (props, ref) => <GlassSurface ref={ref} variant="modal" depth="dramatic" {...props} />
);
GlassModal.displayName = 'GlassModal';

export const GlassHeader = React.forwardRef<HTMLDivElement, Omit<GlassSurfaceProps, 'variant' | 'rounded'>>(
  (props, ref) => <GlassSurface ref={ref} variant="header" rounded="none" {...props} />
);
GlassHeader.displayName = 'GlassHeader';

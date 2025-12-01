/**
 * HIVE Glass Morphism System
 * Subtle variant (8px blur) - elegant, not distracting
 *
 * Usage:
 * import { glass, glassPresets } from '@hive/ui/lib/glass-morphism';
 * <div className={glass.panel.default} />
 * <div className={glassPresets.discoveryCard} />
 */

export const glass = {
  // Base glass panels
  panel: {
    default: 'bg-neutral-900/80 backdrop-blur-[8px] border border-white/[0.06]',
    light: 'bg-white/5 backdrop-blur-[8px] border border-white/[0.08]',
    medium: 'bg-neutral-900/70 backdrop-blur-[8px] border border-white/[0.08]',
  },

  // Elevated glass (cards, modals)
  elevated: {
    card: 'bg-neutral-900/85 backdrop-blur-[8px] border border-neutral-800/50 shadow-xl',
    cardHover: 'hover:bg-neutral-900/90 hover:border-neutral-700/50',
    modal: 'bg-neutral-900/92 backdrop-blur-[8px] border border-white/[0.08] shadow-2xl',
    dropdown: 'bg-neutral-900/95 backdrop-blur-[8px] border border-neutral-700/50 shadow-xl',
  },

  // Sticky headers
  sticky: {
    header: 'bg-black/85 backdrop-blur-[8px] border-b border-white/[0.06]',
    transparent: 'bg-transparent backdrop-blur-[8px] border-b border-white/[0.04]',
    solid: 'bg-neutral-950/95 backdrop-blur-[8px] border-b border-neutral-800',
  },

  // Glow effects (gold brand accent)
  glow: {
    gold: 'bg-gradient-to-t from-[#FFD700]/8 via-transparent to-transparent',
    goldOverlay: 'before:absolute before:inset-0 before:bg-gradient-to-t before:from-[#FFD700]/8 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none',
    goldHover: 'hover:shadow-[0_0_20px_rgba(255,215,0,0.08)]',
    goldRing: 'ring-2 ring-[#FFD700]/20',
  },

  // Depth shadows (dark theme optimized)
  depth: {
    shallow: 'shadow-lg shadow-black/10',
    medium: 'shadow-xl shadow-black/20',
    deep: 'shadow-2xl shadow-black/30',
    dramatic: 'shadow-[0_32px_64px_rgba(0,0,0,0.4)]',
    hoverLift: 'shadow-[0_24px_48px_rgba(0,0,0,0.3)]',
  },

  // Border variants
  border: {
    subtle: 'border border-white/[0.06]',
    medium: 'border border-white/[0.1]',
    strong: 'border border-white/[0.15]',
    goldSubtle: 'border border-[rgba(255,215,0,0.08)]',
    goldHover: 'hover:border-[rgba(255,215,0,0.15)]',
  },
} as const;

// Composable presets for common use cases
export const glassPresets = {
  // Discovery page cards
  discoveryCard: `${glass.elevated.card} ${glass.border.goldSubtle} ${glass.elevated.cardHover} ${glass.border.goldHover} relative overflow-hidden`,

  // Hero cards (more dramatic)
  heroCard: `${glass.elevated.card} ${glass.depth.deep} ${glass.border.goldSubtle} relative overflow-hidden`,

  // Sidebar widgets
  railWidget: `${glass.panel.light} ${glass.depth.shallow} rounded-2xl`,

  // Sticky navigation
  stickyHeader: glass.sticky.header,

  // Modals and sheets
  modal: `${glass.elevated.modal} rounded-2xl`,

  // Dropdowns
  dropdown: `${glass.elevated.dropdown} rounded-xl`,

  // Collapsible sections
  collapsible: `${glass.panel.default} rounded-2xl overflow-hidden`,
} as const;

// CSS variables for dynamic theming (if needed)
export const glassCSSVars = {
  '--glass-blur': '8px',
  '--glass-opacity': '0.85',
  '--glass-border': 'rgba(255, 255, 255, 0.06)',
  '--glass-glow-gold': 'rgba(255, 215, 0, 0.08)',
} as const;

export type GlassPanel = keyof typeof glass.panel;
export type GlassElevated = keyof typeof glass.elevated;
export type GlassSticky = keyof typeof glass.sticky;
export type GlassGlow = keyof typeof glass.glow;
export type GlassDepth = keyof typeof glass.depth;
export type GlassBorder = keyof typeof glass.border;
export type GlassPreset = keyof typeof glassPresets;

/**
 * Premium Design System - ChatGPT/Apple Fusion
 *
 * Design Philosophy:
 * - ChatGPT: Conversational warmth, composer as star, messages breathe
 * - Apple: Translucent materials, physics-based motion, obsessive alignment
 *
 * This file defines the design tokens and utilities for the premium
 * Spaces experience targeting YC/SF tech standards.
 *
 * @author HIVE Frontend Team
 * @version 1.0.0 - Premium redesign
 */

// ============================================================
// Typography
// ============================================================

export const premiumTypography = {
  // Display - For hero moments
  display: {
    xl: 'text-[32px] font-semibold tracking-[-0.02em] leading-[1.1]',
    lg: 'text-[24px] font-semibold tracking-[-0.015em] leading-[1.2]',
    md: 'text-[20px] font-semibold tracking-[-0.01em] leading-[1.25]',
  },
  // Headings
  heading: {
    lg: 'text-[18px] font-semibold tracking-[-0.01em] leading-[1.3]',
    md: 'text-[16px] font-semibold tracking-[-0.005em] leading-[1.4]',
    sm: 'text-[14px] font-medium tracking-normal leading-[1.4]',
  },
  // Body - Main content
  body: {
    chat: 'text-[17px] font-normal tracking-normal leading-[1.6]', // ChatGPT-style
    lg: 'text-[16px] font-normal tracking-normal leading-[1.6]',
    md: 'text-[15px] font-normal tracking-normal leading-[1.5]',
    sm: 'text-[14px] font-normal tracking-normal leading-[1.5]',
  },
  // Meta - Secondary information
  meta: {
    md: 'text-[13px] font-normal tracking-normal leading-[1.4]',
    sm: 'text-[12px] font-normal tracking-normal leading-[1.4]',
    xs: 'text-[11px] font-medium tracking-[0.02em] leading-[1.3] uppercase',
  },
} as const;

// ============================================================
// Colors - Semantic mappings for premium feel
// ============================================================

export const premiumColors = {
  // Backgrounds - Layered depth
  bg: {
    base: '#0A0A0A',      // Page background
    surface: '#111111',   // Slightly lighter for cards (was #141414)
    elevated: '#181818',  // Hover states, elevated surfaces
    glass: 'rgba(255, 255, 255, 0.03)', // Glass morphism base
    glassHover: 'rgba(255, 255, 255, 0.06)',
    glassActive: 'rgba(255, 255, 255, 0.09)',
  },
  // Text - High contrast hierarchy
  text: {
    primary: '#FAFAFA',     // Main content
    secondary: '#9A9A9F',   // Supporting (slightly warmer than before)
    tertiary: '#6B6B70',    // Subtle
    disabled: '#4A4A4F',    // Disabled states
    inverse: '#0A0A0A',     // On gold/light backgrounds
  },
  // Borders - Subtle layering
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',  // Very subtle
    default: 'rgba(255, 255, 255, 0.10)', // Standard
    hover: 'rgba(255, 255, 255, 0.15)',   // Hover
    strong: 'rgba(255, 255, 255, 0.20)',  // Emphasized
    focus: 'rgba(255, 255, 255, 0.40)',   // Focus rings
  },
  // Gold - Reserved for CTAs and achievements ONLY
  gold: {
    primary: '#FFD700',
    hover: '#E6C200',
    // Removed: glow, subtle, border - these encouraged decorative gold usage
  },
  // Status
  status: {
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
} as const;

// ============================================================
// Spacing - ChatGPT-style generous breathing room
// ============================================================

export const premiumSpacing = {
  // Message list
  message: {
    groupGap: '4px',      // Between grouped messages (same author)
    blockGap: '20px',     // Between different authors
    padding: {
      x: '20px',          // Horizontal padding
      y: '16px',          // Vertical padding for non-grouped
    },
  },
  // Cards/Widgets
  card: {
    padding: '20px',
    gap: '16px',
    radius: '16px',       // Apple-style generous radius
  },
  // Composer
  composer: {
    padding: '20px 24px',
    radius: '20px',       // Extra rounded for focus
    maxWidth: '800px',    // Centered, not full width
  },
  // Sidebar
  sidebar: {
    width: '380px',
    padding: '20px',
    cardGap: '16px',
  },
} as const;

// ============================================================
// Glass Morphism - Apple-style translucency
// ============================================================

export const premiumGlass = {
  // Card glass effect
  card: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
  },
  // Floating elements (composer, action bar)
  floating: {
    background: 'rgba(17, 17, 17, 0.85)',
    backdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.10)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
  },
  // Header bar
  header: {
    background: 'rgba(10, 10, 10, 0.80)',
    backdropFilter: 'blur(20px) saturate(150%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  // Action buttons on hover
  action: {
    background: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
} as const;

// ============================================================
// Motion - Physics-based springs (Framer Motion)
// ============================================================

export const premiumMotion = {
  // Springs
  spring: {
    // Snappy - buttons, toggles, immediate feedback
    snappy: { type: 'spring', stiffness: 500, damping: 30, mass: 1 },
    // Default - most UI interactions
    default: { type: 'spring', stiffness: 300, damping: 25, mass: 1 },
    // Gentle - modals, larger movements
    gentle: { type: 'spring', stiffness: 200, damping: 20, mass: 1 },
    // Bouncy - celebrations, achievements
    bouncy: { type: 'spring', stiffness: 400, damping: 15, mass: 1 },
  },
  // Durations (for non-spring animations)
  duration: {
    instant: 0.1,
    fast: 0.15,
    normal: 0.25,
    slow: 0.4,
  },
  // Easings
  easing: {
    smooth: [0.23, 1, 0.32, 1],      // Apple-style silk
    snap: [0.25, 0.1, 0.25, 1],      // Quick snap
    out: [0, 0, 0.2, 1],             // Deceleration
    in: [0.4, 0, 1, 1],              // Acceleration
  },
  // Stagger delays
  stagger: {
    fast: 0.03,
    default: 0.05,
    slow: 0.08,
  },
} as const;

// ============================================================
// Component Presets - Ready-to-use class combinations
// ============================================================

export const premiumPresets = {
  // Glass card
  glassCard: `
    bg-[rgba(255,255,255,0.03)]
    backdrop-blur-[20px]
    border border-white/[0.06]
    rounded-2xl
  `.trim().replace(/\s+/g, ' '),

  // Floating composer
  floatingComposer: `
    bg-[rgba(17,17,17,0.85)]
    backdrop-blur-[24px]
    border border-white/[0.10]
    rounded-[20px]
    shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]
  `.trim().replace(/\s+/g, ' '),

  // Glass header
  glassHeader: `
    bg-[rgba(10,10,10,0.80)]
    backdrop-blur-[20px]
    border-b border-white/[0.06]
  `.trim().replace(/\s+/g, ' '),

  // Action button (hover state container)
  actionButton: `
    bg-white/[0.06]
    backdrop-blur-[12px]
    border border-white/[0.08]
    rounded-xl
  `.trim().replace(/\s+/g, ' '),

  // Gold accent button
  goldButton: `
    bg-[#FFD700]
    text-black
    font-semibold
    rounded-xl
    hover:bg-[#E6C200]
    transition-colors
  `.trim().replace(/\s+/g, ' '),

  // Text classes
  textPrimary: 'text-[#FAFAFA]',
  textSecondary: 'text-[#9A9A9F]',
  textTertiary: 'text-[#6B6B70]',
  textGold: 'text-[#FFD700]',
} as const;

// ============================================================
// Tailwind Class Generators
// ============================================================

/**
 * Generate glass morphism classes with optional intensity
 */
export function glassClasses(intensity: 'subtle' | 'medium' | 'strong' = 'medium'): string {
  const intensityMap = {
    subtle: 'bg-white/[0.02] backdrop-blur-[12px] border-white/[0.04]',
    medium: 'bg-white/[0.03] backdrop-blur-[20px] border-white/[0.06]',
    strong: 'bg-white/[0.05] backdrop-blur-[24px] border-white/[0.08]',
  };
  return `${intensityMap[intensity]} border rounded-2xl`;
}

/**
 * Generate hover effect classes
 */
export function hoverClasses(variant: 'subtle' | 'lift' | 'glow' = 'subtle'): string {
  const variantMap = {
    subtle: 'hover:bg-white/[0.04] transition-colors duration-150',
    lift: 'hover:translate-y-[-2px] hover:shadow-lg transition-all duration-200',
    glow: 'hover:border-neutral-600 transition-colors duration-200',
  };
  return variantMap[variant];
}

/**
 * Generate focus ring classes - always white for consistency
 */
export function focusClasses(): string {
  return 'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]';
}

// ============================================================
// Export everything
// ============================================================

export const premium = {
  typography: premiumTypography,
  colors: premiumColors,
  spacing: premiumSpacing,
  glass: premiumGlass,
  motion: premiumMotion,
  presets: premiumPresets,
  utils: {
    glassClasses,
    hoverClasses,
    focusClasses,
  },
} as const;

export default premium;

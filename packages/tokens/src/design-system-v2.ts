/**
 * HIVE Design System V2
 * Dark-only. The void is the brand.
 *
 * Design Direction:
 * - Monochrome-dominant: primary palette is white-on-void
 * - Color is the exception, not the rule
 * - Hierarchy through opacity, not hue
 * - Gold restricted to logo/brand mark and leader status indicators ONLY
 * - Light typography weights (400-600 max, never bold/black)
 * - Pillowy corners (16px+ on containers)
 *
 * References: Apple (hardware precision), ChatGPT (dark UI), Discord (community-native)
 */

// ============================================================================
// FOUNDATION: NEUTRAL GRAYSCALE (Apple approach)
// ============================================================================

/**
 * Raw color values - use semantic tokens in components
 */
export const colors = {
  // Backgrounds - Neutral, no tint
  black: '#000000',
  bgBase: '#0A0A0A',        // Page background
  bgSurface: '#141414',     // Cards, inputs, elevated
  bgElevated: '#1A1A1A',    // Hover states
  bgActive: '#242424',      // Active/pressed states

  // Text hierarchy
  textPrimary: '#FAFAFA',   // Main content
  textSecondary: '#A1A1A6', // Supporting content
  textSubtle: '#818187',    // Timestamps, metadata (bumped for accessibility)
  textDisabled: '#52525B',  // Disabled states

  // Borders
  borderDefault: '#2A2A2A', // Standard borders
  borderHover: '#3A3A3A',   // Hover state borders
  borderFocus: 'rgba(255, 255, 255, 0.50)', // Focus rings (white, NOT gold)

  // Brand - Gold
  gold: '#FFD700',          // Primary gold (canonical)
  goldDim: '#CC9900',       // Muted gold
  goldGlow: 'rgba(255, 215, 0, 0.15)', // Glow effect

  // Status
  success: '#00D46A',       // Green
  error: '#FF3737',         // Red
  warning: '#FFB800',       // Amber

  // Pure
  white: '#FFFFFF',
} as const;

// ============================================================================
// 12-STEP SCALES (for granular control)
// ============================================================================

export const scale = {
  // Gray scale - 12 steps, neutral
  gray: {
    1: '#0A0A0A',   // App background
    2: '#141414',   // Subtle background / surface
    3: '#1A1A1A',   // UI element background
    4: '#242424',   // Hovered element
    5: '#2E2E2E',   // Active element
    6: '#2A2A2A',   // Subtle border
    7: '#3A3A3A',   // Element border
    8: '#4A4A4A',   // Hovered border
    9: '#6A6A6A',   // Solid background
    10: '#818187',  // Subtle text
    11: '#A1A1A6',  // Secondary text
    12: '#FAFAFA',  // Primary text
  },

  // Gold scale - brand accent
  gold: {
    1: '#1A1500',   // Subtle background
    2: '#2A2200',   // UI background
    3: '#3D3300',   // Hovered
    4: '#524400',   // Active
    5: '#665500',   // Subtle border
    6: '#806B00',   // Border
    7: '#998000',   // Hovered border
    8: '#B39500',   // Solid background
    9: '#FFD700',   // Primary gold (canonical)
    10: '#FFE033',  // Hovered solid
    11: '#FFEB66',  // Low contrast text
    12: '#FFF5B3',  // High contrast text
  },

  // Status colors
  green: {
    9: '#00D46A',   // Success
    10: '#22DD77',  // Success hover
  },
  red: {
    9: '#FF3737',   // Error
    10: '#FF5555',  // Error hover
  },
  amber: {
    9: '#FFB800',   // Warning
    10: '#FFC933',  // Warning hover
  },
} as const;

// ============================================================================
// SEMANTIC TOKENS (CSS Variables)
// ============================================================================

export const cssVariables = {
  root: {
    // Radius base
    '--radius': '0.75rem', // 12px base

    // Backgrounds
    '--background': colors.bgBase,
    '--foreground': colors.textPrimary,
    '--card': colors.bgSurface,
    '--card-foreground': colors.textPrimary,
    '--popover': colors.bgSurface,
    '--popover-foreground': colors.textPrimary,

    // Primary (Gold)
    '--primary': colors.gold,
    '--primary-foreground': colors.bgBase,

    // Secondary
    '--secondary': colors.bgElevated,
    '--secondary-foreground': colors.textPrimary,

    // Subtle (renamed from muted)
    '--muted': colors.bgElevated,
    '--muted-foreground': colors.textSubtle,

    // Accent
    '--accent': colors.bgActive,
    '--accent-foreground': colors.textPrimary,

    // Destructive
    '--destructive': colors.error,
    '--destructive-foreground': colors.textPrimary,

    // Border & Input
    '--border': colors.borderDefault,
    '--input': colors.bgSurface,
    '--ring': 'rgba(255, 255, 255, 0.50)', // WHITE focus rings, never gold

    // Chart colors
    '--chart-1': colors.gold,
    '--chart-2': colors.textSecondary,
    '--chart-3': colors.success,
    '--chart-4': scale.gold[8],
    '--chart-5': colors.error,

    // HIVE-specific semantic tokens
    '--hive-bg-base': colors.bgBase,
    '--hive-bg-surface': colors.bgSurface,
    '--hive-bg-elevated': colors.bgElevated,
    '--hive-bg-active': colors.bgActive,

    '--hive-text-primary': colors.textPrimary,
    '--hive-text-secondary': colors.textSecondary,
    '--hive-text-subtle': colors.textSubtle,
    '--hive-text-disabled': colors.textDisabled,

    '--hive-border-default': colors.borderDefault,
    '--hive-border-hover': colors.borderHover,
    '--hive-border-focus': colors.borderFocus,

    '--hive-gold': colors.gold,
    '--hive-gold-dim': colors.goldDim,
    '--hive-gold-glow': colors.goldGlow,

    '--hive-success': colors.success,
    '--hive-error': colors.error,
    '--hive-warning': colors.warning,
  },
} as const;

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

export const componentTokens = {
  button: {
    // PRIMARY: Solid white - the main CTA
    primary: {
      bg: colors.white,
      text: colors.bgBase,
      hover: 'rgba(255, 255, 255, 0.90)',
      radius: '24px', // rounded-3xl
    },
    // SECONDARY: Ghost/outline - supporting actions
    secondary: {
      bg: 'transparent',
      text: colors.textPrimary,
      border: 'rgba(255, 255, 255, 0.08)',
      hoverBg: 'rgba(255, 255, 255, 0.04)',
      hoverBorder: 'rgba(255, 255, 255, 0.12)',
      radius: '24px', // rounded-3xl
    },
    // GHOST: Text only - tertiary actions
    ghost: {
      bg: 'transparent',
      text: 'rgba(255, 255, 255, 0.60)',
      hoverText: colors.textPrimary,
    },
    // ICON: Square icon buttons
    icon: {
      bg: 'rgba(255, 255, 255, 0.04)',
      border: 'rgba(255, 255, 255, 0.06)',
      hoverBg: 'rgba(255, 255, 255, 0.08)',
      radius: '12px', // rounded-xl
    },
    destructive: {
      bg: colors.error,
      text: colors.textPrimary,
      hover: scale.red[10],
    },
  },

  card: {
    // Default card - glass surface
    default: {
      bg: 'rgba(255, 255, 255, 0.02)',
      border: 'rgba(255, 255, 255, 0.06)',
      text: colors.textPrimary,
      radius: '16px', // rounded-2xl
    },
    // Interactive card with hover states
    interactive: {
      bg: 'rgba(255, 255, 255, 0.02)',
      border: 'rgba(255, 255, 255, 0.06)',
      hoverBg: 'rgba(255, 255, 255, 0.04)',
      hoverBorder: 'rgba(255, 255, 255, 0.12)',
      radius: '16px', // rounded-2xl
    },
  },

  input: {
    // Ghost style input (default)
    default: {
      bg: 'rgba(255, 255, 255, 0.03)',
      border: 'rgba(255, 255, 255, 0.08)',
      text: colors.textPrimary,
      placeholder: 'rgba(255, 255, 255, 0.30)',
      focusBg: 'rgba(255, 255, 255, 0.05)',
      focusBorder: 'rgba(255, 255, 255, 0.20)',
      focusRing: 'rgba(255, 255, 255, 0.50)', // White, never gold
      radius: '12px', // rounded-xl
      height: '44px', // h-11
    },
  },

  avatar: {
    bg: colors.bgElevated,
    text: colors.textSecondary,
    border: colors.bgBase,
    onlineRing: colors.gold,
  },

  badge: {
    default: {
      bg: colors.bgElevated,
      text: colors.textSecondary,
    },
    primary: {
      bg: colors.gold,
      text: colors.bgBase,
    },
    outline: {
      bg: 'transparent',
      text: colors.textPrimary,
      border: colors.borderDefault,
    },
    success: {
      bg: colors.success,
      text: colors.bgBase,
    },
    error: {
      bg: colors.error,
      text: colors.textPrimary,
    },
  },

  presence: {
    online: colors.gold,
    offline: colors.textDisabled,
    away: colors.goldDim,
  },
} as const;

// ============================================================================
// SPACING (4px base - unchanged)
// ============================================================================

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px (touch target)
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px (hero input)
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// ============================================================================
// RADIUS (Shape Language)
// ============================================================================
// Pillowy corners - 16px+ on containers. Smaller for nested elements.

export const radius = {
  none: '0',
  sm: '4px',        // Subtle rounding (rarely used)
  md: '8px',        // Small elements
  lg: '12px',       // Inputs (rounded-xl in Tailwind)
  xl: '16px',       // Cards, modals (rounded-2xl) - default container radius
  '2xl': '20px',    // Large containers
  '3xl': '24px',    // Buttons, pills (rounded-3xl)
  full: '9999px',   // Chips, badges, avatars

  // Semantic aliases for clarity
  button: '24px',   // Primary/secondary buttons
  card: '16px',     // Cards, modals
  input: '12px',    // Inputs, text fields
  chip: '9999px',   // Chips, badges
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================
// Weight Philosophy: Never use bold (700) or black (900). Elegance through lightness.
// Regular (400) for body, Medium (500) for emphasis, Semibold (600) for headlines only.

export const typography = {
  fontFamily: {
    sans: ['Geist Sans', 'system-ui', 'sans-serif'],
    display: ['Geist Sans', 'system-ui', 'sans-serif'], // System font for display too
    mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
  },
  fontSize: {
    // HIVE Type Scale - aligned with design principles
    'display': ['2.5rem', { lineHeight: '1.1', fontWeight: '600' }],      // 40px - Hero titles
    'title-xl': ['2rem', { lineHeight: '1.2', fontWeight: '400' }],       // 32px - Page titles
    'title-lg': ['1.5rem', { lineHeight: '1.3', fontWeight: '500' }],     // 24px - Section headers
    'title': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],       // 20px - Card titles
    'body-lg': ['1.0625rem', { lineHeight: '1.5', fontWeight: '400' }],   // 17px - Large body
    'body': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],      // 15px - Default body
    'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],   // 13px - Secondary text
    'label': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],       // 12px - Labels, uppercase
    'caption': ['0.6875rem', { lineHeight: '1.4', fontWeight: '400' }],   // 11px - Timestamps, meta

    // Legacy scale (for compatibility)
    xs: ['0.75rem', { lineHeight: '1rem' }],        // 12px
    sm: ['0.8125rem', { lineHeight: '1.25rem' }],   // 13px
    base: ['0.9375rem', { lineHeight: '1.5rem' }],  // 15px
    lg: ['1.0625rem', { lineHeight: '1.75rem' }],   // 17px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],     // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
    '3xl': ['2rem', { lineHeight: '2.25rem' }],     // 32px
    '4xl': ['2.5rem', { lineHeight: '2.5rem' }],    // 40px
    '5xl': ['3rem', { lineHeight: '1.2' }],         // 48px

    // Mono scale (JetBrains Mono)
    'mono-sm': ['0.75rem', { lineHeight: '1.4' }],  // 12px
    'mono-md': ['0.875rem', { lineHeight: '1.5' }], // 14px
  },
  fontWeight: {
    // IMPORTANT: Never use bold (700) or black (900)
    normal: '400',   // Body, labels, most text
    medium: '500',   // Emphasis, card titles
    semibold: '600', // Headlines only - MAX weight allowed
  },
  letterSpacing: {
    tighter: '-0.03em',
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.05em',
    widest: '0.1em',
  },
  // Text opacity scale for hierarchy
  opacity: {
    primary: 0.70,    // Body text, labels - text-white/70
    secondary: 0.50,  // Helper text, metadata - text-white/50
    tertiary: 0.30,   // Disabled, placeholders - text-white/30
    emphasis: 0.90,   // Headlines, active states - text-white/90
  },
} as const;

// ============================================================================
// ANIMATION
// ============================================================================

export const animation = {
  duration: {
    instant: '75ms',    // Micro-feedback
    fast: '150ms',      // Hovers, toggles
    normal: '200ms',    // Standard
    smooth: '250ms',    // Layout changes
    slow: '300ms',      // Complex transitions
    dramatic: '400ms',  // Page transitions, modals
  },
  easing: {
    default: 'cubic-bezier(0.25, 0.1, 0.25, 1)',    // Smooth
    snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',          // Quick settle
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',    // Overshoot
    in: 'cubic-bezier(0.4, 0, 1, 1)',               // Ease in
    out: 'cubic-bezier(0, 0, 0.2, 1)',              // Ease out
  },
} as const;

// ============================================================================
// SHADOWS (optimized for dark mode)
// ============================================================================

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 12px rgba(0, 0, 0, 0.25)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.3)',
  xl: '0 12px 32px rgba(0, 0, 0, 0.4)',
  '2xl': '0 24px 48px rgba(0, 0, 0, 0.5)',
  glow: '0 0 20px rgba(255, 215, 0, 0.15)',
  'glow-strong': '0 0 30px rgba(255, 215, 0, 0.25)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
  none: 'none',
} as const;

// ============================================================================
// BLUR
// ============================================================================

export const blur = {
  sm: '8px',    // Tooltips
  md: '12px',   // Sheets
  lg: '16px',   // Modals, command palette
  xl: '24px',   // Heavy blur
} as const;

// ============================================================================
// BREAKPOINTS (Web-first, mobile-capable)
// ============================================================================
// Design priority: Desktop (1024px+) > Tablet (640-1023px) > Mobile (<640px)

export const breakpoints = {
  // Tailwind breakpoint values
  sm: '640px',   // Tablet starts
  md: '768px',   // Mid tablet
  lg: '1024px',  // Desktop starts - full experience
  xl: '1280px',  // Wide desktop
  '2xl': '1440px', // Extra wide - centered with max-width

  // Semantic breakpoints
  mobile: { max: '639px' },        // Single column, bottom nav
  tablet: { min: '640px', max: '1023px' }, // 2 columns possible, collapsed sidebar
  desktop: { min: '1024px' },      // Full sidebar, panels
  wide: { min: '1440px' },         // Centered with max-width
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',         // Sticky elements
  dock: '100',      // Bottom dock
  dropdown: '200',  // Dropdowns
  modalBackdrop: '300',
  modal: '400',
  commandPalette: '500',
  toast: '600',
  tooltip: '700',
  max: '9999',
} as const;

// ============================================================================
// COGNITIVE BUDGETS (HIVE specific)
// ============================================================================

export const cognitiveBudgets = {
  spaceBoard: {
    maxPins: 2,
    maxRailWidgets: 3,
    toolFields: 8,
  },
  feed: {
    maxRailWidgets: 3,
    initialLoad: 20,
    loadMore: 20,
  },
  profile: {
    maxRailWidgets: 3,
    cardPrimaryCtas: 2,
  },
  hivelab: {
    toolFields: 12,
    maxTools: 100,
    maxElementsInBelt: 8,
  },
  dock: {
    maxPinnedSpaces: 6,
  },
} as const;

// ============================================================================
// GUIDELINES
// ============================================================================

export const guidelines = {
  // GOLD IS RARE - Only for earned distinction, never for actions
  goldUsage: {
    allowed: [
      'Logo/brand mark (always)',
      'Leader status indicators (earned distinction)',
    ],
    forbidden: [
      'CTAs or buttons', // White is for CTAs
      'Focus rings',     // White focus rings
      'Hover states',
      'Borders',
      'Decorative elements',
      'Body text',
      'Everything else',
    ],
  },
  // Anti-patterns - NEVER do these
  antiPatterns: [
    'Corporate/enterprise UI (we serve students)',
    'Gamification (badges, streaks) - we are infrastructure',
    'Skeleton loaders (use spinners instead)',
    'Heavy borders (>15% opacity)',
    'Bold/black typography (700+)',
    'Gold for CTAs (use white)',
    'Solid filled secondary buttons (keep ghost)',
    'Light mode',
  ],
  accessibility: {
    minContrastText: 4.5,
    minContrastLarge: 3,
    minTouchTargetDesktop: '44px',
    minTouchTargetMobile: '48px',
  },
  performance: {
    maxAnimationDuration: '800ms', // Cinematic max
    preferReducedMotion: true,
  },
} as const;

// ============================================================================
// CSS GENERATOR
// ============================================================================

export function generateCSSVariables(): string {
  const lines: string[] = [':root {'];

  for (const [key, value] of Object.entries(cssVariables.root)) {
    lines.push(`  ${key}: ${value};`);
  }

  lines.push('}');

  return lines.join('\n');
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Colors = typeof colors;
export type ColorScale = typeof scale;
export type CSSVariables = typeof cssVariables;
export type ComponentTokens = typeof componentTokens;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Typography = typeof typography;
export type Animation = typeof animation;
export type Shadows = typeof shadows;
export type Blur = typeof blur;
export type Breakpoints = typeof breakpoints;
export type ZIndex = typeof zIndex;
export type CognitiveBudgets = typeof cognitiveBudgets;

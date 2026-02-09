/**
 * HIVE Unified Color System
 * Dark-first, Apple/Vercel craft with HIVE warmth (gold)
 *
 * Architecture:
 * - Foundation: Raw color values (black/white/neutral gray scale)
 * - Semantic: Purpose-based tokens (background.base, text.secondary)
 * - Component: Component-specific tokens (button.primary.bg, card.default.border)
 *
 * Philosophy:
 * - Neutral grays (no cool/warm tint) - let gold bring warmth
 * - Black/white/gray for 95% of UI
 * - Gold reserved for key dopamine moments (CTAs, achievements, presence)
 * - Gold focus rings (HIVE brand differentiation)
 * - High contrast, accessible, minimal
 */

// ============================================================================
// FOUNDATION TOKENS (Raw Values)
// ============================================================================

export const foundation = {
  // Pure foundations
  black: '#000000',
  white: '#FFFFFF',

  // Neutral gray scale (Apple-inspired, no tint)
  gray: {
    1000: '#000000',      // Page background (bgBase)
    900: '#0A0A0A',       // Surface (bgSurface) - cards, inputs
    800: '#141414',       // Elevated (bgElevated) - hover states
    750: '#1A1A1A',       // Active (bgActive) - pressed states
    700: '#262626',       // Border default
    600: '#2E2E2E',       // Border hover
    500: '#3A3A3A',       // Border strong
    400: '#4D4D4D',       // Text disabled
    350: '#666666',       // Text placeholder
    300: '#808080',       // Text subtle
    200: '#B3B3B3',       // Text secondary
    100: '#D9D9D9',       // Light text
    50: '#FFFFFF',        // Text primary
  },

  // Brand accent - Gold (Single canonical value)
  gold: {
    500: '#FFD700',       // Primary - canonical HIVE gold
    hover: '#FFE033',     // Hover state
    dim: '#E6C200',       // Dimmed/inactive
    glow: 'transparent',  // Glow removed
    border: 'rgba(255, 215, 0, 0.3)',   // Gold borders
    subtle: 'rgba(255, 215, 0, 0.12)',  // Subtle gold backgrounds
  },

  // Functional/Status colors
  green: {
    500: '#22C55E',       // Success
    dim: 'rgba(34, 197, 94, 0.15)',  // Success background
  },
  yellow: {
    500: '#F59E0B',       // Warning
    dim: 'rgba(245, 158, 11, 0.15)', // Warning background
  },
  red: {
    500: '#EF4444',       // Error
    dim: 'rgba(239, 68, 68, 0.15)',  // Error background
  },
  blue: {
    500: '#3B82F6',       // Info
    dim: 'rgba(59, 130, 246, 0.15)', // Info background
  },
} as const;

// ============================================================================
// SEMANTIC TOKENS (Purpose-Based)
// ============================================================================

export const semantic = {
  // Background hierarchy (dark-first)
  background: {
    base: foundation.gray[1000],        // #0A0A0A - Page background
    surface: foundation.gray[900],      // #141414 - Cards, inputs, elevated
    elevated: foundation.gray[800],     // #1A1A1A - Hover states
    active: foundation.gray[750],       // #242424 - Active/pressed states
    overlay: 'rgba(0, 0, 0, 0.6)',      // Modal overlays
    // Legacy aliases
    primary: foundation.gray[1000],     // @deprecated use base
    secondary: foundation.gray[900],    // @deprecated use surface
    tertiary: foundation.gray[800],     // @deprecated use elevated
  },

  // Text hierarchy
  text: {
    primary: foundation.gray[50],       // #FAFAFA - Main content
    secondary: 'rgba(255, 255, 255, 0.5)',   // Supporting content
    subtle: 'rgba(255, 255, 255, 0.35)',     // Timestamps, metadata
    placeholder: 'rgba(255, 255, 255, 0.35)',// Placeholder text
    disabled: 'rgba(255, 255, 255, 0.25)',   // Disabled states
    inverse: foundation.black,          // #000000 - Text on gold/light
    // Legacy alias
    muted: foundation.gray[300],        // @deprecated use subtle
    tertiary: foundation.gray[300],     // @deprecated use subtle
  },

  // Brand system
  brand: {
    primary: foundation.gold[500],      // #FFD700 - HIVE gold
    hover: foundation.gold.hover,       // Gold hover
    dim: foundation.gold.dim,           // #CC9900 - Dimmed gold
    glow: 'transparent',                // Glow removed
    onGold: foundation.black,           // #000000 - Text on gold backgrounds
  },

  // Interactive states
  interactive: {
    hover: 'rgba(255, 255, 255, 0.10)',     // Subtle white hover
    active: 'rgba(255, 255, 255, 0.14)',    // Active state
    focus: 'rgba(255, 255, 255, 0.5)',      // White focus rings
    focusRing: 'rgba(255, 255, 255, 0.15)', // Focus ring
    disabled: foundation.gray[400],         // #52525B - Disabled
  },

  // Gold tokens (reserved for key moments)
  gold: {
    primary: foundation.gold[500],          // Primary CTAs
    achievement: foundation.gold[500],      // Ritual completion
    presence: foundation.gold[500],         // Online indicators
    featured: foundation.gold[500],         // Featured badges
    subtle: foundation.gold.subtle,         // Subtle gold backgrounds
    border: foundation.gold.border,         // Gold borders
    glow: 'transparent',                    // Gold glow removed
  },

  // Status colors
  status: {
    success: foundation.green[500],         // #00D46A
    successDim: foundation.green.dim,
    warning: foundation.yellow[500],        // #FFB800
    warningDim: foundation.yellow.dim,
    error: foundation.red[500],             // #FF3737
    errorDim: foundation.red.dim,
    info: foundation.blue[500],             // #0070F3
    infoDim: foundation.blue.dim,
  },

  // Border system
  border: {
    default: 'rgba(255, 255, 255, 0.08)',   // Standard borders
    hover: 'rgba(255, 255, 255, 0.12)',     // Hover borders
    strong: 'rgba(255, 255, 255, 0.16)',    // Strong borders
    focus: 'rgba(255, 255, 255, 0.5)',      // White focus borders
    // Transparent variants
    subtle: 'rgba(255, 255, 255, 0.06)',    // Very subtle borders
    medium: 'rgba(255, 255, 255, 0.08)',    // Medium borders
    visible: 'rgba(255, 255, 255, 0.12)',   // Visible borders
  },
} as const;

// ============================================================================
// COMPONENT TOKENS (Component-Specific)
// ============================================================================

export const components = {
  // Button variants
  button: {
    // Default: White button, black text (Vercel-style)
    default: {
      bg: foundation.white,
      text: foundation.black,
      border: 'transparent',
      hover: {
        bg: 'rgba(255, 255, 255, 0.9)',
      },
      active: {
        bg: 'rgba(255, 255, 255, 0.8)',
      },
      disabled: {
        bg: foundation.gray[700],
        text: foundation.gray[400],
      },
    },
    // Primary: Gold CTA (use sparingly - 1% rule)
    primary: {
      bg: semantic.gold.primary,
      text: semantic.brand.onGold,
      border: 'transparent',
      hover: {
        bg: semantic.brand.hover,
      },
      active: {
        bg: 'rgba(255, 215, 0, 0.8)',
      },
      shadow: semantic.gold.glow,
    },
    // Secondary: Subtle background with border
    secondary: {
      bg: 'rgba(255, 255, 255, 0.06)',
      text: foundation.white,
      border: semantic.border.medium,
      hover: {
        bg: 'rgba(255, 255, 255, 0.10)',
        border: semantic.border.visible,
      },
      active: {
        bg: 'rgba(255, 255, 255, 0.14)',
      },
    },
    // Outline: Border only, transparent bg
    outline: {
      bg: 'transparent',
      text: foundation.white,
      border: semantic.border.medium,
      hover: {
        bg: semantic.interactive.hover,
        border: semantic.border.visible,
      },
    },
    // Ghost: Completely transparent
    ghost: {
      bg: 'transparent',
      text: semantic.text.secondary,
      border: 'transparent',
      hover: {
        bg: semantic.interactive.hover,
        text: semantic.text.primary,
      },
    },
    // Destructive: Red for dangerous actions
    destructive: {
      bg: semantic.status.error,
      text: foundation.white,
      border: 'transparent',
      hover: {
        bg: '#FF5555',
      },
    },
  },

  // Card variants
  card: {
    default: {
      bg: semantic.background.surface,
      border: semantic.border.default,
      text: semantic.text.primary,
      shadow: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
    },
    elevated: {
      bg: semantic.background.elevated,
      border: semantic.border.default,
      shadow: '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
    },
    interactive: {
      bg: semantic.background.surface,
      border: semantic.border.default,
      hover: {
        bg: semantic.background.elevated,
        border: semantic.border.hover,
        shadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      },
    },
    outline: {
      bg: 'transparent',
      border: semantic.border.default,
      hover: {
        bg: semantic.interactive.hover,
        border: semantic.border.hover,
      },
    },
  },

  // Input variants
  input: {
    default: {
      bg: semantic.background.surface,
      border: semantic.border.default,
      text: semantic.text.primary,
      placeholder: semantic.text.placeholder,
      hover: {
        border: semantic.border.hover,
      },
      focus: {
        border: semantic.border.focus,
        ring: semantic.interactive.focusRing,
      },
    },
    error: {
      bg: semantic.background.surface,
      border: semantic.status.error,
      text: semantic.text.primary,
      focus: {
        border: semantic.status.error,
        ring: semantic.status.errorDim,
      },
    },
    success: {
      bg: semantic.background.surface,
      border: semantic.status.success,
      text: semantic.text.primary,
      focus: {
        border: semantic.status.success,
        ring: semantic.status.successDim,
      },
    },
  },

  // Badge variants
  badge: {
    default: {
      bg: semantic.background.elevated,
      text: semantic.text.secondary,
      border: semantic.border.default,
    },
    gold: {
      bg: semantic.gold.subtle,
      text: semantic.gold.primary,
      border: semantic.gold.border,
    },
    success: {
      bg: semantic.status.successDim,
      text: semantic.status.success,
      border: 'transparent',
    },
    warning: {
      bg: semantic.status.warningDim,
      text: semantic.status.warning,
      border: 'transparent',
    },
    error: {
      bg: semantic.status.errorDim,
      text: semantic.status.error,
      border: 'transparent',
    },
    outline: {
      bg: 'transparent',
      text: semantic.text.secondary,
      border: semantic.border.default,
    },
  },

  // Avatar
  avatar: {
    border: semantic.gold.primary,
    fallback: {
      bg: semantic.background.elevated,
      text: semantic.text.secondary,
    },
  },

  // Toast/notification variants
  toast: {
    default: {
      bg: semantic.background.elevated,
      border: semantic.border.default,
      text: semantic.text.primary,
    },
    success: {
      bg: semantic.background.elevated,
      border: semantic.status.success,
      text: semantic.text.primary,
      icon: semantic.status.success,
    },
    warning: {
      bg: semantic.background.elevated,
      border: semantic.status.warning,
      text: semantic.text.primary,
      icon: semantic.status.warning,
    },
    error: {
      bg: semantic.background.elevated,
      border: semantic.status.error,
      text: semantic.text.primary,
      icon: semantic.status.error,
    },
  },

  // Overlay variants (modals, sheets, etc.)
  overlay: {
    modal: {
      backdrop: semantic.background.overlay,
      bg: semantic.background.base,
      border: semantic.border.default,
    },
    popover: {
      bg: semantic.background.elevated,
      border: semantic.border.default,
      shadow: '0 10px 20px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    dropdown: {
      bg: semantic.background.surface,
      border: semantic.border.default,
      shadow: '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
      item: {
        hover: semantic.interactive.hover,
        active: semantic.interactive.active,
      },
    },
    commandPalette: {
      bg: semantic.background.surface,
      border: semantic.border.default,
      shadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
    },
  },

  // Presence indicators
  presence: {
    online: semantic.status.success,
    away: semantic.status.warning,
    busy: semantic.status.error,
    offline: semantic.text.disabled,
  },
} as const;

// ============================================================================
// LEGACY SUPPORT (Backward Compatibility)
// ============================================================================

/**
 * Legacy token mappings for gradual migration
 * @deprecated Use semantic.* or components.* instead
 */
export const legacy = {
  // Legacy luxury metal names → new tokens
  obsidian: foundation.gray[1000],
  charcoal: foundation.gray[900],
  graphite: foundation.gray[800],
  slate: foundation.gray[700],
  steel: foundation.gray[700],
  smoke: foundation.gray[600],
  pewter: foundation.gray[600],
  mercury: foundation.gray[500],
  silver: foundation.gray[300],
  platinum: foundation.white,

  // Legacy gold variations → single gold
  gold: foundation.gold[500],
  champagne: foundation.gold[500],
  amber: semantic.status.warning,
  bronze: foundation.gold[500],

  // Legacy status → new status
  emerald: semantic.status.success,
  ruby: semantic.status.error,
  sapphire: semantic.status.info,
  citrine: semantic.status.warning,

  // Legacy "muted" → "subtle"
  textMuted: semantic.text.subtle,
  backgroundMuted: semantic.background.surface,
} as const;

// ============================================================================
// USAGE GUIDELINES
// ============================================================================

export const guidelines = {
  philosophy: {
    minimal: "Neutral grays (no tint) for 95% of UI - let gold bring warmth",
    gold: "ONLY for dopamine moments: CTAs, achievements, presence",
    contrast: "High contrast, WCAG 2.1 AA compliant minimum",
    discipline: "Every gold usage must be intentional and meaningful",
  },

  backgrounds: {
    hierarchy: "base (#0A0A0A) → surface (#141414) → elevated (#1A1A1A) → active (#242424)",
    cards: "Use surface for cards, elevated for hover states",
    interactive: "Use elevated for hover, active for pressed",
  },

  text: {
    hierarchy: "primary (#FAFAFA) → secondary (#A1A1A6) → subtle (#818187)",
    readability: "Always test contrast ratios",
    inverse: "Use text.inverse on gold/white backgrounds",
    naming: "Use 'subtle' not 'muted' for consistency",
  },

  interactive: {
    default: "Use grayscale hovers (white overlays)",
    focus: "White focus rings for accessibility",
    gold: "Reserve gold for primary CTAs and key moments",
  },

  components: {
    buttons: "default (white), primary (gold - sparingly), secondary, ghost, destructive",
    cards: "default, elevated, interactive, outline",
    inputs: "White focus border with subtle glow",
    badges: "Minimal use - default, gold (featured only), status colors",
  },

  goldUsage: {
    allowed: [
      "Primary CTA buttons (Join Space, Create Tool) - sparingly",
      "Achievement moments (Ritual complete, level up)",
      "Online presence (147 students online)",
      "Featured content badges (Hot Space, Featured Tool)",
      "Text selection highlight",
    ],
    forbidden: [
      "Focus rings (use white)",
      "Secondary buttons",
      "Decorative elements",
      "Background colors (except subtle tints)",
      "Navigation items",
    ],
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FoundationToken = keyof typeof foundation;
export type SemanticToken = keyof typeof semantic;
export type ComponentToken = keyof typeof components;
export type LegacyToken = keyof typeof legacy;

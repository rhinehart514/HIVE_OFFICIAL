/**
 * HIVE Unified Color System
 * Single source of truth - Vercel/Linear/top YC company approach
 *
 * Architecture:
 * - Foundation: Raw color values (black/white/gray scales)
 * - Semantic: Purpose-based tokens (background.primary, text.secondary)
 * - Component: Component-specific tokens (button.default.bg, card.elevated.border)
 *
 * Philosophy:
 * - Black/white/gray for 95% of UI
 * - Gold reserved for key dopamine moments (CTAs, achievements, presence)
 * - High contrast, accessible, minimal
 */

// ============================================================================
// FOUNDATION TOKENS (Raw Values)
// ============================================================================

export const foundation = {
  // Pure foundations
  black: '#000000',
  white: '#FFFFFF',

  // Gray scale (Vercel-inspired)
  gray: {
    1000: '#0A0A0A',      // Near black
    900: '#171717',       // Elevated surfaces
    800: '#262626',       // Interactive elements
    700: '#404040',       // Strong borders
    600: '#525252',       // Disabled text
    500: '#737373',       // Placeholder text
    400: '#A3A3A3',       // Secondary text
    300: '#D4D4D4',       // Tertiary text
    200: '#E5E5E5',       // Subtle borders
    100: '#F5F5F5',       // Light backgrounds
    50: '#FAFAFA',        // Off-white
  },

  // Brand accent (Single gold only)
  gold: {
    500: '#FFD700',       // Primary - ONLY gold value used
  },

  // Functional colors (Minimal)
  green: {
    500: '#00D46A',       // Success
    400: '#22DD77',       // Success hover
  },
  yellow: {
    500: '#FFB800',       // Warning
    400: '#FFC533',       // Warning hover
  },
  red: {
    500: '#FF3737',       // Error
    400: '#FF5555',       // Error hover
  },
  blue: {
    600: '#0070F3',       // Info/accent
    500: '#2D7FF9',       // Info hover
  },
} as const;

// ============================================================================
// SEMANTIC TOKENS (Purpose-Based)
// ============================================================================

export const semantic = {
  // Background hierarchy
  background: {
    primary: foundation.black,              // #000000 - Main app background
    secondary: foundation.gray[900],        // #171717 - Cards, panels
    tertiary: foundation.gray[800],         // #262626 - Elevated surfaces
    interactive: foundation.gray[700],      // #404040 - Interactive elements
    overlay: 'rgba(0, 0, 0, 0.6)',         // Modal overlays
    muted: foundation.gray[1000],           // #0A0A0A - Subtle backgrounds
  },

  // Text hierarchy
  text: {
    primary: foundation.white,              // #FFFFFF - Primary content
    secondary: foundation.gray[300],        // #D4D4D4 - Supporting content
    tertiary: foundation.gray[400],         // #A3A3A3 - Metadata
    muted: foundation.gray[500],            // #737373 - Placeholder, subtle
    disabled: foundation.gray[600],         // #525252 - Disabled state
    inverse: foundation.black,              // #000000 - Text on light/gold
  },

  // Brand system
  brand: {
    primary: foundation.gold[500],          // #FFD700 - HIVE gold
    hover: foundation.gold[500],            // Same gold for consistency
    onGold: foundation.black,               // #000000 - Text on gold backgrounds
  },

  // Interactive states (Grayscale default - ChatGPT/Vercel aesthetic)
  interactive: {
    hover: 'rgba(255, 255, 255, 0.04)',    // Subtle white hover
    focus: 'rgba(255, 255, 255, 0.20)',    // White focus rings (NOT gold)
    active: 'rgba(255, 255, 255, 0.08)',   // Active state
    disabled: foundation.gray[700],         // #404040 - Disabled
  },

  // Gold reserved for key moments
  gold: {
    cta: foundation.gold[500],              // Primary CTAs only
    achievement: foundation.gold[500],      // Ritual completion
    presence: foundation.gold[500],         // Online indicators
    featured: foundation.gold[500],         // Featured badges
  },

  // Status colors
  status: {
    success: foundation.green[500],         // #00D46A
    successHover: foundation.green[400],    // #22DD77
    warning: foundation.yellow[500],        // #FFB800
    warningHover: foundation.yellow[400],   // #FFC533
    error: foundation.red[500],             // #FF3737
    errorHover: foundation.red[400],        // #FF5555
    info: foundation.blue[600],             // #0070F3
    infoHover: foundation.blue[500],        // #2D7FF9
  },

  // Border system
  border: {
    default: 'rgba(255, 255, 255, 0.08)',  // Subtle dividers
    muted: 'rgba(255, 255, 255, 0.04)',    // Very subtle borders
    hover: 'rgba(255, 255, 255, 0.16)',    // Hover borders
    focus: 'rgba(255, 255, 255, 0.40)',    // Focus borders (white, not gold)
    strong: foundation.gray[700],           // #404040 - Strong borders
  },
} as const;

// ============================================================================
// COMPONENT TOKENS (Component-Specific)
// ============================================================================

export const components = {
  // Button variants
  button: {
    default: {
      bg: semantic.text.primary,            // White background
      text: semantic.background.primary,    // Black text
      border: 'transparent',
      hover: {
        bg: foundation.gray[200],           // Light gray hover
      },
      active: {
        bg: foundation.gray[300],
      },
      disabled: {
        bg: semantic.interactive.disabled,
        text: semantic.text.disabled,
      },
    },
    primary: {
      bg: semantic.gold.cta,                // Gold background
      text: semantic.brand.onGold,          // Black text on gold
      border: 'transparent',
      hover: {
        bg: 'rgba(255, 215, 0, 0.9)',      // Slightly transparent gold
      },
      active: {
        bg: 'rgba(255, 215, 0, 0.8)',
      },
    },
    secondary: {
      bg: 'transparent',
      text: semantic.text.primary,          // White text
      border: semantic.border.default,
      hover: {
        bg: semantic.interactive.hover,
        border: semantic.border.hover,
      },
      active: {
        bg: semantic.interactive.active,
      },
    },
    ghost: {
      bg: 'transparent',
      text: semantic.text.secondary,
      border: 'transparent',
      hover: {
        bg: semantic.interactive.hover,
        text: semantic.text.primary,
      },
    },
    destructive: {
      bg: semantic.status.error,
      text: foundation.white,
      border: 'transparent',
      hover: {
        bg: semantic.status.errorHover,
      },
    },
  },

  // Card variants
  card: {
    default: {
      bg: semantic.background.secondary,    // #171717
      border: semantic.border.default,
      text: semantic.text.primary,
      shadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
    },
    elevated: {
      bg: semantic.background.tertiary,     // #262626
      border: semantic.border.default,
      shadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    },
    interactive: {
      bg: semantic.background.secondary,
      border: semantic.border.default,
      hover: {
        bg: semantic.background.tertiary,
        border: semantic.border.hover,
        shadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      },
    },
    outline: {
      bg: 'transparent',
      border: semantic.border.default,
      hover: {
        bg: semantic.interactive.hover,
      },
    },
  },

  // Input variants
  input: {
    default: {
      bg: semantic.background.secondary,
      border: semantic.border.default,
      text: semantic.text.primary,
      placeholder: semantic.text.muted,
      focus: {
        border: semantic.border.focus,
        ring: semantic.interactive.focus,
      },
    },
    error: {
      bg: semantic.background.secondary,
      border: semantic.status.error,
      text: semantic.text.primary,
      focus: {
        border: semantic.status.error,
        ring: 'rgba(255, 55, 55, 0.2)',
      },
    },
    success: {
      bg: semantic.background.secondary,
      border: semantic.status.success,
      text: semantic.text.primary,
      focus: {
        border: semantic.status.success,
        ring: 'rgba(0, 212, 106, 0.2)',
      },
    },
  },

  // Badge variants
  badge: {
    default: {
      bg: semantic.background.tertiary,
      text: semantic.text.secondary,
      border: semantic.border.default,
    },
    gold: {
      bg: semantic.gold.featured,
      text: semantic.brand.onGold,
      border: 'transparent',
    },
    success: {
      bg: semantic.status.success,
      text: foundation.black,
      border: 'transparent',
    },
    warning: {
      bg: semantic.status.warning,
      text: foundation.black,
      border: 'transparent',
    },
    error: {
      bg: semantic.status.error,
      text: foundation.white,
      border: 'transparent',
    },
    outline: {
      bg: 'transparent',
      text: semantic.text.secondary,
      border: semantic.border.default,
    },
  },

  // Toast/notification variants
  toast: {
    default: {
      bg: semantic.background.tertiary,
      border: semantic.border.default,
      text: semantic.text.primary,
    },
    success: {
      bg: semantic.background.tertiary,
      border: semantic.status.success,
      text: semantic.text.primary,
      icon: semantic.status.success,
    },
    warning: {
      bg: semantic.background.tertiary,
      border: semantic.status.warning,
      text: semantic.text.primary,
      icon: semantic.status.warning,
    },
    error: {
      bg: semantic.background.tertiary,
      border: semantic.status.error,
      text: semantic.text.primary,
      icon: semantic.status.error,
    },
  },

  // Overlay variants (modals, sheets, etc.)
  overlay: {
    modal: {
      backdrop: semantic.background.overlay,
      bg: semantic.background.primary,
      border: semantic.border.default,
    },
    popover: {
      bg: semantic.background.tertiary,
      border: semantic.border.default,
      shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    },
    dropdown: {
      bg: semantic.background.secondary,
      border: semantic.border.default,
      shadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      item: {
        hover: semantic.interactive.hover,
        active: semantic.interactive.active,
      },
    },
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
} as const;

// ============================================================================
// USAGE GUIDELINES
// ============================================================================

export const guidelines = {
  philosophy: {
    minimal: "Black/white/gray for 95% of UI - clean, professional",
    gold: "ONLY for dopamine moments: CTAs, achievements, presence",
    contrast: "High contrast, WCAG 2.1 AA compliant minimum",
    discipline: "Every gold usage must be intentional and meaningful",
  },

  backgrounds: {
    hierarchy: "primary (#000) → secondary (#171717) → tertiary (#262626)",
    cards: "Use secondary for cards, tertiary for elevated cards",
    interactive: "Use tertiary for hover states on secondary backgrounds",
  },

  text: {
    hierarchy: "primary (white) → secondary (#D4D4D4) → tertiary (#A3A3A3)",
    readability: "Always test contrast ratios",
    inverse: "Use text.inverse on gold/light backgrounds",
  },

  interactive: {
    default: "Use grayscale hovers (white overlays), NOT gold",
    focus: "White focus rings for accessibility",
    gold: "Reserve gold for primary CTAs only",
  },

  components: {
    buttons: "default (white), primary (gold), secondary (outline), ghost, destructive",
    cards: "default, elevated, interactive, outline",
    inputs: "Always use component tokens for consistent styling",
    badges: "Minimal use - default, gold (featured only), status colors",
  },

  goldUsage: {
    allowed: [
      "Primary CTA buttons (Join Space, Create Tool)",
      "Achievement moments (Ritual complete, level up)",
      "Online presence (147 students online)",
      "Featured content badges (Hot Space, Featured Tool)",
    ],
    forbidden: [
      "Focus rings (use white)",
      "Hover states (use grayscale)",
      "Borders (use white/gray)",
      "Decorative elements",
      "Secondary buttons",
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

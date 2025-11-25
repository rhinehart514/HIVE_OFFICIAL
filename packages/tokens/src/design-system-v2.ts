/**
 * HIVE Design System V2
 * Enhanced with modern patterns from Radix UI, Tailwind CSS, and shadcn/ui
 *
 * Improvements over V1:
 * - 12-step color scale (Radix pattern)
 * - OKLCH color format for perceptual uniformity
 * - Sidebar-specific tokens (shadcn pattern)
 * - Chart colors for data visualization
 * - Improved semantic mapping
 */

// ============================================================================
// FOUNDATION: 12-STEP GRAYSCALE (Radix Pattern)
// ============================================================================

export const scale = {
  // Gray scale - 12 steps for precise control
  gray: {
    1: 'oklch(0.145 0 0)',      // App background
    2: 'oklch(0.185 0 0)',      // Subtle background
    3: 'oklch(0.225 0 0)',      // UI element background
    4: 'oklch(0.265 0 0)',      // Hovered element
    5: 'oklch(0.305 0 0)',      // Active element
    6: 'oklch(0.375 0 0)',      // Subtle border
    7: 'oklch(0.445 0 0)',      // Element border
    8: 'oklch(0.555 0 0)',      // Hovered border
    9: 'oklch(0.665 0 0)',      // Solid background
    10: 'oklch(0.735 0 0)',     // Hovered solid
    11: 'oklch(0.855 0 0)',     // Low contrast text
    12: 'oklch(0.985 0 0)',     // High contrast text
  },

  // Gold scale - brand accent (#FFD700 canonical)
  gold: {
    1: 'oklch(0.25 0.04 97)',    // Subtle background
    2: 'oklch(0.30 0.06 97)',    // UI background
    3: 'oklch(0.35 0.08 97)',    // Hovered
    4: 'oklch(0.40 0.10 97)',    // Active
    5: 'oklch(0.50 0.12 97)',    // Subtle border
    6: 'oklch(0.60 0.14 97)',    // Border
    7: 'oklch(0.70 0.16 97)',    // Hovered border
    8: 'oklch(0.80 0.18 97)',    // Solid background
    9: 'oklch(0.884 0.199 97)',  // Primary gold = #FFD700 (canonical)
    10: 'oklch(0.90 0.18 97)',   // Hovered solid
    11: 'oklch(0.75 0.16 97)',   // Low contrast text
    12: 'oklch(0.95 0.10 97)',   // High contrast text
  },

  // Status colors - Ultra-Minimal (only success + error)
  green: {
    9: 'oklch(0.75 0.20 155)',       // Success #00D46A
    10: 'oklch(0.80 0.18 155)',      // Success hover
  },
  red: {
    9: 'oklch(0.60 0.25 25)',        // Error #FF3737
    10: 'oklch(0.65 0.23 25)',       // Error hover
  },
  // Warning = gold (unified with brand for YC/SF aesthetic)
  // Info = white (removed blue entirely)
} as const;

// ============================================================================
// SEMANTIC TOKENS (CSS Variable Pattern from shadcn)
// ============================================================================

export const cssVariables = {
  // Root (dark mode default for HIVE)
  root: {
    // Core
    '--radius': '0.625rem',
    '--background': scale.gray[1],
    '--foreground': scale.gray[12],

    // Card
    '--card': scale.gray[2],
    '--card-foreground': scale.gray[12],

    // Popover
    '--popover': scale.gray[3],
    '--popover-foreground': scale.gray[12],

    // Primary (Gold for HIVE brand)
    '--primary': scale.gold[9],
    '--primary-foreground': 'oklch(0.145 0 0)',

    // Secondary
    '--secondary': scale.gray[4],
    '--secondary-foreground': scale.gray[12],

    // Muted
    '--muted': scale.gray[3],
    '--muted-foreground': scale.gray[11],

    // Accent
    '--accent': scale.gray[4],
    '--accent-foreground': scale.gray[12],

    // Destructive
    '--destructive': scale.red[9],
    '--destructive-foreground': scale.gray[12],

    // Border & Input
    '--border': 'oklch(1 0 0 / 10%)',
    '--input': 'oklch(1 0 0 / 15%)',
    '--ring': scale.gray[8],

    // Chart colors (ultra-minimal - gold + grayscale)
    '--chart-1': scale.gold[9],
    '--chart-2': scale.gray[11],
    '--chart-3': scale.green[9],
    '--chart-4': scale.gold[8],
    '--chart-5': scale.red[9],

    // Sidebar specific (shadcn pattern)
    '--sidebar': scale.gray[2],
    '--sidebar-foreground': scale.gray[12],
    '--sidebar-primary': scale.gold[9],
    '--sidebar-primary-foreground': 'oklch(0.145 0 0)',
    '--sidebar-accent': scale.gray[4],
    '--sidebar-accent-foreground': scale.gray[12],
    '--sidebar-border': 'oklch(1 0 0 / 10%)',
    '--sidebar-ring': scale.gray[8],
  },
} as const;

// ============================================================================
// COMPONENT TOKENS (Enhanced)
// ============================================================================

export const componentTokens = {
  // Button variants
  button: {
    default: {
      bg: 'var(--foreground)',
      text: 'var(--background)',
      hover: scale.gray[11],
    },
    primary: {
      bg: 'var(--primary)',
      text: 'var(--primary-foreground)',
      hover: scale.gold[10],
    },
    secondary: {
      bg: 'var(--secondary)',
      text: 'var(--secondary-foreground)',
      hover: scale.gray[5],
    },
    outline: {
      bg: 'transparent',
      text: 'var(--foreground)',
      border: 'var(--border)',
      hover: 'var(--accent)',
    },
    ghost: {
      bg: 'transparent',
      text: 'var(--foreground)',
      hover: 'var(--accent)',
    },
    destructive: {
      bg: 'var(--destructive)',
      text: 'var(--destructive-foreground)',
      hover: scale.red[10],
    },
  },

  // Card variants
  card: {
    default: {
      bg: 'var(--card)',
      border: 'var(--border)',
      text: 'var(--card-foreground)',
    },
    interactive: {
      bg: 'var(--card)',
      border: 'var(--border)',
      hoverBg: 'var(--accent)',
      hoverBorder: scale.gray[7],
    },
  },

  // Input variants
  input: {
    default: {
      bg: 'var(--background)',
      border: 'var(--input)',
      text: 'var(--foreground)',
      placeholder: 'var(--muted-foreground)',
      focusRing: 'var(--ring)',
    },
  },

  // Avatar
  avatar: {
    bg: scale.gray[3],
    text: scale.gray[11],
    ring: 'var(--ring)',
  },

  // Badge variants
  badge: {
    default: {
      bg: 'var(--secondary)',
      text: 'var(--secondary-foreground)',
    },
    primary: {
      bg: 'var(--primary)',
      text: 'var(--primary-foreground)',
    },
    outline: {
      bg: 'transparent',
      text: 'var(--foreground)',
      border: 'var(--border)',
    },
    destructive: {
      bg: 'var(--destructive)',
      text: 'var(--destructive-foreground)',
    },
  },
} as const;

// ============================================================================
// SPACING SCALE (4px base, consistent with V1)
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
  14: '3.5rem',     // 56px
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
// RADIUS SCALE
// ============================================================================

export const radius = {
  none: '0',
  sm: 'calc(var(--radius) - 4px)',   // 6px
  md: 'calc(var(--radius) - 2px)',   // 8px
  lg: 'var(--radius)',               // 10px
  xl: 'calc(var(--radius) + 4px)',   // 14px
  '2xl': 'calc(var(--radius) + 8px)', // 18px
  '3xl': 'calc(var(--radius) + 14px)', // 24px
  full: '9999px',
} as const;

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

export const typography = {
  fontFamily: {
    sans: ['Geist Sans', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],        // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],    // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],       // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],     // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
    '5xl': ['3rem', { lineHeight: '1.2' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1.1' }],      // 60px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

export const animation = {
  duration: {
    instant: '50ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',         // Sticky elements
  100: '100',       // Sidebar
  200: '200',       // Dropdown
  300: '300',       // Modal backdrop
  400: '400',       // Modal
  500: '500',       // Popover
  600: '600',       // Toast
  700: '700',       // Tooltip
  9999: '9999',     // Max
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
  },
} as const;

// ============================================================================
// USAGE GUIDELINES (HIVE specific - Gold 5% Rule)
// ============================================================================

export const guidelines = {
  goldUsage: {
    allowed: [
      'Primary CTA buttons',
      'Achievement/milestone celebrations',
      'Online presence indicators',
      'Featured content badges',
      'Chart primary accent',
    ],
    forbidden: [
      'Focus rings (use --ring)',
      'Hover states',
      'Borders',
      'Decorative elements',
      'Secondary buttons',
    ],
  },
  accessibility: {
    minContrastText: 4.5,
    minContrastLarge: 3,
    minTouchTarget: '44px',
  },
  performance: {
    maxAnimationDuration: '500ms',
    preferReducedMotion: true,
  },
} as const;

// ============================================================================
// CSS GENERATOR
// ============================================================================

export function generateCSSVariables(): string {
  const lines: string[] = ['@layer base {', '  :root {'];

  for (const [key, value] of Object.entries(cssVariables.root)) {
    lines.push(`    ${key}: ${value};`);
  }

  lines.push('  }', '}');

  return lines.join('\n');
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ColorScale = typeof scale;
export type CSSVariables = typeof cssVariables;
export type ComponentTokens = typeof componentTokens;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Typography = typeof typography;
export type Animation = typeof animation;
export type Shadows = typeof shadows;
export type Breakpoints = typeof breakpoints;
export type ZIndex = typeof zIndex;
export type CognitiveBudgets = typeof cognitiveBudgets;

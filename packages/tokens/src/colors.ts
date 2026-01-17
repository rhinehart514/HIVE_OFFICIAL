// HIVE Color Design System
// Aligned with design-system/LANGUAGE.md - "The Room at 3am"
//
// THE METAPHOR:
// - The darkness: Layers of black with subtle warmth, not cold tech
// - The campfire: Gold is the singular heat source. Rare. Precious.
// - The breathing: Everything alive has a pulse.

// Core Warm Dark Palette - 3am room energy
export const colors = {
  // Foundation Surfaces - Warm darks (from LANGUAGE.md)
  void: '#050504',           // The corners you can't see
  ground: '#0A0A09',         // The floor, the walls (page background)
  surface: '#141312',        // Furniture, shapes (cards)
  surfaceHover: '#1A1917',   // When you look directly
  surfaceActive: '#252521',  // When you touch
  elevated: '#1E1D1B',       // Modals, dropdowns

  // Legacy aliases (map to new warm values)
  obsidian: '#0A0A09',       // → ground
  charcoal: '#141312',       // → surface
  graphite: '#1A1917',       // → surfaceHover
  slate: '#252521',          // → surfaceActive
  steel: '#2A2A2D',          // Borders and dividers

  // Text Hierarchy - Slightly warm whites (from LANGUAGE.md)
  textPrimary: '#FAF9F7',    // Main content - 95% visible
  textSecondary: '#A3A19E',  // Supporting text - 65% visible
  textTertiary: '#6B6B70',   // Subtle text - 40% visible
  textMuted: '#3D3D42',      // Barely there - 25% visible
  textGhost: '#2A2A2E',      // Hint - 15% visible

  // Legacy text aliases
  platinum: '#FAF9F7',       // → textPrimary
  silver: '#A3A19E',         // → textSecondary
  mercury: '#6B6B70',        // → textTertiary
  pewter: '#3D3D42',         // → textMuted
  smoke: '#2A2A2E',          // → textGhost
  
  // Accent Gold - Premium highlights (#FFD700 is canonical)
  gold: '#FFD700',          // Primary accent (CANONICAL)
  champagne: '#FFE766',     // Lighter gold (tint of #FFD700)
  amber: '#FFA500',         // Warning states only
  bronze: '#CC9900',        // Muted accent (shade of #FFD700)

  // HIVE Brand Colors - Unified on #FFD700 (YC/SF Aesthetic)
  hiveGold: '#FFD700',      // HIVE primary brand = canonical gold
  hiveGoldDark: '#CC9900',  // HIVE gold darker (shade)
  hiveGoldLight: '#FFE766', // HIVE gold lighter (tint)
  // NOTE: Blue removed for ultra-minimal palette (use white instead)

  // Status Colors - Ultra-Minimal (only 3 + status)
  emerald: '#00D46A',       // Success (brighter green)
  ruby: '#FF3737',          // Error (brighter red)
  // Info: Use white text instead of blue
  citrine: '#FFD700',       // Warning = gold (unified)
  
  // Legacy Support - Keep for backwards compatibility
  black: '#0A0A0B',         // Map to obsidian
  white: '#E5E5E7',         // Map to platinum
  
  // Semantic Color Mappings - For consistent hardcoded value replacements
  textMutedLight: '#A1A1AA', // Most used muted text color
  textMutedDark: '#71717A',  // Secondary muted text
  backgroundOverlayLight: 'rgba(255, 255, 255, 0.02)', // Light background overlay
  backgroundOverlayMedium: 'rgba(255, 255, 255, 0.05)', // Medium background overlay
  borderSubtle: 'rgba(255, 255, 255, 0.06)', // Subtle borders
  borderInteractive: 'rgba(255, 255, 255, 0.1)', // Interactive borders
  goldAccent: '#FFD700',     // Primary gold accent (already exists but for clarity)
  goldHover: '#FFE255',      // Gold hover state
  
  // Gray Scale - Luxury metal hierarchy
  gray: {
    50: '#4A4A4F',          // smoke
    100: '#6B6B70',         // pewter
    200: '#9B9B9F',         // mercury
    300: '#C1C1C4',         // silver
    400: '#E5E5E7',         // platinum
    500: '#2A2A2D',         // steel
    600: '#222225',         // slate
    700: '#1A1A1C',         // graphite
    800: '#111113',         // charcoal
    900: '#0A0A0B',         // obsidian
    950: '#000000',         // void
  },
} as const;

// Transparent Overlays - Luxury glass effects
export const overlay = {
  // Glass morphism
  glass: 'rgba(255, 255, 255, 0.05)',
  'glass-medium': 'rgba(255, 255, 255, 0.08)',
  'glass-strong': 'rgba(255, 255, 255, 0.12)',
  
  // Gold glows
  'gold-subtle': 'rgba(255, 215, 0, 0.1)',
  'gold-medium': 'rgba(255, 215, 0, 0.15)',
  'gold-strong': 'rgba(255, 215, 0, 0.3)',
  'gold-glow': 'rgba(255, 215, 0, 0.4)',
  
  // Shadows
  'shadow-soft': 'rgba(0, 0, 0, 0.2)',
  'shadow-medium': 'rgba(0, 0, 0, 0.3)',
  'shadow-deep': 'rgba(0, 0, 0, 0.4)',
  'shadow-void': 'rgba(0, 0, 0, 0.6)',
  
  // Legacy support
  white: 'rgba(255, 255, 255, 0.05)',
  'white-medium': 'rgba(255, 255, 255, 0.08)',
  'white-strong': 'rgba(255, 255, 255, 0.12)',
} as const;

// Luxury Gradients - Subtle sophistication
export const gradients = {
  // Background gradients
  midnight: 'linear-gradient(135deg, #0A0A0B 0%, #111113 100%)',
  obsidian: 'linear-gradient(180deg, #0A0A0B 0%, #1A1A1C 100%)',
  charcoal: 'linear-gradient(45deg, #111113 0%, #222225 100%)',
  
  // Interactive gradients
  'gold-shimmer': 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.1), transparent)',
  'silver-sheen': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
  
  // Glass morphism
  'glass-dark': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  'glass-gold': 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))',
  
  // Depth gradients
  'surface-elevated': 'linear-gradient(180deg, #1A1A1C 0%, #222225 100%)',
  'surface-pressed': 'linear-gradient(180deg, #111113 0%, #0A0A0B 100%)',
} as const;

// Borders - Premium sophistication
export const border = {
  // Metal borders
  steel: colors.steel,                    // #2A2A2D
  graphite: colors.graphite,              // #1A1A1C
  slate: colors.slate,                    // #222225
  
  // Glass borders
  glass: overlay.glass,                   // rgba(255, 255, 255, 0.05)
  'glass-strong': overlay['glass-strong'], // rgba(255, 255, 255, 0.12)
  
  // Gold accents
  gold: 'rgba(255, 215, 0, 0.2)',
  'gold-strong': 'rgba(255, 215, 0, 0.4)',
  'gold-glow': 'rgba(255, 215, 0, 0.6)',
  
  // Legacy support
  subtle: overlay.glass,
  medium: overlay['glass-medium'],
} as const;

// Shadows - Layered depth system
export const shadows = {
  // Elevation shadows
  level1: '0 1px 3px rgba(0, 0, 0, 0.3)',
  level2: '0 4px 6px rgba(0, 0, 0, 0.3)',
  level3: '0 8px 15px rgba(0, 0, 0, 0.3)',
  level4: '0 12px 25px rgba(0, 0, 0, 0.4)',
  level5: '0 20px 40px rgba(0, 0, 0, 0.5)',
  
  // Interactive shadows
  hover: '0 8px 25px rgba(0, 0, 0, 0.3)',
  active: '0 4px 12px rgba(0, 0, 0, 0.4)',
  focus: '0 0 0 2px rgba(255, 215, 0, 0.3)',
  
  // Glow effects
  'gold-glow': '0 0 20px rgba(255, 215, 0, 0.3)',
  'gold-glow-strong': '0 0 30px rgba(255, 215, 0, 0.4)',
  'emerald-glow': '0 0 20px rgba(16, 185, 129, 0.3)',
  'ruby-glow': '0 0 20px rgba(239, 68, 68, 0.3)',
  
  // Inner shadows
  'inset-deep': 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  'inset-soft': 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
} as const;

// Clean semantic mapping - Dark luxury hierarchy
export const semantic = {
  background: {
    primary: colors.obsidian,           // #0A0A0B - Main app background
    secondary: colors.charcoal,         // #111113 - Card backgrounds
    tertiary: colors.graphite,          // #1A1A1C - Elevated surfaces
    overlay: overlay.glass,             // Glass morphism overlays
    interactive: colors.slate,          // #222225 - Interactive elements
  },
  
  text: {
    primary: colors.platinum,           // #E5E5E7 - Main text
    secondary: colors.silver,           // #C1C1C4 - Secondary text
    muted: colors.mercury,              // #9B9B9F - Muted text
    disabled: colors.pewter,            // #6B6B70 - Disabled text
    inverse: colors.obsidian,           // #0A0A0B - Text on gold/light
    // NEW: Add missing commonly used text colors from audit
    mutedLight: '#A1A1AA',             // Most used non-tokenized color (60+ uses)
    mutedDark: '#71717A',              // Secondary muted text color
    subtle: '#3F3F46',                 // Very subtle text elements
  },
  
  brand: {
    primary: colors.gold,               // #FFD700 - HIVE brand gold (CANONICAL)
    secondary: colors.hiveGoldLight,    // #FFE766 - Lighter gold tint
    accent: colors.gold,                // Gold only (removed blue for YC/SF aesthetic)
    muted: colors.bronze,               // #CC9900 - Muted gold shade
    // Unified gold - all map to #FFD700
    gold: colors.gold,                  // #FFD700 - Primary gold
    champagne: colors.champagne,        // #FFE766 - Gold tint
  },

  interactive: {
    hover: overlay['glass-medium'],     // Glass hover effect
    focus: 'rgba(255, 255, 255, 0.50)', // White focus ring (NOT gold)
    active: overlay['glass-strong'],    // Glass active state
    disabled: colors.smoke,             // #4A4A4F - Disabled state
  },

  // Status Colors - Ultra-Minimal YC/SF (3 colors only)
  status: {
    success: colors.emerald,            // #00D46A - Success green
    warning: colors.citrine,            // #FFD700 - Warning = gold (unified)
    error: colors.ruby,                 // #FF3737 - Error red
    info: colors.platinum,              // White for info (removed blue)
  },
  
  border: {
    primary: border.steel,              // #2A2A2D - Primary borders
    secondary: border.graphite,         // #1A1A1C - Secondary borders
    subtle: border.glass,               // Glass subtle borders
    focus: 'rgba(255, 255, 255, 0.50)', // White focus borders (NOT gold)
    error: colors.ruby,                 // Red error borders
    // NEW: Add missing commonly used border colors from audit  
    muted: '#3F3F46',                   // Subtle borders (commonly used)
    interactive: '#A1A1AA',             // Interactive element borders
  },
} as const;

// === PRD-ALIGNED COLOR SYSTEM (PRIMARY) ===
// Import the new PRD-aligned color system for migration
export * from './colors-prd-aligned';

// Type exports
export type ColorToken = keyof typeof colors;
export type SemanticToken = keyof typeof semantic;
export type GradientToken = keyof typeof gradients;
export type ShadowToken = keyof typeof shadows;
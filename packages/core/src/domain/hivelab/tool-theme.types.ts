/**
 * Tool Theme Types
 *
 * Sprint 5: Polish
 *
 * Defines theme inheritance for tools deployed in spaces.
 * Tools automatically inherit the space's brand color for accent colors,
 * buttons, active states, and interactive elements.
 */

// ============================================================================
// THEME SOURCE
// ============================================================================

/**
 * Where the tool gets its theme from
 * - 'hive-default': Default HIVE brand colors (amber accent)
 * - 'space-brand': Inherit from space's brand/primary color
 * - 'minimal': Neutral/muted theme with subtle accents
 */
export type ToolThemeSource = 'hive-default' | 'space-brand' | 'minimal';

// ============================================================================
// COLOR TOKENS
// ============================================================================

/**
 * HSL color representation for programmatic manipulation
 */
export interface HSLColor {
  h: number;  // Hue: 0-360
  s: number;  // Saturation: 0-100
  l: number;  // Lightness: 0-100
}

/**
 * Theme color palette derived from a primary color
 */
export interface ToolThemePalette {
  /** Primary brand color (hex) */
  primary: string;

  /** Lighter variant for backgrounds, hover states */
  primaryLight: string;

  /** Darker variant for pressed states */
  primaryDark: string;

  /** Semi-transparent variants for overlays */
  primaryAlpha10: string;  // 10% opacity
  primaryAlpha20: string;  // 20% opacity
  primaryAlpha40: string;  // 40% opacity

  /** Contrast text color for buttons (white or black) */
  primaryContrast: string;
}

// ============================================================================
// TOOL THEME CONFIG
// ============================================================================

/**
 * Theme configuration for a deployed tool
 */
export interface ToolThemeConfig {
  /** Where to get the theme from */
  source: ToolThemeSource;

  /** Override primary color (only used if source is 'space-brand' but no space color set) */
  fallbackColor?: string;
}

/**
 * Resolved theme for runtime use
 */
export interface ResolvedToolTheme {
  /** Theme source that was used */
  source: ToolThemeSource;

  /** Computed color palette */
  palette: ToolThemePalette;

  /** CSS custom properties to inject */
  cssVariables: Record<string, string>;
}

// ============================================================================
// SPACE BRAND
// ============================================================================

/**
 * Space brand settings (stored in Firestore)
 */
export interface SpaceBrand {
  /** Primary brand color (hex) */
  primaryColor?: string;

  /** Optional secondary color */
  secondaryColor?: string;

  /** Logo URL */
  logoUrl?: string;

  /** Whether to apply brand to tools */
  applyToTools?: boolean;
}

// ============================================================================
// DEFAULT THEMES
// ============================================================================

/**
 * Default HIVE brand palette (amber accent)
 */
export const HIVE_DEFAULT_PALETTE: ToolThemePalette = {
  primary: '#F59E0B',         // amber-500
  primaryLight: '#FBBF24',    // amber-400
  primaryDark: '#D97706',     // amber-600
  primaryAlpha10: 'rgba(245, 158, 11, 0.1)',
  primaryAlpha20: 'rgba(245, 158, 11, 0.2)',
  primaryAlpha40: 'rgba(245, 158, 11, 0.4)',
  primaryContrast: '#000000',
};

/**
 * Minimal/neutral palette
 */
export const MINIMAL_PALETTE: ToolThemePalette = {
  primary: '#6B7280',         // gray-500
  primaryLight: '#9CA3AF',    // gray-400
  primaryDark: '#4B5563',     // gray-600
  primaryAlpha10: 'rgba(107, 114, 128, 0.1)',
  primaryAlpha20: 'rgba(107, 114, 128, 0.2)',
  primaryAlpha40: 'rgba(107, 114, 128, 0.4)',
  primaryContrast: '#FFFFFF',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse hex color to HSL
 */
export function hexToHSL(hex: string): HSLColor {
  // Remove # if present
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let hue = 0;
  let sat = 0;

  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        hue = ((b - r) / d + 2) / 6;
        break;
      case b:
        hue = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(hue * 360),
    s: Math.round(sat * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex
 */
export function hslToHex(hsl: HSLColor): string {
  const { h, s, l } = hsl;
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (v: number) => {
    const hex = Math.round((v + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Calculate relative luminance for contrast calculation
 */
export function getLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Get contrast text color (white or black) for a background
 */
export function getContrastColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor);
  return luminance > 0.179 ? '#000000' : '#FFFFFF';
}

/**
 * Generate a full palette from a primary color
 */
export function generatePalette(primaryHex: string): ToolThemePalette {
  const hsl = hexToHSL(primaryHex);

  // Generate variants
  const lightHsl = { ...hsl, l: Math.min(hsl.l + 10, 85) };
  const darkHsl = { ...hsl, l: Math.max(hsl.l - 15, 20) };

  return {
    primary: primaryHex,
    primaryLight: hslToHex(lightHsl),
    primaryDark: hslToHex(darkHsl),
    primaryAlpha10: hexToRgba(primaryHex, 0.1),
    primaryAlpha20: hexToRgba(primaryHex, 0.2),
    primaryAlpha40: hexToRgba(primaryHex, 0.4),
    primaryContrast: getContrastColor(primaryHex),
  };
}

/**
 * Convert hex to rgba string
 */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Resolve a tool theme based on config and space brand
 */
export function resolveToolTheme(
  config: ToolThemeConfig,
  spaceBrand?: SpaceBrand
): ResolvedToolTheme {
  let palette: ToolThemePalette;
  let source = config.source;

  switch (config.source) {
    case 'space-brand':
      if (spaceBrand?.primaryColor && spaceBrand.applyToTools !== false) {
        palette = generatePalette(spaceBrand.primaryColor);
      } else if (config.fallbackColor) {
        palette = generatePalette(config.fallbackColor);
      } else {
        // Fall back to HIVE default
        palette = HIVE_DEFAULT_PALETTE;
        source = 'hive-default';
      }
      break;

    case 'minimal':
      palette = MINIMAL_PALETTE;
      break;

    case 'hive-default':
    default:
      palette = HIVE_DEFAULT_PALETTE;
      break;
  }

  // Generate CSS variables
  const cssVariables: Record<string, string> = {
    '--tool-primary': palette.primary,
    '--tool-primary-light': palette.primaryLight,
    '--tool-primary-dark': palette.primaryDark,
    '--tool-primary-alpha-10': palette.primaryAlpha10,
    '--tool-primary-alpha-20': palette.primaryAlpha20,
    '--tool-primary-alpha-40': palette.primaryAlpha40,
    '--tool-primary-contrast': palette.primaryContrast,
  };

  return { source, palette, cssVariables };
}

/**
 * Default tool theme config
 */
export const DEFAULT_TOOL_THEME: ToolThemeConfig = {
  source: 'space-brand',  // Default to inheriting space brand
};

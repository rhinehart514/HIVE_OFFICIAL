/**
 * HIVE Unified Tailwind Configuration
 * Extends Tailwind CSS with HIVE design tokens
 *
 * Usage:
 * import { hiveTailwindConfig } from '@hive/tokens/tailwind-config-unified';
 *
 * export default {
 *   theme: { extend: hiveTailwindConfig }
 * }
 */

import { foundation, semantic, components } from './colors-unified';
import { typography } from './typography';
import { spacing, layoutSizes } from './spacing';
import { radius } from './radius';
import { motion } from './motion';
import { effects } from './effects';

// ============================================================================
// COLOR SYSTEM
// ============================================================================

/**
 * Tailwind color palette from unified design tokens
 * Organized by semantic purpose
 */
export const hiveTailwindColors = {
  // === SEMANTIC COLORS (Primary approach) ===
  // Use these for most cases - they reference CSS variables for runtime theming

  background: {
    primary: 'var(--hive-background-primary)',
    secondary: 'var(--hive-background-secondary)',
    tertiary: 'var(--hive-background-tertiary)',
    interactive: 'var(--hive-background-interactive)',
    overlay: 'var(--hive-background-overlay)',
    muted: 'var(--hive-background-muted)',
  },

  text: {
    primary: 'var(--hive-text-primary)',
    secondary: 'var(--hive-text-secondary)',
    tertiary: 'var(--hive-text-tertiary)',
    muted: 'var(--hive-text-muted)',
    disabled: 'var(--hive-text-disabled)',
    inverse: 'var(--hive-text-inverse)',
  },

  brand: {
    primary: 'var(--hive-brand-primary)',
    hover: 'var(--hive-brand-hover)',
    'on-gold': 'var(--hive-brand-onGold)',
  },

  interactive: {
    hover: 'var(--hive-interactive-hover)',
    focus: 'var(--hive-interactive-focus)',
    active: 'var(--hive-interactive-active)',
    disabled: 'var(--hive-interactive-disabled)',
  },

  gold: {
    cta: 'var(--hive-gold-cta)',
    achievement: 'var(--hive-gold-achievement)',
    presence: 'var(--hive-gold-presence)',
    featured: 'var(--hive-gold-featured)',
  },

  status: {
    success: 'var(--hive-status-success)',
    'success-hover': 'var(--hive-status-successHover)',
    warning: 'var(--hive-status-warning)',
    'warning-hover': 'var(--hive-status-warningHover)',
    error: 'var(--hive-status-error)',
    'error-hover': 'var(--hive-status-errorHover)',
    info: 'var(--hive-status-info)',
    'info-hover': 'var(--hive-status-infoHover)',
  },

  border: {
    DEFAULT: 'var(--hive-border-default)',
    muted: 'var(--hive-border-muted)',
    hover: 'var(--hive-border-hover)',
    focus: 'var(--hive-border-focus)',
    strong: 'var(--hive-border-strong)',
  },

  // === FOUNDATION COLORS (Direct values - use sparingly) ===
  // These are static values, not themeable

  foundation: {
    black: foundation.black,
    white: foundation.white,
    gray: foundation.gray,
    gold: foundation.gold,
  },

  // === COMPONENT COLORS (For specific components) ===

  button: {
    'default-bg': 'var(--button-default-bg)',
    'default-text': 'var(--button-default-text)',
    'primary-bg': 'var(--button-primary-bg)',
    'primary-text': 'var(--button-primary-text)',
    'secondary-bg': 'var(--button-secondary-bg)',
    'secondary-text': 'var(--button-secondary-text)',
    'ghost-bg': 'var(--button-ghost-bg)',
    'ghost-text': 'var(--button-ghost-text)',
    'destructive-bg': 'var(--button-destructive-bg)',
    'destructive-text': 'var(--button-destructive-text)',
  },

  card: {
    'default-bg': 'var(--card-default-bg)',
    'default-border': 'var(--card-default-border)',
    'elevated-bg': 'var(--card-elevated-bg)',
    'interactive-bg': 'var(--card-interactive-bg)',
    'outline-bg': 'var(--card-outline-bg)',
  },

  input: {
    'default-bg': 'var(--input-default-bg)',
    'default-border': 'var(--input-default-border)',
    'error-border': 'var(--input-error-border)',
    'success-border': 'var(--input-success-border)',
  },

  badge: {
    'default-bg': 'var(--badge-default-bg)',
    'gold-bg': 'var(--badge-gold-bg)',
    'success-bg': 'var(--badge-success-bg)',
    'warning-bg': 'var(--badge-warning-bg)',
    'error-bg': 'var(--badge-error-bg)',
  },
};

// ============================================================================
// SPACING SYSTEM
// ============================================================================

// Explicitly filter to only string values — prevents CJS/ESM interop from
// leaking module namespace keys (spacing, layoutSizes, containers, default)
// into the Tailwind config, which creates circular references in cloneDeep.
export const hiveTailwindSpacing: Record<string, string> = Object.fromEntries(
  Object.entries(spacing).filter(([, v]) => typeof v === 'string')
);

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const hiveTailwindFontSizes = {
  ...typography.fontSize,
};

export const hiveTailwindFontFamily = {
  sans: typography.fontFamily.sans,
  mono: typography.fontFamily.mono,
};

export const hiveTailwindFontWeight = {
  ...typography.fontWeight,
};

export const hiveTailwindLineHeight = {
  ...typography.lineHeight,
};

export const hiveTailwindLetterSpacing = {
  ...typography.letterSpacing,
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const hiveTailwindBorderRadius = {
  ...radius,
};

// ============================================================================
// SHADOWS & EFFECTS
// ============================================================================

export const hiveTailwindBoxShadow = {
  ...effects.boxShadow,
  // Aliases for common use
  sm: effects.boxShadow.level1,
  DEFAULT: effects.boxShadow.level2,
  md: effects.boxShadow.level3,
  lg: effects.boxShadow.level4,
  xl: effects.boxShadow.level5,
};

export const hiveTailwindBackdropBlur = {
  ...effects.backdropBlur,
};

// ============================================================================
// MOTION SYSTEM
// ============================================================================

export const hiveTailwindTransitionDuration = {
  ...Object.fromEntries(
    Object.entries(motion.duration).map(([key, value]) => [
      key,
      value.replace('s', '000ms').replace('ms', 'ms'), // Convert to milliseconds
    ])
  ),
};

export const hiveTailwindTransitionTimingFunction = {
  ...motion.easing,
  DEFAULT: motion.easing.default,
};

export const hiveTailwindAnimation = {
  'hive-fade': 'hive-fade 150ms cubic-bezier(0.22, 1, 0.36, 1)',
  'hive-scale': 'hive-scale 150ms cubic-bezier(0.22, 1, 0.36, 1)',
  'hive-spin-slow': 'spin 3s linear infinite',
};

export const hiveTailwindKeyframes = {
  'hive-fade': {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  'hive-scale': {
    '0%': { transform: 'scale(0.98)' },
    '100%': { transform: 'scale(1)' },
  },
};

// ============================================================================
// LAYOUT UTILITIES
// ============================================================================

export const hiveTailwindHeight = {
  ...layoutSizes.height,
};

export const hiveTailwindWidth = {
  ...layoutSizes.width,
};

// ============================================================================
// COMPLETE TAILWIND CONFIG
// ============================================================================

/**
 * Complete Tailwind configuration object
 * Use this to extend your Tailwind config
 */
export const hiveTailwindConfig = {
  colors: hiveTailwindColors,
  spacing: hiveTailwindSpacing,
  fontSize: hiveTailwindFontSizes,
  fontFamily: hiveTailwindFontFamily,
  fontWeight: hiveTailwindFontWeight,
  lineHeight: hiveTailwindLineHeight,
  letterSpacing: hiveTailwindLetterSpacing,
  borderRadius: hiveTailwindBorderRadius,
  boxShadow: hiveTailwindBoxShadow,
  backdropBlur: hiveTailwindBackdropBlur,
  transitionDuration: hiveTailwindTransitionDuration,
  transitionTimingFunction: hiveTailwindTransitionTimingFunction,
  animation: hiveTailwindAnimation,
  keyframes: hiveTailwindKeyframes,
  height: hiveTailwindHeight,
  width: hiveTailwindWidth,
};

// ============================================================================
// UTILITY FUNCTION
// ============================================================================

/**
 * Utility function to merge HIVE tokens with existing Tailwind config
 *
 * @example
 * import { extendTailwindConfig } from '@hive/tokens/tailwind-config-unified';
 *
 * export default extendTailwindConfig({
 *   content: ['./src/** /*.{js,ts,jsx,tsx}'],
 *   plugins: [require('tailwindcss-animate')],
 * });
 */
export function extendTailwindConfig(existingConfig: Record<string, unknown> = {}) {
  const existingTheme = (existingConfig.theme as Record<string, unknown>) || {};
  const existingExtend = (existingTheme.extend as Record<string, unknown>) || {};

  return {
    ...existingConfig,
    theme: {
      ...existingTheme,
      extend: {
        ...existingExtend,
        ...hiveTailwindConfig,
      },
    },
  };
}

/**
 * Default export for convenience
 */
export default hiveTailwindConfig;

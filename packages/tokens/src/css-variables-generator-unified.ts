/**
 * HIVE Unified CSS Variables Generator
 * Generates CSS custom properties from the unified token system
 *
 * Output Structure:
 * 1. Foundation tokens (raw values)
 * 2. Semantic tokens (purpose-based)
 * 3. Component tokens (component-specific)
 * 4. Legacy aliases (backward compatibility)
 * 5. Utility classes
 */

import { foundation, semantic, components, legacy } from './colors-unified';
import { spacing } from './spacing';
import { radius } from './radius';
import { typography } from './typography';
import { motion } from './motion';
import { effects } from './effects';

/**
 * Generate all CSS custom properties
 */
export function generateUnifiedCSSVariables(): string {
  const lines: string[] = [
    '/**',
    ' * HIVE Design Tokens - Auto-generated CSS Custom Properties',
    ' * DO NOT EDIT MANUALLY - Generated from packages/tokens/src/',
    ' *',
    ' * Architecture:',
    ' * - Foundation: Raw color values',
    ' * - Semantic: Purpose-based tokens',
    ' * - Component: Component-specific tokens',
    ' */',
    '',
    ':root {',
  ];

  // ============================================================================
  // FOUNDATION TOKENS
  // ============================================================================

  lines.push('  /* === FOUNDATION TOKENS === */');
  lines.push('  /* Raw color values - use semantic tokens instead when possible */');
  lines.push('');

  // Foundation colors
  lines.push('  /* Foundation - Base colors */');
  lines.push(`  --hive-foundation-black: ${foundation.black};`);
  lines.push(`  --hive-foundation-white: ${foundation.white};`);
  lines.push('');

  // Gray scale
  lines.push('  /* Foundation - Gray scale */');
  Object.entries(foundation.gray).forEach(([key, value]) => {
    lines.push(`  --hive-foundation-gray-${key}: ${value};`);
  });
  lines.push('');

  // Gold
  lines.push('  /* Foundation - Brand gold */');
  Object.entries(foundation.gold).forEach(([key, value]) => {
    lines.push(`  --hive-foundation-gold-${key}: ${value};`);
  });
  lines.push('');

  // Functional colors
  lines.push('  /* Foundation - Functional colors */');
  ['green', 'yellow', 'red', 'blue'].forEach((color) => {
    const colorObj = foundation[color as keyof typeof foundation] as Record<string, string>;
    if (colorObj && typeof colorObj === 'object') {
      Object.entries(colorObj).forEach(([key, value]) => {
        lines.push(`  --hive-foundation-${color}-${key}: ${value};`);
      });
    }
  });
  lines.push('');

  // ============================================================================
  // SEMANTIC TOKENS
  // ============================================================================

  lines.push('  /* === SEMANTIC TOKENS === */');
  lines.push('  /* Purpose-based tokens - primary choice for most use cases */');
  lines.push('');

  // Background
  lines.push('  /* Semantic - Background hierarchy */');
  Object.entries(semantic.background).forEach(([key, value]) => {
    lines.push(`  --hive-background-${key}: ${value};`);
  });
  lines.push('');

  // Text
  lines.push('  /* Semantic - Text hierarchy */');
  Object.entries(semantic.text).forEach(([key, value]) => {
    lines.push(`  --hive-text-${key}: ${value};`);
  });
  lines.push('');

  // Brand
  lines.push('  /* Semantic - Brand system */');
  Object.entries(semantic.brand).forEach(([key, value]) => {
    lines.push(`  --hive-brand-${key}: ${value};`);
  });
  lines.push('');

  // Interactive
  lines.push('  /* Semantic - Interactive states (grayscale default) */');
  Object.entries(semantic.interactive).forEach(([key, value]) => {
    lines.push(`  --hive-interactive-${key}: ${value};`);
  });
  lines.push('');

  // Gold moments
  lines.push('  /* Semantic - Gold reserved for key moments */');
  Object.entries(semantic.gold).forEach(([key, value]) => {
    lines.push(`  --hive-gold-${key}: ${value};`);
  });
  lines.push('');

  // Status
  lines.push('  /* Semantic - Status colors */');
  Object.entries(semantic.status).forEach(([key, value]) => {
    lines.push(`  --hive-status-${key}: ${value};`);
  });
  lines.push('');

  // Border
  lines.push('  /* Semantic - Border system */');
  Object.entries(semantic.border).forEach(([key, value]) => {
    lines.push(`  --hive-border-${key}: ${value};`);
  });
  lines.push('');

  // ============================================================================
  // COMPONENT TOKENS
  // ============================================================================

  lines.push('  /* === COMPONENT TOKENS === */');
  lines.push('  /* Component-specific tokens for consistent styling */');
  lines.push('');

  // Button component tokens
  lines.push('  /* Component - Button variants */');
  Object.entries(components.button).forEach(([variant, tokens]) => {
    if (typeof tokens === 'object' && tokens !== null) {
      Object.entries(tokens).forEach(([key, value]) => {
        if (typeof value === 'string') {
          lines.push(`  --button-${variant}-${key}: ${value};`);
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects like hover/active
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            lines.push(`  --button-${variant}-${key}-${nestedKey}: ${nestedValue};`);
          });
        }
      });
    }
  });
  lines.push('');

  // Card component tokens
  lines.push('  /* Component - Card variants */');
  Object.entries(components.card).forEach(([variant, tokens]) => {
    if (typeof tokens === 'object' && tokens !== null) {
      Object.entries(tokens).forEach(([key, value]) => {
        if (typeof value === 'string') {
          lines.push(`  --card-${variant}-${key}: ${value};`);
        } else if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            lines.push(`  --card-${variant}-${key}-${nestedKey}: ${nestedValue};`);
          });
        }
      });
    }
  });
  lines.push('');

  // Input component tokens
  lines.push('  /* Component - Input variants */');
  Object.entries(components.input).forEach(([variant, tokens]) => {
    if (typeof tokens === 'object' && tokens !== null) {
      Object.entries(tokens).forEach(([key, value]) => {
        if (typeof value === 'string') {
          lines.push(`  --input-${variant}-${key}: ${value};`);
        } else if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            lines.push(`  --input-${variant}-${key}-${nestedKey}: ${nestedValue};`);
          });
        }
      });
    }
  });
  lines.push('');

  // Badge component tokens
  lines.push('  /* Component - Badge variants */');
  Object.entries(components.badge).forEach(([variant, tokens]) => {
    if (typeof tokens === 'object' && tokens !== null) {
      Object.entries(tokens).forEach(([key, value]) => {
        if (typeof value === 'string') {
          lines.push(`  --badge-${variant}-${key}: ${value};`);
        }
      });
    }
  });
  lines.push('');

  // Toast component tokens
  lines.push('  /* Component - Toast variants */');
  Object.entries(components.toast).forEach(([variant, tokens]) => {
    if (typeof tokens === 'object' && tokens !== null) {
      Object.entries(tokens).forEach(([key, value]) => {
        if (typeof value === 'string') {
          lines.push(`  --toast-${variant}-${key}: ${value};`);
        }
      });
    }
  });
  lines.push('');

  // Overlay component tokens
  lines.push('  /* Component - Overlay variants */');
  Object.entries(components.overlay).forEach(([variant, tokens]) => {
    if (typeof tokens === 'object' && tokens !== null) {
      Object.entries(tokens).forEach(([key, value]) => {
        if (typeof value === 'string') {
          lines.push(`  --overlay-${variant}-${key}: ${value};`);
        } else if (typeof value === 'object' && value !== null && key === 'item') {
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            lines.push(`  --overlay-${variant}-item-${nestedKey}: ${nestedValue};`);
          });
        }
      });
    }
  });
  lines.push('');

  // ============================================================================
  // SPACING TOKENS
  // ============================================================================

  lines.push('  /* === SPACING TOKENS === */');
  lines.push('  /* Mobile-optimized 4px grid system */');
  lines.push('');
  Object.entries(spacing).forEach(([key, value]) => {
    lines.push(`  --spacing-${key}: ${value};`);
  });
  lines.push('');

  // ============================================================================
  // RADIUS TOKENS
  // ============================================================================

  lines.push('  /* === RADIUS TOKENS === */');
  lines.push('  /* Border radius scale */');
  lines.push('');
  Object.entries(radius).forEach(([key, value]) => {
    lines.push(`  --radius-${key}: ${value};`);
  });
  lines.push('');

  // ============================================================================
  // TYPOGRAPHY TOKENS
  // ============================================================================

  lines.push('  /* === TYPOGRAPHY TOKENS === */');
  lines.push('');

  // Font families
  lines.push('  /* Typography - Font families */');
  Object.entries(typography.fontFamily).forEach(([key, value]) => {
    lines.push(`  --font-family-${key}: ${value};`);
  });
  lines.push('');

  // Font sizes
  lines.push('  /* Typography - Font sizes */');
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    lines.push(`  --font-size-${key}: ${value};`);
  });
  lines.push('');

  // Font weights
  lines.push('  /* Typography - Font weights */');
  Object.entries(typography.fontWeight).forEach(([key, value]) => {
    lines.push(`  --font-weight-${key}: ${value};`);
  });
  lines.push('');

  // ============================================================================
  // MOTION TOKENS
  // ============================================================================

  lines.push('  /* === MOTION TOKENS === */');
  lines.push('');

  // Easing
  lines.push('  /* Motion - Easing curves */');
  Object.entries(motion.easing).forEach(([key, value]) => {
    lines.push(`  --easing-${key}: ${value};`);
  });
  lines.push('');

  // Duration
  lines.push('  /* Motion - Duration scale */');
  Object.entries(motion.duration).forEach(([key, value]) => {
    lines.push(`  --duration-${key}: ${value};`);
  });
  lines.push('');

  // ============================================================================
  // EFFECTS TOKENS
  // ============================================================================

  lines.push('  /* === EFFECTS TOKENS === */');
  lines.push('');

  // Box Shadows
  if (effects.boxShadow) {
    lines.push('  /* Effects - Box Shadows */');
    Object.entries(effects.boxShadow).forEach(([key, value]) => {
      lines.push(`  --shadow-${key}: ${value};`);
    });
    lines.push('');
  }

  // Backdrop Blur
  if (effects.backdropBlur) {
    lines.push('  /* Effects - Backdrop Blur */');
    Object.entries(effects.backdropBlur).forEach(([key, value]) => {
      lines.push(`  --blur-${key}: ${value};`);
    });
    lines.push('');
  }

  // ============================================================================
  // LEGACY ALIASES (Backward Compatibility)
  // ============================================================================

  lines.push('  /* === LEGACY ALIASES === */');
  lines.push('  /* Backward compatibility - prefer semantic tokens */');
  lines.push('');
  Object.entries(legacy).forEach(([key, value]) => {
    lines.push(`  --hive-${key}: ${value};`);
  });
  lines.push('');

  // Close :root
  lines.push('}');
  lines.push('');

  // ============================================================================
  // UTILITY CLASSES
  // ============================================================================

  lines.push('/* === UTILITY CLASSES === */');
  lines.push('/* Common patterns */');
  lines.push('');

  // Legacy surface alias
  lines.push('.hive-glass {');
  lines.push('  background: var(--hive-background-secondary);');
  lines.push('  border: 1px solid var(--hive-border-default);');
  lines.push('}');
  lines.push('');

  // Focus ring
  lines.push('.hive-focus-ring {');
  lines.push('  outline: none;');
  lines.push('  box-shadow: 0 0 0 2px var(--hive-interactive-focus);');
  lines.push('}');
  lines.push('');

  // Smooth transitions
  lines.push('.hive-transition {');
  lines.push('  transition-property: background-color, border-color, color, fill, stroke;');
  lines.push('  transition-timing-function: var(--easing-default);');
  lines.push('  transition-duration: var(--duration-smooth);');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/**
 * Legacy generator wrapper for backward compatibility
 */
export function generateCSSVariables(): string {
  return generateUnifiedCSSVariables();
}

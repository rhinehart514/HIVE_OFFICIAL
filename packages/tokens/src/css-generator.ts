// CSS Custom Properties Generator for HIVE Design Tokens
import { foundation, semantic, components } from './colors-unified';
import { typography } from './typography';
import { spacing, layoutSizes } from './spacing';
import { radius } from './radius';
import { motion } from './motion';
import { effects } from './effects';
import { zIndex } from './design-system-v2';

// Legacy aliases for backwards compatibility
const colors = {
  ...foundation.gray,
  gold: foundation.gold[500],
  black: foundation.black,
  white: foundation.white,
};

const overlay = {
  glass: '#0A0A0A',
  'glass-strong': '#141414',
  modal: 'rgba(0, 0, 0, 0.6)',
};

const gradients = {
  gold: `linear-gradient(135deg, ${foundation.gold[500]} 0%, ${foundation.gold.hover} 100%)`,
};

const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
  'gold-glow': 'none',
  'gold-glow-strong': 'none',
};

const border = {
  default: semantic.border.default,
  subtle: semantic.border.subtle,
  hover: semantic.border.hover,
  focus: semantic.border.focus,
};

// Generate CSS custom properties from design tokens
export function generateCSSCustomProperties(): string {
  const cssVars: string[] = [];
  
  // Colors
  cssVars.push('  /* HIVE Color Tokens */');
  Object.entries(colors).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cssVars.push(`  --hive-color-${key}: ${value};`);
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        cssVars.push(`  --hive-color-${key}-${subKey}: ${subValue};`);
      });
    }
  });
  
  cssVars.push('');
  cssVars.push('  /* HIVE Semantic Colors */');
  Object.entries(semantic).forEach(([category, values]) => {
    Object.entries(values).forEach(([key, value]) => {
      cssVars.push(`  --hive-${category}-${key}: ${value};`);
    });
  });
  
  cssVars.push('');
  cssVars.push('  /* HIVE Overlay Colors */');
  Object.entries(overlay).forEach(([key, value]) => {
    cssVars.push(`  --hive-overlay-${key}: ${value};`);
  });
  
  cssVars.push('');
  cssVars.push('  /* HIVE Gradients */');
  Object.entries(gradients).forEach(([key, value]) => {
    cssVars.push(`  --hive-gradient-${key}: ${value};`);
  });
  
  cssVars.push('');
  cssVars.push('  /* HIVE Shadows */');
  Object.entries(shadows).forEach(([key, value]) => {
    cssVars.push(`  --hive-shadow-${key}: ${value};`);
  });
  
  cssVars.push('');
  cssVars.push('  /* HIVE Border Colors */');
  Object.entries(border).forEach(([key, value]) => {
    cssVars.push(`  --hive-border-${key}: ${value};`);
  });
  
  // Add missing border variants that components expect
  cssVars.push(`  --hive-border-gold-strong: rgba(255, 215, 0, 0.4);`);
  cssVars.push(`  --hive-border-glass-strong: rgba(255, 255, 255, 0.12);`);
  
  // Typography
  cssVars.push('');
  cssVars.push('  /* HIVE Typography */');
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    cssVars.push(`  --hive-font-size-${key}: ${value};`);
  });
  
  Object.entries(typography.fontWeight).forEach(([key, value]) => {
    cssVars.push(`  --hive-font-weight-${key}: ${value};`);
  });
  
  Object.entries(typography.lineHeight).forEach(([key, value]) => {
    cssVars.push(`  --hive-line-height-${key}: ${value};`);
  });
  
  Object.entries(typography.letterSpacing).forEach(([key, value]) => {
    cssVars.push(`  --hive-letter-spacing-${key}: ${value};`);
  });
  
  // Spacing
  cssVars.push('');
  cssVars.push('  /* HIVE Spacing */');
  Object.entries(spacing).forEach(([key, value]) => {
    cssVars.push(`  --hive-spacing-${key}: ${value};`);
  });
  
  // Layout sizes for hybrid approach
  cssVars.push('');
  cssVars.push('  /* HIVE Layout Sizes */');
  Object.entries(layoutSizes.height).forEach(([key, value]) => {
    cssVars.push(`  --hive-height-${key}: ${value};`);
  });
  
  Object.entries(layoutSizes.width).forEach(([key, value]) => {
    cssVars.push(`  --hive-width-${key}: ${value};`);
  });
  
  // Radius
  cssVars.push('');
  cssVars.push('  /* HIVE Radius */');
  Object.entries(radius).forEach(([key, value]) => {
    cssVars.push(`  --hive-radius-${key}: ${value};`);
  });
  
  // Motion
  cssVars.push('');
  cssVars.push('  /* HIVE Motion */');
  Object.entries(motion.easing).forEach(([key, value]) => {
    cssVars.push(`  --hive-easing-${key}: ${value};`);
  });
  
  Object.entries(motion.duration).forEach(([key, value]) => {
    cssVars.push(`  --hive-duration-${key}: ${value};`);
  });
  
  Object.entries(motion.cascade).forEach(([key, value]) => {
    cssVars.push(`  --hive-cascade-${key}: ${value};`);
  });
  
  Object.entries(motion.transform).forEach(([key, value]) => {
    cssVars.push(`  --hive-transform-${key}: ${value};`);
  });
  
  // Effects
  cssVars.push('');
  cssVars.push('  /* HIVE Effects */');
  Object.entries(effects.boxShadow).forEach(([key, value]) => {
    cssVars.push(`  --hive-shadow-${key}: ${value};`);
  });
  
  // Add missing shadow variants that components expect
  cssVars.push(`  --hive-shadow-gold-glow: none;`);
  cssVars.push(`  --hive-shadow-gold-glow-strong: none;`);
  cssVars.push(`  --hive-shadow-emerald-glow: none;`);
  
  Object.entries(effects.backdropBlur).forEach(([key, value]) => {
    cssVars.push(`  --hive-backdrop-blur-${key}: ${value};`);
  });
  
  Object.entries(effects.opacity).forEach(([key, value]) => {
    cssVars.push(`  --hive-opacity-${key}: ${value};`);
  });
  
  Object.entries(zIndex).forEach(([key, value]) => {
    cssVars.push(`  --hive-z-${key}: ${value};`);
  });
  
  return `:root {\n${cssVars.join('\n')}\n}`;
}

// Generate Tailwind CSS color config
export function generateTailwindColorConfig(): Record<string, string | Record<string, string>> {
  const tailwindColors: Record<string, string | Record<string, string>> = {};
  
  // Add individual colors
  Object.entries(colors).forEach(([key, value]) => {
    if (typeof value === 'string') {
      tailwindColors[key] = value;
    } else if (typeof value === 'object') {
      tailwindColors[key] = value;
    }
  });
  
  // Add semantic colors
  Object.entries(semantic).forEach(([category, values]) => {
    tailwindColors[category] = values;
  });
  
  // Add overlay colors with CSS variable fallback
  Object.entries(overlay).forEach(([key, value]) => {
    tailwindColors[`overlay-${key}`] = value;
  });
  
  // Add border colors
  Object.entries(border).forEach(([key, value]) => {
    tailwindColors[`border-${key}`] = value;
  });
  
  return tailwindColors;
}

// Generate utility classes for common patterns
export function generateUtilityClasses(): string {
  const utilities: string[] = [];
  
  utilities.push('@layer utilities {');
  utilities.push('  /* HIVE Surface Utilities (legacy aliases) */');
  utilities.push('  .hive-glass {');
  utilities.push(`    background: ${overlay.glass};`);
  utilities.push('    border: 1px solid var(--hive-border-default);');
  utilities.push('  }');
  utilities.push('');
  
  utilities.push('  .hive-glass-strong {');
  utilities.push(`    background: ${overlay['glass-strong']};`);
  utilities.push('    border: 1px solid var(--hive-border-hover);');
  utilities.push('  }');
  utilities.push('');
  
  utilities.push('  /* HIVE Gold Glow Effects (disabled) */');
  utilities.push('  .hive-gold-glow {');
  utilities.push(`    box-shadow: ${shadows['gold-glow']};`);
  utilities.push('  }');
  utilities.push('');
  
  utilities.push('  .hive-gold-glow-strong {');
  utilities.push(`    box-shadow: ${shadows['gold-glow-strong']};`);
  utilities.push('  }');
  utilities.push('');
  
  utilities.push('  /* HIVE Interactive States */');
  utilities.push('  .hive-interactive {');
  utilities.push('    transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), border-color 150ms cubic-bezier(0.22, 1, 0.36, 1);');
  utilities.push('  }');
  utilities.push('');
  
  utilities.push('  .hive-interactive:hover {');
  utilities.push('    background: var(--hive-interactive-hover);');
  utilities.push('  }');
  utilities.push('');
  
  utilities.push('  .hive-interactive:active {');
  utilities.push('    background: var(--hive-interactive-active);');
  utilities.push('  }');
  utilities.push('');
  
  utilities.push('  /* HIVE Motion Variants */');
  utilities.push('  .hive-motion-quick {');
  utilities.push('    transition-duration: var(--hive-duration-quick);');
  utilities.push('  }');
  utilities.push('');
  
  utilities.push('  .hive-motion-flowing {');
  utilities.push('    transition-duration: var(--hive-duration-flowing);');
  utilities.push('  }');
  utilities.push('');
  
  utilities.push('  .hive-motion-dramatic {');
  utilities.push('    transition-duration: var(--hive-duration-dramatic);');
  utilities.push('  }');
  utilities.push('');
  
  utilities.push('  /* HIVE Focus States */');
  utilities.push('  .hive-focus {');
  utilities.push('    outline: none;');
  utilities.push('    box-shadow: var(--hive-shadow-focus);');
  utilities.push('  }');
  utilities.push('');
  
  utilities.push('  /* HIVE Glow Effects */');
  utilities.push('  .hive-glow-gold {');
  utilities.push('    box-shadow: var(--hive-shadow-goldGlow);');
  utilities.push('    transition: box-shadow 150ms cubic-bezier(0.22, 1, 0.36, 1);');
  utilities.push('  }');
  utilities.push('');
  
  utilities.push('  .hive-glow-emerald {');
  utilities.push('    box-shadow: var(--hive-shadow-emeraldGlow);');
  utilities.push('    transition: box-shadow 150ms cubic-bezier(0.22, 1, 0.36, 1);');
  utilities.push('  }');
  utilities.push('}');
  
  return utilities.join('\n');
}

export type CSSToken = keyof typeof colors;
export type SemanticCSSToken = keyof typeof semantic;

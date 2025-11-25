// CSS VARIABLES GENERATOR
// Generates CSS custom properties from TypeScript design tokens
// This ensures single source of truth between TS and CSS
//
// NOW USING UNIFIED COLOR SYSTEM (Foundation → Semantic → Component)

import { generateUnifiedCSSVariables } from './css-variables-generator-unified';
import { typography } from './typography';
import { motion } from './motion';

/**
 * Generate CSS custom properties from design tokens
 * Now uses the unified color system
 */
export function generateCSSVariables(): string {
  // Use the unified generator which includes all layers
  const unifiedCSS = generateUnifiedCSSVariables();

  // Extract just the :root block (without utility classes)
  const rootMatch = unifiedCSS.match(/:root \{[\s\S]*?\n\}/);
  if (!rootMatch) {
    throw new Error('Failed to extract :root block from unified CSS');
  }

  let rootBlock = rootMatch[0];

  // Add shadcn/ui compatibility aliases at the end
  const shadcnAliases = `
  /* shadcn/ui compatibility aliases */
  --background: var(--hive-background-primary);
  --foreground: var(--hive-text-primary);
  --card: var(--hive-background-secondary);
  --card-foreground: var(--hive-text-primary);
  --popover: var(--hive-background-secondary);
  --popover-foreground: var(--hive-text-primary);
  --primary: var(--hive-brand-primary);
  --primary-foreground: var(--hive-brand-onGold);
  --secondary: var(--hive-background-tertiary);
  --secondary-foreground: var(--hive-text-primary);
  --muted: var(--hive-background-tertiary);
  --muted-foreground: var(--hive-text-muted);
  --accent: var(--hive-background-interactive);
  --accent-foreground: var(--hive-text-primary);
  --destructive: var(--hive-status-error);
  --destructive-foreground: var(--hive-text-primary);
  --border: var(--hive-border-default);
  --input: var(--hive-border-default);
  --ring: var(--hive-interactive-focus);
  --radius: var(--radius-lg);
`;

  // Insert before the closing }
  rootBlock = rootBlock.replace(/\n\}$/, shadcnAliases + '\n}');

  return rootBlock;
}

/**
 * Generate CSS utility classes from design tokens
 */
export function generateUtilityClasses(): string {
  const utilityClasses: string[] = [
    '\n/* HIVE Utility Classes - Auto-generated from design tokens */',
  ];

  // Glass morphism utilities
  utilityClasses.push(`
.hive-glass {
  background: var(--hive-overlay-glass, rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid var(--hive-border-subtle, rgba(255, 255, 255, 0.05));
}

.hive-glass-strong {
  background: var(--hive-overlay-glass-strong, rgba(255, 255, 255, 0.12));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--hive-border-glass-strong, rgba(255, 255, 255, 0.12));
}`);

  // Interactive utilities
  utilityClasses.push(`
.hive-interactive {
  transition: all var(--hive-duration-smooth, 0.4s) var(--hive-easing, cubic-bezier(0.23, 1, 0.32, 1));
  will-change: transform, box-shadow;
  transform-origin: center;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.hive-interactive:hover {
  transform: translateY(-2px) scale(var(--hive-transform-scaleHover, 1.02));
  box-shadow: var(--hive-shadow-hover, 0 8px 25px rgba(0, 0, 0, 0.3)), var(--hive-shadow-gold-glow, 0 0 20px rgba(255, 215, 0, 0.3));
}

.hive-interactive:active {
  transform: translateY(0) scale(var(--hive-transform-scaleTap, 0.98));
  transition-duration: var(--hive-duration-quick, 0.2s);
}`);

  // Typography utilities - Unified Geist Sans
  utilityClasses.push(`
.hive-font-display {
  font-family: var(--hive-font-family-sans, 'Geist Sans', system-ui, sans-serif);
  font-feature-settings: "rlig" 1, "calt" 1;
  font-weight: var(--hive-font-weight-semibold, 600);
  letter-spacing: -0.025em;
}

.hive-font-sans {
  font-family: var(--hive-font-family-sans, 'Geist Sans', system-ui, sans-serif);
  font-feature-settings: "rlig" 1, "calt" 1;
  font-weight: var(--hive-font-weight-normal, 400);
  letter-spacing: -0.01em;
}`);

  return utilityClasses.join('\n');
}

/**
 * Generate complete CSS file with variables and utilities
 */
export function generateCompleteCSS(): string {
  return [
    generateCSSVariables(),
    generateUtilityClasses()
  ].join('\n');
}

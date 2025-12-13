// Design System V2 - Comprehensive token exports
export {
  scale,
  cssVariables,
  componentTokens,
  spacing,
  radius,
  typography,
  animation,
  shadows,
  breakpoints,
  zIndex,
  cognitiveBudgets,
  guidelines,
  generateCSSVariables,
} from './design-system-v2';

export type {
  ColorScale,
  CSSVariables,
  ComponentTokens,
  Spacing,
  Radius,
  Typography,
  Animation,
  Shadows,
} from './design-system-v2';

// Unified colors
export {
  foundation,
  semantic,
  components,
  legacy,
} from './colors-unified';

export type {
  FoundationToken,
  SemanticToken,
  ComponentToken,
  LegacyToken,
} from './colors-unified';

// Motion tokens
export {
  motion,
  motion as motionTokens,
  easingArrays,
  durationSeconds,
  springPresets,
  staggerPresets,
  performance,
  tinderSprings,
} from './motion';

// Tailwind config
export { hiveTailwindConfig, extendTailwindConfig } from './tailwind-config-unified';

// CSS utilities
export {
  generateCSSCustomProperties,
  generateCSSCustomProperties as generateAllCSS,
  generateCSSCustomProperties as generateTokenCSS,
  generateTailwindColorConfig,
  generateUtilityClasses,
} from './css-generator';

// Topology - Slot Kit for cognitive budgets
export { slotKit } from './topology/slot-kit';
export type { SlotKit, CognitiveBudgetSurface } from './topology/slot-kit';

// IDE tokens - HiveLab design system
export {
  IDE_TOKENS,
  ideSurface,
  ideBorder,
  ideText,
  ideInteractive,
  ideStatus,
  ideAccent,
  ideClasses,
} from './ide';

export type {
  IDESurface,
  IDEBorder,
  IDEText,
  IDEInteractive,
  IDEStatus,
  IDEAccent,
  IDETokens,
} from './ide';

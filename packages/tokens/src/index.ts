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

// Monochrome design system (99% grayscale, gold as reward)
export {
  MONOCHROME,
  monochromeValues,
  monochromePatterns,
  // Phase 3: Visual Warmth
  warmthSpectrum,
  getWarmthLevel,
  presenceStates,
} from './monochrome';

export type {
  MonochromeToken,
  MonochromeValue,
  MonochromePattern,
  WarmthLevel,
  PresenceState,
} from './monochrome';

// Layout tokens (max-widths, breakpoints, spacing, chat)
export {
  MAX_WIDTHS,
  maxWidthClasses,
  BREAKPOINTS,
  breakpointValues,
  TOUCH_TARGETS,
  SPACING,
  spacingClasses,
  SHELLS,
  HEIGHTS,
  // Chat spacing (Phase 3 - Hub layout)
  CHAT_SPACING,
  chatSpacingClasses,
  PANEL_MOTION,
  CONTEXT_PANEL,
} from './layout';

export type {
  MaxWidth,
  Breakpoint,
  SpacingKey,
  ShellType,
  ChatSpacingKey,
} from './layout';

// Component patterns (glass, cards, buttons, inputs)
export {
  GLASS,
  CARD,
  INPUT,
  BUTTON,
  BADGE,
  FOCUS,
  TYPOGRAPHY as TYPOGRAPHY_PATTERNS,
  MOTION_TIERS,
  ELEVATION,
} from './patterns';

export type {
  GlassPattern,
  CardPattern,
  InputPattern,
  ButtonPattern,
  BadgePattern,
  FocusPattern,
  TypographyPattern,
  MotionTier,
  ElevationLevel,
} from './patterns';

// Motion tokens
export {
  MOTION,
  motion,
  motion as motionTokens,
  easingArrays,
  durationSeconds,
  springPresets,
  staggerPresets,
  performance,
  tinderSprings,
  // HIVE signature motion
  SPRING_SNAP_NAV,
  PUNCH_TRANSITION,
  SNAP_TRANSITION,
  // Phase 5: Micro-interaction presets
  buttonPressVariants,
  cardHoverVariants,
  messageEntryVariants,
  successVariants,
  errorShakeVariants,
  pageTransitionVariants,
  modalVariants,
  dropdownVariants,
  selectionVariants,
  reducedMotionVariants,
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

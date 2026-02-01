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
  // Responsive behavior (Design Principles)
  RESPONSIVE_BEHAVIOR,
  MOBILE_ONLY,
  DESKTOP_ONLY,
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
  EMPTY_STATE,
  LOADING,
  MODAL,
  TOAST,
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
  EmptyStatePattern,
  LoadingPattern,
  ModalPattern,
  ToastPattern,
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
  // HIVE signature variants (Design Principles)
  revealVariants,
  surfaceVariants,
  staggerContainerVariants,
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

export type {
  MotionToken,
  MotionEasing,
  MotionDuration,
  MotionCascade,
  EasingArray,
  DurationSeconds,
  SpringPreset,
  TinderSpring,
  StaggerPreset,
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

// Space tokens - Split Panel layout for /s/[handle]
export {
  SPACE_LAYOUT,
  spaceLayoutCSS,
  spaceLayoutClasses,
  SPACE_COLORS,
  spaceColorVars,
  SPACE_TYPOGRAPHY,
  spaceTypographyClasses,
  SPACE_MOTION,
  spaceMotionVariants,
  SPACE_COMPONENTS,
  SPACE_RESPONSIVE,
  SPACE_Z_INDEX,
} from './spaces';

export type {
  SpaceLayout,
  SpaceColors,
  SpaceTypography,
  SpaceMotion,
  SpaceComponents,
} from './spaces';

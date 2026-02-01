/**
 * Design Tokens
 *
 * Central export for all HIVE design tokens.
 * Updated 2026-01-29 with density system.
 */

// Core motion tokens (UI-friendly API with seconds-based durations)
export { MOTION } from './motion';
export type {
  EaseType,
  DurationType,
  StaggerType,
  ViewportType,
  SpringType,
  ParallaxType,
} from './motion';

// Re-export raw @hive/tokens motion exports for advanced usage
export {
  easingArrays,
  durationSeconds,
  springPresets,
  staggerPresets,
  tinderSprings,
  motion,
  performance,
  // HIVE signature motion
  SPRING_SNAP_NAV,
  PUNCH_TRANSITION,
  SNAP_TRANSITION,
  // HIVE signature variants (Design Principles)
  revealVariants,
  surfaceVariants,
  staggerContainerVariants,
  // Micro-interaction presets
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

// Spaces-specific motion tokens
export {
  SPACES_MOTION,
  SPACES_GOLD,
  AMBIENT_GLOW,
  getWarmthLevel,
  getWarmthConfig,
  getEnergyDotCount,
  getAmbientGlow,
} from './spaces-motion';
export type {
  WarmthLevel,
  AmbientGlowLevel,
  SpacesMotionConfig,
  SpacesGoldConfig,
} from './spaces-motion';

// Density tokens
export {
  DENSITY,
  DENSITY_CONTEXTS,
  getDensityConfig,
  getDensityClasses,
  getDensityForContext,
} from './density';
export type {
  DensityLevel,
  DensityContext,
} from './density';

// Canonical motion variants (7 patterns)
export {
  // REVEAL - Page entrances
  REVEAL,
  revealTransition,
  revealFadeUp,
  revealFade,
  revealScale,
  revealSlideLeft,
  revealSlideRight,
  revealContainer,
  revealReduced,
  // SURFACE - Cards, panels, drawers
  SURFACE,
  surfaceTransition,
  surfaceCard,
  surfacePanel,
  surfaceDrawer,
  surfaceDrawerLeft,
  surfaceSheet,
  surfaceFloat,
  surfaceReduced,
  // MORPH - Inline state transforms
  MORPH,
  morphTransition,
  morphRotate,
  morphRotate45,
  morphScale,
  morphCrossfade,
  morphHeight,
  morphWidth,
  morphCheckPath,
  morphReduced,
  // CASCADE - List stagger
  CASCADE,
  cascadeContainer,
  cascadeContainerFast,
  cascadeContainerSlow,
  cascadeItem,
  cascadeItemFade,
  cascadeItemScale,
  cascadeItemSlide,
  cascadeMessage,
  cascadeExit,
  cascadeReduced,
  // OVERLAY - Modals, dialogs
  OVERLAY,
  overlayBackdrop,
  overlayModal,
  overlayDialog,
  overlayCommand,
  overlayAlert,
  overlaySheet,
  overlayToast,
  overlayReduced,
  // SNAP - Micro-interactions
  SNAP,
  snapTransition,
  snapButton,
  snapButtonShadow,
  snapToggle,
  snapCheck,
  snapIcon,
  snapIndicator,
  snapFocus,
  snapUnderline,
  snapReduced,
  // CELEBRATE - Gold moments
  CELEBRATE,
  CELEBRATE_GOLD,
  celebratePop,
  celebrateGlow,
  celebrateCheck,
  celebrateConfettiContainer,
  celebrateConfettiParticle,
  celebrateRing,
  celebrateBadge,
  celebrateCounter,
  celebrateSparkle,
  celebrateShineSweep,
  celebrateReduced,
} from './variants';

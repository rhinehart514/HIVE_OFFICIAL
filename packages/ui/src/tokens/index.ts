/**
 * Design Tokens
 *
 * Central export for all HIVE design tokens.
 */

// Core motion tokens
export { MOTION } from './motion';

// Re-export @hive/tokens motion exports
export {
  easingArrays,
  durationSeconds,
  springPresets,
  motionCSS,
  motionTokens,
  pageTransitionVariants,
  modalVariants,
  messageEntryVariants,
  reducedMotionVariants,
  goldPulse,
  hoverLift,
} from './motion';

export type {
  MotionToken,
  MotionEasing,
  MotionDuration,
  MotionCascade,
  EasingArray,
  DurationSeconds,
  SpringPreset,
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
} from './spaces';
export type {
  WarmthLevel,
  AmbientGlowLevel,
  SpacesMotionConfig,
  SpacesGoldConfig,
} from './spaces';

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

/**
 * Canonical Motion Variants
 *
 * Seven standardized motion patterns for HIVE.
 * Import from this file for consistent motion across the platform.
 *
 * Patterns:
 * 1. REVEAL - Page entrances, major surfaces (800ms)
 * 2. SURFACE - Cards, panels, drawers (spring)
 * 3. MORPH - Inline state transforms (spring)
 * 4. CASCADE - List stagger (40ms)
 * 5. OVERLAY - Modals, dialogs (200ms + spring)
 * 6. SNAP - Buttons, toggles (150ms)
 * 7. CELEBRATE - Gold moments, achievements (custom)
 */

// REVEAL - Page entrances
export {
  REVEAL,
  revealTransition,
  revealFadeUp,
  revealFade,
  revealScale,
  revealSlideLeft,
  revealSlideRight,
  revealContainer,
  revealReduced,
} from './reveal';

// SURFACE - Cards, panels, drawers
export {
  SURFACE,
  surfaceTransition,
  surfaceCard,
  surfacePanel,
  surfaceDrawer,
  surfaceDrawerLeft,
  surfaceSheet,
  surfaceFloat,
  surfaceReduced,
} from './surface';

// MORPH - Inline state transforms
export {
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
} from './morph';

// OVERLAY - Modals, dialogs
export {
  OVERLAY,
  overlayBackdrop,
  overlayModal,
  overlayDialog,
  overlayCommand,
  overlayAlert,
  overlaySheet,
  overlayToast,
  overlayReduced,
} from './overlay';

// SNAP - Micro-interactions
export {
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
} from './snap';

// CELEBRATE - Gold moments
export {
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
} from './celebrate';

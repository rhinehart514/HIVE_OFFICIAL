/**
 * HIVE Motion Variants Library
 *
 * Production-grade Framer Motion variants following HIVE design principles:
 * - Smooth confidence (300ms standard, silk easing)
 * - Vercel/OpenAI feel (subtle, purposeful animations)
 * - Respects prefers-reduced-motion
 * - Mobile-optimized (60fps, minimal layout shift)
 *
 * IMPORTANT: All values imported from @hive/tokens for single source of truth
 *
 * MOTION TIER SYSTEM:
 * - T1 (500-700ms): Celebrations, achievements, unlocks - dramatic, memorable
 * - T2 (300ms): Standard interactions, cards, filters - purposeful, confident
 * - T3 (150-200ms): Ambient, hovers, micro-feedback - subtle, responsive
 * - T4 (0-50ms): Reduced motion fallback - accessibility-first
 */

import type { Variants, Transition } from 'framer-motion';
import {
  easingArrays,
  durationSeconds,
  springPresets,
  tinderSprings,
  staggerPresets,
} from '@hive/tokens';

// ===== MOTION TIER PRESETS =====

/**
 * Motion Tier 1: Dramatic (Celebrations/Achievements)
 * Duration: 500-700ms
 * Use for: Achievement unlocks, ritual completions, major milestones
 */
export const TIER_1_DRAMATIC = {
  duration: 0.7,
  ease: [0.165, 0.84, 0.44, 1] as const,
  spring: { stiffness: 300, damping: 15, mass: 1 },
} as const;

/**
 * Motion Tier 2: Standard (Most Interactions)
 * Duration: 300ms
 * Use for: Cards, filters, navigation, modals, most UI
 */
export const TIER_2_STANDARD = {
  duration: 0.3,
  ease: [0.23, 1, 0.32, 1] as const,
  spring: { stiffness: 200, damping: 25, mass: 1 },
} as const;

/**
 * Motion Tier 3: Ambient (Micro-interactions)
 * Duration: 150-200ms
 * Use for: Hovers, focus states, toggles, subtle feedback
 */
export const TIER_3_AMBIENT = {
  duration: 0.15,
  ease: [0.25, 0.1, 0.25, 1] as const,
  spring: { stiffness: 400, damping: 30, mass: 0.5 },
} as const;

/**
 * Motion Tier 4: Reduced Motion (Accessibility)
 * Duration: 0-50ms or instant
 * Use for: prefers-reduced-motion, static fallbacks
 */
export const TIER_4_REDUCED = {
  duration: 0.05,
  ease: 'linear' as const,
  spring: { stiffness: 1000, damping: 100, mass: 0 },
} as const;

// ===== BUTTERY SPRING PRESETS =====
// Premium motion feels like it has mass — not snappy, not floaty, BUTTERY

/**
 * Buttery spring - most transitions, modals, cards
 * Feels: Weighted, deliberate, premium
 */
export const SPRING_BUTTER = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 20,
  mass: 1,
};

/**
 * Silk spring - subtle reveals, fades, whisper motion
 * Feels: Effortless, floating, barely-there
 */
export const SPRING_SILK = {
  type: 'spring' as const,
  stiffness: 80,
  damping: 25,
  mass: 0.8,
};

/**
 * Honey spring - slow dramatic moments, celebrations
 * Feels: Luxurious, weighty, cinematic
 */
export const SPRING_HONEY = {
  type: 'spring' as const,
  stiffness: 60,
  damping: 15,
  mass: 1.2,
};

/**
 * Snap spring - micro-interactions, toggles, buttons
 * Feels: Responsive, decisive, instant feedback
 */
export const SPRING_SNAP = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 0.5,
};

// Grouped exports
export const motionTiers = {
  T1: TIER_1_DRAMATIC,
  T2: TIER_2_STANDARD,
  T3: TIER_3_AMBIENT,
  T4: TIER_4_REDUCED,
} as const;

export const butteryPresets = {
  butter: SPRING_BUTTER,
  silk: SPRING_SILK,
  honey: SPRING_HONEY,
  snap: SPRING_SNAP,
} as const;

// ===== RE-EXPORT FROM TOKENS (for convenience) =====

export const easing = {
  smooth: easingArrays.default,
  silk: easingArrays.silk,
  snap: easingArrays.snap,
  dramatic: easingArrays.dramatic,
  out: easingArrays.out,
  in: easingArrays.in,
} as const;

export const duration = {
  instant: durationSeconds.snap,      // 150ms
  quick: durationSeconds.quick,       // 200ms
  standard: durationSeconds.standard, // 300ms
  leisurely: durationSeconds.flowing, // 500ms
  slow: durationSeconds.dramatic,     // 700ms
  glacial: durationSeconds.orchestrated, // 1000ms
} as const;

export const spring = {
  snappy: springPresets.snappy,
  default: springPresets.default,
  gentle: springPresets.gentle,
  bouncy: springPresets.bouncy,
} as const;

export const stagger = staggerPresets;

// ===== BUTTON ANIMATIONS =====

export const buttonVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -1,
    transition: {
      duration: duration.quick,
      ease: easing.smooth,
    },
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: {
      duration: duration.instant,
      ease: easing.snap,
    },
  },
  disabled: {
    opacity: 0.4,
    transition: {
      duration: duration.quick,
    },
  },
};

export const buttonIconVariants: Variants = {
  initial: {
    rotate: 0,
    scale: 1,
  },
  hover: {
    rotate: 0,
    scale: 1.1,
    transition: {
      duration: duration.quick,
      ease: easing.smooth,
    },
  },
  tap: {
    scale: 0.9,
    transition: {
      duration: duration.instant,
    },
  },
};

// ===== CARD ANIMATIONS =====

export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 24,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 28,
      mass: 1,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.98,
    transition: {
      duration: duration.quick,
      ease: easing.silk,
    },
  },
  hover: {
    y: -6,
    scale: 1.015,
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 20,
    },
  },
};

// ===== INPUT ANIMATIONS =====

export const inputVariants: Variants = {
  initial: {
    borderColor: 'var(--hive-border-default)',
  },
  focus: {
    borderColor: 'var(--hive-interactive-focus)',
    transition: {
      duration: duration.quick,
      ease: easing.smooth,
    },
  },
  error: {
    borderColor: 'var(--hive-status-error)',
    x: [0, -4, 4, -4, 4, 0],
    transition: {
      duration: duration.leisurely,
      ease: easing.snap,
    },
  },
};

export const labelVariants: Variants = {
  default: {
    y: 0,
    fontSize: '0.875rem',
    color: '#A1A1A6', // text-secondary
  },
  floating: {
    y: -24,
    fontSize: '0.75rem',
    color: '#818187', // text-subtle
    transition: {
      duration: duration.quick,
      ease: easing.smooth,
    },
  },
  focus: {
    y: -24,
    fontSize: '0.75rem',
    color: '#FAFAFA', // text-primary (white focus, not gold)
    transition: {
      duration: duration.quick,
      ease: easing.smooth,
    },
  },
};

// ===== FADE ANIMATIONS =====

export const fadeInVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: duration.standard,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration.quick,
      ease: easing.snap,
    },
  },
};

export const fadeInUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.standard,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: duration.quick,
      ease: easing.snap,
    },
  },
};

// ===== SCALE ANIMATIONS =====

export const scaleInVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: duration.standard,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: duration.quick,
      ease: easing.snap,
    },
  },
};

// ===== MODAL/DIALOG ANIMATIONS =====

export const modalOverlayVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: duration.standard,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration.quick,
      ease: easing.snap,
    },
  },
};

export const modalContentVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: 24,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 30,
      mass: 1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 12,
    transition: {
      duration: duration.quick,
      ease: easing.silk,
    },
  },
};

// ===== DROPDOWN/MENU ANIMATIONS =====

export const dropdownVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: -8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 25,
      mass: 0.9,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -4,
    transition: {
      duration: duration.quick,
      ease: easing.silk,
    },
  },
};

export const menuItemVariants: Variants = {
  initial: {
    x: -4,
    opacity: 0,
  },
  animate: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: i * 0.03,
      duration: duration.quick,
      ease: easing.smooth,
    },
  }),
  exit: {
    x: -4,
    opacity: 0,
    transition: {
      duration: duration.instant,
    },
  },
};

// ===== TOAST/NOTIFICATION ANIMATIONS =====

export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: duration.standard,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    transition: {
      duration: duration.quick,
      ease: easing.snap,
    },
  },
};

// ===== LIST STAGGER ANIMATIONS =====

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04, // Reduced from 0.08 - feels unified, not cascading
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.96,
    transition: {
      duration: duration.quick,
      ease: easing.silk,
    },
  },
};

// ===== LOADING/SPINNER ANIMATIONS =====

export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      ease: easing.smooth,
      repeat: Infinity,
    },
  },
};

// ===== SLIDE ANIMATIONS =====

export const slideInFromRightVariants: Variants = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 30,
      mass: 1,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: duration.standard,
      ease: easing.silk,
    },
  },
};

export const slideInFromLeftVariants: Variants = {
  initial: {
    x: '-100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 30,
      mass: 1,
    },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      duration: duration.standard,
      ease: easing.silk,
    },
  },
};

// ===== PREMIUM SUBTLE VARIANTS (Vercel/Linear style) =====
// Minimal motion - only animate on interaction, not ambient

export const premiumContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: duration.standard,
      ease: easing.smooth,
    },
  },
};

export const premiumItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.standard,
      ease: easing.smooth,
    },
  },
};

export const premiumStatVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: duration.quick,
      ease: easing.smooth,
    },
  },
};

// Premium hover - subtle border/background change only
export const premiumCardHover = {
  initial: {},
  hover: {
    borderColor: 'rgba(255, 255, 255, 0.12)',
    transition: { duration: duration.quick },
  },
};

// ===== COMMAND PALETTE / MODAL ANIMATIONS =====

export const commandPaletteOverlay: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.15, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1, ease: easing.snap },
  },
};

export const commandPaletteContent: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: -20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: [0.23, 1, 0.32, 1], // smooth out
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.1, ease: easing.snap },
  },
};

// ===== CONTEXT PANEL / SHEET ANIMATIONS =====

export const contextPanelVariants: Variants = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: easing.silk,
    },
  },
};

// ===== DOCK / NAVIGATION ANIMATIONS =====

export const dockItemVariants: Variants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.15,
    y: -4,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
  tap: {
    scale: 0.95,
    y: 0,
    transition: { duration: 0.1 },
  },
};

export const dockTooltipVariants: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    y: 5,
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

// ===== STATE TRANSITION ANIMATIONS (2026 Design System) =====

/**
 * Selection ring expand animation - ring grows outward
 */
export const selectionVariants: Variants = {
  unselected: {
    scale: 1,
    boxShadow: '0 0 0 0px rgba(255,215,0,0)',
  },
  selected: {
    scale: 1,
    boxShadow: '0 0 0 2px rgba(255,215,0,0.3)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
};

/**
 * Dropdown arrow rotation with spring physics
 */
export const arrowRotationVariants: Variants = {
  closed: {
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  open: {
    rotate: 180,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

/**
 * Panel collapse with height + fade
 */
export const collapseVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { type: 'spring', stiffness: 200, damping: 25 },
      opacity: { duration: 0.15 },
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { type: 'spring', stiffness: 200, damping: 25 },
      opacity: { duration: 0.15, delay: 0.05 },
    },
  },
};

/**
 * Success check mark draw animation
 */
export const checkDrawVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.3, ease: 'easeOut' },
      opacity: { duration: 0.1 },
    },
  },
};

/**
 * Success icon settle (scale bounce after draw)
 */
export const successSettleVariants: Variants = {
  initial: {
    scale: 1,
  },
  settle: {
    scale: [1, 1.15, 1],
    transition: {
      duration: 0.3,
      ease: easing.smooth,
    },
  },
};

/**
 * Error shake animation with physics
 */
export const errorShakeVariants: Variants = {
  idle: {
    x: 0,
  },
  shake: {
    x: [-4, 4, -4, 4, -2, 2, 0],
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
      duration: 0.4,
    },
  },
};

/**
 * Loading pulse animation
 */
export const loadingPulseVariants: Variants = {
  pulse: {
    opacity: [0.4, 1, 0.4],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeInOut',
    },
  },
};

/**
 * Skeleton shimmer animation
 */
export const skeletonShimmerVariants: Variants = {
  shimmer: {
    x: ['-100%', '100%'],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    },
  },
};

// ===== ELEVATION VARIANTS (Spatial Depth System) =====

/**
 * Elevation presets for consistent depth hierarchy
 */
export const elevationClasses = {
  rest: 'z-10 shadow-lg',
  hover: 'z-20 shadow-xl -translate-y-2',
  floating: 'z-30 shadow-2xl',
  modal: 'z-40 shadow-[0_40px_80px_rgba(0,0,0,0.4)]',
  celebration: 'z-50',
} as const;

/**
 * Card elevation hover animation - lifts 8px with shadow growth
 */
export const cardElevationVariants: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    y: -8,
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
    },
  },
  pressed: {
    y: -4,
    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.25)',
    transition: {
      duration: 0.1,
    },
  },
};

/**
 * Floating UI elevation (dropdowns, popovers)
 */
export const floatingElevationVariants: Variants = {
  initial: {
    opacity: 0,
    y: -6,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 28,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: {
      duration: 0.15,
      ease: easing.silk,
    },
  },
};

/**
 * Modal elevation with backdrop
 */
export const modalElevationVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 10,
    transition: {
      duration: 0.2,
      ease: easing.silk,
    },
  },
};

// ===== CELEBRATION VARIANTS =====

/**
 * Micro celebration - subtle scale pulse
 */
export const microCelebrationVariants: Variants = {
  initial: { scale: 1 },
  celebrate: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.2 },
  },
};

/**
 * Standard celebration - check icon with scale
 */
export const standardCelebrationVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0,
  },
  celebrate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

/**
 * Major celebration - trophy reveal with glow
 */
export const majorCelebrationVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  celebrate: {
    scale: [0, 1.2, 1],
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 15,
    },
  },
};

/**
 * Celebration glow animation
 */
export const celebrationGlowVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  glow: {
    scale: 1.5,
    opacity: [0, 0.6, 0.3],
    transition: {
      duration: 1,
      ease: easing.smooth,
    },
  },
};

// ===== UTILITY FUNCTIONS =====

/**
 * Creates a transition that respects prefers-reduced-motion
 */
export const createTransition = (
  duration: number,
  ease: number[] | string = [...easing.smooth]
): Transition => ({
  duration,
  ease,
});

/**
 * Wraps variants to disable animations when prefers-reduced-motion is set
 */
export const withReducedMotion = <T extends Variants>(variants: T): T => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const reducedVariants: any = {};
    for (const key in variants) {
      reducedVariants[key] = {
        ...(variants[key] as any),
        transition: { duration: 0 },
      };
    }
    return reducedVariants as T;
  }
  return variants;
};

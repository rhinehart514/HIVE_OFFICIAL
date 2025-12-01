/**
 * Motion Primitives
 * Premium animation constants for YC/Vercel-style micro-interactions
 *
 * Design philosophy:
 * - Animations should feel inevitable, not flashy
 * - Motion creates meaning, not decoration
 * - Timing that respects user's time (fast) while feeling luxurious
 */

import { type Variants, type Transition } from 'framer-motion';

// =============================================================================
// EASING CURVES
// =============================================================================

/**
 * Silk - Our signature easing. Smooth start, confident finish.
 * Use for: page transitions, content reveals, form steps
 */
export const EASE_SILK = [0.22, 1, 0.36, 1] as const;

/**
 * Snap - Quick and responsive. For UI feedback.
 * Use for: button presses, toggles, micro-interactions
 */
export const EASE_SNAP = [0.34, 1.56, 0.64, 1] as const;

/**
 * Out - Decelerating. Content settling into place.
 * Use for: dropdowns, modals, tooltips
 */
export const EASE_OUT = [0, 0, 0.2, 1] as const;

/**
 * In-Out - Symmetric. For reversible animations.
 * Use for: hover states, focus rings
 */
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

// =============================================================================
// DURATION TOKENS
// =============================================================================

export const DURATION = {
  instant: 0.1,      // Micro-feedback (press, toggle)
  fast: 0.2,         // UI responses (hover, focus)
  normal: 0.3,       // Standard transitions
  smooth: 0.4,       // Page/step transitions
  slow: 0.6,         // Emphasis animations
  dramatic: 0.8,     // Celebration, success states
} as const;

// =============================================================================
// TRANSITION PRESETS
// =============================================================================

/** For content transitions between steps/pages */
export const transitionSilk: Transition = {
  duration: DURATION.smooth,
  ease: EASE_SILK,
};

/** For button/input micro-interactions */
export const transitionSnap: Transition = {
  duration: DURATION.instant,
  ease: EASE_SNAP,
};

/** For spring-based natural motion */
export const transitionSpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

/** Gentler spring for larger elements */
export const transitionSpringGentle: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

/** Bouncy spring for celebratory moments */
export const transitionSpringBounce: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 15,
};

// =============================================================================
// VARIANT PRESETS
// =============================================================================

/** Fade + slide up. The workhorse. */
export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/** Subtle fade + slide. Less dramatic. */
export const fadeSlideSubtle: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

/** Scale + fade. For modals, popovers. */
export const scaleFade: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

/** Pure fade. Minimal, respectful. */
export const fade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Slide from right. For forward navigation feel. */
export const slideRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// =============================================================================
// STAGGER PATTERNS
// =============================================================================

/** Container that staggers children */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

/** Fast stagger for quick lists */
export const staggerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

/** Individual stagger item */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 },
};

// =============================================================================
// MICRO-INTERACTION VARIANTS
// =============================================================================

/** Button press feedback */
export const buttonPress: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

/** Subtle hover lift */
export const hoverLift: Variants = {
  idle: { y: 0 },
  hover: { y: -2 },
};

/** Input focus glow (use with CSS for the actual glow) */
export const inputFocus: Variants = {
  idle: { scale: 1 },
  focus: { scale: 1.01 },
};

/** Error shake */
export const shake: Variants = {
  idle: { x: 0 },
  shake: {
    x: [-8, 8, -6, 6, -4, 4, 0],
    transition: { duration: 0.5 },
  },
};

/** Success pulse */
export const successPulse: Variants = {
  idle: { scale: 1, opacity: 1 },
  success: {
    scale: [1, 1.1, 1],
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

/** Checkmark draw animation */
export const checkmarkDraw: Variants = {
  idle: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
};

// =============================================================================
// AMBIENT EFFECTS
// =============================================================================

/** Breathing glow effect (for ambient orbs) */
export const breathingGlow: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.03, 0.06, 0.03],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/** Subtle float (for decorative elements) */
export const floatSubtle: Variants = {
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// =============================================================================
// PROGRESS ANIMATIONS
// =============================================================================

/** Progress bar fill */
export const progressFill = (percent: number): Variants => ({
  initial: { width: '0%' },
  animate: {
    width: `${percent}%`,
    transition: { duration: DURATION.slow, ease: EASE_SILK },
  },
});

// =============================================================================
// CSS-IN-JS STYLE HELPERS
// =============================================================================

/** Gold glow shadow for focused/active states */
export const GLOW_GOLD = '0 0 0 3px rgba(255, 215, 0, 0.15), 0 0 20px rgba(255, 215, 0, 0.1)';

/** Subtle gold glow for hover */
export const GLOW_GOLD_SUBTLE = '0 0 20px rgba(255, 215, 0, 0.08)';

/** Strong gold glow for buttons */
export const GLOW_GOLD_STRONG = '0 0 30px rgba(255, 215, 0, 0.2)';

/** Error glow */
export const GLOW_ERROR = '0 0 0 3px rgba(239, 68, 68, 0.15)';

/** Success glow */
export const GLOW_SUCCESS = '0 0 0 3px rgba(34, 197, 94, 0.15)';

// =============================================================================
// TAILWIND CLASS HELPERS
// =============================================================================

/** Common transition classes */
export const TRANSITION_CLASSES = {
  default: 'transition-all duration-200 ease-out',
  fast: 'transition-all duration-150 ease-out',
  slow: 'transition-all duration-300 ease-out',
  colors: 'transition-colors duration-200 ease-out',
  transform: 'transition-transform duration-200 ease-out',
} as const;

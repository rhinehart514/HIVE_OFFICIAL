/**
 * Section Motion System for Evolving Entry Flow
 *
 * Motion variants for inline section transitions where sections
 * appear, lock to chips, and collapse rather than page-swap.
 */

import { type Variants, type Transition } from 'framer-motion';
import { EASE_PREMIUM, EASE_OUT, DURATION, SPRING_SNAPPY, SPRING_GENTLE } from './entry-motion';

// ============================================
// SECTION ENTER/EXIT VARIANTS
// ============================================

/** Section appears from below with height expansion */
export const sectionEnterVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    height: 0,
    overflow: 'hidden',
  },
  animate: {
    opacity: 1,
    y: 0,
    height: 'auto',
    overflow: 'visible',
    transition: {
      opacity: { duration: DURATION.gentle, ease: EASE_PREMIUM },
      y: { duration: DURATION.gentle, ease: EASE_PREMIUM },
      height: { duration: DURATION.smooth, ease: EASE_PREMIUM },
      overflow: { delay: DURATION.gentle },
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: DURATION.quick,
      ease: EASE_OUT,
    },
  },
};

/** Section child element stagger variants */
export const sectionChildVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.smooth,
      ease: EASE_PREMIUM,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: DURATION.fast,
    },
  },
};

// ============================================
// FIELD LOCK VARIANTS (Input → Chip)
// ============================================

/** Full input field state */
export const fieldInputVariants: Variants = {
  expanded: {
    height: 56,
    opacity: 1,
  },
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: DURATION.smooth, ease: EASE_PREMIUM },
      opacity: { duration: DURATION.fast },
    },
  },
};

/** Locked chip state */
export const fieldChipVariants: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    height: 40,
    opacity: 1,
    scale: 1,
    transition: {
      height: SPRING_SNAPPY,
      opacity: { duration: DURATION.quick },
      scale: SPRING_SNAPPY,
    },
  },
};

/** Combined field lock transition */
export const fieldLockVariants: Variants = {
  input: {
    height: 56,
    transition: SPRING_GENTLE,
  },
  chip: {
    height: 40,
    transition: SPRING_SNAPPY,
  },
};

// ============================================
// SECTION COLLAPSE VARIANTS
// ============================================

/** Section collapsing to a summary chip */
export const sectionCollapseVariants: Variants = {
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: DURATION.smooth, ease: EASE_PREMIUM },
      opacity: { duration: DURATION.smooth },
    },
  },
  collapsed: {
    height: 40,
    opacity: 1,
    transition: {
      height: SPRING_SNAPPY,
      opacity: { duration: DURATION.quick },
    },
  },
};

// ============================================
// CHIP TRANSITIONS
// ============================================

/** Checkmark appear in chip */
export const chipCheckVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25,
      delay: 0.1,
    },
  },
};

/** Chip content fade transition */
export const chipContentVariants: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATION.quick,
      ease: EASE_PREMIUM,
    },
  },
  exit: {
    opacity: 0,
    x: 8,
    transition: {
      duration: DURATION.fast,
    },
  },
};

// ============================================
// SECTION-SPECIFIC TRANSITIONS
// ============================================

/** School badge reveal */
export const schoolBadgeVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0,
    x: -12,
  },
  animate: {
    scale: 1,
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
};

/** Role chip reveal */
export const roleChipVariants: Variants = {
  initial: {
    scale: 0.9,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: SPRING_SNAPPY,
  },
};

// ============================================
// ERROR SHAKE ANIMATION
// ============================================

/** Inline error shake */
export const shakeVariants: Variants = {
  shake: {
    x: [0, -8, 8, -6, 6, -4, 4, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
  idle: {
    x: 0,
  },
};

/** Error message inline reveal */
export const errorInlineVariants: Variants = {
  initial: {
    opacity: 0,
    height: 0,
    y: -4,
  },
  animate: {
    opacity: 1,
    height: 'auto',
    y: 0,
    transition: {
      height: { duration: DURATION.quick },
      opacity: { duration: DURATION.quick, delay: 0.05 },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: DURATION.fast,
    },
  },
};

// ============================================
// ARRIVAL SECTION
// ============================================

/** Arrival content reveal with scale */
export const arrivalRevealVariants: Variants = {
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
      duration: DURATION.dramatic,
      ease: EASE_PREMIUM,
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

/** Arrival glow pulse */
export const arrivalGlowVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
  },
  animate: {
    opacity: [0, 0.6, 0.3],
    scale: [0.8, 1.2, 1],
    transition: {
      duration: 1.5,
      ease: 'easeOut',
    },
  },
};

// ============================================
// HELPERS
// ============================================

/** Create section transition with custom duration */
export const createSectionTransition = (duration = DURATION.gentle): Transition => ({
  duration,
  ease: EASE_PREMIUM,
});

/** Create stagger delay for section children */
export const sectionStagger = (index: number, baseDelay = 0.06): number =>
  index * baseDelay;

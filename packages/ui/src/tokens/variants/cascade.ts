/**
 * CASCADE Pattern
 *
 * List item stagger animations.
 * Stagger: 40ms between items
 *
 * Use for:
 * - List reveals
 * - Grid animations
 * - Message streams
 * - Navigation items
 */

import type { Variants, Transition } from 'framer-motion';

const STAGGER = 0.04; // 40ms
const STAGGER_FAST = 0.03; // 30ms
const STAGGER_SLOW = 0.06; // 60ms
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Container variants for staggered children
 */
export const cascadeContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER,
      delayChildren: 0,
    },
  },
};

export const cascadeContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER_FAST,
      delayChildren: 0,
    },
  },
};

export const cascadeContainerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER_SLOW,
      delayChildren: 0.1,
    },
  },
};

/**
 * Fade up item - standard list item
 */
export const cascadeItem: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: EASE,
    },
  },
};

/**
 * Fade item - simple opacity
 */
export const cascadeItemFade: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: EASE,
    },
  },
};

/**
 * Scale item - grid cards
 */
export const cascadeItemScale: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: EASE,
    },
  },
};

/**
 * Slide item - horizontal lists
 */
export const cascadeItemSlide: Variants = {
  hidden: {
    opacity: 0,
    x: -16,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: EASE,
    },
  },
};

/**
 * Message item - chat messages
 */
export const cascadeMessage: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: EASE,
    },
  },
};

/**
 * Exit animation for items
 */
export const cascadeExit: Variants = {
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Reduced motion fallback
 */
export const cascadeReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.1 } },
};

// Export pattern constants for documentation
export const CASCADE = {
  stagger: STAGGER,
  staggerFast: STAGGER_FAST,
  staggerSlow: STAGGER_SLOW,
  ease: EASE,
} as const;

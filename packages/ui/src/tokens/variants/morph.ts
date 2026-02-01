/**
 * MORPH Pattern
 *
 * Inline state transforms.
 * Motion: Spring-based for smooth transitions
 *
 * Use for:
 * - Icon state changes (hamburger -> X)
 * - Button state transforms
 * - Toggle animations
 * - In-place content swaps
 */

import type { Variants, Transition } from 'framer-motion';

const SPRING = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
};

export const morphTransition: Transition = SPRING;

/**
 * Icon rotation (hamburger to X)
 */
export const morphRotate: Variants = {
  initial: {
    rotate: 0,
    transition: SPRING,
  },
  morphed: {
    rotate: 180,
    transition: SPRING,
  },
};

/**
 * Icon rotation 45 degrees (+ to X)
 */
export const morphRotate45: Variants = {
  initial: {
    rotate: 0,
    transition: SPRING,
  },
  morphed: {
    rotate: 45,
    transition: SPRING,
  },
};

/**
 * Scale morph (checkbox check)
 */
export const morphScale: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
    transition: SPRING_SNAPPY,
  },
  morphed: {
    scale: 1,
    opacity: 1,
    transition: SPRING_SNAPPY,
  },
};

/**
 * Crossfade morph (swap content)
 */
export const morphCrossfade: Variants = {
  initial: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

/**
 * Height morph (collapsible content)
 */
export const morphHeight: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: SPRING,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: SPRING,
  },
};

/**
 * Width morph (expanding input)
 */
export const morphWidth: Variants = {
  collapsed: {
    width: 0,
    opacity: 0,
    transition: SPRING,
  },
  expanded: {
    width: 'auto',
    opacity: 1,
    transition: SPRING,
  },
};

/**
 * Check path draw animation
 */
export const morphCheckPath = {
  initial: { pathLength: 0 },
  checked: {
    pathLength: 1,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Reduced motion fallback
 */
export const morphReduced: Variants = {
  initial: { opacity: 0 },
  morphed: { opacity: 1, transition: { duration: 0.1 } },
};

// Export pattern constants for documentation
export const MORPH = {
  spring: SPRING,
  springSnappy: SPRING_SNAPPY,
} as const;

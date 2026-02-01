/**
 * REVEAL Pattern
 *
 * Page entrances, major surfaces.
 * Duration: 800ms (slow, ceremonial)
 * Easing: Premium [0.22, 1, 0.36, 1]
 *
 * Use for:
 * - Page transitions
 * - Section reveals on scroll
 * - Major content areas appearing
 */

import type { Variants, Transition } from 'framer-motion';

const DURATION = 0.8;
const EASE = [0.22, 1, 0.36, 1] as const;

export const revealTransition: Transition = {
  duration: DURATION,
  ease: EASE,
};

/**
 * Fade up reveal - content fades in while moving up
 */
export const revealFadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: revealTransition,
  },
};

/**
 * Fade in reveal - simple opacity transition
 */
export const revealFade: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: revealTransition,
  },
};

/**
 * Scale reveal - content scales in from 95%
 */
export const revealScale: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: revealTransition,
  },
};

/**
 * Slide reveal - content slides in from direction
 */
export const revealSlideLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -32,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: revealTransition,
  },
};

export const revealSlideRight: Variants = {
  hidden: {
    opacity: 0,
    x: 32,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: revealTransition,
  },
};

/**
 * Container for staggered children reveals
 */
export const revealContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/**
 * Reduced motion fallback
 */
export const revealReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

// Export pattern constants for documentation
export const REVEAL = {
  duration: DURATION,
  ease: EASE,
  stagger: 0.08,
} as const;

/**
 * Motion presets for consistent animations across HIVE.
 * Based on YC/SF aesthetic - subtle, refined, purposeful.
 *
 * IMPORTANT: Re-exports from @hive/tokens for single source of truth
 */

import {
  easingArrays,
  durationSeconds,
  springPresets,
  staggerPresets,
} from '@hive/tokens';

// Re-export easing arrays
export const easing = easingArrays;

// Re-export durations
export const duration = durationSeconds;

// Transition presets
export const transition = {
  /** Default transition for most elements */
  default: {
    duration: durationSeconds.standard,
    ease: easingArrays.default,
  },

  /** Quick snap for toggles and buttons */
  snap: {
    duration: durationSeconds.snap,
    ease: easingArrays.snap,
  },

  /** Smooth for larger movements */
  smooth: {
    duration: durationSeconds.smooth,
    ease: easingArrays.silk,
  },

  /** Spring for bouncy interactions */
  spring: springPresets.snappy,

  /** Gentle spring for subtle bounce */
  gentleSpring: springPresets.gentle,

  /** Dramatic for achievements */
  dramatic: {
    duration: durationSeconds.dramatic,
    ease: easingArrays.dramatic,
  },
}

// Animation variants
export const variants = {
  /** Fade in/out */
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  /** Slide up and fade */
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },

  /** Slide down and fade */
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  /** Scale in and fade */
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  /** Pop in (for badges, toasts) */
  pop: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },

  /** Slide from left */
  slideLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },

  /** Slide from right */
  slideRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
}

// Hover and tap presets
export const gestures = {
  /** Button hover - lift and scale */
  button: {
    whileHover: {
      y: -2,
      transition: { duration: durationSeconds.quick, ease: easingArrays.default },
    },
    whileTap: {
      scale: 0.98,
      transition: { duration: durationSeconds.instant },
    },
  },

  /** Card hover - lift effect */
  card: {
    whileHover: {
      y: -4,
      transition: { duration: durationSeconds.standard, ease: easingArrays.default },
    },
  },

  /** Subtle scale on hover */
  scale: {
    whileHover: {
      scale: 1.02,
      transition: { duration: durationSeconds.quick },
    },
    whileTap: {
      scale: 0.98,
    },
  },

  /** No motion (for accessibility) */
  none: {
    whileHover: {},
    whileTap: {},
  },
}

// Stagger configurations (re-export from tokens)
export const stagger = {
  /** Fast stagger for lists */
  fast: {
    staggerChildren: staggerPresets.fast,
  },

  /** Default stagger */
  default: {
    staggerChildren: staggerPresets.default,
  },

  /** Slow stagger for dramatic reveals */
  slow: {
    staggerChildren: staggerPresets.slow,
  },
}

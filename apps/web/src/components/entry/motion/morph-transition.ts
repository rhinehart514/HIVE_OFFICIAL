/**
 * Morph Transition System for Entry Flow
 *
 * Shared layout animations for section → chip morphing transitions.
 * Provides smooth collapse/expand animations when sections lock.
 */

import { type Variants } from 'framer-motion';
import { EASE_PREMIUM, DURATION } from './constants';

// ============================================
// SECTION MORPH VARIANTS
// ============================================

/**
 * Section morph variants for collapsing active section to locked chip.
 * Use with layout animation for smooth morphing effect.
 */
export const sectionMorphVariants: Variants = {
  expanded: {
    height: 'auto',
    opacity: 1,
    scale: 1,
    transition: {
      height: { duration: DURATION.smooth, ease: EASE_PREMIUM },
      opacity: { duration: DURATION.quick },
      scale: { duration: DURATION.quick },
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  collapsed: {
    height: 48, // Chip height
    opacity: 1,
    scale: 1,
    transition: {
      height: { duration: DURATION.smooth, ease: EASE_PREMIUM },
      when: 'afterChildren',
    },
  },
};

// ============================================
// CONTENT FADE VARIANTS
// ============================================

/**
 * Content fade for section inner content during morph.
 * Fades out content before collapse, fades in after expand.
 */
export const contentFadeVariants: Variants = {
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.quick,
      ease: EASE_PREMIUM,
    },
  },
  hidden: {
    opacity: 0,
    y: -8,
    transition: {
      duration: DURATION.fast,
      ease: EASE_PREMIUM,
    },
  },
};

// ============================================
// CHIP MORPH VARIANTS
// ============================================

/**
 * Chip entrance when section collapses.
 * Morphs from section container to compact chip.
 */
export const chipMorphVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -4,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: DURATION.quick,
      ease: EASE_PREMIUM,
      delay: 0.1, // Wait for content to fade
    },
  },
};

// ============================================
// STAGGER CONTAINER
// ============================================

/**
 * Container for staggered children animations during morph.
 */
export const morphContainerVariants: Variants = {
  expanded: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  collapsed: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

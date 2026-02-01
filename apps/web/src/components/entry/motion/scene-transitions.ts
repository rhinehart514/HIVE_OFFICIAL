/**
 * Scene Transitions - Morphs Within Acts
 *
 * Scenes are individual steps within an act.
 * Between scenes: smooth morph transition (no cinematic cut)
 *
 * Duration: 0.6s
 * Stagger: 0.12s between elements
 * Transform: scale 0.97→1, y 24px→0, blur 4px→0
 */

import { type Variants, type Transition } from 'framer-motion';
import { EASE_PREMIUM, DURATION } from './entry-motion';

// ============================================
// TIMING CONSTANTS
// ============================================

export const SCENE_TRANSITION = {
  duration: 0.6,
  stagger: 0.12,
  delayChildren: 0.1,
} as const;

// ============================================
// SCENE MORPH VARIANTS
// ============================================

/** Scene container morph - the main transition */
export const sceneMorphVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.97,
    y: 24,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: SCENE_TRANSITION.duration,
      ease: EASE_PREMIUM,
      staggerChildren: SCENE_TRANSITION.stagger,
      delayChildren: SCENE_TRANSITION.delayChildren,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -12,
    filter: 'blur(2px)',
    transition: {
      duration: SCENE_TRANSITION.duration * 0.6,
      ease: EASE_PREMIUM,
    },
  },
};

/** Scene child element stagger */
export const sceneChildVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.gentle,
      ease: EASE_PREMIUM,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: EASE_PREMIUM,
    },
  },
};

// ============================================
// HEADLINE VARIANTS (Dramatic reveal)
// ============================================

/** Main headline reveal - the dramatic moment */
export const headlineVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.98,
    filter: 'blur(6px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: DURATION.dramatic,
      ease: EASE_PREMIUM,
    },
  },
};

/** Subtext/manifesto reveal - delayed, softer */
export const subtextVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.slow,
      delay: 0.3,
      ease: EASE_PREMIUM,
    },
  },
};

// ============================================
// INPUT FIELD VARIANTS
// ============================================

/** Input container reveal */
export const inputContainerVariants: Variants = {
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
      duration: DURATION.gentle,
      ease: EASE_PREMIUM,
    },
  },
};

/** Input focus glow animation */
export const inputFocusVariants: Variants = {
  idle: {
    boxShadow: '0 0 0 0px rgba(255, 215, 0, 0)',
  },
  focused: {
    boxShadow: '0 0 0 2px rgba(255, 215, 0, 0.15)',
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

// ============================================
// CTA BUTTON VARIANTS
// ============================================

/** CTA button reveal */
export const ctaVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.gentle,
      ease: EASE_PREMIUM,
    },
  },
};

/** CTA pulse for emphasis */
export const ctaPulseVariants: Variants = {
  idle: {},
  pulse: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ============================================
// VALIDATION FEEDBACK
// ============================================

/** Success checkmark appear */
export const validationSuccessVariants: Variants = {
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
    },
  },
};

/** Error shake */
export const validationErrorVariants: Variants = {
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

/** Inline error message */
export const errorMessageVariants: Variants = {
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
      height: { duration: 0.2 },
      opacity: { duration: 0.2, delay: 0.05 },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.15,
    },
  },
};

// ============================================
// TRANSITIONS
// ============================================

export const sceneTransition: Transition = {
  duration: SCENE_TRANSITION.duration,
  ease: EASE_PREMIUM,
};

export const sceneStaggerTransition: Transition = {
  staggerChildren: SCENE_TRANSITION.stagger,
  delayChildren: SCENE_TRANSITION.delayChildren,
};

// ============================================
// HELPERS
// ============================================

/** Create scene child delay based on index */
export function sceneStaggerDelay(index: number): number {
  return SCENE_TRANSITION.delayChildren + index * SCENE_TRANSITION.stagger;
}

/** Get scene transition props for AnimatePresence */
export function getSceneTransitionProps() {
  return {
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    variants: sceneMorphVariants,
  };
}

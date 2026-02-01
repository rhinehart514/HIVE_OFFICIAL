/**
 * Act Transitions - Cinematic Cuts Between Acts
 *
 * The Threshold narrative has 3 acts:
 * - Act I: The Invitation (school → email → code)
 * - Act II: The Claiming (role → name → handle → field)
 * - Act III: The Crossing (interests → arrival)
 *
 * Between acts: cinematic cut with gold line draw
 * Total: 1.4s (fadeOut 0.5s → line draw 0.4s → pause 0.1s → fadeIn 0.4s)
 */

import { type Variants, type Transition } from 'framer-motion';
import { EASE_PREMIUM, DURATION, GOLD } from './entry-motion';

// ============================================
// TIMING CONSTANTS
// ============================================

export const ACT_TRANSITION = {
  fadeOut: 0.5,
  lineDraw: 0.4,
  pause: 0.1,
  fadeIn: 0.4,
  total: 1.4,
} as const;

// ============================================
// ACT FADE VARIANTS
// ============================================

/** Act content fade out before transition */
export const actFadeOutVariants: Variants = {
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
  },
  hidden: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(4px)',
    transition: {
      duration: ACT_TRANSITION.fadeOut,
      ease: EASE_PREMIUM,
    },
  },
};

/** Act content fade in after transition */
export const actFadeInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 24,
    filter: 'blur(6px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: ACT_TRANSITION.fadeIn,
      ease: EASE_PREMIUM,
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

// ============================================
// GOLD LINE DRAW (Between Acts)
// ============================================

/** The gold line that draws during act transitions */
export const goldLineVariants: Variants = {
  initial: {
    scaleX: 0,
    opacity: 0,
  },
  draw: {
    scaleX: 1,
    opacity: 1,
    transition: {
      scaleX: {
        duration: ACT_TRANSITION.lineDraw,
        ease: EASE_PREMIUM,
      },
      opacity: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
  },
  complete: {
    scaleX: 1,
    opacity: 0,
    transition: {
      opacity: {
        duration: 0.3,
        delay: ACT_TRANSITION.pause,
        ease: 'easeOut',
      },
    },
  },
};

/** Gold line glow pulse during draw */
export const goldLineGlowVariants: Variants = {
  initial: {
    opacity: 0,
  },
  pulse: {
    opacity: [0, 0.6, 0],
    transition: {
      duration: ACT_TRANSITION.lineDraw + ACT_TRANSITION.pause,
      ease: 'easeInOut',
    },
  },
};

// ============================================
// ACT CONTAINER VARIANTS
// ============================================

/** Container for act content with layout animation */
export const actContainerVariants: Variants = {
  entering: {
    opacity: 0,
    y: 20,
  },
  active: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASE_PREMIUM,
      staggerChildren: 0.1,
    },
  },
  exiting: {
    opacity: 0,
    y: -10,
    transition: {
      duration: ACT_TRANSITION.fadeOut,
      ease: EASE_PREMIUM,
    },
  },
};

// ============================================
// ACT TRANSITION OVERLAY
// ============================================

/** Full-screen overlay that appears during act transitions */
export const actOverlayVariants: Variants = {
  hidden: {
    opacity: 0,
    pointerEvents: 'none' as const,
  },
  visible: {
    opacity: 1,
    pointerEvents: 'auto' as const,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// ============================================
// TRANSITIONS
// ============================================

export const actTransition: Transition = {
  duration: DURATION.slow,
  ease: EASE_PREMIUM,
};

export const actStaggerTransition: Transition = {
  staggerChildren: 0.12,
  delayChildren: 0.1,
};

// ============================================
// HELPERS
// ============================================

/** Calculate total transition delay for act change */
export function getActTransitionDelay(): number {
  return ACT_TRANSITION.fadeOut + ACT_TRANSITION.lineDraw + ACT_TRANSITION.pause;
}

/** Get the gold line style */
export function getGoldLineStyle() {
  return {
    background: `linear-gradient(90deg, transparent 0%, ${GOLD.primary} 20%, ${GOLD.primary} 80%, transparent 100%)`,
    boxShadow: `0 0 20px ${GOLD.glow}, 0 0 40px ${GOLD.glowSubtle}`,
  };
}

/** Get the act transition timing for CSS */
export function getActTransitionCSS() {
  return {
    '--act-fade-out': `${ACT_TRANSITION.fadeOut}s`,
    '--act-line-draw': `${ACT_TRANSITION.lineDraw}s`,
    '--act-pause': `${ACT_TRANSITION.pause}s`,
    '--act-fade-in': `${ACT_TRANSITION.fadeIn}s`,
    '--act-total': `${ACT_TRANSITION.total}s`,
  } as React.CSSProperties;
}

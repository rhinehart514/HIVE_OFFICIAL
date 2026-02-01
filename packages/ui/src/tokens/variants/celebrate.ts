/**
 * CELEBRATE Pattern
 *
 * Gold moments, achievements, unlocks.
 * Motion: Custom, dramatic, memorable
 *
 * Use for:
 * - Achievement unlocks
 * - First-time completions
 * - Level ups / rank changes
 * - Successful tool deploys
 * - Joining a space
 */

import type { Variants, Transition } from 'framer-motion';

const EASE_DRAMATIC = [0.165, 0.84, 0.44, 1] as const;
const SPRING_BOUNCY = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 15,
};

/**
 * Achievement pop - scale up with bounce
 */
export const celebratePop: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: [0, 1.2, 1],
    opacity: 1,
    transition: {
      scale: SPRING_BOUNCY,
      opacity: { duration: 0.15 },
    },
  },
};

/**
 * Gold glow pulse
 */
export const celebrateGlow: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: [0, 0.8, 0],
    scale: [0.8, 1.5, 2],
    transition: {
      duration: 1,
      ease: EASE_DRAMATIC,
    },
  },
};

/**
 * Checkmark draw
 */
export const celebrateCheck = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.4,
        ease: EASE_DRAMATIC,
      },
      opacity: { duration: 0.1 },
    },
  },
};

/**
 * Confetti burst (container)
 */
export const celebrateConfettiContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.02,
    },
  },
};

/**
 * Confetti particle
 */
export const celebrateConfettiParticle: Variants = {
  hidden: {
    y: 0,
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
  },
  visible: {
    y: [0, -100, 200],
    x: [0, (Math.random() - 0.5) * 200],
    opacity: [1, 1, 0],
    scale: [1, 1, 0.5],
    rotate: [0, Math.random() * 360],
    transition: {
      duration: 1.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

/**
 * Ring expand
 */
export const celebrateRing: Variants = {
  hidden: {
    scale: 0,
    opacity: 1,
  },
  visible: {
    scale: 3,
    opacity: 0,
    transition: {
      duration: 0.8,
      ease: EASE_DRAMATIC,
    },
  },
};

/**
 * Badge earned - flip + glow
 */
export const celebrateBadge: Variants = {
  hidden: {
    scale: 0,
    rotateY: -180,
    opacity: 0,
  },
  visible: {
    scale: 1,
    rotateY: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
};

/**
 * Counter increment
 */
export const celebrateCounter: Variants = {
  hidden: {
    y: 20,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/**
 * Sparkle effect
 */
export const celebrateSparkle: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
    rotate: 0,
  },
  visible: {
    scale: [0, 1, 0],
    opacity: [0, 1, 0],
    rotate: [0, 180],
    transition: {
      duration: 0.6,
      ease: 'linear',
    },
  },
};

/**
 * Level up shine sweep
 */
export const celebrateShineSweep: Variants = {
  hidden: {
    x: '-100%',
    opacity: 0,
  },
  visible: {
    x: '200%',
    opacity: [0, 1, 1, 0],
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

/**
 * Reduced motion fallback - simple fade
 */
export const celebrateReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

// Gold color tokens for celebrations
export const CELEBRATE_GOLD = {
  primary: '#FFD700',
  light: '#FFE55C',
  dark: '#CC9900',
  glow: 'rgba(255, 215, 0, 0.4)',
  gradient: 'linear-gradient(135deg, #FFD700 0%, #FFE55C 50%, #FFD700 100%)',
} as const;

// Export pattern constants for documentation
export const CELEBRATE = {
  easeDramatic: EASE_DRAMATIC,
  springBouncy: SPRING_BOUNCY,
  gold: CELEBRATE_GOLD,
} as const;

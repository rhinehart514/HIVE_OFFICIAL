/**
 * Premium Onboarding Motion Variants
 * YC/SF/OpenAI-style animations for the onboarding flow
 */

import { type Variants, type Transition } from 'framer-motion';

// =============================================================================
// PREMIUM EASING
// =============================================================================

/** Premium ease - OpenAI/Vercel style */
export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

/** Dramatic ease for celebrations */
export const EASE_DRAMATIC = [0.165, 0.84, 0.44, 1] as const;

// =============================================================================
// PAGE TRANSITIONS
// =============================================================================

/** Page transition - slide up with stagger */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: EASE_PREMIUM,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: EASE_PREMIUM,
    },
  },
};

/** Container for staggering children */
export const containerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/** Individual item in stagger sequence */
export const itemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE_PREMIUM,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

// =============================================================================
// INPUT INTERACTIONS
// =============================================================================

/** Input focus - subtle scale + glow */
export const inputFocusVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 0 0 0px rgba(255, 215, 0, 0)'
  },
  focus: {
    scale: 1.01,
    boxShadow: '0 0 0 3px rgba(255, 215, 0, 0.15)',
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

// =============================================================================
// BUTTON INTERACTIONS
// =============================================================================

/** Button hover - lift + arrow movement */
export const buttonHoverVariants: Variants = {
  rest: { y: 0 },
  hover: {
    y: -2,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    y: 0,
    scale: 0.98,
  },
};

/** Arrow icon in button - slides right on hover */
export const arrowVariants: Variants = {
  rest: { x: 0 },
  hover: {
    x: 4,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

// =============================================================================
// CARD INTERACTIONS
// =============================================================================

/** Card hover - lift + subtle scale */
export const cardHoverVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
  },
  hover: {
    y: -4,
    scale: 1.01,
    transition: {
      duration: 0.3,
      ease: EASE_PREMIUM,
    },
  },
  tap: {
    scale: 0.99,
  },
};

/** Primary card with gold glow */
export const primaryCardVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: '0 0 0 1px rgba(255, 215, 0, 0.2)',
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: '0 0 30px rgba(255, 215, 0, 0.15), 0 0 0 1px rgba(255, 215, 0, 0.3)',
    transition: {
      duration: 0.3,
      ease: EASE_PREMIUM,
    },
  },
  tap: {
    scale: 0.99,
  },
};

// =============================================================================
// CELEBRATION ANIMATIONS
// =============================================================================

/** Celebration checkmark - scale bounce */
export const celebrationCheckVariants: Variants = {
  initial: { scale: 0.5, opacity: 0 },
  animate: {
    scale: [0.5, 1.15, 1],
    opacity: 1,
    transition: {
      duration: 0.7,
      ease: EASE_DRAMATIC,
      times: [0, 0.6, 1],
    },
  },
};

/** Space name reveal - typewriter effect */
export const typewriterVariants: Variants = {
  initial: { width: 0 },
  animate: {
    width: '100%',
    transition: {
      duration: 0.8,
      ease: EASE_PREMIUM,
      delay: 0.3,
    },
  },
};

/** Gold underline draw */
export const underlineDrawVariants: Variants = {
  initial: { scaleX: 0, originX: 0 },
  animate: {
    scaleX: 1,
    transition: {
      duration: 0.6,
      ease: EASE_PREMIUM,
      delay: 0.5,
    },
  },
};

/** Confetti particle */
export const confettiVariants: Variants = {
  initial: { y: 0, opacity: 1, scale: 1 },
  animate: (custom: { x: number; delay: number }) => ({
    y: -100,
    x: custom.x,
    opacity: 0,
    scale: 0.5,
    transition: {
      duration: 1.5,
      ease: 'easeOut',
      delay: custom.delay,
    },
  }),
};

// =============================================================================
// GLOW EFFECTS
// =============================================================================

/** Gold glow for focused/active states */
export const GLOW_GOLD = '0 0 0 3px rgba(255, 215, 0, 0.15), 0 0 20px rgba(255, 215, 0, 0.1)';

/** Subtle gold glow for cards */
export const GLOW_GOLD_SUBTLE = '0 0 20px rgba(255, 215, 0, 0.08)';

/** Strong gold glow for primary CTA */
export const GLOW_GOLD_STRONG = '0 0 40px rgba(255, 215, 0, 0.2), 0 0 0 1px rgba(255, 215, 0, 0.3)';

/** Gold glow for unclaimed spaces */
export const GLOW_GOLD_UNCLAIMED = '0 0 30px rgba(255, 215, 0, 0.15), 0 0 0 1px rgba(255, 215, 0, 0.25)';

// =============================================================================
// TRANSITION PRESETS
// =============================================================================

export const transitionPremium: Transition = {
  duration: 0.6,
  ease: EASE_PREMIUM,
};

export const transitionFast: Transition = {
  duration: 0.2,
  ease: 'easeOut',
};

export const transitionSpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

// =============================================================================
// ERROR & SUCCESS STATES
// =============================================================================

/** Error shake - satisfying but not jarring */
export const errorShakeVariants: Variants = {
  initial: { x: 0 },
  shake: {
    x: [0, -8, 8, -8, 8, 0],
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

/** Golden Pulse - The HIVE signature moment
 * Use for identity-affirming transitions:
 * - Handle validated ✓
 * - Profile saved ✓
 * - Space claimed ✓
 * - Login successful ✓
 */
export const goldenPulseVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: '0 0 0 0 rgba(255, 215, 0, 0)',
  },
  pulse: {
    scale: [1, 1.02, 1],
    boxShadow: [
      '0 0 0 0 rgba(255, 215, 0, 0)',
      '0 0 20px 10px rgba(255, 215, 0, 0.15)',
      '0 0 0 0 rgba(255, 215, 0, 0)',
    ],
    transition: {
      duration: 0.6,
      ease: EASE_DRAMATIC,
    },
  },
};

/** Success check with scale bounce */
export const successCheckVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.2, 1],
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: EASE_DRAMATIC,
      times: [0, 0.6, 1],
    },
  },
};

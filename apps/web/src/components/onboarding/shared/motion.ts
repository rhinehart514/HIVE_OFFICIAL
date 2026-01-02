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

// =============================================================================
// MONOCHROME DESIGN SYSTEM
// =============================================================================
// Gold is earned, not given. 99% grayscale, gold only on achievement.

/** Monochrome style tokens - ChatGPT/OpenAI aesthetic */
export const MONOCHROME = {
  // Gold only appears on achievement (handle claimed, space selected, etc.)
  goldText: 'text-gold-500',
  goldBorder: 'border-gold-500/30',
  goldBg: 'bg-gold-500/[0.04]',
  goldGlow: '0 0 20px rgba(255, 215, 0, 0.5)',
  goldHoverGlow: '0 0 30px rgba(255, 215, 0, 0.15)',
  goldUnlockGlow: '0 0 40px rgba(255, 215, 0, 0.06)',

  // Everything else is grayscale
  inputBase: 'w-full h-14 px-0 bg-transparent border-0 border-b border-neutral-800 text-white text-lg text-center placeholder:text-neutral-700 focus:outline-none focus:border-white/50 transition-all duration-300',
  cardBg: 'bg-white/[0.02] backdrop-blur-sm',
  cardBorder: 'border border-white/[0.06]',
  cardHoverBorder: 'hover:border-white/[0.12]',
  cardHoverBg: 'hover:bg-white/[0.04]',

  // Typography
  heading: 'text-[32px] font-normal tracking-tight text-white',
  subheading: 'text-neutral-500',

  // Buttons
  buttonPrimary: 'h-12 px-8 rounded-full bg-white/95 text-black text-sm font-medium hover:bg-white hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] transition-all duration-300 disabled:bg-neutral-900/80 disabled:text-neutral-700 disabled:cursor-not-allowed',
  buttonGold: 'h-12 px-8 rounded-full bg-gold-500 text-black text-sm font-medium hover:bg-gold-400 hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all duration-300',
  buttonGhost: 'text-sm font-medium text-neutral-600 hover:text-neutral-400 transition-colors',

  // Spacing
  sectionGap: 'mb-16',
  itemGap: 'mb-12',
} as const;

/** Monochrome unlock animation - golden underline draws in */
export const monochromeUnlockVariants: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: EASE_PREMIUM,
      delay: 0.2,
    },
  },
};

/** Background glow that appears on unlock */
export const unlockGlowVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: [0, 0.08, 0.04],
    scale: [0.8, 1.2, 1],
    transition: {
      duration: 1,
      ease: EASE_PREMIUM,
    },
  },
};

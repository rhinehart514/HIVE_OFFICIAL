/**
 * SNAP Pattern
 *
 * Micro-interactions: buttons, toggles, hover states.
 * Duration: 150ms
 * Easing: Snap [0.25, 0.1, 0.25, 1]
 *
 * Use for:
 * - Button press/hover
 * - Toggle switches
 * - Checkbox/radio
 * - Icon hover states
 * - Tab indicators
 */

import type { Variants, Transition } from 'framer-motion';

const DURATION = 0.15;
const EASE = [0.25, 0.1, 0.25, 1] as const;

export const snapTransition: Transition = {
  duration: DURATION,
  ease: EASE,
};

/**
 * Button states
 */
export const snapButton: Variants = {
  rest: {
    scale: 1,
    transition: snapTransition,
  },
  hover: {
    scale: 1.02,
    transition: snapTransition,
  },
  tap: {
    scale: 0.98,
    transition: snapTransition,
  },
};

/**
 * Button with shadow
 */
export const snapButtonShadow: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    transition: snapTransition,
  },
  hover: {
    scale: 1.02,
    y: -1,
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    transition: snapTransition,
  },
  tap: {
    scale: 0.98,
    y: 1,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: snapTransition,
  },
};

/**
 * Toggle switch
 */
export const snapToggle: Variants = {
  off: {
    x: 0,
    transition: snapTransition,
  },
  on: {
    x: 20, // Adjust based on toggle width
    transition: snapTransition,
  },
};

/**
 * Checkbox/radio mark
 */
export const snapCheck: Variants = {
  unchecked: {
    scale: 0,
    opacity: 0,
    transition: snapTransition,
  },
  checked: {
    scale: 1,
    opacity: 1,
    transition: snapTransition,
  },
};

/**
 * Icon hover
 */
export const snapIcon: Variants = {
  rest: {
    scale: 1,
    opacity: 0.7,
    transition: snapTransition,
  },
  hover: {
    scale: 1.1,
    opacity: 1,
    transition: snapTransition,
  },
};

/**
 * Tab indicator slide
 */
export const snapIndicator: Variants = {
  // Use layout animations with layoutId instead
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: snapTransition,
  },
};

/**
 * Focus ring
 */
export const snapFocus: Variants = {
  rest: {
    boxShadow: '0 0 0 0px rgba(255,255,255,0)',
    transition: snapTransition,
  },
  focus: {
    boxShadow: '0 0 0 2px rgba(255,255,255,0.5)',
    transition: snapTransition,
  },
};

/**
 * Link hover underline
 */
export const snapUnderline: Variants = {
  rest: {
    scaleX: 0,
    transition: snapTransition,
  },
  hover: {
    scaleX: 1,
    transition: snapTransition,
  },
};

/**
 * Reduced motion fallback
 */
export const snapReduced: Variants = {
  rest: {},
  hover: {},
  tap: {},
};

// Export pattern constants for documentation
export const SNAP = {
  duration: DURATION,
  ease: EASE,
} as const;

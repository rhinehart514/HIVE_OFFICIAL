/**
 * SURFACE Pattern
 *
 * Cards, panels, drawers.
 * Motion: Spring-based for physical feel
 *
 * Use for:
 * - Card hover/press states
 * - Panel open/close
 * - Drawer slide
 * - Expandable sections
 */

import type { Variants, Transition } from 'framer-motion';

const SPRING = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

const SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 25,
};

export const surfaceTransition: Transition = SPRING;

/**
 * Card hover - subtle lift with shadow
 */
export const surfaceCard: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: SPRING,
  },
  hover: {
    y: -2,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    transition: SPRING,
  },
  tap: {
    y: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: SPRING,
  },
};

/**
 * Panel expand/collapse
 */
export const surfacePanel: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: SPRING_GENTLE,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: SPRING_GENTLE,
  },
};

/**
 * Drawer slide from right
 */
export const surfaceDrawer: Variants = {
  closed: {
    x: '100%',
    transition: SPRING,
  },
  open: {
    x: 0,
    transition: SPRING,
  },
};

/**
 * Drawer slide from left
 */
export const surfaceDrawerLeft: Variants = {
  closed: {
    x: '-100%',
    transition: SPRING,
  },
  open: {
    x: 0,
    transition: SPRING,
  },
};

/**
 * Sheet slide from bottom
 */
export const surfaceSheet: Variants = {
  closed: {
    y: '100%',
    transition: SPRING,
  },
  open: {
    y: 0,
    transition: SPRING,
  },
};

/**
 * Floating card (e.g., dropdown, popover)
 */
export const surfaceFloat: Variants = {
  hidden: {
    opacity: 0,
    y: -4,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING,
  },
};

/**
 * Reduced motion fallback
 */
export const surfaceReduced: Variants = {
  rest: {},
  hover: {},
  tap: {},
};

// Export pattern constants for documentation
export const SURFACE = {
  spring: SPRING,
  springGentle: SPRING_GENTLE,
} as const;

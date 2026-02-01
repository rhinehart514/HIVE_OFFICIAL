/**
 * OVERLAY Pattern
 *
 * Modals, dialogs, command palette.
 * Backdrop: 200ms fade
 * Content: Spring-based entrance
 *
 * Use for:
 * - Modal dialogs
 * - Command palette
 * - Alert dialogs
 * - Full-screen overlays
 */

import type { Variants, Transition } from 'framer-motion';

const BACKDROP_DURATION = 0.2;
const CONTENT_SPRING = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

/**
 * Backdrop fade
 */
export const overlayBackdrop: Variants = {
  hidden: {
    opacity: 0,
    transition: { duration: BACKDROP_DURATION },
  },
  visible: {
    opacity: 1,
    transition: { duration: BACKDROP_DURATION },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/**
 * Modal content - scale up from center
 */
export const overlayModal: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: CONTENT_SPRING,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

/**
 * Dialog content - smaller scale
 */
export const overlayDialog: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: CONTENT_SPRING,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

/**
 * Command palette - slide down
 */
export const overlayCommand: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: CONTENT_SPRING,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

/**
 * Alert - pop in
 */
export const overlayAlert: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.1 },
  },
};

/**
 * Sheet from bottom
 */
export const overlaySheet: Variants = {
  hidden: {
    y: '100%',
  },
  visible: {
    y: 0,
    transition: CONTENT_SPRING,
  },
  exit: {
    y: '100%',
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

/**
 * Toast notification
 */
export const overlayToast: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: CONTENT_SPRING,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    x: 100,
    transition: { duration: 0.2 },
  },
};

/**
 * Reduced motion fallback
 */
export const overlayReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

// Export pattern constants for documentation
export const OVERLAY = {
  backdropDuration: BACKDROP_DURATION,
  spring: CONTENT_SPRING,
} as const;

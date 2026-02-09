import { type Variants } from 'framer-motion';
import { DURATION, EASE_PREMIUM } from './constants';

export const chipCheckVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.fast, ease: EASE_PREMIUM },
  },
};

export const chipContentVariants: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.quick, ease: EASE_PREMIUM },
  },
  exit: {
    opacity: 0,
    x: 8,
    transition: { duration: DURATION.fast },
  },
};

export const errorInlineVariants: Variants = {
  initial: {
    opacity: 0,
    height: 0,
    y: -4,
  },
  animate: {
    opacity: 1,
    height: 'auto',
    y: 0,
    transition: { duration: DURATION.fast, ease: EASE_PREMIUM },
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -4,
    transition: { duration: DURATION.fast },
  },
};


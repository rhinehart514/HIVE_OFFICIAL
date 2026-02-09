/**
 * HIVE Motion Library
 *
 * Minimal motion exports after 2026 cleanup.
 */

import * as React from 'react';
import { motion } from 'framer-motion';

// Interaction patterns
export * from './interactions'

// Minimal compatibility exports
export { WordReveal } from '../design-system/primitives/motion';

export interface AnimatedLineProps {
  className?: string;
  delay?: number;
  duration?: number;
}

export function AnimatedLine({ className, delay = 0, duration = 0.25 }: AnimatedLineProps) {
  return React.createElement(motion.div, {
    className,
    initial: { scaleX: 0 },
    animate: { scaleX: 1 },
    transition: { duration, delay, ease: [0.22, 1, 0.36, 1] },
    style: { transformOrigin: 'left' },
  });
}

export interface GoldBorderContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function GoldBorderContainer({ children, className, delay: _delay }: GoldBorderContainerProps) {
  return React.createElement(
    'div',
    { className, style: { border: '1px solid rgba(255,215,0,0.25)' } },
    children,
  );
}

export interface StatCounterProps {
  value: number;
  className?: string;
  format?: (value: number) => string;
  suffix?: string;
  delay?: number;
  highlight?: boolean;
}

export function StatCounter({ value, className, format, suffix = '', delay: _delay, highlight: _highlight }: StatCounterProps) {
  const content = `${format ? format(value) : value.toLocaleString()}${suffix}`;
  return React.createElement('span', { className }, content);
}

// Legacy exports kept as lightweight compatibility shims.
export const easing = {
  default: [0.22, 1, 0.36, 1] as const,
};

export const duration = {
  instant: 0.15,
  quick: 0.2,
  standard: 0.3,
  smooth: 0.4,
  slow: 0.6,
};

export const transition = {
  default: { duration: duration.standard, ease: easing.default },
  smooth: { duration: duration.smooth, ease: easing.default },
  snap: { duration: duration.instant, ease: easing.default },
};

export const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
};

export const gestures = {
  button: { whileHover: { opacity: 0.96 }, whileTap: { opacity: 0.9 } },
  card: { whileHover: { opacity: 0.98 }, whileTap: { opacity: 0.92 } },
  none: {},
};

export const stagger = {
  fast: 0.03,
  default: 0.05,
  relaxed: 0.08,
};

type MotionWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

function createMotionWrapper(
  animateProps: Record<string, unknown>,
  initialProps: Record<string, unknown> = {},
) {
  void animateProps;
  void initialProps;
  return function Wrapper({ children, className }: MotionWrapperProps) {
    return React.createElement('div', { className }, children);
  };
}

export const FadeIn = createMotionWrapper({ opacity: 1 }, { opacity: 0 });
export const SlideUp = createMotionWrapper({ opacity: 1, y: 0 }, { opacity: 0, y: 10 });
export const SlideIn = createMotionWrapper({ opacity: 1, x: 0 }, { opacity: 0, x: 12 });
export const ScaleIn = createMotionWrapper({ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.98 });
export const Pop = createMotionWrapper({ opacity: 1 }, { opacity: 0 });
export const Stagger = createMotionWrapper({ opacity: 1 }, { opacity: 1 });
export const Presence = createMotionWrapper({ opacity: 1 }, { opacity: 0 });
export const MotionDiv = createMotionWrapper({ opacity: 1 }, { opacity: 1 });
export const Collapse = createMotionWrapper({ opacity: 1, height: 'auto' }, { opacity: 0, height: 0 });

export const StaggerList = Stagger;
export const SequentialReveal = Stagger;
export const PageTransition = FadeIn;
export const ModalTransition = FadeIn;
export const SheetTransition = FadeIn;
export const ToastTransition = FadeIn;
export const DropdownTransition = FadeIn;
export const AccordionTransition = FadeIn;
export const AchievementCelebration = FadeIn;

export interface CountUpProps {
  value: number;
  className?: string;
}

export function CountUp({ value, className }: CountUpProps) {
  return React.createElement('span', { className }, value.toLocaleString());
}

/**
 * AnimatedNumber Component
 * Spring-based number counter - billion-dollar UI pattern
 *
 * Based on motion-primitives AnimatedNumber
 * @see https://motion-primitives.com/docs/animated-number
 *
 * @example
 * ```tsx
 * <AnimatedNumber
 *   value={2082}
 *   springOptions={{ bounce: 0, duration: 2000 }}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { useEffect, useRef, useState, forwardRef, type HTMLAttributes } from 'react';
import { useSpring, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';

// Component to render MotionValue as text (with ref forwarding)
const MotionSpan = forwardRef<
  HTMLSpanElement,
  { value: MotionValue<string>; className?: string } & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>
>(({ value, className, ...props }, ref) => {
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    const unsubscribe = value.on('change', (v) => {
      setDisplayValue(v);
    });
    // Set initial value
    setDisplayValue(value.get());
    return () => unsubscribe();
  }, [value]);

  return (
    <span ref={ref} className={className} {...props}>
      {displayValue}
    </span>
  );
});

MotionSpan.displayName = 'MotionSpan';

export interface AnimatedNumberProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The target value to animate to */
  value: number;

  /** Spring animation configuration */
  springOptions?: {
    /** Bounce amount (0 = no bounce, default: 0) */
    bounce?: number;
    /** Animation duration in ms (default: 2000) */
    duration?: number;
    /** Stiffness (alternative to duration) */
    stiffness?: number;
    /** Damping (alternative to duration) */
    damping?: number;
    /** Mass (default: 1) */
    mass?: number;
  };

  /** Format the number (e.g., add commas, currency) */
  formatFn?: (value: number) => string;

  /** Decimal places to show (default: 0) */
  decimalPlaces?: number;

  /** Whether to animate only when in view */
  animateOnView?: boolean;

  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

const defaultSpringOptions = {
  bounce: 0,
  duration: 2000,
};

/**
 * AnimatedNumber - Spring-based counting animation
 *
 * Premium UI pattern for stats, counters, metrics.
 * Uses spring physics for natural motion.
 */
export function AnimatedNumber({
  value,
  springOptions = defaultSpringOptions,
  formatFn,
  decimalPlaces = 0,
  animateOnView = false,
  onAnimationComplete,
  className,
  ...props
}: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [isInView, setIsInView] = useState(!animateOnView);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Convert duration from ms to seconds for framer-motion
  const springConfig = {
    bounce: springOptions.bounce ?? 0,
    duration: springOptions.duration ? springOptions.duration / 1000 : 2,
    stiffness: springOptions.stiffness,
    damping: springOptions.damping,
    mass: springOptions.mass ?? 1,
  };

  // Use 0 as initial value if animating, otherwise use target value
  const initialValue = prefersReducedMotion || hasAnimated ? value : 0;

  const spring = useSpring(initialValue, springConfig);

  const display = useTransform(spring, (current) => {
    const rounded = decimalPlaces > 0
      ? current.toFixed(decimalPlaces)
      : Math.round(current);

    if (formatFn) {
      return formatFn(Number(rounded));
    }

    // Default: add commas for thousands
    return Number(rounded).toLocaleString();
  });

  // Intersection Observer for animateOnView
  useEffect(() => {
    if (!animateOnView || !ref.current || prefersReducedMotion) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animateOnView, hasAnimated, prefersReducedMotion]);

  // Animate to value when in view
  useEffect(() => {
    if (isInView && !prefersReducedMotion) {
      spring.set(value);
      setHasAnimated(true);
    } else if (prefersReducedMotion) {
      spring.jump(value);
    }
  }, [isInView, value, spring, prefersReducedMotion]);

  // Handle animation complete callback
  useEffect(() => {
    if (!onAnimationComplete) return;

    const unsubscribe = spring.on('change', (latest) => {
      // Consider animation complete when we're within 0.5 of target
      if (Math.abs(latest - value) < 0.5) {
        onAnimationComplete();
      }
    });

    return () => unsubscribe();
  }, [spring, value, onAnimationComplete]);

  return (
    <MotionSpan
      ref={ref}
      value={display}
      className={cn('tabular-nums', className)}
      {...props}
    />
  );
}

AnimatedNumber.displayName = 'AnimatedNumber';

/**
 * Preset spring configurations
 */
export const numberSpringPresets = {
  /** Quick count-up, no bounce */
  quick: { bounce: 0, duration: 1000 },
  /** Standard count-up with slight settle */
  standard: { bounce: 0.1, duration: 2000 },
  /** Slow dramatic reveal */
  dramatic: { bounce: 0, duration: 3000 },
  /** Bouncy playful counter */
  bouncy: { bounce: 0.3, duration: 1500 },
  /** Snappy with overshoot */
  snappy: { stiffness: 200, damping: 15 },
} as const;

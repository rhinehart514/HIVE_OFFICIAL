'use client';

/**
 * Scroll Transform Motion Primitives
 *
 * Generic scroll-linked transforms for parallax, reveal, and cinematic effects.
 * Enables precise control over how elements respond to scroll position.
 *
 * Philosophy:
 * - Scroll = progression through narrative
 * - Transforms create depth and hierarchy
 * - Faster movement = closer to viewer
 * - Slower movement = further away
 */

import * as React from 'react';
import { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type MotionValue,
} from 'framer-motion';
import { cn } from '../../../lib/utils';
import { MOTION } from '../../../tokens/motion';

// ============================================
// SCROLL TRANSFORM
// ============================================

export interface ScrollTransformProps {
  children: React.ReactNode;
  className?: string;
  /** Y translation range [start, end] in pixels. Default: [0, 0] */
  translateY?: [number, number];
  /** X translation range [start, end] in pixels. Default: [0, 0] */
  translateX?: [number, number];
  /** Scale range [start, end]. Default: [1, 1] */
  scale?: [number, number];
  /** Opacity range [start, end]. Default: [1, 1] */
  opacity?: [number, number];
  /** Rotation range [start, end] in degrees. Default: [0, 0] */
  rotate?: [number, number];
  /** Scroll offset triggers. Default: ['start end', 'end start'] */
  offset?: ['start end' | 'end start' | 'start start' | 'end end' | `${number}px`, string];
  /** Apply spring smoothing. Default: true */
  smooth?: boolean;
  /** Spring stiffness (when smooth=true). Default: 100 */
  stiffness?: number;
  /** Spring damping (when smooth=true). Default: 30 */
  damping?: number;
}

/**
 * Generic scroll-linked transform container.
 * Allows precise control over multiple transform properties based on scroll.
 *
 * @example
 * // Parallax with fade
 * <ScrollTransform translateY={[50, -50]} opacity={[0.5, 1]}>
 *   <Content />
 * </ScrollTransform>
 *
 * @example
 * // Scale up on scroll
 * <ScrollTransform scale={[0.9, 1]} opacity={[0, 1]}>
 *   <HeroElement />
 * </ScrollTransform>
 */
export function ScrollTransform({
  children,
  className,
  translateY = [0, 0],
  translateX = [0, 0],
  scale = [1, 1],
  opacity = [1, 1],
  rotate = [0, 0],
  offset = ['start end', 'end start'],
  smooth = true,
  stiffness = 100,
  damping = 30,
}: ScrollTransformProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as ['start end', 'end start'],
  });

  // Raw transforms
  const rawY = useTransform(scrollYProgress, [0, 1], translateY);
  const rawX = useTransform(scrollYProgress, [0, 1], translateX);
  const rawScale = useTransform(scrollYProgress, [0, 1], scale);
  const rawOpacity = useTransform(scrollYProgress, [0, 1], opacity);
  const rawRotate = useTransform(scrollYProgress, [0, 1], rotate);

  // Smoothed transforms (optional)
  const springConfig = { stiffness, damping };
  const y = smooth ? useSpring(rawY, springConfig) : rawY;
  const x = smooth ? useSpring(rawX, springConfig) : rawX;
  const scaleValue = smooth ? useSpring(rawScale, springConfig) : rawScale;
  const opacityValue = smooth ? useSpring(rawOpacity, springConfig) : rawOpacity;
  const rotateValue = smooth ? useSpring(rawRotate, springConfig) : rawRotate;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        x,
        y,
        scale: scaleValue,
        opacity: opacityValue,
        rotate: rotateValue,
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// SCROLL FADE
// ============================================

export interface ScrollFadeProps {
  children: React.ReactNode;
  className?: string;
  /** Direction of fade. Default: 'up' */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Distance to travel during fade. Default: 30 */
  distance?: number;
  /** Scroll offset triggers. Default: ['start end', 'end start'] */
  offset?: ['start end' | 'end start' | 'start start' | 'end end', string];
  /** Initial opacity. Default: 0 */
  initialOpacity?: number;
  /** Final opacity. Default: 1 */
  finalOpacity?: number;
}

/**
 * Element that fades in with optional directional movement on scroll.
 * Simpler API than ScrollTransform for common fade-in patterns.
 *
 * @example
 * // Fade up on scroll
 * <ScrollFade direction="up">
 *   <Content />
 * </ScrollFade>
 *
 * @example
 * // Fade in without movement
 * <ScrollFade direction="none">
 *   <Image />
 * </ScrollFade>
 */
export function ScrollFade({
  children,
  className,
  direction = 'up',
  distance = 30,
  offset = ['start end', 'end start'],
  initialOpacity = 0,
  finalOpacity = 1,
}: ScrollFadeProps) {
  const translations: Record<string, [number, number]> = {
    up: [distance, 0],
    down: [-distance, 0],
    left: [distance, 0],
    right: [-distance, 0],
    none: [0, 0],
  };

  const isVertical = direction === 'up' || direction === 'down';

  return (
    <ScrollTransform
      className={className}
      translateY={isVertical ? translations[direction] : [0, 0]}
      translateX={!isVertical && direction !== 'none' ? translations[direction] : [0, 0]}
      opacity={[initialOpacity, finalOpacity]}
      offset={offset}
    >
      {children}
    </ScrollTransform>
  );
}

// ============================================
// SCROLL STICKY
// ============================================

export interface ScrollStickyProps {
  children: React.ReactNode;
  className?: string;
  /** Sticky position from top. Default: 0 */
  top?: number;
  /** Fade out as user scrolls past. Default: true */
  fadeOnExit?: boolean;
  /** Scale down as user scrolls past. Default: false */
  scaleOnExit?: boolean;
}

/**
 * Sticky element with optional fade/scale on exit.
 * For hero sections that stay visible then elegantly exit.
 *
 * @example
 * <ScrollSticky fadeOnExit scaleOnExit>
 *   <HeroContent />
 * </ScrollSticky>
 */
export function ScrollSticky({
  children,
  className,
  top = 0,
  fadeOnExit = true,
  scaleOnExit = false,
}: ScrollStickyProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const opacity = fadeOnExit
    ? useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0])
    : undefined;
  const scale = scaleOnExit
    ? useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0.95])
    : undefined;

  return (
    <motion.div
      ref={ref}
      className={cn('sticky', className)}
      style={{
        top,
        opacity,
        scale,
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// SCROLL COUNTER
// ============================================

export interface ScrollCounterProps {
  /** Target value to count to */
  value: number;
  className?: string;
  /** Number format options */
  formatOptions?: Intl.NumberFormatOptions;
  /** Prefix (e.g., '$') */
  prefix?: string;
  /** Suffix (e.g., '%', '+') */
  suffix?: string;
  /** Duration of count animation in ms. Default: 1500 */
  duration?: number;
}

/**
 * Number that counts up when scrolled into view.
 * For statistics, metrics, and impact numbers.
 *
 * @example
 * <ScrollCounter value={10000} suffix="+" />
 * <ScrollCounter value={98} suffix="%" prefix="" />
 */
export function ScrollCounter({
  value,
  className,
  formatOptions = {},
  prefix = '',
  suffix = '',
  duration = 1500,
}: ScrollCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const count = useTransform(scrollYProgress, [0, 1], [0, value]);
  const smoothCount = useSpring(count, { duration });

  const formatter = new Intl.NumberFormat('en-US', formatOptions);

  return (
    <motion.span ref={ref} className={className}>
      {prefix}
      <motion.span>
        {/* Use a callback to format the animated value */}
        {smoothCount.get() !== undefined ? formatter.format(Math.round(smoothCount.get())) : 0}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

// ============================================
// SCROLL PROGRESS BAR
// ============================================

export interface ScrollProgressBarProps {
  className?: string;
  /** Bar color. Default: 'var(--color-gold)' */
  color?: string;
  /** Bar height. Default: 2 */
  height?: number;
  /** Position. Default: 'top' */
  position?: 'top' | 'bottom';
  /** Track specific element instead of page */
  targetRef?: React.RefObject<HTMLElement>;
}

/**
 * Progress bar showing scroll position.
 * Can track page scroll or specific element.
 *
 * @example
 * // Page scroll progress
 * <ScrollProgressBar color="var(--color-gold)" />
 *
 * @example
 * // Section scroll progress
 * <ScrollProgressBar targetRef={sectionRef} position="bottom" />
 */
export function ScrollProgressBar({
  className,
  color = 'var(--color-gold)',
  height = 2,
  position = 'top',
  targetRef,
}: ScrollProgressBarProps) {
  const { scrollYProgress } = useScroll(
    targetRef ? { target: targetRef } : undefined
  );

  return (
    <motion.div
      className={cn(
        'fixed left-0 right-0 z-50',
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
      style={{
        height,
        background: color,
        scaleX: scrollYProgress,
        transformOrigin: 'left',
      }}
    />
  );
}

// ============================================
// USE SCROLL TRANSFORM (Hook)
// ============================================

export interface UseScrollTransformOptions {
  /** Scroll offset triggers */
  offset?: ['start end' | 'end start' | 'start start' | 'end end', string];
}

/**
 * Hook for creating custom scroll-linked transforms.
 * Returns scroll progress and ref to attach to element.
 *
 * @example
 * const { ref, scrollYProgress } = useScrollTransform();
 * const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
 */
export function useScrollTransform(options: UseScrollTransformOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: (options.offset || ['start end', 'end start']) as ['start end', 'end start'],
  });

  return { ref, scrollYProgress };
}

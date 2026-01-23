'use client';

/**
 * Reveal Motion Primitives
 *
 * Scroll-triggered reveal animations extracted from /about page.
 * Creates ceremony around content - nothing is given for free, everything earns visibility.
 *
 * Philosophy:
 * - Content fades in as user scrolls (useInView with once: true)
 * - Borders draw themselves to create containment ceremony
 * - Words reveal one by one to control reading rhythm
 * - Motion communicates meaning, not just decoration
 */

import * as React from 'react';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { MOTION } from '../../../tokens/motion';

// ============================================
// REVEAL SECTION
// ============================================

export interface RevealSectionProps {
  children: React.ReactNode;
  className?: string;
  /** HTML id attribute for anchor links */
  id?: string;
  /** Viewport margin - when to trigger reveal. Default: 'far' (-150px) */
  margin?: keyof typeof MOTION.viewport;
  /** Animation duration. Default: 'slower' (1.2s) */
  duration?: keyof typeof MOTION.duration;
  /** Easing curve. Default: 'premium' */
  ease?: keyof typeof MOTION.ease;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Render as section or div */
  as?: 'section' | 'div';
  /** Data attribute for GSAP scroll sections */
  'data-scroll-section'?: boolean;
  /** Data attribute for GSAP parallax */
  'data-parallax'?: number;
}

/**
 * Section that fades in when scrolled into view.
 * Standard pattern for all major page sections.
 *
 * @example
 * <RevealSection margin="far" className="py-32">
 *   <h2>Section Title</h2>
 *   <p>Content...</p>
 * </RevealSection>
 */
export function RevealSection({
  children,
  className,
  id,
  margin = 'far',
  duration = 'slower',
  ease = 'premium',
  delay = 0,
  as = 'section',
  'data-scroll-section': scrollSection,
  'data-parallax': parallax,
}: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: MOTION.viewport[margin],
  });

  return (
    <motion.div
      ref={ref}
      id={id}
      className={cn('relative', className)}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{
        duration: MOTION.duration[duration],
        delay,
        ease: MOTION.ease[ease],
      }}
      role={as === 'section' ? 'region' : undefined}
      data-scroll-section={scrollSection || undefined}
      data-parallax={parallax !== undefined ? parallax : undefined}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// NARRATIVE REVEAL
// ============================================

export interface NarrativeRevealProps {
  /** Text to reveal word-by-word */
  children: string;
  className?: string;
  /** Delay between words. Default: 'words' (0.03s) */
  stagger?: keyof typeof MOTION.stagger | number;
  /** Animation duration per word. Default: 'base' (0.6s) */
  duration?: keyof typeof MOTION.duration;
  /** Easing curve. Default: 'premium' */
  ease?: keyof typeof MOTION.ease;
  /** Viewport margin. Default: 'close' (-50px) */
  margin?: keyof typeof MOTION.viewport;
}

/**
 * Text that reveals word-by-word on scroll.
 * Controls reading rhythm - forces user to read at intended pace.
 *
 * @example
 * <p className="text-white/50">
 *   <NarrativeReveal stagger="words">
 *     HIVE isn't a social app you check. It's infrastructure.
 *   </NarrativeReveal>
 * </p>
 */
export function NarrativeReveal({
  children,
  className,
  stagger = 'words',
  duration = 'base',
  ease = 'premium',
  margin = 'close',
}: NarrativeRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: MOTION.viewport[margin],
  });

  const words = children.split(' ');
  const staggerDelay = typeof stagger === 'number' ? stagger : MOTION.stagger[stagger];

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: MOTION.duration[duration],
            delay: i * staggerDelay,
            ease: MOTION.ease[ease],
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// ============================================
// ANIMATED BORDER
// ============================================

export interface AnimatedBorderProps {
  className?: string;
  /** Border variant. Default: 'horizontal' */
  variant?: 'horizontal' | 'container';
  /** Animation duration. Default: 'slower' (1.5s) for horizontal, 'slower' (1.2s) for container */
  duration?: keyof typeof MOTION.duration;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Viewport margin. Default: 'close' (-50px) */
  margin?: keyof typeof MOTION.viewport;
  /** Children (only for container variant) */
  children?: React.ReactNode;
}

/**
 * Animated border that draws itself in on scroll.
 *
 * Variants:
 * - horizontal: Single line that draws left-to-right (section dividers)
 * - container: 4-sided border that draws in sequence, then reveals content
 *
 * @example
 * // Section divider
 * <AnimatedBorder variant="horizontal" className="my-32" />
 *
 * @example
 * // Container with ceremony
 * <AnimatedBorder variant="container" className="rounded-2xl p-16">
 *   <h2>Important Content</h2>
 * </AnimatedBorder>
 */
export function AnimatedBorder({
  className,
  variant = 'horizontal',
  duration,
  delay = 0,
  margin = 'close',
  children,
}: AnimatedBorderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: MOTION.viewport[margin],
  });

  if (variant === 'horizontal') {
    const animDuration = duration ? MOTION.duration[duration] : MOTION.duration.slowest;

    return (
      <div ref={ref} className={className}>
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: animDuration, delay, ease: MOTION.ease.premium }}
        />
      </div>
    );
  }

  // Container variant - 4-sided border reveal
  const animDuration = duration ? MOTION.duration[duration] : MOTION.duration.slower;

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Top border - draws left to right */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-[var(--color-gold)]/20"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: animDuration, ease: MOTION.ease.premium }}
        style={{ transformOrigin: 'left' }}
      />

      {/* Bottom border - draws right to left */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-[var(--color-gold)]/20"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: animDuration, delay: 0.1, ease: MOTION.ease.premium }}
        style={{ transformOrigin: 'right' }}
      />

      {/* Left border - draws top to bottom */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-px bg-[var(--color-gold)]/20"
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : {}}
        transition={{ duration: animDuration, delay: 0.2, ease: MOTION.ease.premium }}
        style={{ transformOrigin: 'top' }}
      />

      {/* Right border - draws bottom to top */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 w-px bg-[var(--color-gold)]/20"
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : {}}
        transition={{ duration: animDuration, delay: 0.3, ease: MOTION.ease.premium }}
        style={{ transformOrigin: 'bottom' }}
      />

      {/* Content - fades in after borders */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.5, ease: MOTION.ease.premium }}
      >
        {children}
      </motion.div>
    </div>
  );
}

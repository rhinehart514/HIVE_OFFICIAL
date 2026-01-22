'use client';

/**
 * Scroll Motion Primitives
 *
 * Enhanced parallax and scroll-linked animations from /about page.
 * Creates depth and spatial hierarchy through scroll-based transforms.
 *
 * Philosophy:
 * - Parallax = spatial depth (elements on different planes)
 * - Slower speed = further away, faster speed = closer
 * - Scroll indicators teach interaction, then disappear
 */

import * as React from 'react';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { MOTION } from '../../../tokens/motion';

// ============================================
// PARALLAX TEXT
// ============================================

export interface ParallaxTextProps {
  children: React.ReactNode;
  className?: string;
  /** Parallax speed multiplier. Default: 'base' (0.1) */
  speed?: keyof typeof MOTION.parallax | number;
  /** Scroll range to track. Default: ['start end', 'end start'] */
  offset?: ['start end' | 'end start' | 'start start' | 'end end', 'start end' | 'end start' | 'start start' | 'end end'];
}

/**
 * Text container with parallax scroll effect.
 * Creates spatial depth - elements move at different speeds while scrolling.
 *
 * Speed guidance:
 * - 0.05-0.08: Far background elements (heroes, large titles)
 * - 0.1-0.12: Mid-depth content (section headers)
 * - 0.15+: Near foreground (emphasis elements)
 *
 * @example
 * <ParallaxText speed="base">
 *   <h2>This header moves slower than scroll</h2>
 * </ParallaxText>
 */
export function ParallaxText({
  children,
  className,
  speed = 'base',
  offset = ['start end', 'end start'] as const,
}: ParallaxTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as ['start end', 'end start'],
  });

  const speedValue = typeof speed === 'number' ? speed : MOTION.parallax[speed];
  const y = useTransform(scrollYProgress, [0, 1], [100 * speedValue, -100 * speedValue]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

// ============================================
// SCROLL INDICATOR
// ============================================

export interface ScrollIndicatorProps {
  className?: string;
  /** Text to display. Default: 'Scroll' */
  text?: string;
  /** Show pulsing animation. Default: true */
  pulse?: boolean;
}

/**
 * Animated scroll indicator that teaches users the page has depth.
 * Typically used in hero sections.
 *
 * @example
 * <ScrollIndicator text="Scroll to explore" />
 */
export function ScrollIndicator({
  className,
  text = 'Scroll',
  pulse = true,
}: ScrollIndicatorProps) {
  return (
    <motion.div
      className={cn('flex items-center gap-3', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: MOTION.duration.slow, delay: 1, ease: MOTION.ease.premium }}
    >
      <motion.div
        className="w-px h-8 bg-white/20"
        animate={pulse ? { scaleY: [1, 0.5, 1] } : {}}
        transition={
          pulse
            ? {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
      />
      <span className="text-[11px] uppercase tracking-wider text-white/20">{text}</span>
    </motion.div>
  );
}

// ============================================
// HERO PARALLAX
// ============================================

export interface HeroParallaxProps {
  children: React.ReactNode;
  className?: string;
  /** Fade speed (0-1). Higher = faster fade. Default: 0.15 */
  fadeSpeed?: number;
  /** Scale amount (0-1). Default: 0.05 (scales from 1 to 0.95) */
  scaleAmount?: number;
}

/**
 * Hero section with parallax fade and scale effect.
 * As user scrolls, hero fades out and scales down slightly.
 *
 * Must be used within a scroll container with ref.
 *
 * @example
 * const containerRef = useRef(null);
 * const { scrollYProgress } = useScroll({ target: containerRef });
 *
 * <div ref={containerRef}>
 *   <HeroParallax>
 *     <h1>Hero Content</h1>
 *   </HeroParallax>
 *   {/* Other content... *\/}
 * </div>
 */
export function HeroParallax({
  children,
  className,
  fadeSpeed = 0.15,
  scaleAmount = 0.05,
}: HeroParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });

  const opacity = useTransform(scrollYProgress, [0, fadeSpeed], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, fadeSpeed], [1, 1 - scaleAmount]);

  return (
    <motion.section
      ref={ref}
      className={cn('min-h-screen flex flex-col justify-center sticky top-0', className)}
      style={{ opacity, scale }}
    >
      {children}
    </motion.section>
  );
}

// ============================================
// SCROLL PROGRESS
// ============================================

export interface ScrollProgressProps {
  className?: string;
  /** Position of the bar. Default: 'top' */
  position?: 'top' | 'bottom';
  /** Color of the progress bar. Default: 'var(--color-gold)' */
  color?: string;
  /** Height of the bar in pixels. Default: 2 */
  height?: number;
}

/**
 * Fixed scroll progress indicator.
 * Shows how far user has scrolled through the page.
 *
 * @example
 * <ScrollProgress position="top" color="var(--color-gold)" />
 */
export function ScrollProgress({
  className,
  position = 'top',
  color = 'var(--color-gold)',
  height = 2,
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();

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
// SCROLL SPACER
// ============================================

export interface ScrollSpacerProps {
  /** Height in viewport units. Default: 50 */
  height?: number;
  className?: string;
}

/**
 * Empty spacer for parallax effects.
 * Creates breathing room between scrolling sections.
 *
 * @example
 * <HeroSection />
 * <ScrollSpacer height={50} />
 * <ContentSection />
 */
export function ScrollSpacer({ height = 50, className }: ScrollSpacerProps) {
  return <div className={className} style={{ height: `${height}vh` }} />;
}

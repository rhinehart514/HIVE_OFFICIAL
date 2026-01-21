'use client';

import * as React from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { MOTION, durationSeconds, staggerPresets } from '@hive/tokens';

// Premium easing from About page
const EASE = MOTION.ease.premium; // [0.22, 1, 0.36, 1]

/**
 * AnimatedLine - Horizontal line that draws in
 * Used in: About page, SpaceThreshold, TerritoryHeader
 * Eliminates: 60+ lines of duplication
 */
export function AnimatedLine({
  className,
  delay = 0
}: {
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} className={className}>
      <motion.div
        className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{
          duration: durationSeconds.hero,
          delay,
          ease: EASE
        }}
      />
    </div>
  );
}

/**
 * WordReveal - Word-by-word text reveal with stagger
 * Used in: About page, SpaceThreshold, TerritoryHeader
 * Eliminates: 80+ lines of duplication
 */
export function WordReveal({
  children,
  className,
  stagger = staggerPresets.section,
  delay = 0,
}: {
  children: string;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const words = children.split(' ');

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: durationSeconds.gentle,
            delay: delay + i * stagger,
            ease: EASE
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * GoldBorderContainer - Sequential border reveal animation
 * Used in: About page (manually), SpaceThreshold
 * Eliminates: 60+ lines of duplication
 */
export function GoldBorderContainer({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      {/* Top border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-[var(--color-gold)]/20"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: durationSeconds.hero, delay, ease: EASE }}
        style={{ transformOrigin: 'left' }}
      />
      {/* Bottom border */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-[var(--color-gold)]/20"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: durationSeconds.hero, delay: delay + 0.1, ease: EASE }}
        style={{ transformOrigin: 'right' }}
      />
      {/* Left border */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-px bg-[var(--color-gold)]/20"
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : {}}
        transition={{ duration: durationSeconds.hero, delay: delay + 0.2, ease: EASE }}
        style={{ transformOrigin: 'top' }}
      />
      {/* Right border */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 w-px bg-[var(--color-gold)]/20"
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : {}}
        transition={{ duration: durationSeconds.hero, delay: delay + 0.3, ease: EASE }}
        style={{ transformOrigin: 'bottom' }}
      />
      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: durationSeconds.slow, delay: delay + 0.5, ease: EASE }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * StatCounter - Animated number counting
 * Used in: TerritoryHeader
 */
export function StatCounter({
  value,
  suffix,
  delay = 0,
  highlight = false,
}: {
  value: number;
  suffix: string;
  delay?: number;
  highlight?: boolean;
}) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const duration = 1200; // ms
    const startTime = Date.now();
    const delayMs = delay * 1000;

    const timer = setTimeout(() => {
      const animate = () => {
        const elapsed = Date.now() - startTime - delayMs;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        setDisplayValue(Math.floor(eased * value));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <motion.span
      className={highlight ? 'text-[var(--color-gold)]' : 'text-white/60'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: durationSeconds.smooth, delay, ease: EASE }}
    >
      {displayValue.toLocaleString()}
      <span className="text-white/40 ml-1">{suffix}</span>
    </motion.span>
  );
}

/**
 * ParallaxText - Scroll-based parallax effect
 * Used in: About page sections
 */
export function ParallaxText({
  children,
  speed = 0.5
}: {
  children: React.ReactNode;
  speed?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);

  return (
    <div ref={ref}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/**
 * RevealSection - Scroll-triggered section fade-in
 * Used in: About page sections
 */
export function RevealSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: durationSeconds.hero, ease: EASE }}
    >
      {children}
    </motion.section>
  );
}

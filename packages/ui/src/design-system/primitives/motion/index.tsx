'use client';

/**
 * Motion Primitives
 *
 * Reusable motion components and hooks for HIVE.
 * Built on Framer Motion with HIVE's signature interactions.
 */

import * as React from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
  type MotionProps,
} from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================
// HOOKS
// ============================================

/**
 * Track mouse position globally
 */
export function useMouse() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return mouse;
}

/**
 * Track scroll progress for an element
 */
export function useScrollProgress(offset: ['start end', 'end start'] = ['start end', 'end start']) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset });
  return { ref, scrollYProgress };
}

// ============================================
// COMPONENTS
// ============================================

export interface TiltProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum rotation angle in degrees */
  intensity?: number;
  /** Spring stiffness */
  stiffness?: number;
  /** Spring damping */
  damping?: number;
}

/**
 * 3D tilt effect on hover - cards rotate toward mouse position
 */
export function Tilt({
  children,
  className,
  intensity = 8,
  stiffness = 300,
  damping = 30,
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), { stiffness, damping });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), { stiffness, damping });

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const xPos = (e.clientX - rect.left) / rect.width - 0.5;
    const yPos = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPos);
    y.set(yPos);
  }, [x, y]);

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      className={cn('perspective-1000', className)}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.div>
  );
}

export interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  /** How much the element follows the cursor (0-1) */
  strength?: number;
  /** Spring stiffness */
  stiffness?: number;
  /** Spring damping */
  damping?: number;
}

/**
 * Magnetic effect - element follows cursor when nearby
 */
export function Magnetic({
  children,
  className,
  strength = 0.3,
  stiffness = 150,
  damping = 15,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness, damping });
  const springY = useSpring(y, { stiffness, damping });

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  }, [x, y, strength]);

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.div>
  );
}

export interface TextRevealProps {
  /** Text to animate */
  text: string;
  className?: string;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Duration per character (seconds) */
  charDuration?: number;
  /** Stagger between characters (seconds) */
  stagger?: number;
}

/**
 * Character-by-character text reveal animation
 */
export function TextReveal({
  text,
  className,
  delay = 0,
  charDuration = 0.4,
  stagger = 0.02,
}: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <span ref={ref} className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, rotateX: -90 }}
          animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{
            duration: charDuration,
            delay: delay + i * stagger,
            ease: [0.215, 0.61, 0.355, 1],
          }}
          style={{ display: 'inline-block', transformOrigin: 'bottom' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

export interface FadeUpProps {
  children: React.ReactNode;
  className?: string;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Animation duration (seconds) */
  duration?: number;
  /** Y offset to animate from */
  offset?: number;
}

/**
 * Fade up animation triggered when in view
 */
export function FadeUp({
  children,
  className,
  delay = 0,
  duration = 0.6,
  offset = 20,
}: FadeUpProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

export interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  /** Delay between children (seconds) */
  staggerDelay?: number;
}

/**
 * Container that staggers children animations
 */
export function Stagger({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  /** Parallax speed multiplier (negative = opposite direction) */
  speed?: number;
}

/**
 * Parallax scroll effect
 */
export function Parallax({
  children,
  className,
  speed = 0.5,
}: ParallaxProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 200]);

  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}

export interface CursorGlowProps {
  /** Glow color (CSS color string) */
  color?: string;
  /** Size of the glow in pixels */
  size?: number;
  /** Opacity of the glow (0-1) */
  opacity?: number;
}

/**
 * Cursor-following glow effect
 */
export function CursorGlow({
  color = 'rgba(255,215,0,0.03)',
  size = 500,
  opacity = 1,
}: CursorGlowProps) {
  const mouse = useMouse();
  const smoothX = useSpring(mouse.x, { stiffness: 100, damping: 30 });
  const smoothY = useSpring(mouse.y, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="fixed pointer-events-none z-[100] rounded-full"
      style={{
        x: smoothX,
        y: smoothY,
        width: size,
        height: size,
        translateX: '-50%',
        translateY: '-50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
        opacity,
      }}
    />
  );
}

export interface NoiseOverlayProps {
  className?: string;
  opacity?: number;
}

/**
 * Noise/grain texture overlay
 */
export function NoiseOverlay({ className, opacity = 0.015 }: NoiseOverlayProps) {
  return (
    <div
      className={cn('fixed inset-0 pointer-events-none z-[99]', className)}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

// Re-export framer-motion for convenience
export { motion, useScroll, useTransform, useSpring, useMotionValue, useInView };
export type { MotionProps };

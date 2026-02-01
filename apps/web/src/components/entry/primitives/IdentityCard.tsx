'use client';

/**
 * IdentityCard - Profile Preview with Gold Border Animation
 *
 * Shows the user's identity at the arrival moment:
 * - @handle (gold, hero element)
 * - Name
 * - Major & Year
 * - Interests (gold chips)
 *
 * Gold border draws sequentially over 1.2s
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GOLD, DURATION, EASE_PREMIUM, SPRING_BOUNCY } from '../motion/entry-motion';

interface IdentityCardProps {
  handle: string;
  firstName: string;
  lastName?: string;
  major?: string;
  graduationYear?: number | null;
  interests?: string[];
  /** Whether to animate in */
  animate?: boolean;
  /** Delay before animation starts */
  delay?: number;
  className?: string;
}

// Border draw duration
const BORDER_DRAW_DURATION = 1.2;

// Border variants - draws sequentially: top → right → bottom → left
const borderVariants = {
  top: {
    initial: { scaleX: 0 },
    animate: {
      scaleX: 1,
      transition: {
        duration: BORDER_DRAW_DURATION * 0.25,
        ease: EASE_PREMIUM,
      },
    },
  },
  right: {
    initial: { scaleY: 0 },
    animate: {
      scaleY: 1,
      transition: {
        duration: BORDER_DRAW_DURATION * 0.25,
        delay: BORDER_DRAW_DURATION * 0.25,
        ease: EASE_PREMIUM,
      },
    },
  },
  bottom: {
    initial: { scaleX: 0 },
    animate: {
      scaleX: 1,
      transition: {
        duration: BORDER_DRAW_DURATION * 0.25,
        delay: BORDER_DRAW_DURATION * 0.5,
        ease: EASE_PREMIUM,
      },
    },
  },
  left: {
    initial: { scaleY: 0 },
    animate: {
      scaleY: 1,
      transition: {
        duration: BORDER_DRAW_DURATION * 0.25,
        delay: BORDER_DRAW_DURATION * 0.75,
        ease: EASE_PREMIUM,
      },
    },
  },
};

// Content reveal after border completes
const contentVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.gentle,
      ease: EASE_PREMIUM,
      staggerChildren: 0.1,
    },
  },
};

const contentChildVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: EASE_PREMIUM,
    },
  },
};

export function IdentityCard({
  handle,
  firstName,
  lastName,
  major,
  graduationYear,
  interests = [],
  animate = true,
  delay = 0,
  className,
}: IdentityCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  // Calculate content delay (after border draws)
  const contentDelay = delay + BORDER_DRAW_DURATION;

  if (shouldReduceMotion) {
    return (
      <div
        className={cn(
          'relative p-6 rounded-2xl border',
          className
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
          borderColor: `${GOLD.primary}33`,
        }}
      >
        <CardContent
          handle={handle}
          fullName={fullName}
          major={major}
          graduationYear={graduationYear}
          interests={interests}
        />
      </div>
    );
  }

  return (
    <motion.div
      className={cn('relative p-6 rounded-2xl', className)}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={animate ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        ...SPRING_BOUNCY,
        delay,
      }}
    >
      {/* Animated gold border - draws sequentially */}
      <BorderDraw animate={animate} delay={delay} />

      {/* Glow effect behind card */}
      <motion.div
        className="absolute -inset-4 rounded-3xl pointer-events-none -z-10"
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: 1 } : {}}
        transition={{ duration: DURATION.slow, delay: delay + BORDER_DRAW_DURATION }}
        style={{
          background: `radial-gradient(ellipse 100% 80% at 50% 0%, ${GOLD.glowSubtle}, transparent 60%)`,
        }}
      />

      {/* Content - reveals after border */}
      <motion.div
        variants={contentVariants}
        initial="initial"
        animate={animate ? 'animate' : 'initial'}
        transition={{ delay: contentDelay }}
      >
        <CardContent
          handle={handle}
          fullName={fullName}
          major={major}
          graduationYear={graduationYear}
          interests={interests}
          animated
        />
      </motion.div>
    </motion.div>
  );
}

// Border draw component
function BorderDraw({ animate, delay }: { animate: boolean; delay: number }) {
  const borderColor = `${GOLD.primary}33`;
  const glowColor = GOLD.glowSubtle;

  return (
    <>
      {/* Top border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: borderColor,
          boxShadow: `0 0 10px ${glowColor}`,
          transformOrigin: 'left',
        }}
        variants={borderVariants.top}
        initial="initial"
        animate={animate ? 'animate' : 'initial'}
        transition={{ delay }}
      />

      {/* Right border */}
      <motion.div
        className="absolute top-0 right-0 bottom-0 w-px"
        style={{
          background: borderColor,
          boxShadow: `0 0 10px ${glowColor}`,
          transformOrigin: 'top',
        }}
        variants={borderVariants.right}
        initial="initial"
        animate={animate ? 'animate' : 'initial'}
        transition={{ delay }}
      />

      {/* Bottom border */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: borderColor,
          boxShadow: `0 0 10px ${glowColor}`,
          transformOrigin: 'right',
        }}
        variants={borderVariants.bottom}
        initial="initial"
        animate={animate ? 'animate' : 'initial'}
        transition={{ delay }}
      />

      {/* Left border */}
      <motion.div
        className="absolute top-0 left-0 bottom-0 w-px"
        style={{
          background: borderColor,
          boxShadow: `0 0 10px ${glowColor}`,
          transformOrigin: 'bottom',
        }}
        variants={borderVariants.left}
        initial="initial"
        animate={animate ? 'animate' : 'initial'}
        transition={{ delay }}
      />
    </>
  );
}

// Card content component
function CardContent({
  handle,
  fullName,
  major,
  graduationYear,
  interests,
  animated = false,
}: {
  handle: string;
  fullName: string;
  major?: string;
  graduationYear?: number | null;
  interests: string[];
  animated?: boolean;
}) {
  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated ? { variants: contentChildVariants } : {};

  return (
    <>
      {/* Handle - hero element */}
      <Wrapper {...wrapperProps} className="mb-4">
        <span
          className="text-heading font-semibold"
          style={{
            color: GOLD.primary,
            textShadow: `0 0 30px ${GOLD.glowSubtle}`,
          }}
        >
          @{handle}
        </span>
      </Wrapper>

      {/* Name */}
      <Wrapper {...wrapperProps}>
        <p className="text-body-lg text-white font-medium mb-4">
          {fullName}
        </p>
      </Wrapper>

      {/* Major & Year */}
      {(major || graduationYear) && (
        <Wrapper {...wrapperProps} className="flex items-center gap-2 mb-4 text-body text-white/50">
          {major && <span>{major}</span>}
          {major && graduationYear && <span className="text-white/30">·</span>}
          {graduationYear && <span>Class of {graduationYear}</span>}
        </Wrapper>
      )}

      {/* Interests */}
      {interests.length > 0 && (
        <Wrapper {...wrapperProps} className="flex flex-wrap gap-2">
          {interests.map((interest, idx) => (
            <motion.span
              key={interest}
              className="px-2.5 py-1 rounded-full text-label-sm border"
              style={{
                backgroundColor: 'rgba(255, 215, 0, 0.08)',
                borderColor: 'rgba(255, 215, 0, 0.2)',
                color: GOLD.light,
              }}
              initial={animated ? { opacity: 0, scale: 0.9 } : undefined}
              animate={animated ? { opacity: 1, scale: 1 } : undefined}
              transition={animated ? { delay: 0.1 + idx * 0.05, duration: 0.3 } : undefined}
            >
              {interest}
            </motion.span>
          ))}
        </Wrapper>
      )}
    </>
  );
}

IdentityCard.displayName = 'IdentityCard';

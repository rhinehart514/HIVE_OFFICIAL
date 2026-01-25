'use client';

/**
 * Landing Section Layout Primitive
 *
 * Standardized section layout for marketing/landing pages.
 * Combines reveal animations + spacing + dividers into one component.
 *
 * Philosophy:
 * - Generous spacing (py-32) signals confidence
 * - Every section earns visibility through scroll
 * - Animated dividers create visual rhythm
 * - Max-width container for readable line lengths
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';
import { RevealSection } from '../motion/Reveal';
import { AnimatedBorder } from '../motion/Reveal';
import { MOTION } from '../../../tokens/motion';

// ============================================
// LANDING SECTION
// ============================================

export interface LandingSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Vertical spacing. Default: 'generous' (py-32) */
  spacing?: 'tight' | 'base' | 'generous' | 'expansive';
  /** Show animated divider at top. Default: false */
  divider?: boolean;
  /** Max width container. Default: '3xl' (768px) */
  container?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  /** Enable scroll reveal animation. Default: true */
  reveal?: boolean;
  /** Viewport margin for reveal. Default: 'far' */
  revealMargin?: keyof typeof MOTION.viewport;
  /** Horizontal padding. Default: 'px-6' */
  padding?: string;
  /** Render as section or div */
  as?: 'section' | 'div';
}

const SPACING_MAP = {
  tight: 'py-16',
  base: 'py-24',
  generous: 'py-32',
  expansive: 'py-40',
} as const;

const CONTAINER_MAP = {
  sm: 'max-w-sm', // 640px
  md: 'max-w-md', // 768px
  lg: 'max-w-lg', // 1024px
  xl: 'max-w-xl', // 1280px
  '2xl': 'max-w-2xl', // 1536px
  '3xl': 'max-w-3xl', // 768px (actually smaller than xl, designed for reading)
  '4xl': 'max-w-4xl', // 896px
  full: 'max-w-full',
} as const;

/**
 * Standardized landing page section with:
 * - Scroll-triggered reveal animation
 * - Generous vertical spacing
 * - Optional animated top divider
 * - Max-width container for readability
 *
 * @example
 * // Standard section with divider
 * <LandingSection divider spacing="generous">
 *   <h2>Section Title</h2>
 *   <p>Content...</p>
 * </LandingSection>
 *
 * @example
 * // Hero section without divider
 * <LandingSection spacing="expansive" container="4xl" reveal={false}>
 *   <Hero />
 * </LandingSection>
 */
export function LandingSection({
  children,
  className,
  spacing = 'generous',
  divider = false,
  container = '3xl',
  reveal = true,
  revealMargin = 'far',
  padding = 'px-6',
  as = 'section',
}: LandingSectionProps) {
  const content = (
    <>
      {divider && <AnimatedBorder variant="horizontal" className={`absolute top-0 ${padding}`} />}
      <div className={cn('mx-auto', CONTAINER_MAP[container])}>{children}</div>
    </>
  );

  const wrapperClasses = cn('relative', SPACING_MAP[spacing], padding, className);

  if (reveal) {
    return (
      <RevealSection className={wrapperClasses} margin={revealMargin} as={as}>
        {content}
      </RevealSection>
    );
  }

  const Component = as;
  return <Component className={wrapperClasses}>{content}</Component>;
}

// ============================================
// LANDING CONTAINER
// ============================================

export interface LandingContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Max width. Default: '3xl' */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
}

/**
 * Simple max-width container for landing content.
 * Centers content with responsive padding.
 *
 * @example
 * <LandingContainer size="3xl">
 *   <h1>Centered Content</h1>
 * </LandingContainer>
 */
export function LandingContainer({
  children,
  className,
  size = '3xl',
}: LandingContainerProps) {
  return <div className={cn('mx-auto', CONTAINER_MAP[size], className)}>{children}</div>;
}

// ============================================
// LANDING HERO
// ============================================

export interface LandingHeroProps {
  children: React.ReactNode;
  className?: string;
  /** Show scroll indicator. Default: true */
  showScrollIndicator?: boolean;
  /** Scroll indicator text. Default: 'Scroll' */
  scrollText?: string;
}

/**
 * Hero section layout with scroll indicator.
 * Full viewport height, centered content.
 *
 * @example
 * <LandingHero>
 *   <h1>Welcome to HIVE</h1>
 *   <p>Student autonomy infrastructure</p>
 * </LandingHero>
 */
export function LandingHero({
  children,
  className,
  showScrollIndicator = true,
  scrollText = 'Scroll',
}: LandingHeroProps) {
  return (
    <section
      className={cn('min-h-screen flex flex-col justify-center px-6 py-24', className)}
    >
      <div className="mx-auto max-w-3xl">
        {children}

        {showScrollIndicator && (
          <div className="mt-24 flex items-center gap-3">
            <div className="w-px h-8 bg-white/20" />
            <span className="text-label-sm uppercase tracking-wider text-white/20">
              {scrollText}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

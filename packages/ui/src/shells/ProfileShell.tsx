'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { easingArrays } from '@hive/tokens';

/**
 * ProfileShell - The Profile Experience
 *
 * Instagram meets portfolio - Identity as expression
 * For: Profile, space pages, user pages
 * Feel: This is who I am
 */

interface ProfileShellProps {
  children: React.ReactNode;
  /** Hero content (cover image, avatar, name) */
  heroContent?: React.ReactNode;
  /** Hero height */
  heroHeight?: 'sm' | 'md' | 'lg';
  /** Sticky header that appears on scroll */
  stickyHeader?: React.ReactNode;
  /** Show parallax effect on hero */
  parallax?: boolean;
  /** Maximum width of content below hero */
  contentMaxWidth?: 'md' | 'lg' | 'xl';
}

const heroHeightClasses = {
  sm: 'h-32',
  md: 'h-48',
  lg: 'h-64',
};

const contentMaxWidthClasses = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

export function ProfileShell({
  children,
  heroContent,
  heroHeight = 'md',
  stickyHeader,
  parallax = true,
  contentMaxWidth = 'lg',
}: ProfileShellProps) {
  return (
    <div className="min-h-screen bg-[var(--hive-background-primary)]">
      {/* Sticky header - appears on scroll */}
      {stickyHeader && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: easingArrays.default }}
          className="
            sticky top-0 z-50
            backdrop-blur-xl
            bg-[var(--hive-background-primary)]/80
            border-b border-[var(--hive-border-default)]/50
          "
        >
          {stickyHeader}
        </motion.header>
      )}

      {/* Hero section */}
      {heroContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: easingArrays.default }}
          className={`
            relative
            ${heroHeightClasses[heroHeight]}
            bg-[var(--hive-background-secondary)]
            overflow-hidden
          `}
          style={parallax ? { transform: 'translateZ(0)' } : undefined}
        >
          {heroContent}

          {/* Gradient overlay for depth */}
          <div className="
            absolute inset-0
            bg-gradient-to-t from-[var(--hive-background-primary)] via-transparent to-transparent
            pointer-events-none
          " />
        </motion.div>
      )}

      {/* Main content */}
      <main className={`${contentMaxWidthClasses[contentMaxWidth]} mx-auto px-4 pb-8`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: easingArrays.default,
            delay: 0.15,
          }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

// Profile card animation variants
export const profileCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: easingArrays.default,
    },
  },
};

// Stats counter animation
export const statCounterVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
};

export default ProfileShell;

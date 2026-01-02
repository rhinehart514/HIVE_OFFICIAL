'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { easingArrays } from '@hive/tokens';

/**
 * StreamShell - The Stream Experience
 *
 * Social + AI - Intelligent content flow
 * For: Feed, search results, notifications
 * Feel: Information flowing through you
 */

interface StreamShellProps {
  children: React.ReactNode;
  /** Maximum width of content */
  maxWidth?: 'sm' | 'md' | 'lg';
  /** Header content (logo, nav, etc) */
  headerContent?: React.ReactNode;
  /** Show presence indicator */
  showPresence?: boolean;
  /** Online count for presence */
  onlineCount?: number;
  /** Show bottom navigation on mobile */
  showBottomNav?: boolean;
  /** Bottom navigation content */
  bottomNavContent?: React.ReactNode;
}

const maxWidthClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
};

// Stagger container for content reveals
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export function StreamShell({
  children,
  maxWidth = 'md',
  headerContent,
  showPresence = false,
  onlineCount = 0,
  showBottomNav = true,
  bottomNavContent,
}: StreamShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--hive-background-primary)]">
      {/* Quantum header - always there but never in the way */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: easingArrays.default }}
        className="
          sticky top-0 z-50
          backdrop-blur-xl
          bg-[var(--hive-background-primary)]/80
          border-b border-[var(--hive-border-default)]/50
        "
      >
        <div className="px-4 py-3 flex items-center justify-between">
          {headerContent || (
            <div className="flex items-center gap-2">
              <Image
                src="/assets/hive-logo-gold.svg"
                alt="HIVE"
                width={24}
                height={24}
              />
              <span className="font-semibold text-[var(--hive-text-primary)]">
                HIVE
              </span>
            </div>
          )}

          {/* Presence pulse */}
          {showPresence && onlineCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--hive-brand-primary)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--hive-brand-primary)]" />
              </span>
              <span className="text-xs text-[var(--hive-text-tertiary)]">
                {onlineCount} online
              </span>
            </div>
          )}
        </div>
      </motion.header>

      {/* The stream */}
      <main className="flex-1">
        <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 py-6`}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile bottom nav (visible below 1024px) */}
      {showBottomNav && bottomNavContent && (
        <nav className="
          lg:hidden
          sticky bottom-0
          backdrop-blur-xl
          bg-[var(--hive-background-primary)]/80
          border-t border-[var(--hive-border-default)]/50
          pb-safe
        ">
          {bottomNavContent}
        </nav>
      )}
    </div>
  );
}

// Export stagger item for use with children
export const streamItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easingArrays.default,
    },
  },
};

export default StreamShell;

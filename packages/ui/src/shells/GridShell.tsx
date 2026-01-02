'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { easingArrays } from '@hive/tokens';

/**
 * GridShell - The Grid Experience
 *
 * Pinterest/Dribbble energy - Visual discovery
 * For: Explore spaces, tools gallery, search results
 * Feel: Endless possibility
 */

interface GridShellProps {
  children: React.ReactNode;
  /** Header content (title, filters, search) */
  headerContent?: React.ReactNode;
  /** Sidebar filters */
  filtersSidebar?: React.ReactNode;
  /** Show filters sidebar */
  showFilters?: boolean;
  /** Grid columns configuration */
  columns?: 'auto' | 2 | 3 | 4;
  /** Gap between grid items */
  gap?: 'sm' | 'md' | 'lg';
  /** Enable masonry layout */
  masonry?: boolean;
}

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

const columnClasses = {
  auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

// Stagger container for grid items
const gridStaggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

export function GridShell({
  children,
  headerContent,
  filtersSidebar,
  showFilters = false,
  columns = 'auto',
  gap = 'md',
  masonry = false,
}: GridShellProps) {
  return (
    <div className="min-h-screen bg-[var(--hive-background-primary)]">
      {/* Sticky header with filters */}
      {headerContent && (
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: easingArrays.default }}
          className="
            sticky top-0 z-40
            backdrop-blur-xl
            bg-[var(--hive-background-primary)]/80
            border-b border-[var(--hive-border-default)]/50
          "
        >
          {headerContent}
        </motion.header>
      )}

      <div className="flex">
        {/* Filters sidebar */}
        {showFilters && filtersSidebar && (
          <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: easingArrays.default, delay: 0.1 }}
            className="
              hidden lg:block
              w-64
              flex-shrink-0
              border-r border-[var(--hive-border-default)]/50
              p-4
            "
          >
            {filtersSidebar}
          </motion.aside>
        )}

        {/* Grid content */}
        <main className="flex-1 p-4 md:p-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={gridStaggerContainer}
            className={`
              grid
              ${columnClasses[columns]}
              ${gapClasses[gap]}
              ${masonry ? 'auto-rows-[minmax(0,_1fr)]' : ''}
            `}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// Grid item animation variants
export const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easingArrays.default,
    },
  },
};

// Hover effect for grid cards
export const gridCardHoverEffect = {
  scale: 1.02,
  y: -4,
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
  },
};

export default GridShell;

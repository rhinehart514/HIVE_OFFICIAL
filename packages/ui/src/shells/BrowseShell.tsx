'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { easingArrays } from '@hive/tokens';

/**
 * BrowseShell - The Browse/Discovery Experience
 *
 * For: Space discovery, tool gallery, member lists, search results
 * Feel: Exploration, scannable, dense but organized
 *
 * Design Principles:
 * - Header with search/filter always visible
 * - Filter pills for quick filtering
 * - Responsive card grid
 * - Clean visual hierarchy
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  [Header: Title + Search + Filter Toggle]                   │
 * ├─────────────────────────────────────────────────────────────┤
 * │  [Filter Pills]  [Sort ▾]                    [View: ▦ ≡]   │
 * ├─────────────────────────────────────────────────────────────┤
 * │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
 * │  │ Card   │ │ Card   │ │ Card   │ │ Card   │               │
 * │  └────────┘ └────────┘ └────────┘ └────────┘               │
 * │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
 * │  │ Card   │ │ Card   │ │ Card   │ │ Card   │               │
 * │  └────────┘ └────────┘ └────────┘ └────────┘               │
 * └─────────────────────────────────────────────────────────────┘
 *
 * @author HIVE Frontend Team
 * @version 1.0.0 - Phase 2 Layout Consolidation
 */

interface BrowseShellProps {
  children: React.ReactNode;
  /** Header content (title, search) */
  header?: React.ReactNode;
  /** Filter bar content (pills, sort, view toggle) */
  filterBar?: React.ReactNode;
  /** Empty state when no results */
  emptyState?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Number of items (for empty check) */
  itemCount?: number;
  /** Grid columns configuration */
  columns?: 1 | 2 | 3 | 4 | 'auto';
  /** Gap between grid items */
  gap?: 'sm' | 'md' | 'lg';
  /** Content max width */
  maxWidth?: 'lg' | 'xl' | '2xl' | 'full';
  /** Additional className */
  className?: string;
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

const maxWidthClasses = {
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-full',
};

// Stagger animation for grid items
const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Loading skeleton pulse
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="h-48 rounded-xl bg-white/[0.03] animate-pulse"
      />
    ))}
  </div>
);

export function BrowseShell({
  children,
  header,
  filterBar,
  emptyState,
  loading = false,
  itemCount,
  columns = 'auto',
  gap = 'md',
  maxWidth = '2xl',
  className,
}: BrowseShellProps) {
  const showEmpty = !loading && itemCount === 0 && emptyState;

  return (
    <div className={`
      min-h-full bg-[#0A0A0A]
      ${className || ''}
    `}>
      {/* Sticky header */}
      {header && (
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: easingArrays.default }}
          className="
            sticky top-0 z-40
            backdrop-blur-xl
            bg-[#0A0A0A]/90
            border-b border-white/[0.06]
          "
        >
          <div className={`mx-auto ${maxWidthClasses[maxWidth]} px-4 md:px-6`}>
            {header}
          </div>
        </motion.header>
      )}

      {/* Filter bar */}
      {filterBar && (
        <div className="
          sticky top-[57px] z-30
          backdrop-blur-xl
          bg-[#0A0A0A]/80
          border-b border-white/[0.04]
        ">
          <div className={`mx-auto ${maxWidthClasses[maxWidth]} px-4 md:px-6 py-3`}>
            {filterBar}
          </div>
        </div>
      )}

      {/* Main content area */}
      <main className={`mx-auto ${maxWidthClasses[maxWidth]} px-4 md:px-6 py-6`}>
        {loading ? (
          <LoadingSkeleton />
        ) : showEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easingArrays.default }}
            className="py-16"
          >
            {emptyState}
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={gridContainerVariants}
            className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}
          >
            {children}
          </motion.div>
        )}
      </main>
    </div>
  );
}

// Export grid item variants for use with children
export const browseItemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: easingArrays.default,
    },
  },
};

export default BrowseShell;

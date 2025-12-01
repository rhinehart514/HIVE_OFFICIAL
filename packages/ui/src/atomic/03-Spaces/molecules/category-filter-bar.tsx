'use client';

/**
 * CategoryFilterBar - Horizontal scrolling pills with sticky behavior
 *
 * Design Token Compliance:
 * - Background: Glassmorphic with backdrop-blur
 * - Border: Subtle white/10 border
 * - Motion: Shared element transition for active pill (layoutId)
 *
 * Features:
 * - Horizontal scroll with snap
 * - Sticky positioning (optional)
 * - Morphing active indicator between pills
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '../../../lib/utils';
import { springPresets } from '@hive/tokens';
import { CategoryPill } from '../atoms/category-pill';

export interface CategoryFilterItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Optional count */
  count?: number;
}

export interface CategoryFilterBarProps {
  /** Array of categories */
  categories: CategoryFilterItem[];
  /** Currently selected category ID */
  selectedCategory: string;
  /** Callback when category is selected */
  onSelect: (categoryId: string) => void;
  /** Whether the bar should be sticky */
  sticky?: boolean;
  /** Sticky top offset (e.g., "80px" for header height) */
  stickyOffset?: string;
  /** Optional className */
  className?: string;
}

export function CategoryFilterBar({
  categories,
  selectedCategory,
  onSelect,
  sticky = false,
  stickyOffset = '0px',
  className,
}: CategoryFilterBarProps) {
  return (
    <motion.div
      className={cn(
        'relative',
        sticky && 'sticky z-20',
        className
      )}
      style={sticky ? { top: stickyOffset } : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springPresets.snappy}
    >
      {/* Glassmorphic container */}
      <div
        className={cn(
          'flex gap-2 overflow-x-auto pb-1 -mx-6 px-6',
          'scrollbar-hide scroll-smooth snap-x snap-mandatory',
          sticky && [
            'py-3 -my-3',
            'bg-black/80 backdrop-blur-xl',
            'border-b border-neutral-800/50',
          ]
        )}
        role="tablist"
        aria-label="Space categories"
      >
        <AnimatePresence mode="wait">
          {categories.map((category) => (
            <div key={category.id} className="snap-start flex-shrink-0">
              <CategoryPill
                label={category.label}
                icon={category.icon}
                count={category.count}
                isActive={selectedCategory === category.id}
                onSelect={() => onSelect(category.id)}
                layoutId="category-pill-indicator"
              />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Fade edges for scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none" />
    </motion.div>
  );
}

export default CategoryFilterBar;

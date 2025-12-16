'use client';

/**
 * CategoryPill - Filter category pill with active/inactive states
 *
 * ENHANCED for Phase 4: Gold underline active indicator
 *
 * Design Token Compliance:
 * - Colors: Gold underline when active, subtle bg when inactive
 * - Typography: 14px font-medium
 * - Motion: Spring physics for hover/tap, layoutId for morphing indicator
 *
 * Brand Moments:
 * - Active state: Gold underline, white text (gold is precious)
 * - Hover: Scale 1.02 with spring
 * - Tap: Scale 0.98
 *
 * @version 2.0.0 - Gold underline approach
 */

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../../lib/utils';
import { springPresets } from '@hive/tokens';

const pillVariants = cva(
  [
    'relative flex items-center gap-2 px-4 py-2.5 rounded-xl',
    'text-sm font-medium whitespace-nowrap',
    'transition-colors duration-200',
    // White focus ring (not gold)
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
    'cursor-pointer select-none',
  ],
  {
    variants: {
      isActive: {
        // Active: white text, subtle bg, gold underline handled separately
        true: 'text-white bg-[#242424]/50',
        false: 'text-[#A1A1A6] hover:text-white bg-[#141414]/50 hover:bg-[#242424]/50 border border-[#2A2A2A]/50 hover:border-[#3A3A3A]/50',
      },
      size: {
        sm: 'px-3 py-2 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-5 py-3 text-base',
      },
    },
    defaultVariants: {
      isActive: false,
      size: 'md',
    },
  }
);

export interface CategoryPillProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof pillVariants> {
  /** Label text for the pill */
  label: string;
  /** Optional icon (React node) */
  icon?: React.ReactNode;
  /** Whether this pill is selected */
  isActive?: boolean;
  /** Callback when pill is clicked */
  onSelect?: () => void;
  /** Optional count to display */
  count?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** layoutId for shared element transitions */
  layoutId?: string;
  /** Optional className */
  className?: string;
}

export function CategoryPill({
  label,
  icon,
  isActive = false,
  onSelect,
  count,
  size = 'md',
  layoutId,
  className,
  ...motionProps
}: CategoryPillProps) {
  return (
    <motion.button
      onClick={onSelect}
      className={cn(pillVariants({ isActive, size }), className)}
      whileHover={{ scale: isActive ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springPresets.snappy}
      aria-pressed={isActive}
      role="tab"
      {...motionProps}
    >
      {/* Gold underline indicator - uses layoutId for morphing */}
      {isActive && layoutId && (
        <motion.div
          layoutId={layoutId}
          className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#FFD700] rounded-full"
          transition={springPresets.snappy}
        />
      )}

      {/* Static gold underline for non-animated active state */}
      {isActive && !layoutId && (
        <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#FFD700] rounded-full" />
      )}

      {/* Subtle gold glow on active */}
      {isActive && (
        <div
          className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#FFD700] rounded-full blur-sm opacity-50"
          aria-hidden="true"
        />
      )}

      {icon && <span className={cn('flex-shrink-0', isActive && 'text-[#FFD700]')}>{icon}</span>}
      <span className="relative">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            'ml-1 text-xs tabular-nums',
            isActive ? 'text-[#FFD700]/70' : 'text-[#818187]'
          )}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
}

export default CategoryPill;

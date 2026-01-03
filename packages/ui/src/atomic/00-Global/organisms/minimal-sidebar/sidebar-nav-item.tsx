'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import { LABEL_TRANSITION } from './sidebar.constants';
import type { NavItemProps } from './sidebar.types';

/**
 * SidebarNavItem
 * Resend-style minimal nav item with subtle hover states
 */
export function SidebarNavItem({
  icon,
  label,
  isExpanded,
  isActive = false,
  badge,
  disabled = false,
  variant = 'default',
  hasDropdown = false,
  isDropdownOpen = false,
  onClick,
}: NavItemProps) {
  const isGold = variant === 'gold';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'relative w-full flex items-center rounded-lg',
        'transition-colors duration-100',
        isExpanded ? 'px-3 py-2.5 gap-3' : 'px-0 py-2.5 justify-center',
        // Disabled state
        disabled && 'opacity-40 cursor-not-allowed',
        // Default variant
        !disabled && !isGold && !isActive && 'text-[#71717A] hover:text-[#A1A1A6] hover:bg-white/[0.03]',
        !disabled && !isGold && isActive && 'text-[#FAFAFA] bg-white/[0.06]',
        // Gold variant (Build)
        !disabled && isGold && !isActive && 'text-[#FFD700]/70 hover:text-[#FFD700] hover:bg-white/[0.03]',
        !disabled && isGold && isActive && 'text-[#FFD700] bg-white/[0.06]'
      )}
    >
      {/* Active indicator - subtle white bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-white/40"
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {icon}
      </span>

      {/* Label (animated) */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={LABEL_TRANSITION}
            className={cn(
              'text-[14px] flex-1 text-left truncate',
              isActive && 'font-medium'
            )}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge (e.g., "Soon") */}
      <AnimatePresence>
        {badge && isExpanded && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={LABEL_TRANSITION}
            className="px-1.5 py-0.5 text-[10px] font-medium text-[#52525B] bg-white/[0.04] rounded"
          >
            {badge}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Dropdown chevron */}
      <AnimatePresence>
        {hasDropdown && isExpanded && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: isDropdownOpen ? 180 : 0 }}
            exit={{ opacity: 0 }}
            transition={LABEL_TRANSITION}
            className="flex-shrink-0"
          >
            <ChevronIcon className="w-4 h-4 text-[#52525B]" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default SidebarNavItem;

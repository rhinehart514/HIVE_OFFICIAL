'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import { LABEL_TRANSITION } from './sidebar.constants';
import type { ProfileAvatarProps } from './sidebar.types';

/**
 * SidebarProfileAvatar
 * User profile section at bottom of sidebar
 */
export function SidebarProfileAvatar({
  user,
  isExpanded,
  onClick,
}: ProfileAvatarProps) {
  if (!user) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center rounded-lg',
        'transition-colors duration-100',
        'text-[#71717A] hover:text-[#A1A1A6] hover:bg-white/[0.03]',
        isExpanded ? 'px-3 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'
      )}
    >
      {/* Avatar */}
      <div className="relative w-8 h-8 rounded-full bg-white/[0.06] flex-shrink-0 flex items-center justify-center overflow-hidden">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[13px] font-medium text-[#FAFAFA]">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
        {/* Online indicator */}
        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0A0A0A]" />
      </div>

      {/* Name and handle (when expanded) */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={LABEL_TRANSITION}
            className="flex-1 min-w-0 text-left"
          >
            <div className="text-[13px] font-medium text-[#FAFAFA] truncate">
              {user.name}
            </div>
            {user.handle && (
              <div className="text-[11px] text-[#52525B] truncate">
                @{user.handle}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default SidebarProfileAvatar;

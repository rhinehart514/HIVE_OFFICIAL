'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import { DROPDOWN_TRANSITION, MAX_VISIBLE_SPACES } from './sidebar.constants';
import type { SpacesDropdownProps, SidebarSpace } from './sidebar.types';

/**
 * SpacesDropdown
 * Collapsible list of user's spaces
 */
export function SpacesDropdown({
  spaces,
  activeSpaceId,
  onSpaceSelect,
  onBrowseClick,
  isOpen,
  isExpanded,
}: SpacesDropdownProps) {
  const visibleSpaces = spaces.slice(0, MAX_VISIBLE_SPACES);
  const hasMore = spaces.length > MAX_VISIBLE_SPACES;

  // Only show dropdown content when sidebar is expanded
  if (!isExpanded) return null;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={DROPDOWN_TRANSITION}
          className="overflow-hidden"
        >
          <div className="pl-8 pr-2 py-1 space-y-0.5">
            {visibleSpaces.length === 0 ? (
              <div className="py-2 px-2 text-[13px] text-[#52525B]">
                No spaces yet
              </div>
            ) : (
              visibleSpaces.map((space) => (
                <SpaceItem
                  key={space.id}
                  space={space}
                  isActive={space.id === activeSpaceId}
                  onSelect={onSpaceSelect}
                />
              ))
            )}

            {/* View all / Browse link */}
            <button
              onClick={onBrowseClick}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md',
                'text-[13px] text-[#52525B] hover:text-[#A1A1A6] hover:bg-white/[0.03]',
                'transition-colors duration-100'
              )}
            >
              <PlusIcon className="w-4 h-4" />
              <span>{hasMore ? 'View all spaces' : 'Browse spaces'}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SpaceItem({
  space,
  isActive,
  onSelect,
}: {
  space: SidebarSpace;
  isActive: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect?.(space.id)}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md',
        'transition-colors duration-100',
        isActive
          ? 'text-[#FAFAFA] bg-white/[0.06]'
          : 'text-[#71717A] hover:text-[#A1A1A6] hover:bg-white/[0.03]'
      )}
    >
      {/* Space avatar */}
      <div className={cn(
        'w-5 h-5 rounded flex-shrink-0 flex items-center justify-center',
        'bg-white/[0.06] text-[10px] font-medium',
        isActive ? 'text-[#FAFAFA]' : 'text-[#71717A]'
      )}>
        {space.avatar ? (
          <img src={space.avatar} alt="" className="w-full h-full rounded object-cover" />
        ) : (
          space.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Space name */}
      <span className="flex-1 text-[13px] text-left truncate">
        {space.name}
      </span>

      {/* Unread indicator */}
      {space.unreadCount && space.unreadCount > 0 && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] flex-shrink-0" />
      )}
    </button>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

export default SpacesDropdown;

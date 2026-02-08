'use client';

/**
 * BoardItem - Single board row in sidebar
 *
 * States:
 * - Default: subtle text
 * - Hover: light background, shift right
 * - Active: solid background, white text
 * - Unread: gold badge with count
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Hash, MoreVertical, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SPACE_COMPONENTS,
  spaceTypographyClasses,
} from '@hive/tokens';

export interface Board {
  id: string;
  name: string;
  unreadCount?: number;
  isPinned?: boolean;
}

interface BoardItemProps {
  board: Board;
  isActive: boolean;
  isDragging?: boolean;
  showDragHandle?: boolean;
  onClick: () => void;
  onOptionsClick?: () => void;
}

export function BoardItem({
  board,
  isActive,
  isDragging = false,
  showDragHandle = false,
  onClick,
  onOptionsClick,
}: BoardItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const { boardItem } = SPACE_COMPONENTS;

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'w-full rounded-lg',
        'flex items-center',
        'transition-colors duration-150',
        'text-left group',
        isActive
          ? 'bg-white/[0.08] text-white'
          : 'hover:bg-white/[0.04] text-white/60 hover:text-white/80',
        isDragging && 'shadow-lg bg-white/[0.12]'
      )}
      style={{
        height: `${boardItem.height}px`,
        paddingLeft: `${boardItem.paddingX}px`,
        paddingRight: `${boardItem.paddingX}px`,
        gap: `${boardItem.gap}px`,
        borderRadius: `${boardItem.borderRadius}px`,
      }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Drag handle (leaders only, when reordering) */}
      {showDragHandle && (
        <GripVertical
          className={cn(
            'w-3 h-3 flex-shrink-0 cursor-grab',
            'text-white/20 group-hover:text-white/40',
            'transition-colors'
          )}
        />
      )}

      {/* Board icon */}
      <Hash
        className={cn(
          'flex-shrink-0',
          isActive ? 'text-white' : 'text-white/40'
        )}
        style={{ width: `${boardItem.iconSize}px`, height: `${boardItem.iconSize}px` }}
      />

      {/* Board name */}
      <span
        className={cn(
          'flex-1 truncate',
          spaceTypographyClasses.boardName,
          isActive ? 'text-white' : ''
        )}
      >
        {board.name}
      </span>

      {/* Unread badge */}
      {board.unreadCount && board.unreadCount > 0 && !isActive && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'px-1.5 py-0.5 rounded-full',
            'text-[10px] font-semibold',
            'bg-[var(--color-gold)] text-black'
          )}
        >
          {board.unreadCount > 99 ? '99+' : board.unreadCount}
        </motion.span>
      )}

      {/* Options button (on hover) */}
      {onOptionsClick && isHovered && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onOptionsClick();
          }}
          className={cn(
            'p-1 rounded',
            'hover:bg-white/[0.08]',
            'transition-colors'
          )}
          aria-label="Board options"
        >
          <MoreVertical className="w-3.5 h-3.5 text-white/40" />
        </motion.button>
      )}
    </motion.button>
  );
}

BoardItem.displayName = 'BoardItem';

export default BoardItem;

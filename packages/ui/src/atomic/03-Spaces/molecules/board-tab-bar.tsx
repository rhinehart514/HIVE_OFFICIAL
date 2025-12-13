'use client';

/**
 * BoardTabBar - Discord-style channel/board selector for Spaces
 *
 * A horizontal tab bar for switching between boards (channels) within a space.
 * Follows the design system with gold underline for active state,
 * unread badges, and [+] button for leaders.
 *
 * ## Visual Language
 * - Gold underline for active board
 * - Unread count badges
 * - Horizontal scroll on mobile
 * - Icons per board type (#general, event, topic)
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Hash, Calendar, MessageSquare, Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';

// ============================================================
// Types
// ============================================================

export interface BoardData {
  id: string;
  name: string;
  type: 'general' | 'topic' | 'event';
  description?: string;
  linkedEventId?: string;
  messageCount?: number;
  isDefault?: boolean;
  isLocked?: boolean;
}

export interface BoardTabBarProps {
  /** Available boards/channels */
  boards: BoardData[];
  /** Currently active board ID */
  activeBoardId: string;
  /** Unread counts per board (optional) */
  unreadCounts?: Record<string, number>;
  /** Whether user is a space leader (can create boards) */
  isLeader?: boolean;
  /** Callback when board is selected */
  onBoardChange: (boardId: string) => void;
  /** Callback when create board is clicked (leaders only) */
  onCreateBoard?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// Board Type Icons
// ============================================================

const getBoardIcon = (type: BoardData['type']) => {
  switch (type) {
    case 'event':
      return Calendar;
    case 'topic':
      return MessageSquare;
    default:
      return Hash;
  }
};

// ============================================================
// Component
// ============================================================

export function BoardTabBar({
  boards,
  activeBoardId,
  unreadCounts = {},
  isLeader,
  onBoardChange,
  onCreateBoard,
  className,
}: BoardTabBarProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Scroll active board into view on mount
  React.useEffect(() => {
    const activeButton = scrollContainerRef.current?.querySelector('[data-active="true"]');
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeBoardId]);

  if (boards.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative border-b border-neutral-800',
        className
      )}
    >
      {/* Horizontal scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-hide"
      >
        {boards.map((board) => {
          const Icon = getBoardIcon(board.type);
          const isActive = board.id === activeBoardId;
          const unreadCount = unreadCounts[board.id] || 0;

          return (
            <motion.button
              key={board.id}
              data-active={isActive}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onBoardChange(board.id)}
              className={cn(
                'relative flex items-center gap-2 px-3 py-2 rounded-lg',
                'text-sm font-medium whitespace-nowrap transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/40',
                isActive
                  ? 'text-[#FFD700]'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${board.type} board: ${board.name}${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{board.name}</span>

              {/* Unread badge */}
              {unreadCount > 0 && !isActive && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                    'bg-[#FFD700] text-black font-semibold',
                    'min-w-[18px] text-center'
                  )}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}

              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="board-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#FFD700] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}

        {/* Create board button (leaders only) */}
        {isLeader && onCreateBoard && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateBoard}
            className={cn(
              'flex items-center justify-center p-2 rounded-lg',
              'text-neutral-500 hover:text-neutral-300 hover:bg-white/5',
              'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/40'
            )}
            aria-label="Create new board"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Fade edges for scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black to-transparent pointer-events-none" />
    </div>
  );
}

export default BoardTabBar;

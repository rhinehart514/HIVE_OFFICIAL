'use client';

/**
 * BoardTabBar - Discord-style channel/board selector for Spaces
 *
 * Design Direction:
 * - White underline for active board (not gold)
 * - Gold unread count badges
 * - Horizontal scroll on mobile
 * - Icons per board type (#general, event, topic)
 * - Height: 44px
 *
 * @author HIVE Frontend Team
 * @version 2.0.0 - Dark-first design update
 */

import { motion } from 'framer-motion';
import { Hash, Calendar, MessageSquare, Plus } from 'lucide-react';
import * as React from 'react';

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
        // Dark-first design: Subtle border
        'relative border-b border-[#2A2A2A]',
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
                // White focus ring (not gold)
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                isActive
                  // Active: white text (not gold)
                  ? 'text-[#FAFAFA]'
                  // Inactive: subtle text, hover to primary
                  : 'text-[#818187] hover:text-[#FAFAFA] hover:bg-white/[0.04]'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${board.type} board: ${board.name}${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{board.name}</span>

              {/* Unread badge - gold for visibility */}
              {unreadCount > 0 && !isActive && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                    'bg-[#FFD700] text-[#0A0A0A] font-semibold',
                    'min-w-[18px] text-center'
                  )}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}

              {/* Active indicator line - white (not gold) */}
              {isActive && (
                <motion.div
                  layoutId="board-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#FAFAFA] rounded-full"
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
              'text-[#818187] hover:text-[#FAFAFA] hover:bg-white/[0.04]',
              'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
            )}
            aria-label="Create new board"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Fade edges for scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#0A0A0A] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#0A0A0A] to-transparent pointer-events-none" />
    </div>
  );
}

export default BoardTabBar;

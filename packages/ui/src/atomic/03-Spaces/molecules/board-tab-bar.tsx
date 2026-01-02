'use client';

/**
 * BoardTabBar - Minimal channel/board selector for Spaces
 *
 * Design Direction (The Hub - Phase 3):
 * - Tabs feel like navigation (chrome), not content
 * - Subtle white text/indicator (never gold)
 * - Unread shown as small dot (not count badges)
 * - Horizontal scroll on mobile
 * - Height: ~44px, very lightweight
 *
 * @author HIVE Frontend Team
 * @version 3.0.0 - Reduced visual weight for Hub layout
 */

import { motion } from 'framer-motion';
import { Hash, Calendar, MessageSquare, Plus } from 'lucide-react';
import { springPresets } from '@hive/tokens';
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
              whileTap={{ scale: 0.98 }}
              onClick={() => onBoardChange(board.id)}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-2 rounded-lg',
                'text-[13px] font-medium whitespace-nowrap transition-colors duration-150',
                // White focus ring (not gold)
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                isActive
                  // Active: white text (not gold)
                  ? 'text-white/90'
                  // Inactive: very subtle text, hover to brighter
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${board.type} board: ${board.name}${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{board.name}</span>

              {/* Unread indicator - subtle dot */}
              {unreadCount > 0 && !isActive && (
                <span
                  className="ml-0.5 w-1.5 h-1.5 rounded-full bg-white/70"
                  aria-hidden="true"
                />
              )}

              {/* Active indicator line - thin, no glow */}
              {isActive && (
                <motion.div
                  layoutId="board-tab-indicator"
                  className="absolute bottom-0 left-3 right-3 h-[2px] bg-white/80 rounded-full"
                  transition={springPresets.snappy}
                />
              )}
            </motion.button>
          );
        })}

        {/* Create board button (leaders only) */}
        {isLeader && onCreateBoard && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCreateBoard}
            className={cn(
              'flex items-center justify-center p-2 rounded-lg',
              'text-white/30 hover:text-white/60 hover:bg-white/[0.03]',
              'transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
            )}
            aria-label="Create new board"
          >
            <Plus className="w-3.5 h-3.5" />
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

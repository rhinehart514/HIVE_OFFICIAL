'use client';

/**
 * PremiumBoardTabs - ChatGPT-style board/channel navigation
 *
 * Design Philosophy:
 * - Clean pill-style tabs with subtle glass treatment
 * - Gold active indicator with smooth layout animation
 * - Unread badges with gold accent
 * - Horizontal scroll with elegant fade edges
 * - Add button for leaders
 *
 * Inspired by: ChatGPT conversation tabs, Discord channel list, Linear tabs
 *
 * @author HIVE Frontend Team
 * @version 1.0.0 - Premium redesign
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion, LayoutGroup } from 'framer-motion';
import { Plus, Hash, Megaphone, Calendar, MessageSquare, Settings } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { premium } from '../../../lib/premium-design';

// ============================================================
// Types
// ============================================================

export type BoardType = 'general' | 'announcements' | 'events' | 'discussion' | 'custom';

export interface BoardTab {
  /** Board ID */
  id: string;
  /** Display name */
  name: string;
  /** Board type for icon */
  type: BoardType;
  /** Whether this is the default board */
  isDefault?: boolean;
  /** Unread message count */
  unreadCount?: number;
  /** Whether there's new activity */
  hasActivity?: boolean;
}

export interface PremiumBoardTabsProps {
  /** Available boards */
  boards: BoardTab[];
  /** Currently active board ID */
  activeBoardId: string;
  /** Called when board changes */
  onBoardChange: (boardId: string) => void;
  /** Is current user a leader? */
  isLeader?: boolean;
  /** Called when add board is clicked */
  onAddBoard?: () => void;
  /** Called when settings is clicked */
  onSettings?: () => void;
  /** Show settings button */
  showSettings?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================
// Board Icons
// ============================================================

const BOARD_ICONS: Record<BoardType, React.ComponentType<{ className?: string }>> = {
  general: Hash,
  announcements: Megaphone,
  events: Calendar,
  discussion: MessageSquare,
  custom: Hash,
};

// ============================================================
// Motion Variants
// ============================================================

const tabContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const tabVariants = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
};

// ============================================================
// Tab Button Sub-component
// ============================================================

interface TabButtonProps {
  board: BoardTab;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ board, isActive, onClick }: TabButtonProps) {
  const Icon = BOARD_ICONS[board.type];

  return (
    <motion.button
      variants={tabVariants}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative px-4 py-2 rounded-lg',
        'flex items-center gap-2',
        'text-[14px] font-medium whitespace-nowrap',
        'transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
        isActive
          ? 'text-[#FAFAFA]'
          : 'text-[#6B6B70] hover:text-[#9A9A9F]'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Icon */}
      <Icon className="w-4 h-4 flex-shrink-0" />

      {/* Name */}
      <span>{board.name}</span>

      {/* Unread badge */}
      <AnimatePresence>
        {board.unreadCount && board.unreadCount > 0 && !isActive && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={premium.motion.spring.bouncy}
            className={cn(
              'min-w-[18px] h-[18px] px-1.5',
              'flex items-center justify-center',
              'text-[10px] font-bold text-black',
              'bg-[#FFD700] rounded-full'
            )}
          >
            {board.unreadCount > 99 ? '99+' : board.unreadCount}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Activity dot (no count, just new activity) */}
      <AnimatePresence>
        {board.hasActivity && !board.unreadCount && !isActive && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="w-2 h-2 bg-[#FFD700] rounded-full shadow-[0_0_6px_#FFD700]"
          />
        )}
      </AnimatePresence>

      {/* Active indicator (underline) */}
      {isActive && (
        <motion.span
          layoutId="activeBoardIndicator"
          transition={premium.motion.spring.snappy}
          className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#FFD700] rounded-full"
        />
      )}
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function PremiumBoardTabs({
  boards,
  activeBoardId,
  onBoardChange,
  isLeader = false,
  onAddBoard,
  onSettings,
  showSettings = false,
  className,
}: PremiumBoardTabsProps) {
  const shouldReduceMotion = useReducedMotion();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = React.useState(false);
  const [showRightFade, setShowRightFade] = React.useState(false);

  // Check scroll position for fade indicators
  const checkScrollPosition = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftFade(scrollLeft > 5);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  React.useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [checkScrollPosition, boards]);

  // Scroll active board into view
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const activeTab = container.querySelector(`[data-board-id="${activeBoardId}"]`);
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeBoardId]);

  return (
    <div
      className={cn(
        'relative flex items-center',
        'border-b border-white/[0.06]',
        'bg-[rgba(10,10,10,0.60)]',
        className
      )}
    >
      {/* Left fade */}
      <AnimatePresence>
        {showLeftFade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none',
              'bg-gradient-to-r from-[#0A0A0A] to-transparent'
            )}
          />
        )}
      </AnimatePresence>

      {/* Scrollable tab container */}
      <LayoutGroup>
        <motion.div
          ref={scrollContainerRef}
          variants={shouldReduceMotion ? {} : tabContainerVariants}
          initial="initial"
          animate="animate"
          onScroll={checkScrollPosition}
          className={cn(
            'flex items-center gap-1',
            'overflow-x-auto scrollbar-hide',
            'px-4 py-2',
            'flex-1'
          )}
        >
          {boards.map((board) => (
            <div key={board.id} data-board-id={board.id}>
              <TabButton
                board={board}
                isActive={board.id === activeBoardId}
                onClick={() => onBoardChange(board.id)}
              />
            </div>
          ))}

          {/* Add board button (leader only) */}
          {isLeader && onAddBoard && (
            <motion.button
              variants={tabVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddBoard}
              className={cn(
                'flex items-center justify-center',
                'w-9 h-9 ml-1 rounded-lg',
                'text-[#4A4A4F] hover:text-[#9A9A9F]',
                'bg-white/[0.03] hover:bg-white/[0.06]',
                'border border-white/[0.06] hover:border-white/[0.10]',
                'transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
              )}
              aria-label="Add new board"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          )}
        </motion.div>
      </LayoutGroup>

      {/* Right fade */}
      <AnimatePresence>
        {showRightFade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none',
              'bg-gradient-to-l from-[#0A0A0A] to-transparent',
              showSettings && isLeader && 'right-12'
            )}
          />
        )}
      </AnimatePresence>

      {/* Settings button */}
      {showSettings && isLeader && onSettings && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSettings}
          className={cn(
            'flex items-center justify-center',
            'w-9 h-9 mr-3 rounded-lg flex-shrink-0',
            'text-[#4A4A4F] hover:text-[#9A9A9F]',
            'hover:bg-white/[0.04]',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
          )}
          aria-label="Board settings"
        >
          <Settings className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}

export default PremiumBoardTabs;

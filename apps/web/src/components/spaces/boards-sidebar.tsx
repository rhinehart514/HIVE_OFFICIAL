'use client';

/**
 * BoardsSidebar - Always-visible board navigation
 *
 * Replaces the horizontal BoardTabs with a vertical sidebar
 * for better information architecture in the unified space view.
 *
 * Features:
 * - Always visible on desktop (collapses to bottom sheet on mobile)
 * - Board list with active state
 * - Add board button (leaders only)
 * - Unread indicators per board
 * - Drag-to-reorder (leaders only)
 *
 * @version 1.0.0 - Homebase Redesign (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  HashtagIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  Bars3Icon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Text } from '@hive/ui/design-system/primitives';
import { MOTION } from '@hive/tokens';
import { SidebarToolSection } from './sidebar-tool-section';
import type { PlacedToolDTO } from '@/hooks/use-space-tools';

// ============================================================
// Helpers
// ============================================================

function formatEventTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    if (isToday) return `Today ${timeStr}`;
    if (isTomorrow) return `Tomorrow ${timeStr}`;

    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayStr} ${timeStr}`;
  } catch {
    return 'TBD';
  }
}

// ============================================================
// Types
// ============================================================

export interface Board {
  id: string;
  name: string;
  unreadCount?: number;
  isPinned?: boolean;
}

/** Upcoming event for sidebar display */
export interface SidebarEvent {
  id: string;
  title: string;
  startDate: string;
  rsvpCount: number;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
}

export interface BoardsSidebarProps {
  /** List of boards */
  boards: Board[];
  /** Currently active board ID */
  activeBoard: string;
  /** Change board handler */
  onBoardChange: (boardId: string) => void;
  /** Create new board handler (leaders only) */
  onCreateBoard?: () => void;
  /** Reorder boards handler (leaders only) */
  onReorderBoards?: (boardIds: string[]) => void;
  /** Board options handler (leaders only) */
  onBoardOptions?: (boardId: string) => void;
  /** Mobile mode */
  isMobile?: boolean;
  /** Whether sidebar is collapsed */
  isCollapsed?: boolean;
  /** Toggle collapse */
  onToggleCollapse?: () => void;
  /** Position of sidebar - affects border and flex order */
  position?: 'left' | 'right';
  // ============================================================
  // Events Section (Phase 3 redesign)
  // ============================================================
  /** Upcoming events to display in "NEXT UP" section */
  upcomingEvents?: SidebarEvent[];
  /** Event click handler */
  onEventClick?: (eventId: string) => void;
  /** Event RSVP handler */
  onEventRsvp?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void;
  // ============================================================
  // Tool Integration (HiveLab Sprint 1)
  // ============================================================
  /** Tools placed in sidebar */
  sidebarTools?: PlacedToolDTO[];
  /** Whether tools are loading */
  isLoadingTools?: boolean;
  /** Whether user is a leader (can add tools) */
  isLeader?: boolean;
  /** Currently active tool ID */
  activeToolId?: string;
  /** Handler when a tool is clicked */
  onToolClick?: (tool: PlacedToolDTO) => void;
  /** Handler for "Run" tool action */
  onToolRun?: (tool: PlacedToolDTO) => void;
  /** Handler for "View Full" tool action */
  onToolViewFull?: (tool: PlacedToolDTO) => void;
  /** Handler for "Add Tool" action */
  onAddTool?: () => void;
}

// ============================================================
// Board Item
// ============================================================

interface BoardItemProps {
  board: Board;
  isActive: boolean;
  canReorder: boolean;
  onClick: () => void;
  onOptions?: () => void;
}

function BoardItem({
  board,
  isActive,
  canReorder,
  onClick,
  onOptions,
}: BoardItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group w-full px-3 py-2 rounded-lg',
        'flex items-center gap-2',
        'transition-all duration-150',
        'text-left',
        isActive
          ? 'bg-white/[0.08] text-white'
          : 'hover:bg-white/[0.04] text-white/60 hover:text-white/80'
      )}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      // Reorder props
      {...(canReorder && {
        whileDrag: { scale: 1.05 },
        dragConstraints: { top: 0, bottom: 0 },
      })}
    >
      {/* Board Icon */}
      <HashtagIcon
        className={cn(
          'w-4 h-4 flex-shrink-0',
          isActive ? 'text-white' : 'text-white/40'
        )}
      />

      {/* Board Name */}
      <Text
        size="sm"
        weight={isActive ? 'medium' : 'normal'}
        className="flex-1 truncate"
      >
        {board.name}
      </Text>

      {/* Unread Badge */}
      {board.unreadCount && board.unreadCount > 0 && !isActive && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="px-1.5 py-0.5 text-label-xs font-medium bg-[var(--color-accent-gold,#FFD700)] text-black rounded-full"
        >
          {board.unreadCount > 99 ? '99+' : board.unreadCount}
        </motion.span>
      )}

      {/* Options Button (leaders only, on hover) */}
      {onOptions && isHovered && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onOptions();
          }}
          className="p-1 rounded hover:bg-white/[0.08] transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-label="Board options"
        >
          <EllipsisVerticalIcon className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />
        </motion.button>
      )}
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function BoardsSidebar({
  boards,
  activeBoard,
  onBoardChange,
  onCreateBoard,
  onReorderBoards,
  onBoardOptions,
  isMobile = false,
  isCollapsed = false,
  onToggleCollapse,
  position = 'left',
  // Events props (Phase 3 redesign)
  upcomingEvents = [],
  onEventClick,
  onEventRsvp: _onEventRsvp,
  // Tool props (HiveLab Sprint 1)
  sidebarTools = [],
  isLoadingTools = false,
  isLeader = false,
  activeToolId,
  onToolClick,
  onToolRun,
  onToolViewFull,
  onAddTool,
}: BoardsSidebarProps) {
  const canReorder = !!onReorderBoards;
  const [localBoards, setLocalBoards] = React.useState(boards);

  // Sync local boards with prop changes
  React.useEffect(() => {
    setLocalBoards(boards);
  }, [boards]);

  const handleReorder = (newOrder: Board[]) => {
    setLocalBoards(newOrder);
    if (onReorderBoards) {
      onReorderBoards(newOrder.map((b) => b.id));
    }
  };

  // Mobile: Bottom sheet
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-ground)] border-t border-white/[0.06] p-4">
        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2 w-full mb-3 text-white/60"
        >
          <Bars3Icon className="w-5 h-5" />
          <Text size="sm" weight="medium">
            Boards
          </Text>
        </button>

        {/* Collapsed: Show active board only */}
        <AnimatePresence>
          {isCollapsed ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <BoardItem
                board={boards.find((b) => b.id === activeBoard) || boards[0]}
                isActive={true}
                canReorder={false}
                onClick={() => {}}
              />
            </motion.div>
          ) : (
            // Expanded: Show all boards
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 max-h-64 overflow-y-auto"
            >
              {localBoards.map((board) => (
                <BoardItem
                  key={board.id}
                  board={board}
                  isActive={board.id === activeBoard}
                  canReorder={false}
                  onClick={() => {
                    onBoardChange(board.id);
                    if (onToggleCollapse) onToggleCollapse();
                  }}
                  onOptions={
                    onBoardOptions ? () => onBoardOptions(board.id) : undefined
                  }
                />
              ))}

              {/* Add Board Button */}
              {onCreateBoard && (
                <button
                  onClick={onCreateBoard}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg',
                    'flex items-center gap-2',
                    'text-white/40 hover:text-white/60',
                    'hover:bg-white/[0.04]',
                    'transition-all duration-150'
                  )}
                >
                  <PlusIcon className="w-4 h-4" />
                  <Text size="sm">Add board</Text>
                </button>
              )}

              {/* Pinned Tools Section (Mobile) */}
              <SidebarToolSection
                tools={sidebarTools}
                isLoading={isLoadingTools}
                isLeader={isLeader}
                activeToolId={activeToolId}
                onToolClick={onToolClick}
                onToolRun={onToolRun}
                onToolViewFull={onToolViewFull}
                onAddTool={onAddTool}
                defaultCollapsed={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop: Vertical sidebar
  // Position determines border side and animation direction
  const positionStyles = {
    left: {
      border: 'border-r border-white/[0.06] pr-4',
      initialX: -12,
    },
    right: {
      border: 'border-l border-white/[0.06] pl-4 order-last',
      initialX: 40,
    },
  };

  // Collapsed state: Show only icon strip
  if (isCollapsed && !isMobile) {
    return (
      <motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: MOTION.ease.premium }}
        className={cn(
          'flex flex-col items-center w-12 flex-shrink-0 h-full py-2',
          position === 'left' ? 'border-r border-white/[0.06]' : 'border-l border-white/[0.06] order-last'
        )}
      >
        {/* Expand button */}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors mb-3"
          title="Expand sidebar"
        >
          {position === 'left' ? (
            <ChevronRightIcon className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4 text-white/40" />
          )}
        </button>

        {/* Board icons */}
        <div className="space-y-2">
          {localBoards.slice(0, 5).map((board) => (
            <button
              key={board.id}
              onClick={() => onBoardChange(board.id)}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                board.id === activeBoard
                  ? 'bg-white/[0.08] text-white'
                  : 'hover:bg-white/[0.04] text-white/50'
              )}
              title={board.name}
            >
              <HashtagIcon className="w-4 h-4" />
              {board.unreadCount && board.unreadCount > 0 && board.id !== activeBoard && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--color-gold)]" />
              )}
            </button>
          ))}
        </div>

        {/* Events indicator */}
        {upcomingEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.02]">
              <CalendarIcon className="w-4 h-4 text-[var(--color-gold)]/60" />
            </div>
          </div>
        )}
      </motion.aside>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: positionStyles[position].initialX }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: MOTION.ease.premium }}
      className={cn(
        'flex flex-col w-56 flex-shrink-0 h-full',
        positionStyles[position].border
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Text
          size="xs"
          weight="medium"
          className="uppercase tracking-wider text-white/40"
        >
          Boards
        </Text>
        <div className="flex items-center gap-1">
          {onCreateBoard && (
            <button
              onClick={onCreateBoard}
              className="p-1 rounded hover:bg-white/[0.06] transition-colors"
              title="Add board"
            >
              <PlusIcon className="w-4 h-4 text-white/40 hover:text-white/60" />
            </button>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-white/[0.06] transition-colors"
              title="Collapse sidebar"
            >
              {position === 'left' ? (
                <ChevronLeftIcon className="w-4 h-4 text-white/40 hover:text-white/60" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-white/40 hover:text-white/60" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Board List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {canReorder ? (
          // Reorderable list (leaders)
          <Reorder.Group
            axis="y"
            values={localBoards}
            onReorder={handleReorder}
            className="space-y-1"
          >
            {localBoards.map((board) => (
              <Reorder.Item key={board.id} value={board} dragListener={false}>
                <BoardItem
                  board={board}
                  isActive={board.id === activeBoard}
                  canReorder={true}
                  onClick={() => onBoardChange(board.id)}
                  onOptions={
                    onBoardOptions ? () => onBoardOptions(board.id) : undefined
                  }
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          // Static list (members)
          <>
            {localBoards.map((board) => (
              <BoardItem
                key={board.id}
                board={board}
                isActive={board.id === activeBoard}
                canReorder={false}
                onClick={() => onBoardChange(board.id)}
                onOptions={
                  onBoardOptions ? () => onBoardOptions(board.id) : undefined
                }
              />
            ))}
          </>
        )}

        {/* NEXT UP Events Section (Phase 3 redesign) */}
        {upcomingEvents.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <Text
              size="xs"
              weight="medium"
              className="uppercase tracking-wider text-white/40 mb-3 px-1"
            >
              Next Up
            </Text>
            <div className="space-y-2">
              {upcomingEvents.slice(0, 3).map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick?.(event.id)}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg',
                    'text-left',
                    'bg-white/[0.02] hover:bg-white/[0.04]',
                    'border border-white/[0.04] hover:border-white/[0.08]',
                    'transition-all duration-150'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <CalendarIcon className="w-4 h-4 text-[var(--color-gold)]/60 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Text size="sm" weight="medium" className="text-white/90 truncate">
                        {event.title}
                      </Text>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Text size="xs" className="text-white/40">
                          {formatEventTime(event.startDate)}
                        </Text>
                        <span className="flex items-center gap-1">
                          <UserGroupIcon className="w-3 h-3 text-white/30" />
                          <Text size="xs" className="text-white/40">
                            {event.rsvpCount}
                          </Text>
                        </span>
                      </div>
                    </div>
                    {event.userRsvp === 'going' && (
                      <span className="px-1.5 py-0.5 text-label-xs font-medium bg-[var(--color-gold)]/[0.12] text-[var(--color-gold)]/80 rounded">
                        Going
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pinned Tools Section (HiveLab Sprint 1) */}
        <SidebarToolSection
          tools={sidebarTools}
          isLoading={isLoadingTools}
          isLeader={isLeader}
          activeToolId={activeToolId}
          onToolClick={onToolClick}
          onToolRun={onToolRun}
          onToolViewFull={onToolViewFull}
          onAddTool={onAddTool}
        />
      </div>

      {/* Add Board Button (desktop footer) */}
      {onCreateBoard && (
        <motion.button
          onClick={onCreateBoard}
          className={cn(
            'mt-4 w-full px-3 py-2 rounded-lg',
            'flex items-center gap-2',
            'text-white/40 hover:text-white/60',
            'hover:bg-white/[0.04]',
            'transition-all duration-150',
            'border border-dashed border-white/[0.06] hover:border-white/[0.12]'
          )}
          whileHover={{ opacity: 0.96 }}
          whileTap={{ scale: 0.98 }}
        >
          <PlusIcon className="w-4 h-4" />
          <Text size="sm">Add board</Text>
        </motion.button>
      )}
    </motion.aside>
  );
}

export default BoardsSidebar;

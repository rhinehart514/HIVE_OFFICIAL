'use client';

/**
 * BoardTabs Component
 *
 * Board navigation for Space pages with unread indicators and keyboard hints.
 * Built on top of Tabs primitive but specialized for the 60/40 space layout.
 *
 * Design Notes:
 * - Hash prefix (#general) for board names
 * - Gold dot for unread (within gold budget - notifications are "life")
 * - Keyboard hints shown on hover (⌘1-9)
 * - Add board button for leaders
 * - Horizontal scroll on overflow
 *
 * LOCKED DECISIONS (inherited from Tabs):
 * - Glass pill active indicator
 * - Spring slide animation
 * - White focus rings
 */

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Button } from '../primitives/Button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../primitives/Tooltip';

// ============================================
// CONSTANTS
// ============================================

// LOCKED: Glass pill surface for active tab
const glassPillSurface = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
};

// LOCKED: Spring animation config
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// ============================================
// CVA VARIANTS
// ============================================

const boardTabsContainerVariants = cva(
  [
    'flex items-center gap-1',
    'px-4 py-2',
    'border-b border-white/[0.06]',
    'overflow-x-auto scrollbar-none',
    // Scroll shadows
    '[mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-10',
        default: 'h-12',
        lg: 'h-14',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const boardTabTriggerVariants = cva(
  [
    'relative',
    'inline-flex items-center gap-1.5',
    'px-3 py-1.5',
    'rounded-full',
    'text-sm font-medium',
    'transition-colors duration-150',
    'text-white/50 hover:text-white/70',
    'data-[state=active]:text-white',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000]',
    'disabled:pointer-events-none disabled:opacity-50',
    'whitespace-nowrap',
    'group',
  ].join(' ')
);

// ============================================
// TYPES
// ============================================

export interface Board {
  id: string;
  name: string;
  /** Unread message count */
  unreadCount?: number;
  /** Is this the default board? */
  isDefault?: boolean;
}

export interface BoardTabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof boardTabsContainerVariants> {
  /** Array of boards to display */
  boards: Board[];
  /** Currently active board ID */
  activeBoard: string;
  /** Callback when board changes */
  onBoardChange: (boardId: string) => void;
  /** Callback when add board is clicked (leaders only) */
  onAddBoard?: () => void;
  /** Whether add board button should be shown */
  canAddBoard?: boolean;
  /** Show keyboard shortcuts on hover */
  showShortcuts?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

const BoardTabs = React.forwardRef<HTMLDivElement, BoardTabsProps>(
  (
    {
      className,
      size,
      boards,
      activeBoard,
      onBoardChange,
      onAddBoard,
      canAddBoard = false,
      showShortcuts = true,
      ...props
    },
    ref
  ) => {
    const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);
    const listRef = React.useRef<HTMLDivElement>(null);

    // Track active tab dimensions for sliding indicator
    const [activeTabRect, setActiveTabRect] = React.useState<{
      width: number;
      left: number;
    } | null>(null);

    // Update active tab rect when active board changes
    React.useEffect(() => {
      if (listRef.current) {
        const activeElement = listRef.current.querySelector(
          `[data-state="active"]`
        ) as HTMLElement;
        if (activeElement) {
          const containerRect = listRef.current.getBoundingClientRect();
          const elementRect = activeElement.getBoundingClientRect();
          setActiveTabRect({
            width: elementRect.width,
            left: elementRect.left - containerRect.left + listRef.current.scrollLeft,
          });
        }
      }
    }, [activeBoard]);

    return (
      <TooltipProvider delayDuration={300}>
        <TabsPrimitive.Root
          value={activeBoard}
          onValueChange={onBoardChange}
          asChild
        >
          <div
            ref={ref}
            className={cn(boardTabsContainerVariants({ size }), className)}
            {...props}
          >
            <TabsPrimitive.List
              ref={listRef}
              className="relative flex items-center gap-1"
            >
              {/* Sliding active indicator */}
              {activeTabRect && (
                <motion.div
                  className="absolute inset-y-0 rounded-full pointer-events-none"
                  style={{
                    ...glassPillSurface,
                    width: activeTabRect.width,
                    left: activeTabRect.left,
                  }}
                  layoutId="boardTabIndicator"
                  transition={springConfig}
                />
              )}

              {boards.map((board, index) => {
                const shortcutKey = index < 9 ? `⌘${index + 1}` : null;
                const hasUnread = (board.unreadCount ?? 0) > 0;

                return (
                  <Tooltip key={board.id}>
                    <TooltipTrigger asChild>
                      <TabsPrimitive.Trigger
                        value={board.id}
                        className={cn(boardTabTriggerVariants())}
                        onMouseEnter={() => setHoveredTab(board.id)}
                        onMouseLeave={() => setHoveredTab(null)}
                      >
                        {/* Hash prefix */}
                        <span className="text-white/30">#</span>

                        {/* Board name */}
                        <span>{board.name}</span>

                        {/* Unread indicator (gold dot - within budget) */}
                        {hasUnread && (
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              'bg-[var(--color-accent-gold)]',
                              'animate-pulse'
                            )}
                            aria-label={`${board.unreadCount} unread`}
                          />
                        )}

                        {/* Keyboard shortcut hint (shown on hover) */}
                        {showShortcuts && shortcutKey && hoveredTab === board.id && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={cn(
                              'ml-1 px-1 py-0.5',
                              'text-label-xs font-mono',
                              'text-white/30',
                              'bg-white/5 rounded',
                            )}
                          >
                            {shortcutKey}
                          </motion.span>
                        )}
                      </TabsPrimitive.Trigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {board.name}
                      {hasUnread && ` · ${board.unreadCount} unread`}
                      {shortcutKey && ` · ${shortcutKey}`}
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* Add board button */}
              {canAddBoard && onAddBoard && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-7 w-7 p-0 rounded-full"
                      onClick={onAddBoard}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add board</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Add board
                  </TooltipContent>
                </Tooltip>
              )}
            </TabsPrimitive.List>

            {/* Keyboard shortcut hint (always visible, right side) */}
            {showShortcuts && boards.length > 0 && (
              <div className="ml-auto pl-4 flex-shrink-0">
                <span className="text-label-xs font-mono text-white/20">
                  ⌘1-{Math.min(boards.length, 9)}
                </span>
              </div>
            )}
          </div>
        </TabsPrimitive.Root>
      </TooltipProvider>
    );
  }
);

BoardTabs.displayName = 'BoardTabs';

// ============================================
// SKELETON
// ============================================

interface BoardTabsSkeletonProps {
  boardCount?: number;
  className?: string;
}

const BoardTabsSkeleton: React.FC<BoardTabsSkeletonProps> = ({
  boardCount = 4,
  className,
}) => {
  return (
    <div className={cn(boardTabsContainerVariants(), className)}>
      <div className="flex items-center gap-2">
        {Array.from({ length: boardCount }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-7 rounded-full bg-white/[0.06] animate-pulse',
              i === 0 ? 'w-20' : 'w-16'
            )}
          />
        ))}
        <div className="h-7 w-7 rounded-full bg-white/[0.04] animate-pulse" />
      </div>
    </div>
  );
};

BoardTabsSkeleton.displayName = 'BoardTabsSkeleton';

// ============================================
// EXPORTS
// ============================================

export {
  BoardTabs,
  BoardTabsSkeleton,
  boardTabsContainerVariants,
  boardTabTriggerVariants,
};

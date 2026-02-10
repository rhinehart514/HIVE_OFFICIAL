'use client';

/**
 * MainContent - Main content area shell
 *
 * Contains:
 * - Board header (current board name, search, actions)
 * - Scrollable message feed
 * - Unread divider
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { spaceMotionVariants, SPACE_COLORS } from '@hive/tokens';

interface MainContentProps {
  /** Current board name */
  boardName: string;
  /** Board header actions (search, options) */
  headerActions?: React.ReactNode;
  /** Main content (messages, cards, etc.) */
  children: React.ReactNode;
  /** Whether content is loading */
  isLoading?: boolean;
  /** Key for animation (e.g., boardId) */
  contentKey?: string;
  /** Additional class names */
  className?: string;
}

export function MainContent({
  boardName,
  headerActions,
  children,
  isLoading = false,
  contentKey,
  className,
}: MainContentProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Board Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b"
        style={{ borderColor: SPACE_COLORS.borderSubtle }}
      >
        <div className="flex items-center gap-2">
          <span className="text-white/50">#</span>
          <h2 className="text-sm font-medium text-white">{boardName}</h2>
        </div>

        {headerActions && (
          <div className="flex items-center gap-2">{headerActions}</div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={contentKey || 'content'}
            {...spaceMotionVariants.contentSwitch}
            className="h-full"
          >
            {isLoading ? (
              <ContentSkeleton />
            ) : (
              children
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Loading skeleton */
function ContentSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
            <div className="h-4 w-full rounded bg-white/[0.06]" />
            <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}

MainContent.displayName = 'MainContent';

export default MainContent;

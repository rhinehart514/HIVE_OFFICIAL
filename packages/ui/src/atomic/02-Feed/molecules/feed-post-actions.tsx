'use client';

/**
 * FeedPostActions - Post engagement action buttons
 *
 * Features:
 * - Upvote/comment/bookmark/share row
 * - Icon buttons with 44×44px touch targets
 * - Optimistic updates (< 16ms perceived latency)
 * - Animated state changes
 * - Count displays
 *
 * Usage:
 * ```tsx
 * import { FeedPostActions } from '@hive/ui';
 *
 * <FeedPostActions
 *   upvotes={42}
 *   comments={12}
 *   isUpvoted={false}
 *   isBookmarked={false}
 *   onUpvote={() => {}}
 *   onComment={() => {}}
 *   onBookmark={() => {}}
 *   onShare={() => {}}
 * />
 * ```
 */

import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';
import { durationSeconds, springPresets } from '@hive/tokens';

import { cn } from '../../../lib/utils';
import {
  HeartIcon,
  MessageCircleIcon,
  BookmarkIcon,
  ShareIcon,
} from '../../00-Global/atoms/icon-library';

export interface FeedPostActionsProps {
  /**
   * Number of upvotes
   */
  upvotes: number;

  /**
   * Number of comments
   */
  comments: number;

  /**
   * Whether current user has upvoted
   */
  isUpvoted: boolean;

  /**
   * Whether current user has bookmarked
   */
  isBookmarked: boolean;

  /**
   * Callback when upvote is clicked
   */
  onUpvote: () => void;

  /**
   * Callback when comment is clicked
   */
  onComment: () => void;

  /**
   * Callback when bookmark is clicked
   */
  onBookmark: () => void;

  /**
   * Callback when share is clicked
   */
  onShare: () => void;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Compact mode (smaller touch targets for desktop)
   */
  compact?: boolean;
}

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  label: string;
  compact?: boolean;
  activeColor?: string;
  isToggle?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  count,
  isActive,
  onClick,
  label,
  compact = false,
  activeColor = 'var(--hive-brand-primary)',
  isToggle = false,
}) => {
  // Track if this is the first mount to avoid initial animation
  const isInitialMount = React.useRef(true);
  const [wasActive, setWasActive] = React.useState(isActive);
  const [showBurst, setShowBurst] = React.useState(false);

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      // Show burst effect when toggling ON (not off)
      if (isActive && !wasActive && isToggle) {
        setShowBurst(true);
        setTimeout(() => setShowBurst(false), 600);
      }
      setWasActive(isActive);
    }
  }, [isActive, wasActive, isToggle]);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isToggle ? isActive : undefined}
      className={cn(
        'group relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-[var(--hive-background-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hive-interactive-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hive-background-primary)]',
        compact ? 'min-h-[36px]' : 'min-h-[44px]'
      )}
      whileTap={{ scale: 0.98 }}
      transition={springPresets.snappy}
    >
      {/* Burst effect on activation */}
      <AnimatePresence>
        {showBurst && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationSeconds.flowing, ease: [0.23, 1, 0.32, 1] }}
            style={{ backgroundColor: activeColor }}
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={isActive
          ? { scale: [1, 1.3, 1.1], rotate: [0, -10, 0] }
          : { scale: 1, rotate: 0 }
        }
        transition={isActive
          ? { duration: durationSeconds.standard, times: [0, 0.4, 1], ease: [0.23, 1, 0.32, 1] }
          : springPresets.snappy
        }
      >
        <Icon
          className={cn(
            'h-5 w-5 transition-colors',
            isActive && 'fill-current'
          )}
          style={{
            color: isActive ? activeColor : 'var(--hive-text-secondary)',
            transitionDuration: `${durationSeconds.snap * 1000}ms`,
          }}
        />
      </motion.div>
      {count !== undefined && count > 0 && (
        <motion.span
          key={count}
          initial={!isInitialMount.current && isActive !== wasActive ? { scale: 1.3, y: -4 } : false}
          animate={{ scale: 1, y: 0 }}
          transition={springPresets.bouncy}
          className={cn(
            'text-sm font-medium tabular-nums transition-colors',
            isActive
              ? 'text-[var(--hive-text-primary)]'
              : 'text-[var(--hive-text-secondary)] group-hover:text-[var(--hive-text-primary)]'
          )}
          style={{ transitionDuration: `${durationSeconds.quick * 1000}ms` }}
        >
          {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
        </motion.span>
      )}
    </motion.button>
  );
};

export const FeedPostActions = React.forwardRef<HTMLDivElement, FeedPostActionsProps>(
  (
    {
      upvotes,
      comments,
      isUpvoted,
      isBookmarked,
      onUpvote,
      onComment,
      onBookmark,
      onShare,
      className,
      compact = false,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-1',
          className
        )}
        role="toolbar"
        aria-label="Post actions"
      >
        <ActionButton
          icon={HeartIcon}
          count={upvotes}
          isActive={isUpvoted}
          onClick={onUpvote}
          label={isUpvoted ? 'Remove upvote' : 'Upvote post'}
          compact={compact}
          activeColor="#ef4444" // Red for heart/upvote
          isToggle
        />

        <ActionButton
          icon={MessageCircleIcon}
          count={comments}
          isActive={false}
          onClick={onComment}
          label={`View ${comments} ${comments === 1 ? 'comment' : 'comments'}`}
          compact={compact}
        />

        <ActionButton
          icon={BookmarkIcon}
          count={undefined}
          isActive={isBookmarked}
          onClick={onBookmark}
          label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
          compact={compact}
          activeColor="var(--hive-brand-primary)" // Gold for bookmark
          isToggle
        />

        <ActionButton
          icon={ShareIcon}
          count={undefined}
          isActive={false}
          onClick={onShare}
          label="Share post"
          compact={compact}
        />
      </div>
    );
  }
);

FeedPostActions.displayName = 'FeedPostActions';

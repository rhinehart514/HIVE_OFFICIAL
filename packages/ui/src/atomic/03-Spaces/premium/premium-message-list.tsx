'use client';

/**
 * PremiumMessageList - ChatGPT-style virtualized message list
 *
 * Design Philosophy:
 * - Messages BREATHE - generous vertical spacing
 * - Smooth virtual scrolling with TanStack Virtual
 * - Intelligent message grouping (same author within 5 min)
 * - Date separators for temporal context
 * - Auto-scroll to bottom on new messages
 * - Scroll-to-message with highlight
 *
 * Inspired by: ChatGPT, Discord, Slack
 *
 * @author HIVE Frontend Team
 * @version 1.0.0 - Premium redesign
 */

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Loader2 } from 'lucide-react';
import { isSameDay, differenceInMinutes, format } from 'date-fns';
import { cn } from '../../../lib/utils';
import { premium } from '../../../lib/premium-design';
import { PremiumMessage, type MessageRole } from './premium-message';

// ============================================================
// Virtualization Config
// ============================================================

/** Estimated height for non-grouped message (with header) */
const ESTIMATED_MESSAGE_HEIGHT = 100;

/** Estimated height for grouped message (no header) */
const ESTIMATED_GROUPED_HEIGHT = 44;

/** Estimated height for date separator */
const ESTIMATED_SEPARATOR_HEIGHT = 56;

/** Overscan for smooth scrolling */
const VIRTUALIZER_OVERSCAN = 10;

/** Time window for grouping messages (minutes) */
const GROUP_TIME_WINDOW = 5;

/** Distance from bottom to show "new messages" button */
const NEW_MESSAGES_THRESHOLD = 300;

// ============================================================
// Types
// ============================================================

export interface MessageData {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    role?: MessageRole;
  };
  timestamp: Date;
  isEdited?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  reactions?: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
  }>;
  threadCount?: number;
}

export interface PremiumMessageListProps {
  /** Messages to display */
  messages: MessageData[];
  /** Current user ID */
  currentUserId: string;
  /** Whether loading initial messages */
  isLoading?: boolean;
  /** Whether loading more messages (pagination) */
  isLoadingMore?: boolean;
  /** Whether there are more messages to load */
  hasMore?: boolean;
  /** Message ID to scroll to and highlight */
  scrollToMessageId?: string;
  /** Called when scroll-to completes */
  onScrollToComplete?: () => void;
  /** Called when reaching top (load more) */
  onLoadMore?: () => void;

  // Message callbacks
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onViewThread?: (messageId: string) => void;

  /** Can user edit their own messages? */
  canEdit?: boolean;
  /** Can user delete their own messages? */
  canDelete?: boolean;
  /** Can user pin messages? */
  canPin?: boolean;

  /** Additional className */
  className?: string;
}

// ============================================================
// Virtual Item Types
// ============================================================

type VirtualItem =
  | { type: 'date-separator'; date: Date; id: string }
  | { type: 'message'; message: MessageData; isGrouped: boolean; showDateSeparator: boolean };

// ============================================================
// Component
// ============================================================

export function PremiumMessageList({
  messages,
  currentUserId,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  scrollToMessageId,
  onScrollToComplete,
  onLoadMore,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onViewThread,
  canEdit = false,
  canDelete = false,
  canPin = false,
  className,
}: PremiumMessageListProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = React.useState(true);
  const [highlightedMessageId, setHighlightedMessageId] = React.useState<string | null>(null);
  const prevMessagesLengthRef = React.useRef(messages.length);
  const hasScrolledToTargetRef = React.useRef(false);

  // Build virtual items list with grouping and date separators
  const virtualItems = React.useMemo<VirtualItem[]>(() => {
    const items: VirtualItem[] = [];
    let lastAuthorId: string | null = null;
    let lastTimestamp: Date | null = null;
    let lastDate: string | null = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const messageDate = format(message.timestamp, 'yyyy-MM-dd');

      // Check if we need a date separator
      const showDateSeparator = lastDate !== messageDate;
      if (showDateSeparator) {
        lastDate = messageDate;
      }

      // Check if this message should be grouped with previous
      const isGrouped =
        !showDateSeparator &&
        lastAuthorId === message.author.id &&
        lastTimestamp !== null &&
        differenceInMinutes(message.timestamp, lastTimestamp) < GROUP_TIME_WINDOW;

      items.push({
        type: 'message',
        message,
        isGrouped,
        showDateSeparator,
      });

      lastAuthorId = message.author.id;
      lastTimestamp = message.timestamp;
    }

    return items;
  }, [messages]);

  // Estimate item size
  const estimateSize = React.useCallback(
    (index: number) => {
      const item = virtualItems[index];
      if (!item) return ESTIMATED_MESSAGE_HEIGHT;

      if (item.type === 'date-separator') {
        return ESTIMATED_SEPARATOR_HEIGHT;
      }

      let height = item.isGrouped ? ESTIMATED_GROUPED_HEIGHT : ESTIMATED_MESSAGE_HEIGHT;
      if (item.showDateSeparator) {
        height += ESTIMATED_SEPARATOR_HEIGHT;
      }
      return height;
    },
    [virtualItems]
  );

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: VIRTUALIZER_OVERSCAN,
    getItemKey: (index) => {
      const item = virtualItems[index];
      return item?.type === 'message' ? item.message.id : `separator-${index}`;
    },
  });

  // Auto-scroll to bottom on new messages (if user is near bottom)
  React.useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && isNearBottom) {
      virtualizer.scrollToIndex(virtualItems.length - 1, { align: 'end', behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, isNearBottom, virtualizer, virtualItems.length]);

  // Scroll to target message
  React.useEffect(() => {
    if (!scrollToMessageId || hasScrolledToTargetRef.current) return;

    const targetIndex = virtualItems.findIndex(
      (item) => item.type === 'message' && item.message.id === scrollToMessageId
    );

    if (targetIndex !== -1) {
      hasScrolledToTargetRef.current = true;
      virtualizer.scrollToIndex(targetIndex, { align: 'center', behavior: 'smooth' });

      // Highlight the message
      setHighlightedMessageId(scrollToMessageId);
      setTimeout(() => {
        setHighlightedMessageId(null);
        onScrollToComplete?.();
      }, 2000);
    }
  }, [scrollToMessageId, virtualItems, virtualizer, onScrollToComplete]);

  // Reset scroll target flag when ID changes
  React.useEffect(() => {
    hasScrolledToTargetRef.current = false;
  }, [scrollToMessageId]);

  // Check if near bottom for auto-scroll behavior
  const handleScroll = React.useCallback(() => {
    const container = parentRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    setIsNearBottom(distanceFromBottom < NEW_MESSAGES_THRESHOLD);

    // Load more when near top
    if (scrollTop < 100 && hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Scroll to bottom button
  const scrollToBottom = () => {
    virtualizer.scrollToIndex(virtualItems.length - 1, { align: 'end', behavior: 'smooth' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-3 text-[#6B6B70]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-[14px]">Loading messages...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="text-center px-6">
          <p className="text-[17px] text-[#6B6B70]">No messages yet</p>
          <p className="text-[14px] text-[#4A4A4F] mt-1">Be the first to say something!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative flex-1 overflow-hidden', className)}>
      {/* Loading more indicator */}
      <AnimatePresence>
        {isLoadingMore && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
          >
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full',
                'bg-[rgba(17,17,17,0.90)] backdrop-blur-[16px]',
                'border border-white/[0.08]',
                'text-[13px] text-[#9A9A9F]'
              )}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading more...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Virtual scroll container */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-hide"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = virtualItems[virtualRow.index];
            if (!item) return null;

            if (item.type === 'message') {
              const { message, isGrouped, showDateSeparator } = item;
              const isOwn = message.author.id === currentUserId;
              const isHighlighted = message.id === highlightedMessageId;

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <PremiumMessage
                    id={message.id}
                    content={message.content}
                    author={message.author}
                    timestamp={message.timestamp}
                    isOwn={isOwn}
                    isGrouped={isGrouped}
                    showDateSeparator={showDateSeparator}
                    isPinned={message.isPinned}
                    isEdited={message.isEdited}
                    isDeleted={message.isDeleted}
                    isHighlighted={isHighlighted}
                    reactions={message.reactions}
                    threadCount={message.threadCount}
                    canEdit={canEdit && isOwn}
                    canDelete={canDelete && isOwn}
                    canPin={canPin}
                    onReact={onReact ? (emoji) => onReact(message.id, emoji) : undefined}
                    onReply={onReply ? () => onReply(message.id) : undefined}
                    onEdit={onEdit ? () => onEdit(message.id) : undefined}
                    onDelete={onDelete ? () => onDelete(message.id) : undefined}
                    onPin={onPin ? () => onPin(message.id) : undefined}
                    onViewThread={
                      onViewThread && message.threadCount && message.threadCount > 0
                        ? () => onViewThread(message.id)
                        : undefined
                    }
                  />
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {!isNearBottom && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={premium.motion.spring.snappy}
            onClick={scrollToBottom}
            className={cn(
              'absolute bottom-6 left-1/2 -translate-x-1/2',
              'flex items-center gap-2 px-4 py-2 rounded-full',
              'bg-[rgba(17,17,17,0.90)] backdrop-blur-[16px]',
              'border border-white/[0.10]',
              'text-[14px] text-[#FAFAFA]',
              'shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
              'hover:bg-[rgba(26,26,26,0.90)]',
              'transition-colors duration-150',
              'cursor-pointer'
            )}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4" />
            <span>New messages</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PremiumMessageList;

'use client';

/**
 * MessageFeed - Scrollable message list with virtualization potential
 *
 * Features:
 * - Reverse chronological (newest at bottom)
 * - Unread divider
 * - Load more on scroll up
 * - Message grouping by author
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageItem, type Message } from './message-item';
import { UnreadDivider } from './unread-divider';
import { spaceMotionVariants, SPACE_MOTION } from '@hive/tokens';

interface MessageFeedProps {
  messages: Message[];
  currentUserId?: string;
  /** Timestamp of last read message */
  lastReadAt?: Date | string | null;
  /** Number of unread messages */
  unreadCount?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Loading more messages */
  isLoadingMore?: boolean;
  /** Whether there are more messages to load */
  hasMore?: boolean;
  /** Load more handler */
  onLoadMore?: () => void;
  /** Message actions */
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onReport?: (messageId: string, authorName: string, content: string) => void;
  /** Permission check */
  canDeleteMessage?: (messageId: string, authorId: string) => boolean;
  /** Component interaction handlers */
  onComponentVote?: (componentId: string, optionIndex: number) => void;
  onComponentRsvp?: (componentId: string, response: 'yes' | 'no' | 'maybe') => void;
  className?: string;
}

export function MessageFeed({
  messages,
  currentUserId,
  lastReadAt,
  unreadCount = 0,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  onReact,
  onReply,
  onDelete,
  onEdit,
  onReport,
  canDeleteMessage,
  onComponentVote,
  onComponentRsvp,
  className,
}: MessageFeedProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [showUnreadDivider, setShowUnreadDivider] = React.useState(true);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [newMessagesBelowCount, setNewMessagesBelowCount] = React.useState(0);
  const prevMessageCountRef = React.useRef(messages.length);

  // Parse lastReadAt to Date
  const lastReadDate = React.useMemo(() => {
    if (!lastReadAt) return null;
    return typeof lastReadAt === 'string' ? new Date(lastReadAt) : lastReadAt;
  }, [lastReadAt]);

  // Find where to show unread divider
  const unreadDividerIndex = React.useMemo(() => {
    if (!lastReadDate || unreadCount === 0) return -1;

    // Find first message after lastReadAt
    for (let i = 0; i < messages.length; i++) {
      const msgDate = new Date(messages[i].timestamp);
      if (msgDate > lastReadDate) {
        return i;
      }
    }
    return -1;
  }, [messages, lastReadDate, unreadCount]);

  // Track new messages arriving while scrolled up
  React.useEffect(() => {
    const newCount = messages.length - prevMessageCountRef.current;
    if (newCount > 0 && !isAtBottom) {
      setNewMessagesBelowCount((prev) => prev + newCount);
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, isAtBottom]);

  // Reset new messages count when user scrolls to bottom
  React.useEffect(() => {
    if (isAtBottom) {
      setNewMessagesBelowCount(0);
    }
  }, [isAtBottom]);

  // Check if scrolled to bottom (within 80px threshold)
  const checkIfAtBottom = React.useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsAtBottom(distanceFromBottom < 80);
  }, []);

  // Scroll to bottom on new messages (if already at bottom)
  const scrollToBottom = React.useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    setNewMessagesBelowCount(0);
  }, []);

  // Handle scroll for infinite loading + bottom detection
  const handleScroll = React.useCallback(() => {
    checkIfAtBottom();

    if (!containerRef.current || isLoadingMore || !hasMore || !onLoadMore) return;

    const { scrollTop } = containerRef.current;
    // Load more when scrolled near top
    if (scrollTop < 100) {
      onLoadMore();
    }
  }, [isLoadingMore, hasMore, onLoadMore, checkIfAtBottom]);

  // Dismiss unread divider handler
  const handleDismissUnread = React.useCallback(() => {
    setShowUnreadDivider(false);
    scrollToBottom();
  }, [scrollToBottom]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-white/40 text-sm">No messages yet</p>
          <p className="text-white/20 text-xs mt-1">Be the first to say something</p>
        </div>
      </div>
    );
  }

  // Group messages by author for compact display
  const groupedMessages = groupMessagesByAuthor(messages);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn('flex flex-col h-full overflow-y-auto px-4', className)}
    >
      {/* Load more spinner */}
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
        </div>
      )}

      {/* Load more trigger */}
      {hasMore && !isLoadingMore && (
        <button
          onClick={onLoadMore}
          className="text-xs text-white/40 hover:text-white/60 py-2 transition-colors"
        >
          Load earlier messages
        </button>
      )}

      {/* Messages */}
      <div className="flex-1 flex flex-col justify-end">
        <AnimatePresence initial={false}>
          {groupedMessages.map((group, groupIndex) => {
            // Calculate the flat index offset for this group
            const groupStartIndex = groupedMessages
              .slice(0, groupIndex)
              .reduce((acc, g) => acc + g.messages.length, 0);

            return (
              <div
                key={group.authorId + '-' + groupIndex}
                className={cn(
                  groupIndex > 0 && 'mt-5' // 20px between different authors
                )}
              >
                {group.messages.map((message, msgIndex) => {
                  const flatIndex = groupStartIndex + msgIndex;
                  const showDividerBefore = showUnreadDivider && flatIndex === unreadDividerIndex;

                  return (
                    <React.Fragment key={message.id}>
                      {/* Show unread divider before this specific message */}
                      {showDividerBefore && (
                        <UnreadDivider
                          count={unreadCount}
                          onDismiss={handleDismissUnread}
                        />
                      )}
                      <div
                        className={cn(
                          msgIndex > 0 && !showDividerBefore && 'mt-1.5' // 6px within same author (not after divider)
                        )}
                      >
                        <MessageItem
                          message={message}
                          showAuthor={msgIndex === 0 || showDividerBefore} // Show author after divider too
                          isOwn={message.authorId === currentUserId}
                          onReact={onReact ? (emoji) => onReact(message.id, emoji) : undefined}
                          onReply={onReply ? () => onReply(message.id) : undefined}
                          onDelete={
                            onDelete && canDeleteMessage?.(message.id, message.authorId)
                              ? () => onDelete(message.id)
                              : undefined
                          }
                          onEdit={
                            onEdit && message.authorId === currentUserId
                              ? (newContent) => onEdit(message.id, newContent)
                              : undefined
                          }
                          onReport={
                            onReport
                              ? () => onReport(message.id, message.authorName, message.content)
                              : undefined
                          }
                          onComponentVote={onComponentVote}
                          onComponentRsvp={onComponentRsvp}
                        />
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Bottom padding for input visibility */}
      <div className="h-4" />

      {/* Scroll to latest floating button */}
      <AnimatePresence>
        {!isAtBottom && (
          <motion.button
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{
              duration: SPACE_MOTION.messageAppear.duration / 1000,
              ease: SPACE_MOTION.hover.ease,
            }}
            onClick={scrollToBottom}
            className={cn(
              'sticky bottom-4 left-1/2 -translate-x-1/2 z-10',
              'flex items-center gap-1.5',
              'px-3 py-1.5 rounded-full',
              'bg-white/[0.1] backdrop-blur-md',
              'border border-white/[0.08]',
              'text-xs font-medium text-white/70',
              'hover:bg-white/[0.14] hover:text-white/90',
              'transition-colors duration-150',
              'mx-auto w-fit'
            )}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            {newMessagesBelowCount > 0 ? (
              <span>{newMessagesBelowCount} new</span>
            ) : (
              <span>Latest</span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Group consecutive messages by author */
function groupMessagesByAuthor(messages: Message[]) {
  const groups: { authorId: string; messages: Message[] }[] = [];

  messages.forEach((message) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.authorId === message.authorId) {
      // Same author, add to group
      lastGroup.messages.push(message);
    } else {
      // New author, create new group
      groups.push({
        authorId: message.authorId,
        messages: [message],
      });
    }
  });

  return groups;
}

MessageFeed.displayName = 'MessageFeed';

export default MessageFeed;

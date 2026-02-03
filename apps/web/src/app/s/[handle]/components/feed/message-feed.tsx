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
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageItem, type Message } from './message-item';
import { UnreadDivider } from './unread-divider';
import { CHAT_SPACING, spaceMotionVariants } from '@hive/tokens';

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
  className,
}: MessageFeedProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [showUnreadDivider, setShowUnreadDivider] = React.useState(true);

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

  // Scroll to bottom on new messages (if already at bottom)
  const scrollToBottom = React.useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  // Handle scroll for infinite loading
  const handleScroll = React.useCallback(() => {
    if (!containerRef.current || isLoadingMore || !hasMore || !onLoadMore) return;

    const { scrollTop } = containerRef.current;
    // Load more when scrolled near top
    if (scrollTop < 100) {
      onLoadMore();
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

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
                      <motion.div
                        initial={spaceMotionVariants.messageEnter.initial}
                        animate={spaceMotionVariants.messageEnter.animate}
                        transition={spaceMotionVariants.messageEnter.transition}
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
                        />
                      </motion.div>
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

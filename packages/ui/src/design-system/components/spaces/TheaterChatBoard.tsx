'use client';

/**
 * TheaterChatBoard Component
 *
 * Full-screen chat board for theater mode.
 * No sidebar, full-width messages, immersive experience.
 *
 * Features:
 * - Full-width ChatRowMessage components
 * - Virtual scrolling for performance (uses @tanstack/react-virtual)
 * - Typing indicator with gold breathing
 * - Minimal composer at bottom
 * - Date separators between message groups
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '../../../lib/utils';
import { ChatRowMessage, DateSeparator, SystemMessage } from './ChatRowMessage';
import { ChatTypingDots } from './TypingDots';
import type { ChatRowMessageAuthor, ChatRowMessageReaction } from './ChatRowMessage';
import type { TypingUser } from './TypingDots';
import { InlineElementRenderer, type InlineComponentData, type InlineChatComponentData } from '../../../components/hivelab/inline-element-renderer';

// ============================================================
// Types
// ============================================================

export interface TheaterMessage {
  id: string;
  type: 'text' | 'system' | 'inline_component';
  content: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole?: 'owner' | 'admin' | 'moderator' | 'member';
  timestamp: number;
  editedAt?: number;
  isDeleted?: boolean;
  isPinned?: boolean;
  reactions?: ChatRowMessageReaction[];
  threadCount?: number;
  systemAction?: string;
  /** For inline_component type: deployment-based component data */
  componentData?: InlineComponentData;
  /** For inline_component type: inline chat component data (quick polls/RSVP) */
  inlineChatData?: InlineChatComponentData;
}

export interface TheaterChatBoardProps {
  /** Space ID */
  spaceId: string;
  /** Current board ID */
  boardId: string;
  /** Messages to display */
  messages: TheaterMessage[];
  /** Users currently typing */
  typingUsers: TypingUser[];
  /** Loading state */
  isLoading?: boolean;
  /** Loading more messages */
  isLoadingMore?: boolean;
  /** Has more messages to load */
  hasMore?: boolean;
  /** Current user ID */
  currentUserId?: string;
  /** Can the user post */
  canPost?: boolean;
  /** Message to scroll to */
  scrollToMessageId?: string;
  /** Callback when scroll to message is complete */
  onScrollToMessageComplete?: () => void;
  /** Send message callback */
  onSendMessage?: (content: string) => Promise<void>;
  /** Load more messages */
  onLoadMore?: () => Promise<void>;
  /** React to message */
  onReact?: (messageId: string, emoji: string) => void;
  /** View thread */
  onViewThread?: (messageId: string) => void;
  /** Pin message */
  onPinMessage?: (messageId: string) => void;
  /** Delete message */
  onDeleteMessage?: (messageId: string) => void;
  /** Edit message */
  onEditMessage?: (messageId: string, content: string) => void;
  /** Typing callback */
  onTyping?: () => void;
  /** Author click callback */
  onAuthorClick?: (authorId: string) => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// Virtual List Item Types
// ============================================================

type VirtualListItem =
  | { type: 'date-separator'; date: Date; id: string }
  | { type: 'message'; message: TheaterMessage; showAuthor: boolean };

// ============================================================
// Helpers
// ============================================================

/**
 * Flatten messages into a virtual list with date separators.
 * Returns a single array suitable for virtualization.
 */
function flattenMessagesForVirtualList(messages: TheaterMessage[]): VirtualListItem[] {
  const items: VirtualListItem[] = [];
  let currentDateKey = '';
  let prevMessage: TheaterMessage | undefined;

  for (const message of messages) {
    const date = new Date(message.timestamp);
    const dateKey = date.toDateString();

    // Add date separator when date changes
    if (dateKey !== currentDateKey) {
      items.push({
        type: 'date-separator',
        date,
        id: `separator-${dateKey}`,
      });
      currentDateKey = dateKey;
      prevMessage = undefined; // Reset for new date group
    }

    // Add message with showAuthor computed
    items.push({
      type: 'message',
      message,
      showAuthor: shouldShowAuthor(message, prevMessage),
    });

    prevMessage = message;
  }

  return items;
}

function shouldShowAuthor(message: TheaterMessage, prevMessage?: TheaterMessage): boolean {
  if (!prevMessage) return true;
  if (prevMessage.authorId !== message.authorId) return true;
  if (message.type === 'system') return false;

  // Show author if more than 5 minutes between messages
  const timeDiff = message.timestamp - prevMessage.timestamp;
  return timeDiff > 5 * 60 * 1000;
}

/**
 * Estimate item height for virtualization.
 * Date separators: ~40px
 * Messages: ~72px base + extra for reactions/threads
 */
function estimateItemHeight(item: VirtualListItem): number {
  if (item.type === 'date-separator') {
    return 40;
  }

  // Base message height
  let height = item.showAuthor ? 72 : 48;

  // Add for reactions
  if (item.message.reactions && item.message.reactions.length > 0) {
    height += 32;
  }

  // Add for thread indicator
  if (item.message.threadCount && item.message.threadCount > 0) {
    height += 24;
  }

  return height;
}

// ============================================================
// Composer Component
// ============================================================

interface TheaterComposerProps {
  onSend: (content: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

function TheaterComposer({
  onSend,
  onTyping,
  disabled = false,
  placeholder = "Message...",
}: TheaterComposerProps) {
  const [value, setValue] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled || isSending) return;

    setIsSending(true);
    try {
      onSend(value.trim());
      setValue('');
      inputRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    // Typing indicator
    if (onTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping();
      typingTimeoutRef.current = setTimeout(() => {
        // Typing stopped
      }, 3000);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-white/[0.06] bg-[var(--bg-ground,#0A0A09)]"
    >
      <div className="px-3 md:px-6 py-4">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-[#141312] rounded-xl px-4 py-3',
              'text-white placeholder:text-[#6B6B70]',
              'border border-white/[0.06] focus:border-white/[0.12]',
              'focus:outline-none focus:ring-2 focus:ring-white/[0.10]',
              'transition-all duration-200',
              'min-h-[48px] max-h-[200px]',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            style={{
              height: 'auto',
              minHeight: '48px',
            }}
          />

          <button
            type="submit"
            disabled={!value.trim() || disabled || isSending}
            className={cn(
              'p-3 rounded-xl',
              'transition-all duration-200',
              value.trim() && !isSending
                ? 'bg-[#FFD700] text-black hover:bg-[#FFD700]/90 active:scale-95'
                : 'bg-white/[0.06] text-[#6B6B70]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {isSending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

// ============================================================
// Virtualized Message Row Component
// ============================================================

interface VirtualMessageRowProps {
  item: VirtualListItem;
  spaceId: string;
  currentUserId?: string;
  scrollToMessageId?: string;
  onReact?: (messageId: string, emoji: string) => void;
  onViewThread?: (messageId: string) => void;
  onPinMessage?: (messageId: string) => void;
  onAuthorClick?: (authorId: string) => void;
}

function VirtualMessageRow({
  item,
  spaceId,
  currentUserId,
  scrollToMessageId,
  onReact,
  onViewThread,
  onPinMessage,
  onAuthorClick,
}: VirtualMessageRowProps) {
  if (item.type === 'date-separator') {
    return <DateSeparator date={item.date} />;
  }

  const { message, showAuthor } = item;

  if (message.type === 'system') {
    return (
      <SystemMessage
        content={message.content}
        timestamp={message.timestamp}
        action={message.systemAction}
      />
    );
  }

  // Handle inline_component messages
  if (message.type === 'inline_component') {
    const author: ChatRowMessageAuthor = {
      id: message.authorId,
      name: message.authorName,
      avatarUrl: message.authorAvatarUrl,
      role: message.authorRole,
    };

    return (
      <div id={`message-${message.id}`} className="px-3 md:px-6 py-3">
        {/* Author header */}
        {showAuthor && (
          <div className="flex items-baseline gap-2 mb-2">
            <button
              className="w-10 h-10 rounded-xl bg-[#141312] overflow-hidden flex-shrink-0
                hover:ring-2 hover:ring-white/20 transition-all duration-150"
              onClick={() => onAuthorClick?.(author.id)}
            >
              {author.avatarUrl ? (
                <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#6B6B70] text-sm font-medium">
                  {author.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </button>
            <div className="flex items-baseline gap-2">
              <button
                className="text-white font-medium hover:underline"
                onClick={() => onAuthorClick?.(author.id)}
              >
                {author.name}
              </button>
              <span className="text-[#6B6B70] text-xs">
                {new Date(message.timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
          </div>
        )}
        {/* Content label if any */}
        {message.content && (
          <p className="text-[#A3A19E] text-sm mb-3 ml-14">{message.content}</p>
        )}
        {/* Inline component renderer */}
        <div className="ml-14">
          {message.inlineChatData ? (
            // Inline chat mode (quick polls/RSVP created directly in chat)
            <InlineElementRenderer
              isInlineChat={true}
              inlineChatData={message.inlineChatData}
              spaceId={spaceId}
              userId={currentUserId}
            />
          ) : message.componentData ? (
            // Deployment mode (deployed tool component)
            <InlineElementRenderer
              componentData={message.componentData}
              spaceId={spaceId}
              userId={currentUserId}
            />
          ) : (
            // Fallback for missing component data
            <div className="text-[#6B6B70] text-sm italic p-4 border border-dashed border-white/10 rounded-lg">
              Component data missing
            </div>
          )}
        </div>
      </div>
    );
  }

  const author: ChatRowMessageAuthor = {
    id: message.authorId,
    name: message.authorName,
    avatarUrl: message.authorAvatarUrl,
    role: message.authorRole,
  };

  return (
    <div id={`message-${message.id}`}>
      <ChatRowMessage
        id={message.id}
        content={message.content}
        author={author}
        timestamp={message.timestamp}
        isPinned={message.isPinned}
        isEdited={!!message.editedAt}
        isDeleted={message.isDeleted}
        hasThread={(message.threadCount ?? 0) > 0}
        threadCount={message.threadCount}
        reactions={message.reactions}
        showAuthor={showAuthor}
        isHighlighted={message.id === scrollToMessageId}
        onReact={(emoji) => onReact?.(message.id, emoji)}
        onReply={() => onViewThread?.(message.id)}
        onPin={() => onPinMessage?.(message.id)}
        onViewThread={() => onViewThread?.(message.id)}
        onAuthorClick={onAuthorClick}
      />
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function TheaterChatBoard({
  spaceId,
  boardId,
  messages,
  typingUsers,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  currentUserId,
  canPost = true,
  scrollToMessageId,
  onScrollToMessageComplete,
  onSendMessage,
  onLoadMore,
  onReact,
  onViewThread,
  onPinMessage,
  onDeleteMessage,
  onEditMessage,
  onTyping,
  onAuthorClick,
  className,
}: TheaterChatBoardProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);

  // Flatten messages for virtualization
  const virtualItems = React.useMemo(
    () => flattenMessagesForVirtualList(messages),
    [messages]
  );

  // Set up virtualizer
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => estimateItemHeight(virtualItems[index]),
    overscan: 10, // Render 10 extra items above/below viewport
  });

  // Scroll to bottom on new messages (if at bottom)
  React.useEffect(() => {
    if (isAtBottom && virtualItems.length > 0) {
      virtualizer.scrollToIndex(virtualItems.length - 1, { align: 'end', behavior: 'smooth' });
    }
  }, [virtualItems.length, isAtBottom, virtualizer]);

  // Scroll to specific message
  React.useEffect(() => {
    if (scrollToMessageId) {
      const index = virtualItems.findIndex(
        (item) => item.type === 'message' && item.message.id === scrollToMessageId
      );
      if (index !== -1) {
        virtualizer.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
        onScrollToMessageComplete?.();
      }
    }
  }, [scrollToMessageId, virtualItems, virtualizer, onScrollToMessageComplete]);

  // Track scroll position for auto-scroll and load more
  const handleScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setIsAtBottom(isBottom);

    // Load more when scrolled to top
    if (container.scrollTop < 100 && hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Handle send
  const handleSend = async (content: string) => {
    if (onSendMessage) {
      await onSendMessage(content);
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (virtualItems.length > 0) {
      virtualizer.scrollToIndex(virtualItems.length - 1, { align: 'end', behavior: 'smooth' });
    }
  };

  // Loading state - message row skeletons with staggered animation
  if (isLoading) {
    const skeletonVariants = [
      { nameWidth: 'w-20', contentWidths: ['w-3/4', 'w-1/2'] },
      { nameWidth: 'w-28', contentWidths: ['w-full'] },
      { nameWidth: 'w-16', contentWidths: ['w-2/3', 'w-1/3'] },
      { nameWidth: 'w-24', contentWidths: ['w-5/6'] },
      { nameWidth: 'w-20', contentWidths: ['w-1/2', 'w-2/3', 'w-1/4'] },
    ];

    return (
      <div className={cn('flex-1 flex flex-col', className)}>
        <div className="flex-1 flex flex-col gap-1 px-3 md:px-6 py-4">
          {skeletonVariants.map((variant, i) => (
            <div
              key={i}
              className="flex gap-4 py-3"
              style={{
                animationDelay: `${i * 100}ms`,
              }}
            >
              {/* Avatar skeleton */}
              <div
                className="w-10 h-10 rounded-xl bg-white/[0.04] flex-shrink-0 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
              <div className="flex-1 space-y-2 pt-1">
                {/* Name skeleton */}
                <div
                  className={cn(
                    'h-3.5 rounded-md bg-white/[0.06] animate-pulse',
                    variant.nameWidth
                  )}
                  style={{ animationDelay: `${i * 100 + 50}ms` }}
                />
                {/* Content lines */}
                {variant.contentWidths.map((width, j) => (
                  <div
                    key={j}
                    className={cn(
                      'h-3 rounded bg-white/[0.04] animate-pulse',
                      width
                    )}
                    style={{ animationDelay: `${i * 100 + 100 + j * 50}ms` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 flex flex-col overflow-hidden', className)}>
      {/* Virtualized Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-[#6B6B70] text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6B6B70] animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#6B6B70] animate-pulse delay-100" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#6B6B70] animate-pulse delay-200" />
              <span>Loading...</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center max-w-sm mx-auto px-4">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
                <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              {canPost ? (
                <>
                  <p className="text-white/60 text-base font-medium mb-2">Be the first to say hello!</p>
                  <p className="text-white/30 text-sm mb-4">Break the ice and start a conversation with your community.</p>
                  <p className="text-white/40 text-xs italic">
                    Try: &quot;Hey everyone, excited to be here!&quot;
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white/60 text-base font-medium mb-2">No messages yet</p>
                  <p className="text-white/30 text-sm">Join this space to start chatting with the community.</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Virtual list container */}
        {messages.length > 0 && (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = virtualItems[virtualRow.index];
              const key = item.type === 'date-separator'
                ? item.id
                : item.message.id;

              return (
                <div
                  key={key}
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
                  <VirtualMessageRow
                    item={item}
                    spaceId={spaceId}
                    currentUserId={currentUserId}
                    scrollToMessageId={scrollToMessageId}
                    onReact={onReact}
                    onViewThread={onViewThread}
                    onPinMessage={onPinMessage}
                    onAuthorClick={onAuthorClick}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ChatTypingDots users={typingUsers} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      {canPost && (
        <TheaterComposer
          onSend={handleSend}
          onTyping={onTyping}
          disabled={!canPost}
        />
      )}

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {!isAtBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              'absolute bottom-24 right-6',
              'w-10 h-10 rounded-full',
              'bg-[#141312] border border-white/[0.08]',
              'flex items-center justify-center',
              'hover:bg-[#1E1D1B] transition-colors',
              'shadow-lg',
            )}
            onClick={scrollToBottom}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

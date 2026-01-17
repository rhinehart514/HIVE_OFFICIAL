'use client';

/**
 * ThreadDrawer Component
 *
 * Slide-out panel for message thread/replies view.
 * Matches the expected interface from space-page-modals.tsx
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';
import { Avatar, AvatarImage, AvatarFallback } from '../primitives/Avatar';

/**
 * Get initials from a name for avatar fallback
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Chat message data interface - matches the expected type from stub
 */
export interface ChatMessageData {
  id: string;
  content: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  timestamp: Date | number;
  reactions?: Array<{ emoji: string; count: number; hasReacted: boolean }>;
  isPinned?: boolean;
  threadCount?: number;
}

export interface ThreadDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Open change handler (supports both open and close) */
  onOpenChange?: (open: boolean) => void;
  /** Legacy close handler */
  onClose?: () => void;
  /** Original message that started the thread */
  parentMessage: ChatMessageData | null;
  /** Reply messages */
  replies: ChatMessageData[];
  /** Loading state for initial load */
  isLoading?: boolean;
  /** Loading state for loading more replies */
  isLoadingMore?: boolean;
  /** Whether there are more replies to load */
  hasMoreReplies?: boolean;
  /** Current user ID for highlighting own messages */
  currentUserId?: string;
  /** Load more replies handler */
  onLoadMore?: () => void;
  /** Send reply handler */
  onSendReply?: (content: string) => void | Promise<void>;
  /** On reaction click (legacy) */
  onReact?: (messageId: string, emoji: string) => void;
  /** Additional className */
  className?: string;
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date | number): string {
  const now = new Date();
  const then = typeof date === 'number' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * ThreadDrawer - Slide-out thread panel
 */
const ThreadDrawer: React.FC<ThreadDrawerProps> = ({
  open,
  onOpenChange,
  onClose,
  parentMessage,
  replies,
  isLoading = false,
  isLoadingMore = false,
  hasMoreReplies = false,
  currentUserId,
  onLoadMore,
  onSendReply,
  onReact,
  className,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [replyValue, setReplyValue] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  // Handle close
  const handleClose = React.useCallback(() => {
    onClose?.();
    onOpenChange?.(false);
  }, [onClose, onOpenChange]);

  // Scroll to bottom when new replies come in
  React.useEffect(() => {
    if (contentRef.current && open && !isLoadingMore) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [replies.length, open, isLoadingMore]);

  // Handle submit
  const handleSubmit = async () => {
    if (!replyValue.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendReply?.(replyValue);
      setReplyValue('');
    } finally {
      setIsSending(false);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  // Handle scroll for load more
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    // Load more when scrolled to top
    if (target.scrollTop === 0 && hasMoreReplies && !isLoadingMore) {
      onLoadMore?.();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-in fade-in-0"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 w-[360px] max-w-full z-50',
          'bg-[var(--bg-ground)] border-l border-[var(--border)]',
          'flex flex-col',
          'animate-in slide-in-from-right duration-300',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Text weight="semibold">Thread</Text>
            {parentMessage && replies.length > 0 && (
              <Text size="xs" tone="muted">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </Text>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
        >
          {/* Load more indicator */}
          {isLoadingMore && (
            <div className="p-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-[var(--life-gold)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Parent message */}
          {parentMessage && (
            <div className="p-4 bg-[var(--bg-surface)]">
              <div className="flex items-start gap-3">
                <Avatar size="default">
                  <AvatarImage src={parentMessage.authorAvatar} alt={parentMessage.authorName || 'User'} />
                  <AvatarFallback>{getInitials(parentMessage.authorName || 'User')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Text size="sm" weight="medium">
                      {parentMessage.authorName || 'User'}
                    </Text>
                    <Text size="xs" tone="muted">
                      {formatRelativeTime(parentMessage.timestamp)}
                    </Text>
                  </div>
                  <Text size="sm" className="whitespace-pre-wrap">
                    {parentMessage.content}
                  </Text>

                  {/* Reactions */}
                  {parentMessage.reactions && parentMessage.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {parentMessage.reactions.map((reaction, i) => (
                        <button
                          key={i}
                          onClick={() => onReact?.(parentMessage.id, reaction.emoji)}
                          className={cn(
                            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors',
                            reaction.hasReacted
                              ? 'bg-[var(--life-gold)]/20 text-[var(--life-gold)]'
                              : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]'
                          )}
                        >
                          <span>{reaction.emoji}</span>
                          <span>{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reply divider */}
          {parentMessage && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <Text size="xs" tone="muted">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </Text>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
          )}

          {/* Replies */}
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-[var(--bg-elevated)]" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-[var(--bg-elevated)] rounded mb-2" />
                    <div className="h-4 w-full bg-[var(--bg-elevated)] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : replies.length === 0 ? (
            <div className="p-8 text-center">
              <Text size="sm" tone="muted">
                No replies yet. Be the first to reply!
              </Text>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={cn(
                    'flex items-start gap-3 group',
                    reply.authorId === currentUserId && 'flex-row-reverse'
                  )}
                >
                  <Avatar size="sm">
                    <AvatarImage src={reply.authorAvatar} alt={reply.authorName || 'User'} />
                    <AvatarFallback>{getInitials(reply.authorName || 'User')}</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    'flex-1 min-w-0',
                    reply.authorId === currentUserId && 'text-right'
                  )}>
                    <div className={cn(
                      'flex items-center gap-2 mb-0.5',
                      reply.authorId === currentUserId && 'flex-row-reverse'
                    )}>
                      <Text size="xs" weight="medium">
                        {reply.authorName || 'User'}
                      </Text>
                      <Text size="xs" tone="muted">
                        {formatRelativeTime(reply.timestamp)}
                      </Text>
                    </div>
                    <div className={cn(
                      'inline-block px-3 py-2 rounded-2xl',
                      reply.authorId === currentUserId
                        ? 'bg-[var(--life-gold)]/20 text-[var(--text-primary)]'
                        : 'bg-[var(--bg-elevated)]'
                    )}>
                      <Text size="sm" className="whitespace-pre-wrap">
                        {reply.content}
                      </Text>
                    </div>

                    {/* Reactions */}
                    {reply.reactions && reply.reactions.length > 0 && (
                      <div className={cn(
                        'flex flex-wrap gap-1 mt-1',
                        reply.authorId === currentUserId && 'justify-end'
                      )}>
                        {reply.reactions.map((reaction, i) => (
                          <button
                            key={i}
                            onClick={() => onReact?.(reply.id, reaction.emoji)}
                            className={cn(
                              'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors',
                              reaction.hasReacted
                                ? 'bg-[var(--life-gold)]/20 text-[var(--life-gold)]'
                                : 'bg-[var(--bg-elevated)]'
                            )}
                          >
                            <span>{reaction.emoji}</span>
                            <span>{reaction.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 h-10 px-3 bg-[var(--bg-ground)] border border-[var(--border)] rounded-xl">
            <input
              type="text"
              value={replyValue}
              onChange={(e) => setReplyValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply to thread..."
              disabled={isSending}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-[var(--text-tertiary)]"
            />
            <button
              onClick={handleSubmit}
              disabled={!replyValue.trim() || isSending}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                replyValue.trim() && !isSending
                  ? 'text-[var(--life-gold)] hover:bg-[var(--life-gold)]/10'
                  : 'text-[var(--text-tertiary)]'
              )}
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

ThreadDrawer.displayName = 'ThreadDrawer';

export { ThreadDrawer };

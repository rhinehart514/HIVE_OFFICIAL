'use client';

/**
 * ChatMessages - Chat message list for Space page
 *
 * Displays messages in a scrollable container with:
 * - Full-row messages (not bubbles)
 * - Author info, timestamp, reactions
 * - Auto-scroll to bottom on new messages
 * - Image attachments with lightbox
 */

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { X, Trash2, MoreHorizontal, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, Text, getInitials } from '@hive/ui/design-system/primitives';
import type { ChatMessage } from '../hooks/use-space-residence-state';
import { UnreadDivider } from './feed/unread-divider';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
  /** Timestamp of last read message */
  lastReadAt?: Date | string | null;
  /** Number of unread messages */
  unreadCount?: number;
  /**
   * Optional function to check if user can delete a message
   * @param authorId - The author ID of the message
   * @returns true if user can delete this message
   */
  canDeleteMessage?: (authorId: string) => boolean;
  /**
   * Optional callback to delete a message
   */
  onDeleteMessage?: (messageId: string) => Promise<void>;
  /**
   * Optional callback to report a message
   * @param messageId - The message ID
   * @param authorName - The author's display name
   * @param content - The message content (for preview)
   */
  onReportMessage?: (messageId: string, authorName: string, content: string) => void;
}

export function ChatMessages({
  messages,
  isLoading,
  className,
  lastReadAt,
  unreadCount = 0,
  canDeleteMessage,
  onDeleteMessage,
  onReportMessage,
}: ChatMessagesProps) {
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const [showUnreadDivider, setShowUnreadDivider] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Parse lastReadAt to Date
  const lastReadDate = React.useMemo(() => {
    if (!lastReadAt) return null;
    return typeof lastReadAt === 'string' ? new Date(lastReadAt) : lastReadAt;
  }, [lastReadAt]);

  // Find unread divider position
  const unreadDividerIndex = React.useMemo(() => {
    if (!lastReadDate || unreadCount === 0) return -1;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].timestamp > lastReadDate.getTime()) {
        return i;
      }
    }
    return -1;
  }, [messages, lastReadDate, unreadCount]);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (isLoading) {
    return <ChatMessagesSkeleton />;
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-16">
          <Text size="lg" tone="muted" className="mb-2">
            Start the conversation
          </Text>
          <Text size="sm" tone="muted">
            Be the first to say something in this board
          </Text>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollRef}
        className={cn('flex-1 overflow-y-auto px-4 py-4 space-y-4', className)}
      >
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const showAuthor = !prevMessage || prevMessage.authorId !== message.authorId;
          const timeDiff = prevMessage ? message.timestamp - prevMessage.timestamp : Infinity;
          const showTimestamp = timeDiff > 300000; // 5 minutes
          const showDividerBefore = showUnreadDivider && index === unreadDividerIndex;

          return (
            <React.Fragment key={message.id}>
              {showDividerBefore && (
                <UnreadDivider
                  count={unreadCount}
                  onDismiss={() => {
                    setShowUnreadDivider(false);
                    if (scrollRef.current) {
                      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    }
                  }}
                />
              )}
              <MessageRow
                message={message}
                showAuthor={showAuthor || showTimestamp || showDividerBefore}
                onImageClick={setLightboxImage}
                canDelete={canDeleteMessage?.(message.authorId) ?? false}
                onDelete={onDeleteMessage}
                onReport={onReportMessage}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Lightbox for full-size image view */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

interface MessageRowProps {
  message: ChatMessage;
  showAuthor: boolean;
  onImageClick?: (url: string) => void;
  canDelete?: boolean;
  onDelete?: (messageId: string) => Promise<void>;
  onReport?: (messageId: string, authorName: string, content: string) => void;
}

function MessageRow({ message, showAuthor, onImageClick, canDelete, onDelete, onReport }: MessageRowProps) {
  const [showActions, setShowActions] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Type-safe access to attachments
  const attachments = (message as ChatMessage & { attachments?: Array<{ url: string; filename: string; mimeType: string }> }).attachments;

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(message.id);
    } finally {
      setIsDeleting(false);
      setShowActions(false);
    }
  };

  return (
    <div
      className={cn(
        'group flex gap-3 relative',
        'hover:bg-white/[0.06] -mx-2 px-2 py-1 rounded-lg',
        'transition-colors'
      )}
      data-testid="message-row"
    >
      {/* Avatar (only for first in group) */}
      <div className="w-8 flex-shrink-0">
        {showAuthor && (
          <Avatar size="sm">
            <AvatarFallback>{getInitials(message.authorName)}</AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {showAuthor && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <Text size="sm" weight="medium">
              {message.authorName}
            </Text>
            <Text size="xs" tone="muted" className="font-mono">
              @{message.authorHandle}
            </Text>
            <Text size="xs" tone="muted">
              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
            </Text>
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <Text size="sm" className="whitespace-pre-wrap break-words">
            {message.content}
          </Text>
        )}

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachments.map((attachment, index) => (
              <button
                key={index}
                onClick={() => onImageClick?.(attachment.url)}
                className={cn(
                  'relative rounded-lg overflow-hidden',
                  'border border-white/[0.06]',
                  'hover:border-white/[0.06] transition-colors',
                  'cursor-pointer'
                )}
              >
                <img
                  src={attachment.url}
                  alt={attachment.filename}
                  className="max-w-xs max-h-48 object-contain"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full',
                  'text-xs',
                  'transition-colors',
                  reaction.hasReacted
                    ? 'bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)]'
                    : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1]'
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="font-mono">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions (on hover) */}
      {((canDelete && onDelete) || onReport) && (
        <div className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className={cn(
                'p-1 rounded hover:bg-white/[0.06] transition-colors',
                'text-white/50 hover:text-white/50'
              )}
              data-testid="message-actions-button"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Dropdown menu */}
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <div className={cn(
                  'absolute right-0 top-full mt-1 z-20',
                  'bg-[var(--bg-elevated)] border border-white/[0.06] rounded-lg',
                  'py-1 min-w-[120px]'
                )}>
                  {/* Report action - available for all users */}
                  {onReport && (
                    <button
                      onClick={() => {
                        onReport(message.id, message.authorName, message.content || '');
                        setShowActions(false);
                      }}
                      className={cn(
                        'w-full px-3 py-1.5 text-left text-sm',
                        'text-white/50 hover:text-white hover:bg-white/[0.06]',
                        'flex items-center gap-2'
                      )}
                      data-testid="report-button"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      Report
                    </button>
                  )}
                  {/* Delete action - only for authorized users */}
                  {canDelete && onDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className={cn(
                        'w-full px-3 py-1.5 text-left text-sm',
                        'text-red-400 hover:bg-red-500/10',
                        'flex items-center gap-2',
                        'disabled:opacity-50'
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Timestamp on hover (for grouped messages) */}
      {!showAuthor && !((canDelete && onDelete) || onReport) && (
        <div className="w-12 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Text size="xs" tone="muted" className="text-right">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </div>
      )}
    </div>
  );
}

function ChatMessagesSkeleton() {
  return (
    <div className="flex-1 px-4 py-4 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="h-4 w-24 rounded bg-white/[0.06]" />
              <div className="h-4 w-16 rounded bg-white/[0.06]" />
            </div>
            <div className="h-4 w-full rounded bg-white/[0.06]" />
            <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}

ChatMessages.displayName = 'ChatMessages';

'use client';

/**
 * MessageItem - Single message with hover actions
 *
 * Features:
 * - Author avatar and name (for first in group)
 * - Content with markdown support
 * - Reactions
 * - Hover actions (react, reply, more)
 * - Attachments
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus, MessageSquare, MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { SPACE_COMPONENTS, spaceTypographyClasses } from '@hive/tokens';

export interface MessageReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface MessageAttachment {
  url: string;
  filename: string;
  mimeType: string;
}

export interface Message {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  timestamp: string;
  reactions?: MessageReaction[];
  replyCount?: number;
  attachments?: MessageAttachment[];
}

interface MessageItemProps {
  message: Message;
  /** Whether to show author info (first in group) */
  showAuthor?: boolean;
  /** Whether this is the current user's message */
  isOwn?: boolean;
  /** Reaction handler */
  onReact?: (emoji: string) => void;
  /** Reply handler */
  onReply?: () => void;
  /** Delete handler (if permitted) */
  onDelete?: () => void;
}

export function MessageItem({
  message,
  showAuthor = true,
  isOwn = false,
  onReact,
  onReply,
  onDelete,
}: MessageItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  const { messageItem } = SPACE_COMPONENTS;

  // Format timestamp
  const formattedTime = React.useMemo(() => {
    const date = new Date(message.timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [message.timestamp]);

  // Quick emoji reactions
  const quickEmojis = ['👍', '❤️', '😂', '👀', '🎉'];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowEmojiPicker(false);
      }}
      className={cn(
        'relative group',
        'rounded-lg transition-colors',
        isHovered && 'bg-white/[0.02]'
      )}
      style={{ padding: `${messageItem.paddingY}px 8px` }}
    >
      <div className="flex gap-3">
        {/* Avatar (or spacer) */}
        <div style={{ width: `${messageItem.avatarSize}px` }} className="flex-shrink-0">
          {showAuthor && (
            <Avatar size="sm">
              {message.authorAvatarUrl && <AvatarImage src={message.authorAvatarUrl} />}
              <AvatarFallback className="text-xs">
                {getInitials(message.authorName)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Author and timestamp */}
          {showAuthor && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className={cn(spaceTypographyClasses.messageAuthor, 'text-white')}>
                {message.authorName}
              </span>
              <span className={spaceTypographyClasses.timestamp}>
                {formattedTime}
              </span>
            </div>
          )}

          {/* Message content */}
          <p className={cn(spaceTypographyClasses.messageContent, 'text-white/80 break-words')}>
            {message.content}
          </p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.attachments.map((attachment, i) => (
                <a
                  key={i}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {attachment.mimeType.startsWith('image/') ? (
                    <img
                      src={attachment.url}
                      alt={attachment.filename}
                      className="max-w-xs max-h-48 rounded-lg border border-white/[0.06]"
                    />
                  ) : (
                    <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white/60 hover:bg-white/[0.06] transition-colors">
                      {attachment.filename}
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => onReact?.(reaction.emoji)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
                    'text-xs transition-colors',
                    reaction.userReacted
                      ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]'
                      : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.10]'
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Thread count */}
          {message.replyCount && message.replyCount > 0 && (
            <button
              onClick={onReply}
              className="mt-2 text-xs text-white/50 hover:text-white/70 transition-colors"
            >
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute top-0 right-2',
              'flex items-center gap-0.5',
              'bg-[#141414] border border-white/[0.08] rounded-lg shadow-lg',
              'p-0.5'
            )}
          >
            {/* Quick emoji picker */}
            {showEmojiPicker ? (
              <div className="flex items-center gap-0.5 px-1">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact?.(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1 hover:bg-white/[0.08] rounded transition-colors text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* React button */}
                {onReact && (
                  <button
                    onClick={() => setShowEmojiPicker(true)}
                    className="p-1.5 hover:bg-white/[0.08] rounded transition-colors"
                    title="Add reaction"
                  >
                    <SmilePlus className="w-4 h-4 text-white/50" />
                  </button>
                )}

                {/* Reply button */}
                {onReply && (
                  <button
                    onClick={onReply}
                    className="p-1.5 hover:bg-white/[0.08] rounded transition-colors"
                    title="Reply in thread"
                  >
                    <MessageSquare className="w-4 h-4 text-white/50" />
                  </button>
                )}

                {/* Delete button (own messages or with permission) */}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4 text-red-400/60" />
                  </button>
                )}

                {/* More options */}
                <button
                  className="p-1.5 hover:bg-white/[0.08] rounded transition-colors"
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4 text-white/50" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

MessageItem.displayName = 'MessageItem';

export default MessageItem;

'use client';

/**
 * ChatMessage Component
 * LOCKED: Discord × Apple Hybrid — Glass Bubbles (V2)
 *
 * Design Decision (January 11, 2026):
 * - Frosted glass bubbles for all messages
 * - Gold-tinted glass for own messages
 * - Discord-style hover action bar
 * - Always-visible timestamps
 * - Subtle glass borders
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Text,
  getInitials,
} from '../primitives';

export interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
    };
    timestamp: Date;
    isOwn?: boolean;
    isPinned?: boolean;
    reactions?: Array<{
      emoji: string;
      count: number;
      hasReacted?: boolean;
    }>;
  };
  /** Show author info (use false in MessageGroup for subsequent messages) */
  showAuthor?: boolean;
  /** Show timestamp */
  showTimestamp?: boolean;
  /** Compact mode for dense layouts */
  compact?: boolean;
  /** React to message callback */
  onReact?: (emoji: string) => void;
  /** Reply to message callback */
  onReply?: () => void;
  /** Pin message callback */
  onPin?: () => void;
  /** Additional className */
  className?: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  showAuthor = true,
  showTimestamp = true,
  compact = false,
  onReact,
  onReply,
  onPin,
  className,
}) => {
  const { content, author, timestamp, isOwn, isPinned, reactions = [] } = message;
  const initials = getInitials(author.name);

  return (
    <div
      className={cn(
        'group relative',
        isPinned && 'bg-[var(--color-accent-gold)]/5',
        className
      )}
    >
      <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
        {/* Avatar */}
        {showAuthor && (
          <Avatar size={compact ? 'xs' : 'sm'} className="flex-shrink-0 mt-0.5">
            {author.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        )}
        {!showAuthor && <div className={compact ? 'w-6' : 'w-8'} />}

        {/* Content */}
        <div className={cn('flex-1 min-w-0', isOwn && 'flex flex-col items-end')}>
          {/* Header */}
          {showAuthor && (
            <div className={cn('flex items-baseline gap-2 mb-1', isOwn && 'flex-row-reverse')}>
              <Text
                size="sm"
                weight="medium"
                className={cn(isOwn && 'text-[var(--color-accent-gold)]')}
              >
                {isOwn ? 'You' : author.name}
              </Text>
              {showTimestamp && (
                <Text size="xs" tone="muted">
                  {formatTime(timestamp)}
                </Text>
              )}
              {isPinned && (
                <span className="text-[var(--color-accent-gold)]" title="Pinned">
                  📌
                </span>
              )}
            </div>
          )}

          {/* Glass Bubble */}
          <div
            className={cn(
              'max-w-[85%] px-4 py-2.5',
              'backdrop-blur-sm',
              'transition-colors duration-[var(--duration-snap)]',
              isOwn
                ? [
                    'bg-[var(--color-accent-gold)]/15',
                    'border border-[var(--color-accent-gold)]/20',
                    'rounded-2xl rounded-tr-sm',
                  ]
                : [
                    'bg-white/5',
                    'border border-white/10',
                    'rounded-2xl rounded-tl-sm',
                  ]
            )}
          >
            <Text size={compact ? 'sm' : 'default'}>
              {content}
            </Text>
          </div>

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className={cn('flex flex-wrap gap-1.5 mt-2', isOwn && 'justify-end')}>
              {reactions.map((reaction, i) => (
                <button
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs',
                    'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-surface)]',
                    'transition-colors duration-[var(--duration-snap)]',
                    reaction.hasReacted && 'ring-1 ring-[var(--color-interactive-active)]'
                  )}
                  onClick={() => onReact?.(reaction.emoji)}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-[var(--color-text-secondary)]">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Discord-style Hover Action Bar */}
        {(onReact || onReply || onPin) && (
          <div
            className={cn(
              'absolute -top-2',
              isOwn ? 'left-0' : 'right-0',
              'opacity-0 group-hover:opacity-100',
              'transition-all duration-[var(--duration-snap)]',
              'flex items-center gap-1',
              'bg-[var(--color-bg-card)] rounded-lg px-2 py-1',
              'shadow-lg border border-[var(--color-border)]'
            )}
          >
            {onReact && (
              <button
                className="p-1 hover:bg-[var(--color-bg-elevated)] rounded transition-colors"
                onClick={() => onReact('👍')}
                title="React"
              >
                <span className="text-sm">😀</span>
              </button>
            )}
            {onReply && (
              <button
                className="p-1 hover:bg-[var(--color-bg-elevated)] rounded transition-colors"
                onClick={onReply}
                title="Reply"
              >
                <span className="text-sm">↩️</span>
              </button>
            )}
            {onPin && (
              <button
                className="p-1 hover:bg-[var(--color-bg-elevated)] rounded transition-colors"
                onClick={onPin}
                title={isPinned ? 'Unpin' : 'Pin'}
              >
                <span className="text-sm">📌</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ChatMessage.displayName = 'ChatMessage';

export { ChatMessage };

'use client';

/**
 * ChatMessages - Chat message list for Space page
 *
 * Displays messages in a scrollable container with:
 * - Full-row messages (not bubbles)
 * - Author info, timestamp, reactions
 * - Auto-scroll to bottom on new messages
 */

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, Text, getInitials } from '@hive/ui/design-system/primitives';
import type { ChatMessage } from '../hooks/use-space-residence-state';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
}

export function ChatMessages({ messages, isLoading, className }: ChatMessagesProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

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
    <div
      ref={scrollRef}
      className={cn('flex-1 overflow-y-auto px-4 py-4 space-y-4', className)}
    >
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const showAuthor = !prevMessage || prevMessage.authorId !== message.authorId;
        const timeDiff = prevMessage ? message.timestamp - prevMessage.timestamp : Infinity;
        const showTimestamp = timeDiff > 300000; // 5 minutes

        return (
          <MessageRow
            key={message.id}
            message={message}
            showAuthor={showAuthor || showTimestamp}
          />
        );
      })}
    </div>
  );
}

interface MessageRowProps {
  message: ChatMessage;
  showAuthor: boolean;
}

function MessageRow({ message, showAuthor }: MessageRowProps) {
  return (
    <div
      className={cn(
        'group flex gap-3',
        'hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded-lg',
        'transition-colors'
      )}
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
        <Text size="sm" className="whitespace-pre-wrap break-words">
          {message.content}
        </Text>

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
                    : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1]'
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="font-mono">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timestamp on hover (for grouped messages) */}
      {!showAuthor && (
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
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="h-4 w-24 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-4 w-16 rounded bg-white/[0.04] animate-pulse" />
            </div>
            <div className="h-4 w-full rounded bg-white/[0.04] animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

ChatMessages.displayName = 'ChatMessages';

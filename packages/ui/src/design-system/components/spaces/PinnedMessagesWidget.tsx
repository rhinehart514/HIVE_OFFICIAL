'use client';

/**
 * PinnedMessagesWidget Component
 *
 * Sidebar widget showing pinned messages in a space.
 */

import * as React from 'react';
import { Text } from '../../primitives';
import { cn } from '../../../lib/utils';

export interface PinnedMessage {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  pinnedAt: Date | string;
  pinnedBy?: string;
}

export interface PinnedMessagesWidgetProps {
  messages?: PinnedMessage[];
  onMessageClick?: (messageId: string) => void;
  onViewAll?: () => void;
  maxVisible?: number;
  className?: string;
}

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function truncateContent(content: string, maxLength: number = 80): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + '...';
}

const PinnedMessagesWidget: React.FC<PinnedMessagesWidgetProps> = ({
  messages = [],
  onMessageClick,
  onViewAll,
  maxVisible = 3,
  className,
}) => {
  const visibleMessages = messages.slice(0, maxVisible);
  const hasMore = messages.length > maxVisible;

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--color-border)]',
        'bg-[var(--color-bg-elevated)]',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[var(--color-life-gold)]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M16 4v6h4l-8 8-8-8h4V4h8z" transform="rotate(180, 12, 12)" />
          </svg>
          <Text size="sm" weight="medium">
            Pinned Messages
          </Text>
          <Text size="xs" tone="muted" className="ml-auto">
            {messages.length}
          </Text>
        </div>
      </div>

      {/* Messages List */}
      <div className="divide-y divide-[var(--color-border)]">
        {visibleMessages.map((message) => (
          <button
            key={message.id}
            type="button"
            onClick={() => onMessageClick?.(message.id)}
            className={cn(
              'w-full px-4 py-3 text-left',
              'hover:bg-[var(--color-bg-muted)] transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-inset'
            )}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Text size="xs" weight="medium" className="truncate">
                    {message.author.name}
                  </Text>
                  <Text size="xs" tone="muted">
                    {formatRelativeTime(message.pinnedAt)}
                  </Text>
                </div>
                <Text size="sm" tone="secondary" className="line-clamp-2">
                  {truncateContent(message.content)}
                </Text>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* View All */}
      {hasMore && onViewAll && (
        <div className="px-4 py-2 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onViewAll}
            className={cn(
              'w-full py-1.5 text-center',
              'text-sm text-[var(--color-text-muted)]',
              'hover:text-[var(--color-text-secondary)] transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-white/50'
            )}
          >
            View all {messages.length} pinned
          </button>
        </div>
      )}
    </div>
  );
};

PinnedMessagesWidget.displayName = 'PinnedMessagesWidget';

export { PinnedMessagesWidget };

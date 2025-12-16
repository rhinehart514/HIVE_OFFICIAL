'use client';

/**
 * PinnedMessagesWidget - Display pinned messages in space sidebar
 *
 * Shows pinned messages from the space chat board, allowing quick access
 * to important announcements and information.
 *
 * Features:
 * - Collapsible widget pattern
 * - Click to jump to message in chat
 * - Author avatar and timestamp
 * - Empty state when no pinned messages
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { Pin, MessageSquare, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { cn } from '../../../lib/utils';
import { CollapsibleWidget } from './collapsible-widget';
import { SpaceEmptyState } from './space-empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';

// ============================================================
// Types
// ============================================================

export interface PinnedMessage {
  id: string;
  boardId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  timestamp: number;
}

export interface PinnedMessagesWidgetProps {
  /** List of pinned messages */
  messages: PinnedMessage[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback when a message is clicked */
  onMessageClick?: (messageId: string, boardId: string) => void;
  /** Whether the widget is collapsible */
  collapsible?: boolean;
  /** Whether collapsed by default */
  defaultCollapsed?: boolean;
  /** Compact mode for mobile */
  compact?: boolean;
  /** Inline mode (no wrapper styling) */
  inline?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================
// PinnedMessageItem
// ============================================================

interface PinnedMessageItemProps {
  message: PinnedMessage;
  onClick?: () => void;
}

function PinnedMessageItem({ message, onClick }: PinnedMessageItemProps) {
  const timestamp = new Date(message.timestamp);
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

  // Truncate content for preview
  const truncatedContent = message.content.length > 80
    ? message.content.slice(0, 80) + '...'
    : message.content;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg',
        'hover:bg-white/5 active:bg-white/10',
        'transition-colors duration-150',
        'group'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          {message.authorAvatarUrl ? (
            <AvatarImage src={message.authorAvatarUrl} alt={message.authorName} />
          ) : (
            <AvatarFallback className="bg-[#1A1A1A] text-[#A1A1A6] text-xs">
              {message.authorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-medium text-[#FAFAFA] truncate">
              {message.authorName}
            </span>
            <span className="text-xs text-[#818187] flex-shrink-0">
              {timeAgo}
            </span>
          </div>
          <p className="text-sm text-[#A1A1A6] line-clamp-2">
            {truncatedContent}
          </p>
        </div>

        <ChevronRight className="w-4 h-4 text-[#52525B] group-hover:text-[#A1A1A6] flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ============================================================
// Loading Skeleton
// ============================================================

function PinnedMessageSkeleton() {
  return (
    <div className="p-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1A1A1A]" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-[#1A1A1A] rounded" />
            <div className="h-3 w-16 bg-[#1A1A1A] rounded" />
          </div>
          <div className="h-4 w-full bg-[#1A1A1A] rounded" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function PinnedMessagesWidget({
  messages,
  isLoading = false,
  onMessageClick,
  collapsible = true,
  defaultCollapsed = false,
  compact = false,
  inline = false,
  className,
}: PinnedMessagesWidgetProps) {
  const isEmpty = !isLoading && messages.length === 0;

  // Empty state content
  const emptyState = (
    <SpaceEmptyState
      variant="custom"
      icon={<Pin className="w-6 h-6" />}
      title="No pinned messages"
      description="Important messages pinned by leaders will appear here"
    />
  );

  // Content
  const content = (
    <div className={cn(compact && 'space-y-0')}>
      {isLoading ? (
        <>
          <PinnedMessageSkeleton />
          <PinnedMessageSkeleton />
        </>
      ) : (
        <div className="divide-y divide-[#2A2A2A]/50">
          {messages.map((message) => (
            <PinnedMessageItem
              key={message.id}
              message={message}
              onClick={
                onMessageClick
                  ? () => onMessageClick(message.id, message.boardId)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );

  // Inline mode (no wrapper)
  if (inline) {
    return isEmpty ? emptyState : content;
  }

  // Full widget with CollapsibleWidget wrapper
  return (
    <CollapsibleWidget
      title="Pinned"
      icon={<Pin className="w-4 h-4" />}
      badge={messages.length > 0 ? messages.length : undefined}
      defaultCollapsed={defaultCollapsed}
      persistKey="space-pinned-messages"
      isEmpty={isEmpty}
      emptyState={emptyState}
      className={className}
    >
      {content}
    </CollapsibleWidget>
  );
}

export default PinnedMessagesWidget;

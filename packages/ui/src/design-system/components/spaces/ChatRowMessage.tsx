'use client';

/**
 * ChatRowMessage Component
 *
 * Full-width message rows for theater mode chat.
 * Replaces bubble layout with clean, scannable rows.
 *
 * Design principles:
 * - Full-width rows (not bubbles)
 * - Author info on left, content on right
 * - Gold left border for reactions
 * - Gold line indicator for threads
 * - Minimal chrome, maximum conversation
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';

// ============================================================
// Types
// ============================================================

export interface ChatRowMessageAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: 'owner' | 'admin' | 'moderator' | 'member';
}

export interface ChatRowMessageReaction {
  emoji: string;
  count: number;
  hasReacted?: boolean;
}

export interface ChatRowMessageProps {
  id: string;
  content: string;
  author: ChatRowMessageAuthor;
  timestamp: number | Date;

  // Message state
  isPinned?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;

  // Thread indicator
  hasThread?: boolean;
  threadCount?: number;

  // Reactions
  reactions?: ChatRowMessageReaction[];

  // Display options
  showAuthor?: boolean;
  isHighlighted?: boolean;
  isCompact?: boolean;

  // Callbacks
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onPin?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewThread?: () => void;
  onAuthorClick?: (authorId: string) => void;

  className?: string;
}

// ============================================================
// Helpers
// ============================================================

function formatTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  if (isToday) {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================
// Quick Reactions
// ============================================================

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥'];

// ============================================================
// Component
// ============================================================

export function ChatRowMessage({
  id,
  content,
  author,
  timestamp,
  isPinned = false,
  isEdited = false,
  isDeleted = false,
  hasThread = false,
  threadCount = 0,
  reactions = [],
  showAuthor = true,
  isHighlighted = false,
  isCompact = false,
  onReact,
  onReply,
  onPin,
  onEdit,
  onDelete,
  onViewThread,
  onAuthorClick,
  className,
}: ChatRowMessageProps) {
  const [showActions, setShowActions] = React.useState(false);

  // Determine left border styling
  const hasReactions = reactions.length > 0;
  const showGoldBorder = hasThread || hasReactions;

  if (isDeleted) {
    return (
      <div className={cn(
        'flex gap-4 px-6 py-3',
        'text-[#6B6B70] italic',
        className
      )}>
        <div className="w-10 h-10" />
        <span className="text-sm">Message deleted</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex gap-4 px-6',
        isCompact ? 'py-1' : 'py-3',
        'transition-colors duration-150',
        'hover:bg-white/[0.02]',

        // Gold left border for threads/reactions
        showGoldBorder && 'border-l-2',
        hasThread && 'border-[#FFD700]',
        hasReactions && !hasThread && 'border-[#FFD700]/30',
        !showGoldBorder && 'border-l-2 border-transparent',

        // Pinned state
        isPinned && 'bg-[#FFD700]/[0.03]',

        // Highlighted (scroll target)
        isHighlighted && 'bg-white/[0.05] animate-pulse',

        className
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAuthor ? (
        <button
          className="w-10 h-10 rounded-xl bg-[#141312] overflow-hidden flex-shrink-0
            hover:ring-2 hover:ring-white/20 transition-all duration-150"
          onClick={() => onAuthorClick?.(author.id)}
        >
          {author.avatarUrl ? (
            <img
              src={author.avatarUrl}
              alt={author.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#6B6B70] text-sm font-medium">
              {getInitials(author.name)}
            </div>
          )}
        </button>
      ) : (
        <div className="w-10 flex-shrink-0" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header (author + time) */}
        {showAuthor && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <button
              className="text-white font-medium hover:underline"
              onClick={() => onAuthorClick?.(author.id)}
            >
              {author.name}
            </button>

            {/* Role badge */}
            {author.role && author.role !== 'member' && (
              <span className={cn(
                'text-label-xs px-1.5 py-0.5 rounded font-medium uppercase tracking-wide',
                author.role === 'owner' && 'bg-[#FFD700]/20 text-[#FFD700]',
                author.role === 'admin' && 'bg-white/10 text-white/70',
                author.role === 'moderator' && 'bg-white/5 text-white/50',
              )}>
                {author.role}
              </span>
            )}

            <span className="text-[#6B6B70] text-xs">
              {formatTime(timestamp)}
            </span>

            {isEdited && (
              <span className="text-[#6B6B70] text-xs">(edited)</span>
            )}

            {isPinned && (
              <span className="text-[#FFD700] text-xs">pinned</span>
            )}
          </div>
        )}

        {/* Message text */}
        <p className={cn(
          'text-[#A3A19E] whitespace-pre-wrap break-words',
          isCompact && 'text-sm',
        )}>
          {content}
        </p>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {reactions.map((reaction, i) => (
              <button
                key={`${reaction.emoji}-${i}`}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                  'bg-white/[0.06] hover:bg-white/[0.10]',
                  'transition-colors duration-150',
                  reaction.hasReacted && 'ring-1 ring-[#FFD700]/50 bg-[#FFD700]/10',
                )}
                onClick={() => onReact?.(reaction.emoji)}
              >
                <span>{reaction.emoji}</span>
                <span className="text-[#6B6B70]">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread indicator */}
        {hasThread && threadCount > 0 && (
          <button
            className="flex items-center gap-2 mt-2 text-sm text-[#FFD700] hover:underline"
            onClick={onViewThread}
          >
            <span>{threadCount} {threadCount === 1 ? 'reply' : 'replies'}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Hover Actions */}
      {showActions && (
        <div className={cn(
          'absolute top-2 right-4',
          'flex items-center gap-0.5 p-1',
          'bg-[#1E1D1B] rounded-lg border border-white/[0.08]',
          'shadow-lg',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
        )}>
          {/* Quick reactions */}
          {onReact && QUICK_REACTIONS.slice(0, 3).map((emoji) => (
            <button
              key={emoji}
              className="p-1.5 rounded hover:bg-white/[0.08] transition-colors"
              onClick={() => onReact(emoji)}
              title={`React with ${emoji}`}
            >
              <span className="text-sm">{emoji}</span>
            </button>
          ))}

          {/* Reply */}
          {onReply && (
            <button
              className="p-1.5 rounded hover:bg-white/[0.08] transition-colors"
              onClick={onReply}
              title="Reply in thread"
            >
              <svg className="w-4 h-4 text-[#A3A19E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          )}

          {/* More actions dropdown would go here */}
          <button
            className="p-1.5 rounded hover:bg-white/[0.08] transition-colors"
            title="More actions"
          >
            <svg className="w-4 h-4 text-[#A3A19E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// System Message Variant
// ============================================================

export interface SystemMessageProps {
  content: string;
  timestamp?: number | Date;
  action?: string;
  className?: string;
}

export function SystemMessage({
  content,
  timestamp,
  action,
  className,
}: SystemMessageProps) {
  return (
    <div className={cn(
      'flex items-center justify-center gap-2 px-6 py-2',
      'text-[#6B6B70] text-sm',
      className
    )}>
      {action && (
        <span className="text-[#FFD700]">{action}</span>
      )}
      <span>{content}</span>
      {timestamp && (
        <span className="text-[#3D3D42]">
          {formatTime(timestamp)}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Date Separator
// ============================================================

export interface DateSeparatorProps {
  date: Date;
  className?: string;
}

export function DateSeparator({ date, className }: DateSeparatorProps) {
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={cn(
      'flex items-center gap-4 px-6 py-4',
      className
    )}>
      <div className="flex-1 h-px bg-white/[0.06]" />
      <span className="text-[#6B6B70] text-xs font-medium uppercase tracking-wide">
        {formatted}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

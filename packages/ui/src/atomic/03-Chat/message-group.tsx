'use client';

/**
 * MessageGroup - Grouped messages from the same author
 *
 * Phase 4: Chat Polish
 *
 * Design direction:
 * - Messages from same author in sequence form one visual block
 * - Single avatar for the group, not per-message
 * - Timestamps only when gap > 2 minutes
 * - Reduced visual separators between grouped messages
 *
 * Layout:
 * ┌────────────────────────────────────────────────────────┐
 * │  [Avatar]  Name                             2:30pm     │
 * │            Message 1                                   │
 * │            Message 2                                   │
 * │            Message 3                        2:32pm     │ ← gap > 2min
 * └────────────────────────────────────────────────────────┘
 */

import { motion } from 'framer-motion';
import { User, Check, CheckCheck } from 'lucide-react';
import * as React from 'react';
import { durationSeconds, easingArrays } from '@hive/tokens';

import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../00-Global/atoms/avatar';
import { ActivityPresence, getActivityLevel } from '../../identity/presence';

// ============================================
// Types
// ============================================

export interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  timestamp: number; // Unix ms
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  isOwn?: boolean;
  replyTo?: {
    id: string;
    authorName: string;
    preview: string;
  };
}

export interface MessageGroupProps {
  /** Messages in this group (same author, sequential) */
  messages: ChatMessage[];
  /** Whether this group is from the current user */
  isOwn?: boolean;
  /** Author's last active time for presence */
  authorLastActive?: number;
  /** Gap threshold for showing timestamps (ms) */
  timestampGapMs?: number;
  /** On message click */
  onMessageClick?: (message: ChatMessage) => void;
  /** On reply click */
  onReplyClick?: (message: ChatMessage) => void;
  /** Additional className */
  className?: string;
}

// ============================================
// Helpers
// ============================================

const TIME_GAP_THRESHOLD = 2 * 60 * 1000; // 2 minutes in ms

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function shouldShowTimestamp(
  currentTs: number,
  prevTs: number | null,
  threshold: number
): boolean {
  if (!prevTs) return true; // First message always shows
  return currentTs - prevTs > threshold;
}

// ============================================
// MessageGroup Component
// ============================================

export function MessageGroup({
  messages,
  isOwn = false,
  authorLastActive,
  timestampGapMs = TIME_GAP_THRESHOLD,
  onMessageClick,
  onReplyClick,
  className,
}: MessageGroupProps) {
  if (messages.length === 0) return null;

  const firstMessage = messages[0];
  const { authorName, authorAvatarUrl } = firstMessage;
  const activityLevel = getActivityLevel(authorLastActive);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: durationSeconds.standard,
        ease: easingArrays.default,
      }}
      className={cn(
        'group w-full py-3 px-4',
        'hover:bg-white/[0.01] transition-colors duration-150',
        className
      )}
    >
      <div className="max-w-3xl mx-auto flex gap-3">
        {/* Avatar - Only shown once for the group */}
        <div className="flex-shrink-0 relative">
          <Avatar
            className={cn(
              'h-9 w-9',
              isOwn ? 'ring-1 ring-white/10' : 'ring-1 ring-white/5'
            )}
          >
            {authorAvatarUrl ? (
              <AvatarImage src={authorAvatarUrl} alt={authorName} />
            ) : (
              <AvatarFallback className="bg-white/[0.06] text-white/60">
                {authorName?.charAt(0)?.toUpperCase() || (
                  <User className="h-4 w-4" />
                )}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Presence indicator */}
          {!isOwn && authorLastActive && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <ActivityPresence level={activityLevel} size="xs" />
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 min-w-0 space-y-0.5">
          {/* Header: Name + First timestamp */}
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className={cn(
                'text-[13px] font-medium',
                isOwn ? 'text-white' : 'text-white/90'
              )}
            >
              {isOwn ? 'You' : authorName}
            </span>
            <span className="text-[11px] text-white/30">
              {formatTime(firstMessage.timestamp)}
            </span>
          </div>

          {/* Message bubbles */}
          {messages.map((message, index) => {
            const prevTs = index > 0 ? messages[index - 1].timestamp : null;
            const showTimestamp =
              index > 0 &&
              shouldShowTimestamp(message.timestamp, prevTs, timestampGapMs);

            return (
              <div key={message.id} className="relative">
                {/* Inline timestamp for gaps > threshold */}
                {showTimestamp && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-white/[0.04]" />
                    <span className="text-[10px] text-white/25 flex-shrink-0">
                      {formatTime(message.timestamp)}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.04]" />
                  </div>
                )}

                {/* Reply reference */}
                {message.replyTo && (
                  <button
                    onClick={() => onReplyClick?.(message)}
                    className={cn(
                      'flex items-center gap-2 mb-1 text-[11px]',
                      'text-white/40 hover:text-white/60',
                      'transition-colors'
                    )}
                  >
                    <div className="w-3 h-3 border-l-2 border-t-2 border-white/20 rounded-tl" />
                    <span className="font-medium">{message.replyTo.authorName}</span>
                    <span className="truncate max-w-[200px]">
                      {message.replyTo.preview}
                    </span>
                  </button>
                )}

                {/* Message content */}
                <div
                  onClick={() => onMessageClick?.(message)}
                  className={cn(
                    'text-[15px] leading-relaxed cursor-pointer',
                    'text-white/85',
                    'rounded-lg py-0.5',
                    'transition-colors'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>

                {/* Status indicator for own messages */}
                {isOwn && message.status && index === messages.length - 1 && (
                  <div className="flex justify-end mt-0.5">
                    <MessageStatus status={message.status} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Message Status Component
// ============================================

interface MessageStatusProps {
  status: ChatMessage['status'];
}

function MessageStatus({ status }: MessageStatusProps) {
  if (status === 'sending') {
    return (
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-[10px] text-white/30"
      >
        Sending...
      </motion.div>
    );
  }

  if (status === 'sent') {
    return <Check className="w-3 h-3 text-white/30" />;
  }

  if (status === 'delivered') {
    return <CheckCheck className="w-3 h-3 text-white/30" />;
  }

  if (status === 'read') {
    return <CheckCheck className="w-3 h-3 text-[#FFD700]/60" />;
  }

  return null;
}

// ============================================
// Message Grouping Utility
// ============================================

/**
 * Groups sequential messages from the same author
 */
export function groupMessages(
  messages: ChatMessage[],
  maxGapMs: number = 5 * 60 * 1000 // 5 minutes default for grouping
): ChatMessage[][] {
  if (messages.length === 0) return [];

  const groups: ChatMessage[][] = [];
  let currentGroup: ChatMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const prevMessage = i > 0 ? messages[i - 1] : null;

    const shouldStartNewGroup =
      !prevMessage ||
      prevMessage.authorId !== message.authorId ||
      message.timestamp - prevMessage.timestamp > maxGapMs;

    if (shouldStartNewGroup) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [message];
    } else {
      currentGroup.push(message);
    }
  }

  // Push final group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

// ============================================
// GroupedMessageList Component
// ============================================

export interface GroupedMessageListProps {
  /** All messages to display */
  messages: ChatMessage[];
  /** Current user ID */
  currentUserId: string;
  /** Map of author IDs to last active times */
  authorPresence?: Record<string, number>;
  /** Max gap for grouping (ms) */
  groupingGapMs?: number;
  /** Gap for showing inline timestamps (ms) */
  timestampGapMs?: number;
  /** On message click */
  onMessageClick?: (message: ChatMessage) => void;
  /** Additional className */
  className?: string;
}

export function GroupedMessageList({
  messages,
  currentUserId,
  authorPresence = {},
  groupingGapMs,
  timestampGapMs,
  onMessageClick,
  className,
}: GroupedMessageListProps) {
  const groups = React.useMemo(
    () => groupMessages(messages, groupingGapMs),
    [messages, groupingGapMs]
  );

  return (
    <div className={cn('space-y-1', className)}>
      {groups.map((group, index) => {
        const firstMessage = group[0];
        const isOwn = firstMessage.authorId === currentUserId;
        const authorLastActive = authorPresence[firstMessage.authorId];

        return (
          <MessageGroup
            key={`group-${firstMessage.id}`}
            messages={group}
            isOwn={isOwn}
            authorLastActive={authorLastActive}
            timestampGapMs={timestampGapMs}
            onMessageClick={onMessageClick}
          />
        );
      })}
    </div>
  );
}

export default MessageGroup;

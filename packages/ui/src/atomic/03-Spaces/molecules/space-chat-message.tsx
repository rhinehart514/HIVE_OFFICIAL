'use client';

/**
 * SpaceChatMessage - Dark-first message component for Spaces
 *
 * Design Direction:
 * - Linear list layout for Spaces (many people)
 * - Your messages subtly tinted (not right-aligned bubbles)
 * - Role-based name colors (owner=gold, admin=blue, mod=green)
 * - Grouped messages (same author within 5 mins)
 * - Gold reactions
 * - Thread indicators
 *
 * @author HIVE Frontend Team
 * @version 2.0.0 - Dark-first design
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Smile,
  Reply,
  MoreHorizontal,
  Pin,
  Pencil,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import * as React from 'react';

import { cn } from '../../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';
import { PresenceDot } from '../../../identity/presence';

// ============================================================
// Types
// ============================================================

export type MessageRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface SpaceChatMessageProps {
  /** Message ID */
  id: string;
  /** Message content */
  content: string;
  /** Author info */
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    role?: MessageRole;
    isOnline?: boolean;
  };
  /** Timestamp */
  timestamp: Date;
  /** Whether edited */
  isEdited?: boolean;
  /** Whether pinned */
  isPinned?: boolean;
  /** Whether deleted */
  isDeleted?: boolean;
  /** Whether this is from the current user */
  isOwn?: boolean;
  /** Whether this message is grouped with the previous */
  isGrouped?: boolean;
  /** Whether to show date separator above */
  showDateSeparator?: boolean;
  /** Reactions on this message */
  reactions?: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
  }>;
  /** Thread reply count */
  threadCount?: number;
  /** Reply preview (if this is a reply) */
  replyTo?: {
    authorName: string;
    preview: string;
  };
  /** Whether the message is highlighted (e.g., scroll-to) */
  isHighlighted?: boolean;

  // Actions
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onPin?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewThread?: () => void;

  /** Additional className */
  className?: string;
}

// ============================================================
// Role Colors
// ============================================================

const ROLE_COLORS: Record<MessageRole, string> = {
  owner: 'text-[#FFD700]',
  admin: 'text-blue-400',
  moderator: 'text-green-400',
  member: 'text-[#FAFAFA]',
};

// ============================================================
// Component
// ============================================================

export function SpaceChatMessage({
  id,
  content,
  author,
  timestamp,
  isEdited,
  isPinned,
  isDeleted,
  isOwn,
  isGrouped,
  showDateSeparator,
  reactions,
  threadCount,
  replyTo,
  isHighlighted,
  onReact,
  onReply,
  onPin,
  onEdit,
  onDelete,
  onViewThread,
  className,
}: SpaceChatMessageProps) {
  const [showActions, setShowActions] = React.useState(false);

  // Format time
  const timeString = format(timestamp, 'h:mm a');
  const dateString = format(timestamp, 'MMMM d, yyyy');

  return (
    <>
      {/* Date separator */}
      {showDateSeparator && (
        <div className="flex items-center gap-4 py-4 px-4">
          <div className="flex-1 h-px bg-[#2A2A2A]" />
          <span className="text-xs font-medium text-[#818187]">{dateString}</span>
          <div className="flex-1 h-px bg-[#2A2A2A]" />
        </div>
      )}

      {/* Message */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: 1,
          y: 0,
          backgroundColor: isHighlighted
            ? 'rgba(255, 215, 0, 0.1)'
            : undefined,
        }}
        data-message-id={id}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className={cn(
          'group relative px-4 transition-colors',
          isGrouped ? 'py-0.5' : 'py-2',
          // Own messages get subtle tint
          isOwn && 'bg-[#FFD700]/[0.02]',
          // Pinned messages
          isPinned && 'bg-[#FFD700]/[0.03] border-l-2 border-[#FFD700]/30',
          // Highlighted
          isHighlighted && 'ring-1 ring-[#FFD700]/30 ring-inset',
          // Hover
          'hover:bg-white/[0.02]',
          className
        )}
      >
        <div className="flex gap-3">
          {/* Avatar column */}
          <div className="w-10 flex-shrink-0">
            {!isGrouped && (
              <div className="relative">
                <Avatar className="h-10 w-10 ring-1 ring-[#2A2A2A]">
                  {author.avatarUrl ? (
                    <AvatarImage src={author.avatarUrl} alt={author.name} />
                  ) : (
                    <AvatarFallback className="bg-[#1A1A1A] text-[#A1A1A6]">
                      {author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {/* Online indicator */}
                {author.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <PresenceDot status="online" size="sm" ring />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content column */}
          <div className="flex-1 min-w-0">
            {/* Header (hidden if grouped) */}
            {!isGrouped && (
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className={cn(
                    'font-semibold text-sm',
                    ROLE_COLORS[author.role || 'member']
                  )}
                >
                  {author.name}
                </span>

                {/* Role badge */}
                {author.role && author.role !== 'member' && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider',
                      'bg-white/[0.04] text-[#818187]'
                    )}
                  >
                    {author.role}
                  </span>
                )}

                {/* Timestamp */}
                <span className="text-xs text-[#52525B]">{timeString}</span>

                {/* Edited indicator */}
                {isEdited && (
                  <span className="text-xs text-[#52525B]">(edited)</span>
                )}
              </div>
            )}

            {/* Reply preview */}
            {replyTo && (
              <div className="flex items-center gap-2 mb-1 text-xs text-[#818187]">
                <Reply className="w-3 h-3" />
                <span className="font-medium">{replyTo.authorName}</span>
                <span className="truncate max-w-[200px] opacity-75">
                  {replyTo.preview}
                </span>
              </div>
            )}

            {/* Message content */}
            <p
              className={cn(
                'text-[15px] leading-relaxed break-words whitespace-pre-wrap',
                isDeleted
                  ? 'text-[#818187] italic'
                  : 'text-[#FAFAFA]'
              )}
            >
              {isDeleted ? 'This message was deleted' : content}
            </p>

            {/* Reactions */}
            {reactions && reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {reactions.map((reaction) => (
                  <motion.button
                    key={reaction.emoji}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onReact?.(reaction.emoji)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-full text-sm',
                      'border transition-colors',
                      reaction.hasReacted
                        ? 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]'
                        : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#A1A1A6] hover:border-[#3A3A3A]'
                    )}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="text-xs">{reaction.count}</span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Thread indicator */}
            {threadCount && threadCount > 0 && onViewThread && (
              <button
                onClick={onViewThread}
                className={cn(
                  'flex items-center gap-1.5 mt-2 text-sm',
                  'text-blue-400 hover:text-blue-300 transition-colors'
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span>
                  {threadCount} {threadCount === 1 ? 'reply' : 'replies'}
                </span>
              </button>
            )}
          </div>

          {/* Action buttons (on hover) */}
          <AnimatePresence>
            {showActions && !isDeleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  'absolute right-4 -top-3',
                  'flex items-center gap-0.5',
                  'bg-[#141414] border border-[#2A2A2A] rounded-lg',
                  'shadow-lg shadow-black/30 p-1'
                )}
              >
                {/* React */}
                <ActionIconButton
                  onClick={() => onReact?.('👍')}
                  icon={<Smile className="w-4 h-4" />}
                  label="Add reaction"
                />

                {/* Reply */}
                {onReply && (
                  <ActionIconButton
                    onClick={onReply}
                    icon={<Reply className="w-4 h-4" />}
                    label="Reply"
                  />
                )}

                {/* Edit (own messages only) */}
                {isOwn && onEdit && (
                  <ActionIconButton
                    onClick={onEdit}
                    icon={<Pencil className="w-4 h-4" />}
                    label="Edit"
                  />
                )}

                {/* Pin */}
                {onPin && (
                  <ActionIconButton
                    onClick={onPin}
                    icon={<Pin className="w-4 h-4" />}
                    label={isPinned ? 'Unpin' : 'Pin'}
                  />
                )}

                {/* Delete */}
                {onDelete && (
                  <ActionIconButton
                    onClick={onDelete}
                    icon={<Trash2 className="w-4 h-4" />}
                    label="Delete"
                    variant="danger"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

// ============================================================
// Action Icon Button
// ============================================================

interface ActionIconButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'danger';
}

function ActionIconButton({
  onClick,
  icon,
  label,
  variant = 'default',
}: ActionIconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-1.5 rounded transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
        variant === 'danger'
          ? 'text-[#818187] hover:text-red-400 hover:bg-red-500/10'
          : 'text-[#818187] hover:text-[#FAFAFA] hover:bg-white/[0.04]'
      )}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

export default SpaceChatMessage;

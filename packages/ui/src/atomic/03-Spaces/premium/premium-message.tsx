'use client';

/**
 * PremiumMessage - ChatGPT-style message with generous spacing
 *
 * Design Philosophy:
 * - Messages BREATHE - generous vertical spacing
 * - Clean author presentation with role colors
 * - Smooth hover actions with glass morphism
 * - Gold accents for owners and reactions
 * - Physics-based micro-interactions
 *
 * Inspired by: ChatGPT, Discord, Linear
 *
 * @author HIVE Frontend Team
 * @version 1.0.0 - Premium redesign
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Smile,
  Reply,
  MoreHorizontal,
  Pin,
  Pencil,
  Trash2,
  MessageSquare,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../../../lib/utils';
import { premium } from '../../../lib/premium-design';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';

// ============================================================
// Types
// ============================================================

export type MessageRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface PremiumMessageProps {
  /** Message ID */
  id: string;
  /** Message content */
  content: string;
  /** Author information */
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    role?: MessageRole;
  };
  /** Timestamp */
  timestamp: Date;
  /** Whether this is the current user's message */
  isOwn?: boolean;
  /** Whether this message is grouped with previous (same author, close time) */
  isGrouped?: boolean;
  /** Whether to show date separator above */
  showDateSeparator?: boolean;
  /** Whether the message is pinned */
  isPinned?: boolean;
  /** Whether the message was edited */
  isEdited?: boolean;
  /** Whether the message is deleted */
  isDeleted?: boolean;
  /** Whether this message is highlighted (scroll-to target) */
  isHighlighted?: boolean;
  /** Reactions on this message */
  reactions?: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
  }>;
  /** Thread reply count */
  threadCount?: number;
  /** Whether user can edit */
  canEdit?: boolean;
  /** Whether user can delete */
  canDelete?: boolean;
  /** Whether user can pin */
  canPin?: boolean;

  // Callbacks
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onViewThread?: () => void;

  /** Additional className */
  className?: string;
}

// ============================================================
// Role Colors
// ============================================================

const ROLE_STYLES: Record<MessageRole, { text: string; badge: string }> = {
  owner: {
    text: 'text-[#FFD700]',
    badge: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20',
  },
  admin: {
    text: 'text-[#60A5FA]',
    badge: 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/20',
  },
  moderator: {
    text: 'text-[#34D399]',
    badge: 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20',
  },
  member: {
    text: 'text-[#FAFAFA]',
    badge: '',
  },
};

// ============================================================
// Motion Variants
// ============================================================

const messageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const actionBarVariants = {
  initial: { opacity: 0, scale: 0.95, y: 4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 4 },
};

// ============================================================
// Component
// ============================================================

export function PremiumMessage({
  id,
  content,
  author,
  timestamp,
  isOwn = false,
  isGrouped = false,
  showDateSeparator = false,
  isPinned = false,
  isEdited = false,
  isDeleted = false,
  isHighlighted = false,
  reactions = [],
  threadCount = 0,
  canEdit = false,
  canDelete = false,
  canPin = false,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onViewThread,
  className,
}: PremiumMessageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showActions, setShowActions] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(content);

  const roleStyle = ROLE_STYLES[author.role || 'member'];
  const timeString = format(timestamp, 'h:mm a');
  const dateString = format(timestamp, 'EEEE, MMMM d, yyyy');

  // Handle edit save
  const handleSaveEdit = () => {
    if (editContent.trim() !== content) {
      onEdit?.();
    }
    setIsEditing(false);
  };

  return (
    <>
      {/* Date Separator */}
      {showDateSeparator && (
        <div className="flex items-center gap-4 py-6 px-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <span className="text-[12px] font-medium text-[#6B6B70] tracking-wide">
            {dateString}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>
      )}

      {/* Message Container */}
      <motion.div
        variants={shouldReduceMotion ? {} : messageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={premium.motion.spring.default}
        data-message-id={id}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className={cn(
          'group relative',
          'px-5',
          // Spacing - generous breathing room
          isGrouped ? 'py-[2px]' : 'py-4',
          // Own message subtle tint
          isOwn && 'bg-[#FFD700]/[0.02]',
          // Pinned state
          isPinned && 'bg-[#FFD700]/[0.03] border-l-2 border-[#FFD700]/30',
          // Highlighted state (scroll-to)
          isHighlighted && 'bg-[#FFD700]/[0.08] ring-1 ring-inset ring-[#FFD700]/30',
          // Hover state
          'hover:bg-white/[0.02]',
          'transition-colors duration-150',
          className
        )}
      >
        <div className="flex gap-4">
          {/* Avatar Column */}
          <div className="w-10 flex-shrink-0">
            {!isGrouped && (
              <Avatar className="w-10 h-10 ring-2 ring-[#0A0A0A]">
                {author.avatarUrl ? (
                  <AvatarImage src={author.avatarUrl} alt={author.name} />
                ) : (
                  <AvatarFallback
                    className={cn(
                      'bg-[#1A1A1A] text-[#9A9A9F] font-medium',
                      author.role === 'owner' && 'bg-[#FFD700]/20 text-[#FFD700]'
                    )}
                  >
                    {author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            )}
          </div>

          {/* Content Column */}
          <div className="flex-1 min-w-0">
            {/* Header (hidden if grouped) */}
            {!isGrouped && (
              <div className="flex items-baseline gap-2 mb-1">
                {/* Author name with role color */}
                <span className={cn('font-semibold text-[15px]', roleStyle.text)}>
                  {author.name}
                </span>

                {/* Role badge (if not member) */}
                {author.role && author.role !== 'member' && (
                  <span
                    className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded-md border',
                      'uppercase tracking-wider',
                      roleStyle.badge
                    )}
                  >
                    {author.role}
                  </span>
                )}

                {/* Timestamp */}
                <span className="text-[12px] text-[#6B6B70]">{timeString}</span>

                {/* Edited indicator */}
                {isEdited && (
                  <span className="text-[11px] text-[#4A4A4F]">(edited)</span>
                )}
              </div>
            )}

            {/* Message Content */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3',
                    'bg-[#111111] border border-white/[0.10] rounded-xl',
                    'text-[17px] leading-[1.6] text-[#FAFAFA]',
                    'placeholder:text-[#6B6B70]',
                    'focus:outline-none focus:border-white/[0.20]',
                    'resize-none min-h-[80px]'
                  )}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 rounded-lg bg-[#FFD700] text-black text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(content);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-[#9A9A9F] text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p
                className={cn(
                  'text-[17px] leading-[1.6] break-words whitespace-pre-wrap',
                  isDeleted ? 'text-[#6B6B70] italic' : 'text-[#FAFAFA]'
                )}
              >
                {isDeleted ? 'This message was deleted' : content}
              </p>
            )}

            {/* Reactions */}
            {reactions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {reactions.map((reaction) => (
                  <motion.button
                    key={reaction.emoji}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onReact?.(reaction.emoji)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg',
                      'border transition-all duration-150',
                      reaction.hasReacted
                        ? 'bg-[#FFD700]/10 border-[#FFD700]/25 text-[#FFD700]'
                        : 'bg-white/[0.03] border-white/[0.06] text-[#9A9A9F] hover:border-white/[0.12]'
                    )}
                  >
                    <span className="text-[14px]">{reaction.emoji}</span>
                    <span className="text-[12px] font-medium">{reaction.count}</span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Thread indicator */}
            {threadCount > 0 && onViewThread && (
              <button
                onClick={onViewThread}
                className={cn(
                  'flex items-center gap-2 mt-3',
                  'text-[14px] text-[#60A5FA] hover:text-[#93C5FD]',
                  'transition-colors duration-150'
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span>
                  {threadCount} {threadCount === 1 ? 'reply' : 'replies'}
                </span>
              </button>
            )}
          </div>

          {/* Action Bar (on hover) */}
          <AnimatePresence>
            {showActions && !isDeleted && !isEditing && (
              <motion.div
                variants={actionBarVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={premium.motion.spring.snappy}
                className={cn(
                  'absolute right-4 -top-3',
                  'flex items-center gap-0.5 p-1',
                  // Glass morphism
                  'bg-[rgba(17,17,17,0.90)]',
                  'backdrop-blur-[16px]',
                  'border border-white/[0.10]',
                  'rounded-xl',
                  'shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
                )}
              >
                {/* React */}
                <ActionButton
                  onClick={() => onReact?.('👍')}
                  icon={<Smile className="w-4 h-4" />}
                  label="Add reaction"
                />

                {/* Reply */}
                {onReply && (
                  <ActionButton
                    onClick={onReply}
                    icon={<Reply className="w-4 h-4" />}
                    label="Reply"
                  />
                )}

                {/* Edit (own messages) */}
                {canEdit && (
                  <ActionButton
                    onClick={() => setIsEditing(true)}
                    icon={<Pencil className="w-4 h-4" />}
                    label="Edit"
                  />
                )}

                {/* Pin */}
                {canPin && onPin && (
                  <ActionButton
                    onClick={onPin}
                    icon={<Pin className="w-4 h-4" />}
                    label={isPinned ? 'Unpin' : 'Pin'}
                    isActive={isPinned}
                  />
                )}

                {/* Delete */}
                {canDelete && onDelete && (
                  <ActionButton
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
// Action Button Sub-component
// ============================================================

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'danger';
  isActive?: boolean;
}

function ActionButton({
  onClick,
  icon,
  label,
  variant = 'default',
  isActive = false,
}: ActionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        'p-2 rounded-lg transition-colors duration-150',
        variant === 'danger'
          ? 'text-[#6B6B70] hover:text-red-400 hover:bg-red-500/10'
          : isActive
            ? 'text-[#FFD700] bg-[#FFD700]/10'
            : 'text-[#6B6B70] hover:text-white hover:bg-white/[0.06]'
      )}
      aria-label={label}
    >
      {icon}
    </motion.button>
  );
}

export default PremiumMessage;

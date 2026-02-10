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
import { SmilePlus, MessageSquare, MoreHorizontal, Trash2, Pencil, Check, X, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { SPACE_COMPONENTS, spaceTypographyClasses } from '@hive/tokens';
import { InlineComponent, type InlineComponentData } from '@/components/spaces/chat/inline-components';

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
  /** Whether message has been edited */
  isEdited?: boolean;
  /** When the message was last edited */
  editedAt?: string;
  /** Inline component (poll, countdown, RSVP, etc.) */
  inlineComponent?: InlineComponentData;
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
  /** Edit handler (only for own messages) */
  onEdit?: (newContent: string) => void;
  /** Report handler */
  onReport?: () => void;
  /** Component vote handler */
  onComponentVote?: (componentId: string, optionIndex: number) => void;
  /** Component RSVP handler */
  onComponentRsvp?: (componentId: string, response: 'yes' | 'no' | 'maybe') => void;
}

export function MessageItem({
  message,
  showAuthor = true,
  isOwn = false,
  onReact,
  onReply,
  onDelete,
  onEdit,
  onReport,
  onComponentVote,
  onComponentRsvp,
}: MessageItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(message.content);
  const editInputRef = React.useRef<HTMLTextAreaElement>(null);

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing, editContent.length]);

  const handleEditSave = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(editContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

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
        // hover highlight removed
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
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={editInputRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className={cn(
                  'w-full px-3 py-2 rounded-lg',
                  'bg-white/[0.06] border border-white/[0.06]',
                  'text-white text-sm placeholder:text-white/50',
                  'focus:outline-none focus:ring-2 focus:ring-white/50',
                  'resize-none'
                )}
                rows={Math.max(2, editContent.split('\n').length)}
                placeholder="Edit message..."
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditSave}
                  disabled={!editContent.trim() || editContent === message.content}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                    'bg-[var(--color-gold)] text-black',
                    'hover:bg-[var(--color-gold)]/90 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs',
                    'text-white/50 hover:text-white hover:bg-white/[0.06]',
                    'transition-colors'
                  )}
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
                <span className="text-xs text-white/50 ml-2">
                  Enter to save, Esc to cancel
                </span>
              </div>
            </div>
          ) : (
            <p className={cn(spaceTypographyClasses.messageContent, 'text-white break-words')}>
              {message.content}
              {message.isEdited && (
                <span className="ml-1 text-xs text-white/50" title={message.editedAt ? `Edited ${new Date(message.editedAt).toLocaleString()}` : 'Edited'}>
                  (edited)
                </span>
              )}
            </p>
          )}

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
                    <div className="px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-sm text-white/50 hover:bg-white/[0.06] transition-colors">
                      {attachment.filename}
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}

          {/* Inline component (poll, countdown, RSVP) */}
          {message.inlineComponent && (
            <InlineComponent
              component={message.inlineComponent}
              onVote={
                onComponentVote
                  ? (optionIndex) => onComponentVote(message.inlineComponent!.id, optionIndex)
                  : undefined
              }
              onRsvp={
                onComponentRsvp
                  ? (response) => onComponentRsvp(message.inlineComponent!.id, response)
                  : undefined
              }
            />
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
                      : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.10]'
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
              className="mt-2 text-xs text-white/50 hover:text-white/50 transition-colors"
            >
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {/* Hover actions */}
      {isHovered && (
        <div
          className={cn(
            'absolute top-0 right-2',
            'flex items-center gap-0.5',
            'bg-[var(--bg-surface)] border border-white/[0.06] rounded-lg',
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
                    className="p-1 hover:bg-white/[0.06] rounded transition-colors text-sm"
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
                    className="p-1.5 hover:bg-white/[0.06] rounded transition-colors"
                    title="Add reaction"
                  >
                    <SmilePlus className="w-4 h-4 text-white/50" />
                  </button>
                )}

                {/* Reply button */}
                {onReply && (
                  <button
                    onClick={onReply}
                    className="p-1.5 hover:bg-white/[0.06] rounded transition-colors"
                    title="Reply in thread"
                  >
                    <MessageSquare className="w-4 h-4 text-white/50" />
                  </button>
                )}

                {/* Edit button (own messages only) */}
                {isOwn && onEdit && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 hover:bg-white/[0.06] rounded transition-colors"
                    title="Edit message"
                  >
                    <Pencil className="w-4 h-4 text-white/50" />
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

                {/* More options (Report, etc.) */}
                {onReport && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-1.5 hover:bg-white/[0.06] rounded transition-colors"
                      title="More options"
                      data-testid="message-actions-button"
                    >
                      <MoreHorizontal className="w-4 h-4 text-white/50" />
                    </button>
                    {showMoreMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowMoreMenu(false)}
                        />
                        <div
                          className={cn(
                            'absolute right-0 top-full mt-1 z-20',
                            'bg-[var(--bg-elevated)] border border-white/[0.06] rounded-lg',
                            'py-1 min-w-[120px]'
                          )}
                        >
                          <button
                            onClick={() => {
                              onReport();
                              setShowMoreMenu(false);
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
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
    </div>
  );
}

MessageItem.displayName = 'MessageItem';

export default MessageItem;

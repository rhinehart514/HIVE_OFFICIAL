'use client';

/**
 * SpaceChatBoard - Discord-style real-time chat for spaces
 *
 * Features:
 * - Real-time messaging with virtual scroll
 * - Board/channel switching (General, Events, Topics)
 * - Inline HiveLab component support
 * - Typing indicators
 * - Message reactions
 * - Message grouping by author/time
 * - System messages (joins, leaves, etc.)
 *
 * This replaces the feed-based approach with live chat.
 * Think: Discord channels within a HIVE space.
 *
 * Dark-first design tokens:
 * - Base: #0A0A0A, Surface: #141414, Elevated: #1A1A1A
 * - Text: #FAFAFA (primary), #A1A1A6 (secondary), #818187 (subtle)
 * - Border: #2A2A2A, #3A3A3A (strong)
 * - Gold: #FFD700 (owner, reactions, highlights)
 *
 * @author HIVE Frontend Team
 * @version 2.0.0 - Dark-first design update
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Hash,
  Calendar,
  MessageSquare,
  Plus,
  Smile,
  Reply,
  MoreHorizontal,
  Pin,
  ChevronDown,
  Users,
  Loader2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { formatDistanceToNow, format, isSameDay, differenceInMinutes } from 'date-fns';
import { cn } from '../../../lib/utils';
import { springPresets } from '@hive/tokens';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';
import { Button } from '../../00-Global/atoms/button';
import { ChatInput, type ChatInputHandle, type ToolInsertData } from '../../03-Chat/chat-input';
import { TypingIndicator } from '../../03-Chat/typing-indicator';
import { InlineElementRenderer } from '../../../components/hivelab/inline-element-renderer';

// ============================================================
// Virtualization Configuration
// ============================================================

/** Estimated height of a regular text message (px) */
const ESTIMATED_MESSAGE_HEIGHT = 72;

/** Estimated height of a grouped message (no avatar/header) */
const ESTIMATED_GROUPED_MESSAGE_HEIGHT = 32;

/** Estimated height of a message with inline component */
const ESTIMATED_COMPONENT_MESSAGE_HEIGHT = 200;

/** Number of items to render above/below viewport for smooth scrolling */
const VIRTUALIZER_OVERSCAN = 8;

/** Threshold from top to trigger load more (px) */
const LOAD_MORE_THRESHOLD = 200;

// ============================================================
// Types
// ============================================================

export interface SpaceBoardData {
  id: string;
  name: string;
  type: 'general' | 'topic' | 'event';
  description?: string;
  linkedEventId?: string;
  messageCount: number;
  isDefault?: boolean;
  isLocked?: boolean;
}

export interface ChatMessageData {
  id: string;
  boardId: string;
  type: 'text' | 'inline_component' | 'system';

  // Author
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole?: 'owner' | 'admin' | 'moderator' | 'member';

  // Content
  content: string;
  componentData?: {
    elementType: string;
    /** For deployed tools */
    deploymentId?: string;
    /** For inline chat components (polls, RSVP, etc.) */
    componentId?: string;
    toolId?: string;
    state?: Record<string, unknown>;
    isActive: boolean;
  };

  // System message data
  systemAction?: string;

  // Metadata
  timestamp: number;
  editedAt?: number;
  isDeleted?: boolean;
  isPinned?: boolean;

  // Reactions
  reactions?: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
  }>;

  // Threading
  replyToId?: string;
  replyToPreview?: string;
  threadCount?: number;
}

export interface TypingUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface SpaceChatBoardProps {
  /** Space ID */
  spaceId: string;
  /** Space name for display */
  spaceName?: string;
  /** Available boards/channels */
  boards: SpaceBoardData[];
  /** Currently active board ID */
  activeBoardId: string;
  /** Messages for active board */
  messages: ChatMessageData[];
  /** Users currently typing */
  typingUsers?: TypingUser[];
  /** Online member count */
  onlineCount?: number;
  /** Loading states */
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
  /** Current user info */
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  currentUserRole?: 'owner' | 'admin' | 'moderator' | 'member';
  /** Whether user can post */
  canPost?: boolean;
  /** Whether user is leader */
  isLeader?: boolean;
  /** Message ID to scroll to and highlight */
  scrollToMessageId?: string;
  /** Callback when scroll-to-message animation completes */
  onScrollToMessageComplete?: () => void;

  // Callbacks
  onBoardChange: (boardId: string) => void;
  onSendMessage: (content: string, replyToId?: string) => Promise<void>;
  onLoadMore?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onPinMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, content: string) => Promise<boolean>;
  onCreateBoard?: () => void;
  /** Callback when viewing a thread */
  onViewThread?: (messageId: string) => void;

  /** Callback when a tool is inserted (poll, event, countdown) */
  onInsertTool?: (toolData: ToolInsertData) => Promise<void>;
  /** Callback when "More tools" is clicked */
  onOpenToolGallery?: () => void;
  /** Whether to show the tool insertion toolbar */
  showToolbar?: boolean;
  /** Whether slash commands are enabled */
  enableSlashCommands?: boolean;
  /** Callback when a slash command is entered */
  onSlashCommand?: (command: { command: string; primaryArg?: string; listArgs: string[]; flags: Record<string, string | boolean | number>; raw: string; isValid: boolean; error?: string }) => Promise<void>;

  // Inline component rendering
  renderInlineComponent?: (componentData: ChatMessageData['componentData']) => React.ReactNode;

  /** Additional className */
  className?: string;
}

// ============================================================
// Board Selector
// ============================================================

interface BoardSelectorProps {
  boards: SpaceBoardData[];
  activeBoardId: string;
  onBoardChange: (boardId: string) => void;
  onCreateBoard?: () => void;
  isLeader?: boolean;
}

function BoardSelector({
  boards,
  activeBoardId,
  onBoardChange,
  onCreateBoard,
  isLeader,
}: BoardSelectorProps) {
  const getBoardIcon = (type: SpaceBoardData['type']) => {
    switch (type) {
      case 'event':
        return Calendar;
      case 'topic':
        return MessageSquare;
      default:
        return Hash;
    }
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Chat boards">
      {boards.map((board) => {
        const Icon = getBoardIcon(board.type);
        const isActive = board.id === activeBoardId;

        return (
          <motion.button
            key={board.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onBoardChange(board.id)}
            role="tab"
            aria-selected={isActive}
            aria-label={`${board.type} board: ${board.name}${board.messageCount > 0 && !isActive ? `, ${board.messageCount} unread` : ''}`}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg',
              'text-sm font-medium whitespace-nowrap transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
              isActive
                ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20'
                : 'text-[#A1A1A6] hover:text-[#FAFAFA] hover:bg-white/[0.04]'
            )}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span>{board.name}</span>
            {board.messageCount > 0 && !isActive && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/10 rounded-full" aria-hidden="true">
                {board.messageCount > 99 ? '99+' : board.messageCount}
              </span>
            )}
          </motion.button>
        );
      })}

      {/* Add board button (leaders only) */}
      {isLeader && onCreateBoard && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateBoard}
          className="text-[#818187] hover:text-[#A1A1A6]"
          aria-label="Create new board"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

// ============================================================
// Message Component
// ============================================================

interface MessageItemProps {
  message: ChatMessageData;
  isGrouped: boolean;
  showDate: boolean;
  currentUserId: string;
  spaceId: string;
  isSpaceLeader?: boolean;
  isEditing?: boolean;
  isHighlighted?: boolean;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onPin?: () => void;
  onDelete?: () => void;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (content: string) => Promise<void>;
  onViewThread?: () => void;
  renderInlineComponent?: (componentData: ChatMessageData['componentData']) => React.ReactNode;
}

function MessageItem({
  message,
  isGrouped,
  showDate,
  currentUserId,
  spaceId,
  isSpaceLeader,
  isEditing,
  isHighlighted,
  onReact,
  onReply,
  onPin,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onViewThread,
  renderInlineComponent,
}: MessageItemProps) {
  const [showActions, setShowActions] = React.useState(false);
  const [editContent, setEditContent] = React.useState(message.content);
  const [isSaving, setIsSaving] = React.useState(false);
  const editInputRef = React.useRef<HTMLTextAreaElement>(null);
  const isOwn = message.authorId === currentUserId;
  // Safely parse timestamp - fallback to current time if invalid
  const rawTimestamp = new Date(message.timestamp);
  const timestamp = isNaN(rawTimestamp.getTime()) ? new Date() : rawTimestamp;

  // Focus edit input when entering edit mode
  React.useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing, editContent.length]);

  // Reset edit content when message changes or edit mode is cancelled
  React.useEffect(() => {
    if (!isEditing) {
      setEditContent(message.content);
    }
  }, [isEditing, message.content]);

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!onSaveEdit || editContent.trim() === message.content || !editContent.trim()) {
      onCancelEdit?.();
      return;
    }

    setIsSaving(true);
    try {
      await onSaveEdit(editContent.trim());
    } finally {
      setIsSaving(false);
    }
  };

  // Handle key press in edit input
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit?.();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  // System message
  if (message.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center py-2"
      >
        <span className="text-xs text-[#818187] bg-[#141414]/50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </motion.div>
    );
  }

  // Date separator
  const dateSeparator = showDate && (
    <div className="flex items-center gap-4 py-4">
      <div className="flex-1 h-px bg-[#1A1A1A]" />
      <span className="text-xs text-[#818187] font-medium">
        {format(timestamp, 'MMMM d, yyyy')}
      </span>
      <div className="flex-1 h-px bg-[#1A1A1A]" />
    </div>
  );

  return (
    <>
      {dateSeparator}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: 1,
          y: 0,
          backgroundColor: isHighlighted ? 'rgba(255, 215, 0, 0.15)' : undefined,
        }}
        transition={{
          backgroundColor: { duration: 0.3 },
        }}
        data-message-id={message.id}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className={cn(
          'group relative px-4 hover:bg-white/[0.02] transition-colors',
          isGrouped ? 'py-0.5' : 'py-2',
          message.isPinned && 'bg-[#FFD700]/5 border-l-2 border-[#FFD700]/30',
          isHighlighted && 'ring-2 ring-[#FFD700]/50 ring-inset rounded-lg'
        )}
      >
        <div className="flex gap-3">
          {/* Avatar (hidden if grouped) */}
          <div className="w-10 flex-shrink-0">
            {!isGrouped && (
              <Avatar className="h-10 w-10">
                {message.authorAvatarUrl ? (
                  <AvatarImage src={message.authorAvatarUrl} alt={message.authorName} />
                ) : (
                  <AvatarFallback className="bg-[#1A1A1A] text-[#A1A1A6]">
                    {message.authorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header (hidden if grouped) */}
            {!isGrouped && (
              <div className="flex items-baseline gap-2 mb-1">
                <span className={cn(
                  'font-semibold text-sm',
                  message.authorRole === 'owner' && 'text-[#FFD700]',
                  message.authorRole === 'admin' && 'text-blue-400',
                  message.authorRole === 'moderator' && 'text-green-400',
                  !message.authorRole && 'text-[#FAFAFA]'
                )}>
                  {message.authorName}
                </span>
                {message.authorRole && message.authorRole !== 'member' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#818187] uppercase tracking-wider">
                    {message.authorRole}
                  </span>
                )}
                <span className="text-xs text-[#818187]">
                  {format(timestamp, 'h:mm a')}
                </span>
                {message.editedAt && (
                  <span className="text-xs text-[#52525B]">(edited)</span>
                )}
              </div>
            )}

            {/* Reply preview */}
            {message.replyToPreview && (
              <div className="flex items-center gap-2 mb-1 text-xs text-[#818187]">
                <Reply className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{message.replyToPreview}</span>
              </div>
            )}

            {/* Message content */}
            {message.type === 'text' && (
              isEditing ? (
                <div className="space-y-2">
                  <textarea
                    ref={editInputRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    disabled={isSaving}
                    className={cn(
                      'w-full px-3 py-2 text-[15px] leading-relaxed',
                      'bg-[#141414] border border-[#3A3A3A] rounded-lg',
                      'text-[#FAFAFA] placeholder-neutral-500',
                      'focus:outline-none focus:ring-2 focus:ring-[#FFD700]/40 focus:border-transparent',
                      'resize-none min-h-[60px]',
                      isSaving && 'opacity-50 cursor-not-allowed'
                    )}
                    placeholder="Edit your message..."
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#818187]">
                      Press <kbd className="px-1 py-0.5 bg-[#1A1A1A] rounded text-[#A1A1A6]">Enter</kbd> to save,{' '}
                      <kbd className="px-1 py-0.5 bg-[#1A1A1A] rounded text-[#A1A1A6]">Esc</kbd> to cancel
                    </span>
                    <div className="flex-1" />
                    <button
                      onClick={onCancelEdit}
                      disabled={isSaving}
                      className="p-1.5 rounded hover:bg-white/5 text-[#A1A1A6] hover:text-[#FAFAFA] disabled:opacity-50"
                      aria-label="Cancel edit"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving || !editContent.trim() || editContent.trim() === message.content}
                      className="p-1.5 rounded hover:bg-[#FFD700]/10 text-[#FFD700] disabled:opacity-50 disabled:text-[#818187]"
                      aria-label="Save edit"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <p className={cn(
                  'text-[15px] leading-relaxed text-[#FAFAFA] break-words whitespace-pre-wrap',
                  message.isDeleted && 'text-[#818187] italic'
                )}>
                  {message.isDeleted ? 'This message was deleted' : message.content}
                </p>
              )
            )}

            {/* Inline HiveLab component */}
            {message.type === 'inline_component' && message.componentData && (
              <div className="mt-2 rounded-lg border border-[#2A2A2A] bg-[#141414]/50 overflow-hidden">
                {renderInlineComponent ? (
                  renderInlineComponent(message.componentData)
                ) : message.componentData.componentId ? (
                  // Inline chat component (poll, RSVP, etc.)
                  <InlineElementRenderer
                    isInlineChat
                    inlineChatData={{
                      componentId: message.componentData.componentId,
                      elementType: message.componentData.elementType,
                      isActive: message.componentData.isActive,
                    }}
                    spaceId={spaceId}
                    userId={currentUserId}
                    isSpaceLeader={isSpaceLeader}
                    compact
                  />
                ) : (
                  // Deployed tool component
                  <InlineElementRenderer
                    componentData={{
                      elementType: message.componentData.elementType,
                      deploymentId: message.componentData.deploymentId || '',
                      toolId: message.componentData.toolId || '',
                      state: message.componentData.state,
                      isActive: message.componentData.isActive,
                    }}
                    spaceId={spaceId}
                    userId={currentUserId}
                    isSpaceLeader={isSpaceLeader}
                    compact
                  />
                )}
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
                      'flex items-center gap-1 px-2 py-0.5 rounded-full text-sm',
                      'border transition-colors',
                      reaction.hasReacted
                        ? 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]'
                        : 'bg-[#141414] border-[#2A2A2A] text-[#A1A1A6] hover:border-[#3A3A3A]'
                    )}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="text-xs">{reaction.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Thread indicator */}
            {message.threadCount && message.threadCount > 0 && onViewThread && (
              <button
                onClick={onViewThread}
                className="flex items-center gap-1.5 mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                aria-label={`View ${message.threadCount} ${message.threadCount === 1 ? 'reply' : 'replies'}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>
                  {message.threadCount} {message.threadCount === 1 ? 'reply' : 'replies'}
                </span>
              </button>
            )}
          </div>

          {/* Action buttons (on hover) */}
          <AnimatePresence>
            {showActions && !message.isDeleted && !isEditing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-4 top-0 -mt-3 flex items-center gap-0.5 bg-[#141414] border border-[#2A2A2A] rounded-lg shadow-lg p-1"
              >
                <button
                  onClick={() => onReact?.('thumbsUp')}
                  className="p-1.5 rounded hover:bg-white/5 text-[#A1A1A6] hover:text-[#FAFAFA] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  aria-label="Add reaction"
                >
                  <Smile className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={onReply}
                  className="p-1.5 rounded hover:bg-white/5 text-[#A1A1A6] hover:text-[#FAFAFA] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  aria-label="Reply to message"
                >
                  <Reply className="w-4 h-4" aria-hidden="true" />
                </button>
                {/* Edit button - only for own text messages */}
                {isOwn && message.type === 'text' && onStartEdit && (
                  <button
                    onClick={onStartEdit}
                    className="p-1.5 rounded hover:bg-white/5 text-[#A1A1A6] hover:text-[#FAFAFA] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    aria-label="Edit message"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
                {onPin && (
                  <button
                    onClick={onPin}
                    className="p-1.5 rounded hover:bg-white/5 text-[#A1A1A6] hover:text-[#FAFAFA] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    aria-label={message.isPinned ? 'Unpin message' : 'Pin message'}
                  >
                    <Pin className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
                {(isOwn || onDelete) && (
                  <button
                    onClick={onDelete}
                    className="p-1.5 rounded hover:bg-red-500/10 text-[#A1A1A6] hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                    aria-label="Delete message"
                  >
                    <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                  </button>
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
// Typing Users Display
// ============================================================

function TypingUsersDisplay({ users }: { users: TypingUser[] }) {
  if (users.length === 0) return null;

  const names = users.map((u) => u.name);
  let text = '';

  if (names.length === 1) {
    text = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`;
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing...`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-2 px-4 py-2 text-sm text-[#818187]"
    >
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-neutral-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <span>{text}</span>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SpaceChatBoard({
  spaceId,
  spaceName,
  boards,
  activeBoardId,
  messages,
  typingUsers = [],
  onlineCount,
  isLoading,
  isLoadingMore,
  hasMoreMessages,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserRole,
  canPost = true,
  isLeader,
  scrollToMessageId,
  onScrollToMessageComplete,
  onBoardChange,
  onSendMessage,
  onLoadMore,
  onReact,
  onPinMessage,
  onDeleteMessage,
  onEditMessage,
  onCreateBoard,
  onViewThread,
  onInsertTool,
  onOpenToolGallery,
  showToolbar = true,
  renderInlineComponent,
  className,
}: SpaceChatBoardProps) {
  const shouldReduceMotion = useReducedMotion();
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const chatInputRef = React.useRef<ChatInputHandle>(null);
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [isSending, setIsSending] = React.useState(false);
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = React.useState<string | null>(null);
  const previousMessageCountRef = React.useRef(0);
  const isAtBottomRef = React.useRef(true);

  // Message grouping logic - must be before virtualizer
  const groupedMessages = React.useMemo(() => {
    let lastDate: Date | null = null;
    let lastAuthorId: string | null = null;
    let lastTimestamp: number = 0;

    return messages.map((msg) => {
      const msgDate = new Date(msg.timestamp);
      const showDate = !lastDate || !isSameDay(lastDate, msgDate);
      const isGrouped =
        !showDate &&
        msg.authorId === lastAuthorId &&
        differenceInMinutes(msgDate, new Date(lastTimestamp)) < 5 &&
        msg.type === 'text';

      lastDate = msgDate;
      lastAuthorId = msg.authorId;
      lastTimestamp = msg.timestamp;

      return { message: msg, isGrouped, showDate };
    });
  }, [messages]);

  // Estimate row height based on message type and grouping
  const estimateSize = React.useCallback((index: number) => {
    const item = groupedMessages[index];
    if (!item) return ESTIMATED_MESSAGE_HEIGHT;

    const { message, isGrouped, showDate } = item;

    // Base height depends on message type
    let height = message.type === 'inline_component'
      ? ESTIMATED_COMPONENT_MESSAGE_HEIGHT
      : isGrouped
        ? ESTIMATED_GROUPED_MESSAGE_HEIGHT
        : ESTIMATED_MESSAGE_HEIGHT;

    // Add height for date separator
    if (showDate) {
      height += 48; // Date separator height
    }

    // Add height for reactions
    if (message.reactions && message.reactions.length > 0) {
      height += 32;
    }

    // Add height for thread indicator
    if (message.threadCount && message.threadCount > 0) {
      height += 28;
    }

    return height;
  }, [groupedMessages]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: groupedMessages.length,
    getScrollElement: () => messagesContainerRef.current,
    estimateSize,
    overscan: VIRTUALIZER_OVERSCAN,
    // Reverse mode: newest messages at bottom
    // We handle this by scrolling to end on mount and new messages
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Track if user is at bottom for auto-scroll behavior
  const checkIfAtBottom = React.useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Consider "at bottom" if within 100px of bottom
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Scroll to specific message when scrollToMessageId is provided
  React.useEffect(() => {
    if (!scrollToMessageId || isLoading) return;

    // Find the index of the message
    const messageIndex = groupedMessages.findIndex(
      (item) => item.message.id === scrollToMessageId
    );

    if (messageIndex !== -1) {
      // Scroll to the message using virtualizer
      virtualizer.scrollToIndex(messageIndex, {
        align: 'center',
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });

      // Highlight the message briefly
      setHighlightedMessageId(scrollToMessageId);

      // Remove highlight after animation
      const timeout = setTimeout(() => {
        setHighlightedMessageId(null);
        onScrollToMessageComplete?.();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [scrollToMessageId, isLoading, shouldReduceMotion, onScrollToMessageComplete, groupedMessages, virtualizer]);

  // Scroll to bottom on initial load and new messages (if user is at bottom)
  React.useEffect(() => {
    if (isLoading || groupedMessages.length === 0) return;

    const isNewMessage = groupedMessages.length > previousMessageCountRef.current;
    const shouldAutoScroll = isAtBottomRef.current || previousMessageCountRef.current === 0;

    if (isNewMessage && shouldAutoScroll && !scrollToMessageId) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(groupedMessages.length - 1, {
          align: 'end',
          behavior: shouldReduceMotion ? 'auto' : 'smooth',
        });
      });
    }

    previousMessageCountRef.current = groupedMessages.length;
  }, [groupedMessages.length, isLoading, shouldReduceMotion, scrollToMessageId, virtualizer]);

  // Handle scroll events for infinite loading
  const handleScroll = React.useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Update "at bottom" state
    isAtBottomRef.current = checkIfAtBottom();

    // Load more when scrolling near top
    if (!isLoadingMore && hasMoreMessages && container.scrollTop < LOAD_MORE_THRESHOLD) {
      onLoadMore?.();
    }
  }, [isLoadingMore, hasMoreMessages, onLoadMore, checkIfAtBottom]);

  // Send message handler
  const handleSendMessage = React.useCallback(async (content: string) => {
    if (!content.trim() || isSending) return;

    try {
      setIsSending(true);
      await onSendMessage(content, replyingTo ?? undefined);
      setReplyingTo(null);
    } finally {
      setIsSending(false);
    }
  }, [onSendMessage, replyingTo, isSending]);

  // Active board info
  const activeBoard = boards.find((b) => b.id === activeBoardId);

  return (
    <div
      className={cn('flex flex-col h-full bg-[#0A0A0A]', className)}
      role="region"
      aria-label={`${spaceName || 'Space'} chat - ${activeBoard?.name || 'General'} channel`}
    >
      {/* Board header */}
      <header className="flex-shrink-0 border-b border-[#2A2A2A] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hash className="w-5 h-5 text-[#818187]" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-[#FAFAFA]">
                {activeBoard?.name || 'General'}
              </h2>
              {activeBoard?.description && (
                <p className="text-xs text-[#818187] truncate max-w-[300px]">
                  {activeBoard.description}
                </p>
              )}
            </div>
          </div>

          {/* Online count */}
          {onlineCount !== undefined && (
            <div className="flex items-center gap-1.5 text-sm text-[#818187]" aria-label={`${onlineCount} members online`}>
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>{onlineCount} online</span>
            </div>
          )}
        </div>

        {/* Board tabs */}
        {boards.length > 1 && (
          <nav className="mt-3" aria-label="Chat boards">
            <BoardSelector
              boards={boards}
              activeBoardId={activeBoardId}
              onBoardChange={onBoardChange}
              onCreateBoard={onCreateBoard}
              isLeader={isLeader}
            />
          </nav>
        )}
      </header>

      {/* Messages area */}
      <main
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[#818187]" />
          </div>
        )}

        {/* Load more button */}
        {hasMoreMessages && !isLoadingMore && (
          <div className="flex justify-center py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              className="text-[#818187] hover:text-[#A1A1A6]"
            >
              <ChevronDown className="w-4 h-4 mr-1 rotate-180" />
              Load older messages
            </Button>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#818187] mb-4" />
            <p className="text-[#818187]">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A]/50 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-[#818187]" />
            </div>
            <h3 className="text-lg font-medium text-[#FAFAFA] mb-2">
              No messages yet
            </h3>
            <p className="text-sm text-[#818187] text-center max-w-sm">
              Be the first to start a conversation in {activeBoard?.name || 'this channel'}!
            </p>
          </div>
        ) : (
          /* Virtualized message list */
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualItem) => {
              const item = groupedMessages[virtualItem.index];
              if (!item) return null;

              const { message, isGrouped, showDate } = item;

              return (
                <div
                  key={message.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <MessageItem
                    message={message}
                    isGrouped={isGrouped}
                    showDate={showDate}
                    currentUserId={currentUserId}
                    spaceId={spaceId}
                    isSpaceLeader={isLeader}
                    isEditing={editingMessageId === message.id}
                    isHighlighted={highlightedMessageId === message.id}
                    onReact={onReact ? (emoji) => onReact(message.id, emoji) : undefined}
                    onReply={() => setReplyingTo(message.id)}
                    onPin={onPinMessage ? () => onPinMessage(message.id) : undefined}
                    onDelete={
                      (message.authorId === currentUserId || isLeader) && onDeleteMessage
                        ? () => onDeleteMessage(message.id)
                        : undefined
                    }
                    onStartEdit={
                      message.authorId === currentUserId && onEditMessage && message.type === 'text'
                        ? () => setEditingMessageId(message.id)
                        : undefined
                    }
                    onCancelEdit={() => setEditingMessageId(null)}
                    onSaveEdit={
                      onEditMessage
                        ? async (content: string) => {
                            const success = await onEditMessage(message.id, content);
                            if (success) {
                              setEditingMessageId(null);
                            }
                          }
                        : undefined
                    }
                    onViewThread={
                      onViewThread ? () => onViewThread(message.id) : undefined
                    }
                    renderInlineComponent={renderInlineComponent}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Typing indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && <TypingUsersDisplay users={typingUsers} />}
      </AnimatePresence>

      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#141414]/50 border-t border-[#2A2A2A]">
          <Reply className="w-4 h-4 text-[#818187]" />
          <span className="text-sm text-[#A1A1A6] flex-1 truncate">
            Replying to message
          </span>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-[#818187] hover:text-[#A1A1A6]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input area */}
      {canPost ? (
        <div className="flex-shrink-0 border-t border-[#2A2A2A]">
          <ChatInput
            ref={chatInputRef}
            onSubmit={handleSendMessage}
            onInsertTool={onInsertTool}
            onOpenToolGallery={onOpenToolGallery}
            showToolbar={showToolbar && !!onInsertTool}
            canInsertTools={!isSending && !activeBoard?.isLocked}
            placeholder={`Message #${activeBoard?.name || 'general'}...`}
            disabled={isSending || activeBoard?.isLocked}
          />
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-[#2A2A2A] px-4 py-4 text-center">
          <p className="text-sm text-[#818187]">
            You don't have permission to send messages in this channel.
          </p>
        </div>
      )}
    </div>
  );
}

export default SpaceChatBoard;

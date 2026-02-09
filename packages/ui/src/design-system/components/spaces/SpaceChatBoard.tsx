'use client';

/**
 * SpaceChatBoard Component
 *
 * Full-featured chat board for spaces with:
 * - Board tab switching with drag-drop reordering
 * - TheaterChatBoard for message rendering
 * - Slash command detection
 * - Tool insertion toolbar
 *
 * This replaces the deprecated stub in stubs/deprecated-components.tsx
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../../lib/utils';
import { TheaterChatBoard, type TheaterMessage } from './TheaterChatBoard';
import type { TypingUser } from './TypingDots';

// ============================================================
// Types
// ============================================================

export interface SpaceBoardData {
  id: string;
  name: string;
  type: 'general' | 'topic' | 'event';
  description?: string;
  messageCount?: number;
  isDefault?: boolean;
  isLocked?: boolean;
}

export interface ChatMessageData {
  id: string;
  boardId: string;
  type: 'text' | 'inline_component' | 'system';
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole?: 'owner' | 'admin' | 'moderator' | 'member';
  content: string;
  componentData?: {
    elementType: string;
    deploymentId?: string;
    componentId?: string;
    toolId?: string;
    state?: Record<string, unknown>;
    isActive: boolean;
  };
  systemAction?: string;
  timestamp: number;
  editedAt?: number;
  isDeleted?: boolean;
  isPinned?: boolean;
  reactions?: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
  }>;
  replyToId?: string;
  threadCount?: number;
}

export interface SlashCommandData {
  command: string;
  primaryArg?: string;
  listArgs: string[];
  flags: Record<string, string | boolean | number>;
  raw: string;
  isValid: boolean;
  error?: string;
}

export interface SpaceChatBoardProps {
  spaceId: string;
  spaceName?: string;
  boards: SpaceBoardData[];
  activeBoardId: string;
  messages: ChatMessageData[];
  typingUsers: TypingUser[];
  onlineCount?: number;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
  currentUserRole?: 'owner' | 'admin' | 'member';
  canPost?: boolean;
  isLeader?: boolean;
  scrollToMessageId?: string;
  onScrollToMessageComplete?: () => void;
  onBoardChange?: (boardId: string) => void;
  onSendMessage?: (content: string, replyToId?: string) => Promise<void>;
  onLoadMore?: () => Promise<void>;
  onReact?: (messageId: string, emoji: string) => void;
  onPinMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onViewThread?: (messageId: string) => void;
  onCreateBoard?: () => void;
  onInsertTool?: (toolData: {
    type: 'poll' | 'event' | 'countdown' | 'custom';
    config: Record<string, unknown>;
  }) => Promise<void>;
  onSlashCommand?: (command: SlashCommandData) => Promise<void>;
  onBoardReorder?: (boardIds: string[]) => Promise<void>;
  onSearchOpen?: () => void;
  showToolbar?: boolean;
  enableSlashCommands?: boolean;
  onTyping?: () => void;
  useEdgeToEdge?: boolean;
  className?: string;
}

// ============================================================
// Helpers
// ============================================================

function mapToTheaterMessage(msg: ChatMessageData): TheaterMessage {
  return {
    id: msg.id,
    type: msg.type,
    content: msg.content,
    authorId: msg.authorId,
    authorName: msg.authorName,
    authorAvatarUrl: msg.authorAvatarUrl,
    authorRole: msg.authorRole,
    timestamp: msg.timestamp,
    editedAt: msg.editedAt,
    isDeleted: msg.isDeleted,
    isPinned: msg.isPinned,
    reactions: msg.reactions?.map(r => ({
      emoji: r.emoji,
      count: r.count,
      hasReacted: r.hasReacted,
    })),
    threadCount: msg.threadCount,
    systemAction: msg.systemAction,
    componentData: msg.componentData,
  };
}

function parseSlashCommand(input: string): SlashCommandData | null {
  if (!input.startsWith('/')) return null;

  const trimmed = input.trim();
  const spaceIndex = trimmed.indexOf(' ');
  const command = (spaceIndex > 0 ? trimmed.slice(1, spaceIndex) : trimmed.slice(1)).toLowerCase();
  const argsStr = spaceIndex > 0 ? trimmed.slice(spaceIndex + 1).trim() : '';

  // Known commands
  const knownCommands = ['poll', 'rsvp', 'event', 'countdown', 'timer', 'announce', 'help', 'welcome', 'remind', 'automate'];
  if (!knownCommands.includes(command)) {
    return {
      command,
      primaryArg: undefined,
      listArgs: [],
      flags: {},
      raw: input,
      isValid: false,
      error: `Unknown command: /${command}`,
    };
  }

  // Parse args
  const quoted: string[] = [];
  const listArgs: string[] = [];
  const flags: Record<string, string | boolean | number> = {};

  // Extract quoted strings
  let remaining = argsStr;
  const quoteRegex = /"([^"]+)"/g;
  let match;
  while ((match = quoteRegex.exec(argsStr)) !== null) {
    quoted.push(match[1]);
    remaining = remaining.replace(match[0], ' ');
  }

  // Parse tokens
  const tokens = remaining.split(/\s+/).filter(t => t.length > 0);
  for (const token of tokens) {
    if (token.startsWith('--')) {
      const flagPart = token.slice(2);
      const eqIndex = flagPart.indexOf('=');
      if (eqIndex > 0) {
        const key = flagPart.slice(0, eqIndex);
        const value = flagPart.slice(eqIndex + 1);
        const numValue = parseFloat(value);
        flags[key] = !isNaN(numValue) ? numValue : value;
      } else {
        flags[flagPart] = true;
      }
    } else {
      listArgs.push(token);
    }
  }

  return {
    command,
    primaryArg: quoted[0],
    listArgs,
    flags,
    raw: input,
    isValid: true,
  };
}

// ============================================================
// Board Tabs Component (with drag-drop reordering)
// ============================================================

interface BoardTabsProps {
  boards: SpaceBoardData[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreateBoard?: () => void;
  onReorder?: (boardIds: string[]) => Promise<void>;
  onSearchOpen?: () => void;
  canCreate?: boolean;
  canReorder?: boolean;
}

interface SortableTabProps {
  board: SpaceBoardData;
  isActive: boolean;
  onSelect: () => void;
  canReorder: boolean;
}

function SortableTab({ board, isActive, onSelect, canReorder }: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id, disabled: !canReorder });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
        'touch-none select-none',
        isActive
          ? 'bg-white/10 text-white'
          : 'text-white/50 hover:text-white/70 hover:bg-white/5',
        isDragging && 'shadow-lg ring-1 ring-white/20',
        canReorder && 'cursor-grab active:cursor-grabbing'
      )}
      {...attributes}
      {...listeners}
    >
      {board.name}
    </button>
  );
}

function BoardTabs({
  boards,
  activeId,
  onSelect,
  onCreateBoard,
  onReorder,
  onSearchOpen,
  canCreate,
  canReorder = false,
}: BoardTabsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after 8px movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = boards.findIndex((b) => b.id === active.id);
      const newIndex = boards.findIndex((b) => b.id === over.id);
      const newOrder = arrayMove(boards, oldIndex, newIndex);
      await onReorder(newOrder.map((b) => b.id));
    }
  };

  const boardIds = boards.map((b) => b.id);

  return (
    <div className="flex items-center gap-1 px-3 md:px-4 py-2 border-b border-white/[0.06] bg-[var(--bg-ground,#0A0A09)] overflow-x-auto scrollbar-none">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={boardIds} strategy={horizontalListSortingStrategy}>
          {boards.map((board) => (
            <SortableTab
              key={board.id}
              board={board}
              isActive={activeId === board.id}
              onSelect={() => onSelect(board.id)}
              canReorder={canReorder}
            />
          ))}
        </SortableContext>
      </DndContext>
      {canCreate && onCreateBoard && (
        <button
          onClick={onCreateBoard}
          className="px-3 py-1.5 rounded-lg text-sm text-white/30 hover:text-white/50 hover:bg-white/5 transition-colors"
        >
          + Add
        </button>
      )}

      {/* Spacer to push search to right */}
      <div className="flex-1" />

      {/* Search button */}
      {onSearchOpen && (
        <button
          onClick={onSearchOpen}
          className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
          title="Search messages (Cmd+K)"
        >
          <Search className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================================
// Chat Composer with Slash Commands
// ============================================================

interface ChatComposerProps {
  onSend: (content: string) => Promise<void>;
  onSlashCommand?: (cmd: SlashCommandData) => Promise<void>;
  onTyping?: () => void;
  enableSlashCommands?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

function ChatComposer({
  onSend,
  onSlashCommand,
  onTyping,
  enableSlashCommands = true,
  disabled = false,
  placeholder = 'Message...',
}: ChatComposerProps) {
  const [value, setValue] = React.useState('');
  const [showSlashHint, setShowSlashHint] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled || isSending) return;

    const trimmed = value.trim();
    setIsSending(true);

    try {
      // Check for slash command
      if (enableSlashCommands && trimmed.startsWith('/') && onSlashCommand) {
        const cmd = parseSlashCommand(trimmed);
        if (cmd && cmd.isValid) {
          await onSlashCommand(cmd);
          setValue('');
          inputRef.current?.focus();
          return;
        }
      }

      // Regular message
      await onSend(trimmed);
      setValue('');
      inputRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Show slash hint
    setShowSlashHint(enableSlashCommands && newValue === '/');

    // Typing indicator
    if (onTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping();
      typingTimeoutRef.current = setTimeout(() => {}, 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-white/[0.06] bg-[var(--bg-ground,#0A0A09)]">
      <div className="relative px-3 md:px-4 py-3">
        {/* Slash command hint */}
        <AnimatePresence>
          {showSlashHint && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-full left-4 mb-2 p-3 rounded-xl bg-[#141312] border border-white/[0.08] shadow-xl"
            >
              <p className="text-xs text-white/50 mb-2">Quick commands:</p>
              <div className="space-y-1 text-sm">
                <p className="text-white/70"><span className="text-[#FFD700]">/poll</span> "Question?" Option1 Option2</p>
                <p className="text-white/70"><span className="text-[#FFD700]">/event</span> "Event Name" --date=tomorrow</p>
                <p className="text-white/70"><span className="text-[#FFD700]">/countdown</span> "Finals" 2025-05-10</p>
                <p className="text-white/70"><span className="text-[#FFD700]">/welcome</span> "Welcome message for new members"</p>
                <p className="text-white/70"><span className="text-[#FFD700]">/remind</span> "Reminder" --before=1h</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-[#141312] rounded-xl px-4 py-3',
              'text-white placeholder:text-[#6B6B70]',
              'border border-white/[0.06] focus:border-white/[0.12]',
              'focus:outline-none focus:ring-2 focus:ring-white/[0.10]',
              'transition-all duration-200',
              'min-h-[48px] max-h-[200px]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{ height: 'auto', minHeight: '48px' }}
          />

          <button
            type="submit"
            disabled={!value.trim() || disabled || isSending}
            className={cn(
              'p-3 rounded-xl transition-all duration-200',
              value.trim() && !isSending
                ? 'bg-[#FFD700] text-black hover:bg-[#FFD700]/90 active:scale-95'
                : 'bg-white/[0.06] text-[#6B6B70]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </form>
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
  typingUsers,
  onlineCount,
  isLoading = false,
  isLoadingMore = false,
  hasMoreMessages = false,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserRole,
  canPost = true,
  isLeader = false,
  scrollToMessageId,
  onScrollToMessageComplete,
  onBoardChange,
  onSendMessage,
  onLoadMore,
  onReact,
  onPinMessage,
  onDeleteMessage,
  onEditMessage,
  onViewThread,
  onCreateBoard,
  onInsertTool,
  onSlashCommand,
  onBoardReorder,
  onSearchOpen,
  showToolbar = true,
  enableSlashCommands = true,
  onTyping,
  useEdgeToEdge = false,
  className,
}: SpaceChatBoardProps) {
  // Filter messages for active board and map to TheaterMessage format
  const theaterMessages = React.useMemo(() => {
    return messages
      .filter((m) => m.boardId === activeBoardId)
      .map(mapToTheaterMessage);
  }, [messages, activeBoardId]);

  // Handle send with reply support
  const handleSend = async (content: string) => {
    if (onSendMessage) {
      await onSendMessage(content);
    }
  };

  // Handle board change
  const handleBoardChange = (boardId: string) => {
    if (onBoardChange) {
      onBoardChange(boardId);
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-[var(--bg-ground,#0A0A09)]', className)}>
      {/* Board Tabs */}
      {boards.length > 1 && (
        <BoardTabs
          boards={boards}
          activeId={activeBoardId}
          onSelect={handleBoardChange}
          onCreateBoard={onCreateBoard}
          onReorder={onBoardReorder}
          onSearchOpen={onSearchOpen}
          canCreate={isLeader}
          canReorder={isLeader}
        />
      )}

      {/* Search button when single board */}
      {boards.length <= 1 && onSearchOpen && (
        <div className="flex items-center justify-end px-3 md:px-4 py-2 border-b border-white/[0.06]">
          <button
            onClick={onSearchOpen}
            className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            title="Search messages (Cmd+K)"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Online indicator */}
      {onlineCount !== undefined && onlineCount > 0 && (
        <div className="px-4 py-2 border-b border-white/[0.04]">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>{onlineCount} online</span>
          </div>
        </div>
      )}

      {/* Chat Board */}
      <div className="flex-1 overflow-hidden">
        <TheaterChatBoard
          spaceId={spaceId}
          boardId={activeBoardId}
          messages={theaterMessages}
          typingUsers={typingUsers}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMoreMessages}
          currentUserId={currentUserId}
          canPost={false} // We use our own composer
          scrollToMessageId={scrollToMessageId}
          onScrollToMessageComplete={onScrollToMessageComplete}
          onLoadMore={onLoadMore}
          onReact={onReact}
          onViewThread={onViewThread}
          onPinMessage={onPinMessage}
          onDeleteMessage={onDeleteMessage}
          onEditMessage={onEditMessage}
          onTyping={onTyping}
        />
      </div>

      {/* Our Composer with Slash Commands */}
      {canPost && (
        <ChatComposer
          onSend={handleSend}
          onSlashCommand={onSlashCommand}
          onTyping={onTyping}
          enableSlashCommands={enableSlashCommands}
          disabled={!canPost}
          placeholder={enableSlashCommands ? 'Message... (try /poll or /event)' : 'Message...'}
        />
      )}
    </div>
  );
}

export default SpaceChatBoard;

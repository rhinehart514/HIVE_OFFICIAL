'use client';

/**
 * PremiumChatBoard - ChatGPT/Apple-style chat experience
 *
 * Design Philosophy:
 * - Clean, focused chat experience
 * - Generous message spacing (messages breathe)
 * - Floating glass composer as the star
 * - Minimal chrome - content is king
 * - Physics-based micro-interactions
 *
 * This is the main component for the premium Spaces chat.
 *
 * Inspired by: ChatGPT, Discord, Linear, Superhuman
 *
 * @author HIVE Frontend Team
 * @version 1.0.0 - Premium redesign
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { premium } from '../../../lib/premium-design';
import { PremiumMessageList, type MessageData } from './premium-message-list';
import { PremiumComposer } from './premium-composer';
import { PremiumBoardTabs, type BoardTab } from './premium-board-tabs';

// ============================================================
// Typing Users Indicator Sub-component
// ============================================================

function TypingUsersIndicator({ users }: { users: TypingUser[] }) {
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
    <div className="flex items-center gap-2 text-[13px] text-[#6B6B70]">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#6B6B70]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span>{text}</span>
    </div>
  );
}

// ============================================================
// Types
// ============================================================

export interface TypingUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface PremiumChatBoardProps {
  /** Space ID */
  spaceId: string;
  /** Available boards */
  boards: BoardTab[];
  /** Currently active board ID */
  activeBoardId: string;
  /** Messages for active board */
  messages: MessageData[];
  /** Current user info */
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  /** Users currently typing */
  typingUsers?: TypingUser[];

  // Loading states
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;

  // Permissions
  canPost?: boolean;
  isLeader?: boolean;
  canEditOwn?: boolean;
  canDeleteOwn?: boolean;
  canPin?: boolean;

  // Scroll-to support
  scrollToMessageId?: string;
  onScrollToMessageComplete?: () => void;

  // Callbacks
  onBoardChange: (boardId: string) => void;
  onSendMessage: (content: string) => Promise<void>;
  onLoadMore?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onViewThread?: (messageId: string) => void;
  onAddBoard?: () => void;

  /** Placeholder for composer */
  composerPlaceholder?: string;
  /** Whether AI is generating */
  isGenerating?: boolean;
  /** Stop generation callback */
  onStopGeneration?: () => void;

  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function PremiumChatBoard({
  spaceId,
  boards,
  activeBoardId,
  messages,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  typingUsers = [],
  isLoading = false,
  isLoadingMore = false,
  hasMoreMessages = false,
  canPost = true,
  isLeader = false,
  canEditOwn = true,
  canDeleteOwn = true,
  canPin = false,
  scrollToMessageId,
  onScrollToMessageComplete,
  onBoardChange,
  onSendMessage,
  onLoadMore,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onViewThread,
  onAddBoard,
  composerPlaceholder,
  isGenerating = false,
  onStopGeneration,
  className,
}: PremiumChatBoardProps) {
  // Get active board name for placeholder
  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const placeholder =
    composerPlaceholder || `Message ${activeBoard?.name || 'this space'}...`;

  return (
    <div
      className={cn(
        'flex flex-col h-full',
        'bg-[#0A0A0A]',
        className
      )}
    >
      {/* Board Tabs */}
      {boards.length > 0 && (
        <PremiumBoardTabs
          boards={boards}
          activeBoardId={activeBoardId}
          onBoardChange={onBoardChange}
          isLeader={isLeader}
          onAddBoard={onAddBoard}
        />
      )}

      {/* Message List */}
      <PremiumMessageList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMoreMessages}
        scrollToMessageId={scrollToMessageId}
        onScrollToComplete={onScrollToMessageComplete}
        onLoadMore={onLoadMore}
        onReact={onReact}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onPin={onPin}
        onViewThread={onViewThread}
        canEdit={canEditOwn}
        canDelete={canDeleteOwn}
        canPin={canPin}
        className="flex-1"
      />

      {/* Typing Indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={premium.motion.spring.snappy}
            className="px-5 py-2"
          >
            <TypingUsersIndicator users={typingUsers} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      {canPost && (
        <PremiumComposer
          placeholder={placeholder}
          onSubmit={onSendMessage}
          disabled={!canPost}
          isGenerating={isGenerating}
          onStop={onStopGeneration}
        />
      )}

      {/* Read-only state */}
      {!canPost && (
        <div className="px-5 py-4 text-center">
          <p className="text-[14px] text-[#6B6B70]">
            You don't have permission to post in this board
          </p>
        </div>
      )}
    </div>
  );
}

export default PremiumChatBoard;

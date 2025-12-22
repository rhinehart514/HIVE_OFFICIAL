'use client';

/**
 * ThreadDrawer - Slide-out panel for viewing thread replies
 *
 * Displays the parent message and its replies in a Discord-style thread view.
 * Slides in from the right and supports infinite scrolling for long threads.
 *
 * ## Visual Language
 * - Slides in from right
 * - 420px max width on desktop
 * - Full width on mobile
 * - Parent message pinned at top
 * - Reply list with virtual scroll
 * - Reply input at bottom
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageSquare,
  Reply,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '../../../lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../00-Global/atoms/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';
import { Button } from '../../00-Global/atoms/button';
import type { ChatMessageData } from '../organisms/space-chat-board';

// ============================================================
// Types
// ============================================================

export interface ThreadDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when drawer should close */
  onOpenChange: (open: boolean) => void;
  /** The parent message being replied to */
  parentMessage: ChatMessageData | null;
  /** Thread replies */
  replies: ChatMessageData[];
  /** Loading state */
  isLoading?: boolean;
  /** Loading more replies */
  isLoadingMore?: boolean;
  /** Whether there are more replies to load */
  hasMoreReplies?: boolean;
  /** Current user ID */
  currentUserId: string;
  /** Callback to load more replies */
  onLoadMore?: () => void;
  /** Callback to send a reply */
  onSendReply?: (content: string) => Promise<void>;
  /** Additional className */
  className?: string;
}

// ============================================================
// Thread Message Component
// ============================================================

interface ThreadMessageProps {
  message: ChatMessageData;
  isParent?: boolean;
  currentUserId: string;
}

function ThreadMessage({ message, isParent, currentUserId }: ThreadMessageProps) {
  const timestamp = new Date(message.timestamp);
  const isOwn = message.authorId === currentUserId;

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3',
        isParent && 'bg-neutral-900/50 border-b border-neutral-800'
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        {message.authorAvatarUrl ? (
          <AvatarImage src={message.authorAvatarUrl} alt={message.authorName} />
        ) : (
          <AvatarFallback className="bg-neutral-800 text-neutral-400 text-sm">
            {message.authorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className={cn(
              'font-semibold text-sm',
              message.authorRole === 'owner' && 'text-[#FFD700]',
              message.authorRole === 'admin' && 'text-blue-400',
              message.authorRole === 'moderator' && 'text-green-400',
              !message.authorRole && 'text-neutral-200'
            )}
          >
            {message.authorName}
          </span>
          <span className="text-xs text-neutral-500">
            {format(timestamp, 'h:mm a')}
          </span>
          {message.editedAt && (
            <span className="text-xs text-neutral-600">(edited)</span>
          )}
        </div>

        <p
          className={cn(
            'text-sm leading-relaxed text-neutral-300 break-words whitespace-pre-wrap',
            message.isDeleted && 'text-neutral-500 italic'
          )}
        >
          {message.isDeleted ? 'This message was deleted' : message.content}
        </p>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction) => (
              <span
                key={reaction.emoji}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                  'bg-neutral-900 border border-neutral-800 text-neutral-400'
                )}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ThreadDrawer({
  open,
  onOpenChange,
  parentMessage,
  replies,
  isLoading,
  isLoadingMore,
  hasMoreReplies,
  currentUserId,
  onLoadMore,
  onSendReply,
  className,
}: ThreadDrawerProps) {
  const [replyContent, setReplyContent] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const repliesContainerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Focus input when drawer opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Scroll to bottom when new replies come in
  React.useEffect(() => {
    if (repliesContainerRef.current && !isLoadingMore) {
      repliesContainerRef.current.scrollTop = repliesContainerRef.current.scrollHeight;
    }
  }, [replies.length, isLoadingMore]);

  // Handle sending a reply
  const handleSendReply = async () => {
    if (!replyContent.trim() || isSending || !onSendReply) return;

    setIsSending(true);
    try {
      await onSendReply(replyContent.trim());
      setReplyContent('');
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'flex flex-col p-0 w-full max-w-[420px]',
          'bg-black border-l border-neutral-800',
          className
        )}
        showClose={false}
      >
        {/* Header */}
        <SheetHeader className="flex-shrink-0 px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-neutral-400" />
              <SheetTitle className="text-base font-semibold text-neutral-200">
                Thread
              </SheetTitle>
              {replies.length > 0 && (
                <span className="text-sm text-neutral-500">
                  ({replies.length} {replies.length === 1 ? 'reply' : 'replies'})
                </span>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-neutral-200 transition-colors"
              aria-label="Close thread"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
            </div>
          ) : parentMessage ? (
            <>
              {/* Parent message */}
              <ThreadMessage
                message={parentMessage}
                isParent
                currentUserId={currentUserId}
              />

              {/* Replies section */}
              <div
                ref={repliesContainerRef}
                className="flex-1 overflow-y-auto custom-scrollbar"
              >
                {/* Load more indicator */}
                {hasMoreReplies && (
                  <div className="flex justify-center py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onLoadMore}
                      disabled={isLoadingMore}
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      {isLoadingMore ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 mr-1 rotate-180" />
                      )}
                      Load older replies
                    </Button>
                  </div>
                )}

                {/* Reply indicator */}
                {replies.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 text-xs text-neutral-500">
                    <Reply className="w-3 h-3" />
                    <span>
                      {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                    <div className="flex-1 h-px bg-neutral-800" />
                  </div>
                )}

                {/* Replies list */}
                {replies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <Reply className="w-8 h-8 text-neutral-600 mb-3" />
                    <p className="text-sm text-neutral-500">
                      No replies yet. Be the first to respond!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800/50">
                    {replies.map((reply) => (
                      <ThreadMessage
                        key={reply.id}
                        message={reply}
                        currentUserId={currentUserId}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-neutral-500">No message selected</p>
            </div>
          )}
        </div>

        {/* Reply input */}
        {parentMessage && onSendReply && (
          <div className="flex-shrink-0 border-t border-neutral-800 p-4">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                placeholder="Reply to thread..."
                className={cn(
                  'flex-1 px-3 py-2 text-sm',
                  'bg-neutral-900 border border-neutral-800 rounded-lg',
                  'text-neutral-200 placeholder-neutral-500',
                  'focus:outline-none focus:ring-2 focus:ring-[#FFD700]/40 focus:border-transparent',
                  'resize-none min-h-[40px] max-h-[120px]',
                  isSending && 'opacity-50 cursor-not-allowed'
                )}
                rows={1}
              />
              <Button
                onClick={handleSendReply}
                disabled={!replyContent.trim() || isSending}
                className="flex-shrink-0"
                size="sm"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Reply'
                )}
              </Button>
            </div>
            <p className="text-xs text-neutral-600 mt-2">
              Press <kbd className="px-1 py-0.5 bg-neutral-800 rounded text-neutral-400">Enter</kbd> to send
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ThreadDrawer;

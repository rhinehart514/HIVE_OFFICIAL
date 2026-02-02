'use client';

/**
 * ThreadPanel - Display thread replies in a slide-out panel
 *
 * Features:
 * - Shows parent message at top
 * - Lists thread replies
 * - Reply input at bottom
 * - Animates in from right
 *
 * @version 1.0.0 - Space Architecture Completion (Feb 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageItem, type Message } from './message-item';
import { MOTION } from '@hive/tokens';

interface ThreadReply extends Message {
  parentId: string;
}

interface ThreadPanelProps {
  /** Parent message being replied to */
  parentMessage: Message | null;
  /** Whether panel is open */
  isOpen: boolean;
  /** Close panel handler */
  onClose: () => void;
  /** Space ID for API calls */
  spaceId: string;
  /** Current user ID */
  currentUserId: string;
  /** Board ID (optional, inferred from parent) */
  boardId?: string;
}

export function ThreadPanel({
  parentMessage,
  isOpen,
  onClose,
  spaceId,
  currentUserId,
  boardId,
}: ThreadPanelProps) {
  const [replies, setReplies] = React.useState<ThreadReply[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [replyContent, setReplyContent] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const repliesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Fetch replies when panel opens
  React.useEffect(() => {
    if (isOpen && parentMessage) {
      fetchReplies();
    } else {
      setReplies([]);
      setError(null);
    }
  }, [isOpen, parentMessage?.id]);

  // Focus input when panel opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Scroll to bottom when new replies arrive
  React.useEffect(() => {
    if (repliesEndRef.current) {
      repliesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies.length]);

  const fetchReplies = async () => {
    if (!parentMessage) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: '50' });
      if (boardId) params.append('boardId', boardId);

      const response = await fetch(
        `/api/spaces/${spaceId}/chat/${parentMessage.id}/replies?${params}`
      );

      if (!response.ok) {
        throw new Error('Failed to load replies');
      }

      const data = await response.json();
      setReplies(data.data?.replies || data.replies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load replies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !parentMessage || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/chat/${parentMessage.id}/replies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: replyContent.trim(),
            boardId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send reply');
      }

      const data = await response.json();
      const newReply = data.data?.message || data.message;

      if (newReply) {
        setReplies((prev) => [...prev, newReply]);
      }
      setReplyContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && parentMessage && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 400,
            }}
            className={cn(
              'fixed right-0 top-0 bottom-0 z-50',
              'w-full max-w-md',
              'bg-[#0A0A09] border-l border-white/[0.06]',
              'flex flex-col'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-medium text-white">Thread</h3>
                <p className="text-xs text-white/50">
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </p>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  'p-2 rounded-lg',
                  'hover:bg-white/[0.06] transition-colors',
                  'text-white/50 hover:text-white'
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Parent message */}
            <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <MessageItem
                message={parentMessage}
                showAuthor={true}
                isOwn={parentMessage.authorId === currentUserId}
              />
            </div>

            {/* Replies */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-sm text-red-400">{error}</p>
                  <button
                    onClick={fetchReplies}
                    className="mt-2 text-sm text-white/60 hover:text-white underline"
                  >
                    Try again
                  </button>
                </div>
              ) : replies.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-white/40">No replies yet</p>
                  <p className="text-xs text-white/30 mt-1">
                    Be the first to reply
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {replies.map((reply) => (
                    <MessageItem
                      key={reply.id}
                      message={reply}
                      showAuthor={true}
                      isOwn={reply.authorId === currentUserId}
                    />
                  ))}
                  <div ref={repliesEndRef} />
                </div>
              )}
            </div>

            {/* Reply input */}
            <div className="px-4 py-3 border-t border-white/[0.06]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply..."
                  rows={1}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg',
                    'bg-white/[0.04] border border-white/[0.08]',
                    'text-white text-sm placeholder:text-white/30',
                    'focus:outline-none focus:ring-2 focus:ring-white/20',
                    'resize-none min-h-[40px] max-h-[120px]'
                  )}
                  style={{
                    height: 'auto',
                    overflowY: replyContent.split('\n').length > 3 ? 'auto' : 'hidden',
                  }}
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyContent.trim() || isSending}
                  className={cn(
                    'p-2 rounded-lg',
                    'bg-[var(--color-gold)] text-black',
                    'hover:bg-[var(--color-gold)]/90 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-white/30 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

ThreadPanel.displayName = 'ThreadPanel';

export default ThreadPanel;

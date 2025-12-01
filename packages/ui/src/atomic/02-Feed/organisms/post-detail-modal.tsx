'use client';

/**
 * Post Detail Modal
 * Full post view with comments section
 */

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Bookmark, Share2, Send, MoreHorizontal } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';
import { Button } from '../../00-Global/atoms/button';
import { Input } from '../../00-Global/atoms/input';
import { FeedMediaPreview, type MediaItem } from '../molecules/feed-media-preview';
import { FeedSpaceChip } from '../molecules/feed-space-chip';

// ============================================================
// Types
// ============================================================

export interface PostDetailAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  verified?: boolean;
}

export interface PostDetailSpace {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface PostDetailComment {
  id: string;
  author: PostDetailAuthor;
  content: string;
  createdAt: string;
  likes: number;
  hasLiked: boolean;
  replies?: PostDetailComment[];
}

export interface PostDetailData {
  id: string;
  author: PostDetailAuthor;
  space: PostDetailSpace;
  content: {
    headline?: string;
    body?: string;
    media?: MediaItem[];
    tags?: string[];
  };
  stats: {
    upvotes: number;
    comments: number;
    isUpvoted: boolean;
    isBookmarked: boolean;
  };
  createdAt: string;
  isEdited?: boolean;
  isPinned?: boolean;
}

export interface PostDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostDetailData | null;
  comments?: PostDetailComment[];
  isLoadingComments?: boolean;
  onUpvote?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onComment?: (postId: string, content: string) => Promise<void>;
  onCommentLike?: (commentId: string) => void;
  onSpaceClick?: (spaceId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  className?: string;
}

// ============================================================
// Comment Component
// ============================================================

function Comment({
  comment,
  onLike,
  onAuthorClick,
}: {
  comment: PostDetailComment;
  onLike?: (commentId: string) => void;
  onAuthorClick?: (authorId: string) => void;
}) {
  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
    } catch {
      return 'just now';
    }
  }, [comment.createdAt]);

  return (
    <div className="flex gap-3 py-3">
      <Avatar
        className="h-8 w-8 shrink-0 cursor-pointer"
        onClick={() => onAuthorClick?.(comment.author.id)}
      >
        <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
        <AvatarFallback>{comment.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium text-[var(--hive-text-primary)] cursor-pointer hover:underline"
            onClick={() => onAuthorClick?.(comment.author.id)}
          >
            {comment.author.name}
          </span>
          {comment.author.role && (
            <span className="rounded-full border border-[var(--hive-border-default)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--hive-text-tertiary)]">
              {comment.author.role}
            </span>
          )}
          <span className="text-xs text-[var(--hive-text-tertiary)]">{timeAgo}</span>
        </div>

        <p className="mt-1 text-sm text-[var(--hive-text-secondary)] whitespace-pre-wrap">
          {comment.content}
        </p>

        <div className="mt-2 flex items-center gap-4">
          <button
            onClick={() => onLike?.(comment.id)}
            className={cn(
              'flex items-center gap-1 text-xs transition-colors',
              comment.hasLiked
                ? 'text-[var(--hive-status-error)]'
                : 'text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)]'
            )}
          >
            <Heart className={cn('h-3.5 w-3.5', comment.hasLiked && 'fill-current')} />
            {comment.likes > 0 && <span>{comment.likes}</span>}
          </button>
          <button className="text-xs text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] transition-colors">
            Reply
          </button>
        </div>

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 pl-4 border-l border-[var(--hive-border-default)]">
            {comment.replies.map((reply) => (
              <Comment key={reply.id} comment={reply} onLike={onLike} onAuthorClick={onAuthorClick} />
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

export function PostDetailModal({
  open,
  onOpenChange,
  post,
  comments = [],
  isLoadingComments = false,
  onUpvote,
  onBookmark,
  onShare,
  onComment,
  onCommentLike,
  onSpaceClick,
  onAuthorClick,
  className,
}: PostDetailModalProps) {
  const [commentText, setCommentText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const commentsEndRef = React.useRef<HTMLDivElement>(null);

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post || !onComment) return;

    setIsSubmitting(true);
    try {
      await onComment(post.id, commentText.trim());
      setCommentText('');
      // Scroll to new comment
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeAgo = React.useMemo(() => {
    if (!post) return '';
    try {
      return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    } catch {
      return 'just now';
    }
  }, [post?.createdAt]);

  if (!post) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'relative w-full max-w-2xl max-h-[90vh] mx-4 bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)] rounded-2xl shadow-2xl overflow-hidden flex flex-col',
              className
            )}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--hive-border-default)]">
              <h2 className="text-sm font-medium text-[var(--hive-text-primary)]">Post</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Post content */}
              <div className="p-4 border-b border-[var(--hive-border-default)]">
                {/* Author header */}
                <div className="flex items-start gap-3">
                  <Avatar
                    className="h-10 w-10 shrink-0 cursor-pointer"
                    onClick={() => onAuthorClick?.(post.author.id)}
                  >
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
                    <AvatarFallback>{post.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-sm font-semibold text-[var(--hive-text-primary)] cursor-pointer hover:underline"
                        onClick={() => onAuthorClick?.(post.author.id)}
                      >
                        {post.author.name}
                      </span>
                      {post.author.role && (
                        <span className="rounded-full border border-[var(--hive-border-default)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--hive-text-tertiary)]">
                          {post.author.role}
                        </span>
                      )}
                      <span className="text-xs text-[var(--hive-text-tertiary)]">
                        {timeAgo}
                        {post.isEdited && ' • Edited'}
                      </span>
                    </div>
                    <FeedSpaceChip
                      spaceId={post.space.id}
                      spaceName={post.space.name}
                      spaceColor={post.space.color}
                      spaceIcon={post.space.icon}
                      onClick={onSpaceClick ? () => onSpaceClick(post.space.id) : undefined}
                      className="mt-1"
                    />
                  </div>

                  <button className="p-1.5 rounded-lg text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="mt-4 space-y-3">
                  {post.content.headline && (
                    <h3 className="text-lg font-semibold text-[var(--hive-text-primary)]">
                      {post.content.headline}
                    </h3>
                  )}
                  {post.content.body && (
                    <p className="text-sm leading-relaxed text-[var(--hive-text-secondary)] whitespace-pre-wrap">
                      {post.content.body}
                    </p>
                  )}
                  {post.content.media && post.content.media.length > 0 && (
                    <FeedMediaPreview media={post.content.media} className="mt-3" />
                  )}
                  {post.content.tags && post.content.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {post.content.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[var(--hive-border-default)] px-3 py-1 text-xs text-[var(--hive-text-tertiary)]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-1 -ml-2">
                  <button
                    onClick={() => onUpvote?.(post.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors',
                      post.stats.isUpvoted
                        ? 'text-[var(--hive-status-error)]'
                        : 'text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)]'
                    )}
                  >
                    <Heart className={cn('h-4 w-4', post.stats.isUpvoted && 'fill-current')} />
                    <span>{post.stats.upvotes}</span>
                  </button>

                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.stats.comments}</span>
                  </button>

                  <button
                    onClick={() => onBookmark?.(post.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors',
                      post.stats.isBookmarked
                        ? 'text-[var(--hive-brand-primary)]'
                        : 'text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)]'
                    )}
                  >
                    <Bookmark className={cn('h-4 w-4', post.stats.isBookmarked && 'fill-current')} />
                  </button>

                  <button
                    onClick={() => onShare?.(post.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Comments section */}
              <div className="p-4">
                <h4 className="text-sm font-medium text-[var(--hive-text-primary)] mb-3">
                  Comments ({comments.length})
                </h4>

                {isLoadingComments ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="h-8 w-8 rounded-full bg-[var(--hive-background-tertiary)]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 bg-[var(--hive-background-tertiary)] rounded" />
                          <div className="h-3 w-full bg-[var(--hive-background-tertiary)] rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-[var(--hive-text-tertiary)] text-center py-6">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--hive-border-default)]">
                    {comments.map((comment) => (
                      <Comment
                        key={comment.id}
                        comment={comment}
                        onLike={onCommentLike}
                        onAuthorClick={onAuthorClick}
                      />
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Comment input - fixed at bottom */}
            {onComment && (
              <div className="border-t border-[var(--hive-border-default)] p-4 bg-[var(--hive-background-secondary)]">
                <div className="flex gap-3">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-[var(--hive-background-tertiary)] border-[var(--hive-border-default)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || isSubmitting}
                    className="bg-white text-black hover:bg-neutral-100"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

PostDetailModal.displayName = 'PostDetailModal';

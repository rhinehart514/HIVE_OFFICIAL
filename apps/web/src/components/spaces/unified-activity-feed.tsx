'use client';

/**
 * UnifiedActivityFeed - Combined feed for space residence
 *
 * Merges posts, events, tools, and chat messages into a single
 * chronological stream. Replaces separate mode switching with
 * unified view where everything lives together contextually.
 *
 * Item Types:
 * - Message: Chat messages from the active board
 * - Post: Threaded discussions/announcements
 * - Event: Upcoming events with inline RSVP
 * - Tool: Deployed tool cards with "Run" action
 *
 * @version 1.0.0 - Homebase Redesign (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarIcon,
  WrenchScrewdriverIcon,
  MegaphoneIcon,
  UserGroupIcon,
  CheckIcon,
  XMarkIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  Text,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  Button,
} from '@hive/ui/design-system/primitives';
import { MOTION } from '@hive/tokens';
import { formatDistanceToNow } from 'date-fns';

// ============================================================
// Types
// ============================================================

export type FeedItemType = 'message' | 'post' | 'event' | 'tool';

export interface BaseFeedItem {
  id: string;
  type: FeedItemType;
  timestamp: string; // ISO 8601
}

export interface MessageItem extends BaseFeedItem {
  type: 'message';
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  reactions?: Array<{ emoji: string; count: number; userReacted: boolean }>;
  threadCount?: number;
}

export interface PostItem extends BaseFeedItem {
  type: 'post';
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  title?: string;
  content: string;
  isPinned?: boolean;
  replyCount?: number;
}

export interface EventItem extends BaseFeedItem {
  type: 'event';
  eventId: string;
  title: string;
  description?: string;
  startDate: string;
  location?: string;
  isOnline?: boolean;
  rsvpCount: number;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  hostName?: string;
  hostAvatarUrl?: string;
}

export interface ToolItem extends BaseFeedItem {
  type: 'tool';
  toolId: string;
  placementId: string;
  name: string;
  description?: string;
  responseCount?: number;
  deployedBy: string;
}

export type FeedItem = MessageItem | PostItem | EventItem | ToolItem;

export interface UnifiedActivityFeedProps {
  /** Combined feed items (pre-sorted by timestamp) */
  items: FeedItem[];
  /** Loading state */
  loading?: boolean;
  /** Load more handler */
  onLoadMore?: () => void;
  /** Has more items */
  hasMore?: boolean;
  /** Current user ID (for permissions) */
  currentUserId?: string;
  /** Event RSVP handler */
  onEventRsvp?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void;
  /** Tool run handler */
  onRunTool?: (toolId: string, placementId: string) => void;
  /** Message reaction handler */
  onReact?: (messageId: string, emoji: string) => void;
  /** Thread open handler */
  onOpenThread?: (messageId: string) => void;
  /** Post reply handler */
  onReplyToPost?: (postId: string) => void;
  /** Check if user can delete a message */
  canDeleteMessage?: (authorId: string) => boolean;
  /** Delete message handler */
  onDeleteMessage?: (messageId: string) => Promise<void>;
  /** "Since you left" feature - timestamp of last read message */
  lastReadAt?: number | null;
  /** "Since you left" feature - count of unread messages */
  unreadCount?: number;
  /** Exclude events from feed (when shown in sidebar instead) */
  excludeEvents?: boolean;
}

// ============================================================
// Message Component
// ============================================================

function MessageFeedItem({
  item,
  onReact,
  onOpenThread,
  canDelete,
  onDelete,
}: {
  item: MessageItem;
  onReact?: (messageId: string, emoji: string) => void;
  onOpenThread?: (messageId: string) => void;
  canDelete?: boolean;
  onDelete?: (messageId: string) => Promise<void>;
}) {
  const [showActions, setShowActions] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  }, [item.timestamp]);

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setIsDeleting(false);
      setShowActions(false);
    }
  };

  return (
    <div className="flex gap-3 px-4 py-3 hover:bg-white/[0.01] group relative">
      {/* Avatar */}
      <Avatar size="sm" className="flex-shrink-0 mt-0.5">
        {item.authorAvatarUrl && <AvatarImage src={item.authorAvatarUrl} />}
        <AvatarFallback>{getInitials(item.authorName)}</AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-1">
          <Text size="sm" weight="medium" className="text-white">
            {item.authorName}
          </Text>
          <Text size="xs" className="text-white/30">
            {timeAgo}
          </Text>
        </div>

        {/* Message Content */}
        <Text size="sm" className="text-white/70 mb-2 break-words">
          {item.content}
        </Text>

        {/* Reactions */}
        {item.reactions && item.reactions.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-2">
            {item.reactions.map((reaction, idx) => (
              <button
                key={idx}
                onClick={() => onReact?.(item.id, reaction.emoji)}
                className={cn(
                  'px-2 py-1 rounded text-xs',
                  'flex items-center gap-1',
                  'transition-colors duration-150',
                  reaction.userReacted
                    ? 'bg-white/[0.12] text-white'
                    : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08]'
                )}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread Link */}
        {item.threadCount && item.threadCount > 0 && onOpenThread && (
          <button
            onClick={() => onOpenThread(item.id)}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            {item.threadCount} {item.threadCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Actions (on hover) */}
      {canDelete && onDelete && (
        <div className="absolute right-4 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className={cn(
                'p-1.5 rounded hover:bg-white/[0.08] transition-colors',
                'text-white/40 hover:text-white/60'
              )}
            >
              <EllipsisHorizontalIcon className="w-4 h-4" />
            </button>

            {/* Dropdown menu */}
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <div className={cn(
                  'absolute right-0 top-full mt-1 z-20',
                  'bg-[var(--bg-elevated)] border border-white/[0.08] rounded-xl shadow-lg',
                  'py-1 min-w-[120px]'
                )}>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={cn(
                      'w-full px-3 py-1.5 text-left text-sm',
                      'text-red-400 hover:bg-red-500/10',
                      'flex items-center gap-2',
                      'disabled:opacity-50'
                    )}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Event Component
// ============================================================

function EventFeedItem({
  item,
  onRsvp,
}: {
  item: EventItem;
  onRsvp?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void;
}) {
  const eventDate = React.useMemo(() => {
    try {
      const date = new Date(item.startDate);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'TBD';
    }
  }, [item.startDate]);

  return (
    <div className="mx-4 my-3 p-4 rounded-xl bg-gradient-to-br from-[var(--color-gold)]/[0.04] to-transparent border border-[var(--color-gold)]/[0.12]">
      {/* Icon + Title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-gold)]/[0.12] flex items-center justify-center flex-shrink-0">
          <CalendarIcon className="w-5 h-5 text-[var(--color-gold)]/80" />
        </div>
        <div className="flex-1 min-w-0">
          <Text weight="medium" className="text-white mb-1">
            {item.title}
          </Text>
          {item.description && (
            <Text size="sm" className="text-white/50 line-clamp-2">
              {item.description}
            </Text>
          )}
        </div>
      </div>

      {/* Event Details */}
      <div className="flex items-center gap-4 mb-3 text-xs text-white/50">
        <span>{eventDate}</span>
        {item.location && <span>• {item.location}</span>}
        <span>• {item.rsvpCount} going</span>
      </div>

      {/* RSVP Actions */}
      {onRsvp && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={item.userRsvp === 'going' ? 'default' : 'ghost'}
            onClick={() => onRsvp(item.eventId, 'going')}
            className="flex-1"
          >
            <CheckIcon className="w-3.5 h-3.5 mr-1" />
            Going
          </Button>
          <Button
            size="sm"
            variant={item.userRsvp === 'maybe' ? 'default' : 'ghost'}
            onClick={() => onRsvp(item.eventId, 'maybe')}
            className="flex-1"
          >
            Maybe
          </Button>
          <Button
            size="sm"
            variant={item.userRsvp === 'not_going' ? 'default' : 'ghost'}
            onClick={() => onRsvp(item.eventId, 'not_going')}
            className="flex-1"
          >
            <XMarkIcon className="w-3.5 h-3.5 mr-1" />
            Can't go
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tool Component
// ============================================================

function ToolFeedItem({
  item,
  onRun,
}: {
  item: ToolItem;
  onRun?: (toolId: string, placementId: string) => void;
}) {
  return (
    <div className="mx-4 my-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-purple-500/[0.12] flex items-center justify-center flex-shrink-0">
          <WrenchScrewdriverIcon className="w-5 h-5 text-purple-400/80" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Text weight="medium" className="text-white mb-1">
            {item.name}
          </Text>
          {item.description && (
            <Text size="sm" className="text-white/50 mb-2 line-clamp-2">
              {item.description}
            </Text>
          )}
          <Text size="xs" className="text-white/30 mb-3">
            Deployed by {item.deployedBy}
            {item.responseCount && ` • ${item.responseCount} responses`}
          </Text>

          {/* Run Button */}
          {onRun && (
            <Button
              size="sm"
              onClick={() => onRun(item.toolId, item.placementId)}
            >
              Run Tool
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Post Component
// ============================================================

function PostFeedItem({
  item,
  onReply,
}: {
  item: PostItem;
  onReply?: (postId: string) => void;
}) {
  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  }, [item.timestamp]);

  return (
    <div className="px-4 py-4 border-b border-white/[0.04]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar size="sm" className="flex-shrink-0">
          {item.authorAvatarUrl && <AvatarImage src={item.authorAvatarUrl} />}
          <AvatarFallback>{getInitials(item.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Text size="sm" weight="medium" className="text-white">
              {item.authorName}
            </Text>
            <Text size="xs" className="text-white/30">
              {timeAgo}
            </Text>
            {item.isPinned && (
              <span className="px-1.5 py-0.5 text-label-xs font-medium bg-[var(--color-gold)]/[0.12] text-[var(--color-gold)]/80 rounded">
                PINNED
              </span>
            )}
          </div>
          {item.title && (
            <Text weight="medium" className="text-white mb-2">
              {item.title}
            </Text>
          )}
          <Text size="sm" className="text-white/70">
            {item.content}
          </Text>
        </div>
      </div>

      {/* Reply Count */}
      {item.replyCount && item.replyCount > 0 && onReply && (
        <button
          onClick={() => onReply(item.id)}
          className="ml-11 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}
        </button>
      )}
    </div>
  );
}

// ============================================================
// "Since You Left" Divider
// ============================================================

function SinceYouLeftDivider({ unreadCount }: { unreadCount: number }) {
  return (
    <motion.div
      className="relative px-4 py-3"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: MOTION.ease.premium }}
      data-since-you-left
    >
      <div className="flex items-center gap-3">
        {/* Left line */}
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/30 to-[var(--color-gold)]/50" />

        {/* Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-gold)]/[0.08] border border-[var(--color-gold)]/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] animate-pulse" />
          <Text size="xs" weight="medium" className="text-[var(--color-gold)]">
            {unreadCount === 1 ? '1 new message' : `${unreadCount} new messages`} since you left
          </Text>
        </div>

        {/* Right line */}
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[var(--color-gold)]/30 to-[var(--color-gold)]/50" />
      </div>
    </motion.div>
  );
}

// ============================================================
// Loading Skeleton
// ============================================================

function FeedSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-full rounded bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState() {
  return (
    <motion.div
      className="py-24 px-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: MOTION.ease.premium }}
    >
      <motion.div
        className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <MegaphoneIcon className="w-7 h-7 text-white/20" />
      </motion.div>
      <h3
        className="text-title-lg font-semibold text-white mb-3"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        No activity yet
      </h3>
      <p className="text-body text-white/40 max-w-sm mx-auto">
        Start a conversation, create an event, or deploy a tool to get things moving.
      </p>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function UnifiedActivityFeed({
  items,
  loading = false,
  onLoadMore,
  hasMore = false,
  currentUserId,
  onEventRsvp,
  onRunTool,
  onReact,
  onOpenThread,
  onReplyToPost,
  canDeleteMessage,
  onDeleteMessage,
  lastReadAt,
  unreadCount = 0,
  excludeEvents = false,
}: UnifiedActivityFeedProps) {
  // Filter out events if excludeEvents is true (events shown in sidebar)
  const filteredItems = React.useMemo(() => {
    if (!excludeEvents) return items;
    return items.filter(item => item.type !== 'event');
  }, [items, excludeEvents]);
  const observerRef = React.useRef<HTMLDivElement>(null);
  const firstUnreadRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to first unread message on initial load
  React.useEffect(() => {
    if (lastReadAt && unreadCount > 0 && firstUnreadRef.current) {
      // Small delay to ensure layout is complete
      const timeout = setTimeout(() => {
        firstUnreadRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [lastReadAt, unreadCount]);

  // Infinite scroll observer
  React.useEffect(() => {
    if (!hasMore || !onLoadMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasMore, onLoadMore, loading]);

  if (loading && filteredItems.length === 0) {
    return <FeedSkeleton />;
  }

  if (filteredItems.length === 0) {
    return <EmptyState />;
  }

  // Find the index where unread messages begin
  const firstUnreadIndex = React.useMemo(() => {
    if (!lastReadAt || unreadCount === 0) return -1;

    // Items are sorted by timestamp descending (newest first)
    // Find the first message that is newer than lastReadAt
    for (let i = filteredItems.length - 1; i >= 0; i--) {
      const item = filteredItems[i];
      const itemTimestamp = new Date(item.timestamp).getTime();
      if (itemTimestamp > lastReadAt) {
        return i;
      }
    }
    return -1;
  }, [filteredItems, lastReadAt, unreadCount]);

  return (
    <div className="flex flex-col">
      {/* Feed Items */}
      <AnimatePresence mode="popLayout">
        {filteredItems.map((item, index) => {
          // Determine if we should show the "Since you left" divider before this item
          const showDivider = firstUnreadIndex !== -1 && index === firstUnreadIndex;

          return (
            <React.Fragment key={item.id}>
              {/* "Since you left" divider */}
              {showDivider && (
                <div ref={firstUnreadRef}>
                  <SinceYouLeftDivider unreadCount={unreadCount} />
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{
                  duration: 0.2,
                  delay: Math.min(index * 0.02, 0.15),
                  ease: MOTION.ease.premium,
                }}
              >
                {item.type === 'message' && (
                  <MessageFeedItem
                    item={item}
                    onReact={onReact}
                    onOpenThread={onOpenThread}
                    canDelete={canDeleteMessage?.(item.authorId) ?? false}
                    onDelete={onDeleteMessage}
                  />
                )}
                {item.type === 'post' && (
                  <PostFeedItem item={item} onReply={onReplyToPost} />
                )}
                {item.type === 'event' && (
                  <EventFeedItem item={item} onRsvp={onEventRsvp} />
                )}
                {item.type === 'tool' && (
                  <ToolFeedItem item={item} onRun={onRunTool} />
                )}
              </motion.div>
            </React.Fragment>
          );
        })}
      </AnimatePresence>

      {/* Load More Trigger (for infinite scroll) */}
      {hasMore && <div ref={observerRef} className="h-4" />}

      {/* Loading More Indicator */}
      {loading && items.length > 0 && (
        <div className="py-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white/20 animate-pulse" />
            <Text size="xs" className="text-white/30">
              Loading older messages...
            </Text>
          </div>
        </div>
      )}

      {/* Load More Button (fallback for non-scroll interaction) */}
      {hasMore && !loading && onLoadMore && (
        <div className="py-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            className="text-white/40 hover:text-white/60"
          >
            Load older messages
          </Button>
        </div>
      )}
    </div>
  );
}

export default UnifiedActivityFeed;

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MegaphoneIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Text, Button } from '@hive/ui/design-system/primitives';
import { MOTION } from '@hive/tokens';

import type { FeedItem } from './unified-feed-types';
import { MessageFeedItem, EventFeedItem, ToolFeedItem, PostFeedItem } from './feed-item-renderers';

// Re-export types for consumers
export type { FeedItemType, BaseFeedItem, MessageItem, PostItem, EventItem, ToolItem, FeedItem } from './unified-feed-types';

export interface UnifiedActivityFeedProps {
  items: FeedItem[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  currentUserId?: string;
  onEventRsvp?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void;
  onRunTool?: (toolId: string, placementId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onOpenThread?: (messageId: string) => void;
  onReplyToPost?: (postId: string) => void;
  canDeleteMessage?: (authorId: string) => boolean;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  lastReadAt?: number | null;
  unreadCount?: number;
  excludeEvents?: boolean;
}

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
        <div className="flex-1 h-px bg-[var(--color-gold)]/30" />
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--color-gold)]/[0.10] border border-[var(--color-gold)]/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]" />
          <Text size="xs" weight="medium" className="text-[var(--color-gold)]">
            {unreadCount === 1 ? '1 new message' : `${unreadCount} new messages`} since you left
          </Text>
        </div>
        <div className="flex-1 h-px bg-[var(--color-gold)]/30" />
      </div>
    </motion.div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-white/[0.05]" />
            <div className="h-4 w-full rounded bg-white/[0.05]" />
            <div className="h-4 w-3/4 rounded bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      className="py-24 px-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: MOTION.ease.premium }}
    >
      <motion.div
        className="w-16 h-16 mx-auto mb-6 rounded-lg bg-white/[0.10] border border-white/[0.05] flex items-center justify-center"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <MegaphoneIcon className="w-7 h-7 text-white/70" />
      </motion.div>
      <h3
        className="text-title-lg font-semibold text-white mb-3"
        style={{ fontFamily: 'var(--font-clash)' }}
      >
        Nothing here yet
      </h3>
      <p className="text-body text-white/50 max-w-sm mx-auto mb-4">
        Drop a poll, run a bracket, post an update — give your members something to show up for.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/build"
          className="inline-flex items-center px-4 py-2 rounded-full bg-[#FFD700] text-black text-sm font-semibold hover:bg-[#FFD700]/90 transition-colors duration-100"
        >
          Build an app
        </Link>
      </div>
    </motion.div>
  );
}

export function UnifiedActivityFeed({
  items,
  loading = false,
  onLoadMore,
  hasMore = false,
  currentUserId: _currentUserId,
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
  const filteredItems = React.useMemo(() => {
    if (!excludeEvents) return items;
    return items.filter(item => item.type !== 'event');
  }, [items, excludeEvents]);
  const observerRef = React.useRef<HTMLDivElement>(null);
  const firstUnreadRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (lastReadAt && unreadCount > 0 && firstUnreadRef.current) {
      const timeout = setTimeout(() => {
        firstUnreadRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [lastReadAt, unreadCount]);

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

  const firstUnreadIndex = React.useMemo(() => {
    if (!lastReadAt || unreadCount === 0) return -1;
    for (let i = filteredItems.length - 1; i >= 0; i--) {
      const item = filteredItems[i];
      const itemTimestamp = new Date(item.timestamp).getTime();
      if (itemTimestamp > lastReadAt) {
        return i;
      }
    }
    return -1;
  }, [filteredItems, lastReadAt, unreadCount]);

  if (loading && filteredItems.length === 0) {
    return <FeedSkeleton />;
  }

  if (filteredItems.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col">
      <AnimatePresence mode="popLayout">
        {filteredItems.map((item, index) => {
          const showDivider = firstUnreadIndex !== -1 && index === firstUnreadIndex;

          return (
            <React.Fragment key={item.id}>
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

      {hasMore && <div ref={observerRef} className="h-4" />}

      {loading && items.length > 0 && (
        <div className="py-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white/[0.05]" />
            <Text size="xs" className="text-white/50">
              Loading older messages...
            </Text>
          </div>
        </div>
      )}

      {hasMore && !loading && onLoadMore && (
        <div className="py-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            className="text-white/50 hover:text-white/70"
          >
            Load older messages
          </Button>
        </div>
      )}
    </div>
  );
}

export default UnifiedActivityFeed;

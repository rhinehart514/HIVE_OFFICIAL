'use client';

/**
 * HomebaseActivityFeed - Cross-space activity stream
 *
 * Shows recent activity from all spaces the user is a member of.
 * Provides quick context and navigation to active conversations.
 *
 * Features:
 * - Chronological feed across all spaces
 * - Post previews with space context
 * - Event RSVPs and announcements
 * - Click to jump to space
 * - Empty state for new users
 *
 * @version 1.0.0 - Homebase Redesign (Jan 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ChatBubbleLeftIcon,
  CalendarIcon,
  MegaphoneIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Text, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui/design-system/primitives';
import { MOTION } from '@hive/tokens';
import { formatDistanceToNow } from 'date-fns';

// ============================================================
// Types
// ============================================================

export type ActivityType = 'message' | 'event' | 'announcement' | 'tool_deployed';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  spaceId: string;
  spaceName: string;
  spaceAvatarUrl?: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string; // For messages/announcements
  eventTitle?: string; // For events
  toolName?: string; // For tool deployments
  timestamp: string; // ISO 8601
  previewText?: string; // Truncated content for display
}

export interface HomebaseActivityFeedProps {
  /** Activity items from all spaces */
  activities: ActivityItem[];
  /** Loading state */
  loading?: boolean;
  /** Navigate to space handler */
  onNavigateToSpace: (spaceId: string) => void;
  /** Empty state message */
  emptyMessage?: string;
}

// ============================================================
// Activity Icon
// ============================================================

function ActivityIcon({ type }: { type: ActivityType }) {
  const iconClass = 'w-4 h-4';

  switch (type) {
    case 'message':
      return <ChatBubbleLeftIcon className={cn(iconClass, 'text-white/50')} />;
    case 'event':
      return <CalendarIcon className={cn(iconClass, 'text-[var(--color-gold)]/60')} />;
    case 'announcement':
      return <MegaphoneIcon className={cn(iconClass, 'text-blue-400/60')} />;
    case 'tool_deployed':
      return <SparklesIcon className={cn(iconClass, 'text-purple-400/60')} />;
    default:
      return <ChatBubbleLeftIcon className={cn(iconClass, 'text-white/50')} />;
  }
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
      />
    </svg>
  );
}

// ============================================================
// Activity Row
// ============================================================

function ActivityRow({
  activity,
  onClick,
  index,
}: {
  activity: ActivityItem;
  onClick: () => void;
  index: number;
}) {
  const timeAgo = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  }, [activity.timestamp]);

  const displayContent = React.useMemo(() => {
    switch (activity.type) {
      case 'event':
        return activity.eventTitle || 'New event';
      case 'announcement':
        return activity.previewText || activity.content;
      case 'tool_deployed':
        return `${activity.toolName || 'Tool'} deployed`;
      case 'message':
      default:
        return activity.previewText || activity.content;
    }
  }, [activity]);

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full px-4 py-3 flex items-start gap-3 text-left',
        'hover:bg-white/[0.06] transition-colors duration-150',
        'border-b border-white/[0.06] last:border-b-0'
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.2 }}
    >
      {/* Author Avatar */}
      <Avatar size="sm" className="flex-shrink-0 mt-0.5">
        {activity.authorAvatarUrl && <AvatarImage src={activity.authorAvatarUrl} />}
        <AvatarFallback>{getInitials(activity.authorName)}</AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: Author + Space + Time */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Text size="sm" weight="medium" className="text-white">
            {activity.authorName}
          </Text>
          <Text size="xs" className="text-white/50">
            in
          </Text>
          <div className="flex items-center gap-1.5">
            {activity.spaceAvatarUrl && (
              <img
                src={activity.spaceAvatarUrl}
                alt=""
                className="w-4 h-4 rounded"
              />
            )}
            <Text size="xs" weight="medium" className="text-white/50">
              {activity.spaceName}
            </Text>
          </div>
          <Text size="xs" className="text-white/50">
            •
          </Text>
          <Text size="xs" className="text-white/50">
            {timeAgo}
          </Text>
        </div>

        {/* Activity Content */}
        <div className="flex items-start gap-2">
          <ActivityIcon type={activity.type} />
          <Text size="sm" className="text-white/50 line-clamp-2 flex-1">
            {displayContent}
          </Text>
        </div>
      </div>

      {/* Arrow indicator */}
      <ArrowRightIcon className="w-4 h-4 text-white/50 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}

// ============================================================
// Loading Skeleton
// ============================================================

function ActivitySkeleton() {
  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-20 rounded bg-white/[0.06]" />
          <div className="h-3 w-12 rounded bg-white/[0.06]" />
          <div className="h-3 w-16 rounded bg-white/[0.06]" />
        </div>
        <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState({ message }: { message?: string }) {
  return (
    <motion.div
      className="py-12 px-6 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: MOTION.ease.premium }}
    >
      <motion.div
        className="w-14 h-14 mx-auto mb-4 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: MOTION.ease.premium }}
      >
        <ChatBubbleLeftIcon className="w-6 h-6 text-white/50" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3
          className="text-title font-semibold text-white mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          No activity yet
        </h3>
        <p className="text-body text-white/50 max-w-xs mx-auto">
          {message ||
            'Join spaces and start conversations. Your activity feed will show up here.'}
        </p>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function HomebaseActivityFeed({
  activities,
  loading = false,
  onNavigateToSpace,
  emptyMessage,
}: HomebaseActivityFeedProps) {
  // Sort activities by timestamp (most recent first)
  const sortedActivities = React.useMemo(() => {
    return [...activities].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [activities]);

  if (loading) {
    return (
      <section className="mb-8">
        <Text
          weight="medium"
          className="text-label-sm uppercase tracking-wider text-white/50 mb-4"
        >
          Activity
        </Text>
        <div className="rounded-lg border border-white/[0.06] overflow-hidden divide-y divide-white/[0.06]">
          {Array.from({ length: 5 }).map((_, i) => (
            <ActivitySkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (sortedActivities.length === 0) {
    return (
      <section className="mb-8">
        <Text
          weight="medium"
          className="text-label-sm uppercase tracking-wider text-white/50 mb-4"
        >
          Activity
        </Text>
        <div className="rounded-lg border border-white/[0.06] overflow-hidden">
          <EmptyState message={emptyMessage} />
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <Text
        weight="medium"
        className="text-label-sm uppercase tracking-wider text-white/50 mb-4"
      >
        Activity
      </Text>

      {/* Feed */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-lg border border-white/[0.06] overflow-hidden"
      >
        {sortedActivities.slice(0, 10).map((activity, index) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            onClick={() => onNavigateToSpace(activity.spaceId)}
            index={index}
          />
        ))}

        {/* Show more hint if there are more than 10 items */}
        {sortedActivities.length > 10 && (
          <div className="px-4 py-3 text-center border-t border-white/[0.06]">
            <Text size="xs" className="text-white/50">
              Showing latest 10 of {sortedActivities.length} activities
            </Text>
          </div>
        )}
      </motion.div>
    </section>
  );
}

export default HomebaseActivityFeed;

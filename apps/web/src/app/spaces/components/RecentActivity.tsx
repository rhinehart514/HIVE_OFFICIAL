'use client';

/**
 * RecentActivity — Footer with recent messages/events
 *
 * Horizontal row of recent items:
 * - Space avatar
 * - Time
 * - Preview text
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Calendar, FileText } from 'lucide-react';
import {
  motion,
  MOTION,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import type { RecentActivity as RecentActivityType } from '../hooks/useSpacesHQ';

// ============================================================
// Types
// ============================================================

interface RecentActivityProps {
  activities: RecentActivityType[];
  maxVisible?: number;
}

// ============================================================
// Activity Icons
// ============================================================

const ACTIVITY_ICONS = {
  message: MessageSquare,
  event: Calendar,
  post: FileText,
};

// ============================================================
// Format Time
// ============================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

// ============================================================
// Activity Item
// ============================================================

function ActivityItem({
  activity,
  index,
}: {
  activity: RecentActivityType;
  index: number;
}) {
  const router = useRouter();
  const Icon = ACTIVITY_ICONS[activity.type];

  return (
    <motion.button
      onClick={() => router.push(`/s/${activity.spaceId}`)}
      className={cn(
        'flex-1 min-w-0 flex items-center gap-3 px-4 py-3 rounded-xl',
        'transition-all duration-200',
        'hover:bg-white/[0.03]'
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.fast,
        delay: 0.2 + index * MOTION.stagger.tight,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Avatar */}
      <Avatar size="sm" className="ring-1 ring-white/[0.06] shrink-0">
        {activity.spaceAvatarUrl && <AvatarImage src={activity.spaceAvatarUrl} />}
        <AvatarFallback className="text-[10px]">
          {getInitials(activity.spaceName)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon size={12} className="text-white/30 shrink-0" />
          <span className="text-[11px] text-white/30">
            {formatTimeAgo(activity.timestamp)}
          </span>
        </div>
        <p className="text-[13px] text-white/50 truncate">
          {activity.preview}
        </p>
      </div>
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function RecentActivity({
  activities,
  maxVisible = 4,
}: RecentActivityProps) {
  const visibleActivities = activities.slice(0, maxVisible);

  if (visibleActivities.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="shrink-0 rounded-2xl backdrop-blur-xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.02)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.base,
        delay: 0.2,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/[0.03]">
        <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
          Recent Activity
        </span>
      </div>

      {/* Activity row */}
      <div className="flex divide-x divide-white/[0.03]">
        {visibleActivities.map((activity, i) => (
          <ActivityItem key={activity.id} activity={activity} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

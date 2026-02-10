'use client';

/**
 * HIVE Production Notification Bell
 *
 * Groups notifications by space, with collapsible sections.
 * Non-space notifications appear under "General".
 * Total unread count shown on bell icon.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, CheckCheck } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent, Button } from '@hive/ui';
import { MOTION, durationSeconds } from '@hive/tokens';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import type { Notification } from '@/hooks/use-realtime-notifications';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

export interface HiveNotificationBellProps {
  className?: string;
  disabled?: boolean;
}

interface NotificationGroup {
  key: string;
  label: string;
  spaceId: string | null;
  notifications: Notification[];
  unreadCount: number;
}

function groupNotificationsBySpace(notifications: Notification[]): NotificationGroup[] {
  const spaceMap = new Map<string, {
    label: string;
    spaceId: string | null;
    notifications: Notification[];
  }>();

  for (const notification of notifications) {
    const spaceId = (notification.metadata?.spaceId as string) || null;
    const spaceName = (notification.metadata?.spaceName as string) || null;
    const key = spaceId || '__general__';

    if (!spaceMap.has(key)) {
      spaceMap.set(key, {
        label: spaceName || (spaceId ? 'Space' : 'General'),
        spaceId,
        notifications: [],
      });
    }

    spaceMap.get(key)!.notifications.push(notification);
  }

  const groups: NotificationGroup[] = [];
  const generalGroup = spaceMap.get('__general__');

  // Space groups first (sorted by most recent notification)
  const spaceGroups = Array.from(spaceMap.entries())
    .filter(([key]) => key !== '__general__')
    .map(([key, data]) => ({
      key,
      label: data.label,
      spaceId: data.spaceId,
      notifications: data.notifications,
      unreadCount: data.notifications.filter(n => !n.isRead && !n.read).length,
    }))
    .sort((a, b) => {
      const aTime = a.notifications[0]?.timestamp?.toDate?.()?.getTime() || 0;
      const bTime = b.notifications[0]?.timestamp?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });

  groups.push(...spaceGroups);

  // General group last
  if (generalGroup) {
    groups.push({
      key: '__general__',
      label: 'General',
      spaceId: null,
      notifications: generalGroup.notifications,
      unreadCount: generalGroup.notifications.filter(n => !n.isRead && !n.read).length,
    });
  }

  return groups;
}

function formatTimestamp(notification: Notification): string {
  const date = notification.timestamp?.toDate?.();
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationItem({
  notification,
  onNavigate,
  onMarkRead,
}: {
  notification: Notification;
  onNavigate: (url: string) => void;
  onMarkRead: (id: string) => void;
}) {
  const isUnread = !notification.isRead && !notification.read;
  const actionUrl = notification.actionUrl || (notification.metadata?.actionUrl as string);

  const handleClick = () => {
    if (isUnread) {
      onMarkRead(notification.id);
    }
    if (actionUrl) {
      onNavigate(actionUrl);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durationSeconds.quick, ease: MOTION.ease.default }}
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left',
        'transition-colors duration-150',
        isUnread
          ? 'bg-white/[0.06] hover:bg-white/[0.06]'
          : 'hover:bg-white/[0.06]'
      )}
    >
      {/* Unread indicator */}
      <div className="flex-shrink-0 pt-1.5">
        <span
          className={cn(
            'block w-1.5 h-1.5 rounded-full transition-colors',
            isUnread ? 'bg-[var(--color-gold)]' : 'bg-transparent'
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-xs leading-relaxed',
          isUnread ? 'text-white font-medium' : 'text-white/50'
        )}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-[11px] text-white/50 mt-0.5 line-clamp-1">
            {notification.body}
          </p>
        )}
      </div>

      {/* Time */}
      <span className="flex-shrink-0 text-[10px] text-white/50 pt-0.5">
        {formatTimestamp(notification)}
      </span>
    </motion.button>
  );
}

function CollapsibleGroup({
  group,
  onNavigate,
  onMarkRead,
  defaultExpanded,
}: {
  group: NotificationGroup;
  onNavigate: (url: string) => void;
  onMarkRead: (id: string) => void;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      {/* Group header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2',
          'hover:bg-white/[0.06] transition-colors duration-150'
        )}
      >
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: expanded ? 0 : -90 }}
            transition={{ duration: durationSeconds.snap }}
          >
            <ChevronDown className="w-3 h-3 text-white/50" />
          </motion.span>
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
            {group.label}
          </span>
        </div>

        {group.unreadCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-gold)]/10 text-[var(--color-gold)]">
            {group.unreadCount}
          </span>
        )}
      </button>

      {/* Notifications */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: durationSeconds.quick, ease: MOTION.ease.default }}
            className="overflow-hidden"
          >
            <div className="pb-1">
              {group.notifications.slice(0, 5).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onNavigate={onNavigate}
                  onMarkRead={onMarkRead}
                />
              ))}
              {group.notifications.length > 5 && (
                <p className="px-3 py-1.5 text-[10px] text-white/50 text-center">
                  +{group.notifications.length - 5} more
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const HiveNotificationBell: React.FC<HiveNotificationBellProps> = ({
  className,
  disabled = false,
}) => {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useRealtimeNotifications();

  const groups = useMemo(() => groupNotificationsBySpace(notifications), [notifications]);

  const handleNavigate = useCallback((url: string) => {
    try {
      logger.info('Notification navigation', {
        url,
        source: 'notification_bell',
        unreadCount,
        timestamp: new Date().toISOString(),
      });
      router.push(url);
    } catch (error) {
      logger.error('Navigation error from notification', {
        error: { error: error instanceof Error ? error.message : String(error) },
        url,
      });
    }
  }, [router, unreadCount]);

  const handleMarkRead = useCallback((id: string) => {
    markAsRead(id);
  }, [markAsRead]);

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'relative p-2 rounded-lg',
            'text-white/50 hover:text-white',
            'hover:bg-white/[0.06]',
            'transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/30',
            disabled && 'opacity-40 pointer-events-none',
            className
          )}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="w-5 h-5" />

          {/* Unread badge */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className={cn(
                  'absolute -top-0.5 -right-0.5',
                  'flex items-center justify-center',
                  'min-w-[16px] h-4 px-1',
                  'rounded-full text-[10px] font-bold',
                  'bg-[var(--color-gold)] text-black'
                )}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] p-0 max-h-[480px] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <h3
            className="text-sm font-semibold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Notifications
          </h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-[10px] text-white/50 hover:text-white/50 px-2 h-6"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-white/[0.06] border-t-white/50 rounded-full " />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="w-8 h-8 text-white/[0.06] mb-3" />
              <p className="text-xs text-white/50">No notifications yet</p>
              <p className="text-[11px] text-white/25 mt-1">
                You'll see updates from your spaces here
              </p>
            </div>
          ) : (
            <div>
              {groups.map((group, index) => (
                <CollapsibleGroup
                  key={group.key}
                  group={group}
                  onNavigate={handleNavigate}
                  onMarkRead={handleMarkRead}
                  defaultExpanded={index < 3}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-4 py-2">
          <button
            onClick={() => handleNavigate('/me/notifications')}
            className="w-full text-center text-[11px] text-white/50 hover:text-white/50 transition-colors py-1"
          >
            View all notifications
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HiveNotificationBell;

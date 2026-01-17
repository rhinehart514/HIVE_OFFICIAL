'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { Shell, PageHeader, Card, Button, Badge, toast } from '@hive/ui';
import { BellIcon, HeartIcon, ChatBubbleOvalLeftIcon, UsersIcon, Cog6ToothIcon, TrashIcon, CalendarIcon, ArrowPathIcon, MegaphoneIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/logger';

// Aliases for lucide compatibility
const Megaphone = MegaphoneIcon;
const CheckCheck = CheckBadgeIcon;
import Link from 'next/link';

interface Notification {
  id: string;
  userId: string;
  title: string;
  body?: string;
  type: string;
  category: string;
  isRead: boolean;
  readAt?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'likes', label: 'Likes' },
  { id: 'follows', label: 'Follows' },
  { id: 'events', label: 'Events' },
];

function getNotificationIcon(type: string) {
  switch (type) {
    case 'like':
      return <HeartIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />;
    case 'comment':
    case 'mention':
      return <ChatBubbleOvalLeftIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />;
    case 'follow':
      return <UsersIcon className="w-5 h-5 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />;
    case 'event':
      return <CalendarIcon className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" aria-hidden="true" />;
    case 'announcement':
      return <Megaphone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />;
    default:
      return <BellIcon className="w-5 h-5 text-text-tertiary shrink-0 mt-0.5" aria-hidden="true" />;
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const fetchNotifications = useCallback(async (category?: string) => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (category && category !== 'all') {
        params.set('category', category);
      }

      const response = await fetch(`/api/notifications?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      logger.error('Failed to fetch notifications', { component: 'NotificationsPage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(activeFilter);
  }, [fetchNotifications, activeFilter]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    setIsMarkingRead(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'mark_all_read' }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      } else {
        throw new Error('Failed to mark notifications as read');
      }
    } catch (error) {
      logger.error('Error marking all read', { component: 'NotificationsPage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to mark notifications as read');
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'delete', notificationIds: [notificationId] }),
      });

      if (response.ok) {
        const deletedNotification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success('Notification deleted');
      } else {
        throw new Error('Failed to delete notification');
      }
    } catch (error) {
      logger.error('Error deleting notification', { component: 'NotificationsPage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to delete notification');
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.isRead) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId, isRead: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      logger.error('Error marking notification as read', { component: 'NotificationsPage' }, error instanceof Error ? error : undefined);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center" role="status" aria-label="Loading notifications">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-brand-primary" aria-hidden="true" />
        <span className="sr-only">Loading notifications...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background-primary" aria-label="Notifications">
      <Shell size="md" noVerticalPadding>
        <PageHeader
          title="Notifications"
          className="sticky top-0 z-10 bg-background-primary border-b border-[var(--hive-border-subtle)]"
          eyebrow={
            unreadCount > 0 ? (
              <Badge variant="secondary" className="bg-brand-primary text-black" aria-label={`${unreadCount} new notifications`}>
                {unreadCount} new
              </Badge>
            ) : null
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isMarkingRead || unreadCount === 0}
                aria-label="Mark all notifications as read"
              >
                {isMarkingRead ? (
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCheck className="w-4 h-4 mr-2" aria-hidden="true" />
                )}
                Mark all read
              </Button>
              <Link href="/settings" aria-label="Go to notification settings">
                <Button variant="outline" size="sm" aria-label="Settings">
                  <Cog6ToothIcon className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          }
        />

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2" role="tablist" aria-label="Filter notifications by type">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeFilter === tab.id}
              aria-controls="notification-list"
              onClick={() => {
                setActiveFilter(tab.id);
                setIsLoading(true);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.id
                  ? 'bg-brand-primary text-black'
                  : 'bg-background-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div id="notification-list" role="tabpanel" className="space-y-3 pb-8" aria-label={`${activeFilter} notifications`}>
          {notifications.length === 0 ? (
            <Card className="p-8 text-center bg-background-secondary border-border-default" role="status">
              <BellIcon className="w-10 h-10 text-text-tertiary mx-auto mb-3" aria-hidden="true" />
              <h3 className="text-base font-semibold text-text-primary mb-1">
                {activeFilter === 'all' ? 'No notifications yet' : `No ${activeFilter} notifications`}
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                {activeFilter === 'all'
                  ? "Join spaces and participate to start receiving notifications"
                  : 'Try checking a different category'}
              </p>
              {activeFilter === 'all' && (
                <div className="flex items-center justify-center gap-3">
                  <Link href="/spaces/browse">
                    <Button variant="default" size="sm">
                      Browse Spaces
                    </Button>
                  </Link>
                  <Link href="/settings?tab=notifications">
                    <Button variant="outline" size="sm">
                      <Cog6ToothIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                      Settings
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 bg-background-secondary border-border-default cursor-pointer transition-colors hover:bg-background-tertiary ${
                  !notification.isRead ? 'border-l-4 border-l-brand-primary' : ''
                }`}
                onClick={() => handleMarkRead(notification.id)}
                role="article"
                aria-label={`${notification.isRead ? '' : 'Unread: '}${notification.title}`}
              >
                <div className="flex items-start gap-4">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-medium">{notification.title}</p>
                    {notification.body && (
                      <p className="text-text-secondary text-sm mt-1 truncate">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-text-tertiary text-xs mt-2">
                      <time dateTime={notification.timestamp}>{formatTimestamp(notification.timestamp)}</time>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    aria-label={`Delete notification: ${notification.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                  >
                    <TrashIcon className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            ))
          )}

          {/* All caught up message when there are notifications but all are read */}
          {notifications.length > 0 && unreadCount === 0 && (
            <Card className="p-6 text-center bg-background-secondary border-border-default" role="status" aria-live="polite">
              <CheckCheck className="w-8 h-8 text-green-500 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-text-secondary">All caught up!</p>
            </Card>
          )}
        </div>
      </Shell>
    </main>
  );
}

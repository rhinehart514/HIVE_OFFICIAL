'use client';

/**
 * /me/notifications — Notifications Hub
 *
 * DESIGN-2026 compliant: black canvas, gold accents, lucide icons, solid surfaces.
 *
 * @version 3.0.0 - Design-2026 Consistency Sweep (Feb 2026)
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@hive/ui';
import {
  Bell,
  Heart,
  MessageCircle,
  Users,
  Settings,
  Trash2,
  CalendarDays,
  Loader2,
  Megaphone,
  CheckCheck,
} from 'lucide-react';
import { NotificationsEmptyState } from '@/components/ui/NotificationsEmptyState';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
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
  actionUrl?: string;
}

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'likes', label: 'Likes' },
  { id: 'follows', label: 'Follows' },
  { id: 'events', label: 'Events' },
];

function getNotificationIcon(type: string) {
  const base = 'w-5 h-5 shrink-0 mt-0.5';
  switch (type) {
    case 'like':
      return <Heart className={`${base} text-[#FFD700]`} aria-hidden="true" />;
    case 'comment':
    case 'mention':
      return <MessageCircle className={`${base} text-white/50`} aria-hidden="true" />;
    case 'follow':
      return <Users className={`${base} text-white/50`} aria-hidden="true" />;
    case 'event':
      return <CalendarDays className={`${base} text-white/50`} aria-hidden="true" />;
    case 'announcement':
      return <Megaphone className={`${base} text-[#FFD700]`} aria-hidden="true" />;
    default:
      return <Bell className={`${base} text-white/50`} aria-hidden="true" />;
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
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const router = useRouter();
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

  const handleNotificationClick = async (notification: Notification) => {
    await handleMarkRead(notification.id);

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" role="status" aria-label="Loading notifications">
        <Loader2 className="w-6 h-6 text-[#FFD700] animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading notifications...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black" aria-label="Notifications">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1
              className="text-[32px] font-semibold text-white tracking-tight"
              style={{ fontFamily: 'var(--font-clash, var(--font-display))' }}
            >
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span
                className="px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider bg-[#FFD700]/15 text-[#FFD700] rounded-full"
                aria-label={`${unreadCount} new notifications`}
              >
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingRead || unreadCount === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#1A1A1A] border border-white/[0.08] rounded-full transition-colors duration-150 hover:bg-white/[0.06] disabled:opacity-30"
              aria-label="Mark all notifications as read"
            >
              {isMarkingRead ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCheck className="w-4 h-4" aria-hidden="true" />
              )}
              Mark all read
            </button>
            <Link href="/me/settings" aria-label="Go to notification settings">
              <button className="p-2 text-white/50 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors duration-150" aria-label="Settings">
                <Settings className="w-4 h-4" aria-hidden="true" />
              </button>
            </Link>
          </div>
        </div>

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
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                activeFilter === tab.id
                  ? 'bg-[#FFD700] text-black'
                  : 'bg-white/[0.03] text-white/50 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div id="notification-list" role="tabpanel" className="space-y-2 pb-8" aria-label={`${activeFilter} notifications`}>
          {notifications.length === 0 ? (
            <div className="bg-[#0A0A0A] rounded-[16px] border border-white/[0.08] p-8" role="status">
              <NotificationsEmptyState
                variant={activeFilter === 'all' ? 'new_user' : 'filtered'}
                filterName={activeFilter !== 'all' ? activeFilter : undefined}
              />
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 bg-[#0A0A0A] rounded-[16px] border border-white/[0.08] cursor-pointer transition-colors duration-150 hover:bg-white/[0.03] ${
                  !notification.isRead ? 'border-l-2 border-l-[#FFD700]' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
                role="article"
                aria-label={`${notification.isRead ? '' : 'Unread: '}${notification.title}`}
              >
                <div className="flex items-start gap-4">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-[15px]">{notification.title}</p>
                    {notification.body && (
                      <p className="text-white/50 text-sm mt-1 truncate">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-white/50 text-[11px] font-mono uppercase tracking-wider mt-2">
                      <time dateTime={notification.timestamp}>{formatTimestamp(notification.timestamp)}</time>
                    </p>
                  </div>
                  <button
                    className="shrink-0 p-2 text-white/50 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors duration-150"
                    aria-label={`Delete notification: ${notification.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* All caught up message */}
          {notifications.length > 0 && unreadCount === 0 && (
            <div className="bg-[#0A0A0A] rounded-[16px] border border-white/[0.08] p-8" role="status" aria-live="polite">
              <NotificationsEmptyState variant="caught_up" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

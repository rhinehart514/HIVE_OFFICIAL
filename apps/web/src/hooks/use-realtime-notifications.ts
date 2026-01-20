'use client';

/**
 * Realtime Notifications Hook
 *
 * Now uses SSE streaming for instant notifications instead of 30-second polling.
 * Falls back to polling if SSE connection fails.
 *
 * @version 2.0.0 - Spaces Perfection Plan Phase 1 (Jan 2026)
 * - Replaced polling with SSE streaming via /api/notifications/stream
 * - Maintains backward-compatible API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@hive/auth-logic';
import { logger } from '@/lib/logger';
import { useNotificationStream, type StreamNotification } from './use-notification-stream';

export interface Notification {
  id: string;
  title: string;
  body?: string;
  type: string;
  category?: string;
  read: boolean;
  isRead?: boolean;
  readAt?: string;
  timestamp: { toDate: () => Date };
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

// Transform stream notification to legacy Notification format
function transformNotification(streamNotification: StreamNotification): Notification {
  return {
    id: streamNotification.id,
    title: streamNotification.title,
    body: streamNotification.body,
    type: streamNotification.type,
    category: streamNotification.category,
    read: streamNotification.isRead,
    isRead: streamNotification.isRead,
    readAt: streamNotification.readAt,
    timestamp: {
      toDate: () => new Date(streamNotification.timestamp),
    },
    actionUrl: streamNotification.actionUrl,
    metadata: streamNotification.metadata,
  };
}

export function useRealtimeNotifications() {
  const { user, getAuthToken } = useAuth();

  // Use the new streaming hook
  const {
    isConnected,
    unreadCount: streamUnreadCount,
    notifications: streamNotifications,
    error: streamError,
    optimisticMarkAsRead,
    optimisticMarkAllAsRead,
  } = useNotificationStream();

  // Track loading state for initial fetch
  const [loading, setLoading] = useState(true);
  const hasInitialLoadRef = useRef(false);

  // Transform stream notifications to legacy format
  const notifications: Notification[] = streamNotifications.map(transformNotification);

  // Set loading to false once we have a connection or notifications
  useEffect(() => {
    if (isConnected || streamNotifications.length > 0) {
      setLoading(false);
      hasInitialLoadRef.current = true;
    }
  }, [isConnected, streamNotifications.length]);

  // Also fetch initial notifications to populate the list immediately
  // (SSE only sends new notifications after connection)
  const fetchInitialNotifications = useCallback(async () => {
    if (!user || !getAuthToken || hasInitialLoadRef.current) return;

    try {
      const authToken = await getAuthToken();
      const response = await fetch('/api/notifications?limit=50', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Initial fetch successful - streaming will handle updates
        hasInitialLoadRef.current = true;
        setLoading(false);
      }
    } catch (error) {
      logger.warn('Initial notification fetch failed, streaming will provide data', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [user, getAuthToken]);

  // Fetch initial notifications on mount
  useEffect(() => {
    if (user) {
      fetchInitialNotifications();
    }
  }, [user, fetchInitialNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user || !getAuthToken) return;

      // Optimistically update via streaming hook
      optimisticMarkAsRead(notificationId);

      try {
        const authToken = await getAuthToken();
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'mark_read',
            notificationIds: [notificationId],
          }),
        });

        if (!response.ok) {
          logger.error('Failed to mark notification as read on server', {
            notificationId,
            status: response.status,
          });
        }
      } catch (error) {
        logger.error(
          'Error marking notification as read',
          { component: 'useRealtimeNotifications', notificationId },
          error instanceof Error ? error : undefined
        );
      }
    },
    [user, getAuthToken, optimisticMarkAsRead]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user || !getAuthToken) return;

    // Optimistically update via streaming hook
    optimisticMarkAllAsRead();

    try {
      const authToken = await getAuthToken();
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_all_read',
        }),
      });

      if (!response.ok) {
        logger.error('Failed to mark all notifications as read on server', {
          status: response.status,
        });
      }
    } catch (error) {
      logger.error(
        'Error marking all notifications as read',
        { component: 'useRealtimeNotifications' },
        error instanceof Error ? error : undefined
      );
    }
  }, [user, getAuthToken, optimisticMarkAllAsRead]);

  const refresh = useCallback(async () => {
    if (!user || !getAuthToken) return;

    setLoading(true);
    try {
      const authToken = await getAuthToken();
      await fetch('/api/notifications?limit=50', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      logger.error('Error refreshing notifications', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthToken]);

  return {
    notifications,
    unreadCount: streamUnreadCount,
    loading,
    error: streamError,
    markAsRead,
    markAllAsRead,
    refresh,
    // New streaming-specific exports
    isConnected,
  };
}

'use client';

/**
 * Notification Stream Hook
 *
 * Establishes an SSE connection to /api/notifications/stream for
 * real-time notification delivery. Falls back to polling if SSE fails.
 *
 * @version 1.0.0 - Spaces Perfection Plan Phase 1 (Jan 2026)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@hive/auth-logic';
import { logger } from '@/lib/logger';

// ============================================================
// Types
// ============================================================

export interface StreamNotification {
  id: string;
  title: string;
  body?: string;
  type: string;
  category?: string;
  isRead: boolean;
  readAt?: string;
  timestamp: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

interface StreamMessage {
  type:
    | 'connected'
    | 'notification'
    | 'notification_update'
    | 'notification_delete'
    | 'unread_count'
    | 'ping';
  data?: {
    id?: string;
    title?: string;
    body?: string;
    notificationType?: string;
    category?: string;
    isRead?: boolean;
    readAt?: string;
    timestamp?: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  };
  count?: number;
  timestamp?: number;
}

interface NotificationStreamState {
  isConnected: boolean;
  unreadCount: number;
  notifications: StreamNotification[];
  error: Error | null;
}

// ============================================================
// Constants
// ============================================================

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const FALLBACK_POLL_INTERVAL_MS = 30000;

// ============================================================
// Hook
// ============================================================

export function useNotificationStream() {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationStreamState>({
    isConnected: false,
    unreadCount: 0,
    notifications: [],
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Handle incoming SSE messages
  const handleMessage = useCallback((event: MessageEvent) => {
    if (!isMountedRef.current) return;

    try {
      const message: StreamMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'connected':
          setState((prev) => ({
            ...prev,
            isConnected: true,
            error: null,
          }));
          reconnectAttemptsRef.current = 0;
          break;

        case 'unread_count':
          setState((prev) => ({
            ...prev,
            unreadCount: message.count ?? prev.unreadCount,
          }));
          break;

        case 'notification':
          if (message.data) {
            const notification: StreamNotification = {
              id: message.data.id || '',
              title: message.data.title || 'Notification',
              body: message.data.body,
              type: message.data.notificationType || 'general',
              category: message.data.category,
              isRead: message.data.isRead || false,
              readAt: message.data.readAt,
              timestamp: message.data.timestamp || new Date().toISOString(),
              actionUrl: message.data.actionUrl,
              metadata: message.data.metadata,
            };

            setState((prev) => ({
              ...prev,
              notifications: [notification, ...prev.notifications],
              unreadCount: prev.unreadCount + (notification.isRead ? 0 : 1),
            }));
          }
          break;

        case 'notification_update':
          if (message.data?.id) {
            setState((prev) => ({
              ...prev,
              notifications: prev.notifications.map((n) =>
                n.id === message.data?.id
                  ? { ...n, isRead: message.data.isRead ?? n.isRead, readAt: message.data.readAt }
                  : n
              ),
            }));
          }
          break;

        case 'notification_delete':
          if (message.data?.id) {
            setState((prev) => {
              const notification = prev.notifications.find((n) => n.id === message.data?.id);
              const wasUnread = notification && !notification.isRead;
              return {
                ...prev,
                notifications: prev.notifications.filter((n) => n.id !== message.data?.id),
                unreadCount: wasUnread ? prev.unreadCount - 1 : prev.unreadCount,
              };
            });
          }
          break;

        case 'ping':
          // Heartbeat - connection is alive, no action needed
          break;

        default:
          logger.warn('Unknown notification stream message type', {
            type: message.type,
          });
      }
    } catch (error) {
      logger.error('Failed to parse notification stream message', {
        error: error instanceof Error ? error.message : String(error),
        data: event.data,
      });
    }
  }, []);

  // Establish SSE connection
  const connect = useCallback(() => {
    if (!user || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource('/api/notifications/stream', {
        withCredentials: true, // Send cookies
      });

      eventSource.onmessage = handleMessage;

      eventSource.onerror = () => {
        if (!isMountedRef.current) return;

        setState((prev) => ({
          ...prev,
          isConnected: false,
        }));

        eventSource.close();
        eventSourceRef.current = null;

        // Attempt reconnection
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const delay = RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current - 1);

          logger.info('Notification stream disconnected, reconnecting', {
            attempt: reconnectAttemptsRef.current,
            delayMs: delay,
          });

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && user) {
              connect();
            }
          }, delay);
        } else {
          logger.warn('Notification stream max reconnect attempts reached, falling back to polling');
          setState((prev) => ({
            ...prev,
            error: new Error('Stream connection failed, using polling fallback'),
          }));
          startFallbackPolling();
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      logger.error('Failed to create notification EventSource', {
        error: error instanceof Error ? error.message : String(error),
      });
      startFallbackPolling();
    }
  }, [user, handleMessage]);

  // Fallback polling (if SSE fails)
  const startFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) return;

    const poll = async () => {
      if (!isMountedRef.current || !user) return;

      try {
        const response = await fetch('/api/notifications?limit=50');
        if (response.ok) {
          const data = await response.json();
          setState((prev) => ({
            ...prev,
            notifications: (data.notifications || []).map(
              (n: Record<string, unknown>) =>
                ({
                  id: String(n.id),
                  title: String(n.title || 'Notification'),
                  body: n.body ? String(n.body) : undefined,
                  type: String(n.type || 'general'),
                  category: n.category ? String(n.category) : undefined,
                  isRead: Boolean(n.isRead),
                  readAt: n.readAt ? String(n.readAt) : undefined,
                  timestamp: n.timestamp ? String(n.timestamp) : new Date().toISOString(),
                  actionUrl: n.actionUrl ? String(n.actionUrl) : undefined,
                  metadata: n.metadata as Record<string, unknown>,
                }) as StreamNotification
            ),
            unreadCount: data.unreadCount || 0,
          }));
        }
      } catch (error) {
        logger.error('Notification fallback poll failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Initial poll
    poll();

    // Set up interval
    fallbackIntervalRef.current = setInterval(poll, FALLBACK_POLL_INTERVAL_MS);
  }, [user]);

  // Disconnect and cleanup
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isConnected: false,
    }));
  }, []);

  // Connect when user is available
  useEffect(() => {
    isMountedRef.current = true;

    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Optimistic update for mark as read
  const optimisticMarkAsRead = useCallback((notificationId: string) => {
    setState((prev) => {
      const notification = prev.notifications.find((n) => n.id === notificationId);
      if (!notification || notification.isRead) return prev;

      return {
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      };
    });
  }, []);

  // Optimistic update for mark all as read
  const optimisticMarkAllAsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt || new Date().toISOString(),
      })),
      unreadCount: 0,
    }));
  }, []);

  return {
    isConnected: state.isConnected,
    unreadCount: state.unreadCount,
    notifications: state.notifications,
    error: state.error,
    optimisticMarkAsRead,
    optimisticMarkAllAsRead,
    disconnect,
    reconnect: connect,
  };
}

export default useNotificationStream;

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface AdminEvent {
  type: 'user_signup' | 'space_created' | 'report_filed' | 'tool_deployed' | 'error_spike' | 'metric_update';
  data: Record<string, unknown>;
  timestamp: string;
}

export interface RealtimeMetrics {
  usersToday: number;
  spacesToday: number;
  pendingReports: number;
  pendingTools: number;
  timestamp: string;
}

export interface RecentEvent {
  id: string;
  type: AdminEvent['type'];
  message: string;
  timestamp: Date;
}

interface UseAdminRealtimeOptions {
  enabled?: boolean;
  maxEvents?: number;
  onEvent?: (event: AdminEvent) => void;
}

interface UseAdminRealtimeReturn {
  isConnected: boolean;
  metrics: RealtimeMetrics | null;
  recentEvents: RecentEvent[];
  error: string | null;
  reconnect: () => void;
}

function formatEventMessage(event: AdminEvent): string {
  switch (event.type) {
    case 'user_signup':
      return `New user: ${event.data.displayName || event.data.handle || 'Unknown'}`;
    case 'space_created':
      return `Space created: ${event.data.name || 'Unknown'}`;
    case 'report_filed':
      return `New ${event.data.priority || 'medium'} priority report`;
    case 'tool_deployed':
      return `Tool deployed: ${event.data.toolName || 'Unknown'}`;
    case 'error_spike':
      return `Error spike detected: ${event.data.errorRate || 0}%`;
    case 'metric_update':
      return 'Metrics updated';
    default:
      return 'Unknown event';
  }
}

export function useAdminRealtime(options: UseAdminRealtimeOptions = {}): UseAdminRealtimeReturn {
  const { enabled = true, maxEvents = 50, onEvent } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const addEvent = useCallback((event: AdminEvent) => {
    // Don't add metric_update events to the feed
    if (event.type === 'metric_update') {
      if (event.data.usersToday !== undefined) {
        setMetrics({
          usersToday: event.data.usersToday as number,
          spacesToday: event.data.spacesToday as number,
          pendingReports: event.data.pendingReports as number,
          pendingTools: event.data.pendingTools as number,
          timestamp: event.timestamp,
        });
      }
      return;
    }

    const recentEvent: RecentEvent = {
      id: `${event.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: event.type,
      message: formatEventMessage(event),
      timestamp: new Date(event.timestamp),
    };

    setRecentEvents((prev) => {
      const updated = [recentEvent, ...prev];
      return updated.slice(0, maxEvents);
    });

    onEvent?.(event);
  }, [maxEvents, onEvent]);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource('/api/admin/realtime/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (e) => {
        try {
          const event: AdminEvent = JSON.parse(e.data);
          addEvent(event);
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();

        // Exponential backoff for reconnection
        const attempts = reconnectAttemptsRef.current;
        const delay = Math.min(1000 * Math.pow(2, attempts), 30000);

        if (attempts < 10) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          setError('Connection lost. Click to reconnect.');
        }
      };
    } catch {
      setError('Failed to establish connection');
      setIsConnected(false);
    }
  }, [addEvent]);

  const reconnect = useCallback(() => {
    setError(null);
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, connect]);

  return {
    isConnected,
    metrics,
    recentEvents,
    error,
    reconnect,
  };
}

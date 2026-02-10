'use client';

/**
 * Chat Stream Hook
 *
 * Establishes an SSE connection to /api/spaces/[spaceId]/chat/stream
 * for real-time message delivery. Follows the same pattern as
 * use-notification-stream.ts.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@hive/auth-logic';
import { logger } from '@/lib/logger';
import type { ChatMessage } from '@/app/s/[handle]/hooks/use-space-residence-state';

// ============================================================
// Types
// ============================================================

interface StreamChatMessage {
  type: 'connected' | 'message' | 'update' | 'delete' | 'component_update' | 'ping';
  data?: {
    id?: string;
    boardId?: string;
    type?: string;
    authorId?: string;
    authorName?: string;
    authorAvatarUrl?: string;
    authorRole?: string;
    content?: string;
    componentData?: Record<string, unknown>;
    timestamp?: number;
    editedAt?: string;
    isDeleted?: boolean;
    isPinned?: boolean;
    reactions?: Array<{ emoji: string; count: number; hasReacted: boolean }>;
    replyToId?: string;
    replyToPreview?: string;
    threadCount?: number;
    // component_update fields
    componentId?: string;
    elementType?: string;
    sharedState?: Record<string, unknown>;
    isActive?: boolean;
    version?: number;
    updatedAt?: number;
  };
  boardId?: string;
  timestamp?: number;
}

interface ChatStreamState {
  isConnected: boolean;
  error: Error | null;
}

// ============================================================
// Constants
// ============================================================

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 8;

// ============================================================
// Helpers
// ============================================================

/** Map SSE message shape → frontend ChatMessage shape */
function mapStreamMessage(data: NonNullable<StreamChatMessage['data']>): ChatMessage {
  return {
    id: data.id || '',
    authorId: data.authorId || '',
    authorName: data.authorName || 'Unknown',
    authorHandle: '', // SSE doesn't send handle — not critical
    authorAvatarUrl: data.authorAvatarUrl,
    content: data.content || '',
    timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
    reactions: data.reactions || [],
    isPinned: data.isPinned || false,
    replyCount: data.threadCount || 0,
    isEdited: Boolean(data.editedAt),
    editedAt: data.editedAt,
    inlineComponent: data.componentData ? (data.componentData as unknown as ChatMessage['inlineComponent']) : undefined,
  };
}

// ============================================================
// Hook
// ============================================================

export function useChatStream(
  spaceId: string | null,
  onNewMessage: (message: ChatMessage) => void,
  onMessageUpdate: (id: string, updates: Partial<ChatMessage>) => void,
  onMessageDelete: (id: string) => void,
  onComponentUpdate?: (componentId: string, sharedState: Record<string, unknown>) => void,
) {
  const { user } = useAuth();
  const [state, setState] = useState<ChatStreamState>({
    isConnected: false,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Stable refs for callbacks to avoid reconnect loops
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageUpdateRef = useRef(onMessageUpdate);
  const onMessageDeleteRef = useRef(onMessageDelete);
  const onComponentUpdateRef = useRef(onComponentUpdate);
  onNewMessageRef.current = onNewMessage;
  onMessageUpdateRef.current = onMessageUpdate;
  onMessageDeleteRef.current = onMessageDelete;
  onComponentUpdateRef.current = onComponentUpdate;

  const handleMessage = useCallback((event: MessageEvent) => {
    if (!isMountedRef.current) return;

    try {
      const message: StreamChatMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'connected':
          setState({ isConnected: true, error: null });
          reconnectAttemptsRef.current = 0;
          break;

        case 'message':
          if (message.data?.id) {
            onNewMessageRef.current(mapStreamMessage(message.data));
          }
          break;

        case 'update':
          if (message.data?.id) {
            const updates: Partial<ChatMessage> = {};
            if (message.data.content !== undefined) updates.content = message.data.content;
            if (message.data.editedAt !== undefined) {
              updates.editedAt = message.data.editedAt;
              updates.isEdited = true;
            }
            if (message.data.isDeleted !== undefined && message.data.isDeleted) {
              // Treat as delete
              onMessageDeleteRef.current(message.data.id);
              return;
            }
            if (message.data.isPinned !== undefined) updates.isPinned = message.data.isPinned;
            if (message.data.reactions) updates.reactions = message.data.reactions;
            onMessageUpdateRef.current(message.data.id, updates);
          }
          break;

        case 'delete':
          if (message.data?.id) {
            onMessageDeleteRef.current(message.data.id);
          }
          break;

        case 'component_update':
          if (message.data?.componentId && message.data?.sharedState && onComponentUpdateRef.current) {
            onComponentUpdateRef.current(message.data.componentId, message.data.sharedState);
          }
          break;

        case 'ping':
          // Heartbeat — connection alive
          break;
      }
    } catch (error) {
      logger.error('Failed to parse chat stream message', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  const connect = useCallback(() => {
    if (!user || !spaceId || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource(
        `/api/spaces/${spaceId}/chat/stream`,
        { withCredentials: true }
      );

      eventSource.onmessage = handleMessage;

      eventSource.onerror = () => {
        if (!isMountedRef.current) return;

        setState(prev => ({ ...prev, isConnected: false }));
        eventSource.close();
        eventSourceRef.current = null;

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const delay = RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current - 1);

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && user && spaceId) {
              connect();
            }
          }, delay);
        } else {
          setState({
            isConnected: false,
            error: new Error('Chat stream connection failed after max retries'),
          });
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      logger.error('Failed to create chat EventSource', {
        error: error instanceof Error ? error.message : String(error),
        spaceId,
      });
    }
  }, [user, spaceId, handleMessage]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  // Connect when spaceId + user are available, disconnect on cleanup
  useEffect(() => {
    isMountedRef.current = true;

    if (user && spaceId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [user, spaceId, connect, disconnect]);

  return {
    isConnected: state.isConnected,
    error: state.error,
    disconnect,
    reconnect: connect,
  };
}

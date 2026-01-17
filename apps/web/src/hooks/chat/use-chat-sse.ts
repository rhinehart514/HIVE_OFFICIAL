"use client";

/**
 * Chat SSE Hook
 *
 * Manages Server-Sent Events connection for real-time chat updates.
 * Handles connection lifecycle, reconnection with exponential backoff,
 * and event parsing.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import type { ChatMessageData } from "./types";
import {
  SSE_RECONNECT_BASE_DELAY_MS,
  SSE_RECONNECT_MAX_DELAY_MS,
} from "./constants";

export interface UseChatSSEOptions {
  spaceId: string;
  boardId: string;
  enabled: boolean;
  onMessage: (message: ChatMessageData) => void;
  onUpdate: (data: Partial<ChatMessageData> & { id: string }) => void;
  onDelete: (messageId: string) => void;
}

export interface UseChatSSEReturn {
  isConnected: boolean;
  disconnect: () => void;
  reconnect: () => void;
}

export function useChatSSE(options: UseChatSSEOptions): UseChatSSEReturn {
  const { spaceId, boardId, enabled, onMessage, onUpdate, onDelete } = options;

  const [isConnected, setIsConnected] = useState(false);

  // Refs for cleanup and reconnection
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const mountedRef = useRef(true);
  const intentionalDisconnectRef = useRef(false);
  const currentBoardIdRef = useRef(boardId);

  // Keep boardId ref in sync
  useEffect(() => {
    currentBoardIdRef.current = boardId;
  }, [boardId]);

  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(
    (targetBoardId: string) => {
      if (!spaceId || !enabled) return;

      intentionalDisconnectRef.current = false;

      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const url = `/api/spaces/${spaceId}/chat/stream?boardId=${targetBoardId}`;

      try {
        const eventSource = new EventSource(url, { withCredentials: true });
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          if (mountedRef.current) {
            setIsConnected(true);
            reconnectAttemptRef.current = 0;
          }
        };

        eventSource.onmessage = (event) => {
          if (!mountedRef.current) return;

          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case "connected":
                setIsConnected(true);
                break;

              case "message":
                onMessage(data.data);
                break;

              case "update":
                onUpdate(data.data);
                break;

              case "delete":
                onDelete(data.data.id);
                break;

              case "ping":
                // Heartbeat - connection is alive
                break;

              default:
                if (process.env.NODE_ENV === "development") {
                  console.warn("Unknown SSE event type:", data.type);
                }
            }
          } catch {
            // Silently ignore parse errors
          }
        };

        eventSource.onerror = () => {
          if (!mountedRef.current) return;

          if (intentionalDisconnectRef.current) {
            setIsConnected(false);
            eventSource.close();
            eventSourceRef.current = null;
            return;
          }

          setIsConnected(false);
          eventSource.close();
          eventSourceRef.current = null;

          // Exponential backoff reconnection
          const delay = Math.min(
            SSE_RECONNECT_BASE_DELAY_MS *
              Math.pow(2, reconnectAttemptRef.current),
            SSE_RECONNECT_MAX_DELAY_MS
          );

          reconnectAttemptRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect(currentBoardIdRef.current);
            }
          }, delay);
        };
      } catch (err) {
        console.error("Error creating EventSource:", err);
        setIsConnected(false);
      }
    },
    [spaceId, enabled, onMessage, onUpdate, onDelete]
  );

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptRef.current = 0;
    connect(currentBoardIdRef.current);
  }, [disconnect, connect]);

  // Connect when spaceId/boardId changes
  useEffect(() => {
    if (spaceId && boardId && enabled) {
      connect(boardId);
    }

    return () => {
      disconnect();
    };
  }, [spaceId, boardId, enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    disconnect,
    reconnect,
  };
}

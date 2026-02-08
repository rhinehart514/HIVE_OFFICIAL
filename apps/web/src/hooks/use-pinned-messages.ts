"use client";

/**
 * Pinned Messages Hook
 *
 * Manages pinned messages for space chat boards.
 * Pinned messages are displayed prominently in the sidebar.
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface ChatMessageData {
  id: string;
  boardId: string;
  type: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole?: string;
  content: string;
  timestamp: number;
  reactions?: Array<{ emoji: string; userIds: string[] }>;
  isPinned?: boolean;
  threadId?: string;
  editedAt?: number;
  [key: string]: unknown;
}

interface UsePinnedMessagesOptions {
  spaceId: string;
  boardId?: string;
  enabled?: boolean;
}

interface UsePinnedMessagesReturn {
  messages: ChatMessageData[];
  isLoading: boolean;
  error: string | null;
  pinMessage: (messageId: string) => Promise<void>;
  unpinMessage: (messageId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing pinned messages in a space board
 */
export function usePinnedMessages(
  options: UsePinnedMessagesOptions
): UsePinnedMessagesReturn {
  const { spaceId, boardId = "general", enabled = true } = options;
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  // P2 FIX: Track in-flight pin/unpin operations to prevent double-click
  const pinningRef = useRef<Set<string>>(new Set());
  const unpinningRef = useRef<Set<string>>(new Set());

  // Fetch pinned messages
  const fetchPinnedMessages = useCallback(async () => {
    if (!spaceId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (boardId) {
        params.set("boardId", boardId);
      }

      const response = await fetch(
        `/api/spaces/${spaceId}/chat/pinned?${params.toString()}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch pinned messages: ${response.status}`);
      }

      const data = await response.json();

      if (mountedRef.current) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch pinned messages"
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [spaceId, boardId, enabled]);

  // Initialize and cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch on mount and when options change
  useEffect(() => {
    if (spaceId && enabled) {
      fetchPinnedMessages();
    }
  }, [spaceId, boardId, enabled, fetchPinnedMessages]);

  const pinMessage = useCallback(
    async (messageId: string) => {
      // P2 FIX: Prevent double-click race condition
      if (!spaceId || !messageId || pinningRef.current.has(messageId)) return;

      pinningRef.current.add(messageId);

      try {
        const response = await fetch(
          `/api/spaces/${spaceId}/chat/${messageId}/pin`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to pin message: ${response.status}`);
        }

        // Refresh pinned messages list
        await fetchPinnedMessages();
      } finally {
        pinningRef.current.delete(messageId);
      }
    },
    [spaceId, fetchPinnedMessages]
  );

  const unpinMessage = useCallback(
    async (messageId: string) => {
      // P2 FIX: Prevent double-click race condition
      if (!spaceId || !messageId || unpinningRef.current.has(messageId)) return;

      unpinningRef.current.add(messageId);

      // Optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      try {
        const response = await fetch(
          `/api/spaces/${spaceId}/chat/${messageId}/pin`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to unpin message: ${response.status}`);
        }
      } catch (err) {
        // Refresh to get correct state
        await fetchPinnedMessages();
        throw err;
      } finally {
        unpinningRef.current.delete(messageId);
      }
    },
    [spaceId, fetchPinnedMessages]
  );

  return {
    messages,
    isLoading,
    error,
    pinMessage,
    unpinMessage,
    refresh: fetchPinnedMessages,
  };
}

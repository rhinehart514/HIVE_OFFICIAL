"use client";

/**
 * Pinned Messages Hook
 *
 * Manages pinned messages for space chat boards.
 * Pinned messages are displayed prominently in the sidebar.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessageData } from "./use-chat-messages";

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
      console.error("Error fetching pinned messages:", err);
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
      if (!spaceId || !messageId) return;

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
      } catch (err) {
        console.error("Error pinning message:", err);
        throw err;
      }
    },
    [spaceId, fetchPinnedMessages]
  );

  const unpinMessage = useCallback(
    async (messageId: string) => {
      if (!spaceId || !messageId) return;

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
        console.error("Error unpinning message:", err);
        // Refresh to get correct state
        await fetchPinnedMessages();
        throw err;
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

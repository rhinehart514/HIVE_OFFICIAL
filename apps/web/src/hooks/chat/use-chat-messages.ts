"use client";

/**
 * Chat Messages Hook - Real-time chat with SSE
 *
 * Provides real-time chat message functionality for space boards.
 * Uses SSE (Server-Sent Events) with Firestore for live updates.
 *
 * This is the main hook that composes specialized hooks:
 * - useChatSSE: SSE connection management
 * - useChatTyping: Typing indicators via Firebase RTDB
 * - useChatMutations: Message CRUD operations
 * - useChatThreads: Thread management
 *
 * Features:
 * - Real-time message sync via SSE
 * - Optimistic updates for sends
 * - Board/channel switching
 * - Typing indicators (real-time via Firebase RTDB)
 * - Reconnection with exponential backoff
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ChatMessageData,
  SpaceBoardData,
  UseChatMessagesOptions,
  UseChatMessagesReturn,
} from "./types";
import { CHAT_DEFAULT_LIMIT, DEFAULT_BOARD_ID } from "./constants";
import { useChatSSE } from "./use-chat-sse";
import { useChatTyping } from "./use-chat-typing";
import { useChatMutations } from "./use-chat-mutations";
import { useChatThreads } from "./use-chat-threads";

export function useChatMessages(
  options: UseChatMessagesOptions
): UseChatMessagesReturn {
  const {
    spaceId,
    initialBoardId,
    limit = CHAT_DEFAULT_LIMIT,
    enableRealtime = true,
    enableTypingIndicators = true,
  } = options;

  // Core state
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [boards, setBoards] = useState<SpaceBoardData[]>([]);
  const [activeBoardId, setActiveBoardId] = useState(
    initialBoardId || DEFAULT_BOARD_ID
  );
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessageData[]>([]);

  // Loading/error state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const mountedRef = useRef(true);
  const scrollPositionCache = useRef<Map<string, number>>(new Map());

  // ============================================================
  // API Fetchers
  // ============================================================

  const fetchBoards = useCallback(async () => {
    if (!spaceId) return;

    try {
      const response = await fetch(`/api/spaces/${spaceId}/boards`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch boards: ${response.status}`);
      }

      const data = await response.json();
      if (mountedRef.current) {
        setBoards(data.boards || []);

        if (!initialBoardId && data.boards?.length > 0) {
          const defaultBoard =
            data.boards.find((b: SpaceBoardData) => b.isDefault) ||
            data.boards[0];
          setActiveBoardId(defaultBoard.id);
        }
      }
    } catch (err) {
      console.error("Error fetching boards:", err);
    }
  }, [spaceId, initialBoardId]);

  const fetchMessages = useCallback(
    async (boardId: string, before?: number) => {
      if (!spaceId) return;

      const isInitialLoad = !before;
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams({
          boardId,
          limit: limit.toString(),
        });
        if (before) {
          params.set("before", before.toString());
        }

        const response = await fetch(
          `/api/spaces/${spaceId}/chat?${params.toString()}`,
          { credentials: "include" }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }

        const data = await response.json();

        if (mountedRef.current) {
          if (isInitialLoad) {
            setMessages(data.messages || []);
          } else {
            setMessages((prev) => [...(data.messages || []), ...prev]);
          }
          setHasMore(data.hasMore || false);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        if (mountedRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch messages"
          );
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [spaceId, limit]
  );

  const fetchPinnedMessages = useCallback(
    async (boardId: string) => {
      if (!spaceId) return;

      try {
        const response = await fetch(
          `/api/spaces/${spaceId}/chat/pinned?boardId=${boardId}`,
          { credentials: "include" }
        );

        if (!response.ok) return;

        const data = await response.json();
        if (mountedRef.current) {
          setPinnedMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Error fetching pinned messages:", err);
      }
    },
    [spaceId]
  );

  // ============================================================
  // Composed Hooks
  // ============================================================

  // Mutations hook
  const mutations = useChatMutations({
    spaceId,
    boardId: activeBoardId,
    messages,
    setMessages,
    setPinnedMessages,
    fetchPinnedMessages,
  });

  // SSE hook with message handlers
  const handleSSEMessage = useCallback(
    (message: ChatMessageData) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;

        // Check if this is an in-flight message we sent optimistically
        const tempId = mutations.findInFlightTempId(message.id);
        if (tempId) {
          mutations.clearInFlightMessage(tempId);
          return prev.map((m) => (m.id === tempId ? { ...message } : m));
        }

        return [...prev, message];
      });
    },
    [mutations]
  );

  const handleSSEUpdate = useCallback(
    (data: Partial<ChatMessageData> & { id: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.id ? { ...m, ...data } : m))
      );
    },
    []
  );

  const handleSSEDelete = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true } : m))
    );
  }, []);

  const { isConnected, disconnect: disconnectSSE } = useChatSSE({
    spaceId,
    boardId: activeBoardId,
    enabled: enableRealtime,
    onMessage: handleSSEMessage,
    onUpdate: handleSSEUpdate,
    onDelete: handleSSEDelete,
  });

  // Typing hook
  const { typingUsers, setTyping } = useChatTyping({
    spaceId,
    boardId: activeBoardId,
    enabled: enableTypingIndicators,
  });

  // Threads hook
  const { thread, openThread, closeThread, sendThreadReply, loadMoreReplies } =
    useChatThreads({
      spaceId,
      boardId: activeBoardId,
      messages,
      setMessages,
    });

  // ============================================================
  // Board & Scroll Management
  // ============================================================

  const saveScrollPosition = useCallback(
    (scrollTop: number) => {
      scrollPositionCache.current.set(activeBoardId, scrollTop);
    },
    [activeBoardId]
  );

  const getScrollPosition = useCallback(() => {
    return scrollPositionCache.current.get(activeBoardId);
  }, [activeBoardId]);

  const changeBoard = useCallback(
    (boardId: string) => {
      if (boardId === activeBoardId) return;

      setActiveBoardId(boardId);
      setMessages([]);
      setHasMore(false);
      disconnectSSE();
    },
    [activeBoardId, disconnectSSE]
  );

  const reorderBoards = useCallback(
    (boardIds: string[]) => {
      setBoards((prev) => {
        // Reorder boards based on the new order
        const boardMap = new Map(prev.map((b) => [b.id, b]));
        return boardIds
          .map((id) => boardMap.get(id))
          .filter((b): b is SpaceBoardData => b !== undefined);
      });
    },
    []
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || messages.length === 0) return;

    const oldestMessage = messages[0];
    if (oldestMessage?.timestamp) {
      await fetchMessages(activeBoardId, oldestMessage.timestamp);
    }
  }, [hasMore, isLoadingMore, messages, activeBoardId, fetchMessages]);

  const refresh = useCallback(async () => {
    await fetchBoards();
    await fetchMessages(activeBoardId);
    await fetchPinnedMessages(activeBoardId);
  }, [fetchBoards, fetchMessages, fetchPinnedMessages, activeBoardId]);

  // ============================================================
  // Effects
  // ============================================================

  // Initialize and cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch boards on spaceId change
  useEffect(() => {
    if (spaceId) {
      fetchBoards();
    }
  }, [spaceId, fetchBoards]);

  // Fetch messages when board changes
  useEffect(() => {
    if (spaceId && activeBoardId) {
      fetchMessages(activeBoardId);
      fetchPinnedMessages(activeBoardId);
    }
  }, [spaceId, activeBoardId, fetchMessages, fetchPinnedMessages]);

  // ============================================================
  // Return
  // ============================================================

  return {
    // Data
    messages,
    boards,
    activeBoardId,
    typingUsers,
    pinnedMessages,
    thread,

    // Loading states
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    isConnected,

    // Actions
    sendMessage: mutations.sendMessage,
    editMessage: mutations.editMessage,
    deleteMessage: mutations.deleteMessage,
    addReaction: mutations.addReaction,
    pinMessage: mutations.pinMessage,
    changeBoard,
    reorderBoards,
    loadMore,
    setTyping,
    refresh,

    // Scroll position management
    saveScrollPosition,
    getScrollPosition,

    // Thread actions
    openThread,
    closeThread,
    sendThreadReply,
    loadMoreReplies,
  };
}

// Re-export types for backward compatibility
export type {
  ChatMessageData,
  SpaceBoardData,
  TypingUser,
  ThreadData,
  UseChatMessagesOptions,
  UseChatMessagesReturn,
} from "./types";

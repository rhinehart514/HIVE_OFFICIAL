"use client";

/**
 * Chat Messages Hook - Real-time chat with SSE
 *
 * Provides real-time chat message functionality for space boards.
 * Uses SSE (Server-Sent Events) with Firestore for live updates.
 *
 * Features:
 * - Real-time message sync via SSE
 * - Optimistic updates for sends
 * - Board/channel switching
 * - Typing indicators
 * - Reconnection with exponential backoff
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { nanoid } from "nanoid";

// ============================================================
// Types (matching SpaceChatBoard component expectations)
// ============================================================

export interface ChatMessageData {
  id: string;
  boardId: string;
  type: "text" | "inline_component" | "system";
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole?: "owner" | "admin" | "moderator" | "member";
  content: string;
  componentData?: {
    elementType: string;
    deploymentId?: string;
    componentId?: string;
    toolId?: string;
    state?: Record<string, unknown>;
    isActive: boolean;
  };
  systemAction?: string;
  timestamp: number;
  editedAt?: number;
  isDeleted?: boolean;
  isPinned?: boolean;
  reactions?: Array<{
    emoji: string;
    count: number;
    hasReacted: boolean;
  }>;
  replyToId?: string;
  replyToPreview?: string;
  threadCount?: number;
}

export interface SpaceBoardData {
  id: string;
  name: string;
  type: "general" | "topic" | "event";
  description?: string;
  linkedEventId?: string;
  messageCount: number;
  isDefault?: boolean;
  isLocked?: boolean;
}

export interface TypingUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ThreadData {
  isOpen: boolean;
  parentMessage: ChatMessageData | null;
  replies: ChatMessageData[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
}

export interface UseChatMessagesOptions {
  spaceId: string;
  initialBoardId?: string;
  limit?: number;
  enableRealtime?: boolean;
  enableTypingIndicators?: boolean;
  pollingIntervalMs?: number; // For polling fallback (not used with SSE)
}

export interface UseChatMessagesReturn {
  // Data
  messages: ChatMessageData[];
  boards: SpaceBoardData[];
  activeBoardId: string;
  typingUsers: TypingUser[];
  pinnedMessages: ChatMessageData[];
  thread: ThreadData;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  isConnected: boolean;

  // Actions
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  changeBoard: (boardId: string) => void;
  loadMore: () => Promise<void>;
  setTyping: () => void;
  refresh: () => Promise<void>;

  // Scroll position management
  saveScrollPosition: (scrollTop: number) => void;
  getScrollPosition: () => number | undefined;

  // Thread actions
  openThread: (messageId: string) => Promise<void>;
  closeThread: () => void;
  sendThreadReply: (content: string) => Promise<void>;
  loadMoreReplies: () => Promise<void>;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_LIMIT = 50;
const TYPING_DEBOUNCE_MS = 3000;
const TYPING_BASE_INTERVAL_MS = 2000;
const TYPING_MAX_INTERVAL_MS = 10000;
const TYPING_BACKOFF_MULTIPLIER = 1.5;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;
const DEFAULT_BOARD_ID = "general";

// ============================================================
// Hook Implementation
// ============================================================

export function useChatMessages(
  options: UseChatMessagesOptions
): UseChatMessagesReturn {
  const {
    spaceId,
    initialBoardId,
    limit = DEFAULT_LIMIT,
    enableRealtime = true,
    enableTypingIndicators = true,
  } = options;

  // Core state
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [boards, setBoards] = useState<SpaceBoardData[]>([]);
  const [activeBoardId, setActiveBoardId] = useState(
    initialBoardId || DEFAULT_BOARD_ID
  );
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessageData[]>([]);
  const [thread, setThread] = useState<ThreadData>({
    isOpen: false,
    parentMessage: null,
    replies: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
  });

  // Loading/error state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs for cleanup and reconnection
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingPollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef(TYPING_BASE_INTERVAL_MS);
  const lastTypingSentRef = useRef(0);
  const mountedRef = useRef(true);

  // Scroll position cache for board switching
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

        // Set default board if not specified
        if (!initialBoardId && data.boards?.length > 0) {
          const defaultBoard =
            data.boards.find((b: SpaceBoardData) => b.isDefault) ||
            data.boards[0];
          setActiveBoardId(defaultBoard.id);
        }
      }
    } catch (err) {
      console.error("Error fetching boards:", err);
      // Don't set error - boards are optional, default to "general"
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
            // Prepend older messages
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
  // SSE Connection Management
  // ============================================================

  const connectSSE = useCallback(
    (boardId: string) => {
      if (!spaceId || !enableRealtime) return;

      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const url = `/api/spaces/${spaceId}/chat/stream?boardId=${boardId}`;

      try {
        const eventSource = new EventSource(url, { withCredentials: true });
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          if (mountedRef.current) {
            setIsConnected(true);
            reconnectAttemptRef.current = 0; // Reset backoff on successful connection
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
                // Add new message (avoid duplicates)
                setMessages((prev) => {
                  const exists = prev.some((m) => m.id === data.data.id);
                  if (exists) return prev;
                  return [...prev, data.data];
                });
                break;

              case "update":
                // Update existing message (edit, reaction, pin)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === data.data.id ? { ...m, ...data.data } : m
                  )
                );
                break;

              case "delete":
                // Mark message as deleted
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === data.data.id ? { ...m, isDeleted: true } : m
                  )
                );
                break;

              case "ping":
                // Heartbeat - connection is alive
                break;

              default:
                console.log("Unknown SSE event type:", data.type);
            }
          } catch (err) {
            console.error("Error parsing SSE message:", err);
          }
        };

        eventSource.onerror = () => {
          if (!mountedRef.current) return;

          setIsConnected(false);
          eventSource.close();
          eventSourceRef.current = null;

          // Exponential backoff reconnection
          const delay = Math.min(
            RECONNECT_BASE_DELAY_MS *
              Math.pow(2, reconnectAttemptRef.current),
            RECONNECT_MAX_DELAY_MS
          );

          reconnectAttemptRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connectSSE(boardId);
            }
          }, delay);
        };
      } catch (err) {
        console.error("Error creating EventSource:", err);
        setIsConnected(false);
      }
    },
    [spaceId, enableRealtime]
  );

  const disconnectSSE = useCallback(() => {
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

  // ============================================================
  // Typing Indicators
  // ============================================================

  const fetchTypingUsers = useCallback(
    async (boardId: string) => {
      if (!spaceId || !enableTypingIndicators) return;

      try {
        const response = await fetch(
          `/api/spaces/${spaceId}/chat/typing?boardId=${boardId}`,
          { credentials: "include" }
        );

        if (!response.ok) return;

        const data = await response.json();
        if (mountedRef.current) {
          setTypingUsers(data.users || []);
        }
      } catch (err) {
        // Silently fail - typing indicators are non-critical
      }
    },
    [spaceId, enableTypingIndicators]
  );

  const setTyping = useCallback(() => {
    if (!spaceId || !enableTypingIndicators) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_DEBOUNCE_MS) {
      return; // Debounce
    }

    lastTypingSentRef.current = now;

    fetch(`/api/spaces/${spaceId}/chat/typing`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId: activeBoardId }),
    }).catch(() => {
      // Silently fail
    });
  }, [spaceId, activeBoardId, enableTypingIndicators]);

  // ============================================================
  // Message Actions
  // ============================================================

  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!spaceId || !content.trim()) return;

      // Optimistic update with temporary ID
      const tempId = `temp_${nanoid()}`;
      const optimisticMessage: ChatMessageData = {
        id: tempId,
        boardId: activeBoardId,
        type: "text",
        authorId: "current_user", // Will be replaced by real data
        authorName: "You",
        content: content.trim(),
        timestamp: Date.now(),
        reactions: [],
        replyToId,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const response = await fetch(`/api/spaces/${spaceId}/chat`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId: activeBoardId,
            content: content.trim(),
            replyToId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed: ${response.status}`);
        }

        const data = await response.json();

        // Update temporary message with real ID
        // SSE will also send the message, but this ensures immediate update
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, id: data.messageId, timestamp: data.timestamp }
              : m
          )
        );
      } catch (err) {
        console.error("Error sending message:", err);
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw err;
      }
    },
    [spaceId, activeBoardId]
  );

  const editMessage = useCallback(
    async (messageId: string, content: string): Promise<boolean> => {
      if (!spaceId || !messageId || !content.trim()) return false;

      // Optimistic update
      const originalMessage = messages.find((m) => m.id === messageId);
      if (!originalMessage) return false;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: content.trim(), editedAt: Date.now() }
            : m
        )
      );

      try {
        const response = await fetch(
          `/api/spaces/${spaceId}/chat/${messageId}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content.trim() }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to edit: ${response.status}`);
        }

        return true;
      } catch (err) {
        console.error("Error editing message:", err);
        // Rollback
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? originalMessage : m))
        );
        return false;
      }
    },
    [spaceId, messages]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!spaceId || !messageId) return;

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true } : m))
      );

      try {
        const response = await fetch(
          `/api/spaces/${spaceId}/chat/${messageId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete: ${response.status}`);
        }
      } catch (err) {
        console.error("Error deleting message:", err);
        // Rollback
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isDeleted: false } : m))
        );
      }
    },
    [spaceId]
  );

  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!spaceId || !messageId || !emoji) return;

      try {
        await fetch(`/api/spaces/${spaceId}/chat/${messageId}/react`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
        // SSE will update the message with new reaction counts
      } catch (err) {
        console.error("Error adding reaction:", err);
      }
    },
    [spaceId]
  );

  const pinMessage = useCallback(
    async (messageId: string) => {
      if (!spaceId || !messageId) return;

      try {
        await fetch(`/api/spaces/${spaceId}/chat/${messageId}/pin`, {
          method: "POST",
          credentials: "include",
        });
        // SSE will update the message, then refresh pinned
        await fetchPinnedMessages(activeBoardId);
      } catch (err) {
        console.error("Error pinning message:", err);
      }
    },
    [spaceId, activeBoardId, fetchPinnedMessages]
  );

  // ============================================================
  // Scroll Position Management
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

  // ============================================================
  // Board Management
  // ============================================================

  const changeBoard = useCallback(
    (boardId: string) => {
      if (boardId === activeBoardId) return;

      // Note: Scroll position should be saved by the component before calling changeBoard
      // using saveScrollPosition(container.scrollTop)

      setActiveBoardId(boardId);
      setMessages([]);
      setTypingUsers([]);
      setHasMore(false);

      // Disconnect and reconnect SSE for new board
      disconnectSSE();
    },
    [activeBoardId, disconnectSSE]
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
      disconnectSSE();
      if (typingPollTimeoutRef.current) {
        clearTimeout(typingPollTimeoutRef.current);
      }
    };
  }, [disconnectSSE]);

  // Fetch boards on spaceId change
  useEffect(() => {
    if (spaceId) {
      fetchBoards();
    }
  }, [spaceId, fetchBoards]);

  // Fetch messages and connect SSE when board changes
  useEffect(() => {
    if (spaceId && activeBoardId) {
      fetchMessages(activeBoardId);
      fetchPinnedMessages(activeBoardId);

      if (enableRealtime) {
        connectSSE(activeBoardId);
      }
    }

    return () => {
      disconnectSSE();
    };
  }, [
    spaceId,
    activeBoardId,
    fetchMessages,
    fetchPinnedMessages,
    enableRealtime,
    connectSSE,
    disconnectSSE,
  ]);

  // Poll for typing indicators with exponential backoff
  // Starts at 2s, backs off to 10s when no activity, resets on activity
  useEffect(() => {
    if (!spaceId || !activeBoardId || !enableTypingIndicators) return;

    // Reset interval on board change
    typingIntervalRef.current = TYPING_BASE_INTERVAL_MS;

    const scheduleNextPoll = () => {
      if (!mountedRef.current) return;

      typingPollTimeoutRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;

        try {
          const response = await fetch(
            `/api/spaces/${spaceId}/chat/typing?boardId=${activeBoardId}`,
            { credentials: "include" }
          );

          if (!response.ok) {
            scheduleNextPoll();
            return;
          }

          const data = await response.json();
          const users = data.users || [];

          if (mountedRef.current) {
            setTypingUsers(users);

            // Adjust polling interval based on activity
            if (users.length > 0) {
              // Activity detected - reset to base interval
              typingIntervalRef.current = TYPING_BASE_INTERVAL_MS;
            } else {
              // No activity - back off
              typingIntervalRef.current = Math.min(
                typingIntervalRef.current * TYPING_BACKOFF_MULTIPLIER,
                TYPING_MAX_INTERVAL_MS
              );
            }

            scheduleNextPoll();
          }
        } catch {
          // Silently fail - typing indicators are non-critical
          if (mountedRef.current) {
            scheduleNextPoll();
          }
        }
      }, typingIntervalRef.current);
    };

    // Initial fetch then start polling
    fetchTypingUsers(activeBoardId);
    scheduleNextPoll();

    return () => {
      if (typingPollTimeoutRef.current) {
        clearTimeout(typingPollTimeoutRef.current);
        typingPollTimeoutRef.current = null;
      }
    };
  }, [spaceId, activeBoardId, enableTypingIndicators, fetchTypingUsers]);

  // ============================================================
  // Thread Actions
  // ============================================================

  const openThread = useCallback(
    async (messageId: string) => {
      if (!spaceId || !messageId) return;

      // Find the parent message
      const parentMessage = messages.find((m) => m.id === messageId);
      if (!parentMessage) return;

      setThread({
        isOpen: true,
        parentMessage,
        replies: [],
        isLoading: true,
        isLoadingMore: false,
        hasMore: false,
      });

      try {
        const response = await fetch(
          `/api/spaces/${spaceId}/chat/${messageId}/replies?limit=50`,
          { credentials: "include" }
        );

        if (!response.ok) {
          throw new Error("Failed to load thread");
        }

        const data = await response.json();

        if (mountedRef.current) {
          setThread({
            isOpen: true,
            parentMessage,
            replies: data.replies || [],
            isLoading: false,
            isLoadingMore: false,
            hasMore: data.hasMore || false,
          });
        }
      } catch (err) {
        console.error("Error loading thread:", err);
        if (mountedRef.current) {
          setThread((prev) => ({ ...prev, isLoading: false }));
        }
      }
    },
    [spaceId, messages]
  );

  const closeThread = useCallback(() => {
    setThread({
      isOpen: false,
      parentMessage: null,
      replies: [],
      isLoading: false,
      isLoadingMore: false,
      hasMore: false,
    });
  }, []);

  const sendThreadReply = useCallback(
    async (content: string) => {
      if (!spaceId || !thread?.parentMessage?.id || !content.trim()) return;

      const tempId = `temp-${nanoid()}`;
      const now = Date.now();

      // Optimistic update
      const optimisticReply: ChatMessageData = {
        id: tempId,
        boardId: activeBoardId,
        type: "text",
        authorId: "current-user", // Will be replaced by server
        authorName: "You",
        content: content.trim(),
        timestamp: now,
        replyToId: thread.parentMessage.id,
      };

      setThread((prev) => ({
        ...prev,
        replies: [...prev.replies, optimisticReply],
      }));

      try {
        const response = await fetch(
          `/api/spaces/${spaceId}/chat/${thread.parentMessage.id}/replies`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content.trim() }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to send reply");
        }

        const data = await response.json();

        // Replace temp message with real one
        if (mountedRef.current) {
          setThread((prev) => ({
            ...prev,
            replies: prev.replies.map((r) =>
              r.id === tempId ? data.message : r
            ),
          }));

          // Update thread count on parent message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === thread.parentMessage?.id
                ? { ...m, threadCount: (m.threadCount || 0) + 1 }
                : m
            )
          );
        }
      } catch (err) {
        console.error("Error sending thread reply:", err);
        // Remove optimistic message on error
        if (mountedRef.current) {
          setThread((prev) => ({
            ...prev,
            replies: prev.replies.filter((r) => r.id !== tempId),
          }));
        }
      }
    },
    [spaceId, thread?.parentMessage?.id, activeBoardId]
  );

  const loadMoreReplies = useCallback(async () => {
    if (!spaceId || !thread?.parentMessage?.id || thread.isLoadingMore || !thread.hasMore)
      return;

    const lastReply = thread.replies[thread.replies.length - 1];
    if (!lastReply) return;

    setThread((prev) => ({ ...prev, isLoadingMore: true }));

    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/chat/${thread.parentMessage.id}/replies?before=${lastReply.id}&limit=50`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Failed to load more replies");
      }

      const data = await response.json();

      if (mountedRef.current) {
        setThread((prev) => ({
          ...prev,
          replies: [...prev.replies, ...(data.replies || [])],
          isLoadingMore: false,
          hasMore: data.hasMore || false,
        }));
      }
    } catch (err) {
      console.error("Error loading more replies:", err);
      if (mountedRef.current) {
        setThread((prev) => ({ ...prev, isLoadingMore: false }));
      }
    }
  }, [spaceId, thread?.parentMessage?.id, thread?.isLoadingMore, thread?.hasMore, thread?.replies]);

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
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    pinMessage,
    changeBoard,
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

// Types are exported at declaration - UseChatMessagesOptions, UseChatMessagesReturn, ChatMessageData, ThreadData

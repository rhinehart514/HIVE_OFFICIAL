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
 * - Typing indicators (real-time via Firebase RTDB)
 * - Reconnection with exponential backoff
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { nanoid } from "nanoid";
import { realtimeService, type TypingIndicator } from "@/lib/firebase-realtime";

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
const TYPING_DEBOUNCE_MS = 2000; // Debounce typing indicator updates
const TYPING_TTL_MS = 5000; // Auto-clear typing after 5s of no updates
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
  const typingClearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef(0);
  const typingUnsubscribeRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  // SECURITY FIX: Track current boardId to avoid stale closure in reconnect
  const currentBoardIdRef = useRef(activeBoardId);

  // Scroll position cache for board switching
  const scrollPositionCache = useRef<Map<string, number>>(new Map());

  // Keep boardId ref in sync
  useEffect(() => {
    currentBoardIdRef.current = activeBoardId;
  }, [activeBoardId]);

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

          // SECURITY FIX: Use ref to get current boardId, avoiding stale closure
          // This ensures we reconnect to the board the user is currently viewing,
          // not the board they were on when the original connection was made
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connectSSE(currentBoardIdRef.current);
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
  // Typing Indicators (Real-time via Firebase RTDB)
  // ============================================================

  const setTyping = useCallback(() => {
    if (!spaceId || !activeBoardId || !enableTypingIndicators) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_DEBOUNCE_MS) {
      return; // Debounce
    }

    lastTypingSentRef.current = now;

    // Get current user ID from session storage or auth
    const currentUserId = typeof window !== 'undefined'
      ? sessionStorage.getItem('currentUserId') || localStorage.getItem('currentUserId')
      : null;

    if (!currentUserId) {
      // Fallback to API-based typing if no user ID available
      fetch(`/api/spaces/${spaceId}/chat/typing`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: activeBoardId }),
      }).catch(() => {});
      return;
    }

    // Use Firebase RTDB for real-time typing (no polling!)
    realtimeService.setBoardTypingIndicator(spaceId, activeBoardId, currentUserId, true)
      .catch(() => {
        // Silently fail - typing indicators are non-critical
      });

    // Auto-clear typing after TTL
    if (typingClearTimeoutRef.current) {
      clearTimeout(typingClearTimeoutRef.current);
    }
    typingClearTimeoutRef.current = setTimeout(() => {
      realtimeService.setBoardTypingIndicator(spaceId, activeBoardId, currentUserId, false)
        .catch(() => {});
    }, TYPING_TTL_MS);
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
      if (typingClearTimeoutRef.current) {
        clearTimeout(typingClearTimeoutRef.current);
      }
      if (typingUnsubscribeRef.current) {
        typingUnsubscribeRef.current();
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

  // Real-time typing indicators via Firebase RTDB (no polling!)
  useEffect(() => {
    if (!spaceId || !activeBoardId || !enableTypingIndicators) return;

    // Get current user ID to filter out self
    const currentUserId = typeof window !== 'undefined'
      ? sessionStorage.getItem('currentUserId') || localStorage.getItem('currentUserId')
      : null;

    // Subscribe to real-time typing updates
    const unsubscribe = realtimeService.listenToBoardTyping(
      spaceId,
      activeBoardId,
      (typingData: Record<string, TypingIndicator>) => {
        if (!mountedRef.current) return;

        // Convert RTDB typing data to TypingUser array
        const now = Date.now();
        const users: TypingUser[] = Object.entries(typingData)
          .filter(([userId, data]) => {
            // Filter out current user and expired indicators
            if (userId === currentUserId) return false;
            if (!data.isTyping) return false;
            // Check TTL - only show if updated within last 5s
            const timestamp = typeof data.timestamp === 'number' ? data.timestamp : 0;
            return now - timestamp < TYPING_TTL_MS;
          })
          .map(([userId, data]) => ({
            id: userId,
            name: data.userId || 'Someone', // Will be enriched by UI if needed
            avatarUrl: undefined,
          }));

        setTypingUsers(users);
      }
    );

    typingUnsubscribeRef.current = unsubscribe;

    return () => {
      if (typingUnsubscribeRef.current) {
        typingUnsubscribeRef.current();
        typingUnsubscribeRef.current = null;
      }
      // Clear typing indicator when leaving
      if (currentUserId) {
        realtimeService.setBoardTypingIndicator(spaceId, activeBoardId, currentUserId, false)
          .catch(() => {});
      }
    };
  }, [spaceId, activeBoardId, enableTypingIndicators]);

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

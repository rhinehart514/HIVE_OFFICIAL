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
const TYPING_INDICATOR_INTERVAL_MS = 3000; // Only send typing indicator every 3s while typing
const TYPING_TTL_MS = 5000; // Auto-clear typing after 5s of no activity
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
  // PERFORMANCE FIX: Cache userId to avoid localStorage reads on every keystroke
  const currentUserIdRef = useRef<string | null>(null);
  // FIX: Track in-flight messages to prevent SSE duplicates
  // Maps temp IDs to real IDs when message is being sent
  const inFlightMessagesRef = useRef<Map<string, string | null>>(new Map());
  // P2 FIX: Track intentional disconnects to prevent onerror reconnection
  const intentionalDisconnectRef = useRef(false);

  // Scroll position cache for board switching
  const scrollPositionCache = useRef<Map<string, number>>(new Map());

  // Keep boardId ref in sync
  useEffect(() => {
    currentBoardIdRef.current = activeBoardId;
  }, [activeBoardId]);

  // Initialize cached userId once (avoids localStorage reads on every keystroke)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      currentUserIdRef.current =
        sessionStorage.getItem('currentUserId') ||
        localStorage.getItem('currentUserId') ||
        null;
    }
  }, []);

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

      // P2 FIX: Reset intentional disconnect flag when connecting
      intentionalDisconnectRef.current = false;

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
                // Add new message (avoid duplicates from optimistic updates)
                setMessages((prev) => {
                  const exists = prev.some((m) => m.id === data.data.id);
                  if (exists) return prev;

                  // FIX: Check if this message is in-flight (we sent it optimistically)
                  // If so, the temp message is already in the array - find and replace it
                  for (const [tempId, realId] of inFlightMessagesRef.current.entries()) {
                    if (realId === data.data.id) {
                      // Found it! Replace temp with real and clean up tracking
                      inFlightMessagesRef.current.delete(tempId);
                      return prev.map((m) =>
                        m.id === tempId ? { ...data.data } : m
                      );
                    }
                  }

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
                // Unknown SSE event types are silently ignored in production
                if (process.env.NODE_ENV === 'development') {
                  console.warn("Unknown SSE event type:", data.type);
                }
            }
          } catch {
            // Silently ignore parse errors - malformed messages are dropped
          }
        };

        eventSource.onerror = () => {
          if (!mountedRef.current) return;

          // P2 FIX: Don't reconnect if this was an intentional disconnect
          // (e.g., user switched boards or component unmounted)
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
    // P2 FIX: Mark as intentional disconnect to prevent onerror reconnection
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

  // ============================================================
  // Typing Indicators (Real-time via Firebase RTDB)
  // ============================================================

  const setTyping = useCallback(() => {
    if (!spaceId || !activeBoardId || !enableTypingIndicators) return;

    const now = Date.now();
    const timeSinceLastSent = now - lastTypingSentRef.current;
    const currentUserId = currentUserIdRef.current;

    // Only send typing indicator to Firebase if interval has passed
    // This limits Firebase writes to once per 3 seconds while typing
    // Combined with Firebase layer throttling, this prevents spam effectively
    if (timeSinceLastSent >= TYPING_INDICATOR_INTERVAL_MS) {
      lastTypingSentRef.current = now;

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
    }

    // Always clear and reset the timeout on any keystroke
    // This ensures typing indicator stays active while user is typing
    // and clears properly when they stop
    if (typingClearTimeoutRef.current) {
      clearTimeout(typingClearTimeoutRef.current);
    }

    if (currentUserId) {
      typingClearTimeoutRef.current = setTimeout(() => {
        // Clear typing indicator after TTL of no activity
        realtimeService.setBoardTypingIndicator(spaceId, activeBoardId, currentUserId, false)
          .catch(() => {});
        typingClearTimeoutRef.current = null;
        // Note: Don't reset lastTypingSentRef here - let the 3s interval handle it
        // This prevents the race condition where clearing + immediate keystroke = double write
      }, TYPING_TTL_MS);
    }
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

      // FIX: Track this message as in-flight (null = waiting for real ID)
      inFlightMessagesRef.current.set(tempId, null);
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

        // FIX: Update tracking with real ID so SSE handler can find it
        inFlightMessagesRef.current.set(tempId, data.messageId);

        // Update temporary message with real ID
        // SSE might have already replaced this, so check first
        setMessages((prev) => {
          // Check if SSE already replaced it
          const hasRealId = prev.some((m) => m.id === data.messageId);
          if (hasRealId) {
            // SSE beat us - remove the temp message and clean up
            inFlightMessagesRef.current.delete(tempId);
            return prev.filter((m) => m.id !== tempId);
          }
          // We beat SSE - update temp to real
          return prev.map((m) =>
            m.id === tempId
              ? { ...m, id: data.messageId, timestamp: data.timestamp }
              : m
          );
        });

        // Clean up tracking after a delay (in case SSE is slow)
        setTimeout(() => {
          inFlightMessagesRef.current.delete(tempId);
        }, 5000);
      } catch (err) {
        console.error("Error sending message:", err);
        // FIX: Clean up in-flight tracking on error
        inFlightMessagesRef.current.delete(tempId);
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

      // Find original message for potential rollback
      const originalMessage = messages.find((m) => m.id === messageId);
      if (!originalMessage) return;

      // P1 FIX: Optimistic update for instant feedback
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = m.reactions || [];
          const existingReaction = reactions.find((r) => r.emoji === emoji);

          if (existingReaction) {
            // Toggle: if user already reacted, remove; otherwise add
            if (existingReaction.hasReacted) {
              // Remove user's reaction
              return {
                ...m,
                reactions: reactions.map((r) =>
                  r.emoji === emoji
                    ? { ...r, count: Math.max(0, r.count - 1), hasReacted: false }
                    : r
                ).filter((r) => r.count > 0), // Remove if count is 0
              };
            } else {
              // Add user's reaction
              return {
                ...m,
                reactions: reactions.map((r) =>
                  r.emoji === emoji
                    ? { ...r, count: r.count + 1, hasReacted: true }
                    : r
                ),
              };
            }
          }
          // New reaction
          return {
            ...m,
            reactions: [...reactions, { emoji, count: 1, hasReacted: true }],
          };
        })
      );

      try {
        const response = await fetch(`/api/spaces/${spaceId}/chat/${messageId}/react`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji, boardId: activeBoardId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update reaction: ${response.status}`);
        }
        // SSE will sync the actual counts from server
      } catch (err) {
        console.error("Error adding reaction:", err);
        // Rollback on error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...originalMessage } : m
          )
        );
      }
    },
    [spaceId, activeBoardId, messages]
  );

  const pinMessage = useCallback(
    async (messageId: string) => {
      if (!spaceId || !messageId) return;

      // Find original message for potential rollback
      const originalMessage = messages.find((m) => m.id === messageId);
      if (!originalMessage) return;

      // P1 FIX: Optimistic update for instant feedback
      const newPinnedState = !originalMessage.isPinned;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isPinned: newPinnedState } : m
        )
      );

      // Optimistically update pinned messages list
      if (newPinnedState) {
        setPinnedMessages((prev) => [...prev, { ...originalMessage, isPinned: true }]);
      } else {
        setPinnedMessages((prev) => prev.filter((m) => m.id !== messageId));
      }

      try {
        const response = await fetch(`/api/spaces/${spaceId}/chat/${messageId}/pin`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boardId: activeBoardId }),
        });

        if (!response.ok) {
          throw new Error(`Failed to pin/unpin: ${response.status}`);
        }
        // SSE will sync the actual state from server
      } catch (err) {
        console.error("Error pinning message:", err);
        // Rollback on error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...originalMessage } : m
          )
        );
        // Rollback pinned list
        await fetchPinnedMessages(activeBoardId);
      }
    },
    [spaceId, activeBoardId, messages, fetchPinnedMessages]
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
  // NOTE: Only primitive values in deps to prevent infinite loops
  // Functions are stable due to useCallback and are called directly
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId, activeBoardId, enableRealtime]);

  // Real-time typing indicators via Firebase RTDB (no polling!)
  useEffect(() => {
    if (!spaceId || !activeBoardId || !enableTypingIndicators) return;

    // PERFORMANCE FIX: Use cached userId from ref (avoids localStorage reads)
    const currentUserId = currentUserIdRef.current;

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

  // Periodic cleanup of stale typing indicators (every 30s)
  // This prevents RTDB bloat from crashed clients that didn't clear their typing state
  useEffect(() => {
    if (!spaceId || !activeBoardId || !enableTypingIndicators) return;

    // Run cleanup immediately on mount
    realtimeService.cleanupStaleTypingIndicators(spaceId, activeBoardId)
      .catch(() => {}); // Silently fail - cleanup is non-critical

    // Schedule periodic cleanup every 30 seconds
    const cleanupInterval = setInterval(() => {
      if (!mountedRef.current) return;
      realtimeService.cleanupStaleTypingIndicators(spaceId, activeBoardId)
        .catch(() => {});
    }, 30000);

    return () => {
      clearInterval(cleanupInterval);
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

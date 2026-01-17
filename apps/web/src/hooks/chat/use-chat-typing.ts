"use client";

/**
 * Chat Typing Hook
 *
 * Manages typing indicators using Firebase Realtime Database.
 * Handles throttling, TTL cleanup, and real-time subscription.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  realtimeService,
  type TypingIndicator,
} from "@/lib/firebase-realtime";
import type { TypingUser } from "./types";
import {
  TYPING_INDICATOR_INTERVAL_MS,
  TYPING_TTL_MS,
  TYPING_CLEANUP_INTERVAL_MS,
} from "./constants";

export interface UseChatTypingOptions {
  spaceId: string;
  boardId: string;
  enabled: boolean;
}

export interface UseChatTypingReturn {
  typingUsers: TypingUser[];
  setTyping: () => void;
  clearTyping: () => void;
}

export function useChatTyping(
  options: UseChatTypingOptions
): UseChatTypingReturn {
  const { spaceId, boardId, enabled } = options;

  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  // Refs for throttling and cleanup
  const typingClearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef(0);
  const typingUnsubscribeRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const currentUserIdRef = useRef<string | null>(null);

  // Initialize cached userId once
  useEffect(() => {
    if (typeof window !== "undefined") {
      currentUserIdRef.current =
        sessionStorage.getItem("currentUserId") ||
        localStorage.getItem("currentUserId") ||
        null;
    }
  }, []);

  const clearTyping = useCallback(() => {
    const currentUserId = currentUserIdRef.current;
    if (!spaceId || !boardId || !currentUserId) return;

    realtimeService
      .setBoardTypingIndicator(spaceId, boardId, currentUserId, false)
      .catch(() => {});

    if (typingClearTimeoutRef.current) {
      clearTimeout(typingClearTimeoutRef.current);
      typingClearTimeoutRef.current = null;
    }
  }, [spaceId, boardId]);

  const setTyping = useCallback(() => {
    if (!spaceId || !boardId || !enabled) return;

    const now = Date.now();
    const timeSinceLastSent = now - lastTypingSentRef.current;
    const currentUserId = currentUserIdRef.current;

    // Only send typing indicator if interval has passed
    if (timeSinceLastSent >= TYPING_INDICATOR_INTERVAL_MS) {
      lastTypingSentRef.current = now;

      if (!currentUserId) {
        // Fallback to API-based typing if no user ID available
        fetch(`/api/spaces/${spaceId}/chat/typing`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boardId }),
        }).catch(() => {});
        return;
      }

      // Use Firebase RTDB for real-time typing
      realtimeService
        .setBoardTypingIndicator(spaceId, boardId, currentUserId, true)
        .catch(() => {});
    }

    // Reset clear timeout on any keystroke
    if (typingClearTimeoutRef.current) {
      clearTimeout(typingClearTimeoutRef.current);
    }

    if (currentUserId) {
      typingClearTimeoutRef.current = setTimeout(() => {
        realtimeService
          .setBoardTypingIndicator(spaceId, boardId, currentUserId, false)
          .catch(() => {});
        typingClearTimeoutRef.current = null;
      }, TYPING_TTL_MS);
    }
  }, [spaceId, boardId, enabled]);

  // Subscribe to real-time typing updates
  useEffect(() => {
    if (!spaceId || !boardId || !enabled) return;

    const currentUserId = currentUserIdRef.current;

    const unsubscribe = realtimeService.listenToBoardTyping(
      spaceId,
      boardId,
      (typingData: Record<string, TypingIndicator>) => {
        if (!mountedRef.current) return;

        const now = Date.now();
        const users: TypingUser[] = Object.entries(typingData)
          .filter(([userId, data]) => {
            if (userId === currentUserId) return false;
            if (!data.isTyping) return false;
            const timestamp =
              typeof data.timestamp === "number" ? data.timestamp : 0;
            return now - timestamp < TYPING_TTL_MS;
          })
          .map(([userId, data]) => ({
            id: userId,
            name: data.userId || "Someone",
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
        realtimeService
          .setBoardTypingIndicator(spaceId, boardId, currentUserId, false)
          .catch(() => {});
      }
    };
  }, [spaceId, boardId, enabled]);

  // Periodic cleanup of stale typing indicators
  useEffect(() => {
    if (!spaceId || !boardId || !enabled) return;

    // Run cleanup immediately on mount
    realtimeService
      .cleanupStaleTypingIndicators(spaceId, boardId)
      .catch(() => {});

    const cleanupInterval = setInterval(() => {
      if (!mountedRef.current) return;
      realtimeService
        .cleanupStaleTypingIndicators(spaceId, boardId)
        .catch(() => {});
    }, TYPING_CLEANUP_INTERVAL_MS);

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [spaceId, boardId, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (typingClearTimeoutRef.current) {
        clearTimeout(typingClearTimeoutRef.current);
      }
      if (typingUnsubscribeRef.current) {
        typingUnsubscribeRef.current();
      }
    };
  }, []);

  return {
    typingUsers,
    setTyping,
    clearTyping,
  };
}

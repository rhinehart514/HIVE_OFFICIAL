"use client";

/**
 * Chat Mutations Hook
 *
 * Handles all message CRUD operations with optimistic updates.
 * Includes send, edit, delete, reactions, and pinning.
 */

import { useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import type { ChatMessageData } from "./types";
import { IN_FLIGHT_CLEANUP_DELAY_MS } from "./constants";
import { logger } from "@/lib/logger";

export interface UseChatMutationsOptions {
  spaceId: string;
  boardId: string;
  messages: ChatMessageData[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageData[]>>;
  setPinnedMessages: React.Dispatch<React.SetStateAction<ChatMessageData[]>>;
  fetchPinnedMessages: (boardId: string) => Promise<void>;
}

export interface UseChatMutationsReturn {
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  trackInFlightMessage: (tempId: string, realId: string | null) => void;
  getInFlightRealId: (tempId: string) => string | null | undefined;
  clearInFlightMessage: (tempId: string) => void;
  findInFlightTempId: (realId: string) => string | undefined;
}

export function useChatMutations(
  options: UseChatMutationsOptions
): UseChatMutationsReturn {
  const {
    spaceId,
    boardId,
    messages,
    setMessages,
    setPinnedMessages,
    fetchPinnedMessages,
  } = options;

  // Track in-flight messages to prevent SSE duplicates
  const inFlightMessagesRef = useRef<Map<string, string | null>>(new Map());

  const trackInFlightMessage = useCallback(
    (tempId: string, realId: string | null) => {
      inFlightMessagesRef.current.set(tempId, realId);
    },
    []
  );

  const getInFlightRealId = useCallback((tempId: string) => {
    return inFlightMessagesRef.current.get(tempId);
  }, []);

  const clearInFlightMessage = useCallback((tempId: string) => {
    inFlightMessagesRef.current.delete(tempId);
  }, []);

  const findInFlightTempId = useCallback((realId: string): string | undefined => {
    for (const [tempId, mappedRealId] of inFlightMessagesRef.current.entries()) {
      if (mappedRealId === realId) {
        return tempId;
      }
    }
    return undefined;
  }, []);

  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!spaceId || !content.trim()) return;

      const tempId = `temp_${nanoid()}`;
      const optimisticMessage: ChatMessageData = {
        id: tempId,
        boardId,
        type: "text",
        authorId: "current_user",
        authorName: "You",
        content: content.trim(),
        timestamp: Date.now(),
        reactions: [],
        replyToId,
      };

      inFlightMessagesRef.current.set(tempId, null);
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const response = await fetch(`/api/spaces/${spaceId}/chat`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId,
            content: content.trim(),
            replyToId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed: ${response.status}`);
        }

        const data = await response.json();

        inFlightMessagesRef.current.set(tempId, data.messageId);

        setMessages((prev) => {
          const hasRealId = prev.some((m) => m.id === data.messageId);
          if (hasRealId) {
            inFlightMessagesRef.current.delete(tempId);
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) =>
            m.id === tempId
              ? { ...m, id: data.messageId, timestamp: data.timestamp }
              : m
          );
        });

        setTimeout(() => {
          inFlightMessagesRef.current.delete(tempId);
        }, IN_FLIGHT_CLEANUP_DELAY_MS);
      } catch (err) {
        logger.error("Error sending message", { error: err, component: "useChatMutations" });
        inFlightMessagesRef.current.delete(tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        throw err;
      }
    },
    [spaceId, boardId, setMessages]
  );

  const editMessage = useCallback(
    async (messageId: string, content: string): Promise<boolean> => {
      if (!spaceId || !messageId || !content.trim()) return false;

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
        logger.error("Error editing message", { error: err, component: "useChatMutations" });
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? originalMessage : m))
        );
        return false;
      }
    },
    [spaceId, messages, setMessages]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!spaceId || !messageId) return;

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
        logger.error("Error deleting message", { error: err, component: "useChatMutations" });
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isDeleted: false } : m))
        );
      }
    },
    [spaceId, setMessages]
  );

  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!spaceId || !messageId || !emoji) return;

      const originalMessage = messages.find((m) => m.id === messageId);
      if (!originalMessage) return;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = m.reactions || [];
          const existingReaction = reactions.find((r) => r.emoji === emoji);

          if (existingReaction) {
            if (existingReaction.hasReacted) {
              return {
                ...m,
                reactions: reactions
                  .map((r) =>
                    r.emoji === emoji
                      ? {
                          ...r,
                          count: Math.max(0, r.count - 1),
                          hasReacted: false,
                        }
                      : r
                  )
                  .filter((r) => r.count > 0),
              };
            } else {
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
          return {
            ...m,
            reactions: [...reactions, { emoji, count: 1, hasReacted: true }],
          };
        })
      );

      try {
        const response = await fetch(
          `/api/spaces/${spaceId}/chat/${messageId}/react`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emoji, boardId }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update reaction: ${response.status}`);
        }
      } catch (err) {
        logger.error("Error adding reaction", { error: err, component: "useChatMutations" });
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...originalMessage } : m))
        );
      }
    },
    [spaceId, boardId, messages, setMessages]
  );

  const pinMessage = useCallback(
    async (messageId: string) => {
      if (!spaceId || !messageId) return;

      const originalMessage = messages.find((m) => m.id === messageId);
      if (!originalMessage) return;

      const newPinnedState = !originalMessage.isPinned;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isPinned: newPinnedState } : m
        )
      );

      if (newPinnedState) {
        setPinnedMessages((prev) => [
          ...prev,
          { ...originalMessage, isPinned: true },
        ]);
      } else {
        setPinnedMessages((prev) => prev.filter((m) => m.id !== messageId));
      }

      try {
        const response = await fetch(
          `/api/spaces/${spaceId}/chat/${messageId}/pin`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ boardId }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to pin/unpin: ${response.status}`);
        }
      } catch (err) {
        logger.error("Error pinning message", { error: err, component: "useChatMutations" });
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...originalMessage } : m))
        );
        await fetchPinnedMessages(boardId);
      }
    },
    [
      spaceId,
      boardId,
      messages,
      setMessages,
      setPinnedMessages,
      fetchPinnedMessages,
    ]
  );

  return {
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    pinMessage,
    trackInFlightMessage,
    getInFlightRealId,
    clearInFlightMessage,
    findInFlightTempId,
  };
}

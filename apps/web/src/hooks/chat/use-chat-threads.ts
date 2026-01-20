"use client";

/**
 * Chat Threads Hook
 *
 * Manages thread state, replies, and thread operations.
 */

import { useCallback, useRef, useState } from "react";
import { nanoid } from "nanoid";
import type { ChatMessageData, ThreadData } from "./types";

export interface UseChatThreadsOptions {
  spaceId: string;
  boardId: string;
  messages: ChatMessageData[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageData[]>>;
}

export interface UseChatThreadsReturn {
  thread: ThreadData;
  openThread: (messageId: string) => Promise<void>;
  closeThread: () => void;
  sendThreadReply: (content: string) => Promise<void>;
  loadMoreReplies: () => Promise<void>;
}

const INITIAL_THREAD_STATE: ThreadData = {
  isOpen: false,
  parentMessage: null,
  replies: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,
};

export function useChatThreads(
  options: UseChatThreadsOptions
): UseChatThreadsReturn {
  const { spaceId, boardId, messages, setMessages } = options;

  const [thread, setThread] = useState<ThreadData>(INITIAL_THREAD_STATE);
  const mountedRef = useRef(true);

  const openThread = useCallback(
    async (messageId: string) => {
      if (!spaceId || !messageId) return;

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
          `/api/spaces/${spaceId}/chat/${messageId}/replies?boardId=${boardId}&limit=50`,
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
      } catch {
        if (mountedRef.current) {
          setThread((prev) => ({ ...prev, isLoading: false }));
        }
      }
    },
    [spaceId, messages]
  );

  const closeThread = useCallback(() => {
    setThread(INITIAL_THREAD_STATE);
  }, []);

  const sendThreadReply = useCallback(
    async (content: string) => {
      if (!spaceId || !thread?.parentMessage?.id || !content.trim()) return;

      const tempId = `temp-${nanoid()}`;
      const now = Date.now();

      const optimisticReply: ChatMessageData = {
        id: tempId,
        boardId,
        type: "text",
        authorId: "current-user",
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

        if (mountedRef.current) {
          setThread((prev) => ({
            ...prev,
            replies: prev.replies.map((r) =>
              r.id === tempId ? data.message : r
            ),
          }));

          setMessages((prev) =>
            prev.map((m) =>
              m.id === thread.parentMessage?.id
                ? { ...m, threadCount: (m.threadCount || 0) + 1 }
                : m
            )
          );
        }
      } catch {
        if (mountedRef.current) {
          setThread((prev) => ({
            ...prev,
            replies: prev.replies.filter((r) => r.id !== tempId),
          }));
        }
      }
    },
    [spaceId, thread?.parentMessage?.id, boardId, setMessages]
  );

  const loadMoreReplies = useCallback(async () => {
    if (
      !spaceId ||
      !thread?.parentMessage?.id ||
      thread.isLoadingMore ||
      !thread.hasMore
    )
      return;

    const lastReply = thread.replies[thread.replies.length - 1];
    if (!lastReply) return;

    setThread((prev) => ({ ...prev, isLoadingMore: true }));

    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/chat/${thread.parentMessage.id}/replies?boardId=${boardId}&before=${lastReply.timestamp}&limit=50`,
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
    } catch {
      if (mountedRef.current) {
        setThread((prev) => ({ ...prev, isLoadingMore: false }));
      }
    }
  }, [
    spaceId,
    thread?.parentMessage?.id,
    thread?.isLoadingMore,
    thread?.hasMore,
    thread?.replies,
  ]);

  return {
    thread,
    openThread,
    closeThread,
    sendThreadReply,
    loadMoreReplies,
  };
}

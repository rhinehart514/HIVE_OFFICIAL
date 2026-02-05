"use client";

/**
 * React Query hooks for space chat messages
 *
 * Provides caching, infinite scroll, and optimistic updates for chat.
 */

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchSpaceChat,
  sendChatMessage,
  type ChatMessagesResponse,
  type ChatMessageDTO,
} from "@/lib/fetchers";

const DEFAULT_PAGE_SIZE = 30;

// ============================================================
// Chat Messages Query (Infinite Scroll)
// ============================================================

interface UseSpaceChatOptions {
  enabled?: boolean;
  pageSize?: number;
  refetchInterval?: number;
}

/**
 * Infinite scroll for chat messages
 *
 * Messages are ordered newest-first (for reverse infinite scroll).
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSpaceChatInfinite(spaceId, boardId);
 */
export function useSpaceChatInfinite(
  spaceId: string,
  boardId: string,
  options?: UseSpaceChatOptions
) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery<ChatMessagesResponse>({
    queryKey: queryKeys.spaces.chat(spaceId, boardId),
    queryFn: async ({ pageParam }) => {
      const result = await fetchSpaceChat(spaceId, boardId, {
        limit: pageSize,
        cursor: pageParam as string | undefined,
      });
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.cursor : undefined;
    },
    enabled: Boolean(spaceId) && Boolean(boardId) && options?.enabled !== false,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Single page of chat messages (for simple use cases)
 */
export function useSpaceChat(
  spaceId: string,
  boardId: string,
  options?: { limit?: number; enabled?: boolean }
) {
  return useQuery<ChatMessagesResponse>({
    queryKey: queryKeys.spaces.chat(spaceId, boardId),
    queryFn: () => fetchSpaceChat(spaceId, boardId, { limit: options?.limit ?? DEFAULT_PAGE_SIZE }),
    enabled: Boolean(spaceId) && Boolean(boardId) && options?.enabled !== false,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================
// Send Message Mutation
// ============================================================

interface SendMessageParams {
  content: string;
  attachments?: ChatMessageDTO['attachments'];
}

/**
 * Send a chat message with optimistic update
 *
 * @example
 * const { mutate: send, isPending } = useSendMessage(spaceId, boardId);
 * send({ content: 'Hello!' });
 */
export function useSendMessage(spaceId: string, boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SendMessageParams) =>
      sendChatMessage(spaceId, boardId, params.content, params.attachments),
    onMutate: async (params) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: queryKeys.spaces.chat(spaceId, boardId) });

      // Get current data
      const previousData = queryClient.getQueryData<InfiniteData<ChatMessagesResponse>>(
        queryKeys.spaces.chat(spaceId, boardId)
      );

      // Create optimistic message (will be replaced by server response)
      const optimisticMessage: ChatMessageDTO = {
        id: `optimistic-${Date.now()}`,
        boardId,
        authorId: 'current-user', // Will be replaced
        authorName: 'You',
        content: params.content,
        timestamp: Date.now(),
        attachments: params.attachments,
      };

      // Optimistically add message to the first page
      if (previousData) {
        const newPages = [...previousData.pages];
        if (newPages[0]) {
          newPages[0] = {
            ...newPages[0],
            messages: [optimisticMessage, ...newPages[0].messages],
          };
        }

        queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
          queryKeys.spaces.chat(spaceId, boardId),
          {
            ...previousData,
            pages: newPages,
          }
        );
      }

      return { previousData };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.spaces.chat(spaceId, boardId),
          context.previousData
        );
      }
    },
    onSuccess: (newMessage) => {
      // Replace optimistic message with real one
      const currentData = queryClient.getQueryData<InfiniteData<ChatMessagesResponse>>(
        queryKeys.spaces.chat(spaceId, boardId)
      );

      if (currentData) {
        const newPages = currentData.pages.map((page, pageIndex) => {
          if (pageIndex === 0) {
            // Replace optimistic message in first page
            return {
              ...page,
              messages: page.messages.map(msg =>
                msg.id.startsWith('optimistic-') ? newMessage : msg
              ),
            };
          }
          return page;
        });

        queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
          queryKeys.spaces.chat(spaceId, boardId),
          {
            ...currentData,
            pages: newPages,
          }
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.spaces.chat(spaceId, boardId),
      });
    },
  });
}

// ============================================================
// Delete Message Mutation
// ============================================================

/**
 * Delete a chat message
 */
export function useDeleteMessage(spaceId: string, boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`/api/spaces/${spaceId}/chat/${messageId}?boardId=${boardId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to delete message');
      }

      return res.json();
    },
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.spaces.chat(spaceId, boardId) });

      const previousData = queryClient.getQueryData<InfiniteData<ChatMessagesResponse>>(
        queryKeys.spaces.chat(spaceId, boardId)
      );

      // Optimistically remove the message
      if (previousData) {
        const newPages = previousData.pages.map(page => ({
          ...page,
          messages: page.messages.filter(msg => msg.id !== messageId),
        }));

        queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
          queryKeys.spaces.chat(spaceId, boardId),
          {
            ...previousData,
            pages: newPages,
          }
        );
      }

      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.spaces.chat(spaceId, boardId),
          context.previousData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.chat(spaceId, boardId) });
    },
  });
}

// ============================================================
// React to Message Mutation
// ============================================================

/**
 * Add/toggle reaction on a message
 */
export function useReactToMessage(spaceId: string, boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const res = await fetch(`/api/spaces/${spaceId}/chat/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emoji }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to react');
      }

      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.chat(spaceId, boardId) });
    },
  });
}

// ============================================================
// Last Read At Query
// ============================================================

/**
 * Get/set last read timestamp for unread indicators
 */
export function useLastReadAt(spaceId: string, boardId: string) {
  return useQuery<number | null>({
    queryKey: [...queryKeys.spaces.chat(spaceId, boardId), 'lastReadAt'],
    queryFn: async () => {
      // Try to get from localStorage first
      const key = `lastRead:${spaceId}:${boardId}`;
      const stored = localStorage.getItem(key);
      return stored ? parseInt(stored, 10) : null;
    },
    staleTime: Infinity, // Only read once
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: Boolean(spaceId) && Boolean(boardId),
  });
}

/**
 * Mark messages as read (update last read timestamp)
 */
export function useMarkAsRead(spaceId: string, boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const now = Date.now();
      const key = `lastRead:${spaceId}:${boardId}`;
      localStorage.setItem(key, String(now));

      // Also notify the server (fire and forget)
      fetch(`/api/spaces/${spaceId}/chat/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ boardId, timestamp: now }),
      }).catch(() => {
        // Ignore errors for read receipts
      });

      return now;
    },
    onSuccess: (timestamp) => {
      queryClient.setQueryData(
        [...queryKeys.spaces.chat(spaceId, boardId), 'lastReadAt'],
        timestamp
      );
    },
  });
}

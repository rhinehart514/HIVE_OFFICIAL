"use client";

/**
 * React Query hook for fetching pinned messages
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchPinnedMessages,
  type PinnedMessageDTO,
} from "@/lib/fetchers/space-fetchers";

interface UsePinnedMessagesQueryOptions
  extends Omit<UseQueryOptions<PinnedMessageDTO[], Error>, "queryKey" | "queryFn"> {
  enabled?: boolean;
}

/**
 * Fetch pinned messages for a board with React Query caching
 *
 * @example
 * const { data: pinnedMessages } = usePinnedMessagesQuery('space-123', 'board-456');
 */
export function usePinnedMessagesQuery(
  spaceId: string,
  boardId: string,
  options?: UsePinnedMessagesQueryOptions
) {
  return useQuery({
    queryKey: queryKeys.spaces.pinnedMessages(spaceId, boardId),
    queryFn: () => fetchPinnedMessages(spaceId, boardId),
    enabled: Boolean(spaceId) && Boolean(boardId) && options?.enabled !== false,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    ...options,
  });
}

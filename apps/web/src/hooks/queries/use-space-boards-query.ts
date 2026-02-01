"use client";

/**
 * React Query hooks for space boards (tabs)
 *
 * Provides caching and optimistic updates for board management.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchSpaceBoards,
  type SpaceBoardsResponse,
  type SpaceBoardDTO,
} from "@/lib/fetchers";

interface UseSpaceBoardsOptions {
  enabled?: boolean;
}

/**
 * Fetch all boards for a space
 *
 * @example
 * const { data, isLoading } = useSpaceBoards('space-123');
 * const boards = data?.boards ?? [];
 */
export function useSpaceBoards(spaceId: string, options?: UseSpaceBoardsOptions) {
  return useQuery<SpaceBoardsResponse>({
    queryKey: queryKeys.spaces.boards(spaceId),
    queryFn: () => fetchSpaceBoards(spaceId),
    enabled: Boolean(spaceId) && options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Create a new board in a space
 */
export function useCreateBoard(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const res = await fetch(`/api/spaces/${spaceId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to create board');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.boards(spaceId) });
    },
  });
}

/**
 * Delete a board from a space
 */
export function useDeleteBoard(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: string) => {
      const res = await fetch(`/api/spaces/${spaceId}/boards/${boardId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to delete board');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.boards(spaceId) });
    },
  });
}

/**
 * Reorder boards in a space
 */
export function useReorderBoards(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardIds: string[]) => {
      const res = await fetch(`/api/spaces/${spaceId}/boards/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ boardIds }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to reorder boards');
      }

      return res.json();
    },
    onMutate: async (boardIds) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.spaces.boards(spaceId) });
      const previous = queryClient.getQueryData<SpaceBoardsResponse>(queryKeys.spaces.boards(spaceId));

      if (previous) {
        const reorderedBoards = boardIds
          .map((id, index) => {
            const board = previous.boards.find(b => b.id === id);
            return board ? { ...board, order: index } : null;
          })
          .filter((b): b is SpaceBoardDTO => b !== null);

        queryClient.setQueryData<SpaceBoardsResponse>(queryKeys.spaces.boards(spaceId), {
          ...previous,
          boards: reorderedBoards,
        });
      }

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.spaces.boards(spaceId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.boards(spaceId) });
    },
  });
}

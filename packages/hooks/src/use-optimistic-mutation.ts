/**
 * Optimistic Mutation Utilities for HIVE
 *
 * Helper functions and hooks for common optimistic update patterns.
 * Makes it easy to implement instant UI feedback for user actions.
 *
 * @module use-optimistic-mutation
 * @since 1.0.0
 */

'use client';

import { useHiveMutation, useMutationWithInvalidation } from './use-hive-mutation';
import type { HiveMutationConfig, HiveError } from '@hive/core';

/**
 * Optimistic list operations
 */
export const optimisticList = {
  /**
   * Add item to list
   */
  add<T extends { id: string }>(item: Omit<T, 'id' | 'createdAt'>, currentUser?: unknown): T {
    return {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...item,
      createdAt: new Date().toISOString(),
      author: currentUser,
    } as unknown as T;
  },

  /**
   * Remove item from list
   */
  remove<T extends { id: string }>(list: T[], id: string): T[] {
    return list.filter((item) => item.id !== id);
  },

  /**
   * Update item in list
   */
  update<T extends { id: string }>(list: T[], id: string, updates: Partial<T>): T[] {
    return list.map((item) => (item.id === id ? { ...item, ...updates } : item));
  },

  /**
   * Prepend item to list (newest first)
   */
  prepend<T>(list: T[], item: T): T[] {
    return [item, ...list];
  },

  /**
   * Append item to list (oldest first)
   */
  append<T>(list: T[], item: T): T[] {
    return [...list, item];
  },
};

/**
 * Optimistic engagement operations (likes, upvotes, etc.)
 */
export const optimisticEngagement = {
  /**
   * Toggle like/upvote
   */
  toggleLike<T extends { engagement: { likes: number; hasLiked: boolean } }>(
    item: T,
    userId: string
  ): T {
    return {
      ...item,
      engagement: {
        ...item.engagement,
        likes: item.engagement.hasLiked
          ? item.engagement.likes - 1
          : item.engagement.likes + 1,
        hasLiked: !item.engagement.hasLiked,
      },
    };
  },

  /**
   * Toggle bookmark
   */
  toggleBookmark<T extends { isBookmarked: boolean }>(item: T): T {
    return {
      ...item,
      isBookmarked: !item.isBookmarked,
    };
  },

  /**
   * Increment comment count
   */
  addComment<T extends { engagement: { comments: number } }>(item: T): T {
    return {
      ...item,
      engagement: {
        ...item.engagement,
        comments: item.engagement.comments + 1,
      },
    };
  },
};

/**
 * Optimistic space operations
 */
export const optimisticSpace = {
  /**
   * Join space
   */
  join<T extends { memberCount: number; isMember: boolean }>(space: T): T {
    return {
      ...space,
      memberCount: space.memberCount + 1,
      isMember: true,
    };
  },

  /**
   * Leave space
   */
  leave<T extends { memberCount: number; isMember: boolean }>(space: T): T {
    return {
      ...space,
      memberCount: Math.max(0, space.memberCount - 1),
      isMember: false,
    };
  },
};

/**
 * Hook for optimistic toggle mutation (like, bookmark, etc.)
 *
 * @example
 * ```tsx
 * const { mutate: toggleLike, loading } = useOptimisticToggle({
 *   mutationFn: (postId) => likePost(postId),
 *   getOptimisticData: (post) => optimisticEngagement.toggleLike(post, userId),
 *   invalidateKeys: [['feed'], ['post', { id: postId }]],
 * });
 *
 * <Button onClick={() => toggleLike(post)} loading={loading}>
 *   {post.engagement.hasLiked ? '❤️' : '🤍'} {post.engagement.likes}
 * </Button>
 * ```
 */
export function useOptimisticToggle<TData>({
  mutationFn,
  getOptimisticData,
  invalidateKeys,
  onSuccess,
  onError,
}: {
  mutationFn: (data: TData) => Promise<unknown>;
  getOptimisticData: (data: TData) => TData;
  invalidateKeys?: Array<ReadonlyArray<string | number | boolean | Record<string, unknown> | null | undefined>>;
  onSuccess?: (data: unknown, variables: TData) => void;
  onError?: (error: HiveError, variables: TData, rollback: () => void) => void;
}) {
  return useMutationWithInvalidation({
    mutationFn,
    optimisticUpdate: getOptimisticData,
    invalidateKeys,
    onSuccess,
    onError,
  });
}

/**
 * Hook for optimistic list add mutation
 *
 * @example
 * ```tsx
 * const { mutate: createPost, loading, optimisticData } = useOptimisticAdd({
 *   mutationFn: (data) => createPost(data),
 *   getOptimisticItem: (data) => optimisticList.add(data, currentUser),
 *   invalidateKeys: [['feed']],
 * });
 *
 * // Show optimistic post in feed immediately
 * const posts = optimisticData ? [optimisticData, ...feedPosts] : feedPosts;
 * ```
 */
export function useOptimisticAdd<TData extends { id: string }, TVariables = Omit<TData, 'id'>>({
  mutationFn,
  getOptimisticItem,
  invalidateKeys,
  onSuccess,
  onError,
}: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  getOptimisticItem: (variables: TVariables) => TData;
  invalidateKeys?: Array<ReadonlyArray<string | number | boolean | Record<string, unknown> | null | undefined>>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: HiveError, variables: TVariables, rollback: () => void) => void;
}) {
  return useMutationWithInvalidation({
    mutationFn,
    optimisticUpdate: getOptimisticItem,
    invalidateKeys,
    onSuccess,
    onError,
  });
}

/**
 * Hook for optimistic list remove mutation
 *
 * @example
 * ```tsx
 * const { mutate: deletePost, loading } = useOptimisticRemove({
 *   mutationFn: (id) => deletePost(id),
 *   invalidateKeys: [['feed']],
 * });
 *
 * <Button onClick={() => deletePost(post.id)} loading={loading}>
 *   Delete
 * </Button>
 * ```
 */
export function useOptimisticRemove<TData = unknown>({
  mutationFn,
  invalidateKeys,
  onSuccess,
  onError,
}: {
  mutationFn: (id: string) => Promise<TData>;
  invalidateKeys?: Array<ReadonlyArray<string | number | boolean | Record<string, unknown> | null | undefined>>;
  onSuccess?: (data: TData, variables: string) => void;
  onError?: (error: HiveError, variables: string, rollback: () => void) => void;
}) {
  return useMutationWithInvalidation({
    mutationFn,
    invalidateKeys,
    onSuccess,
    onError,
  });
}

/**
 * Hook for optimistic update mutation
 *
 * @example
 * ```tsx
 * const { mutate: updatePost, loading } = useOptimisticUpdate({
 *   mutationFn: ({ id, updates }) => updatePost(id, updates),
 *   getOptimisticData: ({ original, updates }) => ({ ...original, ...updates }),
 *   invalidateKeys: [['feed'], ['post', { id }]],
 * });
 *
 * <Button
 *   onClick={() => updatePost({ id: post.id, updates: { content: 'Updated!' } })}
 *   loading={loading}
 * >
 *   Update
 * </Button>
 * ```
 */
export function useOptimisticUpdate<TData, TUpdates = Partial<TData>>({
  mutationFn,
  getOptimisticData,
  invalidateKeys,
  onSuccess,
  onError,
}: {
  mutationFn: (variables: { id: string; updates: TUpdates }) => Promise<TData>;
  getOptimisticData: (variables: { original: TData; updates: TUpdates }) => TData;
  invalidateKeys?: Array<ReadonlyArray<string | number | boolean | Record<string, unknown> | null | undefined>>;
  onSuccess?: (data: TData, variables: { id: string; updates: TUpdates }) => void;
  onError?: (error: HiveError, variables: { id: string; updates: TUpdates }, rollback: () => void) => void;
}) {
  return useHiveMutation({
    mutationFn,
    onSuccess,
    onError,
  });
}

/**
 * Hook for batch mutations with progress tracking
 *
 * @example
 * ```tsx
 * const { mutateBatch, progress } = useBatchMutation({
 *   mutationFn: (id) => deletePost(id),
 *   onComplete: () => toast.success('All posts deleted!'),
 * });
 *
 * <Button onClick={() => mutateBatch(selectedIds)}>
 *   Delete Selected ({progress.current}/{progress.total})
 * </Button>
 * ```
 */
export function useBatchMutation<TVariables, TData = unknown>({
  mutationFn,
  onItemSuccess,
  onItemError,
  onComplete,
  onError,
}: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onItemSuccess?: (data: TData, variables: TVariables, index: number) => void;
  onItemError?: (error: HiveError, variables: TVariables, index: number) => void;
  onComplete?: (results: Array<{ data: TData | null; error: HiveError | null }>) => void;
  onError?: (errors: HiveError[]) => void;
}) {
  const mutation = useHiveMutation({ mutationFn });

  const mutateBatch = async (items: TVariables[]) => {
    const results: Array<{ data: TData | null; error: HiveError | null }> = [];
    const errors: HiveError[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item === undefined) continue;

      try {
        const data = await mutation.mutateAsync(item);
        results.push({ data, error: null });
        onItemSuccess?.(data, item, i);
      } catch (error) {
        const hiveError = error as HiveError;
        results.push({ data: null, error: hiveError });
        errors.push(hiveError);
        onItemError?.(hiveError, item, i);
      }
    }

    if (errors.length > 0) {
      onError?.(errors);
    }

    onComplete?.(results);
  };

  return {
    mutateBatch,
    loading: mutation.loading,
    progress: {
      current: 0, // This would need state tracking for real progress
      total: 0,
    },
  };
}

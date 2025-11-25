/**
 * Core Mutation Hook for HIVE
 *
 * Handles create/update/delete operations with optimistic updates and automatic rollback.
 * Integrates with query cache for automatic invalidation and updates.
 *
 * @module use-hive-mutation
 * @since 1.0.0
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  HiveMutationState,
  HiveMutationConfig,
  HiveError,
} from '@hive/core';
import { useLoadingContext } from './loading-context';
import { invalidateQueries } from './use-hive-query';

/**
 * Generate unique mutation ID
 */
function generateMutationId(): string {
  return `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Core mutation hook with optimistic updates
 *
 * @example
 * ```tsx
 * const { mutate, loading, error, optimisticData } = useHiveMutation({
 *   mutationFn: (data) => createPost(data),
 *   optimisticUpdate: (vars) => ({
 *     id: 'temp-' + Date.now(),
 *     ...vars,
 *     createdAt: new Date(),
 *     author: currentUser,
 *   }),
 *   onSuccess: (data) => {
 *     invalidateQueries(['feed']);
 *     toast.success('Post created!');
 *   },
 *   onError: (error, vars, rollback) => {
 *     rollback();
 *     toast.error('Failed to create post');
 *   },
 * });
 *
 * // In your component
 * <Button
 *   onClick={() => mutate({ content: 'Hello world!' })}
 *   loading={loading}
 * />
 * ```
 */
export function useHiveMutation<TData = unknown, TVariables = unknown>(
  config: HiveMutationConfig<TData, TVariables>
): HiveMutationState<TData, TVariables> & {
  mutate: (variables: TVariables) => Promise<TData | void>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
} {
  const {
    mutationFn,
    optimisticUpdate,
    onSuccess,
    onError,
    onMutate,
    onSettled,
    retry = 0,
    retryDelay = 1000,
  } = config;

  const loadingContext = useLoadingContext();
  const mutationId = useRef(generateMutationId());

  // State
  const [state, setState] = useState<HiveMutationState<TData, TVariables>>({
    data: null,
    loading: false,
    error: null,
    optimisticData: null,
    variables: null,
    isIdle: true,
    isSuccess: false,
    isError: false,
  });

  // Refs for rollback
  const originalDataRef = useRef<TData | null>(null);
  const retryCountRef = useRef(0);
  const isMounted = useRef(true);

  /**
   * Rollback optimistic update
   */
  const rollback = useCallback(() => {
    if (!isMounted.current) return;

    setState((prev: HiveMutationState<TData, TVariables>) => ({
      ...prev,
      optimisticData: null,
      data: originalDataRef.current,
    }));
  }, []);

  /**
   * Execute mutation with retry logic
   */
  const executeMutation = useCallback(
    async (variables: TVariables, retryAttempt = 0): Promise<TData> => {
      try {
        const data = await mutationFn(variables);
        retryCountRef.current = 0;
        return data;
      } catch (error) {
        // Retry logic
        if (retryAttempt < retry) {
          const delay = retryDelay * Math.pow(2, retryAttempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return executeMutation(variables, retryAttempt + 1);
        }

        throw error;
      }
    },
    [mutationFn, retry, retryDelay]
  );

  /**
   * Perform mutation
   */
  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | void> => {
      if (!isMounted.current) return;

      // Store original data for rollback
      originalDataRef.current = state.data;

      // Call onMutate
      onMutate?.(variables);

      // Generate optimistic data if provided
      const optimistic = optimisticUpdate?.(variables);

      // Update state to loading
      setState({
        data: null,
        loading: true,
        error: null,
        optimisticData: optimistic ?? null,
        variables,
        isIdle: false,
        isSuccess: false,
        isError: false,
      });

      // Register mutation with loading context
      loadingContext?.registerMutation(mutationId.current);

      try {
        // Execute mutation
        const data = await executeMutation(variables, 0);

        if (!isMounted.current) return data;

        // Update state to success
        setState({
          data,
          loading: false,
          error: null,
          optimisticData: null,
          variables,
          isIdle: false,
          isSuccess: true,
          isError: false,
        });

        // Call onSuccess
        await onSuccess?.(data, variables);

        // Call onSettled
        onSettled?.(data, null, variables);

        return data;
      } catch (error) {
        if (!isMounted.current) return;

        const hiveError = error as HiveError;

        // Update state to error
        setState({
          data: originalDataRef.current,
          loading: false,
          error: hiveError,
          optimisticData: null,
          variables,
          isIdle: false,
          isSuccess: false,
          isError: true,
        });

        // Call onError with rollback function
        onError?.(hiveError, variables, rollback);

        // Call onSettled
        onSettled?.(null, hiveError, variables);

        // Don't throw - let component handle error state
        return;
      } finally {
        loadingContext?.unregisterMutation(mutationId.current);
      }
    },
    [
      state.data,
      optimisticUpdate,
      onMutate,
      executeMutation,
      onSuccess,
      onSettled,
      onError,
      rollback,
      loadingContext,
    ]
  );

  /**
   * Async version that throws on error
   */
  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      const result = await mutate(variables);
      if (state.error) {
        throw state.error;
      }
      return result as TData;
    },
    [mutate, state.error]
  );

  /**
   * Reset mutation state
   */
  const reset = useCallback(() => {
    if (!isMounted.current) return;

    setState({
      data: null,
      loading: false,
      error: null,
      optimisticData: null,
      variables: null,
      isIdle: true,
      isSuccess: false,
      isError: false,
    });
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMounted.current = false;
      loadingContext?.unregisterMutation(mutationId.current);
    };
  }, [loadingContext]);

  return {
    ...state,
    mutate,
    mutateAsync,
    reset,
  };
}

/**
 * Mutation hook with automatic query invalidation
 *
 * @example
 * ```tsx
 * const { mutate, loading } = useMutationWithInvalidation({
 *   mutationFn: createPost,
 *   invalidateKeys: [['feed'], ['spaces', { id: spaceId }]],
 *   optimisticUpdate: (vars) => ({ id: 'temp', ...vars }),
 * });
 * ```
 */
export function useMutationWithInvalidation<TData = unknown, TVariables = unknown>(
  config: HiveMutationConfig<TData, TVariables> & {
    invalidateKeys?: Array<ReadonlyArray<string | number | boolean | Record<string, unknown> | null | undefined>>;
  }
) {
  const { invalidateKeys, onSuccess, ...restConfig } = config;

  return useHiveMutation({
    ...restConfig,
    onSuccess: async (data: TData, variables: TVariables) => {
      // Invalidate specified queries
      if (invalidateKeys) {
        for (const key of invalidateKeys) {
          invalidateQueries(key);
        }
      }

      // Call original onSuccess
      await onSuccess?.(data, variables);
    },
  });
}

/**
 * Mutation hook for lists with optimistic add/remove
 *
 * @example
 * ```tsx
 * const { add, remove } = useListMutation({
 *   addMutation: (item) => createPost(item),
 *   removeMutation: (id) => deletePost(id),
 *   queryKey: ['feed'],
 * });
 *
 * <Button onClick={() => add({ content: 'Hello' })}>Create</Button>
 * <Button onClick={() => remove(postId)}>Delete</Button>
 * ```
 */
export function useListMutation<TItem extends { id: string }>(config: {
  queryKey: ReadonlyArray<string | number | boolean | Record<string, unknown> | null | undefined>;
  addMutation?: (item: Omit<TItem, 'id'>) => Promise<TItem>;
  removeMutation?: (id: string) => Promise<void>;
  updateMutation?: (id: string, updates: Partial<TItem>) => Promise<TItem>;
}) {
  const { queryKey, addMutation, removeMutation, updateMutation } = config;

  const add = useHiveMutation({
    mutationFn: addMutation!,
    optimisticUpdate: (vars: Omit<TItem, 'id'>) =>
      ({
        id: `temp_${Date.now()}`,
        ...vars,
      }) as TItem,
    onSuccess: () => {
      invalidateQueries(queryKey);
    },
  });

  const remove = useHiveMutation({
    mutationFn: removeMutation!,
    onSuccess: () => {
      invalidateQueries(queryKey);
    },
  });

  const update = useHiveMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TItem> }) =>
      updateMutation!(id, updates),
    onSuccess: () => {
      invalidateQueries(queryKey);
    },
  });

  return {
    add: add.mutate,
    remove: remove.mutate,
    update: (id: string, updates: Partial<TItem>) => update.mutate({ id, updates }),
    addState: add,
    removeState: remove,
    updateState: update,
  };
}

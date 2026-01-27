/**
 * Generic Real-time Collection Hook
 *
 * Listens to any Firestore collection with optional filtering.
 * Provides proper cleanup to prevent subscription leaks.
 *
 * @module use-realtime-collection
 * @since 1.0.0
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  onSnapshot,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@hive/firebase';

export interface UseRealtimeCollectionOptions<T> {
  /** Firestore query constraints (where, orderBy, limit, etc.) */
  constraints?: QueryConstraint[];
  /** Transform function to convert Firestore data to typed object */
  transform?: (id: string, data: Record<string, unknown>) => T;
  /** Enable/disable the subscription */
  enabled?: boolean;
  /** Error callback */
  onError?: (error: Error) => void;
}

export interface UseRealtimeCollectionReturn<T> {
  /** Array of transformed items */
  items: T[];
  /** Initial loading state */
  loading: boolean;
  /** Error if subscription fails */
  error: Error | null;
  /** Whether Firestore listener is active */
  isConnected: boolean;
  /** Last successful update timestamp */
  lastUpdated: Date | null;
}

/**
 * Hook for real-time Firestore collection subscriptions
 *
 * @example
 * ```tsx
 * const { items, loading, isConnected } = useRealtimeCollection<Post>(
 *   'posts',
 *   {
 *     constraints: [where('spaceId', '==', spaceId), orderBy('createdAt', 'desc'), limit(20)],
 *     transform: (id, data) => ({
 *       id,
 *       title: data.title as string,
 *       createdAt: parseTimestamp(data.createdAt),
 *     }),
 *   }
 * );
 * ```
 */
export function useRealtimeCollection<T>(
  collectionPath: string,
  options: UseRealtimeCollectionOptions<T> = {}
): UseRealtimeCollectionReturn<T> {
  const {
    constraints = [],
    transform = (id, data) => ({ id, ...data } as T),
    enabled = true,
    onError,
  } = options;

  const [state, setState] = useState<{
    items: T[];
    loading: boolean;
    error: Error | null;
    isConnected: boolean;
    lastUpdated: Date | null;
  }>({
    items: [],
    loading: true,
    error: null,
    isConnected: false,
    lastUpdated: null,
  });

  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // Stable constraint key for dependency tracking
  const constraintKey = JSON.stringify(
    constraints.map((c) => c.toString())
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled || !collectionPath) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const collectionRef = collection(db, collectionPath);
    const q = constraints.length > 0
      ? query(collectionRef, ...constraints)
      : query(collectionRef);

    unsubscribeRef.current = onSnapshot(
      q,
      (snapshot) => {
        if (!isMountedRef.current) return;

        const items: T[] = snapshot.docs.map((doc) =>
          transform(doc.id, doc.data() as Record<string, unknown>)
        );

        setState({
          items,
          loading: false,
          error: null,
          isConnected: true,
          lastUpdated: new Date(),
        });
      },
      (error) => {
        if (!isMountedRef.current) return;

        setState((prev) => ({
          ...prev,
          loading: false,
          error,
          isConnected: false,
        }));

        onError?.(error);
      }
    );

    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [collectionPath, constraintKey, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

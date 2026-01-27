/**
 * Generic Real-time Document Hook
 *
 * Listens to a single Firestore document.
 * Provides proper cleanup to prevent subscription leaks.
 *
 * @module use-realtime-document
 * @since 1.0.0
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@hive/firebase';

export interface UseRealtimeDocumentOptions<T> {
  /** Transform function to convert Firestore data to typed object */
  transform?: (data: Record<string, unknown>) => T;
  /** Enable/disable the subscription */
  enabled?: boolean;
  /** Error callback */
  onError?: (error: Error) => void;
}

export interface UseRealtimeDocumentReturn<T> {
  /** The transformed document data (null if not found or loading) */
  document: T | null;
  /** Initial loading state */
  loading: boolean;
  /** Error if subscription fails */
  error: Error | null;
  /** Whether Firestore listener is active */
  isConnected: boolean;
  /** Last successful update timestamp */
  lastUpdated: Date | null;
  /** Whether the document exists */
  exists: boolean;
}

/**
 * Hook for real-time Firestore document subscriptions
 *
 * @example
 * ```tsx
 * const { document, loading, exists } = useRealtimeDocument<Space>(
 *   `spaces/${spaceId}`,
 *   {
 *     transform: (data) => ({
 *       id: spaceId,
 *       name: data.name as string,
 *       memberCount: data.memberCount as number,
 *       updatedAt: parseTimestamp(data.updatedAt),
 *     }),
 *   }
 * );
 * ```
 */
export function useRealtimeDocument<T>(
  documentPath: string,
  options: UseRealtimeDocumentOptions<T> = {}
): UseRealtimeDocumentReturn<T> {
  const {
    transform = (data) => data as T,
    enabled = true,
    onError,
  } = options;

  const [state, setState] = useState<{
    document: T | null;
    loading: boolean;
    error: Error | null;
    isConnected: boolean;
    lastUpdated: Date | null;
    exists: boolean;
  }>({
    document: null,
    loading: true,
    error: null,
    isConnected: false,
    lastUpdated: null,
    exists: false,
  });

  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled || !documentPath) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const docRef = doc(db, documentPath);

    unsubscribeRef.current = onSnapshot(
      docRef,
      (snapshot) => {
        if (!isMountedRef.current) return;

        if (snapshot.exists()) {
          setState({
            document: transform(snapshot.data() as Record<string, unknown>),
            loading: false,
            error: null,
            isConnected: true,
            lastUpdated: new Date(),
            exists: true,
          });
        } else {
          setState({
            document: null,
            loading: false,
            error: null,
            isConnected: true,
            lastUpdated: new Date(),
            exists: false,
          });
        }
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
  }, [documentPath, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

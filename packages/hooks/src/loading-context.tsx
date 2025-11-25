/**
 * Loading Context Provider for HIVE
 *
 * Provides global loading state coordination across the app.
 * Tracks active queries and mutations, critical loading states.
 *
 * @module loading-context
 * @since 1.0.0
 */

'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { LoadingContextValue } from '@hive/core';

/**
 * Loading context
 */
const LoadingContext = createContext<LoadingContextValue | null>(null);

/**
 * Hook to access loading context
 *
 * @example
 * ```tsx
 * const { activeQueries, isCriticalLoading } = useLoadingContext();
 *
 * if (isCriticalLoading) {
 *   return <LoadingOverlay />;
 * }
 * ```
 */
export function useLoadingContext(): LoadingContextValue | null {
  return useContext(LoadingContext);
}

/**
 * Critical queries that block navigation/interaction
 */
const CRITICAL_QUERY_PATTERNS = ['feed', 'space', 'profile'];

/**
 * Check if query is critical
 */
function isCriticalQuery(queryKey: string): boolean {
  return CRITICAL_QUERY_PATTERNS.some((pattern) => queryKey.includes(pattern));
}

/**
 * Loading Provider Props
 */
export interface LoadingProviderProps {
  /** Child components */
  children: ReactNode;

  /** Optional callback when critical loading state changes */
  onCriticalLoadingChange?: (isCriticalLoading: boolean) => void;
}

/**
 * Loading Context Provider
 *
 * Wrap your app with this provider to enable global loading state coordination.
 *
 * @example
 * ```tsx
 * // In your app layout
 * export default function RootLayout({ children }) {
 *   return (
 *     <LoadingProvider>
 *       {children}
 *     </LoadingProvider>
 *   );
 * }
 * ```
 */
export function LoadingProvider({ children, onCriticalLoadingChange }: LoadingProviderProps) {
  const [activeQueries, setActiveQueries] = useState<Set<string>>(new Set());
  const [activeMutations, setActiveMutations] = useState<Set<string>>(new Set());
  const [isCriticalLoading, setIsCriticalLoading] = useState(false);

  /**
   * Register a query as loading
   */
  const registerQuery = useCallback(
    (key: string) => {
      setActiveQueries((prev) => {
        const next = new Set(prev);
        next.add(key);

        // Check if this is a critical query
        const wasCritical = isCriticalLoading;
        const isCritical = Array.from(next).some(isCriticalQuery);

        if (isCritical !== wasCritical) {
          setIsCriticalLoading(isCritical);
          onCriticalLoadingChange?.(isCritical);
        }

        return next;
      });
    },
    [isCriticalLoading, onCriticalLoadingChange]
  );

  /**
   * Unregister a query
   */
  const unregisterQuery = useCallback(
    (key: string) => {
      setActiveQueries((prev) => {
        const next = new Set(prev);
        next.delete(key);

        // Check if still critical
        const wasCritical = isCriticalLoading;
        const isCritical = Array.from(next).some(isCriticalQuery);

        if (isCritical !== wasCritical) {
          setIsCriticalLoading(isCritical);
          onCriticalLoadingChange?.(isCritical);
        }

        return next;
      });
    },
    [isCriticalLoading, onCriticalLoadingChange]
  );

  /**
   * Register a mutation as in progress
   */
  const registerMutation = useCallback((key: string) => {
    setActiveMutations((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  /**
   * Unregister a mutation
   */
  const unregisterMutation = useCallback((key: string) => {
    setActiveMutations((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const value: LoadingContextValue = {
    activeQueries,
    activeMutations,
    isCriticalLoading,
    registerQuery,
    unregisterQuery,
    registerMutation,
    unregisterMutation,
  };

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

/**
 * Hook to check if any queries are loading
 *
 * @example
 * ```tsx
 * const isLoading = useIsLoading();
 *
 * return (
 *   <Button disabled={isLoading}>
 *     Submit
 *   </Button>
 * );
 * ```
 */
export function useIsLoading(): boolean {
  const context = useLoadingContext();
  if (!context) return false;
  return context.activeQueries.size > 0 || context.activeMutations.size > 0;
}

/**
 * Hook to check if specific query is loading
 *
 * @example
 * ```tsx
 * const isFeedLoading = useIsQueryLoading('feed');
 * ```
 */
export function useIsQueryLoading(pattern: string): boolean {
  const context = useLoadingContext();
  if (!context) return false;

  return Array.from(context.activeQueries).some((key: string) => key.includes(pattern));
}

/**
 * Hook to check if any mutation is in progress
 *
 * @example
 * ```tsx
 * const isMutating = useIsMutating();
 *
 * return (
 *   <Form>
 *     {isMutating && <SaveIndicator />}
 *   </Form>
 * );
 * ```
 */
export function useIsMutating(): boolean {
  const context = useLoadingContext();
  if (!context) return false;
  return context.activeMutations.size > 0;
}

/**
 * Hook to check if critical loading (blocks interaction)
 *
 * @example
 * ```tsx
 * const isCritical = useIsCriticalLoading();
 *
 * if (isCritical) {
 *   return <FullScreenLoader />;
 * }
 * ```
 */
export function useIsCriticalLoading(): boolean {
  const context = useLoadingContext();
  if (!context) return false;
  return context.isCriticalLoading;
}

/**
 * useToolExecution Hook
 *
 * Provides complete tool execution runtime:
 * - Load/save tool state
 * - Execute element actions
 * - Subscribe to real-time updates via SSE
 * - Handle optimistic updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Element state - keyed by instanceId
 */
export type ElementState = Record<string, Record<string, unknown>>;

/**
 * Execution result from the API
 */
export interface ExecutionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  state?: Record<string, unknown>;
  feedContent?: {
    type: 'post' | 'update' | 'achievement';
    content: string;
    metadata?: Record<string, unknown>;
  };
  notifications?: Array<{
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    recipients?: string[];
  }>;
  cascadedElements?: string[];
}

/**
 * Hook options
 */
export interface UseToolExecutionOptions {
  /** Deployment ID for the tool instance */
  deploymentId: string;
  /** Optional space context */
  spaceId?: string;
  /** Tool ID (needed for some API calls) */
  toolId?: string;
  /** Callback when state updates (from SSE or action) */
  onStateUpdate?: (state: ElementState) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Callback when an action completes */
  onActionComplete?: (result: ExecutionResult) => void;
  /** Enable real-time updates via SSE */
  enableRealtime?: boolean;
  /** Auto-load state on mount */
  autoLoad?: boolean;
}

/**
 * Hook return type
 */
export interface UseToolExecutionReturn {
  /** Current element states keyed by instanceId */
  state: ElementState;
  /** Whether initial state is loading */
  isLoading: boolean;
  /** Whether an action is currently executing */
  isExecuting: boolean;
  /** Last error message */
  error: string | null;
  /** Whether SSE is connected */
  isConnected: boolean;
  /** Execute an element action */
  executeAction: (
    elementId: string,
    action: string,
    data?: Record<string, unknown>
  ) => Promise<ExecutionResult>;
  /** Manually refresh state from server */
  refresh: () => Promise<void>;
  /** Get state for a specific element */
  getElementState: (instanceId: string) => Record<string, unknown>;
  /** Update local state optimistically */
  setOptimisticState: (instanceId: string, state: Record<string, unknown>) => void;
}

/**
 * Hook for tool execution with state management and real-time updates
 */
export function useToolExecution(
  options: UseToolExecutionOptions
): UseToolExecutionReturn {
  const {
    deploymentId,
    spaceId,
    toolId,
    onStateUpdate,
    onError,
    onActionComplete,
    enableRealtime = true,
    autoLoad = true,
  } = options;

  // State
  const [state, setState] = useState<ElementState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs for cleanup
  const eventSourceRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  /**
   * Load state from server
   */
  const loadState = useCallback(async () => {
    if (!deploymentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tools/state/${deploymentId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to load state');
      }

      const result = await response.json();
      const loadedState = result.data?.state || {};

      if (mountedRef.current) {
        setState(loadedState);
        onStateUpdate?.(loadedState);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load state';
      if (mountedRef.current) {
        setError(message);
        onError?.(message);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [deploymentId, onStateUpdate, onError]);

  /**
   * Execute an element action
   */
  const executeAction = useCallback(
    async (
      elementId: string,
      action: string,
      data?: Record<string, unknown>
    ): Promise<ExecutionResult> => {
      if (!deploymentId) {
        return { success: false, error: 'No deployment ID' };
      }

      setIsExecuting(true);
      setError(null);

      try {
        const response = await fetch('/api/tools/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            deploymentId,
            action,
            elementId,
            data: data || {},
            context: spaceId ? { spaceId } : {},
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message || `Action failed: ${response.status}`
          );
        }

        const result: { data: ExecutionResult } = await response.json();
        const executionResult = result.data;

        // Update local state with result
        if (executionResult.state && mountedRef.current) {
          setState((prev) => {
            const newState: ElementState = {
              ...prev,
              ...(executionResult.state as ElementState),
            };
            onStateUpdate?.(newState);
            return newState;
          });
        }

        onActionComplete?.(executionResult);
        return executionResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Action failed';
        if (mountedRef.current) {
          setError(message);
          onError?.(message);
        }
        return { success: false, error: message };
      } finally {
        if (mountedRef.current) {
          setIsExecuting(false);
        }
      }
    },
    [deploymentId, spaceId, onStateUpdate, onError, onActionComplete]
  );

  /**
   * Get state for a specific element
   */
  const getElementState = useCallback(
    (instanceId: string): Record<string, unknown> => {
      return state[instanceId] || {};
    },
    [state]
  );

  /**
   * Update local state optimistically
   */
  const setOptimisticState = useCallback(
    (instanceId: string, elementState: Record<string, unknown>) => {
      setState((prev) => ({
        ...prev,
        [instanceId]: { ...prev[instanceId], ...elementState },
      }));
    },
    []
  );

  /**
   * Setup SSE subscription for real-time updates
   */
  useEffect(() => {
    if (!enableRealtime || !deploymentId) return;

    const connectSSE = () => {
      const url = new URL('/api/realtime/tool-updates', window.location.origin);
      url.searchParams.set('deploymentId', deploymentId);
      if (spaceId) {
        url.searchParams.set('spaceId', spaceId);
      }

      const eventSource = new EventSource(url.toString(), {
        withCredentials: true,
      });

      eventSource.onopen = () => {
        if (mountedRef.current) {
          setIsConnected(true);
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          if (update.state && mountedRef.current) {
            setState((prev) => {
              const newState = { ...prev, ...update.state };
              onStateUpdate?.(newState);
              return newState;
            });
          }
        } catch (_err) {
          // Silently ignore malformed SSE messages - may be partial data
        }
      };

      eventSource.onerror = () => {
        if (mountedRef.current) {
          setIsConnected(false);
        }
        // EventSource will auto-reconnect
      };

      eventSourceRef.current = eventSource;
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [deploymentId, spaceId, enableRealtime, onStateUpdate]);

  /**
   * Auto-load state on mount
   */
  useEffect(() => {
    if (autoLoad) {
      loadState();
    }
  }, [autoLoad, loadState]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    state,
    isLoading,
    isExecuting,
    error,
    isConnected,
    executeAction,
    refresh: loadState,
    getElementState,
    setOptimisticState,
  };
}

/**
 * Helper to create an onAction handler for element renderers
 */
export function createElementActionHandler(
  executeAction: UseToolExecutionReturn['executeAction'],
  elementId: string
) {
  return (action: string, data?: Record<string, unknown>) => {
    return executeAction(elementId, action, data);
  };
}

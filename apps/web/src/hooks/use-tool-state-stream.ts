'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

type StreamEventType = 'connected' | 'shared_state' | 'personal_state' | 'ping' | 'error';

interface ToolStateStreamEvent {
  type: StreamEventType;
  state?: Record<string, unknown>;
  timestamp?: number;
}

interface PendingWrite<TState extends object> {
  createdAt: number;
  rollbackState: TState;
  write: () => Promise<void>;
}

export interface UseToolStateStreamOptions<TState extends object> {
  toolId: string | null;
  spaceId: string | null;
  eventType: Extract<StreamEventType, 'shared_state' | 'personal_state'>;
  enabled?: boolean;
  initialState?: TState;
  mergeState?: (prev: TState, incoming: Record<string, unknown>) => TState;
}

export interface UseToolStateStreamResult<TState extends object> {
  state: TState;
  isConnected: boolean;
  error: Error | null;
  setState: (nextState: TState | ((prev: TState) => TState)) => void;
  queueOptimisticWrite: (
    nextState: TState,
    write: () => Promise<void>,
    rollbackState?: TState
  ) => Promise<void>;
  clearError: () => void;
}

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

function defaultMerge<TState extends object>(
  prev: TState,
  incoming: Record<string, unknown>
): TState {
  return { ...(prev as object), ...(incoming as object) } as TState;
}

export function useToolStateStream<TState extends object>(
  options: UseToolStateStreamOptions<TState>
): UseToolStateStreamResult<TState> {
  const {
    toolId,
    spaceId,
    eventType,
    enabled = true,
    initialState = {} as TState,
    mergeState = defaultMerge,
  } = options;

  const [state, setStateInternal] = useState<TState>(initialState);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const stateRef = useRef<TState>(initialState);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
  const eventSourceRef = useRef<EventSource | null>(null);
  const writeQueueRef = useRef<PendingWrite<TState>[]>([]);
  const isFlushingQueueRef = useRef(false);
  const latestPendingWriteTimestampRef = useRef<number | null>(null);
  const latestServerTimestampRef = useRef<number>(0);

  const setState = useCallback((nextState: TState | ((prev: TState) => TState)) => {
    setStateInternal((prev) => {
      const resolved = typeof nextState === 'function'
        ? (nextState as (prevState: TState) => TState)(prev)
        : nextState;
      stateRef.current = resolved;
      return resolved;
    });
  }, []);

  const flushWriteQueue = useCallback(async () => {
    if (isFlushingQueueRef.current) {
      return;
    }

    isFlushingQueueRef.current = true;
    try {
      while (writeQueueRef.current.length > 0) {
        const current = writeQueueRef.current[0];
        if (!current) {
          break;
        }

        try {
          await current.write();
          writeQueueRef.current.shift();
          if (writeQueueRef.current.length === 0) {
            latestPendingWriteTimestampRef.current = null;
          }
        } catch (writeError) {
          const err = writeError instanceof Error
            ? writeError
            : new Error('Failed to persist tool state');

          if (!mountedRef.current) {
            break;
          }

          setError(err);

          // Roll back only if server did not already win with a newer timestamp.
          if ((latestServerTimestampRef.current || 0) <= current.createdAt) {
            setState(current.rollbackState);
          }

          writeQueueRef.current = [];
          latestPendingWriteTimestampRef.current = null;
          break;
        }
      }
    } finally {
      isFlushingQueueRef.current = false;
    }
  }, [setState]);

  const queueOptimisticWrite = useCallback(async (
    nextState: TState,
    write: () => Promise<void>,
    rollbackState?: TState
  ) => {
    const now = Date.now();
    const rollback = rollbackState || stateRef.current;

    // Optimistic apply immediately.
    setState(nextState);
    setError(null);

    writeQueueRef.current.push({
      createdAt: now,
      rollbackState: rollback,
      write,
    });
    latestPendingWriteTimestampRef.current = now;

    await flushWriteQueue();
  }, [flushWriteQueue, setState]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!enabled || !toolId || !spaceId || typeof EventSource === 'undefined') {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    mountedRef.current = true;
    let disposed = false;

    const scheduleReconnect = () => {
      if (disposed || !mountedRef.current) {
        return;
      }

      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!disposed && mountedRef.current) {
          connect();
        }
      }, delay);
    };

    const handleMessage = (event: MessageEvent) => {
      if (!mountedRef.current || disposed) {
        return;
      }

      try {
        const parsed = JSON.parse(event.data) as ToolStateStreamEvent;

        if (parsed.type === 'connected') {
          setIsConnected(true);
          setError(null);
          reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
          return;
        }

        if (parsed.type !== eventType || !parsed.state) {
          return;
        }

        const incomingTimestamp = parsed.timestamp || Date.now();
        latestServerTimestampRef.current = Math.max(
          latestServerTimestampRef.current,
          incomingTimestamp
        );

        // Last-write-wins conflict handling:
        // If server is newer than any pending local write, accept server and drop queue.
        const pendingTimestamp = latestPendingWriteTimestampRef.current;
        if (pendingTimestamp !== null && incomingTimestamp >= pendingTimestamp) {
          writeQueueRef.current = [];
          latestPendingWriteTimestampRef.current = null;
        } else if (pendingTimestamp !== null && incomingTimestamp < pendingTimestamp) {
          // Local pending write is newer; keep optimistic state.
          return;
        }

        setState(mergeState(stateRef.current, parsed.state));
        setError(null);
      } catch (parseError) {
        logger.warn('Failed to parse tool state stream event', {
          toolId,
          spaceId,
          eventType,
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
      }
    };

    const connect = () => {
      if (disposed || !mountedRef.current) {
        return;
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const streamUrl = `/api/tools/${encodeURIComponent(toolId)}/state/stream?spaceId=${encodeURIComponent(spaceId)}`;
      const source = new EventSource(streamUrl, { withCredentials: true });
      eventSourceRef.current = source;

      source.onmessage = handleMessage;

      source.onerror = () => {
        if (!mountedRef.current || disposed) {
          return;
        }

        setIsConnected(false);
        setError(new Error('Tool state stream disconnected'));

        source.close();
        if (eventSourceRef.current === source) {
          eventSourceRef.current = null;
        }

        scheduleReconnect();
      };
    };

    connect();

    return () => {
      disposed = true;
      mountedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      setIsConnected(false);
    };
  }, [enabled, eventType, mergeState, setState, spaceId, toolId]);

  return {
    state,
    isConnected,
    error,
    setState,
    queueOptimisticWrite,
    clearError,
  };
}

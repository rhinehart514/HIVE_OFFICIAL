/**
 * useToolStateRealtime - Real-time tool state subscription hook
 *
 * Subscribes to Firebase RTDB for instant tool state updates.
 * Eliminates polling and provides live updates for polls, RSVPs, etc.
 *
 * Usage:
 *   const { counters, collections, timeline, isConnected } = useToolStateRealtime(deploymentId);
 *
 * Data Flow:
 *   RTDB: tool_state/{deploymentId} → Hook state → Component re-render
 *
 * @author HIVE Engineering
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase, ref, onValue, off, type DataSnapshot } from 'firebase/database';
import { app } from '@hive/core';

// ============================================================================
// TYPES
// ============================================================================

export interface ToolStateCounters {
  [key: string]: number;
}

export interface ToolStateCollectionSummary {
  count: number;
  recentIds: string[];
  lastUpdated: string;
}

export interface ToolStateTimelineEvent {
  id: string;
  type: string;
  userId: string;
  action: string;
  timestamp: string;
}

export interface ToolStateMetadata {
  version: number;
  lastModified: string;
  broadcastAt: number;
  deploymentId: string;
  toolId: string;
}

export interface ToolStateRealtimeData {
  counters: ToolStateCounters;
  collections: Record<string, ToolStateCollectionSummary>;
  timeline: ToolStateTimelineEvent[];
  metadata: ToolStateMetadata | null;
}

export interface UseToolStateRealtimeOptions {
  /** Enable/disable the subscription (default: true) */
  enabled?: boolean;
  /** Only subscribe to specific data (default: all) */
  subscriptions?: ('counters' | 'collections' | 'timeline')[];
  /** Callback when counters change */
  onCountersChange?: (counters: ToolStateCounters) => void;
  /** Callback when a timeline event is added */
  onTimelineEvent?: (event: ToolStateTimelineEvent) => void;
}

export interface UseToolStateRealtimeResult {
  /** Current counter values */
  counters: ToolStateCounters;
  /** Collection summaries (count + recent IDs) */
  collections: Record<string, ToolStateCollectionSummary>;
  /** Recent timeline events */
  timeline: ToolStateTimelineEvent[];
  /** State metadata (version, lastModified) */
  metadata: ToolStateMetadata | null;
  /** Whether connected to RTDB */
  isConnected: boolean;
  /** Connection error if any */
  error: Error | null;
  /** Manually refresh state from RTDB */
  refresh: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useToolStateRealtime(
  deploymentId: string | null,
  options: UseToolStateRealtimeOptions = {}
): UseToolStateRealtimeResult {
  const { enabled = true, subscriptions, onCountersChange, onTimelineEvent } = options;

  // State
  const [counters, setCounters] = useState<ToolStateCounters>({});
  const [collections, setCollections] = useState<Record<string, ToolStateCollectionSummary>>({});
  const [timeline, setTimeline] = useState<ToolStateTimelineEvent[]>([]);
  const [metadata, setMetadata] = useState<ToolStateMetadata | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for callbacks to avoid stale closures
  const onCountersChangeRef = useRef(onCountersChange);
  const onTimelineEventRef = useRef(onTimelineEvent);
  const previousTimelineLength = useRef(0);

  useEffect(() => {
    onCountersChangeRef.current = onCountersChange;
    onTimelineEventRef.current = onTimelineEvent;
  }, [onCountersChange, onTimelineEvent]);

  // Main subscription effect
  useEffect(() => {
    if (!deploymentId || !enabled) {
      setIsConnected(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    try {
      const database = getDatabase(app);
      const statePath = `tool_state/${deploymentId}`;
      const stateRef = ref(database, statePath);

      // Subscribe to state changes
      const handleValue = (snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          // No broadcast state yet - this is normal for new tools
          setCounters({});
          setCollections({});
          setTimeline([]);
          setMetadata(null);
          setIsConnected(true);
          setError(null);
          return;
        }

        const data = snapshot.val() as ToolStateRealtimeData;

        // Update counters
        if (!subscriptions || subscriptions.includes('counters')) {
          const newCounters = data.counters || {};
          setCounters((prev) => {
            // Only update if changed
            if (JSON.stringify(prev) !== JSON.stringify(newCounters)) {
              // Call callback if provided
              onCountersChangeRef.current?.(newCounters);
              return newCounters;
            }
            return prev;
          });
        }

        // Update collections
        if (!subscriptions || subscriptions.includes('collections')) {
          setCollections(data.collections || {});
        }

        // Update timeline
        if (!subscriptions || subscriptions.includes('timeline')) {
          const newTimeline = data.timeline || [];
          setTimeline((prev) => {
            // Check for new events
            if (newTimeline.length > previousTimelineLength.current) {
              const newEvents = newTimeline.slice(previousTimelineLength.current);
              newEvents.forEach((event) => {
                onTimelineEventRef.current?.(event);
              });
            }
            previousTimelineLength.current = newTimeline.length;
            return newTimeline;
          });
        }

        // Update metadata
        setMetadata(data.metadata || null);
        setIsConnected(true);
        setError(null);
      };

      const handleError = (err: Error) => {
        setError(err);
        setIsConnected(false);
      };

      onValue(stateRef, handleValue, handleError);

      // Store unsubscribe function
      unsubscribe = () => {
        off(stateRef, 'value', handleValue);
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsConnected(false);
    }

    return () => {
      unsubscribe?.();
      setIsConnected(false);
    };
  }, [deploymentId, enabled, subscriptions]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (!deploymentId) return;

    try {
      const database = getDatabase(app);
      const statePath = `tool_state/${deploymentId}`;
      const stateRef = ref(database, statePath);

      // One-time read
      onValue(
        stateRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val() as ToolStateRealtimeData;
            setCounters(data.counters || {});
            setCollections(data.collections || {});
            setTimeline(data.timeline || []);
            setMetadata(data.metadata || null);
          }
        },
        { onlyOnce: true }
      );
    } catch {
      // Failed to refresh RTDB state
    }
  }, [deploymentId]);

  return {
    counters,
    collections,
    timeline,
    metadata,
    isConnected,
    error,
    refresh,
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for subscribing to just counter updates (optimized for polls)
 */
export function useToolCountersRealtime(
  deploymentId: string | null,
  onUpdate?: (counters: ToolStateCounters) => void
): { counters: ToolStateCounters; isConnected: boolean } {
  const { counters, isConnected } = useToolStateRealtime(deploymentId, {
    subscriptions: ['counters'],
    onCountersChange: onUpdate,
  });

  return { counters, isConnected };
}

/**
 * Hook for subscribing to timeline events (activity feeds)
 */
export function useToolTimelineRealtime(
  deploymentId: string | null,
  onEvent?: (event: ToolStateTimelineEvent) => void
): { timeline: ToolStateTimelineEvent[]; isConnected: boolean } {
  const { timeline, isConnected } = useToolStateRealtime(deploymentId, {
    subscriptions: ['timeline'],
    onTimelineEvent: onEvent,
  });

  return { timeline, isConnected };
}

/**
 * Hook for a specific counter value (e.g., vote count for one option)
 */
export function useToolCounter(
  deploymentId: string | null,
  counterKey: string
): { value: number; isConnected: boolean } {
  const { counters, isConnected } = useToolStateRealtime(deploymentId, {
    subscriptions: ['counters'],
  });

  // Normalize counter key (: replaced with _ in RTDB)
  const normalizedKey = counterKey.replace(/:/g, '_');
  const value = counters[normalizedKey] ?? counters[counterKey] ?? 0;

  return { value, isConnected };
}

export default useToolStateRealtime;

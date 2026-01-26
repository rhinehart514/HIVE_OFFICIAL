/**
 * useConnectionSync - Real-time tool connection subscription hook
 *
 * Subscribes to Firebase RTDB for instant connection updates between tools.
 * When a source tool's state changes, connected target tools receive updates
 * in real-time without polling.
 *
 * Usage:
 *   const { updates, values, isConnected } = useConnectionSync(deploymentId, {
 *     onConnectionUpdate: (update) => refetchConnections(),
 *     onValueChange: (elementId, inputPath, value) => injectValue(elementId, value),
 *   });
 *
 * Data Flow:
 *   Source tool changes → broadcaster → RTDB → this hook → callback → re-resolve
 *
 * @author HIVE Engineering
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase, ref, onValue, off, query, orderByChild, limitToLast, type DataSnapshot } from 'firebase/database';
import { app } from '@hive/core';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Connection update notification from RTDB
 */
export interface ConnectionUpdate {
  id: string;
  sourceDeploymentId: string;
  changedPaths: string[];
  timestamp: number;
}

/**
 * Resolved connection value pushed to RTDB
 */
export interface ConnectionValue {
  elementId: string;
  inputPath: string;
  value: unknown;
  sourceDeploymentId: string;
  resolvedAt: number;
}

/**
 * Options for the connection sync hook
 */
export interface UseConnectionSyncOptions {
  /** Enable/disable the subscription (default: true) */
  enabled?: boolean;
  /** Callback when a connection update notification arrives */
  onConnectionUpdate?: (update: ConnectionUpdate) => void;
  /** Callback when a resolved value changes */
  onValueChange?: (elementId: string, inputPath: string, value: unknown) => void;
  /** Maximum number of update notifications to track (default: 20) */
  maxUpdates?: number;
}

/**
 * Result from the connection sync hook
 */
export interface UseConnectionSyncResult {
  /** Recent connection update notifications */
  updates: ConnectionUpdate[];
  /** Current resolved connection values, keyed by "elementId:inputPath" */
  values: Record<string, ConnectionValue>;
  /** Whether connected to RTDB */
  isConnected: boolean;
  /** Connection error if any */
  error: Error | null;
  /** Clear all stored values */
  clearValues: () => void;
  /** Manually trigger re-resolution (via callback) */
  requestResolution: () => void;
}

// ============================================================================
// RTDB PATHS
// ============================================================================

const getUpdatesPath = (deploymentId: string) => `tool_connections/${deploymentId}/updates`;
const getValuesPath = (deploymentId: string) => `tool_connections/${deploymentId}/values`;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useConnectionSync(
  deploymentId: string | null,
  options: UseConnectionSyncOptions = {}
): UseConnectionSyncResult {
  const {
    enabled = true,
    onConnectionUpdate,
    onValueChange,
    maxUpdates = 20,
  } = options;

  // State
  const [updates, setUpdates] = useState<ConnectionUpdate[]>([]);
  const [values, setValues] = useState<Record<string, ConnectionValue>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for callbacks to avoid stale closures
  const onConnectionUpdateRef = useRef(onConnectionUpdate);
  const onValueChangeRef = useRef(onValueChange);
  const lastProcessedUpdateRef = useRef<string | null>(null);

  useEffect(() => {
    onConnectionUpdateRef.current = onConnectionUpdate;
    onValueChangeRef.current = onValueChange;
  }, [onConnectionUpdate, onValueChange]);

  // Subscribe to updates
  useEffect(() => {
    if (!deploymentId || !enabled) {
      setIsConnected(false);
      return;
    }

    let unsubscribeUpdates: (() => void) | null = null;
    let unsubscribeValues: (() => void) | null = null;

    try {
      const database = getDatabase(app);

      // Subscribe to connection update notifications
      const updatesPath = getUpdatesPath(deploymentId);
      const updatesRef = query(
        ref(database, updatesPath),
        orderByChild('timestamp'),
        limitToLast(maxUpdates)
      );

      const handleUpdates = (snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          setUpdates([]);
          setIsConnected(true);
          return;
        }

        const data = snapshot.val() as Record<string, Omit<ConnectionUpdate, 'id'>>;
        const updatesList: ConnectionUpdate[] = [];

        Object.entries(data).forEach(([id, update]) => {
          updatesList.push({
            id,
            sourceDeploymentId: update.sourceDeploymentId,
            changedPaths: update.changedPaths || [],
            timestamp: update.timestamp,
          });
        });

        // Sort by timestamp descending (newest first)
        updatesList.sort((a, b) => b.timestamp - a.timestamp);

        // Trigger callback for new updates only
        if (updatesList.length > 0) {
          const newestUpdate = updatesList[0];
          if (newestUpdate.id !== lastProcessedUpdateRef.current) {
            lastProcessedUpdateRef.current = newestUpdate.id;
            onConnectionUpdateRef.current?.(newestUpdate);
          }
        }

        setUpdates(updatesList);
        setIsConnected(true);
        setError(null);
      };

      // Subscribe to resolved values
      const valuesPath = getValuesPath(deploymentId);
      const valuesRef = ref(database, valuesPath);

      const handleValues = (snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          setValues({});
          return;
        }

        const data = snapshot.val() as Record<string, ConnectionValue>;
        const newValues: Record<string, ConnectionValue> = {};

        Object.entries(data).forEach(([key, connValue]) => {
          newValues[key] = connValue;

          // Trigger callback for value changes
          if (connValue.elementId && connValue.inputPath !== undefined) {
            onValueChangeRef.current?.(
              connValue.elementId,
              connValue.inputPath,
              connValue.value
            );
          }
        });

        setValues(newValues);
      };

      const handleError = (err: Error) => {
        setError(err);
        setIsConnected(false);
      };

      // Set up listeners
      onValue(updatesRef, handleUpdates, handleError);
      onValue(valuesRef, handleValues, handleError);

      // Store unsubscribe functions
      unsubscribeUpdates = () => {
        off(updatesRef, 'value', handleUpdates);
      };
      unsubscribeValues = () => {
        off(valuesRef, 'value', handleValues);
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsConnected(false);
    }

    return () => {
      unsubscribeUpdates?.();
      unsubscribeValues?.();
      setIsConnected(false);
    };
  }, [deploymentId, enabled, maxUpdates]);

  // Clear values function
  const clearValues = useCallback(() => {
    setValues({});
  }, []);

  // Request re-resolution (triggers callback with empty update)
  const requestResolution = useCallback(() => {
    if (onConnectionUpdateRef.current) {
      onConnectionUpdateRef.current({
        id: `manual_${Date.now()}`,
        sourceDeploymentId: '',
        changedPaths: ['*'],
        timestamp: Date.now(),
      });
    }
  }, []);

  return {
    updates,
    values,
    isConnected,
    error,
    clearValues,
    requestResolution,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook that returns resolved connection value for a specific element input
 */
export function useConnectionValue(
  deploymentId: string | null,
  elementId: string,
  inputPath: string
): { value: unknown; hasValue: boolean; isConnected: boolean } {
  const { values, isConnected } = useConnectionSync(deploymentId);

  const key = `${elementId}:${inputPath}`;
  const connValue = values[key];

  return {
    value: connValue?.value,
    hasValue: connValue !== undefined,
    isConnected,
  };
}

/**
 * Hook that triggers a callback whenever any source tool updates
 */
export function useConnectionUpdates(
  deploymentId: string | null,
  onUpdate: (sourceDeploymentId: string, changedPaths: string[]) => void
): { isConnected: boolean; lastUpdate: ConnectionUpdate | null } {
  const [lastUpdate, setLastUpdate] = useState<ConnectionUpdate | null>(null);

  const handleUpdate = useCallback(
    (update: ConnectionUpdate) => {
      setLastUpdate(update);
      onUpdate(update.sourceDeploymentId, update.changedPaths);
    },
    [onUpdate]
  );

  const { isConnected } = useConnectionSync(deploymentId, {
    onConnectionUpdate: handleUpdate,
  });

  return { isConnected, lastUpdate };
}

export default useConnectionSync;

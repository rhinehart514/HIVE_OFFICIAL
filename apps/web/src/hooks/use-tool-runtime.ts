"use client";

/**
 * Tool Runtime Hook
 *
 * Manages HiveLab tool execution, state persistence, and real-time sync.
 * Used for rendering deployed tools in space sidebars and chat.
 *
 * Features:
 * - Fetches tool definition from API
 * - Loads and persists deployment state
 * - Executes tool actions with optimistic updates
 * - Auto-saves state changes with debounce
 * - Handles composite deployment IDs for space placements
 * - Phase 1: SharedState architecture for aggregate data (polls, RSVPs, leaderboards)
 * - Phase S3: Real-time updates via Firebase RTDB (counters, collections, timeline)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { ToolSharedState } from "@hive/core";
import { useToolStateRealtime } from "./use-tool-state-realtime";

// ============================================================================
// Types
// ============================================================================

export interface ToolElement {
  /** Stable element definition id (used by ToolCanvas) */
  elementId: string;
  /** Unique instance id for state/actions */
  instanceId: string;
  /** Element type hint from API (optional for canvas) */
  type?: string;
  config: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  /** Back-compat field some APIs send */
  id?: string;
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  elements: ToolElement[];
  category?: string;
  version?: number;
  currentVersion?: number;
  status?: string; // draft, preview, published
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  creatorId?: string;
  campusId?: string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ToolState {
  [key: string]: unknown;
}

export interface ActionResult {
  success: boolean;
  result?: unknown;
  state?: ToolState;
  error?: string;
  /** Element IDs that were affected by cascade (for visual feedback) */
  cascadedElements?: string[];
}

interface UseToolRuntimeOptions {
  toolId: string;
  spaceId?: string;
  placementId?: string; // Placement within space (used to generate deploymentId)
  deploymentId?: string; // Direct deployment ID (takes precedence)
  autoSave?: boolean;
  autoSaveDelay?: number;
  enabled?: boolean;
  /** Enable real-time RTDB subscriptions for shared state (polls, RSVPs) */
  enableRealtime?: boolean;
  /** Callback when elements are affected by cascade - use for visual feedback */
  onCascade?: (cascadedElementIds: string[]) => void;
  /** Callback when real-time counter updates arrive */
  onRealtimeCounterUpdate?: (counters: Record<string, number>) => void;
}

interface UseToolRuntimeReturn {
  tool: Tool | null;
  /** @deprecated Use userState instead for per-user state */
  state: ToolState;
  /** Per-user state (selections, participation, personal data) */
  userState: ToolState;
  /** Shared state visible to all users (counters, collections, timeline) */
  sharedState: ToolSharedState;
  isLoading: boolean;
  isExecuting: boolean;
  isSaving: boolean;
  isSynced: boolean;
  /** Whether connected to real-time RTDB updates */
  isRealtimeConnected: boolean;
  lastSaved: Date | null;
  error: Error | null;
  executeAction: (
    elementId: string,
    actionName: string,
    payload?: Record<string, unknown>
  ) => Promise<ActionResult>;
  updateState: (updates: Partial<ToolState>) => void;
  setState: (newState: ToolState) => void;
  saveState: () => Promise<void>;
  reset: () => void;
  reload: () => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_AUTO_SAVE_DELAY = 2000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Create empty shared state structure
 */
const EMPTY_SHARED_STATE: ToolSharedState = {
  counters: {},
  collections: {},
  timeline: [],
  computed: {},
  version: 0,
  lastModified: new Date().toISOString(),
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate deployment ID from space and placement
 * Format: "space:{spaceId}_{placementId}"
 */
function generateDeploymentId(spaceId: string, placementId: string): string {
  return `space:${spaceId}_${placementId}`;
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Fetch failed");
      if (i < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * (i + 1))
        );
      }
    }
  }

  throw lastError || new Error("Fetch failed after retries");
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing tool runtime state and execution
 */
export function useToolRuntime(
  options: UseToolRuntimeOptions
): UseToolRuntimeReturn {
  const {
    toolId,
    spaceId,
    placementId,
    deploymentId: providedDeploymentId,
    autoSave = true,
    autoSaveDelay = DEFAULT_AUTO_SAVE_DELAY,
    enabled = true,
    enableRealtime = false,
    onCascade,
    onRealtimeCounterUpdate,
  } = options;

  // Calculate effective deployment ID
  const effectiveDeploymentId =
    providedDeploymentId ||
    (spaceId && placementId ? generateDeploymentId(spaceId, placementId) : null);

  // Real-time RTDB subscription for shared state updates
  const {
    counters: realtimeCounters,
    collections: realtimeCollections,
    timeline: realtimeTimeline,
    isConnected: isRealtimeConnected,
  } = useToolStateRealtime(enableRealtime ? effectiveDeploymentId : null, {
    enabled: enableRealtime && enabled,
    onCountersChange: onRealtimeCounterUpdate,
  });

  // State
  const [tool, setTool] = useState<Tool | null>(null);
  const [state, setState] = useState<ToolState>({});
  const [sharedState, setSharedState] = useState<ToolSharedState>(EMPTY_SHARED_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSynced, setIsSynced] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const stateRef = useRef<ToolState>(state); // Keep current state for save closure
  const sharedStateRef = useRef<ToolSharedState>(sharedState); // Keep current shared state
  const initialStateRef = useRef<ToolState>({}); // Track initial state for dirty checking

  // Update state refs when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    sharedStateRef.current = sharedState;
  }, [sharedState]);

  // Merge real-time RTDB updates into sharedState
  // RTDB provides instant updates for counters, collections, and timeline
  useEffect(() => {
    if (!enableRealtime || !isRealtimeConnected) return;

    // Only update if we have real-time data
    const hasRealtimeData =
      Object.keys(realtimeCounters).length > 0 ||
      Object.keys(realtimeCollections).length > 0 ||
      realtimeTimeline.length > 0;

    if (!hasRealtimeData) return;

    setSharedState((prev) => {
      // Merge real-time counters (RTDB takes precedence for real-time accuracy)
      const mergedCounters = { ...prev.counters };
      for (const [key, value] of Object.entries(realtimeCounters)) {
        // Normalize key (RTDB uses _ instead of :)
        const normalizedKey = key.replace(/_/g, ':');
        mergedCounters[normalizedKey] = value;
        mergedCounters[key] = value; // Also store with original key
      }

      // Merge real-time collection summaries
      // Note: RTDB only has summaries (count, recentIds), not full entities
      // Full entities still come from Firestore via API

      // Convert RTDB timeline events to ToolSharedState format
      const convertedTimeline = realtimeTimeline.map((evt) => ({
        id: evt.id,
        type: evt.type,
        timestamp: evt.timestamp,
        userId: evt.userId,
        elementInstanceId: '', // RTDB simplified format doesn't include this
        action: evt.action,
      }));

      // Merge timelines, avoiding duplicates
      const mergedTimeline = realtimeTimeline.length > 0
        ? [...prev.timeline, ...convertedTimeline.filter(
            (evt) => !prev.timeline.some((t) => t.id === evt.id)
          )].slice(-100)
        : prev.timeline;

      return {
        ...prev,
        counters: mergedCounters,
        timeline: mergedTimeline,
      };
    });
  }, [enableRealtime, isRealtimeConnected, realtimeCounters, realtimeCollections, realtimeTimeline]);

  // ============================================================================
  // Load Tool and State (Combined - reduces N+1 queries)
  // ============================================================================

  const loadToolAndState = useCallback(async () => {
    if (!toolId || !enabled) {
      setTool(null);
      setState({});
      setIsSynced(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use combined endpoint when we have a deployment ID
      // This reduces 2 requests to 1
      const url = effectiveDeploymentId
        ? `/api/tools/${toolId}/with-state?deploymentId=${encodeURIComponent(effectiveDeploymentId)}`
        : `/api/tools/${toolId}`;

      const response = await fetchWithRetry(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Tool not found");
        }
        throw new Error(`Failed to load tool: ${response.status}`);
      }

      const data = await response.json();

      if (!mountedRef.current) return;

      // Handle combined response (tool data may be nested in 'tool' or at root)
      const toolData = data.tool || data;

      // Normalize element format (API may use different field names)
      const normalizedElements: ToolElement[] = (toolData.elements || []).map(
        (el: Record<string, unknown>) => {
          const rawInstanceId = (el.instanceId ?? el.id ?? el.elementId) as string | number | undefined;
          const rawElementId = (el.elementId ?? el.id) as string | number | undefined;
          return {
            id: el.id as string | undefined,
            elementId: rawElementId != null ? String(rawElementId) : String(rawInstanceId ?? ''),
            instanceId: rawInstanceId != null ? String(rawInstanceId) : String(rawElementId ?? ''),
            type: el.type as string | undefined,
            config: (el.config as Record<string, unknown>) || {},
            position: el.position as { x: number; y: number } | undefined,
            size: el.size as { width: number; height: number } | undefined,
          };
        }
      );

      setTool({
        id: toolData.id,
        name: toolData.name,
        description: toolData.description,
        elements: normalizedElements,
        category: toolData.category,
        version: toolData.version,
        currentVersion: toolData.currentVersion,
        status: toolData.status || 'draft',
        config: toolData.config,
        metadata: toolData.metadata,
        creatorId: toolData.creatorId,
        campusId: toolData.campusId,
        isPublished: toolData.isPublished,
        createdAt: toolData.createdAt,
        updatedAt: toolData.updatedAt,
      });

      // If combined response includes state, apply it
      if (data.state !== undefined || data.userState !== undefined) {
        // Prefer userState (new), fall back to state (legacy)
        const loadedState = data.userState || data.state || {};
        setState(loadedState);
        initialStateRef.current = loadedState;
        setIsSynced(true);
      } else if (effectiveDeploymentId) {
        // If using old endpoint without state, initialize empty
        setState({});
        initialStateRef.current = {};
        setIsSynced(true);
      }

      // Load shared state if available (Phase 1: SharedState architecture)
      if (data.sharedState !== undefined) {
        setSharedState(data.sharedState);
      } else {
        setSharedState(EMPTY_SHARED_STATE);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load tool:", err);
      }
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error("Failed to load tool"));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [toolId, effectiveDeploymentId, enabled]);

  // Load tool and state on mount and when IDs change
  useEffect(() => {
    void loadToolAndState();
  }, [loadToolAndState]);

  // ============================================================================
  // Save State
  // ============================================================================

  const saveState = useCallback(async () => {
    if (!effectiveDeploymentId) return;

    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    setIsSaving(true);
    try {
      const response = await fetchWithRetry(
        `/api/tools/state/${encodeURIComponent(effectiveDeploymentId)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            state: stateRef.current,
            toolId,
            spaceId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save state: ${response.status}`);
      }

      if (mountedRef.current) {
        setLastSaved(new Date());
        setIsSynced(true);
        initialStateRef.current = { ...stateRef.current };
      }
    } catch (err) {
      console.error("Failed to save tool state:", err);
      if (mountedRef.current) {
        setIsSynced(false);
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [effectiveDeploymentId, toolId, spaceId]);

  // ============================================================================
  // Auto-Save with Debounce
  // ============================================================================

  const scheduleAutoSave = useCallback(() => {
    if (!autoSave || !effectiveDeploymentId) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSynced(false);
    saveTimeoutRef.current = setTimeout(() => {
      void saveState();
    }, autoSaveDelay);
  }, [autoSave, effectiveDeploymentId, autoSaveDelay, saveState]);

  // ============================================================================
  // Execute Action
  // ============================================================================

  const executeAction = useCallback(
    async (
      elementId: string,
      actionName: string,
      payload?: Record<string, unknown>
    ): Promise<ActionResult> => {
      if (!toolId) {
        return { success: false, error: "No tool loaded" };
      }

      setIsExecuting(true);
      setError(null);

      try {
        const response = await fetchWithRetry("/api/tools/execute", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toolId,
            deploymentId: effectiveDeploymentId,
            elementId,
            action: actionName,
            data: payload || {},
            spaceId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Action failed: ${response.status}`
          );
        }

        const result = await response.json();

        if (!mountedRef.current) {
          return { success: true, result: result.result };
        }

        // If the action returns updated state, apply it
        if (result.state) {
          setState((prev) => ({ ...prev, ...result.state }));
          stateRef.current = { ...stateRef.current, ...result.state };
          // Auto-save the new state
          scheduleAutoSave();
        }

        // Extract cascaded elements for visual feedback
        const cascadedElements = result.result?.data?.cascadedElements as string[] | undefined;

        // Trigger cascade callback for visual feedback (if elements were affected)
        if (cascadedElements && cascadedElements.length > 0 && onCascade) {
          onCascade(cascadedElements);
        }

        return {
          success: true,
          result: result.result,
          state: result.state,
          cascadedElements,
        };
      } catch (err) {
        console.error("Action execution failed:", err);
        const error = err instanceof Error ? err : new Error("Action failed");

        if (mountedRef.current) {
          setError(error);
        }

        return {
          success: false,
          error: error.message,
        };
      } finally {
        if (mountedRef.current) {
          setIsExecuting(false);
        }
      }
    },
    [toolId, effectiveDeploymentId, spaceId, scheduleAutoSave, onCascade]
  );

  // ============================================================================
  // State Management
  // ============================================================================

  const updateState = useCallback(
    (updates: Partial<ToolState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates };
        stateRef.current = newState;
        return newState;
      });
      scheduleAutoSave();
    },
    [scheduleAutoSave]
  );

  const setFullState = useCallback(
    (newState: ToolState) => {
      setState(newState);
      stateRef.current = newState;
      scheduleAutoSave();
    },
    [scheduleAutoSave]
  );

  const reset = useCallback(() => {
    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Reset to initial state
    setState(initialStateRef.current);
    stateRef.current = initialStateRef.current;
    setError(null);
    setIsSynced(true);
  }, []);

  const reload = useCallback(async () => {
    await loadToolAndState();
  }, [loadToolAndState]);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      // Clear pending auto-save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (!isSynced && effectiveDeploymentId) {
        // Fire and forget - component is unmounting
        void fetch(
          `/api/tools/state/${encodeURIComponent(effectiveDeploymentId)}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              state: stateRef.current,
              toolId,
              spaceId,
            }),
            keepalive: true, // Keep request alive even after page unload
          }
        ).catch(() => {
          // Ignore errors on unmount save
        });
      }
    };
  }, [isSynced, effectiveDeploymentId, toolId, spaceId]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    tool,
    state,         // Legacy: maps to userState for backward compatibility
    userState: state, // Per-user state (selections, participation, personal data)
    sharedState,   // Shared state visible to all users (counters, collections, timeline)
    isLoading,
    isExecuting,
    isSaving,
    isSynced,
    isRealtimeConnected, // Whether connected to RTDB for real-time updates
    lastSaved,
    error,
    executeAction,
    updateState,
    setState: setFullState,
    saveState,
    reset,
    reload,
  };
}

// ============================================================================
// Convenience Hook: Tool in Space Context
// ============================================================================

/**
 * Convenience hook for tools deployed in a space
 * Automatically generates the deployment ID from space and placement
 */
export function useSpaceTool(
  toolId: string,
  spaceId: string,
  placementId: string,
  options?: Partial<Omit<UseToolRuntimeOptions, "toolId" | "spaceId" | "placementId">>
) {
  return useToolRuntime({
    toolId,
    spaceId,
    placementId,
    ...options,
  });
}

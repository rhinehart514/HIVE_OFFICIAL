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

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { ToolSharedState, ToolConnection, DataTransform } from "@hive/core/client";
import { applyTransform, getValueAtPath } from "@hive/core/client";
import type { HiveRuntimeContext } from "@hive/core";
import {
  buildSpaceRuntimeContext,
  buildStandaloneRuntimeContext,
  buildPreviewRuntimeContext,
} from "@hive/core";
import { useToolStateRealtime } from "./use-tool-state-realtime";
import { useToolStateStream } from "./use-tool-state-stream";
import { logger } from '@/lib/logger';

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

export interface ToolElementConnection {
  from: { instanceId: string; output?: string; port?: string };
  to: { instanceId: string; input?: string; port?: string };
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  elements: ToolElement[];
  connections?: ToolElementConnection[];
  category?: string;
  version?: number;
  currentVersion?: number;
  status?: string; // draft, preview, published
  visibility?: 'private' | 'unlisted' | 'public';
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
  /** Space context for RuntimeContext injection */
  spaceContext?: {
    spaceName: string;
    campusId: string;
    handle: string | null;
  };
  /** Viewer context for RuntimeContext injection */
  viewerContext?: {
    userId: string;
    displayName?: string | null;
    role: 'owner' | 'admin' | 'leader' | 'moderator' | 'member' | 'guest';
    isMember: boolean;
  };
  /** Surface where the tool is rendered */
  surface?: 'sidebar' | 'inline' | 'modal' | 'tab' | 'standalone';
  /** Mode: 'runtime' for deployed tools, 'preview' for HiveLab preview */
  mode?: 'runtime' | 'preview';
}

interface UseToolRuntimeReturn {
  tool: Tool | null;
  /** @deprecated Use userState instead for per-user state */
  state: ToolState;
  /** Per-user state (selections, participation, personal data) */
  userState: ToolState;
  /** Shared state visible to all users (counters, collections, timeline) */
  sharedState: ToolSharedState;
  /** Runtime context for injection into tool iframes */
  runtimeContext: HiveRuntimeContext | null;
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
const ACTION_STATE_SYNC_DELAY = 300;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const CONNECTION_RESOLVE_TTL_MS = 300_000; // 5 minutes

interface CachedConnectionValue {
  value: unknown;
  resolvedAt: number;
}

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
 * Generate standalone deployment ID for tools without space context
 * Format: "standalone:{toolId}"
 */
function generateStandaloneDeploymentId(toolId: string): string {
  return `standalone:${toolId}`;
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
    spaceContext,
    viewerContext,
    surface,
    mode = 'runtime',
  } = options;

  // Calculate effective deployment ID
  // Priority: providedDeploymentId > space context > standalone context
  const effectiveDeploymentId =
    providedDeploymentId ||
    (spaceId && placementId ? generateDeploymentId(spaceId, placementId) : null) ||
    (toolId ? generateStandaloneDeploymentId(toolId) : null);

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

  const streamEnabled = Boolean(toolId && spaceId && enabled);
  const personalStateStream = useToolStateStream<ToolState>({
    toolId: toolId || null,
    spaceId: spaceId || null,
    eventType: 'personal_state',
    enabled: streamEnabled,
    initialState: {},
  });
  const sharedStateStream = useToolStateStream<ToolSharedState>({
    toolId: toolId || null,
    spaceId: spaceId || null,
    eventType: 'shared_state',
    enabled: streamEnabled,
    initialState: EMPTY_SHARED_STATE,
    mergeState: (prev, incoming) => ({
      ...prev,
      ...(incoming as Partial<ToolSharedState>),
      counters: {
        ...prev.counters,
        ...((incoming.counters as Record<string, number> | undefined) || {}),
      },
      collections: {
        ...prev.collections,
        ...((incoming.collections as ToolSharedState['collections'] | undefined) || {}),
      },
      computed: {
        ...prev.computed,
        ...((incoming.computed as Record<string, unknown> | undefined) || {}),
      },
      timeline: Array.isArray(incoming.timeline)
        ? (incoming.timeline as ToolSharedState['timeline'])
        : prev.timeline,
    }),
  });

  // State
  const [tool, setTool] = useState<Tool | null>(null);
  const state = personalStateStream.state;
  const setState = personalStateStream.setState;
  const queueOptimisticStateWrite = personalStateStream.queueOptimisticWrite;
  const sharedState = sharedStateStream.state;
  const setSharedState = sharedStateStream.setState;
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSynced, setIsSynced] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const actionSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  useEffect(() => {
    const streamError = personalStateStream.error || sharedStateStream.error;
    if (streamError) {
      setError(streamError);
    }
  }, [personalStateStream.error, sharedStateStream.error]);

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
      setSharedState(EMPTY_SHARED_STATE);
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

      const normalizedConnections: ToolElementConnection[] = (
        toolData.connections ||
        toolData.config?.composition?.connections ||
        []
      ).map((conn: Record<string, unknown>) => {
        const from = (conn.from || {}) as Record<string, unknown>;
        const to = (conn.to || {}) as Record<string, unknown>;

        return {
          from: {
            instanceId: String(from.instanceId || ''),
            output:
              typeof from.output === 'string'
                ? from.output
                : typeof from.port === 'string'
                  ? from.port
                  : undefined,
            port: typeof from.port === 'string' ? from.port : undefined,
          },
          to: {
            instanceId: String(to.instanceId || ''),
            input:
              typeof to.input === 'string'
                ? to.input
                : typeof to.port === 'string'
                  ? to.port
                  : undefined,
            port: typeof to.port === 'string' ? to.port : undefined,
          },
        };
      });

      setTool({
        id: toolData.id,
        name: toolData.name,
        description: toolData.description,
        elements: normalizedElements,
        connections: normalizedConnections,
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
      logger.error("Failed to load tool", err instanceof Error ? err : new Error(String(err)));
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
  // Resolve Cross-Tool Connections (Sprint 3)
  // ============================================================================

  const connectionCacheRef = useRef<Map<string, CachedConnectionValue>>(new Map());

  useEffect(() => {
    // Connections work in both space context and standalone context
    if (!tool || !effectiveDeploymentId || !enabled) return;

    let cancelled = false;

    async function resolveConnections() {
      try {
        // Fetch connections where this tool is the target
        const connResp = await fetch(
          `/api/tools/${effectiveDeploymentId}/connections`,
          { credentials: 'include' }
        );
        if (!connResp.ok || cancelled) return;

        const connData = await connResp.json();
        const connections: ToolConnection[] = connData.connections || [];

        // Filter to enabled incoming connections only
        const incoming = connections.filter(
          (c) => c.enabled && c.target.deploymentId === effectiveDeploymentId
        );
        if (incoming.length === 0) return;

        // Group by source deployment to batch-fetch shared states
        const sourceDeployments = new Map<string, ToolConnection[]>();
        for (const conn of incoming) {
          const existing = sourceDeployments.get(conn.source.deploymentId) || [];
          existing.push(conn);
          sourceDeployments.set(conn.source.deploymentId, existing);
        }

        // Resolve source values
        const resolvedUpdates: Array<{
          elementId: string;
          inputPath: string;
          value: unknown;
        }> = [];

        const now = Date.now();

        await Promise.all(
          Array.from(sourceDeployments.entries()).map(
            async ([sourceDeploymentId, conns]) => {
              // Check cache first - if all connections from this source are cached, skip fetch
              const allCached = conns.every((c) => {
                const cacheKey = `${c.source.deploymentId}:${c.source.path}`;
                const cached = connectionCacheRef.current.get(cacheKey);
                return cached && now - cached.resolvedAt < CONNECTION_RESOLVE_TTL_MS;
              });

              let sourceSharedState: Record<string, unknown> | null = null;

              if (!allCached) {
                try {
                  // Fetch source tool's shared state
                  // We need the toolId from the deployment - extract from the deploymentId
                  // or fetch the with-state endpoint using the deployment
                  const stateResp = await fetch(
                    `/api/tools/state/${encodeURIComponent(sourceDeploymentId)}`,
                    { credentials: 'include' }
                  );
                  if (stateResp.ok) {
                    const stateData = await stateResp.json();
                    sourceSharedState = stateData.data?.state || stateData.state || {};
                  }
                } catch {
                  // Source tool state fetch failed - skip these connections
                  return;
                }
              }

              if (cancelled) return;

              for (const conn of conns) {
                const cacheKey = `${conn.source.deploymentId}:${conn.source.path}`;
                const cached = connectionCacheRef.current.get(cacheKey);

                let rawValue: unknown;

                if (cached && now - cached.resolvedAt < CONNECTION_RESOLVE_TTL_MS) {
                  rawValue = cached.value;
                } else if (sourceSharedState) {
                  rawValue = getValueAtPath(sourceSharedState, conn.source.path);
                  // Cache the resolved value
                  connectionCacheRef.current.set(cacheKey, {
                    value: rawValue,
                    resolvedAt: now,
                  });
                } else {
                  continue;
                }

                const transformedValue = applyTransform(
                  rawValue,
                  conn.transform as DataTransform | undefined
                );

                resolvedUpdates.push({
                  elementId: conn.target.elementId,
                  inputPath: conn.target.inputPath,
                  value: transformedValue,
                });
              }
            }
          )
        );

        if (cancelled || resolvedUpdates.length === 0) return;

        // Inject resolved values into element configs
        setTool((prev) => {
          if (!prev) return prev;

          const updatedElements = prev.elements.map((el) => {
            const updates = resolvedUpdates.filter(
              (u) => u.elementId === el.instanceId || u.elementId === el.elementId
            );
            if (updates.length === 0) return el;

            const config = { ...el.config };
            for (const update of updates) {
              // Set value at the input path in config
              const parts = update.inputPath.split('.');
              if (parts.length === 1) {
                config[parts[0]] = update.value;
              } else {
                // Deep set for nested paths
                let current: Record<string, unknown> = config;
                for (let i = 0; i < parts.length - 1; i++) {
                  if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
                    current[parts[i]] = {};
                  }
                  current[parts[i]] = { ...(current[parts[i]] as Record<string, unknown>) };
                  current = current[parts[i]] as Record<string, unknown>;
                }
                current[parts[parts.length - 1]] = update.value;
              }
            }

            return { ...el, config };
          });

          return { ...prev, elements: updatedElements };
        });
      } catch {
        // Connection resolution is best-effort - don't fail the tool
        logger.warn('[useToolRuntime] Connection resolution failed');
      }
    }

    void resolveConnections();

    return () => {
      cancelled = true;
    };
  }, [tool?.id, effectiveDeploymentId, enabled]);

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
    if (actionSyncTimeoutRef.current) {
      clearTimeout(actionSyncTimeoutRef.current);
      actionSyncTimeoutRef.current = null;
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
            ...(spaceId && { spaceId }),
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
    } catch {
      if (mountedRef.current) {
        setIsSynced(false);
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [effectiveDeploymentId, toolId, spaceId]);

  const persistOptimisticState = useCallback(async (nextState: ToolState) => {
    if (!effectiveDeploymentId) {
      return;
    }

    const response = await fetchWithRetry(
      `/api/tools/state/${encodeURIComponent(effectiveDeploymentId)}`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: nextState,
          toolId,
          ...(spaceId && { spaceId }),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to save state: ${response.status}`);
    }

    if (mountedRef.current) {
      setLastSaved(new Date());
      setIsSynced(true);
      initialStateRef.current = { ...nextState };
    }
  }, [effectiveDeploymentId, toolId, spaceId]);

  // ============================================================================
  // Action State Sync (Task 3: explicit Firestore persistence after actions)
  // ============================================================================

  const syncActionStateToFirestore = useCallback(async () => {
    if (!toolId || !spaceId) return;

    const personalStatePayload = {
      spaceId,
      scope: "personal" as const,
      state: stateRef.current as Record<string, unknown>,
    };

    const sharedStatePayload = {
      spaceId,
      scope: "shared" as const,
      state: sharedStateRef.current as unknown as Record<string, unknown>,
    };

    const [personalResponse, sharedResponse] = await Promise.all([
      fetchWithRetry(`/api/tools/${encodeURIComponent(toolId)}/state`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personalStatePayload),
      }),
      fetchWithRetry(`/api/tools/${encodeURIComponent(toolId)}/state`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sharedStatePayload),
      }),
    ]);

    if (!personalResponse.ok || !sharedResponse.ok) {
      throw new Error("Failed to persist action state");
    }

    if (mountedRef.current) {
      setLastSaved(new Date());
      setIsSynced(true);
    }
  }, [toolId, spaceId]);

  const scheduleActionStateSync = useCallback(() => {
    if (!toolId || !spaceId) return;

    if (actionSyncTimeoutRef.current) {
      clearTimeout(actionSyncTimeoutRef.current);
    }

    setIsSynced(false);
    actionSyncTimeoutRef.current = setTimeout(() => {
      void syncActionStateToFirestore().catch(() => {
        if (mountedRef.current) {
          setIsSynced(false);
        }
      });
    }, ACTION_STATE_SYNC_DELAY);
  }, [toolId, spaceId, syncActionStateToFirestore]);

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
            ...(spaceId && { spaceId }),
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

        // Extract the execution result (API returns { result: executionResult, ... })
        const executionResult = result.result || {};
        let shouldSyncActionState = false;

        // ==========================================================================
        // Handle SharedStateUpdate (aggregate data like vote counts, RSVP lists)
        // ==========================================================================
        const sharedStateUpdate = executionResult.sharedStateUpdate;
        if (sharedStateUpdate) {
          shouldSyncActionState = true;
          setSharedState((prev) => {
            const updated = { ...prev };

            // Apply counter deltas
            if (sharedStateUpdate.counterDeltas) {
              updated.counters = { ...updated.counters };
              for (const [key, delta] of Object.entries(sharedStateUpdate.counterDeltas)) {
                const currentValue = updated.counters[key] || 0;
                updated.counters[key] = currentValue + (delta as number);
              }
            }

            // Apply collection upserts
            if (sharedStateUpdate.collectionUpserts) {
              updated.collections = { ...updated.collections };
              for (const [collectionKey, entities] of Object.entries(sharedStateUpdate.collectionUpserts)) {
                // Type assertion: entities from API matches ToolSharedEntity structure
                const typedEntities = entities as Record<string, {
                  id: string;
                  createdAt: string;
                  createdBy: string;
                  updatedAt?: string;
                  data: Record<string, unknown>;
                }>;
                updated.collections[collectionKey] = {
                  ...(updated.collections[collectionKey] || {}),
                  ...typedEntities,
                };
              }
            }

            // Apply collection deletes
            if (sharedStateUpdate.collectionDeletes) {
              updated.collections = { ...updated.collections };
              for (const [collectionKey, idsToDelete] of Object.entries(sharedStateUpdate.collectionDeletes)) {
                if (updated.collections[collectionKey]) {
                  const collection = { ...updated.collections[collectionKey] };
                  for (const id of idsToDelete as string[]) {
                    delete collection[id];
                  }
                  updated.collections[collectionKey] = collection;
                }
              }
            }

            // Append timeline events
            if (sharedStateUpdate.timelineAppend) {
              updated.timeline = [
                ...updated.timeline,
                ...(sharedStateUpdate.timelineAppend as typeof updated.timeline),
              ].slice(-100); // Keep last 100 events
            }

            // Apply computed updates
            if (sharedStateUpdate.computedUpdates) {
              updated.computed = {
                ...updated.computed,
                ...(sharedStateUpdate.computedUpdates as Record<string, unknown>),
              };
            }

            updated.version = (updated.version || 0) + 1;
            updated.lastModified = new Date().toISOString();
            sharedStateRef.current = updated;
            return updated;
          });
        }

        // ==========================================================================
        // Handle UserStateUpdate (per-user data like selections, participation)
        // ==========================================================================
        const userStateUpdate = executionResult.userStateUpdate;
        if (userStateUpdate) {
          shouldSyncActionState = true;
          setState((prev) => {
            const updated = { ...prev };

            // Merge selections
            if (userStateUpdate.selections) {
              updated.selections = {
                ...(updated.selections as Record<string, unknown> || {}),
                ...userStateUpdate.selections,
              };
            }

            // Merge participation flags
            if (userStateUpdate.participation) {
              updated.participation = {
                ...(updated.participation as Record<string, boolean> || {}),
                ...userStateUpdate.participation,
              };
            }

            // Merge personal data
            if (userStateUpdate.personal) {
              updated.personal = {
                ...(updated.personal as Record<string, unknown> || {}),
                ...userStateUpdate.personal,
              };
            }

            stateRef.current = updated;
            return updated;
          });
          scheduleAutoSave();
        }

        // ==========================================================================
        // Handle legacy state updates (backward compatibility)
        // ==========================================================================
        const legacyState = executionResult.state || result.state;
        if (legacyState && !userStateUpdate) {
          shouldSyncActionState = true;
          setState((prev) => ({ ...prev, ...legacyState }));
          stateRef.current = { ...stateRef.current, ...legacyState };
          scheduleAutoSave();
        }

        if (shouldSyncActionState) {
          scheduleActionStateSync();
        }

        // Extract cascaded elements for visual feedback
        const cascadedElements = executionResult.data?.cascadedElements as string[] | undefined;

        // Trigger cascade callback for visual feedback (if elements were affected)
        if (cascadedElements && cascadedElements.length > 0 && onCascade) {
          onCascade(cascadedElements);
        }

        return {
          success: true,
          result: executionResult,
          state: legacyState || userStateUpdate,
          cascadedElements,
        };
      } catch (err) {
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
    [toolId, effectiveDeploymentId, spaceId, scheduleAutoSave, scheduleActionStateSync, onCascade]
  );

  // ============================================================================
  // State Management
  // ============================================================================

  const updateState = useCallback(
    (updates: Partial<ToolState>) => {
      const previousState = stateRef.current;
      const nextState = { ...previousState, ...updates };
      stateRef.current = nextState;

      if (effectiveDeploymentId) {
        setIsSynced(false);
        void queueOptimisticStateWrite(nextState, async () => {
            await persistOptimisticState(nextState);
          }, previousState)
          .catch(() => {
            if (mountedRef.current) {
              setIsSynced(false);
            }
          });
        return;
      }

      setState(nextState);
      scheduleAutoSave();
    },
    [effectiveDeploymentId, persistOptimisticState, queueOptimisticStateWrite, scheduleAutoSave, setState]
  );

  const setFullState = useCallback(
    (newState: ToolState) => {
      const previousState = stateRef.current;
      stateRef.current = newState;
      if (effectiveDeploymentId) {
        setIsSynced(false);
        void queueOptimisticStateWrite(newState, async () => {
            await persistOptimisticState(newState);
          }, previousState)
          .catch(() => {
            if (mountedRef.current) {
              setIsSynced(false);
            }
          });
        return;
      }

      setState(newState);
      scheduleAutoSave();
    },
    [effectiveDeploymentId, persistOptimisticState, queueOptimisticStateWrite, scheduleAutoSave, setState]
  );

  const reset = useCallback(() => {
    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (actionSyncTimeoutRef.current) {
      clearTimeout(actionSyncTimeoutRef.current);
      actionSyncTimeoutRef.current = null;
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

      if (actionSyncTimeoutRef.current) {
        clearTimeout(actionSyncTimeoutRef.current);
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
              ...(spaceId && { spaceId }),
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
  // Runtime Context
  // ============================================================================

  const runtimeContext = useMemo((): HiveRuntimeContext | null => {
    if (!tool || !effectiveDeploymentId) return null;

    if (mode === 'preview') {
      return buildPreviewRuntimeContext({
        toolId: tool.id,
        toolVersion: tool.version != null ? String(tool.version) : null,
        viewerId: viewerContext?.userId ?? 'preview-user',
      });
    }

    if (spaceId && spaceContext && viewerContext) {
      return buildSpaceRuntimeContext({
        space: {
          spaceId,
          spaceName: spaceContext.spaceName,
          campusId: spaceContext.campusId,
          handle: spaceContext.handle,
        },
        deployment: {
          deploymentId: effectiveDeploymentId,
          surface: surface ?? 'sidebar',
          stateMode: effectiveDeploymentId.startsWith('tool:') ? 'shared' : 'isolated',
          toolId: tool.id,
          toolVersion: tool.version != null ? String(tool.version) : null,
        },
        viewer: viewerContext,
      });
    }

    return buildStandaloneRuntimeContext({
      toolId: tool.id,
      toolVersion: tool.version != null ? String(tool.version) : null,
      viewerId: viewerContext?.userId ?? 'anonymous',
    });
  }, [tool, effectiveDeploymentId, mode, spaceId, spaceContext, viewerContext, surface]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    tool,
    state,         // Legacy: maps to userState for backward compatibility
    userState: state, // Per-user state (selections, participation, personal data)
    sharedState,   // Shared state visible to all users (counters, collections, timeline)
    runtimeContext,
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
// Convenience Hooks
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

/**
 * Convenience hook for standalone tools (not deployed in a space)
 * Uses standalone:{toolId} deployment context for state isolation
 */
export function useStandaloneTool(
  toolId: string,
  options?: Partial<Omit<UseToolRuntimeOptions, "toolId" | "spaceId" | "placementId">>
) {
  return useToolRuntime({
    toolId,
    ...options,
  });
}

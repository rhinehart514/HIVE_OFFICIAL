"use client";

import { useCallback, useEffect, useState, useRef } from 'react';
import { secureApiFetch } from '@/lib/secure-auth-utils';

// Types for tool runtime
export interface ToolElement {
  elementId: string;
  instanceId: string;
  config: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  status: string;
  elements?: ToolElement[];
  currentVersion?: string;
  ownerId?: string;
  category?: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ToolDeployment {
  deploymentId: string;
  toolId: string;
  name: string;
  status: string;
  configuration?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
  usageCount?: number;
}

export interface ToolState {
  state: Record<string, unknown>;
  metadata?: {
    version: string;
    lastSaved: string | null;
    autoSave: boolean;
    size: number;
  };
  exists: boolean;
}

export interface ExecuteActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  feedContent?: {
    type: 'post' | 'update' | 'achievement';
    content: string;
  };
  state?: Record<string, unknown>;
}

export interface UseToolRuntimeOptions {
  toolId: string;
  spaceId?: string;
  deploymentId?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface UseToolRuntimeReturn {
  // Data
  tool: Tool | null;
  deployment: ToolDeployment | null;
  state: Record<string, unknown>;

  // Loading states
  isLoading: boolean;
  isExecuting: boolean;
  isSaving: boolean;

  // Sync status
  isSynced: boolean;
  lastSaved: Date | null;

  // Errors
  error: string | null;

  // Actions
  executeAction: (action: string, elementId?: string, data?: Record<string, unknown>) => Promise<ExecuteActionResult>;
  updateState: (elementId: string, data: unknown) => void;
  saveState: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useToolRuntime(options: UseToolRuntimeOptions): UseToolRuntimeReturn {
  const { toolId, spaceId, deploymentId: providedDeploymentId, autoSave = true, autoSaveDelay = 2000 } = options;

  // Core state
  const [tool, setTool] = useState<Tool | null>(null);
  const [deployment, setDeployment] = useState<ToolDeployment | null>(null);
  const [state, setState] = useState<Record<string, unknown>>({});

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync status
  const [isSynced, setIsSynced] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Errors
  const [error, setError] = useState<string | null>(null);

  // Refs for debouncing and tracking
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStateRef = useRef<Record<string, unknown>>({});
  const deploymentIdRef = useRef<string | null>(null);

  // Fetch tool definition
  const fetchTool = useCallback(async (): Promise<Tool> => {
    const res = await secureApiFetch(`/api/tools/${toolId}`);
    if (!res.ok) {
      // Preserve the status code in the error message for auth detection
      throw new Error(`Failed to fetch tool: ${res.status}`);
    }
    const response = await res.json();
    const data = response.data || response;
    return data as Tool;
  }, [toolId]);

  // Fetch deployment for this tool in a space
  const fetchDeployment = useCallback(async (): Promise<ToolDeployment | null> => {
    // If we have a provided deploymentId, use that
    if (providedDeploymentId) {
      deploymentIdRef.current = providedDeploymentId;
      return {
        deploymentId: providedDeploymentId,
        toolId,
        name: '',
        status: 'active',
      };
    }

    // Otherwise, find deployment by querying space tools
    if (!spaceId) {
      return null;
    }

    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}/tools?status=active`);
      if (!res.ok) {
        return null;
      }
      const response = await res.json();
      const data = response.data || response;
      const tools = data.tools || [];

      // Find the deployment for this specific tool
      const toolDeployment = tools.find((t: ToolDeployment) => t.toolId === toolId);
      if (toolDeployment) {
        deploymentIdRef.current = toolDeployment.deploymentId;
        return toolDeployment;
      }

      return null;
    } catch (e) {
      console.error('Error fetching deployment:', e);
      return null;
    }
  }, [toolId, spaceId, providedDeploymentId]);

  // Fetch state for the deployment
  const fetchState = useCallback(async (): Promise<ToolState | null> => {
    const depId = deploymentIdRef.current;
    if (!depId) {
      return null;
    }

    try {
      const res = await secureApiFetch(`/api/tools/state/${depId}`);
      if (!res.ok) {
        // 404 means no state yet, which is fine
        if (res.status === 404) {
          return { state: {}, exists: false };
        }
        return null;
      }
      const response = await res.json();
      const data = response.data || response;
      return data as ToolState;
    } catch (e) {
      console.error('Error fetching state:', e);
      return null;
    }
  }, []);

  // Save state to server
  const saveState = useCallback(async (): Promise<boolean> => {
    const depId = deploymentIdRef.current;
    if (!depId) {
      return false;
    }

    setIsSaving(true);
    try {
      const res = await secureApiFetch(`/api/tools/state/${depId}`, {
        method: 'PUT',
        body: JSON.stringify({
          state: pendingStateRef.current,
          metadata: { autoSave: true },
          merge: true,
        }),
      });

      if (res.ok) {
        setIsSynced(true);
        setLastSaved(new Date());
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error saving state:', e);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Update local state (with auto-save)
  const updateState = useCallback((elementId: string, data: unknown) => {
    setState(prev => {
      const newState = { ...prev, [elementId]: data };
      pendingStateRef.current = newState;
      return newState;
    });
    setIsSynced(false);

    // Debounced auto-save
    if (autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        void saveState();
      }, autoSaveDelay);
    }
  }, [autoSave, autoSaveDelay, saveState]);

  // Execute a tool action
  const executeAction = useCallback(async (
    action: string,
    elementId?: string,
    data?: Record<string, unknown>
  ): Promise<ExecuteActionResult> => {
    const depId = deploymentIdRef.current;
    if (!depId) {
      return { success: false, error: 'No deployment found' };
    }

    setIsExecuting(true);
    try {
      const res = await secureApiFetch('/api/tools/execute', {
        method: 'POST',
        body: JSON.stringify({
          deploymentId: depId,
          action,
          elementId,
          data,
          context: { spaceId },
        }),
      });

      const response = await res.json();
      const result = response.data || response;

      if (!res.ok) {
        return { success: false, error: result.message || 'Execution failed' };
      }

      // Update local state if server returned new state
      if (result.state) {
        setState(prev => ({ ...prev, ...result.state }));
        pendingStateRef.current = { ...pendingStateRef.current, ...result.state };
      }

      return {
        success: true,
        data: result.data,
        feedContent: result.feedContent,
        state: result.state,
      };
    } catch (e) {
      console.error('Error executing action:', e);
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    } finally {
      setIsExecuting(false);
    }
  }, [spaceId]);

  // Load all data
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch tool first (will throw on error)
      const toolData = await fetchTool();
      setTool(toolData);

      // Fetch deployment
      const deploymentData = await fetchDeployment();
      setDeployment(deploymentData);

      // Fetch state if we have a deployment
      if (deploymentIdRef.current) {
        const stateData = await fetchState();
        if (stateData) {
          setState(stateData.state);
          pendingStateRef.current = stateData.state;
          setIsSynced(true);
          if (stateData.metadata?.lastSaved) {
            setLastSaved(new Date(stateData.metadata.lastSaved));
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tool');
    } finally {
      setIsLoading(false);
    }
  }, [fetchTool, fetchDeployment, fetchState]);

  // Refresh function
  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  // Initial load
  useEffect(() => {
    void load();
  }, [load]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    tool,
    deployment,
    state,
    isLoading,
    isExecuting,
    isSaving,
    isSynced,
    lastSaved,
    error,
    executeAction,
    updateState,
    saveState,
    refresh,
  };
}

"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { secureApiFetch } from "@/lib/secure-auth-utils";

/**
 * Space Structure Hook
 *
 * Fetches and manages the complete space structure (tabs + widgets)
 * from the DDD backend APIs. Provides optimistic updates with rollback.
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

// ============================================================
// Types
// ============================================================

export interface SpaceTab {
  id: string;
  name: string;
  type: "feed" | "widget" | "resource" | "custom";
  order: number;
  isDefault: boolean;
  isVisible: boolean;
  widgetIds: string[];
}

export interface SpaceWidget {
  id: string;
  type: "calendar" | "poll" | "links" | "files" | "rss" | "custom";
  title: string;
  config: Record<string, unknown>;
  order: number;
  isEnabled: boolean;
  isVisible: boolean;
}

export interface SpacePermissions {
  canEditStructure: boolean;
  canAddTabs: boolean;
  canAddWidgets: boolean;
}

export interface SpaceStructure {
  spaceId: string;
  tabs: SpaceTab[];
  widgets: SpaceWidget[];
  settings: {
    allowRSS: boolean;
  };
  permissions: SpacePermissions;
}

export interface AddTabInput {
  name: string;
  type: SpaceTab["type"];
  order?: number;
  isVisible?: boolean;
}

export interface UpdateTabInput {
  name?: string;
  order?: number;
  isVisible?: boolean;
}

export interface AddWidgetInput {
  type: SpaceWidget["type"];
  title: string;
  config?: Record<string, unknown>;
}

export interface UpdateWidgetInput {
  title?: string;
  config?: Record<string, unknown>;
  order?: number;
  isVisible?: boolean;
  isEnabled?: boolean;
}

interface OperationResult {
  op: string;
  success: boolean;
  entityId?: string;
  error?: string;
}

interface BatchResult {
  applied: number;
  total: number;
  results: OperationResult[];
}

// ============================================================
// Hook
// ============================================================

export function useSpaceStructure(spaceId?: string) {
  const [structure, setStructure] = useState<SpaceStructure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  // Derived state
  const tabs = useMemo(() => structure?.tabs ?? [], [structure]);
  const widgets = useMemo(() => structure?.widgets ?? [], [structure]);
  const permissions = useMemo(() => structure?.permissions ?? null, [structure]);
  const canEdit = useMemo(() => permissions?.canEditStructure ?? false, [permissions]);

  /**
   * Load structure from API
   */
  const load = useCallback(async () => {
    if (!spaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}/structure`);
      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`${res.status}: ${errorText}`);
      }

      const response = await res.json();
      const data: SpaceStructure = response.data || response;
      setStructure(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load structure");
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  /**
   * Execute batch operations via PATCH endpoint
   */
  const executeBatch = useCallback(
    async (
      operations: Array<{ op: string; [key: string]: unknown }>
    ): Promise<BatchResult | null> => {
      if (!spaceId || !canEdit) return null;

      setIsMutating(true);
      setError(null);

      try {
        const res = await secureApiFetch(`/api/spaces/${spaceId}/structure`, {
          method: "PATCH",
          body: JSON.stringify({ operations }),
        });

        const response = await res.json();

        if (!res.ok || !response.success) {
          throw new Error(response.error || "Batch operation failed");
        }

        // Update structure with new state from server
        if (response.data) {
          setStructure(response.data);
        }

        return response.operations as BatchResult;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update structure");
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [spaceId, canEdit]
  );

  // ============================================================
  // Tab Operations
  // ============================================================

  /**
   * Add a new tab
   */
  const addTab = useCallback(
    async (input: AddTabInput): Promise<string | null> => {
      if (!structure) return null;

      // Optimistic update
      const tempId = `temp-tab-${Date.now()}`;
      const newTab: SpaceTab = {
        id: tempId,
        name: input.name,
        type: input.type,
        order: input.order ?? structure.tabs.length,
        isDefault: false,
        isVisible: input.isVisible ?? true,
        widgetIds: [],
      };

      setStructure((prev) =>
        prev ? { ...prev, tabs: [...prev.tabs, newTab] } : prev
      );

      const result = await executeBatch([
        { op: "addTab", data: input },
      ]);

      if (!result || !result.results[0]?.success) {
        // Revert optimistic update
        setStructure((prev) =>
          prev
            ? { ...prev, tabs: prev.tabs.filter((t) => t.id !== tempId) }
            : prev
        );
        return null;
      }

      return result.results[0].entityId ?? null;
    },
    [structure, executeBatch]
  );

  /**
   * Update an existing tab
   */
  const updateTab = useCallback(
    async (tabId: string, updates: UpdateTabInput): Promise<boolean> => {
      if (!structure) return false;

      // Store previous state for rollback
      const previousTabs = [...structure.tabs];

      // Optimistic update
      setStructure((prev) =>
        prev
          ? {
              ...prev,
              tabs: prev.tabs.map((t) =>
                t.id === tabId ? { ...t, ...updates } : t
              ),
            }
          : prev
      );

      const result = await executeBatch([
        { op: "updateTab", tabId, data: updates },
      ]);

      if (!result || !result.results[0]?.success) {
        // Revert optimistic update
        setStructure((prev) => (prev ? { ...prev, tabs: previousTabs } : prev));
        return false;
      }

      return true;
    },
    [structure, executeBatch]
  );

  /**
   * Remove a tab
   */
  const removeTab = useCallback(
    async (tabId: string): Promise<boolean> => {
      if (!structure) return false;

      // Prevent removing default tab
      const tab = structure.tabs.find((t) => t.id === tabId);
      if (tab?.isDefault) {
        setError("Cannot remove the default tab");
        return false;
      }

      // Store previous state for rollback
      const previousTabs = [...structure.tabs];

      // Optimistic update
      setStructure((prev) =>
        prev
          ? { ...prev, tabs: prev.tabs.filter((t) => t.id !== tabId) }
          : prev
      );

      const result = await executeBatch([{ op: "removeTab", tabId }]);

      if (!result || !result.results[0]?.success) {
        // Revert optimistic update
        setStructure((prev) => (prev ? { ...prev, tabs: previousTabs } : prev));
        return false;
      }

      return true;
    },
    [structure, executeBatch]
  );

  /**
   * Reorder tabs
   */
  const reorderTabs = useCallback(
    async (orderedIds: string[]): Promise<boolean> => {
      if (!structure) return false;

      // Store previous state for rollback
      const previousTabs = [...structure.tabs];

      // Optimistic update - reorder tabs based on new order
      setStructure((prev) => {
        if (!prev) return prev;
        const reordered = orderedIds
          .map((id, index) => {
            const tab = prev.tabs.find((t) => t.id === id);
            return tab ? { ...tab, order: index } : null;
          })
          .filter(Boolean) as SpaceTab[];
        return { ...prev, tabs: reordered };
      });

      const result = await executeBatch([{ op: "reorderTabs", order: orderedIds }]);

      if (!result || !result.results[0]?.success) {
        // Revert optimistic update
        setStructure((prev) => (prev ? { ...prev, tabs: previousTabs } : prev));
        return false;
      }

      return true;
    },
    [structure, executeBatch]
  );

  // ============================================================
  // Widget Operations
  // ============================================================

  /**
   * Add a new widget
   */
  const addWidget = useCallback(
    async (input: AddWidgetInput): Promise<string | null> => {
      if (!structure) return null;

      // Optimistic update
      const tempId = `temp-widget-${Date.now()}`;
      const newWidget: SpaceWidget = {
        id: tempId,
        type: input.type,
        title: input.title,
        config: input.config ?? {},
        order: structure.widgets.length,
        isEnabled: true,
        isVisible: true,
      };

      setStructure((prev) =>
        prev ? { ...prev, widgets: [...prev.widgets, newWidget] } : prev
      );

      const result = await executeBatch([
        { op: "addWidget", data: input },
      ]);

      if (!result || !result.results[0]?.success) {
        // Revert optimistic update
        setStructure((prev) =>
          prev
            ? { ...prev, widgets: prev.widgets.filter((w) => w.id !== tempId) }
            : prev
        );
        return null;
      }

      return result.results[0].entityId ?? null;
    },
    [structure, executeBatch]
  );

  /**
   * Update an existing widget
   */
  const updateWidget = useCallback(
    async (widgetId: string, updates: UpdateWidgetInput): Promise<boolean> => {
      if (!structure) return false;

      // Store previous state for rollback
      const previousWidgets = [...structure.widgets];

      // Optimistic update
      setStructure((prev) =>
        prev
          ? {
              ...prev,
              widgets: prev.widgets.map((w) =>
                w.id === widgetId ? { ...w, ...updates } : w
              ),
            }
          : prev
      );

      const result = await executeBatch([
        { op: "updateWidget", widgetId, data: updates },
      ]);

      if (!result || !result.results[0]?.success) {
        // Revert optimistic update
        setStructure((prev) =>
          prev ? { ...prev, widgets: previousWidgets } : prev
        );
        return false;
      }

      return true;
    },
    [structure, executeBatch]
  );

  /**
   * Remove a widget
   */
  const removeWidget = useCallback(
    async (widgetId: string): Promise<boolean> => {
      if (!structure) return false;

      // Store previous state for rollback
      const previousWidgets = [...structure.widgets];

      // Optimistic update
      setStructure((prev) =>
        prev
          ? { ...prev, widgets: prev.widgets.filter((w) => w.id !== widgetId) }
          : prev
      );

      const result = await executeBatch([{ op: "removeWidget", widgetId }]);

      if (!result || !result.results[0]?.success) {
        // Revert optimistic update
        setStructure((prev) =>
          prev ? { ...prev, widgets: previousWidgets } : prev
        );
        return false;
      }

      return true;
    },
    [structure, executeBatch]
  );

  /**
   * Attach widget to tab
   */
  const attachWidgetToTab = useCallback(
    async (widgetId: string, tabId: string): Promise<boolean> => {
      if (!structure) return false;

      // Store previous state for rollback
      const previousTabs = [...structure.tabs];

      // Optimistic update
      setStructure((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tabs: prev.tabs.map((t) =>
            t.id === tabId && !t.widgetIds.includes(widgetId)
              ? { ...t, widgetIds: [...t.widgetIds, widgetId] }
              : t
          ),
        };
      });

      const result = await executeBatch([
        { op: "attachWidget", widgetId, tabId },
      ]);

      if (!result || !result.results[0]?.success) {
        // Revert optimistic update
        setStructure((prev) => (prev ? { ...prev, tabs: previousTabs } : prev));
        return false;
      }

      return true;
    },
    [structure, executeBatch]
  );

  /**
   * Detach widget from tab
   */
  const detachWidgetFromTab = useCallback(
    async (widgetId: string, tabId: string): Promise<boolean> => {
      if (!structure) return false;

      // Store previous state for rollback
      const previousTabs = [...structure.tabs];

      // Optimistic update
      setStructure((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tabs: prev.tabs.map((t) =>
            t.id === tabId
              ? { ...t, widgetIds: t.widgetIds.filter((id) => id !== widgetId) }
              : t
          ),
        };
      });

      const result = await executeBatch([
        { op: "detachWidget", widgetId, tabId },
      ]);

      if (!result || !result.results[0]?.success) {
        // Revert optimistic update
        setStructure((prev) => (prev ? { ...prev, tabs: previousTabs } : prev));
        return false;
      }

      return true;
    },
    [structure, executeBatch]
  );

  // ============================================================
  // Helpers
  // ============================================================

  /**
   * Get widgets for a specific tab
   */
  const getWidgetsForTab = useCallback(
    (tabId: string): SpaceWidget[] => {
      if (!structure) return [];
      const tab = structure.tabs.find((t) => t.id === tabId);
      if (!tab) return [];
      return tab.widgetIds
        .map((id) => structure.widgets.find((w) => w.id === id))
        .filter(Boolean) as SpaceWidget[];
    },
    [structure]
  );

  /**
   * Get the default tab
   */
  const defaultTab = useMemo(
    () => tabs.find((t) => t.isDefault) ?? tabs[0] ?? null,
    [tabs]
  );

  /**
   * Get visible tabs sorted by order
   */
  const visibleTabs = useMemo(
    () =>
      tabs
        .filter((t) => t.isVisible)
        .sort((a, b) => a.order - b.order),
    [tabs]
  );

  /**
   * Get enabled widgets sorted by order
   */
  const enabledWidgets = useMemo(
    () =>
      widgets
        .filter((w) => w.isEnabled && w.isVisible)
        .sort((a, b) => a.order - b.order),
    [widgets]
  );

  // Load on mount
  useEffect(() => {
    void load();
  }, [load]);

  return {
    // State
    structure,
    tabs,
    widgets,
    permissions,
    isLoading,
    isMutating,
    error,

    // Derived state
    defaultTab,
    visibleTabs,
    enabledWidgets,
    canEdit,

    // Tab operations
    addTab,
    updateTab,
    removeTab,
    reorderTabs,

    // Widget operations
    addWidget,
    updateWidget,
    removeWidget,
    attachWidgetToTab,
    detachWidgetFromTab,

    // Helpers
    getWidgetsForTab,
    reload: load,

    // Batch operations (for advanced use)
    executeBatch,
  };
}

export type UseSpaceStructureReturn = ReturnType<typeof useSpaceStructure>;

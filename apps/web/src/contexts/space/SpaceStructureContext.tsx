"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  useSpaceStructure,
  type SpaceTab,
  type SpaceWidget,
  type SpacePermissions,
  type AddTabInput,
  type UpdateTabInput,
  type AddWidgetInput,
  type UpdateWidgetInput,
} from "@/hooks/use-space-structure";
import { useSpaceMetadata } from "./SpaceMetadataContext";

/**
 * SpaceStructureContext
 *
 * Focused context for space tabs, widgets, and permissions.
 * Re-renders only when structure changes.
 */

// Re-export types for convenience
export type {
  SpaceTab,
  SpaceWidget,
  SpacePermissions,
  AddTabInput,
  UpdateTabInput,
  AddWidgetInput,
  UpdateWidgetInput,
};

// ============================================================
// Types
// ============================================================

export interface SpaceStructureContextValue {
  tabs: SpaceTab[];
  widgets: SpaceWidget[];
  permissions: SpacePermissions | null;
  visibleTabs: SpaceTab[];
  enabledWidgets: SpaceWidget[];
  defaultTab: SpaceTab | null;
  isStructureLoading: boolean;
  isMutating: boolean;
  structureError: string | null;
  canEdit: boolean;
  getWidgetsForTab: (tabId: string) => SpaceWidget[];
  reloadStructure: () => Promise<void>;
}

// ============================================================
// Context
// ============================================================

const SpaceStructureCtx = createContext<SpaceStructureContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

interface SpaceStructureProviderProps {
  children: ReactNode;
}

export function SpaceStructureProvider({ children }: SpaceStructureProviderProps) {
  const { spaceId } = useSpaceMetadata();

  const {
    tabs,
    widgets,
    permissions,
    visibleTabs,
    enabledWidgets,
    defaultTab,
    isLoading: isStructureLoading,
    isMutating,
    error: structureError,
    canEdit,
    getWidgetsForTab,
    reload: reloadStructure,
  } = useSpaceStructure(spaceId);

  const value = useMemo<SpaceStructureContextValue>(
    () => ({
      tabs,
      widgets,
      permissions,
      visibleTabs,
      enabledWidgets,
      defaultTab,
      isStructureLoading,
      isMutating,
      structureError,
      canEdit,
      getWidgetsForTab,
      reloadStructure,
    }),
    [
      tabs,
      widgets,
      permissions,
      visibleTabs,
      enabledWidgets,
      defaultTab,
      isStructureLoading,
      isMutating,
      structureError,
      canEdit,
      getWidgetsForTab,
      reloadStructure,
    ]
  );

  return (
    <SpaceStructureCtx.Provider value={value}>{children}</SpaceStructureCtx.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useSpaceStructureContext(): SpaceStructureContextValue {
  const ctx = useContext(SpaceStructureCtx);
  if (!ctx) {
    throw new Error("useSpaceStructureContext must be used within SpaceContextProvider");
  }
  return ctx;
}

export function useOptionalSpaceStructure(): SpaceStructureContextValue | null {
  return useContext(SpaceStructureCtx);
}

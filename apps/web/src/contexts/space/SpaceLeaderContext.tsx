"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { useSpaceMetadata, type SpaceDetailDTO } from "./SpaceMetadataContext";
import {
  useSpaceStructureContext,
  type AddTabInput,
  type UpdateTabInput,
  type AddWidgetInput,
  type UpdateWidgetInput,
} from "./SpaceStructureContext";
import { useSpaceStructure } from "@/hooks/use-space-structure";
import { secureApiFetch } from "@/lib/secure-auth-utils";

/**
 * SpaceLeaderContext
 *
 * Focused context for leader-only actions.
 * Only leaders subscribe to this context.
 */

// ============================================================
// Types
// ============================================================

export interface LeaderActions {
  // Tab operations
  addTab: (input: AddTabInput) => Promise<string | null>;
  updateTab: (tabId: string, updates: UpdateTabInput) => Promise<boolean>;
  removeTab: (tabId: string) => Promise<boolean>;
  reorderTabs: (orderedIds: string[]) => Promise<boolean>;

  // Widget operations
  addWidget: (input: AddWidgetInput) => Promise<string | null>;
  updateWidget: (widgetId: string, updates: UpdateWidgetInput) => Promise<boolean>;
  removeWidget: (widgetId: string) => Promise<boolean>;
  attachWidgetToTab: (widgetId: string, tabId: string) => Promise<boolean>;
  detachWidgetFromTab: (widgetId: string, tabId: string) => Promise<boolean>;

  // Space settings
  updateSpaceSettings: (settings: Partial<SpaceDetailDTO["settings"]>) => Promise<boolean>;
}

export interface SpaceLeaderContextValue {
  leaderActions: LeaderActions | null;
  isLeader: boolean;
  canEdit: boolean;
}

// ============================================================
// Context
// ============================================================

const SpaceLeaderCtx = createContext<SpaceLeaderContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

interface SpaceLeaderProviderProps {
  children: ReactNode;
}

export function SpaceLeaderProvider({ children }: SpaceLeaderProviderProps) {
  const { spaceId, membership, refresh: refreshMetadata } = useSpaceMetadata();
  const { canEdit } = useSpaceStructureContext();

  // Get structure actions from the hook
  const {
    addTab,
    updateTab,
    removeTab,
    reorderTabs,
    addWidget,
    updateWidget,
    removeWidget,
    attachWidgetToTab,
    detachWidgetFromTab,
  } = useSpaceStructure(spaceId);

  const updateSpaceSettings = useCallback(
    async (settings: Partial<SpaceDetailDTO["settings"]>): Promise<boolean> => {
      if (!membership.isLeader) return false;

      try {
        const res = await secureApiFetch(`/api/spaces/${spaceId}`, {
          method: "PATCH",
          body: JSON.stringify({ settings }),
        });

        if (res.ok) {
          await refreshMetadata();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [membership.isLeader, spaceId, refreshMetadata]
  );

  const leaderActions: LeaderActions | null = useMemo(() => {
    if (!membership.isLeader || !canEdit) return null;

    return {
      addTab,
      updateTab,
      removeTab,
      reorderTabs,
      addWidget,
      updateWidget,
      removeWidget,
      attachWidgetToTab,
      detachWidgetFromTab,
      updateSpaceSettings,
    };
  }, [
    membership.isLeader,
    canEdit,
    addTab,
    updateTab,
    removeTab,
    reorderTabs,
    addWidget,
    updateWidget,
    removeWidget,
    attachWidgetToTab,
    detachWidgetFromTab,
    updateSpaceSettings,
  ]);

  const value = useMemo<SpaceLeaderContextValue>(
    () => ({
      leaderActions,
      isLeader: membership.isLeader,
      canEdit,
    }),
    [leaderActions, membership.isLeader, canEdit]
  );

  return (
    <SpaceLeaderCtx.Provider value={value}>{children}</SpaceLeaderCtx.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useSpaceLeader(): SpaceLeaderContextValue {
  const ctx = useContext(SpaceLeaderCtx);
  if (!ctx) {
    throw new Error("useSpaceLeader must be used within SpaceContextProvider");
  }
  return ctx;
}

export function useOptionalSpaceLeader(): SpaceLeaderContextValue | null {
  return useContext(SpaceLeaderCtx);
}

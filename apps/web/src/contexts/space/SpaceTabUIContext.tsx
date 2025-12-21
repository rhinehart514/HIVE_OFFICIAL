"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useSpaceStructureContext, type SpaceTab, type SpaceWidget } from "./SpaceStructureContext";

/**
 * SpaceTabUIContext
 *
 * Focused context for active tab UI state.
 * This is the most frequently changing state - isolated to prevent cascading re-renders.
 */

// ============================================================
// Types
// ============================================================

export interface SpaceTabUIContextValue {
  activeTabId: string | null;
  setActiveTabId: (tabId: string) => void;
  activeTab: SpaceTab | null;
  activeTabWidgets: SpaceWidget[];
}

// ============================================================
// Context
// ============================================================

const SpaceTabUICtx = createContext<SpaceTabUIContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

interface SpaceTabUIProviderProps {
  children: ReactNode;
  initialTab?: string;
}

export function SpaceTabUIProvider({
  children,
  initialTab,
}: SpaceTabUIProviderProps) {
  const { tabs, defaultTab, getWidgetsForTab } = useSpaceStructureContext();
  const [activeTabId, setActiveTabId] = useState<string | null>(initialTab ?? null);

  // Derive active tab from ID
  const activeTab = useMemo(() => {
    if (!activeTabId) return defaultTab;
    return tabs.find((t) => t.id === activeTabId) ?? defaultTab;
  }, [activeTabId, tabs, defaultTab]);

  // Get widgets for active tab
  const activeTabWidgets = useMemo(() => {
    if (!activeTab) return [];
    return getWidgetsForTab(activeTab.id);
  }, [activeTab, getWidgetsForTab]);

  // Set default tab when structure loads
  useEffect(() => {
    if (!activeTabId && defaultTab) {
      setActiveTabId(defaultTab.id);
    }
  }, [activeTabId, defaultTab]);

  const value = useMemo<SpaceTabUIContextValue>(
    () => ({
      activeTabId,
      setActiveTabId,
      activeTab,
      activeTabWidgets,
    }),
    [activeTabId, activeTab, activeTabWidgets]
  );

  return (
    <SpaceTabUICtx.Provider value={value}>{children}</SpaceTabUICtx.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useSpaceTabUI(): SpaceTabUIContextValue {
  const ctx = useContext(SpaceTabUICtx);
  if (!ctx) {
    throw new Error("useSpaceTabUI must be used within SpaceContextProvider");
  }
  return ctx;
}

export function useOptionalSpaceTabUI(): SpaceTabUIContextValue | null {
  return useContext(SpaceTabUICtx);
}

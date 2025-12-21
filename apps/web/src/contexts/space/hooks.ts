"use client";

import { useMemo } from "react";
import {
  useSpaceMetadata,
  useOptionalSpaceMetadata,
  type SpaceMetadataContextValue,
  type SpaceDetailDTO,
  type SpaceMembership,
  type MemberRole,
} from "./SpaceMetadataContext";
import {
  useSpaceEvents,
  useOptionalSpaceEvents,
  type SpaceEventsContextValue,
  type SpaceEvent,
} from "./SpaceEventsContext";
import {
  useSpaceStructureContext,
  useOptionalSpaceStructure,
  type SpaceStructureContextValue,
  type SpaceTab,
  type SpaceWidget,
  type SpacePermissions,
} from "./SpaceStructureContext";
import {
  useSpaceTabUI,
  useOptionalSpaceTabUI,
  type SpaceTabUIContextValue,
} from "./SpaceTabUIContext";
import {
  useSpaceLeader,
  useOptionalSpaceLeader,
  type SpaceLeaderContextValue,
  type LeaderActions,
} from "./SpaceLeaderContext";

// Re-export types
export type {
  SpaceDetailDTO,
  SpaceMembership,
  MemberRole,
  SpaceEvent,
  SpaceTab,
  SpaceWidget,
  SpacePermissions,
  LeaderActions,
};

// Re-export focused hooks
export {
  useSpaceMetadata,
  useOptionalSpaceMetadata,
  useSpaceEvents,
  useOptionalSpaceEvents,
  useSpaceStructureContext,
  useOptionalSpaceStructure,
  useSpaceTabUI,
  useOptionalSpaceTabUI,
  useSpaceLeader,
  useOptionalSpaceLeader,
};

/**
 * Combined SpaceContextValue for backward compatibility
 *
 * @deprecated Use focused hooks instead:
 * - useSpaceMetadata() for space, membership, join/leave
 * - useSpaceEvents() for events
 * - useSpaceStructureContext() for tabs, widgets, permissions
 * - useSpaceTabUI() for activeTabId, setActiveTabId
 * - useSpaceLeader() for leaderActions
 */
export interface SpaceContextValue {
  // From SpaceMetadataContext
  space: SpaceDetailDTO | null;
  spaceId: string | null;
  membership: SpaceMembership;
  isLoading: boolean;
  error: string | null;
  joinSpace: () => Promise<boolean>;
  leaveSpace: () => Promise<boolean>;
  refresh: () => Promise<void>;

  // From SpaceEventsContext
  events: SpaceEvent[];
  isEventsLoading: boolean;

  // From SpaceStructureContext
  tabs: SpaceTab[];
  widgets: SpaceWidget[];
  permissions: SpacePermissions | null;
  visibleTabs: SpaceTab[];
  enabledWidgets: SpaceWidget[];
  defaultTab: SpaceTab | null;
  isStructureLoading: boolean;
  isMutating: boolean;
  getWidgetsForTab: (tabId: string) => SpaceWidget[];

  // From SpaceTabUIContext
  activeTabId: string | null;
  setActiveTabId: (tabId: string) => void;
  activeTab: SpaceTab | null;
  activeTabWidgets: SpaceWidget[];

  // From SpaceLeaderContext
  leaderActions: LeaderActions | null;
}

/**
 * useSpaceContext - Backward-compatible combined hook
 *
 * @deprecated Use focused hooks for better performance:
 * - useSpaceMetadata() - Only re-renders on space/membership changes
 * - useSpaceEvents() - Only re-renders on events changes
 * - useSpaceStructureContext() - Only re-renders on structure changes
 * - useSpaceTabUI() - Only re-renders on active tab changes
 * - useSpaceLeader() - Only re-renders when leader status changes
 *
 * This combined hook re-renders on ANY change to ANY context value.
 */
export function useSpaceContext(): SpaceContextValue {
  const metadata = useSpaceMetadata();
  const events = useSpaceEvents();
  const structure = useSpaceStructureContext();
  const tabUI = useSpaceTabUI();
  const leader = useSpaceLeader();

  // Combine all context values
  return useMemo<SpaceContextValue>(
    () => ({
      // Metadata
      space: metadata.space,
      spaceId: metadata.spaceId,
      membership: metadata.membership,
      isLoading: metadata.isLoading,
      error: metadata.error || structure.structureError,
      joinSpace: metadata.joinSpace,
      leaveSpace: metadata.leaveSpace,
      refresh: async () => {
        await Promise.allSettled([
          metadata.refresh(),
          events.refreshEvents(),
          structure.reloadStructure(),
        ]);
      },

      // Events
      events: events.events,
      isEventsLoading: events.isEventsLoading,

      // Structure
      tabs: structure.tabs,
      widgets: structure.widgets,
      permissions: structure.permissions,
      visibleTabs: structure.visibleTabs,
      enabledWidgets: structure.enabledWidgets,
      defaultTab: structure.defaultTab,
      isStructureLoading: structure.isStructureLoading,
      isMutating: structure.isMutating,
      getWidgetsForTab: structure.getWidgetsForTab,

      // Tab UI
      activeTabId: tabUI.activeTabId,
      setActiveTabId: tabUI.setActiveTabId,
      activeTab: tabUI.activeTab,
      activeTabWidgets: tabUI.activeTabWidgets,

      // Leader
      leaderActions: leader.leaderActions,
    }),
    [metadata, events, structure, tabUI, leader]
  );
}

/**
 * useOptionalSpaceContext - Optional combined hook
 *
 * Returns null if not inside SpaceContextProvider.
 *
 * @deprecated Use focused optional hooks instead.
 */
export function useOptionalSpaceContext(): SpaceContextValue | null {
  const metadata = useOptionalSpaceMetadata();
  const events = useOptionalSpaceEvents();
  const structure = useOptionalSpaceStructure();
  const tabUI = useOptionalSpaceTabUI();
  const leader = useOptionalSpaceLeader();

  if (!metadata || !events || !structure || !tabUI || !leader) {
    return null;
  }

  return {
    // Metadata
    space: metadata.space,
    spaceId: metadata.spaceId,
    membership: metadata.membership,
    isLoading: metadata.isLoading,
    error: metadata.error || structure.structureError,
    joinSpace: metadata.joinSpace,
    leaveSpace: metadata.leaveSpace,
    refresh: async () => {
      await Promise.allSettled([
        metadata.refresh(),
        events.refreshEvents(),
        structure.reloadStructure(),
      ]);
    },

    // Events
    events: events.events,
    isEventsLoading: events.isEventsLoading,

    // Structure
    tabs: structure.tabs,
    widgets: structure.widgets,
    permissions: structure.permissions,
    visibleTabs: structure.visibleTabs,
    enabledWidgets: structure.enabledWidgets,
    defaultTab: structure.defaultTab,
    isStructureLoading: structure.isStructureLoading,
    isMutating: structure.isMutating,
    getWidgetsForTab: structure.getWidgetsForTab,

    // Tab UI
    activeTabId: tabUI.activeTabId,
    setActiveTabId: tabUI.setActiveTabId,
    activeTab: tabUI.activeTab,
    activeTabWidgets: tabUI.activeTabWidgets,

    // Leader
    leaderActions: leader.leaderActions,
  };
}

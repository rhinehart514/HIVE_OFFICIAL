"use client";

/**
 * SpaceContext - DEPRECATED
 *
 * This file is maintained for backward compatibility.
 * All functionality has been split into focused contexts for better performance.
 *
 * @deprecated Import from '@/contexts/space' instead:
 *
 * ```tsx
 * // Provider
 * import { SpaceContextProvider } from '@/contexts/space';
 *
 * // Focused hooks (recommended - best performance)
 * import {
 *   useSpaceMetadata,    // space, membership, join/leave
 *   useSpaceEvents,      // events
 *   useSpaceStructureContext,  // tabs, widgets, permissions
 *   useSpaceTabUI,       // activeTabId, setActiveTabId
 *   useSpaceLeader,      // leaderActions
 * } from '@/contexts/space';
 *
 * // Combined hook (legacy - re-renders on any change)
 * import { useSpaceContext } from '@/contexts/space';
 * ```
 */

// Re-export everything from the new split contexts
export {
  SpaceContextProvider,
  useSpaceContext,
  useOptionalSpaceContext,
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
} from "./space";

// Re-export types
export type {
  SpaceContextValue,
  SpaceDetailDTO,
  SpaceMembership,
  MemberRole,
  SpaceEvent,
  SpaceTab,
  SpaceWidget,
  SpacePermissions,
  LeaderActions,
} from "./space";

// Re-export additional types from structure hook for consumers
export type {
  AddTabInput,
  UpdateTabInput,
  AddWidgetInput,
  UpdateWidgetInput,
} from "@/hooks/use-space-structure";

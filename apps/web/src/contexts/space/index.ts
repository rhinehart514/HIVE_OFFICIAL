/**
 * Space Context Module
 *
 * Provides focused context providers for space-related state.
 * Split into 5 contexts for optimal re-render performance:
 *
 * 1. SpaceMetadataContext - space basic info, membership, join/leave
 * 2. SpaceEventsContext - events data
 * 3. SpaceStructureContext - tabs, widgets, permissions
 * 4. SpaceTabUIContext - active tab state
 * 5. SpaceLeaderContext - leader-only actions
 *
 * Usage:
 * ```tsx
 * // In page component
 * import { SpaceContextProvider } from '@/contexts/space';
 *
 * <SpaceContextProvider spaceId={spaceId}>
 *   <SpaceContent />
 * </SpaceContextProvider>
 *
 * // In child components - use focused hooks for best performance
 * import { useSpaceMetadata, useSpaceTabUI } from '@/contexts/space';
 *
 * function SpaceHeader() {
 *   const { space, membership } = useSpaceMetadata();
 *   // Only re-renders when space or membership changes
 * }
 *
 * function TabSelector() {
 *   const { activeTabId, setActiveTabId } = useSpaceTabUI();
 *   // Only re-renders when active tab changes
 * }
 * ```
 */

// Main provider
export { SpaceContextProvider } from "./SpaceContextProvider";

// Individual context providers (for advanced use cases)
export { SpaceMetadataProvider } from "./SpaceMetadataContext";
export { SpaceEventsProvider } from "./SpaceEventsContext";
export { SpaceStructureProvider } from "./SpaceStructureContext";
export { SpaceTabUIProvider } from "./SpaceTabUIContext";
export { SpaceLeaderProvider } from "./SpaceLeaderContext";

// All hooks and types
export * from "./hooks";

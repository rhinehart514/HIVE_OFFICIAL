/**
 * HIVE Data Layer
 *
 * Unified export for all data fetching and mutation hooks.
 * This is the ONLY import you need for data operations.
 *
 * @example
 * import {
 *   useSpaceQuery,
 *   useBrowseSpacesInfinite,
 *   useJoinSpaceMutation,
 *   useCurrentProfile,
 * } from '@/hooks/data';
 */

// ============================================================
// Query Hooks (Reads)
// ============================================================

// Space queries
export {
  useSpaceQuery,
  useSpaceStructureQuery,
  usePinnedMessagesQuery,
} from "../queries";

// Browse/Discovery queries
export {
  useBrowseSpaces,
  useBrowseSpacesInfinite,
  useSpaceSearch,
  useRecommendedSpaces,
  useFeaturedSpace,
} from "../queries";

// Profile queries
export {
  useCurrentProfile,
  useProfileQuery,
  useConnections,
  useUserSpaces,
} from "../queries";

// Members queries
export {
  useSpaceMembers,
  useSpaceMembersInfinite,
  useOnlineCount,
  useMemberSearch,
} from "../queries";

// Tool queries
export {
  useToolQuery,
  useToolWithState,
  useToolStateQuery,
  useUserTools,
} from "../queries";

// ============================================================
// Mutation Hooks (Writes)
// ============================================================

// Space membership
export {
  useJoinSpaceMutation,
  useLeaveSpaceMutation,
} from "../mutations";

// Member management
export {
  useMemberRoleMutation,
  useRemoveMemberMutation,
} from "../mutations";

// Profile
export { useProfileMutation } from "../mutations";

// Tool state
export { useToolStateMutation } from "../mutations";

// ============================================================
// Shell Data (Global Shell data layer)
// ============================================================

export { useShellData, type ShellDataResult, type ShellNotification } from "./use-shell-data";

// ============================================================
// Query Keys (for manual cache operations)
// ============================================================

export { queryKeys } from "@/lib/query-keys";

// ============================================================
// Types (re-exported for convenience)
// ============================================================

export type {
  SpaceDTO,
  SpaceStructureDTO,
  SpaceEventDTO,
  PinnedMessageDTO,
  BrowseSpaceDTO,
  BrowseFilters,
  BrowseResponse,
  ProfileDTO,
  ProfileUpdateDTO,
  ConnectionDTO,
  SpaceMemberDTO,
  MembersResponse,
  MemberFilters,
  ToolDTO,
  ToolElementDTO,
  ToolStateDTO,
  ToolWithStateDTO,
} from "@/lib/fetchers";

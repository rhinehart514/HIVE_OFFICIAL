/**
 * API Fetchers Index
 *
 * Centralized exports for all fetch functions.
 * Use these with React Query hooks.
 */

// Space fetchers
export {
  fetchSpace,
  fetchSpaceStructure,
  fetchSpaceEvents,
  fetchPinnedMessages,
  joinSpace,
  leaveSpace,
  type SpaceDTO,
  type SpaceStructureDTO,
  type SpaceEventDTO,
  type PinnedMessageDTO,
} from "./space-fetchers";

// Browse/Discovery fetchers
export {
  fetchBrowseSpaces,
  searchSpaces,
  fetchRecommendedSpaces,
  fetchFeaturedSpace,
  type BrowseSpaceDTO,
  type BrowseFilters,
  type BrowseResponse,
  type SearchFilters,
  type SearchResponse,
} from "./browse-fetchers";

// Profile fetchers
export {
  fetchCurrentProfile,
  fetchProfile,
  updateProfile,
  fetchConnections,
  fetchUserSpaces,
  type ProfileDTO,
  type ProfileUpdateDTO,
  type ConnectionDTO,
} from "./profile-fetchers";

// Members fetchers
export {
  fetchSpaceMembers,
  fetchOnlineCount,
  updateMemberRole,
  removeMember,
  type SpaceMemberDTO,
  type MembersResponse,
  type MemberFilters,
} from "./members-fetchers";

// Tool fetchers
export {
  fetchTool,
  fetchToolWithState,
  fetchToolState,
  saveToolState,
  fetchUserTools,
  type ToolDTO,
  type ToolElementDTO,
  type ToolStateDTO,
  type ToolWithStateDTO,
} from "./tool-fetchers";

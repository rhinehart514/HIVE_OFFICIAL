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
  fetchSpaceBoards,
  fetchSpaceChat,
  sendChatMessage,
  joinSpace,
  leaveSpace,
  type SpaceDTO,
  type SpaceStructureDTO,
  type SpaceEventDTO,
  type PinnedMessageDTO,
  type SpaceBoardDTO,
  type SpaceBoardsResponse,
  type ChatMessageDTO,
  type ChatMessagesResponse,
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
  updateMemberRole,
  removeMember,
  batchInviteMembers,
  batchUpdateRoles,
  batchRemoveMembers,
  type SpaceMemberDTO,
  type MembersResponse,
  type MemberFilters,
  type BatchMemberFilters,
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

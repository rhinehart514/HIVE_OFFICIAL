/**
 * React Query Hooks Index
 *
 * Export all query hooks for easy importing.
 */

// Space queries
export { useSpaceQuery } from "./use-space-query";
export { useSpaceStructureQuery } from "./use-space-structure-query";
export { usePinnedMessagesQuery } from "./use-pinned-messages-query";

// Browse/Discovery queries
export {
  useBrowseSpaces,
  useBrowseSpacesInfinite,
  useSpaceSearch,
  useRecommendedSpaces,
  useFeaturedSpace,
} from "./use-browse-query";

// Profile queries
export {
  useCurrentProfile,
  useProfileQuery,
  useConnections,
  useUserSpaces,
} from "./use-profile-query";

// Members queries
export {
  useSpaceMembers,
  useSpaceMembersInfinite,
  useOnlineCount,
  useMemberSearch,
} from "./use-members-query";

// Boards queries
export {
  useSpaceBoards,
  useCreateBoard,
  useDeleteBoard,
  useReorderBoards,
} from "./use-space-boards-query";

// Chat queries
export {
  useSpaceChat,
  useSpaceChatInfinite,
  useSendMessage,
  useDeleteMessage,
  useReactToMessage,
  useLastReadAt,
  useMarkAsRead,
} from "./use-space-chat-query";

// Tool queries
export {
  useToolQuery,
  useToolWithState,
  useToolStateQuery,
  useUserTools,
} from "./use-tools-query";

// Notification queries
export { useUnreadCount, useInvalidateUnreadCount } from "./use-unread-count";

// Legacy export (deprecated, use useToolQuery instead)
export { useToolRuntimeQuery, useToolStateMutation } from "./use-tool-runtime-query";

/**
 * Centralized Query Keys for React Query
 *
 * Provides type-safe, hierarchical query keys for cache management.
 * Keys are structured to allow efficient cache invalidation.
 *
 * @example
 * // Get all space queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.spaces.all })
 *
 * // Get specific space
 * queryClient.invalidateQueries({ queryKey: queryKeys.spaces.detail('space-123') })
 */

export const queryKeys = {
  // ============================================================
  // Spaces
  // ============================================================
  spaces: {
    all: ["spaces"] as const,
    lists: () => [...queryKeys.spaces.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.spaces.lists(), filters] as const,
    details: () => [...queryKeys.spaces.all, "detail"] as const,
    detail: (spaceId: string) =>
      [...queryKeys.spaces.details(), spaceId] as const,
    structure: (spaceId: string) =>
      [...queryKeys.spaces.detail(spaceId), "structure"] as const,
    events: (spaceId: string) =>
      [...queryKeys.spaces.detail(spaceId), "events"] as const,
    members: (spaceId: string) =>
      [...queryKeys.spaces.detail(spaceId), "members"] as const,
    boards: (spaceId: string) =>
      [...queryKeys.spaces.detail(spaceId), "boards"] as const,
    chat: (spaceId: string, boardId?: string) =>
      [...queryKeys.spaces.detail(spaceId), "chat", boardId].filter(Boolean) as readonly string[],
    pinnedMessages: (spaceId: string, boardId: string) =>
      [...queryKeys.spaces.detail(spaceId), "pinned", boardId] as const,
  },

  // ============================================================
  // Tools
  // ============================================================
  tools: {
    all: ["tools"] as const,
    lists: () => [...queryKeys.tools.all, "list"] as const,
    list: (filters?: { userId?: string; status?: string }) =>
      [...queryKeys.tools.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.tools.all, "detail"] as const,
    detail: (toolId: string) =>
      [...queryKeys.tools.details(), toolId] as const,
    withState: (toolId: string, deploymentId?: string) =>
      [...queryKeys.tools.detail(toolId), "withState", deploymentId].filter(Boolean) as readonly string[],
    state: (deploymentId: string) =>
      [...queryKeys.tools.all, "state", deploymentId] as const,
    templates: () => [...queryKeys.tools.all, "templates"] as const,
    template: (templateId: string) =>
      [...queryKeys.tools.templates(), templateId] as const,
  },

  // ============================================================
  // Users / Profiles
  // ============================================================
  users: {
    all: ["users"] as const,
    current: () => [...queryKeys.users.all, "current"] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (userId: string) =>
      [...queryKeys.users.details(), userId] as const,
    profile: (handle: string) =>
      [...queryKeys.users.all, "profile", handle] as const,
    spaces: (userId: string) =>
      [...queryKeys.users.detail(userId), "spaces"] as const,
  },

  // ============================================================
  // Feed
  // ============================================================
  feed: {
    all: ["feed"] as const,
    lists: () => [...queryKeys.feed.all, "list"] as const,
    list: (filters: { spaceId?: string; userId?: string; sortBy?: string }) =>
      [...queryKeys.feed.lists(), filters] as const,
    detail: (postId: string) =>
      [...queryKeys.feed.all, "detail", postId] as const,
    comments: (postId: string) =>
      [...queryKeys.feed.detail(postId), "comments"] as const,
  },

  // ============================================================
  // Events
  // ============================================================
  events: {
    all: ["events"] as const,
    lists: () => [...queryKeys.events.all, "list"] as const,
    list: (filters: { spaceId?: string; upcoming?: boolean }) =>
      [...queryKeys.events.lists(), filters] as const,
    detail: (eventId: string) =>
      [...queryKeys.events.all, "detail", eventId] as const,
    rsvps: (eventId: string) =>
      [...queryKeys.events.detail(eventId), "rsvps"] as const,
  },

  // ============================================================
  // Home
  // ============================================================
  home: {
    all: ['home'] as const,
    mySpaces: () => [...queryKeys.home.all, 'my-spaces'] as const,
    dashboard: (includeRecommendations?: boolean) => [...queryKeys.home.all, 'dashboard', { includeRecommendations }] as const,
    activity: (limit?: number) => [...queryKeys.home.all, 'activity', limit ?? 10] as const,
  },

  // ============================================================
  // Notifications
  // ============================================================
  notifications: {
    all: ['notifications'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
    list: (filters?: { limit?: number }) => [...queryKeys.notifications.all, 'list', filters ?? {}] as const,
  },

  // ============================================================
  // Browse
  // ============================================================
  browse: {
    all: ['browse'] as const,
    search: (query: string, filters?: Record<string, unknown>) => [...queryKeys.browse.all, 'search', query, filters ?? {}] as const,
  },
} as const;

/**
 * Type helper for query key inference
 */
export type QueryKeys = typeof queryKeys;

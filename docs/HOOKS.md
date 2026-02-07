# HIVE Hooks Reference

Complete reference for all custom React hooks in the HIVE monorepo.

---

## Authentication & Session

### `useSession`
- **Location:** `apps/web/src/hooks/use-session.ts`
- **Purpose:** Legacy compatibility wrapper around `useAuth` from `@hive/auth-logic`
- **Parameters:** None
- **Returns:** `{ isLoading, isAuthenticated, user, session, sessionData, logout, getIdToken }`
- **Dependencies:** `@hive/auth-logic` (useAuth)

### `useCsrf`
- **Location:** `apps/web/src/hooks/use-csrf.ts`
- **Purpose:** CSRF token management for admin API calls
- **Parameters:** None
- **Returns:** `{ token: string | null, getHeaders: () => HeadersInit }`
- **Dependencies:** Fetches from `/api/csrf`
- **Also exports:** `protectedFetch(url, options)` utility function

### `usePermissions`
- **Location:** `apps/web/src/hooks/use-permissions.ts`
- **Purpose:** Client-side role-based permission checking for spaces
- **Parameters:** `(spaceId: string, currentUserId: string | undefined)`
- **Returns:** `{ can(action), canEditPost(post), canDeletePost(post), canPinMessage(), canManageMembers(), canEditSpace(), canManageTools(), role, isLeader, isModerator, isLoading }`
- **Dependencies:** Fetches from `/api/spaces/{spaceId}/membership`

### `useGhostMode`
- **Location:** `apps/web/src/hooks/use-ghost-mode.ts`
- **Purpose:** Ghost mode privacy toggle with expiry timer
- **Parameters:** None
- **Returns:** `{ isGhostMode, ghostLevel, timeRemaining, enableGhostMode(level?, duration?), disableGhostMode(), updateGhostLevel(level), isLoading, error }`
- **Dependencies:** `@hive/auth-logic` (useAuth), fetches `/api/profile/ghost-mode`

### `usePrivacySettings`
- **Location:** `apps/web/src/hooks/use-privacy-settings.ts`
- **Purpose:** Privacy settings updates for user profile
- **Parameters:** None
- **Returns:** `{ isLoading, error, updatePrivacySettings(settings), togglePublicProfile(), clearError }`
- **Dependencies:** `@hive/auth-logic` (useAuth)

---

## Space / Organization

### `useSpaceStructure`
- **Location:** `apps/web/src/hooks/use-space-structure.ts`
- **Purpose:** Full space structure management (tabs + widgets) with optimistic updates and batch PATCH
- **Parameters:** `(spaceId?: string)`
- **Returns:** `{ tabs, widgets, activeTabId, isLoading, error, addTab, removeTab, updateTab, reorderTabs, addWidget, removeWidget, updateWidget, reorderWidgets, setActiveTab, refreshStructure }`
- **Dependencies:** Fetches `/api/spaces/{spaceId}/structure`

### `useSpacesBrowse`
- **Location:** `apps/web/src/hooks/use-spaces-browse.ts`
- **Purpose:** Space browsing with Firestore getDocs (one-time reads), campus-isolated
- **Parameters:** `(options: { filterType?, searchQuery?, limitCount? })`
- **Returns:** `{ spaces, loading, error, refetch }`
- **Dependencies:** `@hive/firebase` (db), `@hive/auth-logic` (useAuth)

### `useSpaceRealtime`
- **Location:** `apps/web/src/hooks/use-space-realtime.ts`
- **Purpose:** Real-time space membership and activity via Firestore onSnapshot
- **Exports:**
  - `useSpaceMembership(spaceId)` -- Returns `{ membership, loading, error }`
  - `useSpaceActivity(spaceId)` -- Returns `{ activity, loading, error }`
  - `useSpaceRealtime(spaceId)` -- Combined hook returning both
- **Dependencies:** `@hive/firebase` (db), `@hive/auth-logic` (useAuth)

### `useJoinRequests`
- **Location:** `apps/web/src/hooks/use-join-requests.ts`
- **Purpose:** Space leader join request management (approve/reject)
- **Parameters:** `(spaceId: string, enabled?: boolean)`
- **Returns:** `{ requests, pendingCount, isLoading, error, approveRequest(id), rejectRequest(id, reason?), refreshRequests, filterByStatus(status) }`
- **Dependencies:** `@hive/auth-logic` (useAuth)

### `useJoinRequest`
- **Location:** `apps/web/src/hooks/use-join-request.ts`
- **Purpose:** User-side join request for private spaces
- **Parameters:** `(spaceId: string)`
- **Returns:** `{ joinRequest, isLoading, error, createRequest(message?), cancelRequest(), canRequestAgain }`
- **Dependencies:** `@hive/auth-logic` (useAuth)

### `useLeaderOnboarding`
- **Location:** `apps/web/src/hooks/use-leader-onboarding.ts`
- **Purpose:** Leader onboarding flow with localStorage persistence
- **Parameters:** `(options: { spaceId, spaceName?, onComplete? })`
- **Returns:** `{ tasks, completedCount, totalCount, progressPercent, isComplete, isDismissed, completeTask(id), dismissOnboarding, resetOnboarding }`
- **Dependencies:** localStorage

### `useSpaceTools`
- **Location:** `apps/web/src/hooks/use-space-tools.ts`
- **Purpose:** React Query hook for space tools with sidebar/inline grouping
- **Parameters:** `(options: { spaceId, enabled? })`
- **Returns:** `{ tools, sidebarTools, inlineTools, isLoading, error, refetch }`
- **Dependencies:** `@tanstack/react-query`

---

## Space Queries (React Query)

### `useSpaceQuery`
- **Location:** `apps/web/src/hooks/queries/use-space-query.ts`
- **Purpose:** Fetch a space by ID with React Query caching
- **Parameters:** `(spaceId: string, options?: UseSpaceQueryOptions)`
- **Returns:** React Query result `{ data: SpaceDTO, isLoading, error, ... }`
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers/space-fetchers`

### `useSpaceStructureQuery`
- **Location:** `apps/web/src/hooks/queries/use-space-structure-query.ts`
- **Purpose:** Fetch space structure (tabs, widgets, permissions) with caching
- **Parameters:** `(spaceId: string, options?)`
- **Returns:** React Query result `{ data: SpaceStructureDTO, ... }`
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers/space-fetchers`

### `useSpaceBoards`
- **Location:** `apps/web/src/hooks/queries/use-space-boards-query.ts`
- **Purpose:** Fetch boards for a space
- **Parameters:** `(spaceId: string, options?)`
- **Returns:** React Query result `{ data: SpaceBoardsResponse, ... }`
- **Also exports:** `useCreateBoard(spaceId)`, `useDeleteBoard(spaceId)`, `useReorderBoards(spaceId)` (mutations with optimistic updates)
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers`

### `useSpaceMembers` / `useSpaceMembersInfinite`
- **Location:** `apps/web/src/hooks/queries/use-members-query.ts`
- **Purpose:** Fetch space members with pagination and infinite scroll
- **Parameters:** `(spaceId: string, filters?: MemberFilters)`
- **Returns:** React Query result with `{ data: MembersResponse, ... }`
- **Also exports:** `useOnlineCount(spaceId)`, `useMemberSearch(spaceId, query)`, `useBatchInviteMembers(spaceId)`, `useBatchUpdateRoles(spaceId)`, `useBatchRemoveMembers(spaceId)`
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers`

### `usePinnedMessagesQuery`
- **Location:** `apps/web/src/hooks/queries/use-pinned-messages-query.ts`
- **Purpose:** Fetch pinned messages for a board with caching
- **Parameters:** `(spaceId: string, boardId: string, options?)`
- **Returns:** React Query result `{ data: PinnedMessageDTO[], ... }`
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers/space-fetchers`

---

## Space Mutations (React Query)

### `useJoinSpaceMutation`
- **Location:** `apps/web/src/hooks/mutations/use-join-space.ts`
- **Purpose:** Join a space with optimistic member count update and rollback
- **Parameters:** `(spaceId: string, options?: { onSuccess?, onError? })`
- **Returns:** React Query mutation `{ mutate, isPending, ... }`
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers/space-fetchers`

### `useLeaveSpaceMutation`
- **Location:** `apps/web/src/hooks/mutations/use-leave-space.ts`
- **Purpose:** Leave a space with optimistic member count update and rollback
- **Parameters:** `(spaceId: string, options?: { onSuccess?, onError? })`
- **Returns:** React Query mutation `{ mutate, isPending, ... }`
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers/space-fetchers`

### `useMemberRoleMutation` / `useRemoveMemberMutation`
- **Location:** `apps/web/src/hooks/mutations/use-member-actions.ts`
- **Purpose:** Update member role or remove member with optimistic updates
- **Parameters:** `(spaceId: string, options?: { onSuccess?, onError? })`
- **Returns:** React Query mutation `{ mutate, isPending, ... }`
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers`

---

## Chat

### `useChatMessages`
- **Location:** `apps/web/src/hooks/chat/use-chat-messages.ts`
- **Purpose:** Main composed chat hook combining SSE, typing, mutations, and threads
- **Parameters:** `(options: { spaceId, boardId, userId?, userName? })`
- **Returns:** `{ messages, isConnected, isLoading, sendMessage, editMessage, deleteMessage, addReaction, pinMessage, typingUsers, setTyping, clearTyping, threadState, openThread, closeThread, sendThreadReply }`
- **Dependencies:** Uses `useChatSSE`, `useChatTyping`, `useChatMutations`, `useChatThreads`

### `useChatSSE`
- **Location:** `apps/web/src/hooks/chat/use-chat-sse.ts`
- **Purpose:** SSE connection management with exponential backoff reconnection
- **Parameters:** `(options: { spaceId, boardId, enabled?, onMessage?, onError? })`
- **Returns:** `{ isConnected, error, disconnect, reconnect }`
- **Dependencies:** Server-Sent Events via `/api/spaces/{spaceId}/chat/stream`

### `useChatTyping`
- **Location:** `apps/web/src/hooks/chat/use-chat-typing.ts`
- **Purpose:** Typing indicators via Firebase RTDB with throttling and TTL cleanup
- **Parameters:** `(options: { spaceId, boardId, enabled })`
- **Returns:** `{ typingUsers: TypingUser[], setTyping, clearTyping }`
- **Dependencies:** `@/lib/firebase-realtime` (realtimeService)

### `useChatMutations`
- **Location:** `apps/web/src/hooks/chat/use-chat-mutations.ts`
- **Purpose:** Chat message CRUD with optimistic updates
- **Parameters:** `(options: { spaceId, boardId, onMessageSent?, onError? })`
- **Returns:** `{ sendMessage, editMessage, deleteMessage, addReaction, pinMessage, isSending }`
- **Dependencies:** Fetches `/api/spaces/{spaceId}/chat`

### `useChatThreads`
- **Location:** `apps/web/src/hooks/chat/use-chat-threads.ts`
- **Purpose:** Thread management for chat messages
- **Parameters:** `(options: { spaceId, boardId, enabled? })`
- **Returns:** `{ threadState, openThread(messageId), closeThread, sendThreadReply(content), loadMoreReplies }`
- **Dependencies:** Fetches `/api/spaces/{spaceId}/chat/threads`

### `useChatSearch`
- **Location:** `apps/web/src/hooks/chat/use-chat-search.ts`
- **Purpose:** Chat message search with pagination
- **Parameters:** `(options: { spaceId, enabled? })`
- **Returns:** `{ results, isSearching, search(query), filters, setFilters, loadMore, hasMore, clear }`
- **Dependencies:** Fetches `/api/spaces/{spaceId}/chat/search`

### `useChatIntent`
- **Location:** `apps/web/src/hooks/use-chat-intent.ts`
- **Purpose:** Slash command and inline component detection in chat
- **Parameters:** `(spaceId: string)`
- **Returns:** `{ checkIntent(text), createComponent(type, config), previewComponent(type, config), availableIntents }`
- **Dependencies:** Fetches `/api/spaces/{spaceId}/chat/intent`

### `useSpaceChatInfinite` / `useSpaceChat`
- **Location:** `apps/web/src/hooks/queries/use-space-chat-query.ts`
- **Purpose:** React Query infinite scroll for chat messages (newest-first)
- **Parameters:** `(spaceId, boardId, options?)`
- **Returns:** React Query infinite query result
- **Also exports:** `useSendMessage(spaceId, boardId)`, `useDeleteMessage(spaceId, boardId)`, `useReactToMessage(spaceId, boardId)`, `useLastReadAt(spaceId, boardId)`, `useMarkAsRead(spaceId, boardId)`
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers`

### `usePinnedMessages`
- **Location:** `apps/web/src/hooks/use-pinned-messages.ts`
- **Purpose:** Pinned message management for chat boards
- **Parameters:** `(options: { spaceId, boardId?, enabled? })`
- **Returns:** `{ messages, isLoading, error, pinMessage(id), unpinMessage(id), refresh }`
- **Dependencies:** `@hive/auth-logic` (useAuth)

### `useUnreadCount` (Firestore-based)
- **Location:** `apps/web/src/hooks/use-unread-count.ts`
- **Purpose:** Unread message tracking via Firestore
- **Exports:**
  - `useUnreadCount(spaceId, boardId)` -- Single board unread count
  - `useSpaceUnreadCounts(spaceId, boardIds)` -- Multiple boards
  - `useTotalUnreadCount()` -- All spaces total
- **Dependencies:** `@hive/firebase` (db), `@hive/auth-logic` (useAuth)

### `useUnreadCount` (React Query polling)
- **Location:** `apps/web/src/hooks/queries/use-unread-count.ts`
- **Purpose:** Poll notifications endpoint for unread count (30s interval)
- **Parameters:** `(options?: { enabled? })`
- **Returns:** React Query result `{ data: number }`
- **Also exports:** `useInvalidateUnreadCount()` -- returns invalidation function
- **Dependencies:** `@tanstack/react-query`

---

## Events & Calendar

### `useEvents`
- **Location:** `apps/web/src/hooks/use-events.ts`
- **Purpose:** Events page state: filtering, search, RSVP, bookmarking
- **Parameters:** None
- **Returns:** `{ events, filteredEvents, isLoading, filter, eventType, searchQuery, selectedEvent, showCreateModal, showEventDetails, user, setFilter, setEventType, setSearchQuery, handleRSVP, handleBookmark, addEvent, ... }`
- **Dependencies:** `@hive/auth-logic` (useAuth), fetches `/api/events`
- **Also exports:** `formatEventTime()`, `getEventTypeColor()`, `getEventTypeIcon()`

### `useCalendar`
- **Location:** `apps/web/src/hooks/use-calendar.ts`
- **Purpose:** Read-only calendar for space events with view navigation and RSVP
- **Parameters:** `(options?: { initialViewMode?: 'month' | 'week' | 'day' })`
- **Returns:** `{ currentDate, viewMode, events, filteredEvents, viewEvents, conflictEvents, viewTitle, isLoading, error, navigateDate, goToToday, setViewMode, setEventTypeFilter, updateEventRSVP, ... }`
- **Dependencies:** Fetches `/api/calendar`
- **Also exports:** `getTypeColor()`, `getTypeIcon()`, `formatTime()`, `formatDate()`, `getEventDataType()`

---

## User / Profile

### `useProfileEdit`
- **Location:** `apps/web/src/hooks/use-profile-edit.ts`
- **Purpose:** Full profile editing page state management
- **Parameters:** None
- **Returns:** `{ fullName, handle, bio, major, gradYear, isPublic, ghostMode, avatarUrl, setFullName, setBio, setMajor, setGradYear, setIsPublic, handleAvatarUpload, saveProfile, isSaving, isDirty, errors }`
- **Dependencies:** `@hive/auth-logic` (useAuth)

### `useProfileCompletion`
- **Location:** `apps/web/src/hooks/use-profile-completion.ts`
- **Purpose:** Profile completion percentage and missing fields
- **Parameters:** None
- **Returns:** `{ completionPercentage, missingFields, nextStep, isComplete, isLoading }`
- **Dependencies:** `@hive/auth-logic` (useAuth)

### `useConnections`
- **Location:** `apps/web/src/hooks/use-connections.ts`
- **Purpose:** Connection and friend management
- **Parameters:** None
- **Returns:** `{ connections, friends, pendingRequests, isLoading, sendFriendRequest(id), acceptFriendRequest(id), rejectFriendRequest(id), removeFriend(id), isConnected(id), isFriend(id) }`
- **Dependencies:** `@hive/auth-logic` (useAuth)

### `useFollow`
- **Location:** `apps/web/src/hooks/use-follow.ts`
- **Purpose:** Follow/unfollow with React Query and optimistic updates
- **Parameters:** `(targetUserId: string, options?)`
- **Returns:** `{ isFollowing, toggleFollow, isLoading }`
- **Also exports:** `useFollowCounts(userId)`, `useConnectionStrength(targetUserId)`
- **Dependencies:** `@tanstack/react-query`, `@hive/auth-logic` (useAuth)

### `useProfileMutation`
- **Location:** `apps/web/src/hooks/mutations/use-profile-mutation.ts`
- **Purpose:** Update current user's profile with optimistic updates (React Query)
- **Parameters:** `(options?: { onSuccess?, onError? })`
- **Returns:** React Query mutation `{ mutate, isPending, ... }`
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers`

### `useCurrentProfile` / `useProfileQuery`
- **Location:** `apps/web/src/hooks/queries/use-profile-query.ts`
- **Purpose:** Fetch current user or public profile with React Query caching
- **Parameters:** `useCurrentProfile(options?)` / `useProfileQuery(userId, options?)`
- **Returns:** React Query result `{ data: ProfileDTO, ... }`
- **Also exports:** `useConnections(userId?, options?)`, `useUserSpaces(userId?, options?)`
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers`

### `useProfile` (packages)
- **Location:** `packages/hooks/src/use-profile.ts`
- **Purpose:** Profile update and photo upload with auth token
- **Parameters:** None
- **Returns:** `{ updateProfile(data), uploadPhoto(file), isUpdating, error, clearError }`
- **Dependencies:** `@hive/auth-logic` (useAuth), fetches `/api/profile`

---

## Feed & Content

### `useFeed`
- **Location:** `apps/web/src/hooks/use-feed.ts`
- **Purpose:** Feed management with post CRUD, interactions (like/bookmark/share/comment), pagination
- **Parameters:** `(options: { spaceId?, feedType?, limit? })`
- **Returns:** `{ posts, isLoading, hasMore, error, loadMore, createPost, deletePost, editPost, likePost, bookmarkPost, sharePost, addComment, refresh }`
- **Dependencies:** `@hive/auth-logic` (useAuth), `secureApiFetch`

### `useSearch`
- **Location:** `apps/web/src/hooks/use-search.ts`
- **Purpose:** Global search with debouncing, caching, and abort controller
- **Parameters:** `(options: { debounceMs?, maxResults?, searchTypes? })`
- **Returns:** `{ results, suggestions, recentSearches, isSearching, search(query), clearResults, clearRecent, addToRecent }`
- **Dependencies:** `@hive/auth-logic` (useAuth), `useToast`

---

## Rituals

### `useRitual`
- **Location:** `apps/web/src/hooks/use-ritual.ts`
- **Purpose:** Single ritual fetch and interaction
- **Parameters:** `(options: { id: string, useSlug?: boolean, refreshInterval?: number })`
- **Returns:** `{ ritual, isLoading, error, joinRitual, leaveRitual, participateInRitual, refreshRitual }`
- **Dependencies:** Fetches `/api/rituals/{id}`

### `useRitualsList`
- **Location:** `apps/web/src/hooks/use-rituals-list.ts`
- **Purpose:** Ritual list with filtering by phase/archetype
- **Parameters:** `(options?: { phase?, archetype?, refreshInterval? })`
- **Returns:** `{ rituals, activeRituals, upcomingRituals, completedRituals, featuredRitual, isLoading, error, refresh }`
- **Dependencies:** Fetches `/api/rituals`

### `useRitualParticipation`
- **Location:** `apps/web/src/hooks/use-ritual-participation.ts`
- **Purpose:** User participation in a ritual with leaderboard
- **Parameters:** `(options: { ritualId: string, refreshInterval?: number })`
- **Returns:** `{ participation, leaderboard, isLoading, error, joinRitual, leaveRitual, participate(data), refresh }`
- **Dependencies:** Fetches `/api/rituals/{id}/participation`

---

## Browse & Discovery (React Query)

### `useBrowseSpaces` / `useBrowseSpacesInfinite`
- **Location:** `apps/web/src/hooks/queries/use-browse-query.ts`
- **Purpose:** Browse spaces with pagination and infinite scroll
- **Parameters:** `(filters?: BrowseFilters)`
- **Returns:** React Query result / infinite query result
- **Also exports:** `useSpaceSearch(query, options?)`, `useRecommendedSpaces(limit?)`, `useFeaturedSpace()`
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers`

---

## Notifications

### `useNotifications`
- **Location:** `apps/web/src/hooks/use-notifications.ts`
- **Purpose:** Real-time notifications via Firestore onSnapshot
- **Parameters:** None
- **Returns:** `{ notifications, unreadCount, isLoading, markAsRead(id), markAllAsRead, clearAll }`
- **Dependencies:** `@hive/firebase` (db), `@hive/auth-logic` (useAuth)

### `useNotificationStream`
- **Location:** `apps/web/src/hooks/use-notification-stream.ts`
- **Purpose:** SSE-based notification stream with reconnection and polling fallback
- **Parameters:** None
- **Returns:** `{ isConnected, unreadCount, notifications, markAsRead(id), markAllAsRead, isLoading, error }`
- **Dependencies:** `@hive/auth-logic` (useAuth), SSE via `/api/notifications/stream`

### `useRealtimeNotifications`
- **Location:** `apps/web/src/hooks/use-realtime-notifications.ts`
- **Purpose:** Wrapper over `useNotificationStream` with legacy format compatibility
- **Parameters:** None
- **Returns:** `{ notifications, unreadCount, loading, error, markAsRead(id), markAllAsRead }`
- **Dependencies:** `useNotificationStream`, `@hive/auth-logic` (useAuth)

---

## Presence & Online Status

### `usePresence`
- **Location:** `apps/web/src/hooks/use-presence.ts`
- **Purpose:** Track current user's presence status with heartbeat (60s interval)
- **Parameters:** None
- **Returns:** `{ isOnline }`
- **Dependencies:** `@hive/firebase` (db), `@hive/auth-logic` (useAuth)

### `useOnlineUsers`
- **Location:** `apps/web/src/hooks/use-presence.ts`
- **Purpose:** Get online users on campus, batch fetching user profiles
- **Parameters:** `(spaceId?: string)`
- **Returns:** `{ onlineUsers: OnlineUser[], loading }`
- **Dependencies:** `@hive/firebase` (db), `@hive/auth-logic` (useAuth)

### `useTypingIndicator`
- **Location:** `apps/web/src/hooks/use-presence.ts`
- **Purpose:** Typing indicators in a space/chat via Firestore
- **Parameters:** `(contextId: string)`
- **Returns:** `{ typingUsers: string[], setTyping(isTyping) }`
- **Dependencies:** `@hive/firebase` (db), `@hive/auth-logic` (useAuth)

### `useActiveTodayCount`
- **Location:** `apps/web/src/hooks/use-presence.ts`
- **Purpose:** Count users active within last 24 hours on campus
- **Parameters:** None
- **Returns:** `{ activeTodayCount: number, loading }`
- **Dependencies:** `@hive/firebase` (db), `@hive/auth-logic` (useAuth)

### `useUserStatus`
- **Location:** `apps/web/src/hooks/use-presence.ts`
- **Purpose:** Get a specific user's online/away/offline status
- **Parameters:** `(userId: string)`
- **Returns:** `{ status: 'online' | 'away' | 'offline', lastSeen: Date | null }`
- **Dependencies:** `@hive/firebase` (db)

### `useOnlineStatus`
- **Location:** `apps/web/src/hooks/use-online-status.ts`
- **Purpose:** Simple browser online/offline status
- **Parameters:** None
- **Returns:** `boolean` (true if online)
- **Dependencies:** `navigator.onLine`, window events

---

## Feature Flags

### `useFeatureFlags`
- **Location:** `apps/web/src/hooks/use-feature-flags.ts`
- **Purpose:** Check feature flag state from API
- **Parameters:** `(flagIds?: string[])`
- **Returns:** `{ flags, isLoading, error, isEnabled(flagId), refresh }`
- **Dependencies:** `@hive/auth-logic` (useAuth), fetches `/api/feature-flags`

### `useFeatureFlag`
- **Location:** `apps/web/src/hooks/use-feature-flags.ts`
- **Purpose:** Convenience hook for a single feature flag
- **Parameters:** `(flagId: FeatureFlagId)`
- **Returns:** `{ enabled: boolean, isLoading: boolean }`

### `useDMsEnabled` / `useConnectionsEnabled` / `useRitualsEnabled`
- **Location:** `apps/web/src/hooks/use-feature-flags.ts`
- **Purpose:** Convenience hooks for common flags
- **Parameters:** None
- **Returns:** `{ enabled: boolean, isLoading: boolean }`

---

## HiveLab / Tools

### `useToolRuntime`
- **Location:** `apps/web/src/hooks/use-tool-runtime.ts`
- **Purpose:** HiveLab tool execution, state persistence, real-time sync with SharedState architecture
- **Parameters:** `(options: { toolId, spaceId, placementId, onStateChange?, enableRealtime? })`
- **Returns:** `{ state, isLoading, error, isConnected, executeAction(elementId, action, data?), updateState(path, value), getElementState(instanceId), refresh }`
- **Also exports:** `useSpaceTool(options)` convenience hook
- **Dependencies:** Firebase RTDB, fetches `/api/tools/state`, `/api/tools/execute`

### `useToolRuntimeQuery`
- **Location:** `apps/web/src/hooks/queries/use-tool-runtime-query.ts`
- **Purpose:** Fetch tool with state using React Query (combined endpoint)
- **Parameters:** `({ toolId, deploymentId?, spaceId?, placementId? }, options?)`
- **Returns:** React Query result `{ data: ToolWithStateDTO, ... }`
- **Also exports:** `useToolStateMutation(deploymentId, options?)` -- mutation for saving state
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers/tool-fetchers`

### `useToolQuery` / `useToolWithState` / `useToolStateQuery` / `useUserTools`
- **Location:** `apps/web/src/hooks/queries/use-tools-query.ts`
- **Purpose:** React Query hooks for tool data, state, and user's tools
- **Parameters:** Varies per hook
- **Returns:** React Query results with appropriate DTOs
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers`

### `useToolStateMutation` (mutations)
- **Location:** `apps/web/src/hooks/mutations/use-tool-state-mutation.ts`
- **Purpose:** Save tool state with optimistic updates and debounced auto-save
- **Parameters:** `(deploymentId: string, options?: { debounceMs?, onSuccess?, onError? })`
- **Returns:** `{ mutate, isPending, saveDebounced(params), cancelDebounce, ... }`
- **Dependencies:** `@tanstack/react-query`, `@/lib/fetchers`

### `useToolStateRealtime`
- **Location:** `apps/web/src/hooks/use-tool-state-realtime.ts`
- **Purpose:** Firebase RTDB subscription for tool state updates
- **Parameters:** `(deploymentId: string, options?: { enabled?, onUpdate? })`
- **Returns:** `{ state, isConnected, error }`
- **Also exports:** `useToolCountersRealtime(deploymentId)`, `useToolTimelineRealtime(deploymentId)`, `useToolCounter(deploymentId, counterId)`
- **Dependencies:** Firebase RTDB

### `useConnectionSync`
- **Location:** `apps/web/src/hooks/use-connection-sync.ts`
- **Purpose:** Firebase RTDB subscription for tool connection updates
- **Parameters:** `(deploymentId: string, options?: { enabled? })`
- **Returns:** `{ connections, isConnected, error }`
- **Also exports:** `useConnectionValue(deploymentId, connectionId)`, `useConnectionUpdates(deploymentId, onUpdate)`
- **Dependencies:** Firebase RTDB

---

## PWA & Offline

### `usePWA`
- **Location:** `apps/web/src/hooks/use-pwa.ts`
- **Purpose:** PWA install prompt and service worker registration
- **Parameters:** None
- **Returns:** `{ canInstall, isInstalled, promptInstall, skipWaiting, isOnline }`
- **Also exports:** `useOnlineStatus()` -- returns `boolean`
- **Dependencies:** Service Worker API, `beforeinstallprompt` event

### `usePushNotifications`
- **Location:** `apps/web/src/hooks/use-push-notifications.ts`
- **Purpose:** Push notification permission and FCM token registration
- **Exports:**
  - `usePushPrompt()` -- Returns `{ canPrompt, promptUser, isSupported, permissionState }`
  - `usePushNotifications()` -- Returns `{ isEnabled, toggle, isLoading }`
- **Dependencies:** Notification API, FCM

### `useFcmRegistration`
- **Location:** `apps/web/src/hooks/use-fcm-registration.ts`
- **Purpose:** Automatic FCM token registration on auth
- **Parameters:** None
- **Returns:** `{ permissionState, isRegistered, requestPermission }`
- **Dependencies:** `@hive/auth-logic` (useAuth), FCM client utilities

### `useOffline`
- **Location:** `apps/web/src/hooks/use-offline.tsx`
- **Purpose:** Offline support with pending action queue and auto-sync
- **Exports:**
  - `useOffline()` -- Returns `{ isOffline, pendingActions, queueAction, syncPending }`
  - `useOfflineChat(spaceId)` -- Returns `{ sendOfflineMessage, pendingMessages }`
  - `useOfflineReactions()` -- Returns `{ queueReaction, pendingReactions }`
  - `OfflineProvider` -- Context provider
  - `useOfflineContext()` -- Access offline context
- **Dependencies:** localStorage, `navigator.onLine`

### `useOfflineStorage`
- **Location:** `apps/web/src/hooks/use-offline-storage.ts`
- **Purpose:** IndexedDB offline storage hook for caching
- **Parameters:** None
- **Returns:** `{ isInitialized, isLoading, error, stats, cacheSpaces, getCachedSpaces, cacheFeed, getCachedFeed, cacheProfile, getCachedProfile, queueMutation, getPendingMutations, completeMutation, failMutation, isCacheValid, refreshStats, cleanup }`
- **Also exports:** `useOfflineSync(options?)`, `useOfflineData<T>(options)`
- **Dependencies:** `@/lib/offline-storage` (IndexedDB), `useOnlineStatus`

---

## UI / Utility

### `useIntersectionObserver`
- **Location:** `apps/web/src/hooks/use-intersection-observer.ts`
- **Purpose:** Generic Intersection Observer hook
- **Parameters:** `(elementRef: RefObject<Element>, options?: IntersectionObserverInit)`
- **Returns:** `boolean` (isIntersecting)
- **Dependencies:** IntersectionObserver API

### `useKeyboardShortcuts`
- **Location:** `apps/web/src/hooks/use-keyboard-shortcuts.ts`
- **Purpose:** Keyboard shortcuts using `react-hotkeys-hook`
- **Exports:**
  - `useFeedShortcuts(callbacks)` -- Feed navigation shortcuts
  - `useGlobalShortcuts(callbacks)` -- Global app shortcuts
  - `useSpaceShortcuts(callbacks)` -- Space-specific shortcuts
  - `useHiveLabShortcuts(callbacks)` -- HiveLab builder shortcuts
  - `useModalShortcuts(callbacks)` -- Modal shortcuts (Escape)
  - `getKeyboardShortcuts()` -- Returns all shortcut definitions
- **Dependencies:** `react-hotkeys-hook`

### `useToast`
- **Location:** `apps/web/src/hooks/use-toast.tsx`
- **Purpose:** Re-export of `useToast` and `Toaster` from `@hive/ui`
- **Dependencies:** `@hive/ui`

### `useDebounce` / `useDebouncedCallback`
- **Location:** `packages/hooks/src/use-debounce.ts`
- **Purpose:** Debounce a value or callback
- **Parameters:** `useDebounce(value, delay)` / `useDebouncedCallback(callback, delay)`
- **Returns:** Debounced value / debounced callback
- **Dependencies:** None

### `usePlatformStats`
- **Location:** `apps/web/src/hooks/use-platform-stats.ts`
- **Purpose:** Platform statistics for landing page (auto-refreshes every 5 min)
- **Parameters:** None
- **Returns:** `{ stats, isLoading, error }`
- **Dependencies:** Fetches `/api/stats`

---

## Data Layer

### `useShellData`
- **Location:** `apps/web/src/hooks/data/use-shell-data.ts`
- **Purpose:** Universal shell data: user info, categorized spaces, notifications
- **Parameters:** `(options?: { skipFetch? })`
- **Returns:** `{ user: { avatarUrl, name, handle, isBuilder }, mySpaces: ShellSpaceSection[], isSpaceLeader, notifications, notificationCount, notificationsLoading, notificationsError, isLoading }`
- **Dependencies:** `@hive/auth-logic` (useAuth), `useRealtimeNotifications`, `@/lib/api-client`

### `useCampusData`
- **Location:** `apps/web/src/hooks/data/use-campus-data.ts`
- **Purpose:** Campus navigation data for dock orbs, tools, notifications
- **Parameters:** `(options?: { skipFetch? })`
- **Returns:** `{ user, dockSpaces: DockSpaceItem[], dockTools: DockToolItem[], notifications, notificationCount, isLoading, spaceOrder, setSpaceOrder }`
- **Dependencies:** `useShellData`, `@hive/auth-logic` (useAuth), `@/lib/api-client`

---

## Analytics

### `useAnalytics`
- **Location:** `packages/hooks/src/use-analytics.ts`
- **Purpose:** General analytics tracking (GA4 + backend pipeline)
- **Parameters:** None
- **Returns:** `{ track(event), identify(userId, traits?), page(name, properties?) }`
- **Dependencies:** Google Analytics (gtag), fetches `/api/analytics/track`

### `useOnboardingAnalytics`
- **Location:** `packages/hooks/src/use-onboarding-analytics.ts`
- **Purpose:** Onboarding funnel analytics with step timing
- **Parameters:** None
- **Returns:** `{ trackOnboardingStarted, trackStepStarted(step), trackStepCompleted(step, data?), trackStepSkipped(step, reason?), trackValidationError(step, field, error), trackOnboardingCompleted(duration, steps), trackOnboardingAbandoned(lastStep, reason?) }`
- **Dependencies:** `useAnalytics`

### `useCreationAnalytics`
- **Location:** `packages/hooks/src/use-creation-analytics.ts`
- **Purpose:** HiveLab tool creation analytics with event batching and privacy controls
- **Parameters:** `(options?: { toolId?, spaceId?, batchSize?, flushInterval?, enableDebugLogging? })`
- **Returns:** `{ sessionId, isSessionActive, startBuilderSession, endBuilderSession, updateContext, trackEvent, trackToolCreated, trackToolUpdated, trackToolPublished, trackElementAdded, trackElementConfigured, trackElementRemoved, trackCanvasModeChanged, trackDeviceModeChanged, trackToolInstanceOpened, trackToolInstanceSubmitted, userPreferences, updatePrivacyPreferences, flushEvents, queueSize }`
- **Dependencies:** `@hive/auth-logic` (useAuth), `@hive/core` (analytics types), fetches `/api/analytics/creation`

### `useFeedAnalytics`
- **Location:** `packages/hooks/src/use-feed-analytics.ts`
- **Purpose:** Feed interaction analytics with session heartbeats
- **Parameters:** `(options: { spaceId, userId, config? })`
- **Returns:** `{ trackPostCreated, trackPostReacted, trackPostViewed, trackPostEdited, trackPostDeleted, trackSpaceJoined, trackSpaceLeft, trackBuilderAction, trackFeedViewed, startSession, endSession, isSessionActive }`
- **Dependencies:** `useAnalytics`, `@hive/core` (feed event types)

---

## Design Tokens

### `useTokens`
- **Location:** `packages/hooks/src/use-tokens.ts`
- **Purpose:** Runtime access to all HIVE design tokens
- **Parameters:** None
- **Returns:** `{ foundation, semantic, components }`
- **Also exports:** `useToken(path)`, `useTokensMap(paths[])`, `useFoundation()`, `useSemantic()`, `useComponents()`, `useBackgroundTokens()`, `useTextTokens()`, `useBrandTokens()`, `useInteractiveTokens()`, `useStatusTokens()`, `useBorderTokens()`, `useButtonTokens()`, `useCardTokens()`, `useInputTokens()`, `useBadgeTokens()`, `useToastTokens()`, `useOverlayTokens()`
- **Dependencies:** `@hive/tokens`

### `useCognitiveBudget`
- **Location:** `packages/hooks/src/use-cognitive-budget.ts`
- **Purpose:** Enforce UX constraints as design tokens (max pins, max widgets, etc.)
- **Parameters:** `(surface: CognitiveSurface, constraint: CognitiveBudgetKey)`
- **Returns:** `number` (the constraint value)
- **Also exports:** `useCognitiveBudgets(surface)`, `useIsBudgetExceeded(surface, constraint, items)`, `useEnforceBudget(surface, constraint, items)`, `useWarnIfBudgetExceeded(surface, constraint, items)`, `useAllCognitiveBudgets()`
- **Dependencies:** `@hive/tokens` (slotKit.cognitiveBudgets)

### `useCognitiveBudget` (legacy topology)
- **Location:** `packages/hooks/src/topology/use-cognitive-budget.ts`
- **Purpose:** Legacy cognitive budget with pin enforcement and deduplication
- **Parameters:** `(surface: SurfaceKey)`
- **Returns:** `{ budget, enforcePinCap(items, maxPins?), dedupePinsAgainstRail(pins, railWidgets), getMaxRailWidgets(), getComposerActionCap() }`
- **Dependencies:** `@hive/tokens` (slotKit)

---

## Firebase Real-time (Generic)

### `useRealtimeCollection`
- **Location:** `packages/hooks/src/use-realtime-collection.ts`
- **Purpose:** Generic Firestore collection subscription with transform
- **Parameters:** `(collectionPath: string, options?: { constraints?, transform?, enabled?, onError? })`
- **Returns:** `{ items: T[], loading, error, isConnected, lastUpdated }`
- **Dependencies:** `@hive/firebase` (db), Firebase Firestore onSnapshot

### `useRealtimeDocument`
- **Location:** `packages/hooks/src/use-realtime-document.ts`
- **Purpose:** Generic Firestore single document subscription with transform
- **Parameters:** `(documentPath: string, options?: { transform?, enabled?, onError? })`
- **Returns:** `{ document: T | null, loading, error, isConnected, lastUpdated, exists }`
- **Dependencies:** `@hive/firebase` (db), Firebase Firestore onSnapshot

### `realtime-utils`
- **Location:** `packages/hooks/src/realtime-utils.ts`
- **Purpose:** Shared utilities for Firestore data transformation (not a hook)
- **Exports:** `parseTimestamp(value)`, `mapDocument<T>(id, data, transform?)`, `isTimestamp(value)`, `parseOptionalTimestamp(value)`
- **Dependencies:** `firebase/firestore` (Timestamp)

---

## Core Data Hooks (packages/hooks)

### `useHiveQuery`
- **Location:** `packages/hooks/src/use-hive-query.ts`
- **Purpose:** Core query hook with in-memory caching, offline support, real-time integration, SWR
- **Parameters:** `(config: HiveQueryConfig<T>)` -- includes queryKey, queryFn, realtimeFn?, staleTime, cacheTime, enableRealtime, enableOfflineCache
- **Returns:** `{ data, initial, refreshing, loadingMore, revalidating, error, isStale, isRealtime, lastUpdated, hasOfflineData, hasMore, refetch, loadMore, invalidate }`
- **Also exports:** `prefetchQuery(config)`, `invalidateQueries(partialKey)`, `clearQueryCache()`
- **Dependencies:** `@hive/core` types, `LoadingContext`

### `useHiveMutation`
- **Location:** `packages/hooks/src/use-hive-mutation.ts`
- **Purpose:** Core mutation hook with optimistic updates, retry, and rollback
- **Parameters:** `(config: HiveMutationConfig<TData, TVariables>)` -- includes mutationFn, optimisticUpdate?, retry?, retryDelay?
- **Returns:** `{ data, loading, error, optimisticData, variables, isIdle, isSuccess, isError, mutate, mutateAsync, reset }`
- **Also exports:** `useMutationWithInvalidation(config)`, `useListMutation(config)`
- **Dependencies:** `@hive/core` types, `LoadingContext`

### `useOptimisticToggle` / `useOptimisticAdd` / `useOptimisticRemove` / `useOptimisticUpdate` / `useBatchMutation`
- **Location:** `packages/hooks/src/use-optimistic-mutation.ts`
- **Purpose:** Convenience hooks for common optimistic update patterns
- **Parameters:** Vary per hook
- **Returns:** Mutation state with optimistic data
- **Also exports:** `optimisticList` (add/remove/update/prepend/append), `optimisticEngagement` (toggleLike/toggleBookmark/addComment), `optimisticSpace` (join/leave)
- **Dependencies:** `useHiveMutation`, `useMutationWithInvalidation`

### `useSpaces` / `useSpace`
- **Location:** `packages/hooks/src/use-spaces.ts`
- **Purpose:** Fetch and manage spaces data with caching via `useHiveQuery`
- **Parameters:** `useSpaces(config?: UseSpacesConfig)` / `useSpace(spaceId?)`
- **Returns:** `{ spaces, hasMore, nextCursor, isLoading, isRefreshing, error, refetch, invalidate, queryState }`
- **Dependencies:** `useHiveQuery`, `@hive/auth-logic` (useAuth)

---

## Loading State

### `LoadingProvider` / `useLoadingContext`
- **Location:** `packages/hooks/src/loading-context.tsx`
- **Purpose:** Global loading state coordination (active queries, mutations, critical loading)
- **Exports:**
  - `LoadingProvider` -- Context provider component
  - `useLoadingContext()` -- Access raw loading context
  - `useIsLoading()` -- Any queries or mutations active
  - `useIsQueryLoading(pattern)` -- Specific query loading
  - `useIsMutating()` -- Any mutation in progress
  - `useIsCriticalLoading()` -- Critical queries blocking interaction
- **Dependencies:** React Context

---

## HiveLab Generation

### `useStreamingGeneration`
- **Location:** `packages/hooks/src/use-streaming-generation.ts`
- **Purpose:** Consume AI tool generation streaming API with real-time canvas updates
- **Parameters:** `(callbacks?: { onElementAdded?, onComplete?, onError?, onStatusUpdate? })`
- **Returns:** `{ state: GenerationState, generate(options), cancel, reset, hydrate(composition) }`
- **Dependencies:** Streaming fetch to `/api/tools/generate`

### `useToolExecution`
- **Location:** `packages/hooks/src/use-tool-execution.ts`
- **Purpose:** Complete tool execution runtime: load/save state, execute actions, SSE real-time updates
- **Parameters:** `(options: { deploymentId, spaceId?, toolId?, onStateUpdate?, onError?, onActionComplete?, enableRealtime?, autoLoad? })`
- **Returns:** `{ state, isLoading, isExecuting, error, isConnected, executeAction(elementId, action, data?), refresh, getElementState(instanceId), setOptimisticState(instanceId, state) }`
- **Also exports:** `createElementActionHandler(executeAction, elementId)` utility
- **Dependencies:** SSE via `/api/tools/updates`, fetches `/api/tools/state`, `/api/tools/execute`

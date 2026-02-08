'use client';

/**
 * useSpaceResidenceState - State management for the /s/[handle] Space page
 *
 * Composes data from existing context providers for the SpaceShell layout:
 * - Space metadata (name, handle, avatar, online count)
 * - Board tabs (boards with unread counts)
 * - Chat messages (for main content)
 * - Panel data (NOW/NEXT UP/PINNED)
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { usePresence, useOnlineUsers } from '@/hooks/use-presence';
import { useAuth } from '@hive/auth-logic';
import type { Board, SpacePanelOnlineMember, UpcomingEvent, PinnedItem } from '@hive/ui';
import type { PlacedToolDTO } from '@/hooks/use-space-tools';
import { logger } from '@/lib/logger';

// Re-export types locally for convenience
type OnlineMember = SpacePanelOnlineMember;

// ============================================
// TYPES
// ============================================

/**
 * Gatherer profile for displaying who's waiting in a ghost/gathering space
 */
export interface GathererProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  isFoundingMember?: boolean;
}

export interface SpaceResidenceData {
  id: string;
  handle: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  onlineCount: number;
  isVerified: boolean;
  isMember: boolean;
  isLeader: boolean;
  userRole?: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
  // Quorum-based activation (GTM mechanic)
  activationStatus: 'ghost' | 'gathering' | 'open';
  activationThreshold: number;
  activatedAt?: string;
  isClaimed: boolean;
  // Gatherers (for ghost/gathering spaces - who's waiting for quorum)
  gatherers: GathererProfile[];
  // CampusLabs imported metadata (P2.2, P2.3)
  email?: string;
  contactName?: string;
  orgTypeName?: string;
  foundedDate?: string;
  source?: 'ublinked' | 'user-created';
  sourceUrl?: string;
  socialLinks?: {
    website?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
  };
}

export interface ChatAttachment {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  boardId: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl?: string;
  content: string;
  timestamp: number;
  reactions?: Array<{ emoji: string; count: number; hasReacted: boolean }>;
  isPinned?: boolean;
  replyCount?: number;
  attachments?: ChatAttachment[];
  /** Whether message has been edited */
  isEdited?: boolean;
  /** When the message was last edited (ISO timestamp) */
  editedAt?: string;
}

export interface SpaceMember {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  role?: 'owner' | 'admin' | 'moderator' | 'member';
  isOnline?: boolean;
  joinedAt?: string;
}

// Pagination constants
const INITIAL_MESSAGE_LIMIT = 20;
const LOAD_MORE_MESSAGE_LIMIT = 30;

interface UseSpaceResidenceStateReturn {
  // Space data
  space: SpaceResidenceData | null;
  isLoading: boolean;
  error: string | null;

  // Board tabs
  boards: Board[];
  activeBoard: string;
  setActiveBoard: (boardId: string) => void;
  canAddBoard: boolean;

  // Chat (main content)
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<void>;
  typingUsers: string[];
  sendMessage: (content: string, attachments?: ChatAttachment[]) => Promise<void>;

  // "Since you left" feature
  lastReadAt: number | null;
  unreadCount: number;

  // Panel data
  onlineMembers: OnlineMember[];
  upcomingEvents: UpcomingEvent[];
  pinnedItems: PinnedItem[];

  // Members
  allMembers: SpaceMember[];
  isLoadingMembers: boolean;

  // Panel state
  panelCollapsed: boolean;
  setPanelCollapsed: (collapsed: boolean) => void;

  // Actions
  joinSpace: () => Promise<void>;
  leaveSpace: () => Promise<void>;
  rsvpToEvent: (eventId: string, status?: 'going' | 'maybe' | 'not_going') => Promise<void>;

  // Navigation
  navigateBack: () => void;
  navigateToSettings: () => void;

  // Tools (HiveLab Sprint 1)
  sidebarTools: PlacedToolDTO[];
  isLoadingTools: boolean;
  refreshTools: () => Promise<void>;

  // Refresh
  refreshSpace: () => Promise<void>;
}

// ============================================
// DEFAULT EMPTY STATES (no mock data)
// ============================================

// Default board for new spaces
const DEFAULT_BOARDS: Board[] = [
  { id: 'general', name: 'general', isDefault: true, unreadCount: 0 },
];

// ============================================
// HOOK
// ============================================

export function useSpaceResidenceState(handle: string): UseSpaceResidenceStateReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  // Presence: heartbeat handled by usePresence(), online users by useOnlineUsers()
  usePresence();
  const { onlineUsers: campusOnlineUsers } = useOnlineUsers();

  // URL-driven board selection
  const initialBoard = searchParams.get('board') || 'general';

  // State
  const [space, setSpace] = React.useState<SpaceResidenceData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [boards, setBoards] = React.useState<Board[]>(DEFAULT_BOARDS);
  const [activeBoard, setActiveBoardInternal] = React.useState(initialBoard);

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = React.useState(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(false);
  const [typingUsers, _setTypingUsers] = React.useState<string[]>([]);

  // "Since you left" feature state
  const [lastReadAt, setLastReadAt] = React.useState<number | null>(null);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Initialize with empty arrays - real data comes from API
  const [onlineMembers, setOnlineMembers] = React.useState<OnlineMember[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<UpcomingEvent[]>([]);
  const [pinnedItems] = React.useState<PinnedItem[]>([]);
  const [allMembers, setAllMembers] = React.useState<SpaceMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = React.useState(false);

  const [panelCollapsed, setPanelCollapsed] = React.useState(false);

  // Tools state (HiveLab Sprint 1)
  const [sidebarTools, setSidebarTools] = React.useState<PlacedToolDTO[]>([]);
  const [isLoadingTools, setIsLoadingTools] = React.useState(false);

  // Load space data from API
  React.useEffect(() => {
    async function loadSpace() {
      setIsLoading(true);
      setError(null);

      try {
        // Resolve slug to space ID first
        const resolveResponse = await fetch(`/api/spaces/resolve-slug/${handle}`);
        if (!resolveResponse.ok) {
          if (resolveResponse.status === 404) {
            setError('Space not found');
            return;
          }
          throw new Error('Failed to resolve space');
        }
        const resolveResult = await resolveResponse.json();
        const spaceId = resolveResult.data?.spaceId || resolveResult.spaceId;

        if (!spaceId) {
          setError('Space not found');
          return;
        }

        // Fetch space data
        const spaceResponse = await fetch(`/api/spaces/${spaceId}`);
        if (!spaceResponse.ok) {
          throw new Error('Failed to load space');
        }
        const spaceResult = await spaceResponse.json();
        const spaceData = spaceResult.data || spaceResult;

        // Calculate activation status from API data or derive from member count
        const memberCount = spaceData.memberCount || 0;
        const threshold = spaceData.activationThreshold || 10;
        const isClaimed = Boolean(spaceData.createdBy || spaceData.creatorId);
        let activationStatus: 'ghost' | 'gathering' | 'open' = spaceData.activationStatus;
        if (!activationStatus) {
          // Derive from member count if not provided
          if (isClaimed) {
            activationStatus = 'open';
          } else if (memberCount === 0) {
            activationStatus = 'ghost';
          } else if (memberCount < threshold) {
            activationStatus = 'gathering';
          } else {
            activationStatus = 'open';
          }
        }

        setSpace({
          id: spaceId,
          handle: spaceData.slug || handle,
          name: spaceData.name || handle,
          description: spaceData.description,
          avatarUrl: spaceData.avatarUrl || spaceData.iconURL,
          bannerUrl: spaceData.bannerUrl || spaceData.coverImageURL,
          memberCount,
          onlineCount: spaceData.onlineCount || 0,
          isVerified: spaceData.isVerified || false,
          isMember: spaceData.isMember || false,
          isLeader: spaceData.isLeader || false,
          userRole: spaceData.membership?.role || (spaceData.isLeader ? 'admin' : (spaceData.isMember ? 'member' : undefined)),
          // Quorum-based activation
          activationStatus,
          activationThreshold: threshold,
          activatedAt: spaceData.activatedAt,
          isClaimed,
          // Gatherers (for ghost/gathering spaces)
          gatherers: spaceData.gatherers || [],
          // CampusLabs imported metadata (P2.2, P2.3)
          email: spaceData.email,
          contactName: spaceData.contactName,
          orgTypeName: spaceData.orgTypeName,
          foundedDate: spaceData.foundedDate,
          source: spaceData.source,
          sourceUrl: spaceData.sourceUrl,
          socialLinks: spaceData.socialLinks,
        });

        // Fetch boards for this space
        const boardsResponse = await fetch(`/api/spaces/${spaceId}/boards`);
        if (boardsResponse.ok) {
          const boardsData = await boardsResponse.json();
          if (boardsData.boards && boardsData.boards.length > 0) {
            // Set boards with unread counts from API
            // The API returns unread counts directly; if not available, use 0
            const boardsWithUnread = boardsData.boards.map((board: Board) => ({
              ...board,
              unreadCount: board.unreadCount ?? 0,
            }));

            setBoards(boardsWithUnread);
          }
        }

        // Fetch upcoming events for this space (increased limit from 5 to 20 for better coverage)
        const eventsResponse = await fetch(`/api/events?spaceId=${spaceId}&upcoming=true&limit=20`);
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          const events = eventsData.data?.events || eventsData.events || [];
          setUpcomingEvents(events.map((e: {
            id: string;
            title: string;
            startTime?: string;
            locationName?: string;
            goingCount?: number;
            rsvpStatus?: 'going' | 'maybe' | 'not_going' | null;
            description?: string;
            locationType?: string;
            virtualLink?: string;
          }) => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime,
            location: e.locationName || 'TBD',
            goingCount: e.goingCount || 0,
            // P1.4: Map rsvpStatus from API to userRsvp for proper RSVP button state
            userRsvp: e.rsvpStatus || null,
            description: e.description,
            isOnline: e.locationType === 'virtual',
            virtualLink: e.virtualLink,
          })));
        }

        // Fetch sidebar tools for this space (HiveLab Sprint 1)
        setIsLoadingTools(true);
        try {
          const toolsResponse = await fetch(`/api/spaces/${spaceId}/tools?placement=sidebar&status=active`);
          if (toolsResponse.ok) {
            const toolsData = await toolsResponse.json();
            setSidebarTools(toolsData.tools || []);
          }
        } finally {
          setIsLoadingTools(false);
        }
      } catch {
        setError('Failed to load space');
      } finally {
        setIsLoading(false);
      }
    }

    if (handle) {
      loadSpace();
    }
  }, [handle]);

  // Load messages when board changes (initial load with limit for fast first paint)
  React.useEffect(() => {
    async function loadMessages() {
      if (!space?.id) return;

      setIsLoadingMessages(true);
      setHasMoreMessages(false);
      // Reset "Since you left" state on board change
      setLastReadAt(null);
      setUnreadCount(0);

      try {
        // Initial load: fetch first N messages for fast render
        const response = await fetch(
          `/api/spaces/${space.id}/chat?boardId=${activeBoard}&limit=${INITIAL_MESSAGE_LIMIT}`
        );
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          setHasMoreMessages(data.hasMore || false);

          // Capture "Since you left" data from API
          if (data.lastReadAt) {
            setLastReadAt(data.lastReadAt);
            setUnreadCount(data.unreadCount || 0);
          }

          // Mark messages as read for this board (after a short delay to show divider)
          if (data.messages && data.messages.length > 0) {
            const latestMessage = data.messages[data.messages.length - 1];
            const lastReadTimestamp = latestMessage.timestamp || Date.now();

            // Delay marking as read so user sees the divider first
            setTimeout(() => {
              // Update read receipt (fire and forget - don't block UI)
              fetch(`/api/spaces/${space.id}/chat/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  boardId: activeBoard,
                  lastReadTimestamp,
                }),
              }).catch(() => {
                // Silent fail - unread count will update on next load
              });

              // Clear "Since you left" state after marking as read
              setLastReadAt(null);
              setUnreadCount(0);
            }, 3000); // 3 second delay to let user see the divider

            // Optimistically clear unread count for this board
            setBoards((prev) =>
              prev.map((board) =>
                board.id === activeBoard ? { ...board, unreadCount: 0 } : board
              )
            );
          }
        } else {
          // No messages yet - that's okay
          setMessages([]);
          setHasMoreMessages(false);
        }
      } catch {
        setMessages([]);
        setHasMoreMessages(false);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    loadMessages();
  }, [activeBoard, space?.id]);

  // Load more messages (cursor-based pagination - loads older messages)
  const loadMoreMessages = React.useCallback(async () => {
    if (!space?.id || !hasMoreMessages || isLoadingMoreMessages || messages.length === 0) return;

    setIsLoadingMoreMessages(true);

    try {
      // Get the oldest message timestamp as cursor
      const oldestMessage = messages[0];
      const before = oldestMessage?.timestamp;

      const response = await fetch(
        `/api/spaces/${space.id}/chat?boardId=${activeBoard}&limit=${LOAD_MORE_MESSAGE_LIMIT}&before=${before}`
      );

      if (response.ok) {
        const data = await response.json();
        const olderMessages = data.messages || [];

        // Prepend older messages to the front
        setMessages((prev) => [...olderMessages, ...prev]);
        setHasMoreMessages(data.hasMore || false);
      }
    } catch (error) {
      logger.error('Failed to load more messages', error instanceof Error ? error : new Error(String(error)));
      toast.error("Failed to load older messages", "Please try again");
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [space?.id, activeBoard, hasMoreMessages, isLoadingMoreMessages, messages, toast]);

  // Load all members when space loads
  React.useEffect(() => {
    async function loadMembers() {
      if (!space?.id || !space.isMember) return;

      setIsLoadingMembers(true);

      try {
        const response = await fetch(`/api/spaces/${space.id}/members`);
        if (response.ok) {
          const data = await response.json();
          setAllMembers(data.members || []);
        } else {
          setAllMembers([]);
        }
      } catch {
        setAllMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    }

    loadMembers();
  }, [space?.id, space?.isMember]);

  // Derive online members from campus-wide presence data crossed with space members
  React.useEffect(() => {
    if (!allMembers.length || !campusOnlineUsers.length) return;

    const memberIds = new Set(allMembers.map((m) => m.id));
    const onlineMembersList = campusOnlineUsers
      .filter((u) => memberIds.has(u.userId))
      .map((u) => ({
        id: u.userId,
        handle: u.handle,
        name: u.name,
        avatar: u.avatar,
      }));

    setOnlineMembers(onlineMembersList);
    setSpace((prev) =>
      prev ? { ...prev, onlineCount: onlineMembersList.length } : null
    );
  }, [allMembers, campusOnlineUsers]);

  // Update URL when board changes
  const setActiveBoard = React.useCallback(
    (boardId: string) => {
      setActiveBoardInternal(boardId);
      const params = new URLSearchParams(searchParams.toString());
      if (boardId === 'general') {
        params.delete('board');
      } else {
        params.set('board', boardId);
      }
      const newUrl = params.toString() ? `/s/${handle}?${params.toString()}` : `/s/${handle}`;
      window.history.replaceState(null, '', newUrl);
    },
    [handle, searchParams]
  );

  // Actions
  const sendMessage = React.useCallback(async (content: string, attachments?: ChatAttachment[]) => {
    if (!space?.id) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      boardId: activeBoard,
      authorId: authUser?.id || 'current-user',
      authorName: authUser?.fullName || authUser?.displayName || 'You',
      authorHandle: authUser?.handle || 'you',
      authorAvatarUrl: authUser?.avatarUrl || undefined,
      content,
      timestamp: Date.now(),
      attachments,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch(`/api/spaces/${space.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: activeBoard,
          content,
          attachments,
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data = await response.json();
      // Update temp message with real ID
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, id: data.messageId, timestamp: data.timestamp } : m
        )
      );
    } catch (error) {
      // Revert optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      logger.error('Failed to send message', error instanceof Error ? error : new Error(String(error)));
      toast.error("Message failed to send", "Please try again");
      throw error;
    }
  }, [activeBoard, space?.id, toast, authUser]);

  const joinSpace = React.useCallback(async () => {
    if (!space?.id) return;

    // Optimistic update
    setSpace((prev) => (prev ? { ...prev, isMember: true, memberCount: prev.memberCount + 1 } : null));

    try {
      const response = await fetch('/api/spaces/join-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: space.id,
          joinMethod: 'manual',
        }),
      });

      if (!response.ok) {
        // Revert optimistic update
        setSpace((prev) => (prev ? { ...prev, isMember: false, memberCount: prev.memberCount - 1 } : null));
        const errorData = await response.json().catch(() => ({}));

        // Map API error to user-friendly message
        const apiError = errorData.error || 'Failed to join space';
        const userFriendlyError = mapJoinErrorToUserMessage(apiError, errorData.code);

        throw new Error(userFriendlyError);
      }

      // Reload members after joining
      const membersResponse = await fetch(`/api/spaces/${space.id}/members`);
      if (membersResponse.ok) {
        const data = await membersResponse.json();
        setAllMembers(data.members || []);
      }
    } catch (error) {
      // Revert optimistic update
      setSpace((prev) => (prev ? { ...prev, isMember: false, memberCount: prev.memberCount - 1 } : null));
      logger.error('Failed to join space', error instanceof Error ? error : new Error(String(error)));
      // Re-throw with the mapped error message (don't override with generic)
      throw error;
    }
  }, [space?.id]);

  const leaveSpace = React.useCallback(async () => {
    if (!space?.id) return;

    // Optimistic update
    setSpace((prev) => (prev ? { ...prev, isMember: false, memberCount: prev.memberCount - 1 } : null));

    try {
      const response = await fetch('/api/spaces/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: space.id,
        }),
      });

      if (!response.ok) {
        // Revert optimistic update
        setSpace((prev) => (prev ? { ...prev, isMember: true, memberCount: prev.memberCount + 1 } : null));
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to leave space');
      }
    } catch (error) {
      // Revert optimistic update
      setSpace((prev) => (prev ? { ...prev, isMember: true, memberCount: prev.memberCount + 1 } : null));
      logger.error('Failed to leave space', error instanceof Error ? error : new Error(String(error)));
      toast.error("Couldn't leave space", "Please try again");
      throw error;
    }
  }, [space?.id, toast]);

  const rsvpToEvent = React.useCallback(async (eventId: string, status: 'going' | 'maybe' | 'not_going' = 'going') => {
    if (!space?.id) return;

    // Optimistic update
    const previousEvents = [...upcomingEvents];
    setUpcomingEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, goingCount: e.goingCount + 1 } : e))
    );

    try {
      const response = await fetch(`/api/spaces/${space.id}/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        // Revert optimistic update
        setUpcomingEvents(previousEvents);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to RSVP');
      }

      const data = await response.json();
      // Update with actual attendee count from server
      setUpcomingEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, goingCount: data.currentAttendees } : e))
      );
    } catch (error) {
      // Revert optimistic update
      setUpcomingEvents(previousEvents);
      logger.error('Failed to RSVP', error instanceof Error ? error : new Error(String(error)));
      toast.error("RSVP failed", "Please try again");
      throw error;
    }
  }, [space?.id, upcomingEvents, toast]);

  // Navigation
  const navigateBack = React.useCallback(() => {
    router.push('/campus');
  }, [router]);

  const navigateToSettings = React.useCallback(() => {
    router.push(`/s/${handle}/settings`);
  }, [router, handle]);

  // Refresh tools (HiveLab Sprint 1)
  const refreshTools = React.useCallback(async () => {
    if (!space?.id) return;

    setIsLoadingTools(true);
    try {
      const response = await fetch(`/api/spaces/${space.id}/tools?placement=sidebar&status=active`);
      if (response.ok) {
        const data = await response.json();
        setSidebarTools(data.tools || []);
      }
    } catch (error) {
      logger.error('Failed to refresh tools', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoadingTools(false);
    }
  }, [space?.id]);

  // Refresh space data (for after settings updates)
  const refreshSpace = React.useCallback(async () => {
    if (!space?.id) return;

    try {
      // Refetch space data
      const spaceResponse = await fetch(`/api/spaces/${space.id}`);
      if (spaceResponse.ok) {
        const spaceResult = await spaceResponse.json();
        const spaceData = spaceResult.data || spaceResult;

        setSpace((prev) => prev ? {
          ...prev,
          name: spaceData.name || prev.name,
          description: spaceData.description,
          avatarUrl: spaceData.avatarUrl || spaceData.iconURL,
          bannerUrl: spaceData.bannerUrl || spaceData.coverImageURL,
          memberCount: spaceData.memberCount || prev.memberCount,
          onlineCount: spaceData.onlineCount || prev.onlineCount,
          isVerified: spaceData.isVerified || prev.isVerified,
          email: spaceData.email,
          contactName: spaceData.contactName,
          socialLinks: spaceData.socialLinks,
        } : null);
      }

      // Refetch boards
      const boardsResponse = await fetch(`/api/spaces/${space.id}/boards`);
      if (boardsResponse.ok) {
        const boardsData = await boardsResponse.json();
        if (boardsData.boards && boardsData.boards.length > 0) {
          const boardsWithUnread = boardsData.boards.map((board: Board) => ({
            ...board,
            unreadCount: board.unreadCount ?? 0,
          }));
          setBoards(boardsWithUnread);
        }
      }
    } catch (error) {
      logger.error('Failed to refresh space', error instanceof Error ? error : new Error(String(error)));
    }
  }, [space?.id]);

  return {
    // Space data
    space,
    isLoading,
    error,

    // Board tabs
    boards,
    activeBoard,
    setActiveBoard,
    canAddBoard: space?.isLeader ?? false,

    // Chat
    messages,
    isLoadingMessages,
    isLoadingMoreMessages,
    hasMoreMessages,
    loadMoreMessages,
    typingUsers,
    sendMessage,

    // "Since you left" feature
    lastReadAt,
    unreadCount,

    // Panel data
    onlineMembers,
    upcomingEvents,
    pinnedItems,

    // Members
    allMembers,
    isLoadingMembers,

    // Panel state
    panelCollapsed,
    setPanelCollapsed,

    // Actions
    joinSpace,
    leaveSpace,
    rsvpToEvent,

    // Navigation
    navigateBack,
    navigateToSettings,

    // Tools (HiveLab Sprint 1)
    sidebarTools,
    isLoadingTools,
    refreshTools,

    // Refresh
    refreshSpace,
  };
}

export default useSpaceResidenceState;

/**
 * Maps API error messages to user-friendly messages for space join failures.
 * Handles all known error cases from the join-v2 API.
 */
function mapJoinErrorToUserMessage(apiError: string, errorCode?: string): string {
  // Handle specific error codes first
  if (errorCode === 'CONFLICT') {
    return "You're already a member of this space";
  }
  if (errorCode === 'FORBIDDEN') {
    return "You don't have permission to join this space";
  }
  if (errorCode === 'RESOURCE_NOT_FOUND') {
    return "This space no longer exists";
  }

  // Handle specific error messages
  const errorLower = apiError.toLowerCase();

  if (errorLower.includes('already a member') || errorLower.includes('user is already a member')) {
    return "You're already a member of this space";
  }
  if (errorLower.includes('private') && errorLower.includes('invitation')) {
    return "This space is invite-only. Request an invitation from a member.";
  }
  if (errorLower.includes('not active') || errorLower.includes('space is not active')) {
    return "This space is no longer active";
  }
  if (errorLower.includes('greek life')) {
    return "You can only be a member of one Greek organization";
  }
  if (errorLower.includes('suspended')) {
    return "Your membership in this space has been suspended";
  }
  if (errorLower.includes('banned')) {
    return "You've been banned from joining this space";
  }
  if (errorLower.includes('space is full') || errorLower.includes('member limit')) {
    return "This space has reached its member limit";
  }
  if (errorLower.includes('permission denied') || errorLower.includes('access denied')) {
    return "You don't have permission to join this space";
  }
  if (errorLower.includes('campus mismatch')) {
    return "This space is not available at your campus";
  }
  if (errorLower.includes('not found')) {
    return "This space no longer exists";
  }

  // Network/server errors
  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return "Network error. Check your connection and try again.";
  }

  // Default fallback - return the original if it's reasonably user-friendly
  if (apiError.length < 100 && !apiError.includes('Error:')) {
    return apiError;
  }

  return "Unable to join this space right now. Please try again.";
}

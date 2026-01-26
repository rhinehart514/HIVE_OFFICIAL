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
import type { Board, SpacePanelOnlineMember, UpcomingEvent, PinnedItem } from '@hive/ui';
import type { PlacedToolDTO } from '@/hooks/use-space-tools';

// Re-export types locally for convenience
type OnlineMember = SpacePanelOnlineMember;

// ============================================
// TYPES
// ============================================

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
}

export interface SpaceMember {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  role?: 'leader' | 'moderator' | 'member';
  isOnline?: boolean;
  joinedAt?: string;
}

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
  typingUsers: string[];
  sendMessage: (content: string) => Promise<void>;

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
  const [typingUsers, _setTypingUsers] = React.useState<string[]>([]);

  // Initialize with empty arrays - real data comes from API
  const [onlineMembers, setOnlineMembers] = React.useState<OnlineMember[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<UpcomingEvent[]>([]);
  const [pinnedItems, setPinnedItems] = React.useState<PinnedItem[]>([]);
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

        setSpace({
          id: spaceId,
          handle: spaceData.slug || handle,
          name: spaceData.name || handle,
          description: spaceData.description,
          avatarUrl: spaceData.avatarUrl || spaceData.iconURL,
          bannerUrl: spaceData.bannerUrl || spaceData.coverImageURL,
          memberCount: spaceData.memberCount || 0,
          onlineCount: spaceData.onlineCount || 0,
          isVerified: spaceData.isVerified || false,
          isMember: spaceData.isMember || false,
          isLeader: spaceData.isLeader || false,
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

  // Load messages when board changes
  React.useEffect(() => {
    async function loadMessages() {
      if (!space?.id) return;

      setIsLoadingMessages(true);

      try {
        const response = await fetch(`/api/spaces/${space.id}/chat?boardId=${activeBoard}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);

          // Mark messages as read for this board
          if (data.messages && data.messages.length > 0) {
            const latestMessage = data.messages[data.messages.length - 1];
            const lastReadTimestamp = latestMessage.timestamp || Date.now();

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
        }
      } catch {
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    loadMessages();
  }, [activeBoard, space?.id]);

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

  // Update user's own presence when viewing space (heartbeat)
  React.useEffect(() => {
    if (!space?.id || !space.isMember) return;

    const updatePresence = async (status: 'online' | 'offline' = 'online') => {
      try {
        await fetch('/api/realtime/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            activity: {
              type: 'viewing',
              context: {
                spaceId: space.id,
                spaceName: space.name,
              },
            },
          }),
        });
      } catch {
        // Silent fail - presence updates are non-critical
      }
    };

    // Set online when entering space
    updatePresence('online');

    // Send heartbeat every 60 seconds to stay "online"
    const heartbeatInterval = setInterval(() => updatePresence('online'), 60000);

    // Set offline when leaving
    return () => {
      clearInterval(heartbeatInterval);
      updatePresence('offline');
    };
  }, [space?.id, space?.isMember, space?.name]);

  // Real-time presence polling - updates online count every 30 seconds
  React.useEffect(() => {
    if (!space?.id || !space.isMember) return;

    const fetchPresence = async () => {
      try {
        const response = await fetch(`/api/realtime/presence?spaceId=${space.id}`);
        if (response.ok) {
          const data = await response.json();
          const spacePresence = data.spacePresence;
          if (spacePresence) {
            // Update online count from presence data
            setSpace((prev) =>
              prev
                ? {
                    ...prev,
                    onlineCount: spacePresence.statistics?.totalOnline || prev.onlineCount,
                  }
                : null
            );
            // Update online members list for the panel
            if (spacePresence.activeUsers && spacePresence.activeUsers.length > 0) {
              setOnlineMembers(
                spacePresence.activeUsers.map((u: { userId: string; userName: string; status: string }) => ({
                  id: u.userId,
                  name: u.userName,
                  avatarUrl: undefined, // Presence API doesn't include avatars
                  status: u.status,
                }))
              );
            }
          }
        }
      } catch {
        // Silent fail - presence polling is non-critical
      }
    };

    // Initial fetch
    fetchPresence();

    // Poll every 30 seconds
    const interval = setInterval(fetchPresence, 30000);

    return () => clearInterval(interval);
  }, [space?.id, space?.isMember]);

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
  const sendMessage = React.useCallback(async (content: string) => {
    if (!space?.id) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      boardId: activeBoard,
      authorId: 'current-user',
      authorName: 'You',
      authorHandle: 'you',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch(`/api/spaces/${space.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: activeBoard,
          content,
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
      console.error('Failed to send message:', error);
      toast.error("Message failed to send", "Please try again");
      throw error;
    }
  }, [activeBoard, space?.id, toast]);

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
        throw new Error(errorData.message || 'Failed to join space');
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
      console.error('Failed to join space:', error);
      toast.error("Couldn't join space", "Please try again");
      throw error;
    }
  }, [space?.id, toast]);

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
      console.error('Failed to leave space:', error);
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
      console.error('Failed to RSVP:', error);
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
      console.error('Failed to refresh tools:', error);
    } finally {
      setIsLoadingTools(false);
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
    typingUsers,
    sendMessage,

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
  };
}

export default useSpaceResidenceState;

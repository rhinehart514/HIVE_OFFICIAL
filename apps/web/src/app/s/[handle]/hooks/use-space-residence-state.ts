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
import type { Board, SpacePanelOnlineMember, UpcomingEvent, PinnedItem } from '@hive/ui';

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

  // Panel state
  panelCollapsed: boolean;
  setPanelCollapsed: (collapsed: boolean) => void;

  // Actions
  joinSpace: () => Promise<void>;
  leaveSpace: () => Promise<void>;
  rsvpToEvent: (eventId: string) => Promise<void>;

  // Navigation
  navigateBack: () => void;
  navigateToSettings: () => void;
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

  const [panelCollapsed, setPanelCollapsed] = React.useState(false);

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
        const { spaceId } = await resolveResponse.json();

        // Fetch space data
        const spaceResponse = await fetch(`/api/spaces/${spaceId}`);
        if (!spaceResponse.ok) {
          throw new Error('Failed to load space');
        }
        const spaceData = await spaceResponse.json();

        setSpace({
          id: spaceId,
          handle: spaceData.slug || handle,
          name: spaceData.name || handle,
          description: spaceData.description,
          avatarUrl: spaceData.avatarUrl,
          bannerUrl: spaceData.bannerUrl,
          memberCount: spaceData.memberCount || 0,
          onlineCount: spaceData.onlineCount || 0,
          isVerified: spaceData.isVerified || false,
          isMember: spaceData.isMember || false,
          isLeader: spaceData.isLeader || false,
        });

        // Fetch boards for this space
        const boardsResponse = await fetch(`/api/spaces/${spaceId}/boards`);
        if (boardsResponse.ok) {
          const boardsData = await boardsResponse.json();
          if (boardsData.boards && boardsData.boards.length > 0) {
            setBoards(boardsData.boards);
          }
        }
      } catch (err) {
        setError('Failed to load space');
        console.error(err);
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
        } else {
          // No messages yet - that's okay
          setMessages([]);
        }
      } catch (err) {
        console.error(err);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    loadMessages();
  }, [activeBoard, space?.id]);

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
    // TODO: Implement real message sending
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      boardId: activeBoard,
      authorId: 'current-user',
      authorName: 'You',
      authorHandle: 'you',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, [activeBoard]);

  const joinSpace = React.useCallback(async () => {
    // TODO: Implement real join
    setSpace((prev) => (prev ? { ...prev, isMember: true, memberCount: prev.memberCount + 1 } : null));
  }, []);

  const leaveSpace = React.useCallback(async () => {
    // TODO: Implement real leave
    setSpace((prev) => (prev ? { ...prev, isMember: false, memberCount: prev.memberCount - 1 } : null));
  }, []);

  const rsvpToEvent = React.useCallback(async (eventId: string) => {
    // TODO: Implement real RSVP
    setUpcomingEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, goingCount: e.goingCount + 1 } : e))
    );
  }, []);

  // Navigation
  const navigateBack = React.useCallback(() => {
    router.push('/campus');
  }, [router]);

  const navigateToSettings = React.useCallback(() => {
    router.push(`/s/${handle}/settings`);
  }, [router, handle]);

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
  };
}

export default useSpaceResidenceState;

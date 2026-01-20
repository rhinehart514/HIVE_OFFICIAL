/**
 * useSpacePageState - Unified state management for Space Detail Page
 *
 * Combines all page state and wires up the extracted handlers.
 * Reduces the page from 1,880 lines to ~400 by extracting state logic.
 *
 * @author HIVE Frontend Team
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';
import { useSpaceMetadata, useSpaceEvents, useSpaceLeader } from '@/contexts/space';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useChatIntent, mightHaveIntent } from '@/hooks/use-chat-intent';
import { useToolRuntime } from '@/hooks/use-tool-runtime';
import { usePinnedMessages } from '@/hooks/use-pinned-messages';
import { useLeaderOnboarding } from '@/hooks/use-leader-onboarding';
import { useJoinRequest } from '@/hooks/use-join-request';
import { useSpaceWelcome } from '@hive/ui';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import {
  createSpaceHandlers,
  createChatHandlers,
  createToolHandlers,
  createAutomationHandlers,
  type ToolData,
  type LeaderData,
  type SelectedTool,
  type PendingIntent,
  type SpaceHandlerDeps,
} from '../handlers';
import type { MobileDrawerType, SpaceEventDetails, ExistingTool } from '@hive/ui';

// ============================================================
// Modal State Type
// ============================================================

interface ModalState {
  addTab: boolean;
  addWidget: boolean;
  inviteMember: boolean;
  createEvent: boolean;
  eventDetails: boolean;
  templates: boolean;
  contextPanel: boolean;
  toolModal: boolean;
  welcome: boolean;
  quickCreate: boolean;
}

// ============================================================
// Hook Return Type
// ============================================================

export interface UseSpacePageStateReturn {
  // Core data
  space: ReturnType<typeof useSpaceMetadata>['space'];
  spaceId: string | null;
  membership: ReturnType<typeof useSpaceMetadata>['membership'];
  isLoading: boolean;
  error: string | null;
  isMember: boolean;
  isLeader: boolean;

  // Current user
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string | undefined;

  // Chat
  chat: ReturnType<typeof useChatMessages>;

  // Tools
  tools: ToolData[];
  toolsHasMore: boolean;
  selectedTool: SelectedTool | null;
  toolRuntime: ReturnType<typeof useToolRuntime>;
  existingTools: ExistingTool[];
  isLoadingTools: boolean;
  sidebarEditMode: boolean;

  // Leaders
  leaders: LeaderData[];

  // Modals
  modals: ModalState;
  setModal: (modal: keyof ModalState, open: boolean) => void;

  // Events
  events: ReturnType<typeof useSpaceEvents>['events'];
  selectedEventId: string | null;
  selectedEventDetails: SpaceEventDetails | null;

  // Pinned messages
  pinnedMessages: ReturnType<typeof usePinnedMessages>['messages'];
  pinnedLoading: boolean;

  // Intent detection
  pendingIntent: PendingIntent | null;
  intentLoading: boolean;

  // Leader onboarding
  leaderOnboarding: ReturnType<typeof useLeaderOnboarding>;

  // Threshold pattern (first-time visitors)
  showThreshold: boolean | null;
  isPrivateSpace: boolean;

  // Join request (for private spaces)
  joinRequest: ReturnType<typeof useJoinRequest>;

  // Mobile
  activeDrawer: MobileDrawerType | null;
  setActiveDrawer: (drawer: MobileDrawerType | null) => void;

  // Scroll to message
  scrollToMessageId: string | null;
  setScrollToMessageId: (id: string | null) => void;

  // Handlers (from extracted handler factories)
  handlers: {
    // Space handlers
    handleAddTab: ReturnType<typeof createSpaceHandlers>['handleAddTab'];
    handleAddWidget: ReturnType<typeof createSpaceHandlers>['handleAddWidget'];
    handleInviteMember: ReturnType<typeof createSpaceHandlers>['handleInviteMember'];
    handleSearchUsers: ReturnType<typeof createSpaceHandlers>['handleSearchUsers'];
    handleCreateEvent: ReturnType<typeof createSpaceHandlers>['handleCreateEvent'];
    handleEventRSVP: ReturnType<typeof createSpaceHandlers>['handleEventRSVP'];

    // Chat handlers
    handleSendMessage: ReturnType<typeof createChatHandlers>['handleSendMessage'];
    handleConfirmIntent: () => Promise<void>;
    handleDismissIntent: () => Promise<void>;
    handleInsertTool: ReturnType<typeof createChatHandlers>['handleInsertTool'];
    handleSlashCommand: ReturnType<typeof createChatHandlers>['handleSlashCommand'];

    // Tool handlers
    handleOpenHiveLab: ReturnType<typeof createToolHandlers>['handleOpenHiveLab'];
    handleDeployExistingTool: ReturnType<typeof createToolHandlers>['handleDeployExistingTool'];
    handleQuickDeploy: ReturnType<typeof createToolHandlers>['handleQuickDeploy'];
    handleRemoveTool: ReturnType<typeof createToolHandlers>['handleRemoveTool'];

    // Automation handlers
    handleAutomationCommand: ReturnType<typeof createAutomationHandlers>['handleAutomationCommand'];

    // UI actions
    joinSpace: () => Promise<boolean>;
    leaveSpace: () => Promise<boolean>;
    refresh: () => void;
    handleCreateBoard: () => void;
    handleReorderBoards: (boardIds: string[]) => Promise<void>;
    handleEventClick: (eventId: string) => void;
    handleToolClick: (tool: SelectedTool) => void;
    handleEnterFromThreshold: () => void;
    setSidebarEditMode: (edit: boolean) => void;
  };
}

// ============================================================
// Hook Implementation
// ============================================================

export function useSpacePageState(): UseSpacePageStateReturn {
  const router = useRouter();
  const { user } = useAuth();

  // Core space context
  const {
    space,
    spaceId,
    membership,
    isLoading,
    error,
    joinSpace,
    leaveSpace,
    refresh,
  } = useSpaceMetadata();

  const { events } = useSpaceEvents();
  const { leaderActions } = useSpaceLeader();

  // Computed membership
  const isMember = Boolean(membership?.role);
  const isLeader = ['owner', 'admin', 'leader', 'moderator'].includes(membership?.role || '');
  const isPrivateSpace = space?.visibility === 'private';

  // Join request (for private spaces)
  const joinRequest = useJoinRequest(isPrivateSpace && !isMember ? spaceId : null);

  // Current user info (for chat)
  const currentUserId = user?.uid ?? 'anonymous';
  const currentUserName = user?.displayName ?? 'You';
  const currentUserAvatar = user?.photoURL ?? undefined;

  // ============================================================
  // Chat State
  // ============================================================

  const chat = useChatMessages({
    spaceId: spaceId ?? '',
    enableRealtime: true,
    pollingIntervalMs: 1000,
  });

  // ============================================================
  // Modal State (combined)
  // ============================================================

  const [modals, setModals] = React.useState<ModalState>({
    addTab: false,
    addWidget: false,
    inviteMember: false,
    createEvent: false,
    eventDetails: false,
    templates: false,
    contextPanel: false,
    toolModal: false,
    welcome: false,
    quickCreate: false,
  });

  const setModal = React.useCallback((modal: keyof ModalState, open: boolean) => {
    setModals((prev) => ({ ...prev, [modal]: open }));
  }, []);

  // ============================================================
  // Tools State
  // ============================================================

  const [tools, setTools] = React.useState<ToolData[]>([]);
  const [toolsHasMore, setToolsHasMore] = React.useState(false);
  const [selectedTool, setSelectedTool] = React.useState<SelectedTool | null>(null);
  const [existingTools, setExistingTools] = React.useState<ExistingTool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = React.useState(false);
  const [sidebarEditMode, setSidebarEditMode] = React.useState(false);

  // Tool runtime (only when tool selected)
  const toolRuntime = useToolRuntime({
    toolId: selectedTool?.toolId || '',
    spaceId: spaceId ?? undefined,
    placementId: selectedTool?.placementId,
    autoSave: true,
    autoSaveDelay: 1500,
    enableRealtime: true,
  });

  // ============================================================
  // Leaders State
  // ============================================================

  const [leaders, setLeaders] = React.useState<LeaderData[]>([]);

  // ============================================================
  // Events State
  // ============================================================

  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);

  // Compute selected event details
  const selectedEventDetails = React.useMemo((): SpaceEventDetails | null => {
    if (!selectedEventId) return null;
    const event = events.find((e) => e.id === selectedEventId);
    if (!event) return null;

    const e = event as {
      id: string;
      title: string;
      description?: string;
      type: string;
      startDate: string;
      endDate?: string;
      location?: string;
      virtualLink?: string;
      currentAttendees: number;
      maxAttendees?: number;
      organizerId?: string;
      organizerName?: string;
      organizerAvatarUrl?: string;
      userRSVP?: 'going' | 'maybe' | 'not_going' | null;
      linkedBoardId?: string;
    };

    const validTypes = ['academic', 'social', 'recreational', 'cultural', 'meeting', 'virtual'] as const;
    const eventType = e.type && validTypes.includes(e.type as typeof validTypes[number])
      ? (e.type as typeof validTypes[number])
      : 'meeting';

    return {
      id: e.id,
      title: e.title,
      description: e.description,
      type: eventType,
      startDate: e.startDate,
      endDate: e.endDate,
      location: e.location,
      virtualLink: e.virtualLink,
      currentAttendees: e.currentAttendees || 0,
      maxAttendees: e.maxAttendees,
      organizer: e.organizerId
        ? {
            id: e.organizerId,
            fullName: e.organizerName || 'Organizer',
            photoURL: e.organizerAvatarUrl,
          }
        : undefined,
      userRSVP: e.userRSVP || null,
      linkedBoardId: e.linkedBoardId,
    };
  }, [selectedEventId, events]);

  // ============================================================
  // Pinned Messages
  // ============================================================

  const { messages: pinnedMessages, isLoading: pinnedLoading } = usePinnedMessages({
    spaceId: spaceId ?? '',
    enabled: !!spaceId,
  });

  // ============================================================
  // Intent Detection
  // ============================================================

  const { checkIntent, createComponent: createIntentComponent, isLoading: intentLoading } =
    useChatIntent(spaceId ?? '');

  const [pendingIntent, setPendingIntent] = React.useState<PendingIntent | null>(null);

  // ============================================================
  // Leader Onboarding
  // ============================================================

  const leaderOnboarding = useLeaderOnboarding({
    spaceId: spaceId ?? '',
    isLeader,
    deployedToolCount: tools.length,
    eventCount: events.length,
    memberCount: space?.memberCount ?? 0,
  });

  // ============================================================
  // Welcome Modal
  // ============================================================

  const memberWelcome = useSpaceWelcome(spaceId ?? '');

  React.useEffect(() => {
    if (isMember && !isLeader && memberWelcome.shouldShow && !memberWelcome.isLoading) {
      const timer = setTimeout(() => setModal('welcome', true), 800);
      return () => clearTimeout(timer);
    }
  }, [isMember, isLeader, memberWelcome.shouldShow, memberWelcome.isLoading, setModal]);

  // ============================================================
  // Threshold Pattern
  // ============================================================

  const [showThreshold, setShowThreshold] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!spaceId || isLoading) return;

    if (isLeader || isMember) {
      setShowThreshold(false);
      return;
    }

    // For private spaces, always show threshold (they need to request to join)
    if (isPrivateSpace) {
      setShowThreshold(true);
      return;
    }

    // For public spaces, check if they've visited before
    const visitedKey = 'hive_visited_spaces';
    const visited = JSON.parse(localStorage.getItem(visitedKey) || '[]');
    setShowThreshold(!visited.includes(spaceId));
  }, [spaceId, isLoading, isLeader, isMember, isPrivateSpace]);

  // ============================================================
  // Mobile Drawer
  // ============================================================

  const [activeDrawer, setActiveDrawer] = React.useState<MobileDrawerType | null>(null);

  // ============================================================
  // Scroll to Message
  // ============================================================

  const [scrollToMessageId, setScrollToMessageId] = React.useState<string | null>(null);

  // ============================================================
  // Data Loading Effects
  // ============================================================

  // Load tools for sidebar
  React.useEffect(() => {
    const loadTools = async () => {
      if (!spaceId || !isMember) return;
      try {
        const res = await secureApiFetch(`/api/spaces/${spaceId}/tools`);
        if (!res.ok) return;
        const data = await res.json();
        const toolList = Array.isArray(data.tools) ? data.tools : [];
        setTools(
          toolList.map((t: Record<string, unknown>) => ({
            id: (t.placementId as string) || (t.toolId as string),
            toolId: t.toolId as string,
            placementId: t.placementId as string,
            name: (t.titleOverride as string) || (t.name as string),
            type: (t.category as string) || 'tool',
            isActive: t.isActive === true,
            responseCount: (t.usageCount as number) || 0,
          }))
        );
        setToolsHasMore(Boolean(data.hasMore));
      } catch {
        // Silently ignore
      }
    };
    void loadTools();
  }, [spaceId, isMember]);

  // Load existing tools for add widget modal
  React.useEffect(() => {
    if (!modals.addWidget || !isLeader) return;

    const fetchTools = async () => {
      setIsLoadingTools(true);
      try {
        const response = await secureApiFetch('/api/tools?status=published&limit=10');
        if (response.ok) {
          const data = await response.json();
          setExistingTools(data.tools || []);
        }
      } catch {
        // Ignore
      } finally {
        setIsLoadingTools(false);
      }
    };
    fetchTools();
  }, [modals.addWidget, isLeader]);

  // Load leaders
  React.useEffect(() => {
    const loadLeaders = async () => {
      if (!spaceId || !isMember) return;
      try {
        const ownersRes = await secureApiFetch(`/api/spaces/${spaceId}/members?role=owner&limit=5`);
        const adminsRes = await secureApiFetch(`/api/spaces/${spaceId}/members?role=admin&limit=5`);
        const ownersData = ownersRes.ok ? await ownersRes.json() : { members: [] };
        const adminsData = adminsRes.ok ? await adminsRes.json() : { members: [] };
        const owners = Array.isArray(ownersData.members) ? ownersData.members : [];
        const admins = Array.isArray(adminsData.members) ? adminsData.members : [];
        const list = [...owners, ...admins].map((m: Record<string, unknown>) => ({
          id: m.id as string,
          name: m.name as string,
          avatarUrl: m.avatar as string | undefined,
          role: m.role as string,
        }));

        // Fallback for current user if they're owner
        if (user && membership?.role === 'owner') {
          const userInList = list.some((l) => l.id === user.uid);
          if (!userInList) {
            list.unshift({
              id: user.uid,
              name: user.displayName || 'You',
              avatarUrl: user.photoURL || undefined,
              role: 'owner',
            });
          }
        }

        setLeaders(list);
      } catch {
        // Ignore
      }
    };
    void loadLeaders();
  }, [spaceId, isMember, membership, user]);

  // ============================================================
  // Create Handlers (using extracted factories)
  // ============================================================

  const spaceHandlers = React.useMemo(
    () =>
      createSpaceHandlers({
        spaceId,
        router,
        leaderActions: leaderActions as SpaceHandlerDeps['leaderActions'],
        refresh,
      }),
    [spaceId, router, leaderActions, refresh]
  );

  // Wrap createIntentComponent to match expected type
  const wrappedCreateIntentComponent = React.useCallback(
    async (message: string, boardId: string) => {
      const result = await createIntentComponent(message, boardId);
      return { success: result.success, created: result.created ?? false, error: result.error };
    },
    [createIntentComponent]
  );

  const chatHandlers = React.useMemo(
    () =>
      createChatHandlers({
        spaceId,
        router,
        refresh,
        activeBoardId: chat.activeBoardId,
        isLeader,
        sendMessage: chat.sendMessage,
        checkIntent,
        createIntentComponent: wrappedCreateIntentComponent,
        setPendingIntent,
      }),
    [spaceId, router, refresh, chat.activeBoardId, isLeader, chat.sendMessage, checkIntent, wrappedCreateIntentComponent]
  );

  const toolHandlers = React.useMemo(
    () =>
      createToolHandlers({
        spaceId,
        router,
        refresh,
        tools,
        setTools,
        leaderOnboarding: { markTaskComplete: leaderOnboarding.markTaskComplete as (taskId: string) => void },
      }),
    [spaceId, router, refresh, tools, leaderOnboarding.markTaskComplete]
  );

  const automationHandlers = React.useMemo(
    () =>
      createAutomationHandlers({
        spaceId,
        router,
        refresh,
        activeBoardId: chat.activeBoardId,
      }),
    [spaceId, router, refresh, chat.activeBoardId]
  );

  // ============================================================
  // UI Action Handlers
  // ============================================================

  const handleCreateBoard = React.useCallback(() => {
    setModal('addTab', true);
  }, [setModal]);

  const handleReorderBoards = React.useCallback(async (boardIds: string[]) => {
    if (!spaceId) return;
    try {
      const response = await fetch(`/api/spaces/${spaceId}/boards/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ boardIds }),
      });
      if (!response.ok) {
        throw new Error('Failed to reorder boards');
      }
      // Update local board order optimistically (already done by dnd-kit)
      chat.reorderBoards(boardIds);
    } catch {
      // Failed to reorder boards - state already updated optimistically
    }
  }, [spaceId, chat]);

  const handleEventClick = React.useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    setModal('eventDetails', true);
  }, [setModal]);

  const handleToolClick = React.useCallback((tool: SelectedTool) => {
    setSelectedTool(tool);
    setModal('toolModal', true);
  }, [setModal]);

  const handleEnterFromThreshold = React.useCallback(() => {
    if (!spaceId) return;
    const visitedKey = 'hive_visited_spaces';
    const visited = JSON.parse(localStorage.getItem(visitedKey) || '[]');
    if (!visited.includes(spaceId)) {
      visited.push(spaceId);
      localStorage.setItem(visitedKey, JSON.stringify(visited));
    }
    setShowThreshold(false);
  }, [spaceId]);

  const handleConfirmIntent = React.useCallback(async () => {
    await chatHandlers.handleConfirmIntent(pendingIntent);
    setPendingIntent(null);
  }, [chatHandlers, pendingIntent]);

  const handleDismissIntent = React.useCallback(async () => {
    await chatHandlers.handleDismissIntent(pendingIntent);
  }, [chatHandlers, pendingIntent]);

  // ============================================================
  // Return
  // ============================================================

  return {
    // Core data
    space,
    spaceId,
    membership,
    isLoading,
    error,
    isMember,
    isLeader,

    // Current user
    currentUserId,
    currentUserName,
    currentUserAvatar,

    // Chat
    chat,

    // Tools
    tools,
    toolsHasMore,
    selectedTool,
    toolRuntime,
    existingTools,
    isLoadingTools,
    sidebarEditMode,

    // Leaders
    leaders,

    // Modals
    modals,
    setModal,

    // Events
    events,
    selectedEventId,
    selectedEventDetails,

    // Pinned messages
    pinnedMessages,
    pinnedLoading,

    // Intent detection
    pendingIntent,
    intentLoading,

    // Leader onboarding
    leaderOnboarding,

    // Threshold
    showThreshold,
    isPrivateSpace,

    // Join request
    joinRequest,

    // Mobile
    activeDrawer,
    setActiveDrawer,

    // Scroll
    scrollToMessageId,
    setScrollToMessageId,

    // Handlers
    handlers: {
      // Space handlers
      handleAddTab: spaceHandlers.handleAddTab,
      handleAddWidget: spaceHandlers.handleAddWidget,
      handleInviteMember: spaceHandlers.handleInviteMember,
      handleSearchUsers: spaceHandlers.handleSearchUsers,
      handleCreateEvent: spaceHandlers.handleCreateEvent,
      handleEventRSVP: spaceHandlers.handleEventRSVP,

      // Chat handlers
      handleSendMessage: chatHandlers.handleSendMessage,
      handleConfirmIntent,
      handleDismissIntent,
      handleInsertTool: chatHandlers.handleInsertTool,
      handleSlashCommand: chatHandlers.handleSlashCommand,

      // Tool handlers
      handleOpenHiveLab: toolHandlers.handleOpenHiveLab,
      handleDeployExistingTool: toolHandlers.handleDeployExistingTool,
      handleQuickDeploy: toolHandlers.handleQuickDeploy,
      handleRemoveTool: toolHandlers.handleRemoveTool,

      // Automation handlers
      handleAutomationCommand: automationHandlers.handleAutomationCommand,

      // UI actions
      joinSpace,
      leaveSpace,
      refresh,
      handleCreateBoard,
      handleReorderBoards,
      handleEventClick,
      handleToolClick,
      handleEnterFromThreshold,
      setSidebarEditMode,
    },
  };
}

export default useSpacePageState;

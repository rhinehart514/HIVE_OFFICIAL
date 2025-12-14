"use client";

/**
 * Space Detail Page - Chat-First Experience
 *
 * Discord-style real-time chat experience with:
 * - SpaceContext for unified state management
 * - SpaceChatBoard as primary content (replaces feed)
 * - BoardTabBar for channel/board switching
 * - 60/40 split layout: Chat (60%) + Sidebar (40%)
 * - HiveLab-powered sidebar widgets
 * - T1 Premium SpaceDetailHeader (compact)
 *
 * Vision: "Discord meets ChatGPT" - Real-time messaging + inline AI-powered tools
 *
 * @author HIVE Frontend Team
 * @version 3.2.0 - Refactored with extracted components
 */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  SpaceDetailHeader,
  SpaceSidebar,
  SpaceChatBoard,
  BoardTabBar,
  MobileActionBar,
  MobileDrawer,
  ThreadDrawer,
  PinnedMessagesWidget,
  AddTabModal,
  AddWidgetModal,
  MemberInviteModal,
  EventCreateModal,
  ToolRuntimeModal,
  type AddTabInput,
  type AddWidgetInputUI,
  type BoardData,
  type MobileDrawerType,
  type MemberInviteInput,
  type InviteableUser,
  type EventCreateInput,
  type SlashCommandData,
} from "@hive/ui";
import { SpaceBoardSkeleton } from "@hive/ui";
import { SpaceContextProvider, useSpaceContext } from "@/contexts/SpaceContext";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useToolRuntime } from "@/hooks/use-tool-runtime";
import { usePinnedMessages } from "@/hooks/use-pinned-messages";
import { useAuth } from "@hive/auth-logic";
import { secureApiFetch } from "@/lib/secure-auth-utils";

// ============================================================
// Utilities
// ============================================================

/** Parse duration strings like "25m", "1h", "30s" into milliseconds */
function parseDuration(durationStr: string): number {
  const match = durationStr.match(/^(\d+)\s*(s|m|h|d)?$/i);
  if (!match) return 5 * 60 * 1000; // Default 5 minutes

  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'm').toLowerCase();

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return value * 60 * 1000;
  }
}

// ============================================================
// Types
// ============================================================

// Local event type (matches SpaceContext events)
interface SpaceEventData {
  id: string;
  title: string;
  type: string;
  startDate: string;
  location?: string;
  virtualLink?: string;
  currentAttendees: number;
}

// Local board type (matches useChatMessages boards)
interface ChatBoardData {
  id: string;
  name: string;
  type: 'general' | 'topic' | 'event';
  description?: string;
  messageCount?: number;
  isDefault?: boolean;
  isLocked?: boolean;
}

interface ToolData {
  id: string;
  toolId: string;
  placementId: string; // The placement ID within the space
  name: string;
  type: string;
  isActive: boolean;
  responseCount: number;
}

interface LeaderData {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
}

interface SelectedTool {
  id: string;
  toolId: string;
  placementId: string; // The placement ID - hook will generate deployment ID
  name: string;
  type: string;
}

// ============================================================
// Extracted Components
// ============================================================

/**
 * Mobile Navigation - Bottom bar and drawer panels
 */
function SpaceMobileNavigation({
  activeDrawer,
  setActiveDrawer,
  space,
  events,
  tools,
  leaders,
}: {
  activeDrawer: MobileDrawerType | null;
  setActiveDrawer: (drawer: MobileDrawerType | null) => void;
  space: { name: string; description?: string; memberCount: number; onlineCount: number; category?: string };
  events: Array<{ id: string; title: string; startDate: string; currentAttendees: number }>;
  tools: ToolData[];
  leaders: LeaderData[];
}) {
  return (
    <>
      <div className="lg:hidden">
        <MobileActionBar
          activeDrawer={activeDrawer}
          onAction={(type) => setActiveDrawer(type)}
        />
      </div>
      <MobileDrawer
        type="info"
        open={activeDrawer === "info"}
        onOpenChange={(open) => setActiveDrawer(open ? "info" : null)}
        spaceData={{
          name: space.name,
          description: space.description,
          memberCount: space.memberCount,
          onlineCount: space.onlineCount,
          category: space.category,
        }}
      />
      <MobileDrawer
        type="events"
        open={activeDrawer === "events"}
        onOpenChange={(open) => setActiveDrawer(open ? "events" : null)}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          date: new Date(e.startDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }),
          attendees: e.currentAttendees,
        }))}
      />
      <MobileDrawer
        type="tools"
        open={activeDrawer === "tools"}
        onOpenChange={(open) => setActiveDrawer(open ? "tools" : null)}
        tools={tools.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.type,
        }))}
      />
      <MobileDrawer
        type="members"
        open={activeDrawer === "members"}
        onOpenChange={(open) => setActiveDrawer(open ? "members" : null)}
        members={leaders.map((l) => ({
          id: l.id,
          name: l.name,
          avatarUrl: l.avatarUrl,
          role: l.role,
          isOnline: false,
        }))}
      />
    </>
  );
}

/**
 * Leader Modals - Add tab, widget, invite member, create event
 */
function SpaceLeaderModals({
  tabs,
  boards,
  activeBoardId,
  addTabModalOpen,
  setAddTabModalOpen,
  addWidgetModalOpen,
  setAddWidgetModalOpen,
  inviteMemberModalOpen,
  setInviteMemberModalOpen,
  createEventModalOpen,
  setCreateEventModalOpen,
  onAddTab,
  onAddWidget,
  onInviteMember,
  onSearchUsers,
  onCreateEvent,
  existingMemberIds,
}: {
  tabs: Array<{ name: string }>;
  boards: Array<{ id: string; name: string }>;
  activeBoardId?: string;
  addTabModalOpen: boolean;
  setAddTabModalOpen: (open: boolean) => void;
  addWidgetModalOpen: boolean;
  setAddWidgetModalOpen: (open: boolean) => void;
  inviteMemberModalOpen: boolean;
  setInviteMemberModalOpen: (open: boolean) => void;
  createEventModalOpen: boolean;
  setCreateEventModalOpen: (open: boolean) => void;
  onAddTab: (input: AddTabInput) => Promise<void>;
  onAddWidget: (input: AddWidgetInputUI) => Promise<void>;
  onInviteMember: (input: MemberInviteInput) => Promise<void>;
  onSearchUsers: (query: string) => Promise<InviteableUser[]>;
  onCreateEvent: (input: EventCreateInput) => Promise<void>;
  existingMemberIds: string[];
}) {
  return (
    <>
      <AddTabModal
        open={addTabModalOpen}
        onOpenChange={setAddTabModalOpen}
        onSubmit={onAddTab}
        existingTabNames={tabs.map((t) => t.name)}
      />
      <AddWidgetModal
        open={addWidgetModalOpen}
        onOpenChange={setAddWidgetModalOpen}
        onSubmit={onAddWidget}
      />
      <MemberInviteModal
        open={inviteMemberModalOpen}
        onOpenChange={setInviteMemberModalOpen}
        onSubmit={onInviteMember}
        onSearchUsers={onSearchUsers}
        existingMemberIds={existingMemberIds}
      />
      <EventCreateModal
        open={createEventModalOpen}
        onOpenChange={setCreateEventModalOpen}
        onSubmit={onCreateEvent}
        boards={boards.map((b) => ({
          id: b.id,
          name: b.name,
        }))}
        defaultBoardId={activeBoardId}
      />
    </>
  );
}

// ============================================================
// Inner Content Component (uses SpaceContext)
// ============================================================

function SpaceDetailContent() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    space,
    spaceId,
    membership,
    events,
    tabs,
    widgets,
    visibleTabs,
    activeTabId,
    setActiveTabId,
    activeTab,
    activeTabWidgets,
    isLoading,
    isStructureLoading,
    isMutating,
    error,
    joinSpace,
    leaveSpace,
    refresh,
    leaderActions,
    getWidgetsForTab,
  } = useSpaceContext();

  // Compute membership booleans from role
  const isMember = Boolean(membership?.role);
  const isLeader = ['owner', 'admin', 'leader', 'moderator'].includes(membership?.role || '');
  const isOwner = membership?.role === 'owner';

  // Chat hook for real-time messaging (PRIMARY CONTENT)
  const {
    messages,
    boards,
    activeBoardId,
    typingUsers,
    isLoading: chatLoading,
    isLoadingMore: chatLoadingMore,
    hasMore: chatHasMore,
    error: _chatError,
    thread,
    sendMessage,
    addReaction,
    pinMessage,
    deleteMessage,
    editMessage,
    changeBoard,
    loadMore: loadMoreMessages,
    openThread,
    closeThread,
    sendThreadReply,
    loadMoreReplies,
  } = useChatMessages({
    spaceId: spaceId ?? "",
    enableRealtime: true,
    pollingIntervalMs: 1000, // Fast polling for real-time feel
  });

  // Local state
  const [tools, setTools] = React.useState<ToolData[]>([]);
  const [toolsHasMore, setToolsHasMore] = React.useState(false);
  const [leaders, setLeaders] = React.useState<LeaderData[]>([]);

  // Leader modals state
  const [addTabModalOpen, setAddTabModalOpen] = React.useState(false);
  const [addWidgetModalOpen, setAddWidgetModalOpen] = React.useState(false);
  const [inviteMemberModalOpen, setInviteMemberModalOpen] = React.useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = React.useState(false);

  // Tool runtime modal state
  const [selectedTool, setSelectedTool] = React.useState<SelectedTool | null>(null);
  const [toolModalOpen, setToolModalOpen] = React.useState(false);

  // Mobile drawer state
  const [activeDrawer, setActiveDrawer] = React.useState<MobileDrawerType | null>(null);

  // Scroll to message state (for pinned message clicks)
  const [scrollToMessageId, setScrollToMessageId] = React.useState<string | null>(null);

  // Tool runtime hook - only active when a tool is selected
  const toolRuntime = useToolRuntime({
    toolId: selectedTool?.toolId || '',
    spaceId: spaceId ?? undefined,
    // Use placementId - the hook will generate the proper deployment ID format
    placementId: selectedTool?.placementId,
    autoSave: true,
    autoSaveDelay: 1500,
  });

  // Pinned messages for sidebar
  const {
    messages: pinnedMessages,
    isLoading: pinnedLoading,
  } = usePinnedMessages({
    spaceId: spaceId ?? '',
    enabled: !!spaceId,
  });

  // Load tools for sidebar (members only)
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
            // Use placementId as the unique identifier within this space
            id: (t.placementId as string) || (t.toolId as string),
            toolId: t.toolId as string,
            // Store placementId separately - the useToolRuntime hook will generate
            // the proper deployment ID format: "space:{spaceId}_{placementId}"
            placementId: t.placementId as string,
            name: (t.titleOverride as string) || (t.name as string),
            type: (t.category as string) || "tool",
            // API returns isActive as boolean, not status string
            isActive: t.isActive === true,
            responseCount: (t.usageCount as number) || 0,
          }))
        );
        setToolsHasMore(Boolean(data.hasMore));
      } catch {
        // Silently ignore fetch errors
      }
    };
    void loadTools();
  }, [spaceId, isMember]);

  // Load leaders (owners/admins)
  // NOTE: The members API only queries spaceMembers collection, but owners
  // are often detected via createdBy field, not in spaceMembers. So we also
  // check if the current user is detected as owner/leader via membership context.
  React.useEffect(() => {
    const loadLeaders = async () => {
      if (!spaceId || !isMember) return;
      try {
        const ownersRes = await secureApiFetch(
          `/api/spaces/${spaceId}/members?role=owner&limit=5`
        );
        const adminsRes = await secureApiFetch(
          `/api/spaces/${spaceId}/members?role=admin&limit=5`
        );
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

        // FALLBACK: If current user is detected as owner/leader but not in API response,
        // add them to the leaders list. This handles the case where owner is detected
        // via createdBy field rather than spaceMembers collection.
        if (user && membership?.role === 'owner') {
          const userAlreadyInList = list.some(l => l.id === user.uid);
          if (!userAlreadyInList) {
            list.unshift({
              id: user.uid,
              name: user.displayName || 'You',
              avatarUrl: user.photoURL || undefined,
              role: 'owner',
            });
          }
        } else if (user && membership && ['leader', 'admin', 'moderator'].includes(membership.role || '')) {
          // Also handle leaders array fallback
          const userAlreadyInList = list.some(l => l.id === user.uid);
          if (!userAlreadyInList) {
            list.unshift({
              id: user.uid,
              name: user.displayName || 'You',
              avatarUrl: user.photoURL || undefined,
              role: 'leader',
            });
          }
        }

        setLeaders(list);
      } catch {
        // Silently ignore fetch errors
      }
    };
    void loadLeaders();
  }, [spaceId, membership?.role, user]);

  // Handle add tab
  const handleAddTab = React.useCallback(async (input: AddTabInput) => {
    if (!leaderActions) throw new Error("Not authorized");
    const result = await leaderActions.addTab({
      name: input.name,
      type: input.type,
    });
    if (!result) throw new Error("Failed to create tab");
  }, [leaderActions]);

  // Handle add widget
  const handleAddWidget = React.useCallback(async (input: AddWidgetInputUI) => {
    if (!leaderActions) throw new Error("Not authorized");
    const result = await leaderActions.addWidget({
      type: input.type,
      title: input.title,
      config: input.config,
    });
    if (!result) throw new Error("Failed to create widget");
  }, [leaderActions]);

  // Handle invite member
  const handleInviteMember = React.useCallback(async (input: MemberInviteInput) => {
    if (!spaceId) throw new Error("Space not found");
    const response = await secureApiFetch(`/api/spaces/${spaceId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: input.userId,
        role: input.role,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to invite member');
    }
    // Refresh leaders list after invite
    refresh();
  }, [spaceId, refresh]);

  // Handle search users for invite modal
  const handleSearchUsers = React.useCallback(async (query: string): Promise<InviteableUser[]> => {
    if (!query || query.length < 2) return [];
    try {
      const response = await secureApiFetch(`/api/search?q=${encodeURIComponent(query)}&type=users&limit=10`);
      if (!response.ok) return [];
      const data = await response.json();
      // Map API response to InviteableUser format
      return (data.users || []).map((u: Record<string, unknown>) => ({
        id: u.id as string,
        name: (u.displayName as string) || (u.name as string) || 'Unknown',
        handle: (u.handle as string) || (u.id as string),
        email: u.email as string | undefined,
        avatarUrl: (u.photoURL as string) || (u.avatarUrl as string) || undefined,
      }));
    } catch {
      return [];
    }
  }, []);

  // Handle create event
  const handleCreateEvent = React.useCallback(async (input: EventCreateInput) => {
    if (!spaceId) throw new Error("Space not found");
    const response = await secureApiFetch(`/api/spaces/${spaceId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        location: input.location,
        virtualLink: input.virtualLink,
        maxAttendees: input.maxAttendees,
        requiresRSVP: input.requiredRSVP,
        announceToSpace: input.announceToSpace,
        linkedBoardId: input.linkedBoardId,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create event');
    }
    // Refresh to show new event
    refresh();
  }, [spaceId, refresh]);

  // Handler for sending messages (must be before early return)
  const handleSendMessage = React.useCallback(async (content: string, replyToId?: string) => {
    await sendMessage(content, replyToId);
  }, [sendMessage]);

  // Handler for creating a new board (must be before early return)
  const handleCreateBoard = React.useCallback(() => {
    setAddTabModalOpen(true);
  }, []);

  // Handler for inserting tools (polls, countdowns, RSVPs) into chat
  const handleInsertTool = React.useCallback(async (toolData: { type: 'poll' | 'event' | 'countdown' | 'custom'; config: Record<string, unknown> }) => {
    if (!spaceId || !activeBoardId) return;

    try {
      // Map UI tool types to API types
      const apiType = toolData.type === 'event' ? 'rsvp' : toolData.type;

      // Build config based on type
      const config: Record<string, unknown> = {};

      if (apiType === 'poll') {
        config.question = toolData.config.question as string;
        config.options = toolData.config.options as string[];
        config.allowMultiple = toolData.config.allowMultiple ?? false;
        config.showResults = toolData.config.showResults ?? 'after_vote';
      } else if (apiType === 'countdown') {
        config.title = toolData.config.title as string;
        config.targetDate = toolData.config.targetDate as string;
      } else if (apiType === 'rsvp') {
        config.eventTitle = toolData.config.eventTitle as string || toolData.config.title as string;
        config.eventDate = toolData.config.eventDate as string || toolData.config.targetDate as string;
        config.allowMaybe = toolData.config.allowMaybe ?? true;
      }

      const response = await secureApiFetch(`/api/spaces/${spaceId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: activeBoardId,
          type: apiType,
          content: '',
          config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create component');
      }

      // Component created - the message will appear via real-time sync
      // No need to manually refresh
    } catch (err) {
      console.error('[Space] Failed to insert tool:', err);
      // Could show a toast here
    }
  }, [spaceId, activeBoardId]);

  // Handler for slash commands (e.g., /poll "Question?" Option1, Option2)
  const handleSlashCommand = React.useCallback(async (command: SlashCommandData) => {
    if (!spaceId || !activeBoardId) return;

    try {
      // Map slash command to component API format
      let apiType: 'poll' | 'countdown' | 'rsvp' | 'custom';
      const config: Record<string, unknown> = {};

      switch (command.command) {
        case 'poll':
          apiType = 'poll';
          config.question = command.primaryArg || 'Quick Poll';
          config.options = command.listArgs.length > 0 ? command.listArgs : ['Yes', 'No'];
          config.allowMultiple = command.flags.multi === true || command.flags.multiple === true;
          config.showResults = command.flags.results || 'after_vote';
          break;

        case 'timer':
        case 'countdown':
          apiType = 'countdown';
          config.title = command.primaryArg || 'Timer';
          // Parse duration from listArgs or flags (e.g., "25m", "1h", "30s")
          const durationStr = command.listArgs[0] || command.flags.duration as string || '5m';
          const duration = parseDuration(durationStr);
          config.targetDate = new Date(Date.now() + duration).toISOString();
          break;

        case 'rsvp':
        case 'event':
          apiType = 'rsvp';
          config.eventTitle = command.primaryArg || 'Event';
          // Parse date from flags or default to tomorrow
          const dateStr = command.flags.date as string || command.flags.when as string;
          config.eventDate = dateStr ? new Date(dateStr).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          config.allowMaybe = command.flags.maybe !== false;
          break;

        case 'announce':
        case 'announcement':
          apiType = 'custom';
          config.elementType = 'announcement';
          config.settings = {
            message: command.primaryArg || command.raw.replace(/^\/\w+\s*/, ''),
            style: command.flags.style || 'info',
          };
          break;

        default:
          console.warn(`[Space] Unknown slash command: ${command.command}`);
          return;
      }

      const response = await secureApiFetch(`/api/spaces/${spaceId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: activeBoardId,
          type: apiType,
          content: '',
          config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create component');
      }

      // Component created - will appear via real-time sync
    } catch (err) {
      console.error('[Space] Failed to execute slash command:', err);
    }
  }, [spaceId, activeBoardId]);

  // Loading state
  if (isLoading || !space) {
    return (
      <div className="min-h-screen bg-black">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <SpaceBoardSkeleton />
        </div>
      </div>
    );
  }

  // Map membership state for header
  const membershipState = (() => {
    if (membership.role === "owner") return "owner" as const;
    if (membership.role === "admin") return "admin" as const;
    if (isMember) return "joined" as const;
    return "not_joined" as const;
  })();

  // Sidebar data - only include tools if there are any (don't show empty widget)
  const sidebarData = {
    spaceId: spaceId ?? "",
    about: {
      spaceId: spaceId ?? "",
      description: space.description || "Leaders have not added a description yet.",
      memberCount: space.memberCount,
      leaders,
      isPublic: space.visibility === "public",
      isMember: isMember,
    },
    // Only show tools widget when there are actual tools
    ...(tools.length > 0 && {
      tools: {
        spaceId: spaceId ?? "",
        tools,
        hasMore: toolsHasMore,
      },
    }),
    // Include upcoming events if we have any
    ...(events.length > 0 && {
      upcomingEvents: (events as SpaceEventData[]).slice(0, 3).map((e: SpaceEventData) => ({
        id: e.id,
        title: e.title,
        subtitle: e.type,
        when: new Date(e.startDate).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        where: e.location || (e.virtualLink ? 'Online' : undefined),
        isUrgent: new Date(e.startDate).getTime() - Date.now() < 24 * 60 * 60 * 1000, // Within 24h
      })),
    }),
  };

  // Convert boards data for BoardTabBar
  const boardsForTabBar: BoardData[] = (boards as ChatBoardData[]).map((b: ChatBoardData) => ({
    id: b.id,
    name: b.name,
    type: b.type,
    description: b.description,
    messageCount: b.messageCount,
    isDefault: b.isDefault,
    isLocked: b.isLocked,
  }));

  return (
    <div className="min-h-screen h-screen bg-black flex flex-col overflow-hidden">
      {/* Compact Header - Chat-first (NO feed tabs) */}
      <SpaceDetailHeader
        space={{
          id: spaceId ?? "",
          name: space.name,
          description: space.description,
          iconUrl: space.iconUrl,
          bannerUrl: space.bannerUrl,
          category: space.category,
          isVerified: space.isVerified,
          memberCount: space.memberCount,
          onlineCount: space.onlineCount,
        }}
        membershipState={membershipState}
        isLeader={isLeader}
        showTabs={false}
        breadcrumb={{
          campusName: "Spaces",
          boardName: boards.find(b => b.id === activeBoardId)?.name,
          boardId: activeBoardId,
          onNavigate: (target) => {
            if (target === 'campus') {
              router.push('/spaces/browse');
            }
            // 'space' and 'board' clicks stay on current page
          }
        }}
        onJoin={async () => { await joinSpace(); }}
        onLeave={async () => { await leaveSpace(); }}
        onShare={() => {
          navigator.clipboard.writeText(window.location.href);
        }}
        onSettings={
          isLeader
            ? () => router.push(`/spaces/${spaceId}/settings`)
            : undefined
        }
        onAnalytics={
          isLeader
            ? () => router.push(`/spaces/${spaceId}/analytics`)
            : undefined
        }
      />

      {/* Board Tab Bar - Discord-style channel selector */}
      <BoardTabBar
        boards={boardsForTabBar}
        activeBoardId={activeBoardId ?? boards[0]?.id ?? "general"}
        isLeader={isLeader}
        onBoardChange={changeBoard}
        onCreateBoard={isLeader ? handleCreateBoard : undefined}
      />

      {/* Main 60/40 Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area - 60% on desktop, full on mobile */}
        <main className="flex-1 lg:flex-[3] min-w-0 flex flex-col bg-black">
          <SpaceChatBoard
            spaceId={spaceId ?? ""}
            spaceName={space.name}
            boards={boards}
            activeBoardId={activeBoardId ?? boards[0]?.id ?? "general"}
            messages={messages}
            typingUsers={typingUsers}
            onlineCount={space.onlineCount}
            isLoading={chatLoading}
            isLoadingMore={chatLoadingMore}
            hasMoreMessages={chatHasMore}
            currentUserId={user?.uid ?? "anonymous"}
            currentUserName={user?.displayName || "You"}
            currentUserAvatar={user?.photoURL || undefined}
            currentUserRole={
              membership.role === "owner"
                ? "owner"
                : membership.role === "admin"
                ? "admin"
                : "member"
            }
            canPost={isMember}
            isLeader={isLeader}
            scrollToMessageId={scrollToMessageId ?? undefined}
            onScrollToMessageComplete={() => setScrollToMessageId(null)}
            onBoardChange={changeBoard}
            onSendMessage={handleSendMessage}
            onLoadMore={loadMoreMessages}
            onReact={addReaction}
            onPinMessage={isLeader ? pinMessage : undefined}
            onDeleteMessage={deleteMessage}
            onEditMessage={editMessage}
            onViewThread={openThread}
            onCreateBoard={isLeader ? handleCreateBoard : undefined}
            onInsertTool={isMember ? handleInsertTool : undefined}
            onSlashCommand={isMember ? handleSlashCommand : undefined}
            showToolbar={isMember}
            enableSlashCommands={isMember}
          />
        </main>

        {/* Sidebar - 40% on desktop, hidden on mobile */}
        <aside className="hidden lg:flex lg:flex-col lg:flex-[2] max-w-[400px] border-l border-neutral-800 bg-neutral-950/50 overflow-y-auto">
          {/* Pinned Messages Widget - shows when there are pinned messages */}
          {(pinnedMessages.length > 0 || pinnedLoading) && (
            <div className="p-4 border-b border-neutral-800">
              <PinnedMessagesWidget
                messages={pinnedMessages}
                isLoading={pinnedLoading}
                onMessageClick={(messageId, boardId) => {
                  // Switch to the board if needed
                  if (boardId !== activeBoardId) {
                    changeBoard(boardId);
                  }
                  // Trigger scroll-to-message
                  setScrollToMessageId(messageId);
                }}
                collapsible
                defaultCollapsed={false}
              />
            </div>
          )}

          {/* Main sidebar content */}
          <SpaceSidebar
            data={sidebarData}
            callbacks={{
              onJoin: () => joinSpace(),
              onLeave: () => leaveSpace(),
              onToolClick: (toolId) => {
                const tool = tools.find((t) => t.id === toolId || t.toolId === toolId);
                if (tool) {
                  setSelectedTool({
                    id: tool.id,
                    toolId: tool.toolId,
                    placementId: tool.placementId,
                    name: tool.name,
                    type: tool.type,
                  });
                  setToolModalOpen(true);
                }
              },
              onViewAll: () => router.push(`/spaces/${spaceId}/tools`),
              onLeaderClick: (leaderId) => router.push(`/profile/${leaderId}`),
              // Events - navigate to space calendar with event focused
              onEventClick: (eventId) => router.push(`/spaces/${spaceId}/calendar?event=${eventId}`),
              // Leader actions
              onInviteMember: isLeader ? () => setInviteMemberModalOpen(true) : undefined,
              onCreateEvent: isLeader ? () => setCreateEventModalOpen(true) : undefined,
            }}
          />
        </aside>
      </div>

      {/* Mobile Navigation - Bottom bar and drawer panels */}
      <SpaceMobileNavigation
        activeDrawer={activeDrawer}
        setActiveDrawer={setActiveDrawer}
        space={{
          name: space.name,
          description: space.description,
          memberCount: space.memberCount,
          onlineCount: space.onlineCount ?? 0,
          category: space.category,
        }}
        events={events}
        tools={tools}
        leaders={leaders}
      />

      {/* Leader Modals - Add tab, widget, invite member, create event */}
      {leaderActions && (
        <SpaceLeaderModals
          tabs={tabs}
          boards={boards}
          activeBoardId={activeBoardId ?? undefined}
          addTabModalOpen={addTabModalOpen}
          setAddTabModalOpen={setAddTabModalOpen}
          addWidgetModalOpen={addWidgetModalOpen}
          setAddWidgetModalOpen={setAddWidgetModalOpen}
          inviteMemberModalOpen={inviteMemberModalOpen}
          setInviteMemberModalOpen={setInviteMemberModalOpen}
          createEventModalOpen={createEventModalOpen}
          setCreateEventModalOpen={setCreateEventModalOpen}
          onAddTab={handleAddTab}
          onAddWidget={handleAddWidget}
          onInviteMember={handleInviteMember}
          onSearchUsers={handleSearchUsers}
          onCreateEvent={handleCreateEvent}
          existingMemberIds={leaders.map((l) => l.id)}
        />
      )}

      {/* Tool Runtime Modal - In-context tool execution */}
      {selectedTool && (
        <ToolRuntimeModal
          open={toolModalOpen}
          onOpenChange={(open) => {
            setToolModalOpen(open);
            if (!open) {
              // Clear selection when modal closes
              setSelectedTool(null);
            }
          }}
          toolId={selectedTool.toolId}
          spaceId={spaceId ?? ''}
          placementId={selectedTool.placementId}
          toolName={selectedTool.name}
          onExpandToFullPage={() => {
            // Navigate to full page if user wants more space
            // Generate the deployment ID format for the URL
            const deploymentId = selectedTool.placementId && spaceId
              ? `space:${spaceId}_${selectedTool.placementId}`
              : undefined;
            const url = deploymentId
              ? `/tools/${selectedTool.toolId}/run?spaceId=${spaceId}&deploymentId=${encodeURIComponent(deploymentId)}`
              : `/tools/${selectedTool.toolId}/run?spaceId=${spaceId}`;
            router.push(url);
            setToolModalOpen(false);
            setSelectedTool(null);
          }}
          runtime={selectedTool.toolId && toolRuntime.tool ? {
            tool: {
              ...toolRuntime.tool,
              status: toolRuntime.tool.status || 'draft',
            },
            state: toolRuntime.state,
            isLoading: toolRuntime.isLoading,
            isExecuting: toolRuntime.isExecuting,
            isSaving: toolRuntime.isSaving,
            isSynced: toolRuntime.isSynced,
            lastSaved: toolRuntime.lastSaved,
            error: toolRuntime.error instanceof Error ? toolRuntime.error.message : toolRuntime.error,
            // Adapter: modal expects (action, elementId?, data?) but hook has (elementId, action, data?)
            executeAction: async (action: string, elementId?: string, data?: Record<string, unknown>) => {
              const result = await toolRuntime.executeAction(elementId || '', action, data);
              return {
                success: result.success,
                data: result.state,
                error: result.error,
              };
            },
            // Adapter: modal expects (elementId, data) but hook has (updates)
            updateState: (elementId: string, data: unknown) => {
              toolRuntime.updateState({ [elementId]: data });
            },
          } : undefined}
        />
      )}

      {/* Thread Drawer - View and reply to threads */}
      <ThreadDrawer
        open={thread.isOpen}
        onOpenChange={(open) => {
          if (!open) closeThread();
        }}
        parentMessage={thread.parentMessage}
        replies={thread.replies}
        isLoading={thread.isLoading}
        isLoadingMore={thread.isLoadingMore}
        hasMoreReplies={thread.hasMore}
        currentUserId={user?.uid ?? "anonymous"}
        onLoadMore={loadMoreReplies}
        onSendReply={async (content: string) => { await sendThreadReply(content); }}
      />

      {/* Error state */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 backdrop-blur-sm">
            {error}
            <button onClick={refresh} className="ml-3 underline">
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Page Component with Provider
// ============================================================

export default function SpaceBoardPage() {
  const params = useParams<{ spaceId: string }>();
  const spaceId = params?.spaceId;

  if (!spaceId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neutral-400">Space not found</div>
      </div>
    );
  }

  return (
    <SpaceContextProvider spaceId={spaceId}>
      <SpaceDetailContent />
    </SpaceContextProvider>
  );
}

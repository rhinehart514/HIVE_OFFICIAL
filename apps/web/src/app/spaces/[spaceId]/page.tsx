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
 * Dark-first design tokens:
 * - Base: #0A0A0A, Surface: #141414, Elevated: #1A1A1A
 * - Text: #FAFAFA (primary), #A1A1A6 (secondary), #818187 (subtle)
 * - Border: #2A2A2A, #3A3A3A (strong)
 * - Gold: #FFD700 (CTAs, presence, achievements)
 *
 * @author HIVE Frontend Team
 * @version 3.3.0 - Dark-first design update
 */

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  SpaceDetailHeader,
  SpaceSidebar,
  SpaceChatBoard,
  SpaceEntryAnimation,
  SpaceThreshold,
  BoardTabBar,
  MobileActionBar,
  MobileDrawer,
  ThreadDrawer,
  PinnedMessagesWidget,
  AddTabModal,
  AddWidgetModal,
  MemberInviteModal,
  EventCreateModal,
  EventDetailsModal,
  ToolRuntimeModal,
  IntentConfirmationInline,
  AutomationsPanel,
  AutomationTemplatesCompact,
  AutomationTemplates,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  // Premium components (ChatGPT/Apple fusion)
  PremiumHeader,
  PremiumChatBoard,
  PremiumSidebar,
  AboutSection,
  EventsSection,
  MembersSection,
  ToolsSection,
  // Phase 3: Context Panel (on-demand sidebar replacement)
  ContextPanel,
  // Leader onboarding components
  SpaceLeaderOnboardingModal,
  LeaderSetupProgress,
  QUICK_TEMPLATES,
  // Ritual components
  RitualStrip,
  // Member welcome components
  SpaceWelcomeModal,
  useSpaceWelcome,
  type SpaceWelcomeData,
  type SpaceFeatureHighlight,
  type AddTabInput,
  type AddWidgetInputUI,
  type ExistingTool,
  type BoardData,
  type MobileDrawerType,
  type MemberInviteInput,
  type InviteableUser,
  type EventCreateInput,
  type SlashCommandData,
  type DetectedIntent,
  type BoardTab,
  type MessageData,
  type QuickTemplate,
  type SpaceEventDetails,
  type RSVPStatus,
} from "@hive/ui";
import { SpaceBoardSkeleton, toast } from "@hive/ui";
import {
  SpaceContextProvider,
  useSpaceMetadata,
  useSpaceEvents,
  useSpaceStructureContext,
  useSpaceLeader,
} from "@/contexts/space";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useChatIntent, mightHaveIntent } from "@/hooks/use-chat-intent";
import { useToolRuntime } from "@/hooks/use-tool-runtime";
import { usePinnedMessages } from "@/hooks/use-pinned-messages";
import { useAutomations } from "@/hooks/use-automations";
import { useLeaderOnboarding } from "@/hooks/use-leader-onboarding";
import { useFoundingClassRitual } from "@/hooks/use-founding-class-ritual";
import { useAuth } from "@hive/auth-logic";
import { secureApiFetch } from "@/lib/secure-auth-utils";
import { logger } from "@/lib/logger";

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
  automations,
  isLeader,
  onOpenTemplates,
}: {
  activeDrawer: MobileDrawerType | null;
  setActiveDrawer: (drawer: MobileDrawerType | null) => void;
  space: { name: string; description?: string; memberCount: number; onlineCount: number; category?: string };
  events: Array<{ id: string; title: string; startDate: string; currentAttendees: number }>;
  tools: ToolData[];
  leaders: LeaderData[];
  automations?: Array<{ id: string; name: string; trigger: string; enabled: boolean; runCount?: number }>;
  isLeader?: boolean;
  onOpenTemplates?: () => void;
}) {
  return (
    <>
      <div className="lg:hidden">
        <MobileActionBar
          activeDrawer={activeDrawer}
          onAction={(type) => setActiveDrawer(type)}
          isLeader={isLeader}
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
      {/* Automations drawer - only for leaders */}
      {isLeader && (
        <MobileDrawer
          type="automations"
          open={activeDrawer === "automations"}
          onOpenChange={(open) => setActiveDrawer(open ? "automations" : null)}
          automations={automations?.map((a) => ({
            id: a.id,
            name: a.name,
            trigger: a.trigger,
            enabled: a.enabled,
            runCount: a.runCount,
          }))}
          onOpenTemplates={onOpenTemplates}
        />
      )}
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
  onOpenHiveLab,
  onQuickDeploy,
  onInviteMember,
  onSearchUsers,
  onCreateEvent,
  existingMemberIds,
  existingTools,
  isLoadingTools,
  onDeployExistingTool,
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
  onOpenHiveLab: () => void;
  onQuickDeploy?: (template: QuickTemplate) => Promise<void>;
  onInviteMember: (input: MemberInviteInput) => Promise<void>;
  onSearchUsers: (query: string) => Promise<InviteableUser[]>;
  onCreateEvent: (input: EventCreateInput) => Promise<void>;
  existingMemberIds: string[];
  existingTools?: ExistingTool[];
  isLoadingTools?: boolean;
  onDeployExistingTool?: (toolId: string) => Promise<void>;
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
        onOpenHiveLab={onOpenHiveLab}
        onQuickDeploy={onQuickDeploy}
        showQuickDeploy={!!onQuickDeploy}
        showHiveLab={true} // Leaders always see HiveLab
        existingTools={existingTools}
        isLoadingTools={isLoadingTools}
        onDeployExistingTool={onDeployExistingTool}
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
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Premium UI is now the default (ChatGPT/Apple fusion design)
  // Add ?legacy=true to URL to use the legacy UI
  const usePremiumUI = searchParams.get('legacy') !== 'true';

  // Use focused context hooks for better performance (only re-render when specific data changes)
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
  const { tabs } = useSpaceStructureContext();
  const { leaderActions } = useSpaceLeader();

  // Compute membership booleans from role
  const isMember = Boolean(membership?.role);
  const isLeader = ['owner', 'admin', 'leader', 'moderator'].includes(membership?.role || '');

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
    setTyping,
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

  // Existing tools for Add Widget modal
  const [existingTools, setExistingTools] = React.useState<ExistingTool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = React.useState(false);

  // Fetch user's tools when add widget modal opens
  React.useEffect(() => {
    if (!addWidgetModalOpen || !isLeader) return;

    const fetchTools = async () => {
      setIsLoadingTools(true);
      try {
        const response = await secureApiFetch('/api/tools?status=published&limit=10');
        if (response.ok) {
          const data = await response.json();
          setExistingTools(data.tools || []);
        }
      } catch (error) {
        logger.error('Failed to fetch existing tools', { error });
      } finally {
        setIsLoadingTools(false);
      }
    };

    fetchTools();
  }, [addWidgetModalOpen, isLeader]);

  // Tool runtime modal state
  const [selectedTool, setSelectedTool] = React.useState<SelectedTool | null>(null);
  const [toolModalOpen, setToolModalOpen] = React.useState(false);

  // Automation templates modal state (Phase 3.5)
  const [showTemplates, setShowTemplates] = React.useState(false);

  // Event details modal state (Phase 2 - Events feature)
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = React.useState(false);

  // Context panel state (Phase 3 - on-demand sidebar replacement)
  const [contextPanelOpen, setContextPanelOpen] = React.useState(false);

  // Sidebar edit mode state (for leaders to remove tools)
  const [sidebarEditMode, setSidebarEditMode] = React.useState(false);

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
    // P0: Enable real-time RTDB subscriptions for live updates (polls, counters)
    enableRealtime: true,
  });

  // Pinned messages for sidebar
  const {
    messages: pinnedMessages,
    isLoading: pinnedLoading,
  } = usePinnedMessages({
    spaceId: spaceId ?? '',
    enabled: !!spaceId,
  });

  // Automations for this space (HiveLab Phase 3)
  const {
    automations,
    isLoading: automationsLoading,
    isLeader: canManageAutomations,
    toggle: toggleAutomation,
    remove: removeAutomation,
    refetch: refetchAutomations,
  } = useAutomations(spaceId);

  // Leader onboarding (Spaces + HiveLab integration)
  const leaderOnboarding = useLeaderOnboarding({
    spaceId: spaceId ?? '',
    isLeader,
    deployedToolCount: tools.length,
    eventCount: events.length,
    memberCount: space?.memberCount ?? 0,
  });

  // FoundingClass ritual tracking (January Leader Month)
  // For now, we enable for all leaders - in production this would check the feature flag
  const foundingClassRitual = useFoundingClassRitual({
    isLeader,
    isEnabled: true, // TODO: Check RITUALS_FOUNDING_CLASS feature flag
    leaderOnboarding,
    participantCount: 23, // TODO: Fetch from /api/rituals/founding-class/participants
  });

  // Member welcome modal (first-time visitors to this space)
  const memberWelcome = useSpaceWelcome(spaceId ?? '');

  // Show welcome modal for non-leader members who haven't seen it
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false);

  React.useEffect(() => {
    // Only show welcome for members who aren't leaders and haven't seen it
    if (isMember && !isLeader && memberWelcome.shouldShow && !memberWelcome.isLoading) {
      // Small delay to let the entry animation complete
      const timer = setTimeout(() => setShowWelcomeModal(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isMember, isLeader, memberWelcome.shouldShow, memberWelcome.isLoading]);

  // Threshold pattern: Show welcoming entry for first-time non-member visitors
  const [showThreshold, setShowThreshold] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!spaceId || isLoading) return;

    // Skip threshold for leaders - they go straight to setup/chat
    if (isLeader) {
      setShowThreshold(false);
      return;
    }

    // Skip threshold for members - they've already joined
    if (isMember) {
      setShowThreshold(false);
      return;
    }

    // Check localStorage for visited spaces
    const visitedKey = `hive_visited_spaces`;
    const visited = JSON.parse(localStorage.getItem(visitedKey) || '[]');
    const hasVisited = visited.includes(spaceId);

    setShowThreshold(!hasVisited);
  }, [spaceId, isLoading, isLeader, isMember]);

  // Mark space as visited when user clicks "Enter Chat"
  const handleEnterFromThreshold = React.useCallback(() => {
    if (!spaceId) return;

    const visitedKey = `hive_visited_spaces`;
    const visited = JSON.parse(localStorage.getItem(visitedKey) || '[]');
    if (!visited.includes(spaceId)) {
      visited.push(spaceId);
      localStorage.setItem(visitedKey, JSON.stringify(visited));
    }

    setShowThreshold(false);
  }, [spaceId]);

  // Chat intent detection (HiveLab AI-powered component creation)
  const {
    checkIntent,
    createComponent: createIntentComponent,
    isLoading: intentLoading,
    // error: intentError, clearError: clearIntentError - available for error UI
  } = useChatIntent(spaceId ?? '');

  // Pending intent state for confirmation UI
  const [pendingIntent, setPendingIntent] = React.useState<{
    intent: DetectedIntent;
    message: string;
    boardId: string;
  } | null>(null);

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
  }, [spaceId, isMember, membership, user]);

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

  // Handle open HiveLab with space context
  const handleOpenHiveLab = React.useCallback(() => {
    if (!spaceId) return;
    // Navigate to tool creation with space context
    router.push(`/tools/create?spaceId=${spaceId}`);
  }, [router, spaceId]);

  // Handle deploy existing tool to space
  const handleDeployExistingTool = React.useCallback(async (toolId: string) => {
    if (!spaceId) throw new Error("Space not found");

    const response = await secureApiFetch('/api/tools/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolId,
        deployTo: 'space',
        targetId: spaceId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to deploy tool');
    }

    // Refresh sidebar tools after deployment
    refresh();
    toast.success('Tool deployed', 'Tool has been added to the sidebar.');
  }, [spaceId, refresh]);

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

  // Handle event RSVP
  const handleEventRSVP = React.useCallback(async (eventId: string, status: RSVPStatus) => {
    if (!spaceId) throw new Error("Space not found");
    const response = await secureApiFetch(`/api/spaces/${spaceId}/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update RSVP');
    }
    // Refresh events to get updated RSVP status
    refresh();
    toast.success('RSVP updated', status === 'going' ? "You're going!" : status === 'maybe' ? "Marked as maybe" : "RSVP removed");
  }, [spaceId, refresh]);

  // Handle opening event details modal
  const handleEventClick = React.useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    setEventDetailsModalOpen(true);
  }, []);

  // Compute selected event for modal - convert to SpaceEventDetails format
  const selectedEventDetails = React.useMemo((): SpaceEventDetails | null => {
    if (!selectedEventId) return null;
    const event = events.find((e) => e.id === selectedEventId);
    if (!event) return null;

    // Type assertion since events from context has more fields than SpaceEventData
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

    // Map event type to valid SpaceEventDetails type
    const eventType = (['academic', 'social', 'recreational', 'cultural', 'meeting', 'virtual'] as const).includes(
      e.type as SpaceEventDetails['type']
    ) ? e.type as SpaceEventDetails['type'] : 'meeting';

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
      organizer: e.organizerId ? {
        id: e.organizerId,
        fullName: e.organizerName || 'Organizer',
        photoURL: e.organizerAvatarUrl,
      } : undefined,
      userRSVP: e.userRSVP || null,
      linkedBoardId: e.linkedBoardId,
    };
  }, [selectedEventId, events]);

  // Handle quick deploy of a template tool
  const handleQuickDeploy = React.useCallback(async (template: QuickTemplate) => {
    if (!spaceId) throw new Error("Space not found");

    // First, create the tool from the template
    const createResponse = await secureApiFetch('/api/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: template.name,
        description: template.description,
        composition: template.composition,
        status: 'published', // Publish immediately for quick deploy
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create tool');
    }

    const { tool } = await createResponse.json();

    // Then deploy it to this space
    const deployResponse = await secureApiFetch(`/api/spaces/${spaceId}/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolId: tool.id,
        titleOverride: template.name,
        position: 'sidebar',
      }),
    });

    if (!deployResponse.ok) {
      const errorData = await deployResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to deploy tool');
    }

    // Refresh tools list to show the new tool
    const res = await secureApiFetch(`/api/spaces/${spaceId}/tools`);
    if (res.ok) {
      const data = await res.json();
      const toolList = Array.isArray(data.tools) ? data.tools : [];
      setTools(
        toolList.map((t: Record<string, unknown>) => ({
          id: (t.placementId as string) || (t.toolId as string),
          toolId: t.toolId as string,
          placementId: t.placementId as string,
          name: (t.titleOverride as string) || (t.name as string),
          type: (t.category as string) || "tool",
          isActive: t.isActive === true,
          responseCount: (t.usageCount as number) || 0,
        }))
      );
    }

    // Mark the deploy-tool task as complete
    leaderOnboarding.markTaskComplete('deployTool');

    toast.success(`${template.name} deployed!`, 'Your tool is now live in the sidebar.');
  }, [spaceId, leaderOnboarding]);

  // Handle removing a tool from the space sidebar
  const handleRemoveTool = React.useCallback(async (toolId: string) => {
    if (!spaceId) return;

    // Find the tool to get placementId
    const tool = tools.find((t) => t.id === toolId || t.toolId === toolId);
    if (!tool?.placementId) {
      toast.error('Tool not found', 'Unable to remove this tool.');
      return;
    }

    try {
      const response = await secureApiFetch(`/api/spaces/${spaceId}/tools`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placementId: tool.placementId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove tool');
      }

      // Update local state immediately
      setTools((prev) => prev.filter((t) => t.placementId !== tool.placementId));
      toast.success('Tool removed', `${tool.name} has been removed from the sidebar.`);
    } catch (error) {
      logger.error('Failed to remove tool', { toolId, error });
      toast.error('Failed to remove tool', error instanceof Error ? error.message : 'Please try again.');
    }
  }, [spaceId, tools]);

  // Handler for sending messages with intent detection (must be before early return)
  const handleSendMessage = React.useCallback(async (content: string, replyToId?: string) => {
    // Skip intent detection for thread replies
    if (replyToId) {
      await sendMessage(content, replyToId);
      return;
    }

    // Quick check - if message might have an intent, check with API
    if (isLeader && activeBoardId && mightHaveIntent(content)) {
      try {
        const intentResult = await checkIntent(content, activeBoardId);

        // If we detected a valid intent that can be created, show confirmation
        if (intentResult.hasIntent && intentResult.intentType !== 'none' && intentResult.intentType !== 'help') {
          setPendingIntent({
            intent: intentResult,
            message: content,
            boardId: activeBoardId,
          });
          return; // Don't send yet - wait for confirmation
        }
      } catch (err) {
        // Intent check failed, continue with normal send
        console.warn('[Space] Intent check failed:', err);
      }
    }

    // No intent detected or not a leader - send as normal message
    await sendMessage(content, replyToId);
  }, [sendMessage, checkIntent, isLeader, activeBoardId]);

  // Handler for confirming intent creation
  const handleConfirmIntent = React.useCallback(async () => {
    if (!pendingIntent) return;

    try {
      const result = await createIntentComponent(
        pendingIntent.message,
        pendingIntent.boardId
      );

      if (result.success && result.created) {
        // Component created - clear pending state
        // The component will appear in chat via real-time sync
        setPendingIntent(null);

        // Show success toast with component type
        const typeLabels: Record<string, string> = {
          poll: 'Poll',
          rsvp: 'RSVP',
          countdown: 'Countdown',
          announcement: 'Announcement',
        };
        const label = typeLabels[pendingIntent.intent.intentType] || 'Component';
        toast.success(`${label} created`, 'Your interactive component is now live in the chat.');
      } else {
        // Creation failed but not an error - maybe needs more info
        // Keep the pending state and let user modify
        console.warn('[Space] Intent component not created:', result.error);
        toast.error('Could not create component', result.error || 'Please try again or send as a regular message.');
      }
    } catch (err) {
      console.error('[Space] Failed to create intent component:', err);
      toast.error('Failed to create component', 'An unexpected error occurred. Please try again.');
      // Keep pending state so user can retry or dismiss
    }
  }, [pendingIntent, createIntentComponent]);

  // Handler for dismissing intent (send as regular message instead)
  const handleDismissIntent = React.useCallback(async () => {
    if (!pendingIntent) return;

    // Send as regular message
    await sendMessage(pendingIntent.message);
    setPendingIntent(null);
  }, [pendingIntent, sendMessage]);

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
      const typeLabels: Record<string, string> = {
        poll: 'Poll',
        rsvp: 'RSVP',
        countdown: 'Countdown',
        custom: 'Component',
      };
      toast.success(`${typeLabels[apiType] || 'Tool'} added`, 'Your interactive component is now live in the chat.');
    } catch (err) {
      console.error('[Space] Failed to insert tool:', err);
      toast.error('Failed to add tool', err instanceof Error ? err.message : 'Please try again.');
    }
  }, [spaceId, activeBoardId]);

  // Handler for slash commands (e.g., /poll "Question?" Option1, Option2)
  const handleSlashCommand = React.useCallback(async (command: SlashCommandData) => {
    if (!spaceId || !activeBoardId) return;

    // Check if this is an automation command
    const automationCommands = ['welcome', 'remind', 'automate'];
    if (automationCommands.includes(command.command)) {
      return handleAutomationCommand(command);
    }

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
        case 'countdown': {
          apiType = 'countdown';
          config.title = command.primaryArg || 'Timer';
          // Parse duration from listArgs or flags (e.g., "25m", "1h", "30s")
          const durationStr = command.listArgs[0] || command.flags.duration as string || '5m';
          const duration = parseDuration(durationStr);
          config.targetDate = new Date(Date.now() + duration).toISOString();
          break;
        }

        case 'rsvp':
        case 'event': {
          apiType = 'rsvp';
          config.eventTitle = command.primaryArg || 'Event';
          // Parse date from flags or default to tomorrow
          const dateStr = command.flags.date as string || command.flags.when as string;
          config.eventDate = dateStr ? new Date(dateStr).toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          config.allowMaybe = command.flags.maybe !== false;
          break;
        }

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
          logger.warn(`[Space] Unknown slash command: ${command.command}`);
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
      // Show success toast
      const typeLabels: Record<string, string> = {
        poll: 'Poll',
        rsvp: 'RSVP',
        countdown: 'Countdown',
        custom: 'Component',
      };
      toast.success(`${typeLabels[apiType] || 'Component'} created`, 'Your interactive component is now live.');
    } catch (err) {
      logger.error('[Space] Failed to execute slash command', err as Error);
      toast.error('Command failed', err instanceof Error ? err.message : 'Failed to create component');
    }
    // Note: handleAutomationCommand defined below, but safe to reference here due to closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId, activeBoardId]);

  // Handler for automation slash commands (/welcome, /remind, /automate)
  const handleAutomationCommand = React.useCallback(async (command: SlashCommandData) => {
    if (!spaceId) return;

    try {
      let automationPayload: {
        name: string;
        description?: string;
        trigger: { type: string; config: Record<string, unknown> };
        action: { type: string; config: Record<string, unknown> };
        creationSource: string;
        creationPrompt: string;
      };

      switch (command.command) {
        case 'welcome': {
          // /welcome "Message" [--delay=<seconds>] [--board=<boardId>]
          const message = command.primaryArg || 'Welcome to our space! 👋';
          const delay = command.flags.delay ? Number(command.flags.delay) * 1000 : 0;
          const boardId = (command.flags.board as string) || activeBoardId || 'general';

          automationPayload = {
            name: 'Welcome Message',
            description: `Auto-greet new members: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"`,
            trigger: {
              type: 'member_join',
              config: { delayMs: delay },
            },
            action: {
              type: 'send_message',
              config: {
                boardId,
                content: message,
              },
            },
            creationSource: 'slash_command',
            creationPrompt: command.raw,
          };
          break;
        }

        case 'remind': {
          // /remind <minutes> ["Message"] [--board=<boardId>]
          const beforeMinutes = parseInt(command.primaryArg || '30', 10);
          const message = command.listArgs[0] || `📅 Reminder: {event.title} starts in ${beforeMinutes} minutes!`;
          const boardId = (command.flags.board as string) || activeBoardId || 'general';

          automationPayload = {
            name: `Event Reminder (${beforeMinutes} min)`,
            description: `Remind members ${beforeMinutes} minutes before events`,
            trigger: {
              type: 'event_reminder',
              config: { beforeMinutes },
            },
            action: {
              type: 'send_message',
              config: {
                boardId,
                content: message,
              },
            },
            creationSource: 'slash_command',
            creationPrompt: command.raw,
          };
          break;
        }

        case 'automate': {
          // /automate <type> "Name" [config]
          const automationType = command.primaryArg?.toLowerCase() || 'welcome';
          const name = command.listArgs[0] || `Custom ${automationType} automation`;

          // Build trigger/action based on automation type
          if (automationType === 'welcome') {
            automationPayload = {
              name,
              trigger: { type: 'member_join', config: {} },
              action: {
                type: 'send_message',
                config: {
                  boardId: activeBoardId || 'general',
                  content: 'Welcome to our space!',
                },
              },
              creationSource: 'slash_command',
              creationPrompt: command.raw,
            };
          } else if (automationType === 'reminder') {
            const beforeMinutes = Number(command.flags.before) || 30;
            automationPayload = {
              name,
              trigger: { type: 'event_reminder', config: { beforeMinutes } },
              action: {
                type: 'send_message',
                config: {
                  boardId: activeBoardId || 'general',
                  content: `📅 {event.title} starts in ${beforeMinutes} minutes!`,
                },
              },
              creationSource: 'slash_command',
              creationPrompt: command.raw,
            };
          } else {
            toast.error('Unknown automation type', `Type "${automationType}" is not supported yet.`);
            return;
          }
          break;
        }

        default:
          return;
      }

      const response = await secureApiFetch(`/api/spaces/${spaceId}/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automationPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create automation');
      }

      const result = await response.json();

      // Show success toast with automation-specific messaging
      const triggerLabels: Record<string, string> = {
        member_join: 'when new members join',
        event_reminder: 'before events start',
        schedule: 'on schedule',
        keyword: 'when keywords are detected',
      };
      const triggerDesc = triggerLabels[automationPayload.trigger.type] || '';

      toast.success(
        `${automationPayload.name} active!`,
        `Will automatically run ${triggerDesc}.`
      );

      logger.info('[Space] Automation created', { result });
    } catch (err) {
      logger.error('[Space] Failed to create automation', err as Error);
      toast.error('Automation failed', err instanceof Error ? err.message : 'Failed to create automation');
    }
  }, [spaceId, activeBoardId]);

  // Loading state
  if (isLoading || !space) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <SpaceBoardSkeleton />
        </div>
      </div>
    );
  }

  // Threshold: Show welcoming entry for first-time non-member visitors
  // (null = still checking, true = show threshold, false = show chat)
  if (showThreshold === null) {
    // Still determining if we should show threshold
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (showThreshold) {
    return (
      <SpaceThreshold
        space={{
          id: spaceId ?? "",
          name: space.name,
          description: space.description,
          iconUrl: space.iconUrl,
          bannerUrl: space.bannerUrl,
          category: space.category,
          memberCount: space.memberCount,
          onlineCount: space.onlineCount,
        }}
        events={events.slice(0, 3).map(e => ({
          id: e.id,
          title: e.title,
          date: e.startDate,
        }))}
        toolCount={tools.length}
        onEnter={handleEnterFromThreshold}
      />
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
    // Leader setup progress (for incomplete setups)
    ...(isLeader && leaderOnboarding.shouldShowProgress && {
      setupProgress: {
        tasks: leaderOnboarding.tasks.map(t => ({
          id: t.id,
          label: t.label,
          description: t.description,
          completed: t.completed,
          action: t.action,
        })),
        completedCount: leaderOnboarding.completedCount,
        totalCount: leaderOnboarding.totalCount,
        percentComplete: leaderOnboarding.percentComplete,
      },
    }),
  };

  // PERFORMANCE FIX: Memoize board transformations to prevent re-renders
  // These transformations only need to recalculate when boards actually change
  const boardsForTabBar = React.useMemo<BoardData[]>(
    () => (boards as ChatBoardData[]).map((b: ChatBoardData) => ({
      id: b.id,
      name: b.name,
      type: b.type,
      description: b.description,
      messageCount: b.messageCount,
      isDefault: b.isDefault,
      isLocked: b.isLocked,
    })),
    [boards]
  );

  // PERFORMANCE FIX: Memoize premium board tabs
  const premiumBoards = React.useMemo<BoardTab[]>(
    () => (boards as ChatBoardData[]).map((b: ChatBoardData) => ({
      id: b.id,
      name: b.name,
      type: b.type === 'general' ? 'general' : b.type === 'event' ? 'events' : 'discussion',
      isDefault: b.isDefault,
    })),
    [boards]
  );

  // PERFORMANCE FIX: Memoize message transformations
  // Critical for performance with large message lists (1000+ messages)
  const premiumMessages = React.useMemo<MessageData[]>(
    () => messages.map((m) => ({
      id: m.id,
      content: m.content,
      author: {
        id: m.authorId,
        name: m.authorName,
        avatarUrl: m.authorAvatarUrl,
        role: m.authorRole,
      },
      timestamp: new Date(m.timestamp),
      isEdited: Boolean(m.editedAt),
      isDeleted: m.isDeleted,
      isPinned: m.isPinned,
      reactions: m.reactions,
      threadCount: m.threadCount,
    })),
    [messages]
  );

  // ============================================================
  // PREMIUM UI (ChatGPT/Apple Fusion) - DEFAULT EXPERIENCE
  // Use ?legacy=true in URL to switch to legacy UI
  // ============================================================
  if (usePremiumUI) {
    return (
      <div className="min-h-screen h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
        {/* Premium Header */}
        <PremiumHeader
          space={{
            id: spaceId ?? "",
            name: space.name,
            description: space.description,
            iconUrl: space.iconUrl,
            category: space.category,
            isVerified: space.isVerified,
            memberCount: space.memberCount,
            onlineCount: space.onlineCount,
          }}
          membershipState={membershipState === 'owner' ? 'owner' : membershipState === 'admin' ? 'admin' : membershipState === 'joined' ? 'joined' : 'not_joined'}
          isLeader={isLeader}
          currentBoardName={boards.find(b => b.id === activeBoardId)?.name}
          onJoin={async () => { await joinSpace(); }}
          onLeave={async () => { await leaveSpace(); }}
          onShare={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied', 'Space URL copied to clipboard');
          }}
          onSettings={isLeader ? () => router.push(`/spaces/${spaceId}/settings`) : undefined}
          onInfo={() => setContextPanelOpen(true)}
        />

        {/* Full-Width Chat (Phase 3 - Edge-to-edge with on-demand context) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Premium Chat Board - Full Width */}
          <main className="flex-1 min-w-0 flex flex-col bg-[#050505]">
            <PremiumChatBoard
              spaceId={spaceId ?? ""}
              boards={premiumBoards}
              activeBoardId={activeBoardId ?? boards[0]?.id ?? "general"}
              messages={premiumMessages}
              currentUserId={user?.uid ?? "anonymous"}
              currentUserName={user?.displayName || "You"}
              currentUserAvatar={user?.photoURL || undefined}
              typingUsers={typingUsers}
              isLoading={chatLoading}
              isLoadingMore={chatLoadingMore}
              hasMoreMessages={chatHasMore}
              canPost={isMember}
              isLeader={isLeader}
              canEditOwn={true}
              canDeleteOwn={true}
              canPin={isLeader}
              scrollToMessageId={scrollToMessageId ?? undefined}
              onScrollToMessageComplete={() => setScrollToMessageId(null)}
              onBoardChange={changeBoard}
              onSendMessage={handleSendMessage}
              onLoadMore={loadMoreMessages}
              onReact={addReaction}
              onEdit={(messageId) => {
                // For now, just log - full edit would need modal
                logger.info('[Premium] Edit message', { messageId });
              }}
              onDelete={deleteMessage}
              onPin={isLeader ? pinMessage : undefined}
              onViewThread={openThread}
              onAddBoard={isLeader ? handleCreateBoard : undefined}
              composerPlaceholder={`Message ${boards.find(b => b.id === activeBoardId)?.name || 'this space'}...`}
            />
          </main>
        </div>

        {/* Context Panel - Slide-in sidebar replacement (Phase 3) */}
        <ContextPanel
          isOpen={contextPanelOpen}
          onClose={() => setContextPanelOpen(false)}
          space={{
            id: spaceId ?? "",
            name: space.name,
            description: space.description,
            iconUrl: space.iconUrl,
            category: space.category,
            memberCount: space.memberCount,
            onlineCount: space.onlineCount,
          }}
          events={(events as SpaceEventData[]).slice(0, 5).map((e) => ({
            id: e.id,
            title: e.title,
            date: new Date(e.startDate),
            attendees: e.currentAttendees,
            isUrgent: new Date(e.startDate).getTime() - Date.now() < 24 * 60 * 60 * 1000,
          }))}
          members={leaders.map((l) => ({
            id: l.id,
            name: l.name,
            avatarUrl: l.avatarUrl,
            role: l.role === 'owner' ? 'owner' : l.role === 'admin' ? 'admin' : 'member',
            isOnline: false,
          }))}
          totalMemberCount={space.memberCount}
          tools={tools.map((t) => ({
            id: t.id,
            name: t.name,
            icon: undefined,
            isActive: t.isActive,
          }))}
          onViewAllEvents={() => router.push(`/spaces/${spaceId}/events`)}
          onViewAllMembers={() => router.push(`/spaces/${spaceId}/members`)}
          onToolClick={(toolId) => {
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
              setContextPanelOpen(false);
            }
          }}
          onEventClick={(eventId) => {
            handleEventClick(eventId);
            setContextPanelOpen(false);
          }}
        />

        {/* Mobile Navigation (reuse existing) */}
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
          automations={automations.map(a => ({
            id: a.id,
            name: a.name,
            trigger: a.trigger.type,
            enabled: a.enabled,
            runCount: a.stats?.timesTriggered,
          }))}
          isLeader={isLeader}
          onOpenTemplates={() => setShowTemplates(true)}
        />

        {/* Modals (reuse existing) */}
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
            onOpenHiveLab={handleOpenHiveLab}
            onQuickDeploy={handleQuickDeploy}
            onInviteMember={handleInviteMember}
            onSearchUsers={handleSearchUsers}
            onCreateEvent={handleCreateEvent}
            existingMemberIds={leaders.map((l) => l.id)}
            existingTools={existingTools}
            isLoadingTools={isLoadingTools}
            onDeployExistingTool={handleDeployExistingTool}
          />
        )}

        {/* Tool Runtime Modal (Premium UI) */}
        {selectedTool && (
          <ToolRuntimeModal
            open={toolModalOpen}
            onOpenChange={(open) => {
              setToolModalOpen(open);
              if (!open) setSelectedTool(null);
            }}
            toolId={selectedTool.toolId}
            spaceId={spaceId ?? ''}
            placementId={selectedTool.placementId}
            toolName={selectedTool.name}
            onExpandToFullPage={() => {
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
              tool: { ...toolRuntime.tool, status: toolRuntime.tool.status || 'draft' },
              state: toolRuntime.state,
              // Phase 1: SharedState Architecture
              sharedState: toolRuntime.sharedState,
              userState: toolRuntime.userState,
              isLoading: toolRuntime.isLoading,
              isExecuting: toolRuntime.isExecuting,
              isSaving: toolRuntime.isSaving,
              isSynced: toolRuntime.isSynced,
              lastSaved: toolRuntime.lastSaved,
              error: toolRuntime.error instanceof Error ? toolRuntime.error.message : toolRuntime.error,
              executeAction: async (action: string, elementId?: string, data?: Record<string, unknown>) => {
                const result = await toolRuntime.executeAction(elementId || '', action, data);
                return { success: result.success, data: result.state, error: result.error };
              },
              updateState: (elementId: string, data: unknown) => {
                toolRuntime.updateState({ [elementId]: data });
              },
            } : undefined}
          />
        )}

        {/* Thread Drawer */}
        <ThreadDrawer
          open={thread.isOpen}
          onOpenChange={(open) => { if (!open) closeThread(); }}
          parentMessage={thread.parentMessage}
          replies={thread.replies}
          isLoading={thread.isLoading}
          isLoadingMore={thread.isLoadingMore}
          hasMoreReplies={thread.hasMore}
          currentUserId={user?.uid ?? "anonymous"}
          onLoadMore={loadMoreReplies}
          onSendReply={async (content: string) => { await sendThreadReply(content); }}
        />

        {/* Event Details Modal */}
        <EventDetailsModal
          event={selectedEventDetails}
          open={eventDetailsModalOpen}
          onOpenChange={(open) => {
            setEventDetailsModalOpen(open);
            if (!open) setSelectedEventId(null);
          }}
          onRSVP={handleEventRSVP}
          onViewBoard={selectedEventDetails?.linkedBoardId ? (boardId) => {
            changeBoard(boardId);
            setEventDetailsModalOpen(false);
            setSelectedEventId(null);
          } : undefined}
          currentUserId={user?.uid}
          spaceId={spaceId ?? ''}
        />
      </div>
    );
  }

  // ============================================================
  // CLASSIC UI (Original)
  // ============================================================
  return (
    <div className="min-h-screen h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
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
        <main className="flex-1 lg:flex-[3] min-w-0 flex flex-col bg-[#0A0A0A] relative">
          {/* Intent Confirmation - shows above chat input when AI detects component intent */}
          {pendingIntent && (
            <div className="absolute bottom-24 left-4 right-4 z-50 max-w-3xl mx-auto">
              <IntentConfirmationInline
                intent={pendingIntent.intent}
                onConfirm={handleConfirmIntent}
                onDismiss={handleDismissIntent}
                isCreating={intentLoading}
              />
            </div>
          )}

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
            onTyping={setTyping}
            useEdgeToEdge={true}
          />
        </main>

        {/* Sidebar - 40% on desktop, hidden on mobile, sticky for scroll */}
        <aside className="hidden lg:flex lg:flex-col lg:flex-[2] max-w-[400px] border-l border-[#2A2A2A] bg-[#0A0A0A]/50 overflow-y-auto lg:sticky lg:top-0 lg:h-screen">
          {/* Pinned Messages Widget - shows when there are pinned messages */}
          {(pinnedMessages.length > 0 || pinnedLoading) && (
            <div className="p-4 border-b border-[#2A2A2A]">
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

          {/* Leader Setup Progress - shows for leaders with incomplete setup */}
          {leaderOnboarding.shouldShowProgress && (
            <div className="p-4 border-b border-[#2A2A2A]">
              <LeaderSetupProgress
                spaceId={spaceId ?? ''}
                tasks={leaderOnboarding.tasks.map(t => ({
                  id: t.id,
                  label: t.label,
                  description: t.description,
                  completed: t.completed,
                  action: t.action,
                }))}
                completedCount={leaderOnboarding.completedCount}
                totalCount={leaderOnboarding.totalCount}
                percentComplete={leaderOnboarding.percentComplete}
                onTaskAction={(action) => {
                  if (action === 'deploy-tool') {
                    setAddWidgetModalOpen(true);
                  } else if (action === 'create-event') {
                    setCreateEventModalOpen(true);
                  } else if (action === 'invite-members') {
                    setInviteMemberModalOpen(true);
                  } else if (action === 'customize-sidebar') {
                    setSidebarEditMode(true);
                    leaderOnboarding.markTaskComplete('customizeSidebar');
                  }
                }}
                inline
              />
            </div>
          )}

          {/* Automations Panel - shows for leaders (HiveLab Phase 3) */}
          {canManageAutomations && (
            <div className="p-4 border-b border-[#2A2A2A] space-y-3">
              <AutomationsPanel
                automations={automations}
                isLeader={canManageAutomations}
                isLoading={automationsLoading}
                onToggle={toggleAutomation}
                onDelete={removeAutomation}
              />
              {/* Quick Templates Button (Phase 3.5) - always visible for discoverability */}
              <AutomationTemplatesCompact
                onOpenFull={() => setShowTemplates(true)}
                templateCount={6}
              />
            </div>
          )}

          {/* FoundingClass Ritual Banner - Leader January Challenge */}
          {foundingClassRitual.shouldShowRitual && foundingClassRitual.ritualData && (
            <RitualStrip
              ritual={foundingClassRitual.ritualData}
              variant="compact"
              showProgress={true}
              onViewDetails={() => router.push('/rituals/founding-class-2026')}
              className="mb-4"
            />
          )}

          {/* Main sidebar content */}
          <SpaceSidebar
            data={sidebarData}
            isLeader={isLeader}
            isEditMode={sidebarEditMode}
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
              // Events - open event details modal
              onEventClick: handleEventClick,
              // Leader actions
              onInviteMember: isLeader ? () => setInviteMemberModalOpen(true) : undefined,
              onCreateEvent: isLeader ? () => setCreateEventModalOpen(true) : undefined,
              // Tool removal (leader edit mode)
              onRemoveTool: isLeader ? handleRemoveTool : undefined,
              // Setup task actions (for leader onboarding)
              onSetupTaskAction: isLeader ? (action) => {
                switch (action) {
                  case 'deploy-tool':
                    setAddWidgetModalOpen(true);
                    break;
                  case 'create-event':
                    setCreateEventModalOpen(true);
                    break;
                  case 'invite-members':
                    setInviteMemberModalOpen(true);
                    break;
                  case 'customize-sidebar':
                    setSidebarEditMode(true);
                    break;
                }
              } : undefined,
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
        automations={automations.map(a => ({
          id: a.id,
          name: a.name,
          trigger: a.trigger.type,
          enabled: a.enabled,
          runCount: a.stats?.timesTriggered,
        }))}
        isLeader={isLeader}
        onOpenTemplates={() => setShowTemplates(true)}
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
          onOpenHiveLab={handleOpenHiveLab}
          onQuickDeploy={handleQuickDeploy}
          onInviteMember={handleInviteMember}
          onSearchUsers={handleSearchUsers}
          onCreateEvent={handleCreateEvent}
          existingMemberIds={leaders.map((l) => l.id)}
          existingTools={existingTools}
          isLoadingTools={isLoadingTools}
          onDeployExistingTool={handleDeployExistingTool}
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
            // Phase 1: SharedState Architecture
            sharedState: toolRuntime.sharedState,
            userState: toolRuntime.userState,
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

      {/* Automation Templates Sheet (Phase 3.5) */}
      <Sheet open={showTemplates} onOpenChange={setShowTemplates}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-[#0a0a0a] border-l border-white/[0.08]">
          <SheetHeader className="border-b border-white/[0.08] pb-4">
            <SheetTitle className="text-white">Automation Templates</SheetTitle>
          </SheetHeader>
          <div className="py-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
            <AutomationTemplates
              spaceId={spaceId ?? ''}
              fetchTemplates={async () => {
                const res = await secureApiFetch('/api/automations/templates');
                if (!res.ok) throw new Error('Failed to fetch templates');
                return res.json();
              }}
              onApplyTemplate={async (templateId, customValues, name) => {
                const res = await secureApiFetch(`/api/spaces/${spaceId}/automations/from-template`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ templateId, customValues, name }),
                });
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error || 'Failed to apply template');
                }
                toast.success('Automation enabled', 'It will start working automatically.');
              }}
              onAutomationCreated={() => {
                // Refresh the automations list
                refetchAutomations();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Leader Onboarding Modal - 3-step wizard for new leaders */}
      <SpaceLeaderOnboardingModal
        open={leaderOnboarding.shouldShowOnboarding}
        onClose={leaderOnboarding.dismiss}
        data={{
          spaceName: space.name,
          spaceId: spaceId ?? '',
          memberCount: space.memberCount,
          templates: QUICK_TEMPLATES,
        }}
        onComplete={() => {
          leaderOnboarding.markWelcomeSeen();
        }}
        onDeployTemplate={handleQuickDeploy}
        onOpenHiveLab={handleOpenHiveLab}
        onOpenInvite={() => setInviteMemberModalOpen(true)}
        onSkip={leaderOnboarding.dismiss}
      />

      {/* Member Welcome Modal - First-time visitor onboarding */}
      <SpaceWelcomeModal
        open={showWelcomeModal}
        onClose={() => {
          setShowWelcomeModal(false);
          memberWelcome.markAsSeen();
        }}
        data={{
          name: space.name,
          description: space.description,
          category: space.category,
          iconUrl: space.iconUrl,
          bannerUrl: space.bannerUrl,
          leaders: leaders.map((l) => ({
            id: l.id,
            name: l.name,
            avatarUrl: l.avatarUrl,
            role: l.role,
          })),
          memberCount: space.memberCount,
          features: (() => {
            const features: SpaceFeatureHighlight[] = [];
            if (events.length > 0) {
              features.push({ type: 'events', title: 'Upcoming Events', description: 'Join meetups and activities', count: events.length });
            }
            if (tools.length > 0) {
              features.push({ type: 'tools', title: 'Interactive Tools', description: 'Polls, signups, and more', count: tools.length });
            }
            features.push({ type: 'discussions', title: 'Live Discussions', description: 'Chat with the community in real-time' });
            return features;
          })(),
        }}
        onComplete={() => {
          setShowWelcomeModal(false);
          memberWelcome.markAsSeen();
        }}
        onStartChatting={() => {
          setShowWelcomeModal(false);
          memberWelcome.markAsSeen();
          // Focus the chat input (the ChatInput component handles this internally)
        }}
        storageKey={spaceId ?? ''}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEventDetails}
        open={eventDetailsModalOpen}
        onOpenChange={(open) => {
          setEventDetailsModalOpen(open);
          if (!open) setSelectedEventId(null);
        }}
        onRSVP={handleEventRSVP}
        onViewBoard={selectedEventDetails?.linkedBoardId ? (boardId) => {
          changeBoard(boardId);
          setEventDetailsModalOpen(false);
          setSelectedEventId(null);
        } : undefined}
        currentUserId={user?.uid}
        spaceId={spaceId ?? ''}
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

/**
 * SpacePageWithAnimation - Wraps content with entry animation
 * Uses session storage to only show animation once per session per space
 */
function SpacePageWithAnimation({ spaceId }: { spaceId: string }) {
  const [showEntryAnimation, setShowEntryAnimation] = React.useState(false);
  const [spaceData, setSpaceData] = React.useState<{ name: string; category?: string; onlineCount?: number } | null>(null);

  // Check if we should show the entry animation
  React.useEffect(() => {
    const sessionKey = `hive-space-entered-${spaceId}`;
    const hasEntered = sessionStorage.getItem(sessionKey);

    // Check user's reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasEntered && !prefersReducedMotion) {
      // Fetch minimal space data for animation
      fetch(`/api/spaces/${spaceId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.space) {
            setSpaceData({
              name: data.space.name,
              category: data.space.category,
              onlineCount: data.space.onlineCount,
            });
            setShowEntryAnimation(true);
          }
        })
        .catch(() => {
          // If fetch fails, skip animation
        });
    }
  }, [spaceId]);

  // Mark as entered after animation completes
  const handleAnimationComplete = React.useCallback(() => {
    sessionStorage.setItem(`hive-space-entered-${spaceId}`, 'true');
    setShowEntryAnimation(false);
  }, [spaceId]);

  return (
    <SpaceEntryAnimation
      spaceName={spaceData?.name || ''}
      spaceCategory={spaceData?.category}
      onlineCount={spaceData?.onlineCount}
      isActive={showEntryAnimation && !!spaceData}
      onComplete={handleAnimationComplete}
      skipAnimation={!showEntryAnimation || !spaceData}
    >
      <SpaceContextProvider spaceId={spaceId}>
        <SpaceDetailContent />
      </SpaceContextProvider>
    </SpaceEntryAnimation>
  );
}

export default function SpaceBoardPage() {
  const params = useParams<{ spaceId: string }>();
  const spaceId = params?.spaceId;

  if (!spaceId) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#A1A1A6]">Space not found</div>
      </div>
    );
  }

  return <SpacePageWithAnimation spaceId={spaceId} />;
}

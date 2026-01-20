"use client";

/**
 * Space Detail Page - Theater Mode Experience
 *
 * Hub + Modes architecture for immersive space experience.
 * Redesigned January 2026: Full theater mode with mode-based navigation.
 *
 * Architecture:
 * - State: useSpacePageState hook (703 lines in hooks/)
 * - Mode: useSpaceMode hook for URL-based mode switching
 * - Handlers: 5 factory files (handlers/)
 * - Components: 7 extracted components (components/)
 * - Utils: Tool runtime builder (utils/)
 *
 * Modes:
 * - hub: Overview with mode cards (chat, events, tools)
 * - chat: Full-screen chat (TheaterChatBoard)
 * - events: Full-screen events (EventsMode)
 * - tools: Full-screen tools (ToolsMode)
 * - members: Full-screen members (MembersMode)
 *
 * Design System:
 * - Uses CSS custom properties (no hardcoded hex)
 * - Shell Living mode integration
 * - Page transitions via Framer Motion
 *
 * @version 7.0.0 - Full theater mode integration
 */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  SpaceChatBoard,
  SpaceThreshold,
  SpaceBoardSkeleton,
} from "@hive/ui";
import { ChatSearchModal } from "@hive/ui/design-system/components";
import type { SpaceEvent, SpaceTool, SpaceMember } from "@hive/ui/design-system/components";
import { useSpaceStructureContext } from "@/contexts/space";
import { useSpacePageState, useSpaceMode } from "./hooks";
import { useJoinRequests } from "@/hooks/use-join-requests";
import { useChatSearch } from "@/hooks/chat";
import {
  SpacePageModals,
  IntentConfirmation,
  ErrorToast,
  SpaceEntryWrapper,
  SpaceTheaterLayout,
  LeaderOnboardingBanner,
  LeaderQuickActions,
} from "./components";

// ============================================================
// Main Content Component
// ============================================================

function SpaceDetailContent() {
  const router = useRouter();
  const state = useSpacePageState();
  const { tabs } = useSpaceStructureContext();

  const {
    space,
    spaceId,
    membership,
    isLoading,
    isMember,
    isLeader,
    chat,
    tools,
    toolsHasMore,
    events,
    leaders,
    modals,
    setModal,
    pendingIntent,
    intentLoading,
    leaderOnboarding,
    showThreshold,
    isPrivateSpace,
    joinRequest,
    activeDrawer,
    setActiveDrawer,
    scrollToMessageId,
    setScrollToMessageId,
    error,
    handlers,
  } = state;

  // Mode navigation (theater mode)
  const { mode, setMode } = useSpaceMode({
    spaceId: spaceId ?? "",
    defaultMode: "hub",
    persistToUrl: true,
  });

  // Join requests for leaders in private spaces
  const joinRequests = useJoinRequests(
    spaceId,
    isPrivateSpace && isLeader
  );

  // Chat search
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const chatSearch = useChatSearch({
    spaceId: spaceId ?? "",
    enabled: !!spaceId && isMember,
  });

  // Handle jump to message from search
  const handleJumpToMessage = React.useCallback((messageId: string, boardId?: string) => {
    // Switch to the board if needed
    if (boardId && boardId !== chat.activeBoardId) {
      chat.changeBoard(boardId);
    }
    // Set scroll target
    setScrollToMessageId(messageId);
    // Close search modal
    setIsSearchOpen(false);
  }, [chat, setScrollToMessageId]);

  // ============================================================
  // Loading State
  // ============================================================

  if (isLoading) {
    return (
      <div className="min-h-screen h-screen bg-[var(--bg-ground)] flex flex-col">
        <SpaceBoardSkeleton />
      </div>
    );
  }

  // ============================================================
  // Not Found State
  // ============================================================

  if (!space) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Space not found</div>
      </div>
    );
  }

  // ============================================================
  // Threshold Pattern (First-time Visitors)
  // ============================================================

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
          isPrivate: isPrivateSpace,
        }}
        events={events.slice(0, 3).map((e) => ({
          id: e.id,
          title: e.title,
          date: e.startDate,
        }))}
        toolCount={tools.length}
        joinRequest={isPrivateSpace ? {
          status: joinRequest.joinRequest?.status === 'approved'
            ? null  // If approved, don't show as pending/rejected
            : (joinRequest.joinRequest?.status ?? null) as 'pending' | 'rejected' | null,
          createdAt: joinRequest.joinRequest?.createdAt,
          rejectedAt: joinRequest.joinRequest?.reviewedAt,
          rejectionReason: joinRequest.joinRequest?.rejectionReason,
          canRequestAgain: joinRequest.canRequestAgain,
        } : undefined}
        isCheckingRequest={joinRequest.isLoading}
        onEnter={handlers.handleEnterFromThreshold}
        onRequestJoin={async (message) => { await joinRequest.createRequest(message); }}
        onCancelRequest={async () => { await joinRequest.cancelRequest(); }}
      />
    );
  }

  // ============================================================
  // Data Mapping for Theater Mode
  // ============================================================

  // Map events to SpaceEvent format
  const mappedEvents: SpaceEvent[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startDate: e.startDate,
    endDate: e.endDate,
    location: e.location ?? e.virtualLink,
    isOnline: !!e.virtualLink,
    rsvpCount: e.currentAttendees,
    maxAttendees: e.maxAttendees,
    userRsvp: e.userRSVP as 'going' | 'maybe' | 'not_going' | null,
    hostName: e.organizer?.fullName,
    hostAvatarUrl: e.organizer?.photoURL,
  }));

  // Map tools to SpaceTool format
  const mappedTools: SpaceTool[] = tools.map((t) => ({
    id: t.id,
    toolId: t.toolId,
    placementId: t.placementId,
    name: t.name,
    type: t.type ?? 'other',
    isActive: t.isActive,
    responseCount: t.responseCount,
  }));

  // Map leaders + create members list
  const mappedMembers: SpaceMember[] = leaders.map((l) => ({
    id: l.id,
    name: l.name,
    handle: undefined, // Add if available
    avatarUrl: l.avatarUrl,
    role: l.role as 'owner' | 'admin' | 'moderator' | 'member',
    isOnline: true, // Leaders shown in online list
    joinedAt: undefined, // Add if available
  }));

  // ============================================================
  // Handlers for Modes
  // ============================================================

  const handleEventRsvp = (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    handlers.handleEventRSVP(eventId, status);
  };

  const handleViewEvent = (eventId: string) => {
    // Open event details modal
    // state.setSelectedEventId(eventId);
    setModal('eventDetails', true);
  };

  const handleCreateEvent = () => {
    setModal('createEvent', true);
  };

  const handleRunTool = (toolId: string) => {
    // Navigate to tool runtime
    const tool = tools.find(t => t.id === toolId || t.toolId === toolId);
    if (tool) {
      router.push(`/tools/${tool.toolId}/run`);
    }
  };

  const handleViewTool = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId || t.toolId === toolId);
    if (tool) {
      router.push(`/tools/${tool.toolId}`);
    }
  };

  const handleAddTool = () => {
    // Open QuickCreate wizard for "blind build" experience
    setModal('quickCreate', true);
  };

  const handleBuildTool = () => {
    // Navigate to HiveLab with space context
    router.push(`/tools/new?spaceId=${spaceId}`);
  };

  const handleRemoveTool = (placementId: string) => {
    handlers.handleRemoveTool(placementId);
  };

  const handleViewProfile = (memberId: string) => {
    router.push(`/profile/${memberId}`);
  };

  const handleInvite = () => {
    setModal('inviteMember', true);
  };

  const handleBoardReorder = async (boardIds: string[]) => {
    await handlers.handleReorderBoards(boardIds);
  };

  // ============================================================
  // Chat Content
  // ============================================================

  const chatContent = (
    <>
      {/* Intent Confirmation Banner */}
      {pendingIntent && (
        <IntentConfirmation
          intent={pendingIntent.intent}
          isLoading={intentLoading}
          onConfirm={handlers.handleConfirmIntent}
          onDismiss={handlers.handleDismissIntent}
        />
      )}

      {/* Chat Board */}
      <SpaceChatBoard
        spaceId={spaceId ?? ""}
        spaceName={space.name}
        boards={chat.boards}
        activeBoardId={chat.activeBoardId ?? chat.boards[0]?.id ?? "general"}
        messages={chat.messages}
        typingUsers={chat.typingUsers}
        onlineCount={space.onlineCount}
        isLoading={chat.isLoading}
        isLoadingMore={chat.isLoadingMore}
        hasMoreMessages={chat.hasMore}
        currentUserId={state.currentUserId}
        currentUserName={state.currentUserName}
        currentUserAvatar={state.currentUserAvatar}
        currentUserRole={
          membership?.role === "owner" ? "owner" : membership?.role === "admin" ? "admin" : "member"
        }
        canPost={isMember}
        isLeader={isLeader}
        scrollToMessageId={scrollToMessageId ?? undefined}
        onScrollToMessageComplete={() => setScrollToMessageId(null)}
        onBoardChange={chat.changeBoard}
        onSendMessage={handlers.handleSendMessage}
        onLoadMore={chat.loadMore}
        onReact={chat.addReaction}
        onPinMessage={isLeader ? chat.pinMessage : undefined}
        onDeleteMessage={chat.deleteMessage}
        onEditMessage={chat.editMessage}
        onViewThread={chat.openThread}
        onCreateBoard={isLeader ? handlers.handleCreateBoard : undefined}
        onBoardReorder={isLeader ? handleBoardReorder : undefined}
        onInsertTool={isMember ? handlers.handleInsertTool : undefined}
        onSlashCommand={isMember ? handlers.handleSlashCommand : undefined}
        showToolbar={isMember}
        enableSlashCommands={isMember}
        onTyping={chat.setTyping}
        onSearchOpen={() => setIsSearchOpen(true)}
        useEdgeToEdge
      />
    </>
  );

  // ============================================================
  // Render
  // ============================================================

  return (
    <>
      <SpaceTheaterLayout
        mode={mode}
        onModeChange={setMode}
        space={{
          id: spaceId ?? "",
          name: space.name,
          description: space.description,
          bannerUrl: space.bannerUrl,
          iconUrl: space.iconUrl,
          category: space.category,
        }}
        // Leader onboarding (shows after claiming)
        leaderOnboardingBanner={isLeader ? (
          <LeaderOnboardingBanner
            spaceId={spaceId ?? ""}
            hasAvatar={!!space.iconUrl}
            hasBanner={!!space.bannerUrl}
            memberCount={space.memberCount ?? 0}
            eventCount={events.length}
            onOpenInviteModal={() => setModal('inviteMember', true)}
            onOpenEventModal={() => setModal('createEvent', true)}
          />
        ) : undefined}
        // Membership
        isMember={isMember}
        onJoin={handlers.handleEnterFromThreshold}
        // Chat
        chatContent={chatContent}
        // Events
        events={mappedEvents}
        eventsLoading={false}
        canCreateEvent={isLeader}
        onEventRsvp={handleEventRsvp}
        onViewEvent={handleViewEvent}
        onCreateEvent={handleCreateEvent}
        // Tools
        tools={mappedTools}
        toolsLoading={state.isLoadingTools}
        canAddTools={isLeader}
        onRunTool={handleRunTool}
        onViewTool={handleViewTool}
        onAddTool={handleAddTool}
        onBuildTool={handleBuildTool}
        onRemoveTool={handleRemoveTool}
        // Members
        members={mappedMembers}
        membersLoading={false}
        canInvite={isLeader}
        currentUserId={state.currentUserId}
        onViewProfile={handleViewProfile}
        onInvite={handleInvite}
        // Join requests
        isPrivateSpace={isPrivateSpace}
        isLeader={isLeader}
        joinRequests={joinRequests.requests}
        joinRequestsLoading={joinRequests.isLoading}
        joinRequestsError={joinRequests.error}
        onApproveRequest={joinRequests.approveRequest}
        onRejectRequest={joinRequests.rejectRequest}
        onRefreshRequests={joinRequests.refresh}
      />

      {/* All Modals (work in any mode) */}
      <SpacePageModals state={state} router={router} tabs={tabs} />

      {/* Chat Search Modal */}
      <ChatSearchModal
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        spaceId={spaceId ?? ""}
        boards={chat.boards.map(b => ({ id: b.id, name: b.name }))}
        query={chatSearch.query}
        onQueryChange={chatSearch.setQuery}
        results={chatSearch.results.map(m => ({
          id: m.id,
          content: m.content,
          createdAt: new Date(m.timestamp).toISOString(),
          author: {
            id: m.authorId,
            name: m.authorName,
            avatarUrl: m.authorAvatarUrl,
          },
          boardId: m.boardId,
          boardName: chat.boards.find(b => b.id === m.boardId)?.name,
        }))}
        totalCount={chatSearch.totalCount}
        hasMore={chatSearch.hasMore}
        isSearching={chatSearch.isSearching}
        error={chatSearch.error}
        filters={chatSearch.filters}
        onFiltersChange={chatSearch.setFilters}
        onSearch={() => chatSearch.search()}
        onLoadMore={chatSearch.loadMore}
        onClearSearch={chatSearch.clearSearch}
        onJumpToMessage={handleJumpToMessage}
      />

      {/* Error Toast */}
      {error && <ErrorToast error={error} onRetry={handlers.refresh} />}

      {/* Leader Quick Actions FAB */}
      {isLeader && (
        <LeaderQuickActions
          spaceId={spaceId ?? ""}
          onOpenInviteModal={() => setModal('inviteMember', true)}
          onOpenEventModal={() => setModal('createEvent', true)}
        />
      )}
    </>
  );
}


// ============================================================
// Page Export
// ============================================================

export default function SpaceBoardPage() {
  const params = useParams<{ spaceId: string }>();
  const spaceId = params?.spaceId;

  if (!spaceId) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Space not found</div>
      </div>
    );
  }

  return (
    <SpaceEntryWrapper spaceId={spaceId}>
      <SpaceDetailContent />
    </SpaceEntryWrapper>
  );
}

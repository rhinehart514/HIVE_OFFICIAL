'use client';

/**
 * Space Residence Page - /s/[handle]
 * SPLIT PANEL REBUILD: Jan 31, 2026
 *
 * Linear-style split panel layout:
 * - 200px sidebar (left): boards, tools, members
 * - Remaining width: chat feed + input
 *
 * Flow:
 * - Non-member → SpaceThreshold (join gate)
 * - Member → Split Panel View
 *
 * @version 4.0.0 - Split Panel Layout (Jan 2026)
 */

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { logger } from '@/lib/logger';
import { SpaceContextProvider } from '@/contexts/space';
import { usePermissions } from '@/hooks/use-permissions';
import {
  Button,
  MOTION,
} from '@hive/ui/design-system/primitives';
import { toast, type ReportContentInput } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { useSpaceResidenceState } from './hooks';
import {
  SpaceHeader,
  SpaceThreshold,
  ChatInput,
  SpaceLayout,
  SpaceSidebar,
  MainContent,
  SpaceTabs,
  MessageFeed,
  SpaceEventsTab,
  SpacePostsTab,
  type SpaceTab,
  TypingIndicator,
  type OnlineMember,
  LeaderDashboard,
} from './components';
import { LeaderCreateFAB } from './components/leader-create-fab';
import { useLeaderDashboard } from '@/hooks/use-leader-dashboard';
import { useTypingIndicator } from '@/hooks/use-presence';
import { useClaimSpace } from '@/hooks/mutations/use-claim-space';
import {
  type FeedItem,
} from '@/components/spaces';
import type { CreateEventData } from '@/components/events/create-event-modal';

// Dynamic imports — conditionally rendered components (modals, drawers, panels, overlays)
const MembersList = dynamic(() =>
  import('./components/members-list').then(m => ({ default: m.MembersList })),
  { ssr: false }
);
const SpaceSettings = dynamic(() =>
  import('./components/space-settings').then(m => ({ default: m.SpaceSettings })),
  { ssr: false }
);
const SpaceInfoDrawer = dynamic(() =>
  import('./components/space-info-drawer').then(m => ({ default: m.SpaceInfoDrawer })),
  { ssr: false }
);
const EventDetailDrawer = dynamic(() =>
  import('./components/event-detail-drawer').then(m => ({ default: m.EventDetailDrawer })),
  { ssr: false }
);
const ModerationPanel = dynamic(() =>
  import('./components/moderation-panel').then(m => ({ default: m.ModerationPanel })),
  { ssr: false }
);
const ThreadPanel = dynamic(() =>
  import('./components/feed/thread-panel').then(m => ({ default: m.ThreadPanel })),
  { ssr: false }
);
const SearchOverlay = dynamic(() =>
  import('./components/search-overlay').then(m => ({ default: m.SearchOverlay })),
  { ssr: false }
);
const CreateEventModal = dynamic(() =>
  import('@/components/events/create-event-modal').then(m => ({ default: m.CreateEventModal })),
  { ssr: false }
);
const ConfirmDialog = dynamic(() =>
  import('@hive/ui').then(m => ({ default: m.ConfirmDialog })),
  { ssr: false }
);
const ReportContentModal = dynamic(() =>
  import('@hive/ui').then(m => ({ default: m.ReportContentModal })),
  { ssr: false }
);

export default function SpacePageUnified() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  const { user } = useAuth();
  const [isJoining, setIsJoining] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);
  const [showMembersPanel, setShowMembersPanel] = React.useState(false);
  const [showDashboardPanel, setShowDashboardPanel] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = React.useState(false);
  const [showEventModal, setShowEventModal] = React.useState(false);
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [, setIsFirstEntry] = React.useState(true);
  const [showDeleteSpaceConfirm, setShowDeleteSpaceConfirm] = React.useState(false);
  const [showModerationPanel, setShowModerationPanel] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<SpaceTab>('chat');
  const [postCount, setPostCount] = React.useState<number | undefined>(undefined);
  const [isDeletingSpace, setIsDeletingSpace] = React.useState(false);
  const [reportModal, setReportModal] = React.useState<{
    messageId: string;
    authorName: string;
    content: string;
  } | null>(null);
  const [chatPrefill, setChatPrefill] = React.useState<string | null>(null);

  // Thread panel state - driven by URL param
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(null);

  // Detect first entry to this space for ArrivalTransition
  React.useEffect(() => {
    const visited = sessionStorage.getItem(`visited-${handle}`);
    setIsFirstEntry(!visited);
    sessionStorage.setItem(`visited-${handle}`, 'true');
  }, [handle]);

  const {
    space,
    isLoading,
    error,
    messages,
    isLoadingMessages,
    isLoadingMoreMessages,
    hasMoreMessages,
    loadMoreMessages,
    sendMessage,
    joinSpace,
    leaveSpace,
    rsvpToEvent,
    onlineMembers,
    upcomingEvents,
    navigateBack,
    navigateToSettings: _navigateToSettings,
    allMembers,
    isLoadingMembers,
    // Tools (HiveLab Sprint 1)
    sidebarTools,
    isLoadingTools,
    // Refresh
    refreshSpace,
    // "Since you left" feature
    lastReadAt,
    unreadCount,
    // Component interaction
    handleComponentVote,
    handleComponentRsvp,
  } = useSpaceResidenceState(handle);

  // Leader dashboard data (for leaders only)
  const {
    metrics: dashboardMetrics,
    pendingItems,
    isLoading: isDashboardLoading,
  } = useLeaderDashboard({
    spaceId: space?.id,
    enabled: space?.isLeader || false,
  });

  // Claim space mutation
  const claimSpaceMutation = useClaimSpace();

  // Permissions hook for message deletion
  const { canDeleteMessage } = usePermissions(space?.id, user?.id);

  // Space mute state
  const [isSpaceMuted, setIsSpaceMuted] = React.useState(false);

  // Load mute state from notification preferences
  React.useEffect(() => {
    if (!user || !space?.id) return;

    const loadMuteState = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/profile/notifications/preferences', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const prefs = await res.json();
          const spaceSetting = prefs?.spaceSettings?.[space.id];
          if (spaceSetting?.muted) {
            // Check if muteUntil has expired
            if (spaceSetting.muteUntil) {
              const muteEnd = new Date(spaceSetting.muteUntil);
              setIsSpaceMuted(muteEnd > new Date());
            } else {
              setIsSpaceMuted(true);
            }
          } else {
            setIsSpaceMuted(false);
          }
        }
      } catch {
        // Non-critical - default to unmuted
      }
    };

    loadMuteState();
  }, [user, space?.id]);

  const handleMuteChange = React.useCallback(async (muteUntil: string | null) => {
    if (!user || !space?.id) return;

    const newMuted = muteUntil !== null;
    setIsSpaceMuted(newMuted);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/profile/notifications/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spaceSettings: {
            [space.id]: {
              muted: newMuted,
              muteUntil: muteUntil,
            },
          },
        }),
      });

      if (!res.ok) {
        setIsSpaceMuted(!newMuted); // Revert on failure
        toast.error('Failed to update notification settings');
      } else {
        toast.success(newMuted ? 'Notifications muted' : 'Notifications unmuted');
      }
    } catch {
      setIsSpaceMuted(!newMuted);
      toast.error('Failed to update notification settings');
    }
  }, [user, space?.id]);

  // Typing indicator hook - contextId is spaceId for space-wide tracking
  const typingContextId = space?.id || '';
  const { typingUsers, setTyping } = useTypingIndicator(typingContextId);

  // Sync thread state with URL on mount and URL changes
  React.useEffect(() => {
    const threadParam = new URLSearchParams(window.location.search).get('thread');
    setActiveThreadId(threadParam);
  }, []);

  // Get parent message for thread panel
  const threadParentMessage = React.useMemo(() => {
    if (!activeThreadId) return null;
    const msg = messages.find(m => m.id === activeThreadId);
    if (!msg) return null;
    return {
      id: msg.id,
      authorId: msg.authorId,
      authorName: msg.authorName,
      authorAvatarUrl: msg.authorAvatarUrl,
      content: msg.content,
      timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : new Date(msg.timestamp).toISOString(),
      reactions: msg.reactions?.map(r => ({
        emoji: r.emoji,
        count: r.count,
        userReacted: r.hasReacted,
      })),
      replyCount: msg.replyCount,
    };
  }, [activeThreadId, messages]);

  // Close thread panel and update URL
  const handleCloseThread = React.useCallback(() => {
    setActiveThreadId(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('thread');
    const newUrl = params.toString() ? `/s/${handle}?${params.toString()}` : `/s/${handle}`;
    window.history.replaceState(null, '', newUrl);
  }, [handle]);

  // Open thread panel and update URL
  const handleOpenThread = React.useCallback((messageId: string) => {
    setActiveThreadId(messageId);
    const params = new URLSearchParams(window.location.search);
    params.set('thread', messageId);
    window.history.replaceState(null, '', `/s/${handle}?${params.toString()}`);
  }, [handle]);

  // ============================================
  // ALL HOOKS MUST BE CALLED BEFORE ANY RETURNS
  // (React hooks must be called in the same order every render)
  // ============================================

  // Removed: Board transformation (multi-board deprecated)


  // Transform online members for preview (called unconditionally)
  const onlineMembersPreview: OnlineMember[] = React.useMemo(() => {
    return (onlineMembers || []).slice(0, 5).map((m) => ({
      id: m.id,
      name: m.name || 'Unknown',
      avatarUrl: m.avatar,
    }));
  }, [onlineMembers]);

  // Removed: Keyboard navigation for board switching (multi-board deprecated)

  // Transform messages to Message type (called unconditionally)
  const feedMessages = React.useMemo(() => {
    return (messages || []).map((msg) => ({
      id: msg.id,
      authorId: msg.authorId,
      authorName: msg.authorName,
      authorAvatarUrl: msg.authorAvatarUrl,
      content: msg.content,
      timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : new Date(msg.timestamp).toISOString(),
      reactions: msg.reactions?.map((r) => ({
        emoji: r.emoji,
        count: r.count,
        userReacted: r.hasReacted,
      })),
      replyCount: msg.replyCount,
      attachments: msg.attachments,
      isEdited: msg.isEdited,
      editedAt: msg.editedAt,
    }));
  }, [messages]);

  // Transform messages to unified feed items (for legacy compatibility)
  const _feedItems: FeedItem[] = React.useMemo(() => {
    // Combine messages, events, and tools into unified feed
    const items: FeedItem[] = [];

    // Add messages
    messages.forEach((msg) => {
      items.push({
        id: msg.id,
        type: 'message',
        timestamp: new Date(msg.timestamp).toISOString(),
        authorId: msg.authorId,
        authorName: msg.authorName,
        authorAvatarUrl: msg.authorAvatarUrl,
        content: msg.content,
        reactions: msg.reactions?.map(r => ({
          emoji: r.emoji,
          count: r.count,
          userReacted: r.hasReacted,
        })),
        threadCount: msg.replyCount,
      });
    });

    // Add events
    upcomingEvents.forEach((event) => {
      // Extended event type with userRsvp from API
      const extendedEvent = event as typeof event & {
        userRsvp?: 'going' | 'maybe' | 'not_going' | null;
        description?: string;
        startTime?: string;
        isOnline?: boolean;
        location?: string;
      };
      items.push({
        id: event.id,
        type: 'event',
        timestamp: extendedEvent.startTime || event.time || new Date().toISOString(),
        eventId: event.id,
        title: event.title,
        description: extendedEvent.description || event.title,
        startDate: extendedEvent.startTime || event.time || new Date().toISOString(),
        location: extendedEvent.location,
        isOnline: extendedEvent.isOnline,
        rsvpCount: event.goingCount || 0,
        userRsvp: extendedEvent.userRsvp || null, // P1.4: Use userRsvp from API
      });
    });

    // Sort by timestamp (most recent first)
    return items.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [messages, upcomingEvents]);

  // Handle join with inline error display
  const handleJoin = async () => {
    setIsJoining(true);
    setJoinError(null);
    try {
      await joinSpace();
      toast.success('Welcome to the space!');
    } catch (error) {
      logger.error('Join failed', { component: 'SpacePage' }, error instanceof Error ? error : undefined);
      // Display error inline on the threshold instead of just a toast
      const errorMessage = error instanceof Error ? error.message : 'Failed to join space';
      setJoinError(errorMessage);
      // Also show toast for accessibility
      toast.error(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  // Clear join error
  const handleClearJoinError = () => {
    setJoinError(null);
  };

  // Handle space claim
  const handleClaimSpace = () => {
    if (!space?.id) return;
    claimSpaceMutation.mutate({
      spaceId: space.id,
      role: 'leader', // Default role for claiming
      proofType: 'email', // Default proof type (user's verified campus email)
    });
  };

  // Removed: Board creation and reorder handlers (multi-board deprecated)

  // Handle event creation from space
  const handleCreateEvent = async (eventData: CreateEventData) => {
    if (!space?.id) return;

    try {
      const response = await fetch(`/api/spaces/${space.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          startDate: eventData.datetime.start,
          endDate: eventData.datetime.end,
          location: eventData.location.name,
          virtualLink: eventData.location.virtualLink,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      await response.json();
      setShowEventModal(false);
      toast.success('Event created successfully');

      // The event will appear in the feed after next data refresh
    } catch (error) {
      logger.error('Event creation failed', { component: 'SpacePage' }, error instanceof Error ? error : undefined);
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: string) => {
    if (!space?.id) return;

    try {
      const response = await fetch(`/api/spaces/${space.id}/chat/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to delete message');
      }

      // Refresh to update the feed
      await refreshSpace();
      toast.success('Message deleted');
    } catch (error) {
      logger.error('Failed to delete message', { component: 'SpacePage' }, error instanceof Error ? error : undefined);
      toast.error(error instanceof Error ? error.message : 'Failed to delete message');
    }
  };

  // Handle message editing
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!space?.id) return;

    try {
      const response = await fetch(`/api/spaces/${space.id}/chat/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to edit message');
      }

      // Refresh to update the feed
      await refreshSpace();
      toast.success('Message updated');
    } catch (error) {
      logger.error('Failed to edit message', { component: 'SpacePage' }, error instanceof Error ? error : undefined);
      toast.error(error instanceof Error ? error.message : 'Failed to edit message');
    }
  };

  // Handle message reporting
  const handleReportMessage = (messageId: string, authorName: string, content: string) => {
    setReportModal({ messageId, authorName, content });
  };

  // Submit report to API
  const handleSubmitReport = async (data: ReportContentInput) => {
    const response = await fetch('/api/content/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        spaceId: space?.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to submit report');
    }

    toast.success('Report submitted');
  };

  // Loading state
  if (isLoading) {
    return <SpacePageSkeleton />;
  }

  // Error state
  if (error || !space) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
      >
        <div className="max-w-md mx-auto text-center p-8">
          <h2
            className="text-heading-sm font-semibold text-white mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Space Not Found
          </h2>
          <p className="text-white/50 mb-6">
            The space @{handle} could not be found or is no longer available.
          </p>
          <Button variant="default" onClick={navigateBack}>
            Browse Spaces
          </Button>
        </div>
      </motion.div>
    );
  }

  // Non-member: Show simplified threshold (same for all activation states)
  if (!space.isMember) {
    return (
      <AnimatePresence mode="wait">
        <SpaceThreshold
          key="threshold"
          space={{
            id: space.id,
            handle: space.handle,
            name: space.name,
            description: space.description,
            avatarUrl: space.avatarUrl,
            memberCount: space.memberCount,
            onlineCount: space.onlineCount,
            isClaimed: space.isClaimed,
          }}
          onJoin={handleJoin}
          onClaim={!space.isClaimed ? handleClaimSpace : undefined}
          isJoining={isJoining}
          isClaiming={claimSpaceMutation.isPending}
          joinError={joinError}
          onClearError={handleClearJoinError}
        />
      </AnimatePresence>
    );
  }

  // Member: Show Split Panel layout
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="split-panel"
        className="h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
      >
        <div className="h-screen flex flex-col">
          {/* Space Header */}
          <div className="border-b border-white/[0.06] px-4 h-14 flex items-center flex-shrink-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 mr-2 text-white/50 hover:text-white transition-colors"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <SpaceHeader
                space={{
                  id: space.id,
                  handle: space.handle,
                  name: space.name,
                  avatarUrl: space.avatarUrl,
                  onlineCount: space.onlineCount,
                  memberCount: space.memberCount,
                  isVerified: space.isVerified,
                  socialLinks: space.socialLinks,
                  recentMessageCount: messages.length,
                  isClaimed: space.isClaimed,
                }}
                isLeader={space.isLeader}
                isMember={space.isMember}
                onMembersClick={() => setShowMembersPanel(true)}
                onSettingsClick={() => setShowSettingsModal(true)}
                onSpaceInfoClick={() => setShowInfoDrawer(true)}
                onBuildToolClick={() => {
                  const params = new URLSearchParams({
                    spaceId: space.id,
                    spaceName: space.name,
                  });
                  router.push(`/lab/new?${params.toString()}`);
                }}
                onCreateEventClick={() => setShowEventModal(true)}
                onModerationClick={() => setShowModerationPanel(true)}
                onClaimClick={handleClaimSpace}
                onCreatePoll={() => setChatPrefill('/poll ')}
                onCreateRsvp={() => setChatPrefill('/rsvp ')}
                onCreateSignup={() => setChatPrefill('/signup ')}
                onCreateCountdown={() => setChatPrefill('/countdown ')}
                onCreateWithAI={() => {
                  const params = new URLSearchParams({
                    spaceId: space.id,
                    spaceName: space.name,
                  });
                  router.push(`/lab/new?${params.toString()}`);
                }}
                canModerate={space.isLeader || space.userRole === 'moderator' || space.userRole === 'admin'}
                isMuted={isSpaceMuted}
                onMuteChange={handleMuteChange}
                className="w-full border-b-0"
              />
          </div>

          <SpaceTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            unreadCount={unreadCount}
            eventCount={upcomingEvents.length}
            postCount={postCount}
          />

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <SpaceLayout
              mobileSidebarOpen={mobileSidebarOpen}
              onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              header={<div />}
              sidebar={
                <SpaceSidebar
                  tools={{
                    tools: sidebarTools,
                    spaceId: space.id,
                    isLoading: isLoadingTools,
                    isLeader: space.isLeader,
                    onToolClick: () => {},
                    onToolRun: () => {},
                    onViewFull: () => {},
                    onAddTool: () => {},
                  }}
                  events={{
                    events: upcomingEvents.map(event => {
                      const extendedEvent = event as typeof event & {
                        location?: string;
                        locationName?: string;
                        isOnline?: boolean;
                        locationType?: string;
                      };
                      return {
                        id: event.id,
                        title: event.title,
                        startDate: event.time || new Date().toISOString(),
                        location: extendedEvent.location || extendedEvent.locationName,
                        isOnline: extendedEvent.isOnline || extendedEvent.locationType === 'virtual',
                        rsvpCount: event.goingCount || 0,
                      };
                    }),
                    maxEvents: 3,
                    onClick: (event) => setSelectedEventId(event.id),
                  }}
                  members={{
                    onlineCount: space.onlineCount,
                    totalCount: space.memberCount,
                    onlineMembers: onlineMembersPreview,
                    onClick: () => setShowMembersPanel(true),
                  }}
                />
              }
              input={activeTab === 'chat' ? (
                <div>
                  <TypingIndicator typingUsers={typingUsers} />
                  <ChatInput
                    spaceId={space.id}
                    onSend={sendMessage}
                    placeholder={`Message ${space.name}`}
                    onTypingChange={setTyping}
                    prefill={chatPrefill}
                    onPrefillConsumed={() => setChatPrefill(null)}
                  />
                </div>
              ) : undefined}
            >
              <MainContent
                boardName={
                  activeTab === 'chat'
                    ? space.name
                    : activeTab === 'events'
                      ? 'Events'
                      : 'Posts'
                }
                contentKey={activeTab}
                isLoading={activeTab === 'chat' ? isLoadingMessages : false}
              >
                {activeTab === 'chat' ? (
                  feedMessages.length === 0 && !isLoadingMessages ? (
                    <div className="flex-1 flex items-center justify-center text-hive-text-tertiary">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <MessageFeed
                      messages={feedMessages}
                      currentUserId={user?.id}
                      lastReadAt={lastReadAt ? new Date(lastReadAt) : null}
                      unreadCount={unreadCount}
                      isLoading={isLoadingMessages}
                      isLoadingMore={isLoadingMoreMessages}
                      hasMore={hasMoreMessages}
                      onLoadMore={loadMoreMessages}
                      onReact={async (messageId, emoji) => {
                        if (!space?.id) return;
                        try {
                          await fetch(`/api/spaces/${space.id}/chat/${messageId}/react`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ emoji }),
                          });
                        } catch (error) {
                          logger.error('React failed', { component: 'SpacePage' }, error instanceof Error ? error : undefined);
                        }
                      }}
                      onReply={(messageId) => handleOpenThread(messageId)}
                      onDelete={handleDeleteMessage}
                      onEdit={handleEditMessage}
                      canDeleteMessage={(_msgId, authorId) => canDeleteMessage(authorId)}
                      onReport={handleReportMessage}
                      onComponentVote={handleComponentVote}
                      onComponentRsvp={handleComponentRsvp}
                    />
                  )
                ) : activeTab === 'events' ? (
                  <SpaceContextProvider spaceId={space.id}>
                    <SpaceEventsTab
                      spaceId={space.id}
                      isLeader={space.isLeader}
                      onCreateEvent={() => setShowEventModal(true)}
                      onEventClick={(eventId) => setSelectedEventId(eventId)}
                    />
                  </SpaceContextProvider>
                ) : (
                  <SpacePostsTab
                    spaceId={space.id}
                    currentUserId={user?.id}
                  />
                )}
              </MainContent>
            </SpaceLayout>
          </div>
        </div>

        {/* Event Creation Modal */}
        <CreateEventModal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          onCreateEvent={handleCreateEvent}
          spaceId={space.id}
          spaceName={space.name}
        />

        {/* Event Detail Drawer */}
        <EventDetailDrawer
          eventId={selectedEventId}
          spaceId={space.id}
          isOpen={!!selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />

        {/* Members Slide-Over Panel */}
        <AnimatePresence>
          {showMembersPanel && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOTION.duration.fast }}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 "
                onClick={() => setShowMembersPanel(false)}
              />

              {/* Panel */}
              <motion.div
                className="relative h-full w-full max-w-md bg-[var(--bg-ground)] border-l border-white/[0.06]"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                    <h2 className="text-lg font-semibold text-white">
                      Members
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMembersPanel(false)}
                    >
                      Close
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <MembersList
                      members={allMembers}
                      isLoading={isLoadingMembers}
                      currentUserId={user?.id}
                      onMemberClick={(memberId) => {
                        setShowMembersPanel(false);
                        router.push(`/profile/${memberId}`);
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leader Dashboard Panel */}
        <AnimatePresence>
          {showDashboardPanel && space.isLeader && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOTION.duration.quick }}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 "
                onClick={() => setShowDashboardPanel(false)}
              />

              {/* Panel */}
              <motion.div
                className="relative h-full w-full max-w-md bg-[var(--bg-ground)] border-l border-white/[0.06] overflow-y-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: MOTION.duration.quick, ease: MOTION.ease.premium }}
              >
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[var(--bg-ground)]">
                  <h2 className="text-lg font-semibold text-white">
                    Dashboard
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDashboardPanel(false)}
                  >
                    Close
                  </Button>
                </div>

                <LeaderDashboard
                  spaceId={space.id}
                  metrics={dashboardMetrics || undefined}
                  pendingItems={pendingItems}
                  isLoading={isDashboardLoading}
                  onCreateEvent={() => {
                    setShowDashboardPanel(false);
                    setShowEventModal(true);
                  }}
                  onAddTool={() => {
                    setShowDashboardPanel(false);
                    const params = new URLSearchParams({
                      spaceId: space.id,
                      spaceName: space.name,
                    });
                    router.push(`/lab/new?${params.toString()}`);
                  }}
                  onOpenSettings={() => {
                    setShowDashboardPanel(false);
                    setShowSettingsModal(true);
                  }}
                  onViewPending={(item) => {
                    setShowDashboardPanel(false);
                    toast.info(`Opening ${item.type}: ${item.title}`);
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Space Info Drawer (P2.3) */}
        <SpaceInfoDrawer
          isOpen={showInfoDrawer}
          onClose={() => setShowInfoDrawer(false)}
          space={{
            id: space.id,
            handle: space.handle,
            name: space.name,
            description: space.description,
            avatarUrl: space.avatarUrl,
            memberCount: space.memberCount,
            isVerified: space.isVerified,
            email: space.email,
            contactName: space.contactName,
            orgTypeName: space.orgTypeName,
            foundedDate: space.foundedDate,
            source: space.source,
            sourceUrl: space.sourceUrl,
            socialLinks: space.socialLinks,
          }}
        />

        {/* Settings Modal - Available to members (leave) and leaders (full settings) */}
        <AnimatePresence>
          {showSettingsModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOTION.duration.fast }}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 "
                onClick={() => setShowSettingsModal(false)}
              />

              {/* Modal */}
              <motion.div
                className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--bg-ground)] border border-white/[0.06] rounded-lg overflow-hidden"
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                  <h2 className="text-lg font-semibold text-white">
                    Space Settings
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettingsModal(false)}
                  >
                    Close
                  </Button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                  <SpaceSettings
                    space={{
                      id: space.id,
                      name: space.name,
                      handle: space.handle,
                      description: space.description,
                      avatarUrl: space.avatarUrl,
                      isPublic: true,
                      // CampusLabs metadata (P2.4)
                      email: space.email,
                      contactName: space.contactName,
                      socialLinks: space.socialLinks,
                    }}
                    boards={[]} // Removed: Multi-board deprecated
                    isLeader={space.isLeader}
                    currentUserId={user?.id}
                    currentUserRole={space.userRole && space.userRole !== 'guest' ? space.userRole : (space.isLeader ? 'admin' : 'member')}
                    onUpdate={space.isLeader ? async (updates) => {
                      try {
                        const response = await fetch(`/api/spaces/${space.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updates),
                        });
                        if (!response.ok) throw new Error('Failed to update space');
                        setShowSettingsModal(false);
                        // Refresh space data
                        await refreshSpace();
                        toast.success('Space updated');
                      } catch (error) {
                        logger.error('Failed to update space', { component: 'SpacePage' }, error instanceof Error ? error : undefined);
                        toast.error('Failed to update space');
                      }
                    } : undefined}
                    onDelete={space.isLeader ? async () => {
                      // Open confirmation dialog instead of window.confirm
                      setShowDeleteSpaceConfirm(true);
                    } : undefined}
                    onTransferOwnership={space.userRole === 'owner' ? async (newOwnerId) => {
                      try {
                        const response = await fetch(`/api/spaces/${space.id}/transfer-ownership`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ newOwnerId }),
                        });
                        if (!response.ok) {
                          const data = await response.json().catch(() => ({}));
                          throw new Error(data.error?.message || 'Failed to transfer ownership');
                        }
                        const data = await response.json();
                        setShowSettingsModal(false);
                        await refreshSpace();
                        toast.success(
                          'Ownership transferred',
                          `${data.data?.transfer?.newOwnerName || 'New owner'} is now the owner. You are now an admin.`
                        );
                      } catch (error) {
                        logger.error('Failed to transfer ownership', { component: 'SpacePage' }, error instanceof Error ? error : undefined);
                        toast.error('Transfer failed', error instanceof Error ? error.message : 'Please try again');
                        throw error;
                      }
                    } : undefined}
                    onLeave={async () => {
                      try {
                        await leaveSpace();
                        setShowSettingsModal(false);
                        router.push('/spaces');
                      } catch (error) {
                        logger.error('Failed to leave space', { component: 'SpacePage' }, error instanceof Error ? error : undefined);
                      }
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Space Confirmation */}
        <ConfirmDialog
          open={showDeleteSpaceConfirm}
          onOpenChange={setShowDeleteSpaceConfirm}
          title="Delete Space"
          description="This cannot be undone. All messages, boards, and tools will be permanently deleted."
          variant="danger"
          confirmText="Delete"
          cancelText="Cancel"
          loading={isDeletingSpace}
          onConfirm={async () => {
            setIsDeletingSpace(true);
            try {
              const response = await fetch(`/api/spaces/${space.id}`, {
                method: 'DELETE',
              });
              if (!response.ok) throw new Error('Failed to delete space');
              setShowDeleteSpaceConfirm(false);
              setShowSettingsModal(false);
              toast.success('Space deleted');
              router.push('/spaces');
            } catch (error) {
              logger.error('Failed to delete space', { component: 'SpacePage' }, error instanceof Error ? error : undefined);
              toast.error('Failed to delete space');
            } finally {
              setIsDeletingSpace(false);
            }
          }}
        />

        {/* Removed: Delete Board Confirmation (multi-board deprecated) */}

        {/* Moderation Panel */}
        <ModerationPanel
          isOpen={showModerationPanel}
          onClose={() => setShowModerationPanel(false)}
          spaceId={space.id}
          spaceName={space.name}
        />

        {/* Search Overlay (Cmd+K) */}
        <SearchOverlay
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          spaceId={space.id}
          spaceHandle={space.handle}
        />

        {/* Thread Reply Panel */}
        <ThreadPanel
          parentMessage={threadParentMessage}
          isOpen={!!activeThreadId && !!threadParentMessage}
          onClose={handleCloseThread}
          spaceId={space.id}
          currentUserId={user?.id || ''}
        />

        {/* Report Content Modal */}
        <ReportContentModal
          open={!!reportModal}
          onOpenChange={(open) => !open && setReportModal(null)}
          contentId={reportModal?.messageId || ''}
          contentType="message"
          spaceId={space.id}
          authorName={reportModal?.authorName}
          contentPreview={reportModal?.content}
          onSubmit={handleSubmitReport}
        />

        {/* Leader Create FAB */}
        {space.isLeader && (
          <LeaderCreateFAB
            context="feed"
            onCreateEvent={() => setShowEventModal(true)}
            onAddTool={() => {
              const params = new URLSearchParams({
                spaceId: space.id,
                spaceName: space.name,
              });
              router.push(`/lab/new?${params.toString()}`);
            }}
            onCreateAnnouncement={() => setShowDashboardPanel(true)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Loading skeleton matching SpaceLayout: header top, sidebar LEFT (200px), content RIGHT (fluid)
function SpacePageSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header skeleton */}
      <motion.div
        className="h-14 border-b border-white/[0.06] px-4 flex items-center gap-3 flex-shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
      >
        <motion.div
          className="h-8 w-8 rounded-lg bg-white/[0.06]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: MOTION.ease.smooth }}
        />
        <div className="space-y-1.5">
          <motion.div
            className="h-4 w-28 rounded bg-white/[0.06]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1, ease: MOTION.ease.smooth }}
          />
          <motion.div
            className="h-3 w-20 rounded bg-white/[0.06]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: MOTION.ease.smooth }}
          />
        </div>
      </motion.div>

      {/* Body: sidebar LEFT + content RIGHT */}
      <motion.div
        className="flex flex-1 min-h-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: MOTION.duration.base, delay: 0.1, ease: MOTION.ease.premium }}
      >
        {/* Sidebar skeleton (left, 200px) */}
        <div className="w-[200px] border-r border-white/[0.06] p-3 space-y-2 flex-shrink-0">
          <motion.div
            className="h-3 w-16 rounded bg-white/[0.06] mb-3"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: MOTION.ease.smooth }}
          />
          {[1, 2, 3].map((i) => (
            <motion.div
              key={`board-${i}`}
              className="h-8 rounded-lg bg-white/[0.06]"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.2 + i * 0.1,
                ease: MOTION.ease.smooth,
              }}
            />
          ))}
          <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-2">
            <motion.div
              className="h-3 w-20 rounded bg-white/[0.06]"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6, ease: MOTION.ease.smooth }}
            />
            <div className="flex gap-1.5">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={`avatar-${i}`}
                  className="h-6 w-6 rounded-full bg-white/[0.06]"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.7 + i * 0.05,
                    ease: MOTION.ease.smooth,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content skeleton (right, fluid) */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-4 space-y-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={`msg-${i}`}
                className="flex gap-3"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: MOTION.ease.smooth,
                }}
              >
                <div className="h-8 w-8 rounded-full bg-white/[0.06] flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-24 rounded bg-white/[0.06]" />
                  <div className="h-4 rounded bg-white/[0.06]" style={{ width: `${60 + (i * 7) % 30}%` }} />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="p-3 border-t border-white/[0.06]">
            <motion.div
              className="h-10 rounded-lg bg-white/[0.06]"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: MOTION.ease.smooth }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

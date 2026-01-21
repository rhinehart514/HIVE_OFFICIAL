'use client';

/**
 * Space Residence Page - /s/[handle]
 * UNIFIED VIEW REDESIGN: Jan 21, 2026
 *
 * Homebase-first architecture with unified activity feed.
 * No mode switching - everything lives in one view.
 *
 * Flow:
 * - Non-member → SpaceThreshold (join gate)
 * - Member → Unified View (boards sidebar + activity feed)
 *
 * @version 2.0.0 - Homebase Redesign
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Text, Button } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { useSpaceResidenceState } from './hooks';
import {
  SpaceHeader,
  SpaceThreshold,
  ChatInput,
  BoardCreationModal,
  MembersList,
  SpaceSettings,
  type Member,
} from './components';
import {
  BoardsSidebar,
  UnifiedActivityFeed,
  type Board,
  type FeedItem,
} from '@/components/spaces';

// Premium easing
const EASE = [0.22, 1, 0.36, 1] as const;

const DURATION = {
  fast: 0.15,
  quick: 0.25,
  smooth: 0.4,
  gentle: 0.6,
} as const;

export default function SpacePageUnified() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  const { user } = useAuth();
  const [isJoining, setIsJoining] = React.useState(false);
  const [showBoardModal, setShowBoardModal] = React.useState(false);
  const [showMembersPanel, setShowMembersPanel] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);

  const {
    space,
    isLoading,
    error,
    boards,
    activeBoard,
    setActiveBoard,
    canAddBoard,
    messages,
    isLoadingMessages,
    sendMessage,
    joinSpace,
    onlineMembers,
    upcomingEvents,
    navigateBack,
    navigateToSettings,
    allMembers,
    isLoadingMembers,
  } = useSpaceResidenceState(handle);

  // Transform boards for sidebar
  const sidebarBoards: Board[] = React.useMemo(() => {
    return boards.map((b) => ({
      id: b.id,
      name: b.name,
      unreadCount: 0, // TODO: Get from membership data
      isPinned: b.name === 'general',
    }));
  }, [boards]);

  // Transform messages to unified feed items
  const feedItems: FeedItem[] = React.useMemo(() => {
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
      items.push({
        id: event.id,
        type: 'event',
        timestamp: event.time || new Date().toISOString(),
        eventId: event.id,
        title: event.title,
        description: event.title, // Use title as description fallback
        startDate: event.time || new Date().toISOString(),
        rsvpCount: event.goingCount || 0,
        userRsvp: null, // TODO: Get from event data
      });
    });

    // Sort by timestamp (most recent first)
    return items.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [messages, upcomingEvents]);

  // Handle join
  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await joinSpace();
    } finally {
      setIsJoining(false);
    }
  };

  // Handle board creation
  const handleCreateBoard = () => {
    setShowBoardModal(true);
  };

  const handleBoardCreate = async (name: string, description?: string) => {
    if (!space?.id) return;

    // Create board via API
    const response = await fetch(`/api/spaces/${space.id}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      throw new Error('Failed to create board');
    }

    const newBoard = await response.json();

    // Refresh boards list (in a real app, this would be handled by the hook)
    // For now, just close the modal - the hook will refetch on next load
    setShowBoardModal(false);

    // Switch to the new board
    setActiveBoard(newBoard.id);
  };

  // Handle board reorder
  const handleReorderBoards = (boardIds: string[]) => {
    // TODO: Implement board reordering
    console.log('Reorder boards', boardIds);
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
        transition={{ duration: DURATION.gentle, ease: EASE }}
      >
        <div className="max-w-md mx-auto text-center p-8">
          <h2
            className="text-[28px] font-semibold text-white mb-4"
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

  // Non-member: Show threshold
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
            isVerified: space.isVerified,
          }}
          upcomingEvents={upcomingEvents}
          recentActivity={
            messages.length > 0
              ? {
                  messageCount: messages.length,
                  lastActiveLabel: 'recently',
                }
              : undefined
          }
          onJoin={handleJoin}
          isJoining={isJoining}
        />
      </AnimatePresence>
    );
  }

  // Member: Show unified view
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="unified"
        className="min-h-screen flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DURATION.smooth, ease: EASE }}
      >
        {/* Space Header */}
        <div className="px-6">
          <SpaceHeader
            space={{
              id: space.id,
              handle: space.handle,
              name: space.name,
              avatarUrl: space.avatarUrl,
              onlineCount: space.onlineCount,
              memberCount: space.memberCount,
              isVerified: space.isVerified,
            }}
            isLeader={space.isLeader}
            isMember={space.isMember}
            onMembersClick={() => setShowMembersPanel(true)}
            onSettingsClick={() => setShowSettingsModal(true)}
            onBuildToolClick={() => {
              // Redirect to HiveLab with space context
              const hiveLabUrl = process.env.NEXT_PUBLIC_HIVELAB_URL;

              if (hiveLabUrl) {
                // Production with configured HiveLab URL
                const params = new URLSearchParams({
                  context: 'space',
                  spaceId: space.id,
                  spaceName: space.name,
                });
                window.location.href = `${hiveLabUrl}/select-context?${params.toString()}`;
              } else {
                // Development - open in new tab
                const params = new URLSearchParams({
                  context: 'space',
                  spaceId: space.id,
                  spaceName: space.name,
                });
                window.open(`http://localhost:3002/select-context?${params.toString()}`, '_blank');
              }
            }}
          />
        </div>

        {/* Main Content - Always shows boards + feed */}
        <div className="flex-1 flex">
          {/* Boards Sidebar - Always visible */}
          <BoardsSidebar
            boards={sidebarBoards}
            activeBoard={activeBoard || boards[0]?.id || 'general'}
            onBoardChange={(boardId) => setActiveBoard(boardId)}
            onCreateBoard={space.isLeader ? handleCreateBoard : undefined}
            onReorderBoards={space.isLeader ? handleReorderBoards : undefined}
          />

          {/* Content Area - Always shows unified feed */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Feed */}
            <div className="flex-1 overflow-y-auto">
              <UnifiedActivityFeed
                items={feedItems}
                loading={isLoadingMessages}
                currentUserId={user?.id}
                onEventRsvp={(eventId, status) => {
                  console.log('RSVP', eventId, status);
                }}
                onRunTool={(toolId, placementId) => {
                  console.log('Run tool', toolId, placementId);
                }}
                onReact={(messageId, emoji) => {
                  console.log('React', messageId, emoji);
                }}
                onOpenThread={(messageId) => {
                  console.log('Open thread', messageId);
                }}
              />
            </div>

            {/* Chat Input - Fixed at bottom */}
            <div className="border-t border-white/[0.06] bg-[#0A0A09]">
              <ChatInput
                onSend={sendMessage}
                placeholder={`Message #${boards.find(b => b.id === activeBoard)?.name || 'general'}`}
              />
            </div>
          </div>
        </div>

        {/* Board Creation Modal */}
        <AnimatePresence>
          {showBoardModal && (
            <BoardCreationModal
              isOpen={showBoardModal}
              onClose={() => setShowBoardModal(false)}
              onCreate={handleBoardCreate}
              spaceHandle={space.handle}
            />
          )}
        </AnimatePresence>

        {/* Members Slide-Over Panel */}
        <AnimatePresence>
          {showMembersPanel && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast }}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowMembersPanel(false)}
              />

              {/* Panel */}
              <motion.div
                className="relative h-full w-full max-w-md bg-[#0A0A09] border-l border-white/[0.06] shadow-2xl"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: DURATION.smooth, ease: EASE }}
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
                        console.log('View member profile', memberId);
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettingsModal && space.isLeader && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast }}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowSettingsModal(false)}
              />

              {/* Modal */}
              <motion.div
                className="relative w-full max-w-4xl max-h-[90vh] bg-[#0A0A09] border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden"
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ duration: DURATION.smooth, ease: EASE }}
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
                      isPublic: true, // TODO: Get from space data
                    }}
                    onUpdate={async (updates) => {
                      console.log('Update space', updates);
                      // TODO: Implement space update API call
                      setShowSettingsModal(false);
                    }}
                    onDelete={async () => {
                      console.log('Delete space');
                      // TODO: Implement space deletion
                      setShowSettingsModal(false);
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

// Loading skeleton
function SpacePageSkeleton() {
  return (
    <div className="min-h-screen space-y-4 py-6">
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.smooth, ease: EASE }}
      >
        <div className="h-10 w-10 rounded-lg bg-white/[0.06] animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
        </div>
      </motion.div>
    </div>
  );
}

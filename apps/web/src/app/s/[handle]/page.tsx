'use client';

/**
 * Space Residence Page - /s/[handle]
 * REDESIGNED: Jan 21, 2026
 *
 * Premium Space experience with:
 * - Threshold (welcome gate) for non-members
 * - Clash Display for Space name
 * - About-page motion patterns
 * - Chat-first for members
 *
 * Flow:
 * - Non-member → SpaceThreshold (join gate with preview)
 * - Member → SpaceResidence (chat-first experience)
 */

import * as React from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown, ChevronUp, Users, Calendar, Pin, MessageCircle, Link as LinkIcon, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Avatar, AvatarImage, AvatarFallback, getInitials, Button, BoardTabs } from '@hive/ui';
import { useSpaceResidenceState } from './hooks';
import { ChatMessages, ChatInput, SpaceHeader, SpaceThreshold } from './components';

// Premium easing (from about page)
const EASE = [0.22, 1, 0.36, 1] as const;

// Duration scale
const DURATION = {
  fast: 0.15,
  quick: 0.25,
  smooth: 0.4,
  gentle: 0.6,
  slow: 0.8,
} as const;

export default function SpacePage() {
  const params = useParams();
  const handle = params.handle as string;
  const [isJoining, setIsJoining] = React.useState(false);

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
    pinnedItems,
    panelCollapsed,
    setPanelCollapsed,
    rsvpToEvent,
    navigateBack,
    navigateToSettings,
  } = useSpaceResidenceState(handle);

  // Handle join action
  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await joinSpace();
    } finally {
      setIsJoining(false);
    }
  };

  // Loading state - premium skeleton
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

  // Non-member: Show threshold (welcome gate)
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

  // Member: Show residence view (chat-first)
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="residence"
        className="min-h-screen flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DURATION.smooth, ease: EASE }}
      >
        {/* Space Header - Premium with Clash Display */}
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
          onSettingsClick={navigateToSettings}
        />

        {/* Board Tabs - with entrance animation */}
        <motion.div
          className="py-2 border-b border-white/[0.06]"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.smooth, delay: 0.1, ease: EASE }}
        >
          <BoardTabs
            boards={boards}
            activeBoard={activeBoard}
            onBoardChange={setActiveBoard}
            canAddBoard={canAddBoard}
          />
        </motion.div>

        {/* Main Content: Chat + Panel */}
        <div className="flex-1 flex gap-4 py-4">
          {/* Chat Area */}
          <motion.div
            className="flex-1 flex flex-col min-w-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.gentle, delay: 0.15, ease: EASE }}
          >
            <div className="flex-1 overflow-y-auto">
              <ChatMessages messages={messages} isLoading={isLoadingMessages} />
            </div>

            {/* Input Area */}
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.smooth, delay: 0.25, ease: EASE }}
            >
              <ChatInput onSend={sendMessage} placeholder={`Message #${activeBoard}`} />
            </motion.div>
          </motion.div>

          {/* Context Panel (collapsible on desktop) */}
          <motion.div
            className={cn(
              'hidden lg:flex flex-col w-72 flex-shrink-0',
              'border-l border-white/[0.06] pl-4',
              panelCollapsed && 'lg:hidden'
            )}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: DURATION.gentle, delay: 0.2, ease: EASE }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-4">
              <Text size="xs" tone="muted" className="uppercase tracking-wider">
                Context
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPanelCollapsed(!panelCollapsed)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* NOW - Online Members */}
            <CollapsibleSection title="Now" count={onlineMembers.length} defaultOpen>
              {onlineMembers.length === 0 ? (
                <Text size="xs" tone="muted">
                  No one online right now
                </Text>
              ) : (
                <div className="space-y-2">
                  {onlineMembers.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Avatar size="xs">
                        {member.avatar && <AvatarImage src={member.avatar} />}
                        <AvatarFallback>
                          {getInitials(member.name || member.handle)}
                        </AvatarFallback>
                      </Avatar>
                      <Text size="sm" tone="muted">
                        @{member.handle}
                      </Text>
                    </div>
                  ))}
                  {onlineMembers.length > 5 && (
                    <Text size="xs" tone="muted">
                      +{onlineMembers.length - 5} more
                    </Text>
                  )}
                </div>
              )}
            </CollapsibleSection>

            {/* NEXT UP - Events */}
            <CollapsibleSection
              title="Next Up"
              count={upcomingEvents.length}
              defaultOpen
              icon={<Calendar className="h-3 w-3" />}
            >
              {upcomingEvents.length === 0 ? (
                <Text size="xs" tone="muted">
                  No upcoming events
                </Text>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="space-y-1">
                      <Text size="sm" weight="medium">
                        {event.title}
                      </Text>
                      <div className="flex items-center justify-between">
                        <Text size="xs" tone="muted">
                          {event.time}
                        </Text>
                        <div className="flex items-center gap-2">
                          <Text size="xs" tone="muted">
                            {event.goingCount} going
                          </Text>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => rsvpToEvent(event.id)}
                          >
                            RSVP
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* PINNED */}
            <CollapsibleSection
              title="Pinned"
              count={pinnedItems.length}
              defaultOpen
              icon={<Pin className="h-3 w-3" />}
            >
              {pinnedItems.length === 0 ? (
                <Text size="xs" tone="muted">
                  No pinned items
                </Text>
              ) : (
                <div className="space-y-2">
                  {pinnedItems.map((item) => (
                    <button
                      key={item.id}
                      className="flex items-center gap-2 w-full text-left hover:bg-white/[0.04] rounded p-1 -m-1"
                    >
                      {item.type === 'message' && (
                        <MessageCircle className="h-3 w-3 text-white/40" />
                      )}
                      {item.type === 'link' && (
                        <LinkIcon className="h-3 w-3 text-white/40" />
                      )}
                      {item.type === 'file' && (
                        <FileText className="h-3 w-3 text-white/40" />
                      )}
                      <Text size="sm" tone="muted" className="truncate">
                        {item.title}
                      </Text>
                    </button>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* Keyboard hint */}
            <div className="mt-auto pt-4">
              <Text size="xs" tone="muted" className="font-mono">
                ⌘⇧P to toggle
              </Text>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Collapsible section for panel
function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  icon,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left py-1"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 text-white/40" />
        ) : (
          <ChevronUp className="h-3 w-3 text-white/40" />
        )}
        {icon}
        <Text size="xs" weight="medium" className="uppercase tracking-wider">
          {title}
        </Text>
        <Text size="xs" tone="muted">
          {count}
        </Text>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mt-2 pl-5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: DURATION.quick, ease: EASE }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Loading skeleton - premium with staggered animation
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
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.smooth, delay: 0.1, ease: EASE }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-7 w-20 rounded-full bg-white/[0.06] animate-pulse"
          />
        ))}
      </motion.div>
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.smooth, delay: 0.2, ease: EASE }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/[0.06] animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-4 w-full rounded bg-white/[0.06] animate-pulse" />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

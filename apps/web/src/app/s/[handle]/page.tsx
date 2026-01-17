'use client';

/**
 * Space Residence Page - /s/[handle]
 *
 * Renders within UniversalShell (sidebar provided by layout).
 *
 * Features:
 * - Board tabs for navigation
 * - Chat messages (mock for now)
 * - Context panel with online members, events, pinned items
 * - Keyboard shortcuts for board navigation (⌘1-9)
 */

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Settings, ChevronDown, ChevronUp, Users, Calendar, Pin, MessageCircle, Link as LinkIcon, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Avatar, AvatarImage, AvatarFallback, getInitials, Button, BoardTabs } from '@hive/ui';
import { useSpaceResidenceState } from './hooks';
import { ChatMessages, ChatInput } from './components';

export default function SpacePage() {
  const params = useParams();
  const handle = params.handle as string;

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
    onlineMembers,
    upcomingEvents,
    pinnedItems,
    panelCollapsed,
    setPanelCollapsed,
    rsvpToEvent,
    navigateBack,
    navigateToSettings,
  } = useSpaceResidenceState(handle);

  // Loading state
  if (isLoading) {
    return <SpacePageSkeleton />;
  }

  // Error state
  if (error || !space) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Space Not Found</h2>
          <p className="text-white/50 mb-6">
            The space /s/{handle} could not be found or is no longer available.
          </p>
          <button
            onClick={navigateBack}
            className="px-6 py-2 bg-white text-black rounded-lg hover:opacity-90 transition-opacity"
          >
            Browse Spaces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Space Header */}
      <div className="flex items-center justify-between py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Avatar size="default">
            {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
            <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <Text weight="medium">{space.name}</Text>
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />
              <Text size="xs" tone="muted">{space.onlineCount} online</Text>
            </div>
            <Text size="xs" tone="muted" className="font-mono">@{space.handle}</Text>
          </div>
        </div>
        {space.isLeader && (
          <Button variant="ghost" size="sm" onClick={navigateToSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Board Tabs */}
      <div className="py-2 border-b border-white/[0.06]">
        <BoardTabs
          boards={boards}
          activeBoard={activeBoard}
          onBoardChange={setActiveBoard}
          canAddBoard={canAddBoard}
        />
      </div>

      {/* Main Content: Chat + Panel */}
      <div className="flex-1 flex gap-4 py-4">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto">
            <ChatMessages messages={messages} isLoading={isLoadingMessages} />
          </div>

          {/* Input Area */}
          <div className="mt-4">
            {space.isMember ? (
              <ChatInput onSend={sendMessage} placeholder={`Message #${activeBoard}`} />
            ) : (
              <JoinPrompt spaceName={space.name} onJoin={() => {}} />
            )}
          </div>
        </div>

        {/* Context Panel (collapsible on desktop) */}
        <div className={cn(
          'hidden lg:flex flex-col w-72 flex-shrink-0',
          'border-l border-white/[0.06] pl-4',
          panelCollapsed && 'lg:hidden'
        )}>
          {/* Panel Header */}
          <div className="flex items-center justify-between mb-4">
            <Text size="xs" tone="muted" className="uppercase tracking-wider">Context</Text>
            <Button variant="ghost" size="sm" onClick={() => setPanelCollapsed(!panelCollapsed)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* NOW - Online Members */}
          <CollapsibleSection title="Now" count={onlineMembers.length} defaultOpen>
            {onlineMembers.length === 0 ? (
              <Text size="xs" tone="muted">No one online right now</Text>
            ) : (
              <div className="space-y-2">
                {onlineMembers.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <Avatar size="xs">
                      {member.avatar && <AvatarImage src={member.avatar} />}
                      <AvatarFallback>{getInitials(member.name || member.handle)}</AvatarFallback>
                    </Avatar>
                    <Text size="sm" tone="muted">@{member.handle}</Text>
                  </div>
                ))}
                {onlineMembers.length > 5 && (
                  <Text size="xs" tone="muted">+{onlineMembers.length - 5} more</Text>
                )}
              </div>
            )}
          </CollapsibleSection>

          {/* NEXT UP - Events */}
          <CollapsibleSection title="Next Up" count={upcomingEvents.length} defaultOpen icon={<Calendar className="h-3 w-3" />}>
            {upcomingEvents.length === 0 ? (
              <Text size="xs" tone="muted">No upcoming events</Text>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="space-y-1">
                    <Text size="sm" weight="medium">{event.title}</Text>
                    <div className="flex items-center justify-between">
                      <Text size="xs" tone="muted">{event.time}</Text>
                      <div className="flex items-center gap-2">
                        <Text size="xs" tone="muted">{event.goingCount} going</Text>
                        <Button variant="ghost" size="sm" onClick={() => rsvpToEvent(event.id)}>
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
          <CollapsibleSection title="Pinned" count={pinnedItems.length} defaultOpen icon={<Pin className="h-3 w-3" />}>
            {pinnedItems.length === 0 ? (
              <Text size="xs" tone="muted">No pinned items</Text>
            ) : (
              <div className="space-y-2">
                {pinnedItems.map((item) => (
                  <button key={item.id} className="flex items-center gap-2 w-full text-left hover:bg-white/[0.04] rounded p-1 -m-1">
                    {item.type === 'message' && <MessageCircle className="h-3 w-3 text-white/40" />}
                    {item.type === 'link' && <LinkIcon className="h-3 w-3 text-white/40" />}
                    {item.type === 'file' && <FileText className="h-3 w-3 text-white/40" />}
                    <Text size="sm" tone="muted" className="truncate">{item.title}</Text>
                  </button>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Keyboard hint */}
          <div className="mt-auto pt-4">
            <Text size="xs" tone="muted" className="font-mono">⌘⇧P to toggle</Text>
          </div>
        </div>
      </div>
    </div>
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
        {isOpen ? <ChevronDown className="h-3 w-3 text-white/40" /> : <ChevronUp className="h-3 w-3 text-white/40" />}
        {icon}
        <Text size="xs" weight="medium" className="uppercase tracking-wider">{title}</Text>
        <Text size="xs" tone="muted">{count}</Text>
      </button>
      {isOpen && <div className="mt-2 pl-5">{children}</div>}
    </div>
  );
}

// Join prompt for non-members
function JoinPrompt({ spaceName, onJoin }: { spaceName: string; onJoin: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
      <Text size="sm" tone="muted">Join {spaceName} to participate</Text>
      <Button variant="default" size="sm" onClick={onJoin}>Join Space</Button>
    </div>
  );
}

// Loading skeleton
function SpacePageSkeleton() {
  return (
    <div className="min-h-screen space-y-4 py-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-white/[0.06] animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 w-20 rounded-full bg-white/[0.06] animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/[0.06] animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-4 w-full rounded bg-white/[0.06] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

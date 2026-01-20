'use client';

/**
 * Space Theater Layout
 *
 * Hub + Modes architecture for immersive space experience.
 * Wraps existing space content with mode-based navigation.
 *
 * Modes:
 * - hub: Overview with mode cards (chat, events, tools)
 * - chat: Full-screen chat (TheaterChatBoard)
 * - events: Full-screen events (EventsMode)
 * - tools: Full-screen tools grid (ToolsMode)
 * - members: Full-screen members view (MembersMode)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SpaceHub,
  ContextPill,
  ContextPillMobile,
  EventsMode,
  ToolsMode,
  MembersMode,
  type SpaceEvent,
  type SpaceTool,
  type SpaceMember,
} from '@hive/ui/design-system/components';
import type { SpaceMode } from '../hooks/use-space-mode';

// ============================================================
// Props Interface
// ============================================================

interface SpaceTheaterLayoutProps {
  mode: SpaceMode;
  onModeChange: (mode: SpaceMode) => void;

  // Space data
  space: {
    id: string;
    name: string;
    description?: string;
    bannerUrl?: string;
    iconUrl?: string;
    category?: string;
  };

  // Membership (for hub action button)
  isMember?: boolean;
  onJoin?: () => void;

  // Chat content (still uses existing SpaceChatBoard)
  chatContent: React.ReactNode;

  // Events data
  events?: SpaceEvent[];
  eventsLoading?: boolean;
  canCreateEvent?: boolean;
  onEventRsvp?: (eventId: string, status: 'going' | 'maybe' | 'not_going') => void;
  onViewEvent?: (eventId: string) => void;
  onCreateEvent?: () => void;

  // Tools data
  tools?: SpaceTool[];
  toolsLoading?: boolean;
  canAddTools?: boolean;
  onRunTool?: (toolId: string) => void;
  onViewTool?: (toolId: string) => void;
  onAddTool?: () => void;
  onBuildTool?: () => void;
  onRemoveTool?: (placementId: string) => void;

  // Members data
  members?: SpaceMember[];
  membersLoading?: boolean;
  canInvite?: boolean;
  currentUserId?: string;
  onViewProfile?: (memberId: string) => void;
  onInvite?: () => void;
  onRemoveMember?: (memberId: string) => void;

  // Join requests (for private spaces)
  isPrivateSpace?: boolean;
  isLeader?: boolean;
  joinRequests?: Array<{
    id: string;
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    message?: string;
    createdAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
    user: { id: string; displayName: string; handle?: string; avatarUrl?: string } | null;
  }>;
  joinRequestsLoading?: boolean;
  joinRequestsError?: string | null;
  onApproveRequest?: (requestId: string) => Promise<boolean>;
  onRejectRequest?: (requestId: string, reason?: string) => Promise<boolean>;
  onRefreshRequests?: () => void;

  // Leader onboarding banner (shown in hub mode)
  leaderOnboardingBanner?: React.ReactNode;
}

// ============================================================
// Animation Variants
// ============================================================

const modeTransitionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
};

// ============================================================
// Component
// ============================================================

export function SpaceTheaterLayout({
  mode,
  onModeChange,
  space,
  isMember = true,
  onJoin,
  chatContent,
  // Events
  events = [],
  eventsLoading = false,
  canCreateEvent = false,
  onEventRsvp,
  onViewEvent,
  onCreateEvent,
  // Tools
  tools = [],
  toolsLoading = false,
  canAddTools = false,
  onRunTool,
  onViewTool,
  onAddTool,
  onBuildTool,
  onRemoveTool,
  // Members
  members = [],
  membersLoading = false,
  canInvite = false,
  currentUserId,
  onViewProfile,
  onInvite,
  onRemoveMember,
  // Join requests
  isPrivateSpace = false,
  isLeader = false,
  joinRequests = [],
  joinRequestsLoading = false,
  joinRequestsError,
  onApproveRequest,
  onRejectRequest,
  onRefreshRequests,
  leaderOnboardingBanner,
}: SpaceTheaterLayoutProps) {

  return (
    <div className="min-h-screen h-screen bg-[var(--bg-ground,#0A0A09)] flex flex-col overflow-hidden">
      {/* Context Pill (visible in all modes except hub) */}
      <AnimatePresence>
        {mode !== 'hub' && (
          <>
            {/* Desktop */}
            <div className="hidden lg:block">
              <ContextPill
                currentMode={mode}
                onNavigate={onModeChange}
              />
            </div>
            {/* Mobile */}
            <div className="lg:hidden">
              <ContextPillMobile
                currentMode={mode}
                onNavigate={onModeChange}
              />
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Mode Content */}
      <AnimatePresence mode="wait">
        {/* Hub Mode - Orientation Archetype */}
        {mode === 'hub' && (
          <motion.div
            key="hub"
            variants={modeTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 overflow-auto"
          >
            {/* Leader Onboarding Banner (if provided) */}
            {leaderOnboardingBanner}

            <SpaceHub
              space={space}
              isMember={isMember}
              onModeChange={onModeChange}
              onJoin={onJoin}
            />
          </motion.div>
        )}

        {/* Chat Mode */}
        {mode === 'chat' && (
          <motion.div
            key="chat"
            variants={modeTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col overflow-hidden"
          >
            {chatContent}
          </motion.div>
        )}

        {/* Events Mode */}
        {mode === 'events' && (
          <motion.div
            key="events"
            variants={modeTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 overflow-hidden"
          >
            <EventsMode
              spaceId={space.id}
              events={events}
              isLoading={eventsLoading}
              canCreate={canCreateEvent}
              onRsvp={onEventRsvp}
              onViewEvent={onViewEvent}
              onCreateEvent={onCreateEvent}
            />
          </motion.div>
        )}

        {/* Tools Mode */}
        {mode === 'tools' && (
          <motion.div
            key="tools"
            variants={modeTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 overflow-hidden"
          >
            <ToolsMode
              spaceId={space.id}
              tools={tools}
              isLoading={toolsLoading}
              canAddTools={canAddTools}
              onRunTool={onRunTool}
              onViewTool={onViewTool}
              onAddTool={onAddTool}
              onBuildTool={onBuildTool}
              onRemoveTool={onRemoveTool}
            />
          </motion.div>
        )}

        {/* Members Mode */}
        {mode === 'members' && (
          <motion.div
            key="members"
            variants={modeTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 overflow-hidden"
          >
            <MembersMode
              spaceId={space.id}
              members={members}
              isLoading={membersLoading}
              canInvite={canInvite}
              currentUserId={currentUserId}
              onViewProfile={onViewProfile}
              onInvite={onInvite}
              onRemoveMember={onRemoveMember}
              isPrivateSpace={isPrivateSpace}
              isLeader={isLeader}
              joinRequests={joinRequests}
              joinRequestsLoading={joinRequestsLoading}
              joinRequestsError={joinRequestsError}
              onApproveRequest={onApproveRequest}
              onRejectRequest={onRejectRequest}
              onRefreshRequests={onRefreshRequests}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

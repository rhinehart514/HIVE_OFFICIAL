"use client";

/**
 * ProfilePageContent - Handle-based Profile Page
 *
 * Renders the full profile using handle-based URL.
 * This is the canonical profile view for /u/[handle] URLs.
 *
 * @version 1.0.0 - IA Unification (Jan 2026)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ProfileIdentityHero,
  ProfileActivityCard,
  ProfileLeadershipCard,
  ProfileEventCard,
  ProfileSpacePill,
  ProfileConnectionFooter,
  ProfileOverflowChip,
  ProfileToolModal,
  type ProfileActivityTool,
  type ProfileLeadershipSpace,
  type ProfileEvent,
  type ProfileSpacePillSpace,
} from '@hive/ui';
import { MOTION } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { useProfileByHandle } from './hooks';
import { useDM } from '@/contexts/dm-context';

// ============================================================================
// Constants
// ============================================================================

const MAX_TOOLS_VISIBLE = 3;
const MAX_LEADERSHIP_VISIBLE = 3;
const MAX_EVENTS_VISIBLE = 2;
const MAX_SPACES_VISIBLE = 6;

const EASE_PREMIUM: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const zoneVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE_PREMIUM,
    },
  },
};

// ============================================================================
// Loading State
// ============================================================================

function ProfileLoadingState() {
  return (
    <div className="min-h-screen bg-foundation-gray-1000 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: MOTION.duration.fast }}
        className="text-center"
      >
        <div className="w-12 h-12 rounded-full bg-white/[0.04] animate-pulse mx-auto mb-4" />
        <p className="text-white/30 text-body">Loading profile...</p>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Error States
// ============================================================================

function ProfileNotFoundState({ handle }: { handle: string }) {
  return (
    <div className="min-h-screen bg-foundation-gray-1000 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">&#128100;</span>
        </div>
        <h1 className="text-title-lg font-semibold text-white mb-3">
          Profile Not Found
        </h1>
        <p className="text-body text-white/50 mb-8">
          We couldn&apos;t find anyone with the handle <span className="text-white/70 font-medium">@{handle}</span>. They may have changed their handle or deleted their account.
        </p>
        <Link
          href="/home"
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
            'bg-white text-foundation-gray-1000 font-medium',
            'hover:bg-white/90 transition-colors'
          )}
        >
          Go Home
        </Link>
      </motion.div>
    </div>
  );
}

function ProfilePrivateState({ handle }: { handle: string }) {
  return (
    <div className="min-h-screen bg-foundation-gray-1000 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">&#128274;</span>
        </div>
        <h1 className="text-title-lg font-semibold text-white mb-3">
          Private Profile
        </h1>
        <p className="text-body text-white/50 mb-8">
          <span className="text-white/70 font-medium">@{handle}</span> has a private profile. You need to be connected to view their full profile.
        </p>
        <Link
          href="/home"
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
            'bg-white/[0.06] text-white/70 font-medium border border-white/[0.08]',
            'hover:bg-white/[0.08] transition-colors'
          )}
        >
          Go Home
        </Link>
      </motion.div>
    </div>
  );
}

function ProfileErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-foundation-gray-1000 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">&#9888;&#65039;</span>
        </div>
        <h1 className="text-title-lg font-semibold text-white mb-3">
          Something Went Wrong
        </h1>
        <p className="text-body text-white/50 mb-8">
          We couldn&apos;t load this profile. Please try again.
        </p>
        <button
          onClick={onRetry}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
            'bg-white text-foundation-gray-1000 font-medium',
            'hover:bg-white/90 transition-colors'
          )}
        >
          Try Again
        </button>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export default function ProfilePageContent() {
  const router = useRouter();
  const state = useProfileByHandle();
  const { openConversation } = useDM();

  // Inline expansion state
  const [showAllTools, setShowAllTools] = React.useState(false);
  const [showAllSpaces, setShowAllSpaces] = React.useState(false);

  const {
    handle,
    handleError,
    profileId,
    isOwnProfile,
    isLoading,
    error,
    profileData,
    heroUser,
    heroPresence,
    profileSpaces,
    profileTools,
    profileConnections,
    totalConnections,
    spacesLed,
    selectedTool,
    organizingEvents,
    sharedSpacesCount,
    handleEditProfile,
    handleToolModalClose,
    handleToolUpdateVisibility,
    handleToolRemove,
    handleSpaceClick,
    handleToolClick,
    handleConnect,
    handleAcceptRequest,
    handleRejectRequest,
    handleUnfriend,
    connectionState,
    pendingRequestId,
    isConnectionLoading,
  } = state;

  // DM handler
  const handleMessage = React.useCallback(() => {
    if (profileId && !isOwnProfile) {
      openConversation(profileId);
    }
  }, [profileId, isOwnProfile, openConversation]);

  // ============================================================================
  // Loading/Error States
  // ============================================================================

  if (isLoading) return <ProfileLoadingState />;
  if (handleError === 'not_found') return <ProfileNotFoundState handle={handle} />;
  if (handleError === 'private') return <ProfilePrivateState handle={handle} />;
  if (handleError === 'error' || error) return <ProfileErrorState onRetry={() => window.location.reload()} />;
  if (!profileData || !heroUser) return <ProfileNotFoundState handle={handle} />;

  // ============================================================================
  // Data Transformations
  // ============================================================================

  const activityTools: ProfileActivityTool[] = profileTools
    .sort((a, b) => (b.runs || 0) - (a.runs || 0))
    .map((tool) => ({
      id: tool.id,
      name: tool.name,
      emoji: tool.emoji,
      runs: tool.runs || 0,
      spaceName: (tool as unknown as { spaceName?: string }).spaceName,
    }));

  const leadershipSpaces: ProfileLeadershipSpace[] = spacesLed.map((space) => {
    const spaceWithTenure = space as unknown as { tenure?: number; tenureLabel?: string };
    return {
      id: space.id,
      name: space.name,
      emoji: undefined,
      memberCount: space.memberCount || 0,
      tenure: spaceWithTenure.tenureLabel,
      role: (space.role === 'Lead' ? 'admin' : space.role) as 'owner' | 'admin',
    };
  });

  const spacePills: ProfileSpacePillSpace[] = profileSpaces.map((space) => ({
    id: space.id,
    name: space.name,
    emoji: space.emoji,
    isLeader: space.isLeader,
  }));

  const profileOrganizingEvents: ProfileEvent[] = organizingEvents.map((event) => ({
    id: event.id,
    name: event.title,
    date: event.dateDisplay,
    emoji: event.emoji,
    rsvpCount: event.attendeeCount,
    spaceName: event.spaceName || undefined,
  }));

  const mutualConnectionsCount = profileConnections.length;

  // ============================================================================
  // Computed Display Logic
  // ============================================================================

  const visibleTools = showAllTools ? activityTools : activityTools.slice(0, MAX_TOOLS_VISIBLE);
  const overflowToolsCount = showAllTools ? 0 : activityTools.length - MAX_TOOLS_VISIBLE;

  const visibleLeadership = leadershipSpaces.slice(0, MAX_LEADERSHIP_VISIBLE);
  const visibleEvents = profileOrganizingEvents.slice(0, MAX_EVENTS_VISIBLE);

  const visibleSpaces = showAllSpaces ? spacePills : spacePills.slice(0, MAX_SPACES_VISIBLE);
  const overflowSpacesCount = showAllSpaces ? 0 : spacePills.length - MAX_SPACES_VISIBLE;

  const hasActivity = activityTools.length > 0 || leadershipSpaces.length > 0 || profileOrganizingEvents.length > 0;
  const hasSpaces = spacePills.length > 0;

  const profileIncomplete = isOwnProfile && !heroUser.bio;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-full w-full overflow-y-auto" style={{ backgroundColor: 'var(--bg-base)' }}>
      <motion.div
        className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ZONE 1: IDENTITY (Hero) */}
        <motion.section variants={zoneVariants}>
          <ProfileIdentityHero
            user={heroUser}
            isOwnProfile={isOwnProfile}
            isOnline={heroPresence.isOnline}
            profileIncomplete={profileIncomplete}
            connectionState={connectionState}
            pendingRequestId={pendingRequestId}
            isConnectionLoading={isConnectionLoading}
            onEdit={handleEditProfile}
            onConnect={handleConnect}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onUnfriend={handleUnfriend}
            onMessage={handleMessage}
          />
        </motion.section>

        {/* ZONE 2: ACTIVITY */}
        <motion.section variants={zoneVariants} className="mt-6">
          <div
            className="p-6 sm:p-8"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
          >
            {hasActivity ? (
              <div className="space-y-6">
                {visibleTools.length > 0 && (
                  <div>
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider mb-4"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Building
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visibleTools.map((tool) => (
                        <ProfileActivityCard
                          key={tool.id}
                          tool={tool}
                          onClick={() => handleToolClick(tool.id)}
                        />
                      ))}
                      {overflowToolsCount > 0 && (
                        <ProfileOverflowChip
                          count={overflowToolsCount}
                          label="more"
                          onClick={() => setShowAllTools(true)}
                          className="h-full min-h-[100px] flex items-center justify-center"
                        />
                      )}
                    </div>
                  </div>
                )}

                {visibleLeadership.length > 0 && (
                  <div>
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider mb-4"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Leading
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visibleLeadership.map((space) => (
                        <ProfileLeadershipCard
                          key={space.id}
                          space={space}
                          onClick={() => handleSpaceClick(space.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {visibleEvents.length > 0 && (
                  <div>
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider mb-4"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Organizing
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {visibleEvents.map((event) => (
                        <ProfileEventCard
                          key={event.id}
                          event={event}
                          onClick={() => router.push(`/events/${event.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="py-8 text-center"
                style={{
                  border: '1px dashed var(--border-default)',
                  borderRadius: '16px',
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Just getting started...
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/* ZONE 3: CAMPUS PRESENCE */}
        <motion.section variants={zoneVariants} className="mt-6">
          <div
            className="p-6 sm:p-8"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
          >
            {hasSpaces && (
              <div className="mb-6">
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-4"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Spaces
                </h3>
                <div className="flex flex-wrap gap-2">
                  {visibleSpaces.map((space) => (
                    <ProfileSpacePill
                      key={space.id}
                      space={space}
                      onClick={() => handleSpaceClick(space.id)}
                    />
                  ))}
                  {overflowSpacesCount > 0 && (
                    <ProfileOverflowChip
                      count={overflowSpacesCount}
                      onClick={() => setShowAllSpaces(true)}
                    />
                  )}
                </div>
              </div>
            )}

            {!isOwnProfile && (
              <ProfileConnectionFooter
                userName={heroUser.fullName}
                sharedSpacesCount={sharedSpacesCount}
                mutualConnectionsCount={mutualConnectionsCount}
              />
            )}

            {!hasSpaces && (
              <div
                className="py-6 text-center"
                style={{
                  border: '1px dashed var(--border-default)',
                  borderRadius: '16px',
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  No spaces yet
                </p>
              </div>
            )}
          </div>
        </motion.section>
      </motion.div>

      {/* Tool Modal */}
      <ProfileToolModal
        tool={selectedTool}
        isOpen={!!selectedTool}
        onClose={handleToolModalClose}
        onUpdateVisibility={isOwnProfile ? handleToolUpdateVisibility : undefined}
        onRemove={isOwnProfile ? handleToolRemove : undefined}
        isOwner={isOwnProfile}
      />
    </div>
  );
}

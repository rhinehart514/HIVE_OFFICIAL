"use client";

/**
 * ProfilePageContent - Belonging-First Profile Layout
 *
 * Zone 1: Identity (unchanged) - Avatar, name, handle, bio, badges
 * Zone 2: Belonging (NEW) - Spaces they're part of, upcoming events, shared spaces
 * Zone 3: Activity (simplified) - Active days stat, tools (conditional)
 *
 * @version 2.0.0 - Belonging-First Redesign (Feb 2026)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Wrench, ArrowRight } from 'lucide-react';
import {
  ProfileIdentityHero,
  ProfileActivityCard,
  ProfileBelongingSpaceCard,
  ProfileSharedBanner,
  ProfileEventCard,
  ProfileOverflowChip,
  ProfileToolModal,
  ReportContentModal,
  toast,
  type BelongingSpace,
  type ProfileActivityTool,
  type ProfileEvent,
  type ReportContentInput,
} from '@hive/ui';
import { MOTION } from '@hive/ui/design-system/primitives';
import { staggerContainerVariants, staggerItemVariants as tokenStaggerItemVariants, fadeInUpVariants } from '@hive/ui/lib/motion-variants';
import { cn } from '@/lib/utils';
import { useProfileByHandle } from './hooks';
import { useDM } from '@/contexts/dm-context';
import { useDMsEnabled, useConnectionsEnabled } from '@/hooks/use-feature-flags';

// ============================================================================
// Constants
// ============================================================================

const MAX_SPACES_VISIBLE = 6;
const MAX_EVENTS_VISIBLE = 3;
const MAX_TOOLS_VISIBLE = 3;

// Animation variants mapped to hidden/visible keys for compatibility with parent orchestration
const containerVariants = {
  hidden: staggerContainerVariants.initial,
  visible: {
    ...staggerContainerVariants.animate,
  },
};

const zoneVariants = {
  hidden: fadeInUpVariants.initial,
  visible: fadeInUpVariants.animate,
};

const staggerGridVariants = {
  hidden: staggerContainerVariants.initial,
  visible: {
    ...staggerContainerVariants.animate,
  },
};

const staggerItemVariants = {
  hidden: tokenStaggerItemVariants.initial,
  visible: tokenStaggerItemVariants.animate,
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
// Utility: Compute active days this month
// ============================================================================

function computeActiveDaysThisMonth(
  contributions: Array<{ date: string; count: number }>
): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return contributions.filter((c) => {
    if (c.count <= 0) return false;
    const d = new Date(c.date);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
}

function formatActiveDays(days: number): string {
  if (days === 0) return 'No activity this month';
  const today = new Date();
  const _todayStr = today.toISOString().split('T')[0];
  // We can't easily check "active today" without knowing if today's date is in contributions,
  // but the count is sufficient for display
  if (days === 1) return 'Active 1 day this month';
  return `Active ${days} days this month`;
}

// ============================================================================
// Component
// ============================================================================

export default function ProfilePageContent() {
  const router = useRouter();
  const state = useProfileByHandle();
  const { openConversation } = useDM();
  const { enabled: dmsEnabled } = useDMsEnabled();
  const { enabled: connectionsEnabled } = useConnectionsEnabled();

  // Inline expansion state
  const [showAllSpaces, setShowAllSpaces] = React.useState(false);
  const [showAllTools, setShowAllTools] = React.useState(false);
  const [showReportModal, setShowReportModal] = React.useState(false);

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
    profileConnections: _profileConnections,
    totalConnections: _totalConnections,
    spacesLed: _spacesLed,
    selectedTool,
    organizingEvents,
    sharedSpacesCount,
    sharedSpaceNames,
    mutualFriendsCount,
    activityContributions,
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

  // Report handler
  const handleReportProfile = React.useCallback(() => {
    setShowReportModal(true);
  }, []);

  // Submit report to API
  const handleSubmitReport = async (data: ReportContentInput) => {
    const response = await fetch('/api/content/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to submit report');
    }

    toast.success('Report submitted');
  };

  // ============================================================================
  // Loading/Error States
  // ============================================================================

  if (isLoading) return <ProfileLoadingState />;
  if (handleError === 'not_found') return <ProfileNotFoundState handle={handle} />;
  if (handleError === 'private') return <ProfilePrivateState handle={handle} />;
  if (handleError === 'error' || error) return <ProfileErrorState onRetry={() => window.location.reload()} />;
  if (!profileData || !heroUser) return <ProfileNotFoundState handle={handle} />;

  // ============================================================================
  // Data Transformations - Zone 2: Belonging
  // ============================================================================

  // Build belonging spaces: sorted by leader first, then by name
  const belongingSpaces: BelongingSpace[] = profileSpaces
    .map((space) => {
      // Find full space data from profileData for memberCount
      const fullSpace = profileData.spaces.find((s) => s.id === space.id);
      const isLeader = space.isLeader ?? false;
      let role: BelongingSpace['role'] = 'member';
      if (fullSpace) {
        if (fullSpace.role === 'owner') role = 'owner';
        else if (fullSpace.role === 'admin' || fullSpace.role === 'Lead') role = 'leader';
      } else if (isLeader) {
        role = 'leader';
      }

      return {
        id: space.id,
        name: space.name,
        emoji: space.emoji,
        role,
        memberCount: fullSpace?.memberCount,
        isShared: space.isShared ?? false,
      };
    })
    .sort((a, b) => {
      // Leaders first
      const aLeader = a.role !== 'member' ? 1 : 0;
      const bLeader = b.role !== 'member' ? 1 : 0;
      if (aLeader !== bLeader) return bLeader - aLeader;
      // Then alphabetical
      return a.name.localeCompare(b.name);
    });

  const visibleSpaces = showAllSpaces ? belongingSpaces : belongingSpaces.slice(0, MAX_SPACES_VISIBLE);
  const overflowSpacesCount = showAllSpaces ? 0 : Math.max(0, belongingSpaces.length - MAX_SPACES_VISIBLE);

  // Events: upcoming events they've RSVP'd to or are organizing
  const upcomingEvents: ProfileEvent[] = organizingEvents
    .slice(0, MAX_EVENTS_VISIBLE)
    .map((event) => ({
      id: event.id,
      name: event.title,
      date: event.dateDisplay,
      emoji: event.emoji,
      rsvpCount: event.attendeeCount,
      spaceName: event.spaceName || undefined,
    }));

  // ============================================================================
  // Data Transformations - Zone 3: Activity (Simplified)
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

  const visibleTools = showAllTools ? activityTools : activityTools.slice(0, MAX_TOOLS_VISIBLE);
  const overflowToolsCount = showAllTools ? 0 : Math.max(0, activityTools.length - MAX_TOOLS_VISIBLE);

  const activeDaysThisMonth = computeActiveDaysThisMonth(activityContributions);
  const activeDaysText = formatActiveDays(activeDaysThisMonth);

  // ============================================================================
  // Computed Display Logic
  // ============================================================================

  const hasSpaces = belongingSpaces.length > 0;
  const hasUpcomingEvents = upcomingEvents.length > 0;
  const hasTools = activityTools.length > 0;
  const hasBelonging = hasSpaces || hasUpcomingEvents;
  const hasActivity = hasTools || activeDaysThisMonth > 0;

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
        {/* ZONE 1: IDENTITY (Hero) - Unchanged */}
        <motion.section variants={zoneVariants}>
          <ProfileIdentityHero
            user={heroUser}
            isOwnProfile={isOwnProfile}
            isOnline={heroPresence.isOnline}
            profileIncomplete={isOwnProfile && !heroUser.bio}
            connectionState={connectionState}
            pendingRequestId={pendingRequestId}
            isConnectionLoading={isConnectionLoading}
            showConnectButton={connectionsEnabled}
            showMessageButton={dmsEnabled}
            onEdit={handleEditProfile}
            onConnect={handleConnect}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onUnfriend={handleUnfriend}
            onMessage={handleMessage}
            onReport={!isOwnProfile ? handleReportProfile : undefined}
          />
        </motion.section>

        {/* ZONE 2: BELONGING */}
        <motion.section variants={zoneVariants} className="mt-6">
          <div
            className="p-6 sm:p-8"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
          >
            {hasBelonging ? (
              <div className="space-y-6">
                {/* Shared Spaces Banner (only on other people's profiles) */}
                {!isOwnProfile && (sharedSpacesCount > 0 || mutualFriendsCount > 0) && (
                  <ProfileSharedBanner
                    sharedSpaceNames={sharedSpaceNames}
                    sharedSpacesCount={sharedSpacesCount}
                    mutualConnectionsCount={mutualFriendsCount}
                  />
                )}

                {/* Spaces Grid */}
                {hasSpaces && (
                  <div>
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider mb-4"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Spaces
                    </h3>
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                      variants={staggerGridVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {visibleSpaces.map((space) => (
                        <motion.div key={space.id} variants={staggerItemVariants}>
                          <ProfileBelongingSpaceCard
                            space={space}
                            onClick={() => handleSpaceClick(space.id)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                    {overflowSpacesCount > 0 && (
                      <div className="mt-3 flex justify-center">
                        <ProfileOverflowChip
                          count={overflowSpacesCount}
                          label="more spaces"
                          onClick={() => setShowAllSpaces(true)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Upcoming Events */}
                {hasUpcomingEvents && (
                  <div>
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider mb-4"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Upcoming Events
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {upcomingEvents.map((event) => (
                        <ProfileEventCard
                          key={event.id}
                          event={event}
                          onClick={() => {
                            const orgEvent = organizingEvents.find(e => e.id === event.id);
                            if (orgEvent?.spaceId) {
                              router.push(`/s/${orgEvent.spaceId}`);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Empty state: guide the user to join spaces */
              <div
                className="py-10 text-center"
                style={{
                  border: '1px dashed var(--border-default)',
                  borderRadius: '16px',
                }}
              >
                <span className="text-2xl block mb-3">&#127968;</span>
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {isOwnProfile ? 'Join spaces to build your profile' : 'No spaces yet'}
                </p>
                {isOwnProfile && (
                  <p
                    className="text-[13px]"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Your spaces, events, and communities show up here
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.section>

        {/* ZONE 3: ACTIVITY (Simplified) */}
        {(hasActivity || isOwnProfile) && (
          <motion.section variants={zoneVariants} className="mt-6">
            <div
              className="p-6 sm:p-8"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
              }}
            >
              <div className="space-y-6">
                {/* Active days stat */}
                {activeDaysThisMonth > 0 && (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <span
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        &#9889;
                      </span>
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {activeDaysText}
                    </p>
                  </div>
                )}

                {/* Tools (conditional - only show if user has created tools) */}
                {hasTools && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Tools Built
                      </h3>
                      {isOwnProfile && (
                        <div className="flex items-center gap-3">
                          <Link
                            href="/lab"
                            className="text-xs font-medium transition-colors flex items-center gap-1"
                            style={{ color: 'var(--text-tertiary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                          >
                            View all in HiveLab
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
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
                    {isOwnProfile && (
                      <div className="mt-4 flex justify-center">
                        <Link
                          href="/lab"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                          style={{
                            color: 'var(--text-secondary)',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                          }}
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          Create New Tool
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Build something prompt (own profile, no tools) */}
                {isOwnProfile && !hasTools && (
                  <div className="flex items-center gap-3 py-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                    >
                      <Wrench className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href="/lab"
                        className="text-sm font-medium transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        Build a tool for your spaces
                      </Link>
                      <p
                        className="text-[13px] mt-0.5"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Polls, sign-ups, countdowns, and more
                      </p>
                    </div>
                    <Link
                      href="/lab"
                      className="flex-shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}
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

      {/* Report Profile Modal */}
      <ReportContentModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        contentId={profileId || ''}
        contentType="profile"
        authorName={heroUser?.fullName}
        onSubmit={handleSubmitReport}
      />
    </div>
  );
}

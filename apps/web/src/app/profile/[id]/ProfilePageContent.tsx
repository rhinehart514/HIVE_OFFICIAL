"use client";

/**
 * ProfilePageContent - 3-Zone Profile Layout
 *
 * A profile answers: "Who is this person, and what do they DO on campus?"
 *
 * Zone 1: IDENTITY (Hero) — Who they are
 * Zone 2: ACTIVITY (What they do) — Building, Leading, Organizing
 * Zone 3: CAMPUS PRESENCE — Where they show up, relationship context
 *
 * @version 24.0.0 - 3-Zone Profile Layout (Design Sprint)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ProfileIdentityHero,
  ProfileActivityCard,
  ProfileLeadershipCard,
  ProfileEventCard,
  ProfileSpacePill,
  ProfileConnectionFooter,
  ProfileOverflowChip,
  ProfileToolModal,
  ReportContentModal,
  type ProfileActivityTool,
  type ProfileLeadershipSpace,
  type ProfileEvent,
  type ProfileSpacePillSpace,
  type ReportContentInput,
} from '@hive/ui';
import { toast } from '@hive/ui';
import { useProfilePageState } from './hooks';
import {
  ProfileLoadingState,
  ProfileErrorState,
  ProfileNotFoundState,
} from './components';
import { useDM } from '@/contexts/dm-context';
import { useDMsEnabled, useConnectionsEnabled } from '@/hooks/use-feature-flags';

// ============================================================================
// Constants
// ============================================================================

const MAX_TOOLS_VISIBLE = 3;
const MAX_LEADERSHIP_VISIBLE = 3;
const MAX_EVENTS_VISIBLE = 2;
const MAX_SPACES_VISIBLE = 6;

// Inline expansion thresholds (used by expansion logic below)

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
// Component
// ============================================================================

export default function ProfilePageContent() {
  const router = useRouter();
  const state = useProfilePageState();
  const { openConversation } = useDM();
  const { enabled: dmsEnabled } = useDMsEnabled();
  const { enabled: connectionsEnabled } = useConnectionsEnabled();

  // Inline expansion state
  const [showAllTools, setShowAllTools] = React.useState(false);
  const [showAllSpaces, setShowAllSpaces] = React.useState(false);
  const [showReportModal, setShowReportModal] = React.useState(false);

  const {
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

  // DM handler - opens conversation with this user
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
  // Data Transformations (must be above early returns - rules of hooks)
  // ============================================================================

  // Transform tools for ProfileActivityCard
  const activityTools: ProfileActivityTool[] = React.useMemo(() => {
    return profileTools
      .sort((a, b) => (b.runs || 0) - (a.runs || 0))
      .map((tool) => ({
        id: tool.id,
        name: tool.name,
        emoji: tool.emoji,
        runs: tool.runs || 0,
        spaceName: (tool as unknown as { spaceName?: string }).spaceName,
      }));
  }, [profileTools]);

  // Transform spaces led for ProfileLeadershipCard
  const leadershipSpaces: ProfileLeadershipSpace[] = React.useMemo(() => {
    return spacesLed.map((space) => {
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
  }, [spacesLed]);

  // Transform all spaces for ProfileSpacePill
  const spacePills: ProfileSpacePillSpace[] = React.useMemo(() => {
    return profileSpaces.map((space) => ({
      id: space.id,
      name: space.name,
      emoji: space.emoji,
      isLeader: space.isLeader,
    }));
  }, [profileSpaces]);

  // Events they're organizing (from API)
  const profileOrganizingEvents: ProfileEvent[] = React.useMemo(() => {
    return organizingEvents.map((event) => ({
      id: event.id,
      name: event.title,
      date: event.dateDisplay,
      emoji: event.emoji,
      rsvpCount: event.attendeeCount,
      spaceName: event.spaceName || undefined,
    }));
  }, [organizingEvents]);

  // ============================================================================
  // Loading/Error States
  // ============================================================================

  if (isLoading) return <ProfileLoadingState />;
  if (error) return <ProfileErrorState error={error} onNavigate={() => router.push('/spaces')} />;
  if (!profileData || !heroUser) return <ProfileNotFoundState onNavigate={() => router.push('/feed')} />;

  // Shared spaces count from hook (computed via API)

  // Calculate mutual connections
  const mutualConnectionsCount = profileConnections.length;

  // ============================================================================
  // Computed Display Logic
  // ============================================================================

  // Tools: expand inline when showAllTools is true
  const visibleTools = showAllTools ? activityTools : activityTools.slice(0, MAX_TOOLS_VISIBLE);
  const overflowToolsCount = showAllTools ? 0 : activityTools.length - MAX_TOOLS_VISIBLE;

  const visibleLeadership = leadershipSpaces.slice(0, MAX_LEADERSHIP_VISIBLE);
  const visibleEvents = profileOrganizingEvents.slice(0, MAX_EVENTS_VISIBLE);

  // Spaces: expand inline when showAllSpaces is true
  const visibleSpaces = showAllSpaces ? spacePills : spacePills.slice(0, MAX_SPACES_VISIBLE);
  const overflowSpacesCount = showAllSpaces ? 0 : spacePills.length - MAX_SPACES_VISIBLE;

  const hasActivity = activityTools.length > 0 || leadershipSpaces.length > 0 || profileOrganizingEvents.length > 0;
  const hasSpaces = spacePills.length > 0;

  // Check if profile is incomplete (for own profile prompts)
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
        {/* ================================================================
            ZONE 1: IDENTITY (Hero — Who They Are)
            ================================================================ */}
        <motion.section variants={zoneVariants}>
          <ProfileIdentityHero
            user={heroUser}
            isOwnProfile={isOwnProfile}
            isOnline={heroPresence.isOnline}
            profileIncomplete={profileIncomplete}
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

        {/* ================================================================
            ZONE 2: ACTIVITY (What They Do — Building, Leading, Organizing)
            ================================================================ */}
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
                {/* Building Section */}
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

                {/* Leading Section */}
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

                {/* Organizing Section */}
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
              // Empty state for activity
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

        {/* ================================================================
            ZONE 3: CAMPUS PRESENCE (Where They Show Up)
            ================================================================ */}
        <motion.section variants={zoneVariants} className="mt-6">
          <div
            className="p-6 sm:p-8"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
          >
            {/* Spaces Section */}
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

            {/* Connection Footer - Hidden for own profile */}
            {!isOwnProfile && (
              <ProfileConnectionFooter
                userName={heroUser.fullName}
                sharedSpacesCount={sharedSpacesCount}
                mutualConnectionsCount={mutualConnectionsCount}
              />
            )}

            {/* Empty state for no spaces */}
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

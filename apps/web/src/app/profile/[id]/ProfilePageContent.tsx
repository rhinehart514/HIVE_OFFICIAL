"use client";

/**
 * ProfilePageContent - Apple-style Bento Grid Profile
 *
 * Configurable widget grid with drag-drop reordering.
 * Dense, scannable, Linear-precision with HIVE's warm dark aesthetic.
 *
 * Widget Catalog:
 * - identity: Avatar, name, handle, bio, presence, actions
 * - heatmap: Contribution graph, streak badge
 * - spaces: Space list with leader badges
 * - tools: Tool grid with run counts
 * - connections: Avatar stack, mutual count
 * - interests: Interest pills with shared highlighting
 * - stats: Spaces/Tools/Activity/Streak counters
 * - featuredTool: Pinned tool showcase
 *
 * @version 23.0.0 - Apple bento grid
 */

import { useRouter } from 'next/navigation';
import type { WidgetType } from '@hive/core';
import {
  ProfileToolModal,
  ProfileHero,
  ProfileSpacesCard,
  ProfileToolsCard,
  ProfileConnectionsCard,
  ProfileInterestsCard,
  ProfileActivityHeatmap,
  ProfileStatsWidget,
  ProfileFeaturedToolCard,
} from '@hive/ui';
import { useProfilePageState } from './hooks';
import { useFollow } from '@/hooks/use-follow';
import {
  BentoProfileGrid,
  ProfileLoadingState,
  ProfileErrorState,
  ProfileNotFoundState,
} from './components';

export default function ProfilePageContent() {
  const router = useRouter();
  const state = useProfilePageState();

  const {
    profileId,
    isOwnProfile,
    isLoading,
    error,
    profileData,
    heroUser,
    heroPresence,
    heroBadges,
    profileSpaces,
    profileTools,
    profileConnections,
    totalConnections,
    interests,
    sharedInterests,
    activityContributions,
    totalActivityCount,
    currentStreak,
    selectedTool,
    handleEditProfile,
    handleViewConnections,
    handleToolModalClose,
    handleToolUpdateVisibility,
    handleToolRemove,
    handleSpaceClick,
    handleToolClick,
    handleConnect,
    handleMessage,
  } = state;

  // Follow state for non-own profiles
  const {
    isFollowing,
    isMutual,
    isActionPending,
    toggleFollow,
  } = useFollow(profileId);

  if (isLoading) return <ProfileLoadingState />;
  if (error) return <ProfileErrorState error={error} onNavigate={() => router.push('/spaces')} />;
  if (!profileData || !heroUser) return <ProfileNotFoundState onNavigate={() => router.push('/feed')} />;

  // Get featured tool (first tool with highest runs)
  const featuredTool = profileTools.length > 0
    ? [...profileTools].sort((a, b) => (b.runs || 0) - (a.runs || 0))[0]
    : null;

  // Widget renderer - maps widget type to component
  const renderWidget = (type: WidgetType, isEditMode: boolean) => {
    switch (type) {
      case 'identity':
        return (
          <ProfileHero
            user={heroUser}
            presence={heroPresence}
            badges={heroBadges}
            isOwnProfile={isOwnProfile}
            onEdit={handleEditProfile}
            onConnect={isOwnProfile ? undefined : handleConnect}
            onMessage={isOwnProfile ? undefined : handleMessage}
          />
        );

      case 'spaces':
        return (
          <ProfileSpacesCard
            spaces={profileSpaces}
            maxVisible={4}
            onSpaceClick={handleSpaceClick}
            onViewAll={() => router.push('/spaces')}
          />
        );

      case 'tools':
        return (
          <ProfileToolsCard
            tools={profileTools.map(t => ({
              ...t,
              deployedSpaces: t.deployedSpaces || 0,
            }))}
            onToolClick={handleToolClick}
            onViewAll={() => router.push(`/tools?userId=${heroUser.id}`)}
          />
        );

      case 'connections':
        return (
          <ProfileConnectionsCard
            totalConnections={totalConnections}
            mutualConnections={profileConnections}
            onViewAll={handleViewConnections}
          />
        );

      case 'interests':
        return (
          <ProfileInterestsCard
            interests={interests}
            sharedInterests={sharedInterests}
          />
        );

      case 'heatmap':
        return (
          <ProfileActivityHeatmap
            contributions={activityContributions}
            totalContributions={totalActivityCount}
            streak={currentStreak}
          />
        );

      case 'stats':
        return (
          <ProfileStatsWidget
            spacesCount={profileSpaces.length}
            toolsCount={profileTools.length}
            activityCount={totalActivityCount}
            streakDays={currentStreak}
          />
        );

      case 'featuredTool':
        return (
          <ProfileFeaturedToolCard
            tool={featuredTool ? {
              id: featuredTool.id,
              name: featuredTool.name,
              emoji: featuredTool.emoji,
              description: featuredTool.description,
              runs: featuredTool.runs || 0,
              deployedSpaces: typeof featuredTool.deployedSpaces === 'number'
                ? featuredTool.deployedSpaces
                : 0,
            } : null}
            isOwnProfile={isOwnProfile}
            onToolClick={handleToolClick}
            onSelectTool={() => router.push(`/tools?userId=${heroUser.id}`)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0A0A09]">
      <div className="py-8 md:py-12">
        <BentoProfileGrid
          isOwnProfile={isOwnProfile}
          renderWidget={renderWidget}
        />
      </div>

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

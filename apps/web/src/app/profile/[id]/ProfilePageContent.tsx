"use client";

/**
 * ProfilePageContent - Orientation Archetype (Enhanced)
 *
 * Identity + Navigation + Action. No dashboards. No gamification.
 *
 * Enhancement layers applied:
 * 1. Spatial: Generous breathing room, vertical dominance
 * 2. Typographic: Tight tracking on name, weight contrast
 * 3. Micro-motion: Entrance only, no idle animation
 * 4. Material: Subtle surface separation
 * 5. Signature: Avatar inner glow treatment
 *
 * @version 22.0.0 - Enhanced Orientation archetype
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ProfileToolModal } from '@hive/ui';
import {
  Card,
  Button,
  Text,
  Badge,
  getInitials,
} from '@hive/ui/design-system/primitives';
import { useProfilePageState } from './hooks';
import { useFollow } from '@/hooks/use-follow';
import {
  ProfileLoadingState,
  ProfileErrorState,
  ProfileNotFoundState,
} from './components';

// LOCKED: Premium easing from design system
const EASE = [0.22, 1, 0.36, 1] as const;

// Layer 3: Micro-motion - entrance only, subtle
const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: EASE },
});

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
    totalConnections,
    interests,
    sharedInterests,
    selectedTool,
    handleEditProfile,
    handleViewConnections,
    handleToolModalClose,
    handleToolUpdateVisibility,
    handleToolRemove,
    handleSpaceClick,
    handleToolClick,
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

  const initials = getInitials(heroUser.fullName);
  const spacesCount = profileSpaces.length;
  const toolsCount = profileTools.length;
  const spacesLed = profileSpaces.filter(s => s.isLeader).length;

  return (
    <div className="min-h-screen w-full overflow-y-auto">
      {/* Layer 1: Spatial - generous vertical padding */}
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-20">

        {/* ============================================
            IDENTITY BLOCK
            Layer 1: Vertical dominance through spacing
            Layer 2: Tight tracking on name
            Layer 5: Avatar signature treatment
            ============================================ */}
        <motion.section
          className="flex flex-col md:flex-row gap-10 mb-20"
          {...fadeIn(0)}
        >
          {/* Profile Photo - Layer 5: Signature detail (inner glow) */}
          <div className="relative shrink-0 self-start">
            <div
              className="w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden"
              style={{
                boxShadow: `
                  0 0 0 1px rgba(255,255,255,0.06),
                  0 24px 48px -12px rgba(0,0,0,0.5),
                  inset 0 1px 1px rgba(255,255,255,0.04)
                `,
              }}
            >
              {heroUser.avatarUrl ? (
                <img
                  src={heroUser.avatarUrl}
                  alt={heroUser.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  }}
                >
                  <span className="text-4xl font-semibold text-white/30">
                    {initials}
                  </span>
                </div>
              )}
            </div>

            {/* Online indicator - subtle, no pulse */}
            {heroPresence.isOnline && (
              <div
                className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full flex items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(12,12,12,0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium text-emerald-400/90">
                  Online
                </span>
              </div>
            )}
          </div>

          {/* Identity Details - Layer 2: Typography enhancement */}
          <div className="flex-1 min-w-0 pt-1">
            {/* Name - tight tracking, weight contrast */}
            <h1
              className="text-[28px] md:text-[32px] font-semibold text-white mb-1 tracking-tight"
            >
              {heroUser.fullName}
            </h1>

            {/* Handle - softer contrast */}
            <p className="text-base text-white/40 mb-5">
              @{heroUser.handle}
            </p>

            {/* Bio - readable, secondary */}
            {heroUser.bio && (
              <p className="text-[15px] leading-relaxed text-white/60 mb-5 max-w-md">
                {heroUser.bio}
              </p>
            )}

            {/* Badges - earned, not given */}
            {(spacesLed > 0 || toolsCount > 0 || (Array.isArray(heroBadges) && heroBadges.length > 0)) && (
              <div className="flex flex-wrap gap-2">
                {spacesLed > 0 && (
                  <Badge variant="gold" size="default">
                    Space Leader
                  </Badge>
                )}
                {toolsCount > 0 && (
                  <Badge variant="gold" size="default">
                    Builder
                  </Badge>
                )}
                {Array.isArray(heroBadges) && heroBadges.map((badge) => (
                  <Badge key={badge.id} variant="neutral" size="default">
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {/* ============================================
            ACTION BLOCK
            Layer 1: Spatial separation
            ============================================ */}
        <motion.section className="mb-16" {...fadeIn(0.08)}>
          {isOwnProfile ? (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleEditProfile}
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant={isFollowing ? 'secondary' : 'cta'}
                size="lg"
                onClick={toggleFollow}
                disabled={isActionPending}
              >
                {isActionPending ? (
                  'Loading...'
                ) : isMutual ? (
                  'Friends'
                ) : isFollowing ? (
                  'Following'
                ) : (
                  'Follow'
                )}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                disabled
                className="opacity-50 cursor-not-allowed"
                title="Direct messaging coming soon"
              >
                Message
              </Button>
            </div>
          )}
        </motion.section>

        {/* ============================================
            NAVIGATION BLOCK
            Layer 4: Subtle surface separation
            ============================================ */}
        <motion.section {...fadeIn(0.12)}>
          {/* Layer 4: Faint background separation */}
          <div
            className="grid gap-3 md:grid-cols-3 p-4 -mx-4 rounded-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.015)' }}
          >
            {/* Spaces */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={() => router.push('/spaces')}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                  Spaces
                </span>
                <span className="text-white/30">→</span>
              </div>

              {spacesCount > 0 ? (
                <div className="space-y-1.5">
                  {profileSpaces.slice(0, 3).map((space) => (
                    <div
                      key={space.id}
                      className="flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpaceClick(space.id);
                      }}
                    >
                      <Text size="sm" truncate className="flex-1">
                        {space.name}
                      </Text>
                      {space.isLeader && (
                        <Badge variant="gold" size="sm">Lead</Badge>
                      )}
                    </div>
                  ))}
                  {spacesCount > 3 && (
                    <span className="text-xs text-white/30">
                      +{spacesCount - 3} more
                    </span>
                  )}
                </div>
              ) : isOwnProfile ? (
                <div className="space-y-1">
                  <span className="text-sm text-white/50">No spaces yet</span>
                  <span className="text-xs text-[var(--life-gold)] block">
                    Browse communities →
                  </span>
                </div>
              ) : (
                <span className="text-sm text-white/30">
                  No spaces yet
                </span>
              )}
            </Card>

            {/* Connections */}
            <Card
              as="button"
              elevation="resting"
              interactive
              onClick={handleViewConnections}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                  Connections
                </span>
                <span className="text-white/30">→</span>
              </div>

              {totalConnections > 0 ? (
                <span className="text-sm text-white/60">
                  {totalConnections} connection{totalConnections !== 1 ? 's' : ''}
                </span>
              ) : isOwnProfile ? (
                <div className="space-y-1">
                  <span className="text-sm text-white/50">No connections yet</span>
                  <span className="text-xs text-[var(--life-gold)] block">
                    Find classmates →
                  </span>
                </div>
              ) : (
                <span className="text-sm text-white/30">
                  No connections yet
                </span>
              )}
            </Card>

            {/* Tools */}
            <Card
              as="button"
              elevation="resting"
              interactive
              warmth={toolsCount > 0 ? 'low' : 'none'}
              onClick={() => router.push(`/tools?userId=${heroUser.id}`)}
              className="text-left"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                  Tools
                </span>
                <span className="text-white/30">→</span>
              </div>

              {toolsCount > 0 ? (
                <div className="space-y-1.5">
                  {profileTools.slice(0, 3).map((tool) => (
                    <div
                      key={tool.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToolClick(tool.id);
                      }}
                    >
                      <Text size="sm" truncate>
                        {tool.name}
                      </Text>
                    </div>
                  ))}
                  {toolsCount > 3 && (
                    <span className="text-xs text-white/30">
                      +{toolsCount - 3} more
                    </span>
                  )}
                </div>
              ) : isOwnProfile ? (
                <div className="space-y-1">
                  <span className="text-sm text-white/50">No tools yet</span>
                  <span className="text-xs text-[var(--life-gold)] block">
                    Build with AI →
                  </span>
                </div>
              ) : (
                <span className="text-sm text-white/30">
                  No tools yet
                </span>
              )}
            </Card>
          </div>
        </motion.section>

        {/* Interests - if present, shown below navigation */}
        {interests.length > 0 && (
          <motion.section className="mt-12" {...fadeIn(0.16)}>
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/40 block mb-3">
              Interests
            </span>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => {
                const isShared = sharedInterests.includes(interest);
                return (
                  <Badge
                    key={interest}
                    variant={isShared ? 'gold' : 'neutral'}
                    size="default"
                  >
                    {interest}
                  </Badge>
                );
              })}
            </div>
          </motion.section>
        )}
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

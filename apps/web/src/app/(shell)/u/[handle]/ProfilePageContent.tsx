'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRight, Zap, Calendar, MapPin, Video, Users, Sparkles,
} from 'lucide-react';
import {
  ProfileIdentityHero,
  ProfileIdentityHeroSkeleton,
  ProfileFeaturedToolCard,
  ProfileToolsCard,
  ProfileBelongingSpaceCard,
  ProfileActivityHeatmap,
  ProfileConnectionsCard,
  ProfileStatsRow,
  ContextBanner,
  ProfileToolModal,
  ReportContentModal,
  toast,
  type FeaturedTool,
  type BelongingSpace,
  type ProfileBadge,
  type ProfileActivityTool,
  type ReportContentInput,
  type ActivityContribution,
  type ProfileConnection,
} from '@hive/ui';
import { useProfileByHandle } from './hooks';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const EASE_PREMIUM: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeLabel(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMs < 0) return 'Happening now';
  if (diffMin < 60) return `In ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Data fetches
// ─────────────────────────────────────────────────────────────────────────────

async function fetchNextEvent() {
  const res = await fetch('/api/events/personalized?timeRange=this-week&maxItems=5&sort=soonest', { credentials: 'include' });
  if (!res.ok) return null;
  const payload = await res.json();
  const events = (payload.data || payload).events || [];
  return events[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone header
// ─────────────────────────────────────────────────────────────────────────────

function ZoneHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25 mb-3">
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading / error states
// ─────────────────────────────────────────────────────────────────────────────

function ProfileLoadingState() {
  return (
    <div className="w-full px-6 lg:px-8 py-6 pb-24 md:pb-8 space-y-8">
      {/* Zone 1: Hero skeleton */}
      <ProfileIdentityHeroSkeleton />

      {/* Zone 2: Tools skeleton */}
      <div className="space-y-4 animate-pulse">
        <div className="h-3 w-20 rounded bg-white/[0.06]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/[0.06] h-[180px]" />
          <div className="rounded-2xl bg-white/[0.06] h-[180px]" />
        </div>
      </div>

      {/* Zone 3: Spaces skeleton */}
      <div className="space-y-4 animate-pulse">
        <div className="h-3 w-16 rounded bg-white/[0.06]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-2xl bg-white/[0.06] h-[68px]" />
          ))}
        </div>
      </div>

      {/* Zone 4: Momentum skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        <div className="rounded-2xl bg-white/[0.06] h-[240px] md:col-span-2" />
        <div className="rounded-2xl bg-white/[0.06] h-[160px]" />
        <div className="rounded-2xl bg-white/[0.06] h-[160px]" />
      </div>
    </div>
  );
}

function ProfileNotFoundState({ handle }: { handle: string }) {
  return (
    <div className="flex items-center justify-center py-32 px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-semibold text-white mb-3">Not found</h1>
        <p className="text-sm text-white/50 mb-6">No one with handle <span className="font-sans">@{handle}</span> exists.</p>
        <Link href="/discover" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] text-white/50 text-sm font-medium hover:bg-white/[0.09]">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ProfileErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <p className="text-white/50 mb-4">Couldn't load this profile.</p>
        <button onClick={onRetry} className="px-5 py-2.5 rounded-full bg-[#FFD700] text-black text-sm font-medium">
          Try again
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePageContent() {
  const state = useProfileByHandle();
  const [showReportModal, setShowReportModal] = React.useState(false);

  const {
    handle, handleError, profileId, isOwnProfile, isLoading, error,
    profileData, heroUser, heroPresence, heroBadges, profileSpaces, profileTools,
    profileConnections, totalConnections, mutualFriendsCount,
    activityContributions, totalActivityCount, currentStreak,
    selectedTool, handleEditProfile, handleToolModalClose,
    handleToolUpdateVisibility, handleToolRemove,
    handleSpaceClick, handleToolClick, interests,
    sharedInterests, sharedSpaceNames, viewerIsBuilder, organizingEvents,
    connectionState, pendingRequestId, isConnectionLoading,
    handleConnect, handleAcceptRequest, handleRejectRequest, handleUnfriend, handleMessage,
  } = state;

  const { data: nextEvent = null } = useQuery({
    queryKey: ['profile-next-event'],
    queryFn: fetchNextEvent,
    staleTime: 5 * 60_000,
    enabled: isOwnProfile,
  });

  const handleShare = React.useCallback(() => {
    const url = `${window.location.origin}/u/${handle}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Copied!', 'Profile link copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  }, [handle]);

  const handleSubmitReport = async (data: ReportContentInput) => {
    const res = await fetch('/api/content/reports', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit report');
    toast.success('Report submitted');
  };

  if (isLoading) return <ProfileLoadingState />;
  if (handleError === 'not_found' || (handleError === 'private' && !isOwnProfile)) return <ProfileNotFoundState handle={handle} />;
  if (handleError === 'error' || error) return <ProfileErrorState onRetry={() => window.location.reload()} />;
  if (!profileData || !heroUser) return <ProfileNotFoundState handle={handle} />;

  // ── Tool deduplication & sorting ──
  const uniqueTools = profileTools.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
  const seenNames = new Set<string>();
  const dedupedTools = uniqueTools.filter(t => {
    const key = t.name.toLowerCase().trim();
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });
  const sortedTools = [...dedupedTools].sort((a, b) => (b.runs || 0) - (a.runs || 0));

  // ── Map featured tool ──
  const featuredTool: FeaturedTool | null = sortedTools[0] ? {
    id: sortedTools[0].id,
    name: sortedTools[0].name,
    description: sortedTools[0].description,
    emoji: sortedTools[0].emoji,
    runs: sortedTools[0].runs || 0,
    deployedSpaces: typeof sortedTools[0].deployedSpaces === 'number'
      ? sortedTools[0].deployedSpaces
      : Array.isArray(sortedTools[0].deployedSpaces)
        ? sortedTools[0].deployedSpaces.length
        : 0,
  } : null;

  // ── Map remaining tools for grid ──
  const secondaryTools = sortedTools.slice(1).map(t => ({
    ...t,
    deployedSpaces: typeof t.deployedSpaces === 'number'
      ? t.deployedSpaces
      : Array.isArray(t.deployedSpaces)
        ? t.deployedSpaces.length
        : 0,
  }));

  // ── Map spaces to BelongingSpace type ──
  const belongingSpaces: BelongingSpace[] = (profileData.spaces || []).map(space => {
    const role: BelongingSpace['role'] =
      space.role === 'owner' ? 'owner'
      : space.role === 'admin' || space.role === 'Lead' ? 'leader'
      : 'member';

    return {
      id: space.id,
      name: space.name,
      emoji: undefined,
      role,
      memberCount: space.memberCount,
      isShared: sharedSpaceNames.includes(space.name),
    };
  });

  // ── Map badges from profile data ──
  // badges come as string[] from the API (achievement names)
  const rawBadges = profileData.profile.badges || [];
  const profileBadges: ProfileBadge[] = rawBadges.map((badge: string, idx: number) => ({
    id: `badge-${idx}`,
    type: badge.toLowerCase().replace(/\s+/g, '_'),
    name: badge,
    description: '',
    displayOrder: idx,
  }));

  // Add dynamic badges from computed data
  if (heroBadges.isBuilder && !profileBadges.some(b => b.type === 'builder')) {
    profileBadges.push({ id: 'dynamic-builder', type: 'builder', name: 'Builder', description: 'Creates tools for campus', displayOrder: 100 });
  }

  // ── Profile completeness ──
  const completenessScore = (heroUser.avatarUrl ? 20 : 0)
    + (heroUser.bio ? 20 : 0)
    + (interests.length > 0 ? 20 : 0)
    + (profileSpaces.length > 0 ? 20 : 0)
    + (dedupedTools.length > 0 ? 20 : 0);
  const profileIncomplete = completenessScore < 100;

  // ── Total tool runs for context banner ──
  const totalToolRuns = sortedTools.reduce((sum, t) => sum + (t.runs || 0), 0);

  const hasTools = sortedTools.length > 0;
  const hasSpaces = belongingSpaces.length > 0;
  const hasActivity = activityContributions.length > 0;

  return (
    <div className="w-full px-6 lg:px-8 py-6 pb-24 md:pb-8 space-y-8">

      {/* ════════════════════════════════════════════════════════════════════════
          Zone 1: Identity Hero
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <ProfileIdentityHero
          user={{
            id: heroUser.id ?? profileId ?? '',
            fullName: heroUser.fullName,
            handle: heroUser.handle,
            avatarUrl: heroUser.avatarUrl,
            bio: heroUser.bio,
            classYear: heroUser.classYear,
            major: heroUser.major,
            campusName: heroUser.campusName,
          }}
          isOwnProfile={isOwnProfile}
          isOnline={heroPresence.isOnline}
          profileIncomplete={isOwnProfile && profileIncomplete}
          badges={profileBadges}
          connectionState={connectionState}
          pendingRequestId={pendingRequestId}
          isConnectionLoading={isConnectionLoading}
          onEdit={handleEditProfile}
          onConnect={handleConnect}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          onUnfriend={handleUnfriend}
          onMessage={handleMessage}
          onReport={!isOwnProfile ? () => setShowReportModal(true) : undefined}
        />

        {/* Social context banner — other users only */}
        {!isOwnProfile && (
          <ContextBanner
            sharedSpaces={sharedSpaceNames}
            mutualFriends={mutualFriendsCount}
            bothBuilders={viewerIsBuilder && heroBadges.isBuilder}
            toolRuns={totalToolRuns}
          />
        )}

        {/* Participation count — the identity metric */}
        {totalToolRuns > 0 && (
          <p className="text-[13px] text-white/40">
            <span className="text-white/60 font-medium">{totalToolRuns.toLocaleString()}</span>
            {' '}people participated in {isOwnProfile ? 'your' : `${heroUser.fullName.split(' ')[0]}'s`} creations
          </p>
        )}

        {/* Stats row — inline, supporting the narrative */}
        <ProfileStatsRow
          spaces={profileSpaces.length}
          friends={totalConnections}
          tools={dedupedTools.length}
          activity={totalActivityCount}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          Zone 2: Builder Showcase
          ════════════════════════════════════════════════════════════════════════ */}
      {(hasTools || isOwnProfile) && (
        <div className="space-y-4">
          <ZoneHeader>Builder Showcase</ZoneHeader>

          {hasTools ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Featured tool — hero card */}
              <ProfileFeaturedToolCard
                tool={featuredTool}
                isOwnProfile={isOwnProfile}
                onToolClick={handleToolClick}
                className={secondaryTools.length === 0 ? 'lg:col-span-2' : ''}
              />

              {/* Secondary tools grid */}
              {secondaryTools.length > 0 && (
                <ProfileToolsCard
                  tools={secondaryTools}
                  onToolClick={handleToolClick}
                />
              )}
            </div>
          ) : (
            /* Empty state — own profile only (hidden for others) */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_PREMIUM }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-8"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent pointer-events-none" />
              <div className="relative flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FFD700]/[0.08] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-[#FFD700]/50" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-white/60 mb-1">What will you build first?</p>
                  <p className="text-[13px] text-white/30 max-w-xs">Your profile fills up as you create. Polls, forms, signups — whatever your campus needs.</p>
                </div>
                <Link
                  href="/lab"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 text-[13px] font-medium text-[#FFD700] hover:bg-[#FFD700]/15 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />Start creating <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Zone 3: Campus Identity (spaces + interests)
          ════════════════════════════════════════════════════════════════════════ */}
      {(hasSpaces || interests.length > 0 || isOwnProfile) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <ZoneHeader>Campus Identity</ZoneHeader>
            {hasSpaces && isOwnProfile && (
              <Link href="/spaces" className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                Browse spaces <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {hasSpaces ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {belongingSpaces.map(space => (
                <ProfileBelongingSpaceCard
                  key={space.id}
                  space={space}
                  onClick={() => handleSpaceClick(space.id)}
                />
              ))}
            </div>
          ) : isOwnProfile ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_PREMIUM }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-white/50">Join spaces to show where you belong</p>
                  <p className="text-[11px] text-white/25 mt-0.5">Greek life, clubs, dorms — your campus community</p>
                </div>
                <Link href="/spaces" className="inline-flex items-center gap-1 text-[12px] text-[#FFD700]/60 hover:text-[#FFD700] transition-colors shrink-0">
                  Browse <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          ) : null}

          {/* Interests pills */}
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {interests.slice(0, 12).map(interest => (
                <span
                  key={interest}
                  className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50"
                >
                  {interest}
                </span>
              ))}
              {sharedInterests.length > 0 && !isOwnProfile && (
                <span className="px-2.5 py-1 rounded-full bg-[#FFD700]/[0.06] border border-[#FFD700]/[0.15] text-[11px] text-[#FFD700]/60">
                  {sharedInterests.length} shared
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Zone 4: Momentum (activity + connections + events)
          ════════════════════════════════════════════════════════════════════════ */}
      {(hasActivity || totalConnections > 0 || organizingEvents.length > 0 || isOwnProfile) && (
        <div className="space-y-4">
          <ZoneHeader>Momentum</ZoneHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Activity heatmap */}
            {hasActivity ? (
              <ProfileActivityHeatmap
                contributions={activityContributions}
                totalContributions={totalActivityCount}
                streak={currentStreak}
                className="md:col-span-2"
              />
            ) : isOwnProfile ? (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-6 md:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/30">No activity yet</p>
                  <Link href="/lab" className="text-[11px] text-[#FFD700]/60 hover:text-[#FFD700] transition-colors flex items-center gap-1">
                    Build something <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Connections */}
            {totalConnections > 0 && (
              <ProfileConnectionsCard
                totalConnections={totalConnections}
                mutualConnections={profileConnections}
                onViewAll={isOwnProfile ? () => window.location.assign('/me/connections') : undefined}
              />
            )}

            {/* Upcoming events from organizing */}
            {organizingEvents.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent pointer-events-none rounded-2xl" />
                <div className="p-5 space-y-3 relative">
                  <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25">Organizing</p>
                  {organizingEvents.slice(0, 2).map(event => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-white/30" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-white/70 font-medium truncate">{event.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/30">
                          <span>{event.dateDisplay || timeLabel(event.date)}</span>
                          {event.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />{event.location}
                            </span>
                          )}
                          {event.attendeeCount > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Users className="w-2.5 h-2.5" />{event.attendeeCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next event for own profile */}
            {isOwnProfile && nextEvent && organizingEvents.length === 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent pointer-events-none" />
                <div className="relative">
                  <p className="text-[11px] font-sans uppercase tracking-[0.15em] text-white/25 mb-2">Up next</p>
                  <p className="text-[14px] font-medium text-white/70 truncate">{nextEvent.title}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[12px] text-white/30">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{timeLabel(nextEvent.startDate)}</span>
                    {nextEvent.location && (
                      <span className="flex items-center gap-1">
                        {nextEvent.isOnline ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {nextEvent.isOnline ? 'Online' : nextEvent.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          Modals
          ════════════════════════════════════════════════════════════════════════ */}
      <ProfileToolModal
        tool={selectedTool}
        isOpen={!!selectedTool}
        onClose={handleToolModalClose}
        onUpdateVisibility={isOwnProfile ? handleToolUpdateVisibility : undefined}
        onRemove={isOwnProfile ? handleToolRemove : undefined}
        isOwner={isOwnProfile}
      />

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

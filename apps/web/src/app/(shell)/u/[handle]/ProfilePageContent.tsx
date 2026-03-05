'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, Zap, Sparkles, Check, Camera, FileText, Globe,
} from 'lucide-react';
import {
  ProfileIdentityHero,
  ProfileIdentityHeroSkeleton,
  ProfileFeaturedToolCard,
  ProfileToolsCard,
  ProfileBelongingSpaceCard,
  ContextBanner,
  ProfileToolModal,
  ReportContentModal,
  toast,
  type FeaturedTool,
  type BelongingSpace,
  type ProfileBadge,
  type ProfileActivityTool,
  type ReportContentInput,
} from '@hive/ui';
import { useProfileByHandle } from './hooks';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const EASE_PREMIUM: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─────────────────────────────────────────────────────────────────────────────
// Zone header
// ─────────────────────────────────────────────────────────────────────────────

function ZoneHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/50 mb-3">
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading / error states
// ─────────────────────────────────────────────────────────────────────────────

function ProfileLoadingState() {
  return (
    <div className="w-full max-w-[480px] mx-auto px-6 py-8 pb-24 md:pb-8 space-y-8">
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
    mutualFriendsCount,
    selectedTool, handleEditProfile, handleToolModalClose,
    handleToolUpdateVisibility, handleToolRemove,
    handleSpaceClick, handleToolClick, interests,
    sharedInterests, sharedSpaceNames, viewerIsBuilder,
    connectionState, pendingRequestId, isConnectionLoading,
    handleConnect, handleAcceptRequest, handleRejectRequest, handleUnfriend, handleMessage,
  } = state;

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
    shellFormat: sortedTools[0].shellFormat,
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
    profileBadges.push({ id: 'dynamic-builder', type: 'builder', name: 'Builder', description: 'Creates apps for campus', displayOrder: 100 });
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
  return (
    <div className="w-full max-w-[480px] mx-auto px-6 py-8 pb-24 md:pb-8 space-y-8">

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

        {/* Stats row removed — overkill at 50 users */}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          Get Started Checklist — own profile, incomplete
          ════════════════════════════════════════════════════════════════════════ */}
      {isOwnProfile && profileIncomplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_PREMIUM }}
          className="rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-white/60">Make your profile yours</p>
            <span className="text-[11px] text-white/25 tabular-nums">{completenessScore}%</span>
          </div>
          <div className="w-full h-1 rounded-full bg-white/[0.06] mb-4 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#FFD700]/60"
              initial={{ width: 0 }}
              animate={{ width: `${completenessScore}%` }}
              transition={{ duration: 0.6, ease: EASE_PREMIUM, delay: 0.2 }}
            />
          </div>
          <div className="space-y-2">
            {[
              { done: !!heroUser.avatarUrl, label: 'Add a profile photo', icon: Camera, href: '/me/edit' },
              { done: !!heroUser.bio, label: 'Write a short bio', icon: FileText, href: '/me/edit' },
              { done: interests.length > 0, label: 'Pick your interests', icon: Sparkles, href: '/me/edit' },
              { done: profileSpaces.length > 0, label: 'Join a space', icon: Globe, href: '/discover' },
              { done: dedupedTools.length > 0, label: 'Create your first app', icon: Zap, href: '/build' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  item.done
                    ? 'opacity-50 pointer-events-none'
                    : 'hover:bg-white/[0.04] cursor-pointer'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  item.done
                    ? 'bg-[#FFD700]/20'
                    : 'border border-white/[0.12]'
                }`}>
                  {item.done ? (
                    <Check className="w-3 h-3 text-[#FFD700]" />
                  ) : (
                    <item.icon className="w-2.5 h-2.5 text-white/25" />
                  )}
                </div>
                <span className={`text-[13px] ${
                  item.done ? 'text-white/30 line-through' : 'text-white/50'
                }`}>
                  {item.label}
                </span>
                {!item.done && (
                  <ArrowRight className="w-3 h-3 text-white/20 ml-auto" />
                )}
              </Link>
            ))}
          </div>
        </motion.div>
      )}

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
            /* Empty state — own profile only */
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <p className="text-[15px] text-white/50">Build your first app to unlock your portfolio</p>
              <Link
                href="/build"
                className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-[#FFD700] text-black text-sm font-semibold hover:bg-[#FFD700]/90 transition-colors duration-100"
              >
                <Zap className="w-3.5 h-3.5" />Start building
              </Link>
            </div>
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
              <Link href="/discover" className="text-[11px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
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
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.04] to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-white/50">Join spaces to show where you belong</p>
                  <p className="text-[11px] text-white/25 mt-0.5">Greek life, clubs, dorms — your campus community</p>
                </div>
                <Link href="/discover" className="inline-flex items-center gap-1 text-[12px] text-[#FFD700]/60 hover:text-[#FFD700] transition-colors shrink-0">
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

      {/* Zone 4 (Momentum) removed — activity heatmap, connections, and events overkill for 50 users */}

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

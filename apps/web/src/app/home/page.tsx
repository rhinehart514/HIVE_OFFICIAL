'use client';

/**
 * /home — Activity Stream
 *
 * Single-column focused home page. Replaces the 6-section dashboard
 * with a clean activity stream that answers "what should I do?"
 *
 * Sections (in order):
 * 1. Greeting header with today's date
 * 2. Happening Now — active users across spaces (if any)
 * 3. Up Next — next event within 24 hours (if any)
 * 4. Your Spaces — grid with unread badges, online counts
 * 5. Recent Activity — last 10 activities across spaces
 * 6. Suggested — one space recommendation (once per day)
 *
 * New users (0 spaces): greeting + empty state + recommendations
 *
 * @version 2.0.0 - Activity Stream redesign (Feb 2026)
 */

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@hive/auth-logic';
import {
  Calendar,
  MessageCircle,
  UserPlus,
  CalendarPlus,
  Package,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  GlassSurface,
  GradientText,
  Badge,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@hive/ui/design-system/primitives';
import {
  MOTION,
  staggerContainerVariants,
  revealVariants,
  cardHoverVariants,
} from '@hive/tokens';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/query-keys';

// ============================================
// TYPES
// ============================================

interface SpaceData {
  id: string;
  name: string;
  handle?: string;
  description?: string;
  avatarUrl?: string;
  memberCount?: number;
  onlineCount?: number;
  unreadCount?: number;
  role?: string;
  lastActivityAt?: string;
}

interface EventData {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  spaceId: string;
  spaceName: string;
  spaceHandle?: string;
  rsvpCount?: number;
  isGoing?: boolean;
  isLive?: boolean;
  location?: string;
  isOnline?: boolean;
}

interface RecommendedSpace {
  id: string;
  name: string;
  handle: string;
  reason: string;
  memberCount: number;
  category?: string;
  matchScore?: number;
}

interface ActivityItemData {
  id: string;
  type: 'new_messages' | 'member_joined' | 'event_created' | 'tool_deployed';
  spaceId: string;
  spaceName: string;
  spaceHandle: string;
  actorId?: string;
  actorName?: string;
  count?: number;
  title?: string;
  timestamp: string;
}

// ============================================
// HELPERS
// ============================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 0) return 'Happening now';
  if (diffMinutes < 60) return `In ${diffMinutes}m`;
  if (diffHours < 24) {
    return `In ${diffHours}h · ${date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isWithin24Hours(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return diffMs > 0 && diffMs < 24 * 60 * 60 * 1000;
}

// ============================================
// SECTION: HEADER
// ============================================

function HomeHeader({ firstName }: { firstName: string }) {
  return (
    <motion.header
      className="mb-8"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.standard / 1000,
        ease: MOTION.ease.premium,
      }}
    >
      <h1 className="text-title-lg font-semibold text-white tracking-tight">
        {getGreeting()}
        {firstName && (
          <>
            , <GradientText variant="gold">{firstName}</GradientText>
          </>
        )}
      </h1>
      <p className="text-body text-white/40 mt-1">{getTodayDate()}</p>
    </motion.header>
  );
}

// ============================================
// SECTION: HAPPENING NOW
// ============================================

function HappeningNow({ spaces }: { spaces: SpaceData[] }) {
  const totalOnline = spaces.reduce(
    (sum, s) => sum + (s.onlineCount ?? 0),
    0
  );
  const activeSpaceCount = spaces.filter(
    (s) => (s.onlineCount ?? 0) > 0
  ).length;

  if (totalOnline === 0) return null;

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: MOTION.duration.standard / 1000,
        delay: 0.1,
        ease: MOTION.ease.premium,
      }}
    >
      <div className="flex items-center gap-2 px-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-body-sm text-white/50">
          {totalOnline} {totalOnline === 1 ? 'person' : 'people'} active across{' '}
          {activeSpaceCount} {activeSpaceCount === 1 ? 'space' : 'spaces'}
        </span>
      </div>
    </motion.div>
  );
}

// ============================================
// SECTION: UP NEXT
// ============================================

function UpNext({
  event,
  onRsvp,
}: {
  event: EventData;
  onRsvp: (
    eventId: string,
    spaceId: string,
    status: 'going' | 'not_going'
  ) => void;
}) {
  const router = useRouter();

  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.standard / 1000,
        delay: 0.15,
        ease: MOTION.ease.premium,
      }}
    >
      <h2 className="text-label text-white/40 uppercase tracking-wider mb-3">
        Up Next
      </h2>
      <motion.button
        type="button"
        onClick={() =>
          router.push(`/s/${event.spaceHandle || event.spaceId}`)
        }
        className="w-full text-left"
        initial="rest"
        whileHover="hover"
        variants={cardHoverVariants}
      >
        <GlassSurface
          intensity="subtle"
          interactive
          className="rounded-xl p-4 border border-white/[0.08]"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-gold-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-white truncate">
                {event.title}
              </p>
              <p className="text-body-sm text-white/50 mt-0.5">
                {formatEventTime(event.startDate)} · {event.spaceName}
              </p>
              {event.rsvpCount !== undefined && event.rsvpCount > 0 && (
                <p className="text-label text-white/30 mt-1">
                  {event.rsvpCount} going
                </p>
              )}
            </div>
            {!event.isGoing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onRsvp(event.id, event.spaceId, 'going');
                }}
                className="text-gold-500/70 hover:text-gold-500 hover:bg-gold-500/10 flex-shrink-0"
              >
                RSVP
              </Button>
            )}
            {event.isGoing && (
              <Badge
                variant="gold"
                size="sm"
                className="flex-shrink-0"
              >
                Going
              </Badge>
            )}
          </div>
        </GlassSurface>
      </motion.button>
    </motion.section>
  );
}

// ============================================
// SECTION: YOUR SPACES
// ============================================

function YourSpaces({ spaces }: { spaces: SpaceData[] }) {
  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.standard / 1000,
        delay: 0.2,
        ease: MOTION.ease.premium,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-label text-white/40 uppercase tracking-wider">
          Your Spaces
        </h2>
        <Link
          href="/explore"
          className="text-label text-white/30 hover:text-white/50 transition-colors"
        >
          Browse all
        </Link>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {spaces.map((space) => (
          <motion.div key={space.id} variants={revealVariants}>
            <Link href={`/s/${space.handle || space.id}`}>
              <motion.div
                initial="rest"
                whileHover="hover"
                variants={cardHoverVariants}
              >
                <GlassSurface
                  intensity="subtle"
                  interactive
                  className="rounded-xl p-4 border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar size="default" className="flex-shrink-0">
                      {space.avatarUrl && (
                        <AvatarImage src={space.avatarUrl} />
                      )}
                      <AvatarFallback className="text-sm bg-white/[0.06]">
                        {getInitials(space.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-body-sm font-medium text-white truncate">
                          {space.name}
                        </span>
                        {(space.unreadCount ?? 0) > 0 && (
                          <Badge
                            variant="gold"
                            size="sm"
                            className="animate-pulse-gold shadow-glow-sm flex-shrink-0"
                          >
                            {space.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {(space.onlineCount ?? 0) > 0 && (
                          <span className="flex items-center gap-1 text-label-sm text-emerald-400/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {space.onlineCount} online
                          </span>
                        )}
                        {space.lastActivityAt && (
                          <span className="text-label-sm text-white/25">
                            {formatRelativeTime(space.lastActivityAt)}
                          </span>
                        )}
                        {!(space.onlineCount ?? 0) &&
                          !space.lastActivityAt &&
                          space.memberCount && (
                            <span className="text-label-sm text-white/25">
                              {space.memberCount} members
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </GlassSurface>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

// ============================================
// SECTION: RECENT ACTIVITY
// ============================================

function ActivityIcon({ type }: { type: ActivityItemData['type'] }) {
  switch (type) {
    case 'new_messages':
      return <MessageCircle className="w-4 h-4 text-white/40" />;
    case 'member_joined':
      return <UserPlus className="w-4 h-4 text-white/40" />;
    case 'event_created':
      return <CalendarPlus className="w-4 h-4 text-white/40" />;
    case 'tool_deployed':
      return <Package className="w-4 h-4 text-white/40" />;
  }
}

function activityDescription(item: ActivityItemData): string {
  switch (item.type) {
    case 'new_messages':
      return `${item.count} new message${(item.count || 0) > 1 ? 's' : ''} in ${item.spaceName}`;
    case 'member_joined':
      return `${item.actorName || 'Someone'} joined ${item.spaceName}`;
    case 'event_created':
      return `${item.actorName ? item.actorName + ' created' : 'New event'} "${item.title}" in ${item.spaceName}`;
    case 'tool_deployed':
      return `${item.actorName ? item.actorName + ' deployed' : 'New tool'} ${item.title ? '"' + item.title + '"' : 'a tool'} to ${item.spaceName}`;
  }
}

function RecentActivity({ activity }: { activity: ActivityItemData[] }) {
  const router = useRouter();
  const items = activity.slice(0, 10);

  if (items.length === 0) return null;

  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.standard / 1000,
        delay: 0.25,
        ease: MOTION.ease.premium,
      }}
    >
      <h2 className="text-label text-white/40 uppercase tracking-wider mb-3">
        Recent Activity
      </h2>

      <motion.div
        className="space-y-0.5"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {items.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => router.push(`/s/${item.spaceHandle}`)}
            className={cn(
              'w-full text-left flex items-center gap-3 rounded-lg',
              'px-3 py-2.5',
              'hover:bg-white/[0.04] transition-colors',
              'group'
            )}
            variants={revealVariants}
          >
            <div className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center flex-shrink-0">
              <ActivityIcon type={item.type} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-white/70 truncate group-hover:text-white/90 transition-colors">
                {activityDescription(item)}
              </p>
            </div>
            <span className="text-label-sm text-white/20 flex-shrink-0">
              {formatRelativeTime(item.timestamp)}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </motion.section>
  );
}

// ============================================
// SECTION: SUGGESTED
// ============================================

function Suggested({ space }: { space: RecommendedSpace }) {
  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.standard / 1000,
        delay: 0.3,
        ease: MOTION.ease.premium,
      }}
    >
      <h2 className="text-label text-white/40 uppercase tracking-wider mb-3">
        Suggested for You
      </h2>
      <Link href={`/s/${space.handle}`}>
        <motion.div
          initial="rest"
          whileHover="hover"
          variants={cardHoverVariants}
        >
          <GlassSurface
            intensity="subtle"
            interactive
            className="rounded-xl p-4 border border-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white/40" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-white truncate">
                  {space.name}
                </p>
                <p className="text-label text-white/40 mt-0.5">
                  {space.reason} · {space.memberCount} members
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />
            </div>
          </GlassSurface>
        </motion.div>
      </Link>
    </motion.section>
  );
}

// ============================================
// NEW USER EMPTY STATE
// ============================================

function NewUserState({
  recommendations,
  loadingRecs,
}: {
  recommendations: RecommendedSpace[];
  loadingRecs: boolean;
}) {
  const router = useRouter();
  const [joiningSpaceId, setJoiningSpaceId] = useState<string | null>(null);
  const [joinedSpaceIds, setJoinedSpaceIds] = useState<Set<string>>(new Set());

  const handleJoinSpace = useCallback(
    async (space: RecommendedSpace) => {
      if (joiningSpaceId || joinedSpaceIds.has(space.id)) return;

      setJoiningSpaceId(space.id);

      try {
        const res = await fetch('/api/spaces/join-v2', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spaceId: space.id,
            joinMethod: 'manual',
          }),
        });

        if (res.ok) {
          const newJoined = new Set(joinedSpaceIds);
          newJoined.add(space.id);
          setJoinedSpaceIds(newJoined);

          // First space joined - redirect into it
          if (joinedSpaceIds.size === 0) {
            router.push(`/s/${space.handle}`);
            return;
          }
        } else {
          logger.error(
            'Failed to join space',
            { component: 'NewUserState', spaceId: space.id },
            undefined
          );
        }
      } catch (error) {
        logger.error(
          'Failed to join space',
          { component: 'NewUserState', spaceId: space.id },
          error instanceof Error ? error : undefined
        );
      } finally {
        setJoiningSpaceId(null);
      }
    },
    [joiningSpaceId, joinedSpaceIds, router]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.standard / 1000,
        delay: 0.15,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Header message */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-gold-500" />
        </div>
        <h2 className="text-body-lg font-semibold text-white mb-1">
          Find your first space
        </h2>
        <p className="text-body-sm text-white/40 max-w-sm mx-auto">
          Spaces are where students organize, build, and connect. Join one to get started.
        </p>
      </div>

      {/* Recommended spaces with join buttons */}
      {!loadingRecs && recommendations.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: MOTION.duration.standard / 1000,
            delay: 0.3,
            ease: MOTION.ease.premium,
          }}
        >
          <h2 className="text-label text-white/40 uppercase tracking-wider mb-3">
            Recommended for You
          </h2>
          <motion.div
            className="space-y-3"
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
          >
            {recommendations.slice(0, 5).map((space) => {
              const isJoining = joiningSpaceId === space.id;
              const hasJoined = joinedSpaceIds.has(space.id);

              return (
                <motion.div key={space.id} variants={revealVariants}>
                  <motion.div
                    initial="rest"
                    whileHover="hover"
                    variants={cardHoverVariants}
                  >
                    <GlassSurface
                      intensity="subtle"
                      interactive
                      className="rounded-xl p-4 border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-white/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body font-medium text-white truncate">
                            {space.name}
                          </p>
                          <p className="text-label text-white/40 mt-0.5">
                            {space.reason} · {space.memberCount} members
                          </p>
                        </div>
                        {hasJoined ? (
                          <Badge
                            variant="gold"
                            size="sm"
                            className="flex-shrink-0"
                          >
                            Joined
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleJoinSpace(space);
                            }}
                            disabled={isJoining}
                            className="text-gold-500/70 hover:text-gold-500 hover:bg-gold-500/10 flex-shrink-0"
                          >
                            {isJoining ? 'Joining...' : 'Join'}
                          </Button>
                        )}
                      </div>
                    </GlassSurface>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Explore all CTA */}
          <div className="mt-6 text-center">
            <Button variant="cta" size="lg" asChild>
              <Link href="/explore">
                Explore All Spaces
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </motion.section>
      )}

      {/* No recommendations - just show CTA */}
      {!loadingRecs && recommendations.length === 0 && (
        <div className="text-center">
          <Button variant="cta" size="lg" asChild>
            <Link href="/explore">
              Explore Spaces
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}

      {loadingRecs && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
                  <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
                </div>
                <div className="h-8 w-14 bg-white/[0.04] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-foundation-gray-1000">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-4 w-40 bg-white/[0.04] rounded mt-2 animate-pulse" />
        </div>
        {/* Cards skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
                  <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch spaces via React Query
  const { data: spacesData, isLoading: loadingSpaces } = useQuery({
    queryKey: queryKeys.home.mySpaces(),
    queryFn: async () => {
      const res = await fetch('/api/profile/my-spaces', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch spaces');
      const data = await res.json();
      return (data.spaces || []) as SpaceData[];
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!user && !authLoading,
  });

  // Fetch dashboard (events + recommendations) via React Query
  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
    queryKey: queryKeys.home.dashboard(true),
    queryFn: async () => {
      const res = await fetch('/api/profile/dashboard?includeRecommendations=true', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      const raw = await res.json();
      const dashboard = raw.dashboard || {};

      const events: EventData[] = (dashboard.upcomingEvents || []).map(
        (e: Record<string, unknown>) => ({
          id: e.id as string,
          title: e.title as string,
          description: e.description as string | undefined,
          startDate: e.startDate as string,
          endDate: e.endDate as string | undefined,
          spaceId: e.spaceId as string,
          spaceName: e.spaceName as string,
          spaceHandle: e.spaceHandle as string | undefined,
          rsvpCount: e.rsvpCount as number | undefined,
          isGoing: e.isGoing as boolean | undefined,
          isLive: e.isLive as boolean | undefined,
          location: e.location as string | undefined,
          isOnline: e.isOnline as boolean | undefined,
        })
      );

      const recommendations: RecommendedSpace[] =
        dashboard.recommendations?.spaces || [];

      return { events, recommendations };
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!user && !authLoading,
  });

  // Fetch activity feed via React Query
  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: queryKeys.home.activity(10),
    queryFn: async () => {
      const res = await fetch('/api/activity-feed?limit=10', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch activity feed');
      const data = await res.json();
      return (data.data?.activity || []) as ActivityItemData[];
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!user && !authLoading,
  });

  // Derive data from query results
  const spaces = spacesData ?? [];
  const allEvents = dashboardData?.events ?? [];
  const recommendations = dashboardData?.recommendations ?? [];
  const activityItems = activityData ?? [];

  const loadingStates = {
    spaces: loadingSpaces,
    dashboard: loadingDashboard,
    activity: loadingActivity,
  };

  // Mark feed as viewed after 5 seconds
  useEffect(() => {
    if (authLoading || !user) return;

    const markViewedTimeout = setTimeout(() => {
      fetch('/api/feed/updates?action=mark_viewed&itemIds=feed_view', {
        method: 'POST',
        credentials: 'include',
      }).catch((error) =>
        logger.error(
          'Failed to mark feed as viewed',
          { component: 'HomePage' },
          error instanceof Error ? error : undefined
        )
      );
    }, 5000);

    return () => clearTimeout(markViewedTimeout);
  }, [authLoading, user]);

  // RSVP handler
  const handleEventRsvp = useCallback(
    async (
      eventId: string,
      spaceId: string,
      status: 'going' | 'not_going'
    ) => {
      try {
        const res = await fetch(
          `/api/spaces/${spaceId}/events/${eventId}/rsvp`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          }
        );

        if (res.ok) {
          // Optimistically update the dashboard cache
          queryClient.setQueryData(
            queryKeys.home.dashboard(true),
            (prev: { events: EventData[]; recommendations: RecommendedSpace[] } | undefined) => {
              if (!prev) return prev;
              return {
                ...prev,
                events: prev.events.map((e) =>
                  e.id === eventId
                    ? {
                        ...e,
                        isGoing: status === 'going',
                        rsvpCount:
                          status === 'going'
                            ? (e.rsvpCount || 0) + 1
                            : Math.max(0, (e.rsvpCount || 0) - 1),
                      }
                    : e
                ),
              };
            }
          );
        }
      } catch (error) {
        logger.error(
          'Failed to RSVP to event',
          { component: 'HomePage', eventId },
          error instanceof Error ? error : undefined
        );
      }
    },
    [queryClient]
  );

  // Derived data
  const firstName = useMemo(
    () =>
      user?.displayName?.split(' ')[0] ||
      user?.fullName?.split(' ')[0] ||
      '',
    [user?.displayName, user?.fullName]
  );

  const isNewUser = useMemo(
    () => !loadingStates.spaces && spaces.length === 0,
    [loadingStates.spaces, spaces.length]
  );

  const nextEvent = useMemo(() => {
    const upcoming = allEvents
      .filter((e) => isWithin24Hours(e.startDate) || e.isLive)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    return upcoming[0] || null;
  }, [allEvents]);

  // Pick one recommendation to show (first one that user hasn't joined)
  const suggestedSpace = useMemo(() => {
    if (isNewUser || recommendations.length === 0) return null;
    const spaceIds = new Set(spaces.map((s) => s.id));
    return recommendations.find((r) => !spaceIds.has(r.id)) || null;
  }, [recommendations, spaces, isNewUser]);

  // Loading state
  if (authLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="min-h-screen bg-foundation-gray-1000">
      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* 1. Header */}
        <HomeHeader firstName={firstName} />

        {isNewUser ? (
          /* New user path */
          <NewUserState
            recommendations={recommendations}
            loadingRecs={loadingStates.dashboard}
          />
        ) : (
          /* Returning user path */
          <>
            {/* 2. Happening Now */}
            {!loadingStates.spaces && (
              <HappeningNow spaces={spaces} />
            )}

            {/* 3. Up Next */}
            {!loadingStates.dashboard && nextEvent && (
              <UpNext event={nextEvent} onRsvp={handleEventRsvp} />
            )}

            {/* 4. Your Spaces */}
            {loadingStates.spaces ? (
              <div className="mb-8">
                <div className="h-4 w-24 bg-white/[0.04] rounded mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/[0.04]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
                          <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              spaces.length > 0 && <YourSpaces spaces={spaces} />
            )}

            {/* 5. Recent Activity */}
            {loadingStates.activity ? (
              <div className="mb-8">
                <div className="h-4 w-28 bg-white/[0.04] rounded mb-3" />
                <div className="space-y-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <div className="w-7 h-7 rounded-md bg-white/[0.04] animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 bg-white/[0.04] rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <RecentActivity activity={activityItems} />
            )}

            {/* 6. Suggested */}
            {!loadingStates.dashboard && suggestedSpace && (
              <Suggested space={suggestedSpace} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

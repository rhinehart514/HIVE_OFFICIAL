'use client';

/**
 * /home — Unified Dashboard (Home)
 *
 * Merged Feed + Spaces into single unified experience.
 * This is the primary landing after authentication.
 *
 * Sections (priority order):
 * 1. Today (events + unread messages) — PRIMARY
 * 2. Your Spaces (navigation tiles with activity dots) — SECONDARY
 * 3. This Week (upcoming events) — SECONDARY
 * 4. Your Creations (HiveLab tools) — TERTIARY
 * 5. Discover (recommendations) — TERTIARY
 *
 * Includes welcome overlay for first-time users from /spaces.
 *
 * @version 1.0.0 - IA Unification (Jan 2026)
 */

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import {
  Tilt,
  GlassSurface,
  GradientText,
  Badge,
  MOTION,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

// Feed components (shared)
import { FeedEmptyState } from '../feed/components/FeedEmptyState';
import { DensityToggle } from '../feed/components/DensityToggle';
import { useFeedDensity } from '../feed/hooks/useFeedDensity';
import {
  FEED_HIERARCHY,
  SECTION_PRIORITY,
  SECTION_DELAYS,
  type FeedSection,
} from '../feed/feed-tokens';

// Welcome overlay for first-time users
import { WelcomeOverlay } from '../spaces/components/WelcomeOverlay';

// Storage keys
const STORAGE_KEY_WELCOME = 'hive-welcome-completed';
const STORAGE_KEY_ENTRY_DATE = 'hive-entry-completed-at';
const ONBOARDING_DAYS = 7;

// ============================================
// TYPES
// ============================================

interface SpaceData {
  id: string;
  name: string;
  handle?: string;
  description?: string;
  memberCount?: number;
  onlineCount?: number;
  unreadCount?: number;
  role?: string;
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
}

interface ToolData {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  status: string;
  responseCount?: number;
  deployCount?: number;
}

interface RecommendedSpace {
  id: string;
  name: string;
  handle: string;
  reason: string;
  memberCount: number;
  category?: string;
}

interface FeedUpdateData {
  hasNewPosts: boolean;
  newPostCount: number;
  lastViewedAt: string | null;
  lastPostAt: string | null;
}

// ============================================
// HELPERS
// ============================================

function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isThisWeek(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return date > now && date <= weekFromNow;
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 0) return 'Past';
  if (diffHours < 1) return 'Starting soon';
  if (diffHours < 24) return `In ${diffHours}h`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) {
    return (
      date.toLocaleDateString('en-US', { weekday: 'short' }) +
      ' ' +
      date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    );
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTimeSince(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 5) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================
// SECTION WRAPPER
// ============================================

interface SectionProps {
  section: FeedSection;
  title: string;
  action?: string;
  actionHref?: string;
  children: React.ReactNode;
  className?: string;
}

function Section({ section, title, action, actionHref, children, className }: SectionProps) {
  const hierarchy = FEED_HIERARCHY[SECTION_PRIORITY[section]];
  const delay = SECTION_DELAYS[section];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.base,
        delay,
        ease: MOTION.ease.premium,
      }}
      className={cn('mb-10', className)}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={cn('tracking-wide', hierarchy.title)}>
          {title}
        </h2>
        {action && actionHref && (
          <Link
            href={actionHref}
            className="text-label text-white/30 hover:text-white/50 transition-colors"
          >
            {action} →
          </Link>
        )}
      </div>
      {children}
    </motion.section>
  );
}

// ============================================
// TODAY SECTION
// ============================================

function TodaySection({
  events,
  unreadSpaces,
  loading,
  density,
}: {
  events: EventData[];
  unreadSpaces: SpaceData[];
  loading: boolean;
  density: ReturnType<typeof useFeedDensity>['config'];
}) {
  const router = useRouter();
  const hierarchy = FEED_HIERARCHY.primary;

  if (loading) {
    return (
      <Section section="today" title="Today">
        <div className={cn('space-y-3', density.cardGap)}>
          {[1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl animate-pulse',
                density.cardPadding,
                hierarchy.cardBg,
                'border',
                hierarchy.cardBorder
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
                  <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    );
  }

  const hasContent = events.length > 0 || unreadSpaces.length > 0;

  if (!hasContent) {
    return (
      <Section section="today" title="Today">
        <FeedEmptyState variant="today" />
      </Section>
    );
  }

  return (
    <Section section="today" title="Today">
      <div className={cn('space-y-3', density.cardGap)}>
        {/* Live events first */}
        {events
          .filter((e) => e.isLive)
          .map((event) => (
            <Tilt key={event.id} intensity={density.tiltIntensity}>
              <button
                type="button"
                onClick={() => router.push(`/s/${event.spaceHandle || event.spaceId}`)}
                className="w-full text-left"
              >
                <GlassSurface
                  intensity="subtle"
                  className={cn(
                    'rounded-xl border border-gold-500/20',
                    density.cardPadding
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-body font-medium text-white truncate">
                          {event.title}
                        </span>
                        <Badge variant="gold" size="sm">
                          Live
                        </Badge>
                      </div>
                      <p className="text-label text-white/50 mt-0.5">
                        {event.spaceName}
                        {event.rsvpCount ? ` · ${event.rsvpCount} attending` : ''}
                      </p>
                    </div>
                  </div>
                </GlassSurface>
              </button>
            </Tilt>
          ))}

        {/* Today's events */}
        {events
          .filter((e) => !e.isLive)
          .map((event) => (
            <Tilt key={event.id} intensity={density.tiltIntensity}>
              <button
                type="button"
                onClick={() => router.push(`/s/${event.spaceHandle || event.spaceId}`)}
                className="w-full text-left"
              >
                <GlassSurface
                  intensity="subtle"
                  className={cn('rounded-xl', density.cardPadding)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-title-sm">
                      📅
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-body font-medium text-white truncate">
                          {event.title}
                        </span>
                        <span className="text-label-sm text-white/40">
                          {formatEventTime(event.startDate)}
                        </span>
                      </div>
                      <p className="text-label text-white/50 mt-0.5">
                        {event.spaceName}
                        {event.isGoing && " · You're going"}
                        {event.rsvpCount ? ` · ${event.rsvpCount} going` : ''}
                      </p>
                    </div>
                  </div>
                </GlassSurface>
              </button>
            </Tilt>
          ))}

        {/* Unread messages */}
        {unreadSpaces.map((space) => (
          <Tilt key={space.id} intensity={density.tiltIntensity}>
            <button
              type="button"
              onClick={() => router.push(`/s/${space.handle || space.id}`)}
              className="w-full text-left"
            >
              <GlassSurface
                intensity="subtle"
                className={cn('rounded-xl', density.cardPadding)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-title-sm">
                    💬
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-body font-medium text-white truncate">
                        {space.unreadCount} new in {space.name}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-gold-500" />
                    </div>
                    <p className="text-label text-white/50 mt-0.5">Jump back in →</p>
                  </div>
                </div>
              </GlassSurface>
            </button>
          </Tilt>
        ))}
      </div>
    </Section>
  );
}

// ============================================
// YOUR SPACES SECTION
// ============================================

function YourSpacesSection({
  spaces,
  loading,
  density,
}: {
  spaces: SpaceData[];
  loading: boolean;
  density: ReturnType<typeof useFeedDensity>['config'];
}) {
  const maxItems = density.maxItems.spaces;

  if (loading) {
    return (
      <Section section="spaces" title="Your Spaces" action="Browse" actionHref="/explore">
        <div className={cn('grid grid-cols-2 md:grid-cols-4', density.cardGap)}>
          {Array.from({ length: maxItems + 1 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      </Section>
    );
  }

  if (spaces.length === 0) {
    return (
      <Section section="spaces" title="Your Spaces" action="Browse" actionHref="/explore">
        <FeedEmptyState variant="spaces" />
      </Section>
    );
  }

  return (
    <Section section="spaces" title="Your Spaces" action="Browse" actionHref="/explore">
      <div className={cn('grid grid-cols-2 md:grid-cols-4', density.cardGap)}>
        {spaces.slice(0, maxItems).map((space) => (
          <Tilt key={space.id} intensity={density.tiltIntensity + 1}>
            <Link href={`/s/${space.handle || space.id}`}>
              <GlassSurface
                intensity="subtle"
                interactive
                className={cn(
                  'aspect-square rounded-xl flex flex-col justify-between',
                  density.cardPadding
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-medium text-white truncate flex-1">
                    {space.name}
                  </span>
                  {(space.onlineCount ?? 0) > 0 && (
                    <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-label-sm text-white/40">
                  {space.memberCount && <span>{space.memberCount} members</span>}
                  {(space.unreadCount ?? 0) > 0 && (
                    <Badge variant="gold" size="sm">
                      {space.unreadCount}
                    </Badge>
                  )}
                </div>
              </GlassSurface>
            </Link>
          </Tilt>
        ))}

        {/* Browse tile */}
        <Tilt intensity={density.tiltIntensity + 1}>
          <Link href="/explore">
            <GlassSurface
              intensity="subtle"
              interactive
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center border-dashed',
                density.cardPadding
              )}
            >
              <span className="text-title-lg mb-2">+</span>
              <span className="text-label text-white/40">Browse All</span>
            </GlassSurface>
          </Link>
        </Tilt>
      </div>
    </Section>
  );
}

// ============================================
// THIS WEEK SECTION
// ============================================

function ThisWeekSection({
  events,
  loading,
  density,
}: {
  events: EventData[];
  loading: boolean;
  density: ReturnType<typeof useFeedDensity>['config'];
}) {
  const router = useRouter();
  const maxItems = density.maxItems.events;

  if (loading) {
    return (
      <Section section="events" title="This Week" action="All events" actionHref="/explore?tab=events">
        <div className={cn('space-y-2', density.cardGap)}>
          {[1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse',
                density.cardPadding
              )}
            >
              <div className="h-4 w-3/4 bg-white/[0.06] rounded mb-2" />
              <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
            </div>
          ))}
        </div>
      </Section>
    );
  }

  if (events.length === 0) {
    return (
      <Section section="events" title="This Week" action="All events" actionHref="/explore?tab=events">
        <FeedEmptyState variant="events" compact />
      </Section>
    );
  }

  return (
    <Section section="events" title="This Week" action="All events" actionHref="/explore?tab=events">
      <div className={cn('space-y-2', density.cardGap)}>
        {events.slice(0, maxItems).map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => router.push(`/s/${event.spaceHandle || event.spaceId}`)}
            className="w-full text-left"
          >
            <GlassSurface
              intensity="subtle"
              interactive
              className={cn('rounded-xl', density.cardPadding)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-medium text-white truncate">
                      {event.title}
                    </span>
                  </div>
                  <p className="text-label-sm text-white/40 mt-0.5">
                    {event.spaceName} · {formatEventTime(event.startDate)}
                    {event.rsvpCount ? ` · ${event.rsvpCount} going` : ''}
                  </p>
                </div>
                <span className="text-white/20">→</span>
              </div>
            </GlassSurface>
          </button>
        ))}
      </div>
    </Section>
  );
}

// ============================================
// YOUR CREATIONS SECTION
// ============================================

function YourCreationsSection({
  tools,
  loading,
  isBuilder,
  density,
}: {
  tools: ToolData[];
  loading: boolean;
  isBuilder: boolean;
  density: ReturnType<typeof useFeedDensity>['config'];
}) {
  const maxItems = density.maxItems.tools;

  if (!isBuilder) return null;

  if (loading) {
    return (
      <Section section="creations" title="Your Creations" action="Lab" actionHref="/lab">
        <div className={cn('grid grid-cols-2 md:grid-cols-4', density.cardGap)}>
          {Array.from({ length: maxItems + 1 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      </Section>
    );
  }

  if (tools.length === 0) {
    return (
      <Section section="creations" title="Your Creations" action="Lab" actionHref="/lab">
        <FeedEmptyState variant="creations" />
      </Section>
    );
  }

  return (
    <Section section="creations" title="Your Creations" action="Lab" actionHref="/lab">
      <div className={cn('grid grid-cols-2 md:grid-cols-4', density.cardGap)}>
        {tools.slice(0, maxItems).map((tool) => (
          <Tilt key={tool.id} intensity={density.tiltIntensity + 1}>
            <Link href={`/lab/${tool.id}`}>
              <GlassSurface
                intensity="subtle"
                interactive
                className={cn(
                  'aspect-square rounded-xl flex flex-col justify-between',
                  density.cardPadding
                )}
              >
                <span className="text-title">{tool.icon || '🛠️'}</span>
                <div>
                  <p className="text-body-sm font-medium text-white truncate">
                    {tool.name}
                  </p>
                  {tool.responseCount !== undefined && tool.responseCount > 0 && (
                    <p className="text-label-sm text-white/40 mt-0.5">
                      {tool.responseCount} responses
                    </p>
                  )}
                </div>
              </GlassSurface>
            </Link>
          </Tilt>
        ))}

        {/* Create tile */}
        <Tilt intensity={density.tiltIntensity + 1}>
          <Link href="/lab/new">
            <GlassSurface
              intensity="subtle"
              interactive
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center border-dashed',
                density.cardPadding
              )}
            >
              <span className="text-title-lg mb-2">+</span>
              <span className="text-label text-white/40">Create Tool</span>
            </GlassSurface>
          </Link>
        </Tilt>
      </div>
    </Section>
  );
}

// ============================================
// DISCOVER SECTION
// ============================================

function DiscoverSection({
  recommendations,
  loading,
  density,
}: {
  recommendations: RecommendedSpace[];
  loading: boolean;
  density: ReturnType<typeof useFeedDensity>['config'];
}) {
  const maxItems = density.maxItems.discover;

  if (loading) {
    return (
      <Section section="discover" title="Discover">
        <div className={cn('space-y-3', density.cardGap)}>
          <div className={cn(
            'rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse',
            density.cardPadding
          )}>
            <div className="h-4 w-3/4 bg-white/[0.06] rounded mb-2" />
            <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
          </div>
        </div>
      </Section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Section section="discover" title="Discover" action="Explore" actionHref="/explore">
        <FeedEmptyState variant="discover" compact />
      </Section>
    );
  }

  return (
    <Section section="discover" title="Discover" action="Explore" actionHref="/explore">
      <div className={cn('space-y-3', density.cardGap)}>
        {recommendations.slice(0, maxItems).map((space) => (
          <Tilt key={space.id} intensity={density.tiltIntensity}>
            <Link href={`/s/${space.handle}`}>
              <GlassSurface
                intensity="subtle"
                interactive
                className={cn('rounded-xl', density.cardPadding)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-title-sm">
                    ✨
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-white truncate">
                      {space.name}
                    </p>
                    <p className="text-label text-white/50 mt-0.5">
                      {space.reason} · {space.memberCount} members
                    </p>
                  </div>
                </div>
              </GlassSurface>
            </Link>
          </Tilt>
        ))}
      </div>
    </Section>
  );
}

// ============================================
// QUICK ACTIONS SIDEBAR
// ============================================

function QuickActions() {
  return (
    <GlassSurface intensity="subtle" className="p-5 rounded-xl">
      <h3 className="text-label font-medium text-white/40 tracking-wide mb-4">
        Quick Actions
      </h3>
      <div className="space-y-2">
        <Link
          href="/lab/new"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <span className="text-body-lg">🛠️</span>
          <span className="text-body-sm text-white/70">Build a Tool</span>
        </Link>
        <Link
          href="/explore"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <span className="text-body-lg">🏠</span>
          <span className="text-body-sm text-white/70">Find Spaces</span>
        </Link>
        <Link
          href="/explore?tab=events"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <span className="text-body-lg">📅</span>
          <span className="text-body-sm text-white/70">Browse Events</span>
        </Link>
      </div>
    </GlassSurface>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { density, setDensity, config: densityConfig, isLoaded: densityLoaded } = useFeedDensity();

  // Welcome overlay state
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [isInOnboarding, setIsInOnboarding] = useState(false);

  // Data states
  const [spaces, setSpaces] = useState<SpaceData[]>([]);
  const [todayEvents, setTodayEvents] = useState<EventData[]>([]);
  const [weekEvents, setWeekEvents] = useState<EventData[]>([]);
  const [tools, setTools] = useState<ToolData[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedSpace[]>([]);
  const [unreadSpaces, setUnreadSpaces] = useState<SpaceData[]>([]);
  const [feedUpdate, setFeedUpdate] = useState<FeedUpdateData | null>(null);

  // Partial loading states
  const [loadingStates, setLoadingStates] = useState({
    spaces: true,
    events: true,
    tools: true,
    feedUpdate: true,
  });

  // Check localStorage for welcome/onboarding state
  useEffect(() => {
    const welcomed = localStorage.getItem(STORAGE_KEY_WELCOME) === 'true';
    setHasSeenWelcome(welcomed);

    const entryDate = localStorage.getItem(STORAGE_KEY_ENTRY_DATE);
    if (entryDate) {
      const daysSinceEntry = (Date.now() - parseInt(entryDate, 10)) / (1000 * 60 * 60 * 24);
      setIsInOnboarding(daysSinceEntry < ONBOARDING_DAYS);
    } else if (!welcomed) {
      localStorage.setItem(STORAGE_KEY_ENTRY_DATE, Date.now().toString());
      setIsInOnboarding(true);
    }
  }, []);

  const completeWelcome = () => {
    localStorage.setItem(STORAGE_KEY_WELCOME, 'true');
    if (!localStorage.getItem(STORAGE_KEY_ENTRY_DATE)) {
      localStorage.setItem(STORAGE_KEY_ENTRY_DATE, Date.now().toString());
    }
    setHasSeenWelcome(true);
  };

  // Fetch feed data
  useEffect(() => {
    if (authLoading || !user) return;

    setLoadingStates({
      spaces: true,
      events: true,
      tools: true,
      feedUpdate: true,
    });

    // Fetch spaces
    fetch('/api/profile/my-spaces', { credentials: 'include' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          const allSpaces = (data.spaces || []) as SpaceData[];
          setSpaces(allSpaces);
          setUnreadSpaces(allSpaces.filter((s: SpaceData) => (s.unreadCount ?? 0) > 0));
        }
      })
      .catch((error) => logger.error('Failed to fetch spaces', { component: 'HomePage' }, error instanceof Error ? error : undefined))
      .finally(() => setLoadingStates((prev) => ({ ...prev, spaces: false })));

    // Fetch dashboard
    fetch('/api/profile/dashboard?includeRecommendations=true', { credentials: 'include' })
      .then(async (res) => {
        if (res.ok) {
          const dashboardData = await res.json();
          const dashboard = dashboardData.dashboard || {};

          const allEvents: EventData[] = (dashboard.upcomingEvents || []).map(
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
            })
          );

          setTodayEvents(allEvents.filter((e) => isToday(e.startDate)));
          setWeekEvents(allEvents.filter((e) => !isToday(e.startDate) && isThisWeek(e.startDate)));

          if (dashboard.recommendations?.spaces) {
            setRecommendations(dashboard.recommendations.spaces);
          }
        }
      })
      .catch((error) => logger.error('Failed to fetch dashboard', { component: 'HomePage' }, error instanceof Error ? error : undefined))
      .finally(() => setLoadingStates((prev) => ({ ...prev, events: false })));

    // Fetch tools
    fetch('/api/tools?limit=10', { credentials: 'include' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setTools(data.tools || []);
        }
      })
      .catch((error) => logger.error('Failed to fetch tools', { component: 'HomePage' }, error instanceof Error ? error : undefined))
      .finally(() => setLoadingStates((prev) => ({ ...prev, tools: false })));

    // Fetch feed updates
    fetch('/api/feed/updates?action=check', { credentials: 'include' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.data?.update) {
            setFeedUpdate({
              hasNewPosts: data.data.update.hasNewPosts,
              newPostCount: data.data.update.newPostCount,
              lastViewedAt: data.data.update.lastCheckedAt,
              lastPostAt: data.data.update.lastPostAt,
            });
          }
        }
      })
      .catch((error) => logger.error('Failed to fetch feed updates', { component: 'HomePage' }, error instanceof Error ? error : undefined))
      .finally(() => setLoadingStates((prev) => ({ ...prev, feedUpdate: false })));

    // Mark feed as viewed after 5 seconds
    const markViewedTimeout = setTimeout(() => {
      fetch('/api/feed/updates?action=mark_viewed&itemIds=feed_view', {
        method: 'POST',
        credentials: 'include',
      }).catch((error) => logger.error('Failed to mark feed as viewed', { component: 'HomePage' }, error instanceof Error ? error : undefined));
    }, 5000);

    return () => clearTimeout(markViewedTimeout);
  }, [authLoading, user]);

  const allDataLoaded = !loadingStates.spaces && !loadingStates.events && !loadingStates.tools;

  const isAllEmpty = useMemo(() => {
    if (!allDataLoaded) return false;
    const hasToday = todayEvents.length > 0 || unreadSpaces.length > 0;
    const hasSpaces = spaces.length > 0;
    const hasWeek = weekEvents.length > 0;
    const hasCreations = (user?.isBuilder ?? false) && tools.length > 0;
    const hasDiscover = recommendations.length > 0;
    return !hasToday && !hasSpaces && !hasWeek && !hasCreations && !hasDiscover;
  }, [allDataLoaded, todayEvents, unreadSpaces, spaces, weekEvents, tools, recommendations, user?.isBuilder]);

  // Loading state
  if (authLoading || !densityLoaded || hasSeenWelcome === null) {
    return (
      <div className="min-h-screen bg-foundation-gray-1000">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="h-10 w-64 bg-white/[0.06] rounded mb-8 animate-pulse" />
          <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-4 w-24 bg-white/[0.04] rounded" />
                  <div className="h-32 bg-white/[0.02] border border-white/[0.06] rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
            <div className="hidden lg:block">
              <div className="h-48 bg-white/[0.02] border border-white/[0.06] rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show welcome overlay for first-time users
  if (!hasSeenWelcome && user) {
    const firstName = user.fullName?.split(' ')[0] || 'Builder';
    return (
      <WelcomeOverlay
        firstName={firstName}
        major={user.major}
        graduationYear={user.graduationYear}
        onComplete={completeWelcome}
      />
    );
  }

  const firstName = user?.displayName?.split(' ')[0] || user?.fullName?.split(' ')[0] || '';

  // Page-level empty state
  if (isAllEmpty) {
    return (
      <div className="min-h-screen bg-foundation-gray-1000">
        <div className="border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
            >
              <h1 className="text-title-lg font-semibold text-white">
                {getGreeting()}
                {firstName && (
                  <>
                    , <GradientText variant="gold">{firstName}</GradientText>
                  </>
                )}
              </h1>
              <p className="text-body text-white/50 mt-1">
                Here's what's happening in your world
              </p>
            </motion.div>
          </div>
        </div>

        <main className="max-w-xl mx-auto px-6 py-16">
          <FeedEmptyState variant="page" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foundation-gray-1000">
      {/* Header */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
            >
              <h1 className="text-title-lg font-semibold text-white">
                {getGreeting()}
                {firstName && (
                  <>
                    , <GradientText variant="gold">{firstName}</GradientText>
                  </>
                )}
              </h1>
              {feedUpdate && feedUpdate.hasNewPosts && feedUpdate.newPostCount > 0 ? (
                <motion.p
                  className="text-body text-white/50 mt-1 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                    <span className="text-gold-500">
                      {feedUpdate.newPostCount} new
                    </span>
                  </span>
                  {feedUpdate.lastViewedAt && (
                    <span>since you were here {formatTimeSince(feedUpdate.lastViewedAt)}</span>
                  )}
                </motion.p>
              ) : (
                <p className="text-body text-white/50 mt-1">
                  Here's what's happening in your world
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <DensityToggle value={density} onChange={setDensity} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className={cn('grid lg:grid-cols-[1fr_280px]', densityConfig.sectionGap)}>
          <div>
            <TodaySection
              events={todayEvents}
              unreadSpaces={unreadSpaces}
              loading={loadingStates.events}
              density={densityConfig}
            />

            <YourSpacesSection
              spaces={spaces}
              loading={loadingStates.spaces}
              density={densityConfig}
            />

            <ThisWeekSection
              events={weekEvents}
              loading={loadingStates.events}
              density={densityConfig}
            />

            <YourCreationsSection
              tools={tools}
              loading={loadingStates.tools}
              isBuilder={user?.isBuilder ?? false}
              density={densityConfig}
            />

            <DiscoverSection
              recommendations={recommendations}
              loading={loadingStates.events}
              density={densityConfig}
            />
          </div>

          <aside className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: MOTION.duration.base,
                delay: 0.3,
                ease: MOTION.ease.premium,
              }}
              className="sticky top-24"
            >
              <QuickActions />
            </motion.div>
          </aside>
        </div>
      </main>
    </div>
  );
}

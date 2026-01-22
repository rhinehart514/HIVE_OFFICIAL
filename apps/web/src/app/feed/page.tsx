'use client';

/**
 * /feed - The Pulse
 *
 * Dynamic dashboard that anticipates needs.
 * Premium motion, presence indicators, activity signals.
 *
 * Sections:
 * - Today (events + unread messages)
 * - Your Spaces (navigation tiles with activity dots)
 * - This Week (upcoming events)
 * - Your Creations (HiveLab tools)
 * - Discover (recommendations)
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import {
  Tilt,
  GlassSurface,
  GradientText,
  Badge,
  Button,
  MOTION,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

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

// ============================================
// SECTION COMPONENTS
// ============================================

interface SectionProps {
  title: string;
  action?: string;
  actionHref?: string;
  children: React.ReactNode;
  delay?: number;
}

function Section({ title, action, actionHref, children, delay = 0 }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.base,
        delay,
        ease: MOTION.ease.premium,
      }}
      className="mb-10"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[12px] font-medium text-white/40 uppercase tracking-wider">
          {title}
        </h2>
        {action && actionHref && (
          <Link
            href={actionHref}
            className="text-[12px] text-white/30 hover:text-white/50 transition-colors"
          >
            {action} →
          </Link>
        )}
      </div>
      {children}
    </motion.section>
  );
}

// TODAY Section
function TodaySection({
  events,
  unreadSpaces,
  loading,
}: {
  events: EventData[];
  unreadSpaces: SpaceData[];
  loading: boolean;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <Section title="Today" delay={0.1}>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
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
      <Section title="Today" delay={0.1}>
        <GlassSurface intensity="subtle" className="p-6 rounded-xl text-center">
          <p className="text-[14px] text-white/50 mb-4">
            Nothing on your plate today. Enjoy the calm.
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/explore?tab=events">Browse events</Link>
          </Button>
        </GlassSurface>
      </Section>
    );
  }

  return (
    <Section title="Today" delay={0.1}>
      <div className="space-y-3">
        {/* Live events first */}
        {events
          .filter((e) => e.isLive)
          .map((event) => (
            <Tilt key={event.id} intensity={4}>
              <button
                type="button"
                onClick={() => router.push(`/s/${event.spaceHandle || event.spaceId}`)}
                className="w-full text-left"
              >
                <GlassSurface
                  intensity="subtle"
                  className="p-4 rounded-xl border border-[var(--life-gold)]/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--life-gold)]/10 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-[var(--life-gold)] animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-white truncate">
                          {event.title}
                        </span>
                        <Badge variant="gold" size="sm">
                          Live
                        </Badge>
                      </div>
                      <p className="text-[12px] text-white/50 mt-0.5">
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
            <Tilt key={event.id} intensity={4}>
              <button
                type="button"
                onClick={() => router.push(`/s/${event.spaceHandle || event.spaceId}`)}
                className="w-full text-left"
              >
                <GlassSurface intensity="subtle" className="p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-[18px]">
                      📅
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-white truncate">
                          {event.title}
                        </span>
                        <span className="text-[11px] text-white/40">
                          {formatEventTime(event.startDate)}
                        </span>
                      </div>
                      <p className="text-[12px] text-white/50 mt-0.5">
                        {event.spaceName}
                        {event.isGoing && ' · You\'re going'}
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
          <Tilt key={space.id} intensity={4}>
            <button
              type="button"
              onClick={() => router.push(`/s/${space.handle || space.id}`)}
              className="w-full text-left"
            >
              <GlassSurface intensity="subtle" className="p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-[18px]">
                    💬
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-white truncate">
                        {space.unreadCount} new in {space.name}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[var(--life-gold)]" />
                    </div>
                    <p className="text-[12px] text-white/50 mt-0.5">Jump back in →</p>
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

// YOUR SPACES Section
function YourSpacesSection({
  spaces,
  loading,
}: {
  spaces: SpaceData[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Section title="Your Spaces" action="Browse" actionHref="/spaces" delay={0.2}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section title="Your Spaces" action="Browse" actionHref="/spaces" delay={0.2}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {spaces.slice(0, 3).map((space, i) => (
          <Tilt key={space.id} intensity={6}>
            <Link href={`/s/${space.handle || space.id}`}>
              <GlassSurface
                intensity="subtle"
                interactive
                className="aspect-square rounded-xl p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-white truncate flex-1">
                    {space.name}
                  </span>
                  {(space.onlineCount ?? 0) > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[var(--life-gold)] animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/40">
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
        <Tilt intensity={6}>
          <Link href="/spaces">
            <GlassSurface
              intensity="subtle"
              interactive
              className="aspect-square rounded-xl p-4 flex flex-col items-center justify-center border-dashed"
            >
              <span className="text-[24px] mb-2">+</span>
              <span className="text-[12px] text-white/40">Browse All</span>
            </GlassSurface>
          </Link>
        </Tilt>
      </div>
    </Section>
  );
}

// THIS WEEK Section
function ThisWeekSection({
  events,
  loading,
}: {
  events: EventData[];
  loading: boolean;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <Section title="This Week" action="All events" actionHref="/explore?tab=events" delay={0.3}>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
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
      <Section title="This Week" action="All events" actionHref="/explore?tab=events" delay={0.3}>
        <GlassSurface intensity="subtle" className="p-6 rounded-xl text-center">
          <p className="text-[14px] text-white/50 mb-4">
            Nothing scheduled yet. Explore what's happening.
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/explore?tab=events">Browse events</Link>
          </Button>
        </GlassSurface>
      </Section>
    );
  }

  return (
    <Section title="This Week" action="All events" actionHref="/explore?tab=events" delay={0.3}>
      <div className="space-y-2">
        {events.slice(0, 4).map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => router.push(`/s/${event.spaceHandle || event.spaceId}`)}
            className="w-full text-left"
          >
            <GlassSurface
              intensity="subtle"
              interactive
              className="p-3 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-white truncate">
                      {event.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-0.5">
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

// YOUR CREATIONS Section
function YourCreationsSection({
  tools,
  loading,
  isBuilder,
}: {
  tools: ToolData[];
  loading: boolean;
  isBuilder: boolean;
}) {
  if (!isBuilder) return null;

  if (loading) {
    return (
      <Section title="Your Creations" action="HiveLab" actionHref="/hivelab" delay={0.4}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section title="Your Creations" action="HiveLab" actionHref="/hivelab" delay={0.4}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tools.slice(0, 3).map((tool) => (
          <Tilt key={tool.id} intensity={6}>
            <Link href={`/tools/${tool.id}`}>
              <GlassSurface
                intensity="subtle"
                interactive
                className="aspect-square rounded-xl p-4 flex flex-col justify-between"
              >
                <span className="text-[20px]">{tool.icon || '🛠️'}</span>
                <div>
                  <p className="text-[13px] font-medium text-white truncate">
                    {tool.name}
                  </p>
                  {tool.responseCount !== undefined && tool.responseCount > 0 && (
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {tool.responseCount} responses
                    </p>
                  )}
                </div>
              </GlassSurface>
            </Link>
          </Tilt>
        ))}

        {/* Create tile */}
        <Tilt intensity={6}>
          <Link href="/tools/new">
            <GlassSurface
              intensity="subtle"
              interactive
              className="aspect-square rounded-xl p-4 flex flex-col items-center justify-center border-dashed"
            >
              <span className="text-[24px] mb-2">+</span>
              <span className="text-[12px] text-white/40">Create Tool</span>
            </GlassSurface>
          </Link>
        </Tilt>
      </div>
    </Section>
  );
}

// DISCOVER Section
function DiscoverSection({
  recommendations,
  loading,
}: {
  recommendations: RecommendedSpace[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Section title="Discover" delay={0.5}>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
            <div className="h-4 w-3/4 bg-white/[0.06] rounded mb-2" />
            <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
          </div>
        </div>
      </Section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Section title="Discover" action="Explore" actionHref="/explore" delay={0.5}>
      <div className="space-y-3">
        {recommendations.slice(0, 2).map((space) => (
          <Tilt key={space.id} intensity={4}>
            <Link href={`/s/${space.handle}`}>
              <GlassSurface intensity="subtle" interactive className="p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-[18px]">
                    ✨
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-white truncate">
                      {space.name}
                    </p>
                    <p className="text-[12px] text-white/50 mt-0.5">
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

// QUICK ACTIONS Sidebar
function QuickActions() {
  return (
    <GlassSurface intensity="subtle" className="p-5 rounded-xl">
      <h3 className="text-[12px] font-medium text-white/40 uppercase tracking-wider mb-4">
        Quick Actions
      </h3>
      <div className="space-y-2">
        <Link
          href="/tools/new"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <span className="text-[16px]">🛠️</span>
          <span className="text-[13px] text-white/70">Build a Tool</span>
        </Link>
        <Link
          href="/spaces/new"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <span className="text-[16px]">🏠</span>
          <span className="text-[13px] text-white/70">Start a Space</span>
        </Link>
        <Link
          href="/explore?tab=events"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <span className="text-[16px]">📅</span>
          <span className="text-[13px] text-white/70">Browse Events</span>
        </Link>
      </div>
    </GlassSurface>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function FeedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Data states
  const [spaces, setSpaces] = useState<SpaceData[]>([]);
  const [todayEvents, setTodayEvents] = useState<EventData[]>([]);
  const [weekEvents, setWeekEvents] = useState<EventData[]>([]);
  const [tools, setTools] = useState<ToolData[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedSpace[]>([]);
  const [unreadSpaces, setUnreadSpaces] = useState<SpaceData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all feed data
  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchFeedData() {
      setLoading(true);

      try {
        // Parallel fetch all data sources
        const [spacesRes, dashboardRes, toolsRes] = await Promise.all([
          fetch('/api/profile/my-spaces', { credentials: 'include' }),
          fetch('/api/profile/dashboard?includeRecommendations=true', {
            credentials: 'include',
          }),
          fetch('/api/tools?limit=10', { credentials: 'include' }),
        ]);

        // Process spaces
        if (spacesRes.ok) {
          const spacesData = await spacesRes.json();
          const allSpaces = (spacesData.spaces || []) as SpaceData[];
          setSpaces(allSpaces);

          // Extract spaces with unread messages
          setUnreadSpaces(
            allSpaces.filter((s: SpaceData) => (s.unreadCount ?? 0) > 0)
          );
        }

        // Process dashboard (events + recommendations)
        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          const dashboard = dashboardData.dashboard || {};

          // Split events into today and this week
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
          setWeekEvents(
            allEvents.filter((e) => !isToday(e.startDate) && isThisWeek(e.startDate))
          );

          // Recommendations
          if (dashboard.recommendations?.spaces) {
            setRecommendations(dashboard.recommendations.spaces);
          }
        }

        // Process tools
        if (toolsRes.ok) {
          const toolsData = await toolsRes.json();
          setTools(toolsData.tools || []);
        }
      } catch (error) {
        console.error('Failed to fetch feed data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeedData();
  }, [authLoading, user]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)]">
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

  const firstName = user?.displayName?.split(' ')[0] || user?.fullName?.split(' ')[0] || '';

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      {/* Header */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
          >
            <h1 className="text-[24px] font-semibold text-white">
              {getGreeting()}
              {firstName && (
                <>
                  , <GradientText variant="gold">{firstName}</GradientText>
                </>
              )}
            </h1>
            <p className="text-[14px] text-white/50 mt-1">
              Here's what's happening in your world
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Main column */}
          <div>
            <TodaySection
              events={todayEvents}
              unreadSpaces={unreadSpaces}
              loading={loading}
            />

            <YourSpacesSection spaces={spaces} loading={loading} />

            <ThisWeekSection events={weekEvents} loading={loading} />

            <YourCreationsSection
              tools={tools}
              loading={loading}
              isBuilder={user?.isBuilder ?? false}
            />

            <DiscoverSection recommendations={recommendations} loading={loading} />
          </div>

          {/* Sidebar */}
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

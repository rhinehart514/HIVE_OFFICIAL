"use client";

/**
 * Proto-Feed (Home)
 *
 * Per locked IA spec (INFORMATION_ARCHITECTURE.md):
 * - Structured sections: Today, Your Spaces, This Week, Your Creations, Discover
 * - Anticipatory, not reactive
 * - "This page is evolving" box at bottom
 *
 * This is NOT an Activity Stream. It's a dashboard that evolves into Feed.
 */

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Card, Badge } from "@hive/ui";
import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@hive/auth-logic";

// ============================================
// TYPES
// ============================================

interface SpaceData {
  id: string;
  name: string;
  description?: string;
  bannerUrl?: string;
  metrics?: { memberCount?: number };
  membership?: { role: string };
}

interface EventData {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  spaceId: string;
  spaceName: string;
  rsvpCount?: number;
  isGoing?: boolean;
}

interface ToolData {
  id: string;
  name: string;
  description?: string;
  status: string;
  responseCount?: number;
  updatedAt?: string;
}

interface RecommendedSpace {
  id: string;
  name: string;
  reason: string;
  memberCount: number;
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

  if (diffHours < 0) return "Past";
  if (diffHours < 1) return "Starting soon";
  if (diffHours < 24) return `In ${diffHours}h`;
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" }) + " " +
      date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ============================================
// SECTION COMPONENTS
// ============================================

function SectionHeader({
  title,
  action,
  actionHref,
}: {
  title: string;
  action?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-medium text-white/60 uppercase tracking-wide">
        {title}
      </h2>
      {action && actionHref && (
        <Link
          href={actionHref}
          className="text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          {action} →
        </Link>
      )}
    </div>
  );
}

// TODAY Section — Events happening today + unread messages
function TodaySection({
  events,
  unreadSpaces,
  loading,
}: {
  events: EventData[];
  unreadSpaces: { id: string; name: string; unreadCount: number }[];
  loading: boolean;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <section className="mb-8">
        <SectionHeader title="Today" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 animate-pulse"
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
      </section>
    );
  }

  const hasContent = events.length > 0 || unreadSpaces.length > 0;

  if (!hasContent) {
    return (
      <section className="mb-8">
        <SectionHeader title="Today" />
        <Card className="p-6 bg-white/[0.02] border-white/[0.06] text-center">
          <CalendarIcon className="h-8 w-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50 mb-4">
            Nothing scheduled today. Check what&apos;s coming up this week.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/events">Browse events</Link>
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <SectionHeader title="Today" />
      <div className="space-y-3">
        {/* Today's events */}
        {events.map((event) => (
          <motion.div
            key={event.id}
            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
            whileHover={{ opacity: 0.9 }}
            onClick={() => router.push(`/spaces/${event.spaceId}/events`)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-white/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {event.title}
                  </span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {formatEventTime(event.startDate)}
                  </Badge>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  {event.spaceName}
                  {event.isGoing && " · You're going"}
                  {event.rsvpCount && event.rsvpCount > 0 && ` · ${event.rsvpCount} going`}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Unread messages */}
        {unreadSpaces.map((space) => (
          <motion.div
            key={space.id}
            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
            whileHover={{ opacity: 0.9 }}
            onClick={() => router.push(`/spaces/${space.id}`)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-white/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {space.unreadCount} new messages in {space.name}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-1">Jump back in →</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// YOUR SPACES Section — Navigation tiles with activity dots
function YourSpacesSection({
  spaces,
  loading,
}: {
  spaces: SpaceData[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="mb-8">
        <SectionHeader title="Your Spaces" action="Browse" actionHref="/spaces" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <SectionHeader title="Your Spaces" action="Browse" actionHref="/spaces" />
      <div className="grid grid-cols-4 gap-3">
        {spaces.slice(0, 3).map((space) => (
          <Link
            key={space.id}
            href={`/spaces/${space.id}`}
            className="group aspect-square rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 flex flex-col justify-between hover:bg-white/[0.04] hover:border-white/[0.1] transition-colors"
          >
            <div className="text-xs font-medium text-white/80 truncate">
              {space.name}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            </div>
          </Link>
        ))}

        {/* Browse tile */}
        <Link
          href="/spaces"
          className="aspect-square rounded-xl bg-white/[0.02] border border-white/[0.06] border-dashed p-3 flex flex-col items-center justify-center hover:bg-white/[0.04] hover:border-white/[0.1] transition-colors"
        >
          <PlusIcon className="h-5 w-5 text-white/40 mb-1" />
          <span className="text-xs text-white/40">Browse</span>
        </Link>
      </div>
    </section>
  );
}

// THIS WEEK Section — Upcoming events
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
      <section className="mb-8">
        <SectionHeader title="This Week" action="All events" actionHref="/events" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 w-3/4 bg-white/[0.06] rounded mb-2" />
              <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="mb-8">
        <SectionHeader title="This Week" action="All events" actionHref="/events" />
        <Card className="p-6 bg-white/[0.02] border-white/[0.06] text-center">
          <CalendarIcon className="h-8 w-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50 mb-4">
            Nothing scheduled yet. Create an event or browse what&apos;s happening campus-wide.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/events">Browse events</Link>
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <SectionHeader title="This Week" action="All events" actionHref="/events" />
      <div className="space-y-3">
        {events.map((event) => (
          <motion.div
            key={event.id}
            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
            whileHover={{ opacity: 0.9 }}
            onClick={() => router.push(`/spaces/${event.spaceId}/events`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-white/40 shrink-0" />
                  <span className="text-sm font-medium text-white truncate">
                    {event.title}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-1 ml-6">
                  {event.spaceName} · {formatEventTime(event.startDate)}
                  {event.rsvpCount && event.rsvpCount > 0 && ` · ${event.rsvpCount} going`}
                </p>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-white/20 shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// YOUR CREATIONS Section — HiveLab tools with response counts
function YourCreationsSection({
  tools,
  loading,
}: {
  tools: ToolData[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="mb-8">
        <SectionHeader title="Your Creations" action="HiveLab" actionHref="/tools" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <SectionHeader title="Your Creations" action="HiveLab" actionHref="/tools" />
      <div className="grid grid-cols-4 gap-3">
        {tools.slice(0, 3).map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.id}`}
            className="aspect-square rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 flex flex-col justify-between hover:bg-white/[0.04] hover:border-white/[0.1] transition-colors"
          >
            <WrenchScrewdriverIcon className="h-5 w-5 text-white/40" />
            <div>
              <div className="text-xs font-medium text-white/80 truncate">
                {tool.name}
              </div>
              {tool.responseCount !== undefined && tool.responseCount > 0 && (
                <div className="text-[10px] text-white/40 mt-0.5">
                  {tool.responseCount} responses
                </div>
              )}
            </div>
          </Link>
        ))}

        {/* Create tile */}
        <Link
          href="/tools/new"
          className="aspect-square rounded-xl bg-white/[0.02] border border-white/[0.06] border-dashed p-3 flex flex-col items-center justify-center hover:bg-white/[0.04] hover:border-white/[0.1] transition-colors"
        >
          <PlusIcon className="h-5 w-5 text-white/40 mb-1" />
          <span className="text-xs text-white/40">Create</span>
        </Link>
      </div>
    </section>
  );
}

// DISCOVER Section — 1-2 discovery items
function DiscoverSection({
  recommendations,
  loading,
}: {
  recommendations: RecommendedSpace[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="mb-8">
        <SectionHeader title="Discover" />
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 animate-pulse">
          <div className="h-4 w-3/4 bg-white/[0.06] rounded mb-2" />
          <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <SectionHeader title="Discover" action="Browse all" actionHref="/spaces" />
      <div className="space-y-3">
        {recommendations.slice(0, 2).map((space) => (
          <Link
            key={space.id}
            href={`/spaces/${space.id}`}
            className="block bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.04] hover:border-white/[0.1] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-white/40" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {space.name}
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  {space.reason} · {space.memberCount} members
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ANTICIPATION BOX — "This page is evolving"
function EvolvingBox() {
  return (
    <section className="mt-12 mb-8">
      <Card className="p-6 bg-white/[0.01] border-white/[0.08] border-dashed">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
            <SparklesIcon className="h-5 w-5 text-white/40" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white/70 mb-2">
              This page is evolving.
            </h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Soon: A feed of everything happening across your spaces. Activity.
              Events. What friends are doing. All in one stream.
            </p>
            <p className="text-xs text-white/30 mt-3">
              You&apos;ll know when it drops.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}

// ============================================
// SIDEBAR COMPONENTS
// ============================================

function QuickActions() {
  return (
    <Card className="p-5 bg-white/[0.02] border-white/[0.06]">
      <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
      <div className="space-y-2">
        <Link
          href="/tools/new"
          className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
        >
          <WrenchScrewdriverIcon className="h-4 w-4 text-white/60" />
          <span className="text-sm text-white/70">Build a Tool</span>
        </Link>
        <Link
          href="/spaces/create"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <UsersIcon className="h-4 w-4 text-white/60" />
          <span className="text-sm text-white/70">Create a Space</span>
        </Link>
        <Link
          href="/events"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <CalendarIcon className="h-4 w-4 text-white/60" />
          <span className="text-sm text-white/70">Browse Events</span>
        </Link>
      </div>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ProtoFeedPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Data states
  const [spaces, setSpaces] = useState<SpaceData[]>([]);
  const [todayEvents, setTodayEvents] = useState<EventData[]>([]);
  const [weekEvents, setWeekEvents] = useState<EventData[]>([]);
  const [tools, setTools] = useState<ToolData[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedSpace[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all proto-feed data
  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchProtoFeedData() {
      setLoading(true);

      try {
        // Parallel fetch all data sources
        const [spacesRes, dashboardRes, toolsRes] = await Promise.all([
          fetch("/api/profile/my-spaces", { credentials: "include" }),
          fetch("/api/profile/dashboard?includeRecommendations=true", {
            credentials: "include",
          }),
          fetch("/api/tools?limit=10", { credentials: "include" }),
        ]);

        // Process spaces
        if (spacesRes.ok) {
          const spacesData = await spacesRes.json();
          setSpaces(spacesData.spaces || []);
        }

        // Process dashboard (events + recommendations)
        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          const dashboard = dashboardData.dashboard || {};

          // Split events into today and this week
          const allEvents: EventData[] = (dashboard.upcomingEvents || []).map(
            (e: {
              id: string;
              title: string;
              description?: string;
              startDate: string;
              endDate?: string;
              spaceId: string;
              spaceName: string;
            }) => ({
              id: e.id,
              title: e.title,
              description: e.description,
              startDate: e.startDate,
              endDate: e.endDate,
              spaceId: e.spaceId,
              spaceName: e.spaceName,
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
        console.error("Failed to fetch proto-feed data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProtoFeedData();
  }, [authLoading, user]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-ground">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="h-8 w-48 bg-white/[0.06] rounded mb-8 animate-pulse" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <div className="space-y-8">
              {[1, 2, 3, 4].map((i) => (
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

  return (
    <div className="min-h-screen bg-ground">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-lg font-medium text-white">What&apos;s Happening</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          {/* Main column */}
          <div>
            <TodaySection
              events={todayEvents}
              unreadSpaces={[]} // TODO: Add unread messages when available
              loading={loading}
            />

            <YourSpacesSection spaces={spaces} loading={loading} />

            <ThisWeekSection events={weekEvents} loading={loading} />

            <YourCreationsSection tools={tools} loading={loading} />

            <DiscoverSection recommendations={recommendations} loading={loading} />

            <EvolvingBox />
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <QuickActions />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

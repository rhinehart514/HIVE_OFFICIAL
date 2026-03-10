'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@hive/auth-logic';
import {
  CampusHeader,
  CampusPulse,
  LiveNowSection,
  TodayEventsSection,
  NewAppsSection,
  SpacesActivitySection,
  DiscoverSection,
  EventDetailDrawer,
  FeedSkeleton,
} from '@/components/feed';
import type { FeedEvent } from '@/components/feed';

/* ─── "Since you left" helpers ─────────────────────────────────── */

const LAST_FEED_VISIT_KEY = 'lastFeedVisit';

function getLastFeedVisit(): number | null {
  try {
    const stored = localStorage.getItem(LAST_FEED_VISIT_KEY);
    if (!stored) return null;
    const ts = Number(stored);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

function setLastFeedVisit(): void {
  try {
    localStorage.setItem(LAST_FEED_VISIT_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable — silent fail
  }
}

function formatTimeSince(ms: number): string {
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SinceYouLeftDivider({ lastVisit }: { lastVisit: number }) {
  const elapsed = Date.now() - lastVisit;
  return (
    <div className="relative py-4">
      <div className="border-t border-white/[0.05]" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-void px-3 font-mono text-[11px] uppercase tracking-wider text-white/30">
        Since you left &middot; {formatTimeSince(elapsed)}
      </span>
    </div>
  );
}

/* ─── Data fetching ─────────────────────────────────────────────── */

/**
 * Fetch events sorted by time, then use relevanceScore as tiebreaker
 * within the same calendar day. The API computes relevanceScore but
 * callers previously ignored it by requesting sort=soonest. Now we
 * request sort=soonest (for primary ordering) then re-sort events
 * on the same day by relevanceScore descending.
 */
async function fetchFeedEvents(): Promise<FeedEvent[]> {
  const params = new URLSearchParams({
    timeRange: 'upcoming',
    maxItems: '50',
    sort: 'soonest',
  });
  const res = await fetch(`/api/events/personalized?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const payload = await res.json();
  const raw = (payload.data || payload).events || [];
  const events: FeedEvent[] = raw.map((e: Record<string, unknown>) => ({
    id: e.id as string,
    title: e.title as string,
    description: e.description as string | undefined,
    startDate: e.startDate as string,
    endDate: e.endDate as string | undefined,
    location: (e.locationName || e.location) as string | undefined,
    isOnline: e.isOnline as boolean | undefined,
    rsvpCount: (e.rsvpCount as number) || 0,
    isUserRsvped: e.isUserRsvped as boolean | undefined,
    userRsvp: e.userRsvp as FeedEvent['userRsvp'],
    spaceName: e.spaceName as string | undefined,
    spaceHandle: e.spaceHandle as string | undefined,
    spaceId: e.spaceId as string | undefined,
    spaceAvatarUrl: e.spaceAvatarUrl as string | undefined,
    imageUrl: e.imageUrl as string | undefined,
    coverImageUrl: (e.coverImageUrl || e.imageUrl) as string | undefined,
    eventType: e.eventType as string | undefined,
    category: e.category as string | undefined,
    friendsAttending: (e.friendsAttending as number) || 0,
    friendsAttendingNames: e.friendsAttendingNames as string[] | undefined,
    matchReasons: e.matchReasons as string[] | undefined,
    relevanceScore: e.relevanceScore as number | undefined,
  }));

  // Use relevanceScore as tiebreaker within the same calendar day.
  // Events are already sorted by soonest. Group by date, sort within
  // each group by relevanceScore descending, then flatten.
  const byDay = new Map<string, FeedEvent[]>();
  for (const event of events) {
    const dayKey = event.startDate.slice(0, 10); // YYYY-MM-DD
    const group = byDay.get(dayKey);
    if (group) {
      group.push(event);
    } else {
      byDay.set(dayKey, [event]);
    }
  }
  const sorted: FeedEvent[] = [];
  for (const [, group] of byDay) {
    group.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    sorted.push(...group);
  }
  return sorted;
}

/* ─── Page ──────────────────────────────────────────────────────── */

export default function DiscoverPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<FeedEvent | null>(null);

  // Capture lastFeedVisit on mount (before we overwrite it)
  const lastFeedVisitRef = useRef<number | null>(null);
  const [lastFeedVisit, setLastFeedVisitState] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/enter?redirect=/discover');
  }, [authLoading, user, router]);

  // Read lastFeedVisit once on mount, then update it
  useEffect(() => {
    if (lastFeedVisitRef.current !== null) return; // already read
    const prev = getLastFeedVisit();
    lastFeedVisitRef.current = prev;
    setLastFeedVisitState(prev);
    setLastFeedVisit();
  }, []);

  const eventsQuery = useQuery({
    queryKey: ['feed-events'],
    queryFn: fetchFeedEvents,
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled: !authLoading && !!user,
  });

  const handleSelectEvent = useCallback((event: FeedEvent) => {
    setSelectedEvent(event);
  }, []);

  const events = eventsQuery.data || [];

  // Split events into "new since last visit" and "already seen" for today's events
  const { newEvents, seenEvents, showDivider } = useMemo(() => {
    if (!lastFeedVisit) return { newEvents: events, seenEvents: [] as FeedEvent[], showDivider: false };
    const cutoff = lastFeedVisit;
    const newer: FeedEvent[] = [];
    const older: FeedEvent[] = [];
    for (const e of events) {
      const start = new Date(e.startDate).getTime();
      if (start > cutoff) {
        newer.push(e);
      } else {
        older.push(e);
      }
    }
    return {
      newEvents: newer,
      seenEvents: older,
      showDivider: newer.length > 0 && older.length > 0,
    };
  }, [events, lastFeedVisit]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 rounded-full border-2 border-white/[0.06] border-t-white/30 animate-spin" />
      </div>
    );
  }

  const isLoading = eventsQuery.isLoading;

  return (
    <>
      {/* Event detail drawer */}
      <EventDetailDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      <div className="w-full max-w-[960px] mx-auto px-4 py-8 md:px-8">
        {/* Page header */}
        <div className="relative mb-6">
          <div className="absolute -inset-x-8 -inset-y-4 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(255,215,0,0.04), transparent 60%)' }} />
          <h1 className="relative font-clash text-[32px] font-semibold text-white mb-1">What&apos;s happening</h1>
          <div className="relative">
            <CampusHeader />
          </div>
        </div>

        {isLoading ? (
          <FeedSkeleton />
        ) : (
          <div className="space-y-8">
            {/* 1. Campus Pulse — dining hours, study spot busyness */}
            <CampusPulse />

            {/* 2. Live Now — events happening or starting within 1hr */}
            <LiveNowSection events={newEvents} onSelectEvent={handleSelectEvent} />

            {/* 3. Happening Today — new events since last visit */}
            <TodayEventsSection events={newEvents} onSelectEvent={handleSelectEvent} />

            {/* 4. Trending Apps — shell apps with inline engagement */}
            <NewAppsSection />

            {/* 5. Your Spaces Activity */}
            <SpacesActivitySection />

            {/* "Since you left" divider — separates new from seen events */}
            {showDivider && lastFeedVisit && (
              <SinceYouLeftDivider lastVisit={lastFeedVisit} />
            )}

            {/* Events the user likely already saw */}
            {seenEvents.length > 0 && (
              <>
                <LiveNowSection events={seenEvents} onSelectEvent={handleSelectEvent} />
                <TodayEventsSection events={seenEvents} onSelectEvent={handleSelectEvent} />
              </>
            )}

            {/* 6. Discover Spaces — unjoined spaces, cursor-paginated */}
            <DiscoverSection />
          </div>
        )}
      </div>
    </>
  );
}

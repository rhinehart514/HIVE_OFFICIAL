'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Users, Sparkles } from 'lucide-react';
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
  QuickCreateStrip,
} from '@/components/feed';
import { SpaceAvatar } from '@/components/feed';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { emitValueMoment } from '@/lib/pwa-triggers';
import { Mono } from '@hive/ui/design-system/primitives';
import type { FeedEvent, FeedSpace } from '@/components/feed';

/* ─── Time-aware greeting ─────────────────────────────────────── */

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Late night at UB';
  if (hour < 12) return 'This morning at UB';
  if (hour < 17) return 'This afternoon at UB';
  if (hour < 21) return 'Tonight at UB';
  return 'Late night at UB';
}

/* ─── Time-aware end-of-feed messages ─────────────────────────── */

const END_OF_FEED_MESSAGES: Record<string, string[]> = {
  'morning': [
    "You\u2019re all caught up \u2014 go grab a coffee at Tim Hortons",
    "That\u2019s everything for now \u2014 campus is still waking up",
  ],
  'afternoon': [
    "You\u2019re all caught up \u2014 check back after your next class",
    "All caught up \u2014 the afternoon rush hasn\u2019t hit yet",
  ],
  'evening': [
    "You\u2019re all caught up \u2014 the night owls will post something soon",
    "That\u2019s everything \u2014 go touch grass on the Academic Spine",
  ],
  'late-night': [
    "All caught up \u2014 even the SU is asleep",
    "You\u2019re all caught up \u2014 the early birds will post at dawn",
  ],
};

function getEndOfFeedMessage(): string {
  const h = new Date().getHours();
  const period = h < 6 ? 'late-night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 22 ? 'evening' : 'late-night';
  const messages = END_OF_FEED_MESSAGES[period];
  return messages[Math.floor(Math.random() * messages.length)];
}

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

function SinceYouLeftDivider({ lastVisit, newAppsCount }: { lastVisit: number; newAppsCount?: number }) {
  const elapsed = Date.now() - lastVisit;
  const parts = [formatTimeSince(elapsed)];
  if (newAppsCount && newAppsCount > 0) {
    parts.push(`${newAppsCount} new app${newAppsCount !== 1 ? 's' : ''}`);
  }
  return (
    <div className="relative py-4">
      <div className="border-t border-white/[0.05]" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-void px-3 font-mono text-[11px] uppercase tracking-wider text-white/30">
        Since you left &middot; {parts.join(' · ')}
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

/* ─── Welcome section for just-onboarded users ────────────────── */

const JUST_ONBOARDED_KEY = 'hive:just-onboarded';

function useJustOnboarded(): [boolean, () => void] {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(JUST_ONBOARDED_KEY) === '1') {
        setShow(true);
      }
    } catch { /* ignore */ }
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    try { localStorage.removeItem(JUST_ONBOARDED_KEY); } catch { /* ignore */ }
  }, []);

  return [show, dismiss];
}

async function fetchWelcomeSpaces(): Promise<FeedSpace[]> {
  const params = new URLSearchParams({
    category: 'all',
    sort: 'trending',
    limit: '6',
    showAll: 'true',
  });

  const res = await fetch(`/api/spaces/browse-v2?${params}`, { credentials: 'include' });
  if (!res.ok) return [];

  const data = await res.json();
  const raw = data?.data?.spaces ?? data?.spaces ?? [];
  return raw
    .filter((s: Record<string, unknown>) => !s.isJoined)
    .slice(0, 6)
    .map((s: Record<string, unknown>): FeedSpace => ({
      id: s.id as string,
      handle: (s.handle || s.slug) as string | undefined,
      name: s.name as string,
      description: s.description as string | undefined,
      avatarUrl: (s.iconURL || s.bannerImage) as string | undefined,
      memberCount: (s.memberCount as number) || 0,
      isVerified: s.isVerified as boolean | undefined,
      isJoined: false,
      category: s.category as string | undefined,
      mutualCount: s.mutualCount as number | undefined,
      upcomingEventCount: s.upcomingEventCount as number | undefined,
      nextEventTitle: s.nextEventTitle as string | undefined,
    }));
}

function WelcomeSection({ onDismiss }: { onDismiss: () => void }) {
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const { data: spaces, isLoading } = useQuery({
    queryKey: ['welcome-spaces'],
    queryFn: fetchWelcomeSpaces,
    staleTime: 5 * 60_000,
  });

  const joinMutation = useMutation({
    mutationFn: async (spaceId: string) => {
      setJoiningId(spaceId);
      const res = await secureApiFetch('/api/spaces/join-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId }),
      });
      if (!res.ok) throw new Error('Join failed');
    },
    onSuccess: (_data, spaceId) => {
      setJoinedIds((prev) => new Set(prev).add(spaceId));
      setJoiningId(null);
      emitValueMoment({ type: 'space-join', spaceId });
    },
    onError: () => setJoiningId(null),
  });

  const handleJoin = useCallback(
    (e: React.MouseEvent, spaceId: string) => {
      e.preventDefault();
      e.stopPropagation();
      joinMutation.mutate(spaceId);
    },
    [joinMutation],
  );

  const visibleSpaces = (spaces ?? []).filter((s) => !joinedIds.has(s.id));

  return (
    <section className="relative rounded-2xl border border-white/[0.05] bg-surface p-6 mb-8">
      {/* Subtle gold glow behind the section */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top center, rgba(255,215,0,0.04), transparent 70%)' }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FFD700]/70" />
            <h2 className="font-clash text-[20px] font-semibold text-white">
              Welcome to UB
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              onDismiss();
              try { localStorage.removeItem(JUST_ONBOARDED_KEY); } catch { /* ignore */ }
            }}
            className="text-[11px] text-white/30 hover:text-white/50 transition-colors"
          >
            Dismiss
          </button>
        </div>

        <p className="text-[14px] text-white/50 mb-4">
          Here are spaces you might like. Join a few to see what your campus is up to.
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.05]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-24 bg-white/[0.05] rounded" />
                    <div className="h-2.5 w-16 bg-white/[0.03] rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : visibleSpaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {visibleSpaces.map((space) => (
              <Link
                key={space.id}
                href={`/s/${space.handle || space.id}`}
                className="group flex items-start gap-3 rounded-xl border border-white/[0.05] bg-card px-4 py-3 hover:border-white/[0.10] transition-colors duration-100"
              >
                <SpaceAvatar name={space.name} url={space.avatarUrl} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-white/70 group-hover:text-white transition-colors truncate">
                      {space.name}
                    </span>
                    {space.isVerified && (
                      <span className="text-[11px] text-[#FFD700]/50">&#10003;</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/30">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {space.memberCount}
                    </span>
                    {space.category && (
                      <span className="truncate max-w-[120px]">{space.category}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleJoin(e, space.id)}
                  disabled={joiningId === space.id}
                  className="shrink-0 mt-1 px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.05] border border-white/[0.05] text-white/50 hover:bg-white/[0.10] hover:text-white/70 transition-colors disabled:opacity-50"
                >
                  {joiningId === space.id ? '...' : 'Join'}
                </button>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-white/30">
            No spaces to show right now. Check back soon.
          </p>
        )}

        {joinedIds.size > 0 && (
          <p className="text-[11px] text-white/30 mt-3 font-mono uppercase tracking-wider">
            Joined {joinedIds.size} space{joinedIds.size !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </section>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */

export default function DiscoverPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<FeedEvent | null>(null);
  const [showWelcome, dismissWelcome] = useJustOnboarded();

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

  // Scroll position restoration — save on scroll, restore on back-nav
  useEffect(() => {
    const SCROLL_KEY = 'feed-scroll-y';
    // Restore on mount
    try {
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if (saved) {
        const y = Number(saved);
        if (Number.isFinite(y) && y > 0) {
          requestAnimationFrame(() => window.scrollTo(0, y));
        }
      }
    } catch { /* noop */ }
    // Save on scroll (debounced)
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)); } catch { /* noop */ }
      }, 150);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const eventsQuery = useQuery({
    queryKey: ['feed-events'],
    queryFn: fetchFeedEvents,
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled: !authLoading && !!user,
  });

  // Count new apps in user's spaces since last visit (for SinceYouLeftDivider)
  const { data: newAppsCount } = useQuery({
    queryKey: ['feed-new-apps-count', lastFeedVisit],
    queryFn: async () => {
      const res = await fetch('/api/spaces/activity/recent?limit=30', { credentials: 'include' });
      if (!res.ok) return 0;
      const data = await res.json();
      const items = data?.data?.items ?? [];
      return items.filter((item: { type: string; timestamp: string }) =>
        item.type === 'app' && lastFeedVisit && new Date(item.timestamp).getTime() > lastFeedVisit
      ).length;
    },
    staleTime: 60_000,
    enabled: !authLoading && !!user && !!lastFeedVisit,
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
        <div className="w-5 h-5 rounded-full border-2 border-white/[0.05] border-t-white/30 animate-spin" />
      </div>
    );
  }

  const isLoading = eventsQuery.isLoading;

  return (
    <>
      {/* Event detail drawer */}
      <EventDetailDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      <div className="w-full max-w-[960px] mx-auto px-4 md:px-6 pt-8 pb-24 md:pb-8">
        {/* Page header */}
        <div className="relative mb-6">
          <div className="absolute -inset-x-8 -inset-y-4 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(255,215,0,0.04), transparent 60%)' }} />
          <h1 className="relative font-clash text-[32px] font-semibold text-white mb-1">{timeGreeting()}</h1>
          <div className="relative">
            <CampusHeader />
          </div>
        </div>

        {isLoading ? (
          <FeedSkeleton />
        ) : (
          <div className="space-y-8">
            {/* 0. Welcome section — shown once for just-onboarded users */}
            {showWelcome && <WelcomeSection onDismiss={dismissWelcome} />}

            {/* 1. Campus Pulse — dining hours, study spot busyness */}
            <CampusPulse />

            {/* 1.5. Quick create — one-tap creation at all densities */}
            <QuickCreateStrip />

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
              <SinceYouLeftDivider lastVisit={lastFeedVisit} newAppsCount={newAppsCount} />
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

            {/* End of feed marker */}
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="text-[13px] text-white/30">
                {getEndOfFeedMessage()}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

'use client';

/**
 * /explore - Unified Discovery Hub
 *
 * "Explore UB"
 *
 * ChatGPT-style search-first discovery.
 * Tabs: Spaces, People, Events, Tools
 * Query params for state: ?tab=spaces&q=consulting
 *
 * Connected to real APIs:
 * - Spaces: GET /api/spaces/browse-v2
 * - People: POST /api/users/search
 * - Events: GET /api/events
 * - Tools: GET /api/tools/browse
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import {
  ExploreSearch,
  TabNav,
  SpaceGrid,
  PeopleGrid,
  EventList,
  ToolGallery,
  type ExploreTab,
  type SpaceCardData,
  type GhostSpaceData,
  type PersonData,
  type EventData,
  type ToolData,
} from '@/components/explore';
import { MOTION } from '@hive/ui/design-system/primitives';

// ============================================
// HOOKS
// ============================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// API FETCHERS
// ============================================

async function fetchSpaces(search?: string): Promise<{ spaces: SpaceCardData[]; ghostSpaces: GhostSpaceData[] }> {
  const params = new URLSearchParams({
    sort: 'trending',
    limit: '30',
  });
  if (search) params.set('search', search);

  const response = await fetch(`/api/spaces/browse-v2?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch spaces');

  const data = await response.json();
  const apiSpaces = data.data?.spaces || data.spaces || [];

  // Transform API response to SpaceCardData
  const spaces: SpaceCardData[] = apiSpaces
    .filter((s: { claimStatus?: string }) => s.claimStatus !== 'unclaimed')
    .map((s: {
      id: string;
      name: string;
      slug?: string;
      handle?: string;
      description?: string;
      memberCount?: number;
      metrics?: { memberCount?: number; activeMembers?: number };
      category?: string;
      type?: string;
      isJoined?: boolean;
      updatedAt?: string;
    }) => ({
      id: s.id,
      name: s.name,
      handle: s.slug || s.handle || s.id,
      description: s.description,
      memberCount: s.memberCount || s.metrics?.memberCount || 0,
      onlineCount: s.metrics?.activeMembers || 0, // Approximation until presence system
      lastActive: s.updatedAt ? new Date(s.updatedAt) : undefined,
      category: s.category || s.type || 'General',
      isMember: s.isJoined,
    }));

  // Ghost spaces are unclaimed spaces with waitlist
  const ghostSpaces: GhostSpaceData[] = apiSpaces
    .filter((s: { claimStatus?: string }) => s.claimStatus === 'unclaimed')
    .map((s: {
      id: string;
      name: string;
      slug?: string;
      handle?: string;
      category?: string;
      type?: string;
      waitlistCount?: number;
    }) => ({
      id: s.id,
      name: s.name,
      handle: s.slug || s.handle || s.id,
      category: s.category || s.type || 'General',
      waitlistCount: s.waitlistCount || 0,
    }));

  return { spaces, ghostSpaces };
}

async function fetchPeople(search: string): Promise<PersonData[]> {
  if (!search || search.length < 2) return [];

  const response = await fetch('/api/users/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: search,
      limit: 20,
      sortBy: 'relevance',
    }),
  });

  if (!response.ok) throw new Error('Failed to fetch people');

  const data = await response.json();
  const users = data.users || [];

  return users.map((u: {
    id: string;
    fullName?: string;
    handle?: string;
    photoURL?: string;
    academic?: { major?: string };
    userType?: string;
    mutualSpacesCount?: number;
    lastActive?: string;
  }) => ({
    id: u.id,
    name: u.fullName || u.handle || 'Unknown',
    avatarUrl: u.photoURL,
    role: u.academic?.major || u.userType || 'Student',
    mutualSpaces: u.mutualSpacesCount || 0,
    isOnline: u.lastActive ? new Date(u.lastActive).getTime() > Date.now() - 5 * 60 * 1000 : false,
  }));
}

async function fetchEvents(): Promise<EventData[]> {
  const params = new URLSearchParams({
    upcoming: 'true',
    limit: '20',
  });

  const response = await fetch(`/api/events?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch events');

  const data = await response.json();
  const events = data.data?.events || data.events || [];

  return events.map((e: {
    id: string;
    title: string;
    description?: string;
    startTime?: string;
    locationName?: string;
    location?: string;
    space?: { name?: string; id?: string };
    goingCount?: number;
    currentCapacity?: number;
    rsvpStatus?: string;
  }) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startTime: e.startTime ? new Date(e.startTime) : new Date(),
    location: e.locationName || e.location || 'TBD',
    spaceName: e.space?.name || 'Campus',
    spaceHandle: e.space?.id,
    rsvpCount: e.goingCount || e.currentCapacity || 0,
    isLive: false, // Would need real-time check
    userRsvp: e.rsvpStatus as 'going' | 'maybe' | 'not_going' | undefined,
  }));
}

async function fetchTools(search?: string): Promise<ToolData[]> {
  const params = new URLSearchParams({
    limit: '20',
  });
  if (search) params.set('search', search);

  const response = await fetch(`/api/tools/browse?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch tools');

  const data = await response.json();
  const tools = data.data?.tools || data.tools || [];

  return tools.map((t: {
    id: string;
    name: string;
    description?: string;
    thumbnailUrl?: string;
    iconUrl?: string;
    category?: string;
    stats?: { installs?: number };
    metadata?: { featured?: boolean };
    isOfficial?: boolean;
  }) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.thumbnailUrl || t.iconUrl || '🔧',
    category: t.category || 'General',
    deployCount: t.stats?.installs || 0,
    isOfficial: t.metadata?.featured || t.isOfficial || false,
  }));
}

// ============================================
// MAIN COMPONENT
// ============================================

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Get state from URL
  const tabParam = (searchParams.get('tab') as ExploreTab) || 'spaces';
  const queryParam = searchParams.get('q') || '';

  // Local state
  const [activeTab, setActiveTab] = useState<ExploreTab>(tabParam);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [spaces, setSpaces] = useState<SpaceCardData[]>([]);
  const [ghostSpaces, setGhostSpaces] = useState<GhostSpaceData[]>([]);
  const [people, setPeople] = useState<PersonData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [tools, setTools] = useState<ToolData[]>([]);

  // Debounce search
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Update URL when tab or query changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'spaces') params.set('tab', activeTab);
    if (debouncedQuery) params.set('q', debouncedQuery);

    const newUrl = params.toString() ? `/explore?${params.toString()}` : '/explore';
    router.replace(newUrl, { scroll: false });
  }, [activeTab, debouncedQuery, router]);

  // Fetch data based on tab and query
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        switch (activeTab) {
          case 'spaces': {
            const { spaces: s, ghostSpaces: g } = await fetchSpaces(debouncedQuery);
            setSpaces(s);
            setGhostSpaces(g);
            break;
          }
          case 'people': {
            const p = await fetchPeople(debouncedQuery);
            setPeople(p);
            break;
          }
          case 'events': {
            const e = await fetchEvents();
            // Client-side filter for events (API doesn't support search yet)
            if (debouncedQuery) {
              const q = debouncedQuery.toLowerCase();
              setEvents(e.filter(ev =>
                ev.title.toLowerCase().includes(q) ||
                ev.description?.toLowerCase().includes(q)
              ));
            } else {
              setEvents(e);
            }
            break;
          }
          case 'tools': {
            const t = await fetchTools(debouncedQuery);
            setTools(t);
            break;
          }
        }
      } catch (err) {
        console.error('Failed to fetch explore data:', err);
        setError('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, debouncedQuery]);

  const handleTabChange = useCallback((tab: ExploreTab) => {
    setActiveTab(tab);
  }, []);

  // Get campus name from user context (fallback to UB for now)
  const campusName = 'UB';

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
          className="text-center mb-8"
        >
          <h1 className="text-heading-sm font-semibold text-white mb-2">
            Discover Your Campus
          </h1>
          <p className="text-body text-white/50">
            Find your people, your spaces, your opportunities
          </p>
        </motion.div>

        {/* Search */}
        <div className="mb-6">
          <ExploreSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search ${activeTab}...`}
          />
        </div>

        {/* Tabs */}
        <div className="mb-8 flex justify-center">
          <TabNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Stats bar */}
        {activeTab === 'spaces' && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: MOTION.duration.fast }}
            className="mb-6 text-center"
          >
            <p className="text-body-sm text-white/30">
              {spaces.length + ghostSpaces.length} spaces ·{' '}
              {spaces.reduce((acc, s) => acc + s.memberCount, 0)} students
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-body text-white/50 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-body-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Content */}
        {!error && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
          >
            {activeTab === 'spaces' && (
              <SpaceGrid
                spaces={spaces}
                ghostSpaces={ghostSpaces}
                loading={isLoading}
                searchQuery={debouncedQuery}
              />
            )}

            {activeTab === 'people' && (
              <PeopleGrid
                people={people}
                loading={isLoading}
                searchQuery={debouncedQuery}
              />
            )}

            {activeTab === 'events' && (
              <EventList
                events={events}
                loading={isLoading}
                searchQuery={debouncedQuery}
              />
            )}

            {activeTab === 'tools' && (
              <ToolGallery
                tools={tools}
                loading={isLoading}
                searchQuery={debouncedQuery}
              />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}

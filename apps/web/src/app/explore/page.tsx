'use client';

/**
 * /explore - Curated Discovery Feed
 *
 * Personalized single-scroll feed that replaces the old 4-tab layout.
 * Sections: For You, Popular This Week, People in Your Major, Upcoming Events, Search.
 *
 * Connected to real APIs:
 * - Spaces: GET /api/spaces/browse-v2
 * - People: POST /api/users/search
 * - Events: GET /api/events
 * - User profile: GET /api/profile (for interests/major)
 */

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ExploreSearch,
  SpaceCard,
  GhostSpaceCard,
  ToolGallery,
  type SpaceCardData,
  type GhostSpaceData,
  type PersonData,
  type EventData,
  type ToolData,
} from '@/components/explore';
import {
  GlassSurface,
  SimpleAvatar,
  Badge,
  Button,
  MOTION,
} from '@hive/ui/design-system/primitives';
import {
  staggerContainerVariants,
  revealVariants,
  cardHoverVariants,
} from '@hive/tokens';
import { Calendar, Users, TrendingUp, Sparkles, Wrench } from 'lucide-react';
import { toast } from '@hive/ui';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface UserProfile {
  interests: string[];
  major: string | null;
}

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

async function fetchUserProfile(): Promise<UserProfile> {
  const response = await fetch('/api/profile', { credentials: 'include' });
  if (!response.ok) return { interests: [], major: null };

  const data = await response.json();
  const profile = data.data || data;
  return {
    interests: profile.interests || [],
    major: profile.major || null,
  };
}

async function fetchSpaces(
  options: { sort?: string; search?: string; limit?: number } = {}
): Promise<{ spaces: SpaceCardData[]; ghostSpaces: GhostSpaceData[] }> {
  const params = new URLSearchParams({
    sort: options.sort || 'trending',
    limit: String(options.limit || 30),
  });
  if (options.search) params.set('search', options.search);

  const response = await fetch(`/api/spaces/browse-v2?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch spaces');

  const data = await response.json();
  const apiSpaces = data.data?.spaces || data.spaces || [];

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
      onlineCount: s.metrics?.activeMembers || 0,
      lastActive: s.updatedAt ? new Date(s.updatedAt) : undefined,
      category: s.category || s.type || 'General',
      isMember: s.isJoined,
    }));

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

async function fetchPeople(options: {
  search?: string;
  major?: string;
  limit?: number;
}): Promise<PersonData[]> {
  const requestBody: {
    limit: number;
    sortBy: string;
    query?: string;
    major?: string;
  } = {
    limit: options.limit || 20,
    sortBy: 'relevance',
  };

  if (options.search && options.search.length >= 2) {
    requestBody.query = options.search;
  }
  if (options.major) {
    requestBody.major = options.major;
  }

  const response = await fetch('/api/users/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
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
    connectionStatus?: string;
    spacesCount?: number;
  }) => ({
    id: u.id,
    name: u.fullName || u.handle || 'Unknown',
    handle: u.handle,
    avatarUrl: u.photoURL,
    role: u.academic?.major || u.userType || 'Student',
    mutualSpaces: u.mutualSpacesCount || 0,
    isOnline: u.lastActive ? new Date(u.lastActive).getTime() > Date.now() - 5 * 60 * 1000 : false,
    isConnected: u.connectionStatus === 'connected',
    spacesCount: u.spacesCount,
  }));
}

async function fetchEvents(options: {
  search?: string;
  limit?: number;
} = {}): Promise<EventData[]> {
  const params = new URLSearchParams({
    upcoming: 'true',
    limit: String(options.limit || 10),
  });
  if (options.search) params.set('search', options.search);

  const response = await fetch(`/api/events?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch events');

  const data = await response.json();
  const events = data.data?.events || data.events || [];

  const now = new Date();
  return events.map((e: {
    id: string;
    title: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    locationName?: string;
    location?: string;
    space?: { name?: string; id?: string };
    goingCount?: number;
    currentCapacity?: number;
    rsvpStatus?: string;
  }) => {
    const startTime = e.startTime ? new Date(e.startTime) : new Date();
    const endTime = e.endTime ? new Date(e.endTime) : null;
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      startTime,
      location: e.locationName || e.location || 'TBD',
      spaceName: e.space?.name || 'Campus',
      spaceHandle: e.space?.id,
      spaceId: e.space?.id,
      rsvpCount: e.goingCount || e.currentCapacity || 0,
      isLive: startTime <= now && (!endTime || endTime > now),
      userRsvp: e.rsvpStatus as 'going' | 'maybe' | 'not_going' | undefined,
    };
  });
}

async function fetchTools(options: {
  search?: string;
  limit?: number;
} = {}): Promise<ToolData[]> {
  const params = new URLSearchParams({
    limit: String(options.limit || 12),
  });
  if (options.search) params.set('search', options.search);

  const response = await fetch(`/api/tools/browse?${params.toString()}`);
  if (!response.ok) return [];

  const data = await response.json();
  const tools = data.data?.tools || data.tools || [];

  return tools.map((t: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    category?: string;
    deployCount?: number;
    isOfficial?: boolean;
    deployedSpaces?: Array<{ id: string; name: string; handle: string }>;
    createdByName?: string;
    ownerName?: string;
  }) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.icon,
    category: t.category,
    deployCount: t.deployCount || 0,
    isOfficial: t.isOfficial,
    deployedSpaces: t.deployedSpaces,
    createdByName: t.createdByName || t.ownerName,
  }));
}

// ============================================
// SECTION: FOR YOU
// ============================================

function ForYouSection({
  spaces,
  ghostSpaces,
  userProfile,
  loading,
}: {
  spaces: SpaceCardData[];
  ghostSpaces: GhostSpaceData[];
  userProfile: UserProfile | null;
  loading: boolean;
}) {
  const personalizedSpaces = useMemo(() => {
    if (!userProfile || userProfile.interests.length === 0) {
      return spaces.slice(0, 6);
    }

    const interestsLower = userProfile.interests.map(i => i.toLowerCase());
    const majorLower = userProfile.major?.toLowerCase() || '';

    const scored = spaces.map(space => {
      let score = 0;
      const nameLower = space.name.toLowerCase();
      const descLower = (space.description || '').toLowerCase();
      const catLower = (space.category || '').toLowerCase();

      for (const interest of interestsLower) {
        if (nameLower.includes(interest)) score += 3;
        if (descLower.includes(interest)) score += 2;
        if (catLower.includes(interest)) score += 2;
      }

      if (majorLower) {
        if (nameLower.includes(majorLower)) score += 3;
        if (descLower.includes(majorLower)) score += 2;
        if (catLower.includes(majorLower)) score += 2;
      }

      score += Math.min(space.memberCount / 100, 1);

      return { space, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const matches = scored.filter(s => s.score > 0).map(s => s.space);
    if (matches.length >= 3) return matches.slice(0, 6);

    const matchIds = new Set(matches.map(m => m.id));
    const popular = spaces.filter(s => !matchIds.has(s.id));
    return [...matches, ...popular].slice(0, 6);
  }, [spaces, userProfile]);

  if (loading) {
    return (
      <FeedSection title="For You" icon={<Sparkles className="w-4 h-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SpaceCardSkeleton key={i} />
          ))}
        </div>
      </FeedSection>
    );
  }

  if (personalizedSpaces.length === 0 && ghostSpaces.length === 0) return null;

  return (
    <FeedSection
      title="For You"
      icon={<Sparkles className="w-4 h-4" />}
      subtitle={
        userProfile?.interests?.length
          ? 'Based on your interests'
          : 'Popular on campus'
      }
    >
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {personalizedSpaces.map((space) => (
          <SpaceCard key={space.id} space={space} />
        ))}
      </motion.div>

      {personalizedSpaces.length < 3 && ghostSpaces.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
        >
          {ghostSpaces.slice(0, 3).map((space, i) => (
            <GhostSpaceCard key={space.id} space={space} index={i} />
          ))}
        </motion.div>
      )}
    </FeedSection>
  );
}

// ============================================
// SECTION: POPULAR THIS WEEK
// ============================================

function PopularSection({
  spaces,
  loading,
}: {
  spaces: SpaceCardData[];
  loading: boolean;
}) {
  const trendingSpaces = spaces.slice(0, 4);

  if (loading) {
    return (
      <FeedSection title="Popular This Week" icon={<TrendingUp className="w-4 h-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <SpaceCardSkeleton key={i} />
          ))}
        </div>
      </FeedSection>
    );
  }

  if (trendingSpaces.length === 0) return null;

  return (
    <FeedSection title="Popular This Week" icon={<TrendingUp className="w-4 h-4" />}>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {trendingSpaces.map((space) => (
          <SpaceCard key={space.id} space={space} />
        ))}
      </motion.div>
    </FeedSection>
  );
}

// ============================================
// SECTION: PEOPLE IN YOUR MAJOR
// ============================================

function PeopleMajorSection({
  people,
  major,
  loading,
}: {
  people: PersonData[];
  major: string | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <FeedSection
        title={major ? `People in ${major}` : 'People on Campus'}
        icon={<Users className="w-4 h-4" />}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PersonCompactSkeleton key={i} />
          ))}
        </div>
      </FeedSection>
    );
  }

  if (people.length === 0) return null;

  const displayPeople = people.slice(0, 6);

  return (
    <FeedSection
      title={major ? `People in ${major}` : 'People on Campus'}
      icon={<Users className="w-4 h-4" />}
      action={undefined}
    >
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {displayPeople.map((person) => (
          <PersonCompactCard key={person.id} person={person} />
        ))}
      </motion.div>
    </FeedSection>
  );
}

// ============================================
// SECTION: UPCOMING EVENTS
// ============================================

function UpcomingEventsSection({
  events,
  loading,
}: {
  events: EventData[];
  loading: boolean;
}) {
  const [localEvents, setLocalEvents] = useState(events);

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const handleRSVP = useCallback(async (eventId: string, spaceId: string, status: 'going' | 'maybe' | 'not_going') => {
    const response = await fetch(`/api/spaces/${spaceId}/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'RSVP failed');
    }
    setLocalEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, userRsvp: status } : e
    ));
  }, []);

  if (loading) {
    return (
      <FeedSection title="Upcoming Events" icon={<Calendar className="w-4 h-4" />}>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </FeedSection>
    );
  }

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEvents = localEvents
    .filter(e => e.startTime >= now && e.startTime <= weekFromNow)
    .slice(0, 3);

  if (upcomingEvents.length === 0) return null;

  return (
    <FeedSection title="Upcoming Events" icon={<Calendar className="w-4 h-4" />}>
      <motion.div
        className="space-y-3"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {upcomingEvents.map((event) => (
          <EventCompactCard key={event.id} event={event} onRSVP={handleRSVP} />
        ))}
      </motion.div>
    </FeedSection>
  );
}

// ============================================
// SECTION: CAMPUS TOOLS
// ============================================

function CampusToolsSection({
  tools,
  loading,
}: {
  tools: ToolData[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <FeedSection title="Campus Tools" icon={<Wrench className="w-4 h-4" />}>
        <ToolGallery tools={[]} loading />
      </FeedSection>
    );
  }

  if (tools.length === 0) return null;

  return (
    <FeedSection
      title="Campus Tools"
      icon={<Wrench className="w-4 h-4" />}
      subtitle="Built by students, for students"
    >
      <ToolGallery tools={tools.slice(0, 6)} />
    </FeedSection>
  );
}

// ============================================
// SECTION: SEARCH RESULTS
// ============================================

function SearchResultsSection({
  query,
  spaces,
  ghostSpaces,
  people,
  events,
  loading,
}: {
  query: string;
  spaces: SpaceCardData[];
  ghostSpaces: GhostSpaceData[];
  people: PersonData[];
  events: EventData[];
  loading: boolean;
}) {
  const [localEvents, setLocalEvents] = useState(events);

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const handleRSVP = useCallback(async (eventId: string, spaceId: string, status: 'going' | 'maybe' | 'not_going') => {
    const response = await fetch(`/api/spaces/${spaceId}/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'RSVP failed');
    }
    setLocalEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, userRsvp: status } : e
    ));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SpaceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const hasResults = spaces.length > 0 || ghostSpaces.length > 0 || people.length > 0 || localEvents.length > 0;

  if (!hasResults) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <GlassSurface
          intensity="subtle"
          className="p-8 rounded-xl max-w-md w-full text-center"
        >
          <h3 className="text-body-lg font-medium text-white/80 mb-2">
            No results for &ldquo;{query}&rdquo;
          </h3>
          <p className="text-body-sm text-white/40 mb-6">
            Try a different search term or browse the feed below
          </p>
        </GlassSurface>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {spaces.length > 0 && (
        <FeedSection title={`Spaces matching "${query}"`}>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
          >
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </motion.div>
        </FeedSection>
      )}

      {ghostSpaces.length > 0 && (
        <FeedSection title="Unclaimed Spaces">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
          >
            {ghostSpaces.map((space, i) => (
              <GhostSpaceCard key={space.id} space={space} index={i} />
            ))}
          </motion.div>
        </FeedSection>
      )}

      {people.length > 0 && (
        <FeedSection title={`People matching "${query}"`}>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
          >
            {people.slice(0, 6).map((person) => (
              <PersonCompactCard key={person.id} person={person} />
            ))}
          </motion.div>
        </FeedSection>
      )}

      {localEvents.length > 0 && (
        <FeedSection title={`Events matching "${query}"`}>
          <motion.div
            className="space-y-3"
            variants={staggerContainerVariants}
            initial="initial"
            animate="animate"
          >
            {localEvents.slice(0, 3).map((event) => (
              <EventCompactCard key={event.id} event={event} onRSVP={handleRSVP} />
            ))}
          </motion.div>
        </FeedSection>
      )}
    </div>
  );
}

// ============================================
// SHARED COMPONENTS
// ============================================

function FeedSection({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.base,
        ease: MOTION.ease.premium,
      }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-white/30">{icon}</span>
          )}
          <div>
            <h2 className="text-body-lg font-semibold text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-label text-white/40 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

function PersonCompactCard({ person }: { person: PersonData & { spacesCount?: number } }) {
  return (
    <motion.div variants={revealVariants} whileHover="hover" initial="initial">
      <Link href={`/profile/${person.id}`}>
        <motion.div variants={cardHoverVariants}>
          <GlassSurface
            intensity="subtle"
            className={cn(
              'group p-3 rounded-xl transition-colors duration-200',
              'border border-white/[0.06] hover:border-white/10'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <SimpleAvatar
                  src={person.avatarUrl}
                  fallback={person.name?.charAt(0) || '?'}
                  size="default"
                />
                {person.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--life-gold)] border-2 border-[var(--bg-ground)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-white truncate">
                  {person.name}
                </p>
                <p className="text-label text-white/40 truncate">
                  {person.role}
                </p>
                {person.mutualSpaces !== undefined && person.mutualSpaces > 0 && (
                  <p className="text-label-sm text-white/30 mt-0.5">
                    {person.mutualSpaces} mutual {person.mutualSpaces === 1 ? 'space' : 'spaces'}
                  </p>
                )}
              </div>
            </div>
          </GlassSurface>
        </motion.div>
      </Link>
    </motion.div>
  );
}

function EventCompactCard({
  event,
  onRSVP,
}: {
  event: EventData;
  onRSVP: (eventId: string, spaceId: string, status: 'going' | 'maybe' | 'not_going') => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localRsvp, setLocalRsvp] = useState(event.userRsvp);
  const isGoing = localRsvp === 'going';

  const handleRSVP = async () => {
    if (!event.spaceId) {
      toast.error('Cannot RSVP', 'Event is missing space information.');
      return;
    }
    const newStatus = isGoing ? 'not_going' : 'going';
    setIsSubmitting(true);
    try {
      await onRSVP(event.id, event.spaceId, newStatus);
      setLocalRsvp(newStatus);
      toast.success(newStatus === 'going' ? "You're going!" : 'RSVP removed');
    } catch (err) {
      toast.error('RSVP failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateStr = formatEventDate(event.startTime);
  const timeStr = event.startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <motion.div variants={revealVariants} whileHover="hover" initial="initial">
      <Link href={event.spaceHandle ? `/s/${event.spaceHandle}/events/${event.id}` : '#'}>
        <motion.div variants={cardHoverVariants}>
          <GlassSurface
            intensity="subtle"
            className={cn(
              'group p-4 rounded-xl transition-colors duration-200',
              'border border-white/[0.06] hover:border-white/10',
              event.isLive && 'border-[var(--life-gold)]/30'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/[0.04] flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-medium text-white/40 uppercase leading-none">
                  {dateStr.month}
                </span>
                <span className="text-body font-semibold text-white leading-none mt-0.5">
                  {dateStr.day}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-body font-medium text-white truncate">
                    {event.title}
                  </h3>
                  {event.isLive && (
                    <Badge variant="gold" size="sm">Live</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-label text-white/40">
                  <span>{timeStr}</span>
                  {event.spaceName && (
                    <>
                      <span className="text-white/20">&middot;</span>
                      <span>{event.spaceName}</span>
                    </>
                  )}
                  {event.rsvpCount > 0 && (
                    <>
                      <span className="text-white/20">&middot;</span>
                      <span>{event.rsvpCount} going</span>
                    </>
                  )}
                </div>
              </div>

              <Button
                variant={isGoing ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'shrink-0',
                  isGoing && 'text-[var(--life-gold)] border-[var(--life-gold)]/30'
                )}
                disabled={isSubmitting || !event.spaceId}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRSVP();
                }}
              >
                {isSubmitting ? '...' : isGoing ? 'Going' : 'RSVP'}
              </Button>
            </div>
          </GlassSurface>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ============================================
// SKELETONS
// ============================================

function SpaceCardSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-white/[0.06] rounded" />
            <div className="h-3 w-20 bg-white/[0.04] rounded" />
          </div>
          <div className="w-8 h-4 bg-white/[0.04] rounded" />
        </div>
        <div className="h-3 w-full bg-white/[0.04] rounded" />
        <div className="h-3 w-2/3 bg-white/[0.04] rounded" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 w-24 bg-white/[0.04] rounded" />
          <div className="h-5 w-16 bg-white/[0.04] rounded-full" />
        </div>
      </div>
    </div>
  );
}

function PersonCompactSkeleton() {
  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-3/4 bg-white/[0.06] rounded" />
          <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
        </div>
      </div>
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-white/[0.06] shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
          <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
        </div>
        <div className="w-14 h-7 bg-white/[0.04] rounded" />
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function formatEventDate(date: Date): { month: string; day: string } {
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: date.getDate().toString(),
  };
}

// ============================================
// MAIN COMPONENT
// ============================================

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const isSearching = debouncedQuery.length > 0;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [spaces, setSpaces] = useState<SpaceCardData[]>([]);
  const [ghostSpaces, setGhostSpaces] = useState<GhostSpaceData[]>([]);
  const [people, setPeople] = useState<PersonData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [tools, setTools] = useState<ToolData[]>([]);

  const [searchSpaces, setSearchSpaces] = useState<SpaceCardData[]>([]);
  const [searchGhostSpaces, setSearchGhostSpaces] = useState<GhostSpaceData[]>([]);
  const [searchPeople, setSearchPeople] = useState<PersonData[]>([]);
  const [searchEvents, setSearchEvents] = useState<EventData[]>([]);

  const [feedLoading, setFeedLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Update URL when query changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);

    const newUrl = params.toString() ? `/explore?${params.toString()}` : '/explore';
    router.replace(newUrl, { scroll: false });
  }, [debouncedQuery, router]);

  // Fetch feed data on mount
  useEffect(() => {
    const loadFeed = async () => {
      setFeedLoading(true);
      try {
        const [profile, spacesData, eventsData, toolsData] = await Promise.all([
          fetchUserProfile().catch(() => ({ interests: [], major: null })),
          fetchSpaces({ sort: 'trending', limit: 30 }),
          fetchEvents({ limit: 10 }),
          fetchTools({ limit: 12 }).catch(() => []),
        ]);

        setUserProfile(profile);
        setSpaces(spacesData.spaces);
        setGhostSpaces(spacesData.ghostSpaces);
        setEvents(eventsData);
        setTools(toolsData);

        const peopleData = await fetchPeople({
          major: profile.major || undefined,
          limit: 12,
        });
        setPeople(peopleData);
      } catch (err) {
        logger.error('Failed to load explore feed', { component: 'ExplorePage' }, err instanceof Error ? err : undefined);
      } finally {
        setFeedLoading(false);
      }
    };

    loadFeed();
  }, []);

  // Fetch search results when query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchSpaces([]);
      setSearchGhostSpaces([]);
      setSearchPeople([]);
      setSearchEvents([]);
      return;
    }

    const searchAll = async () => {
      setSearchLoading(true);
      try {
        const [spacesData, peopleData, eventsData] = await Promise.all([
          fetchSpaces({ search: debouncedQuery, limit: 20 }),
          fetchPeople({ search: debouncedQuery, limit: 10 }),
          fetchEvents({ search: debouncedQuery, limit: 10 }),
        ]);

        setSearchSpaces(spacesData.spaces);
        setSearchGhostSpaces(spacesData.ghostSpaces);
        setSearchPeople(peopleData);
        setSearchEvents(eventsData);
      } catch (err) {
        logger.error('Failed to search', { component: 'ExplorePage' }, err instanceof Error ? err : undefined);
      } finally {
        setSearchLoading(false);
      }
    };

    searchAll();
  }, [debouncedQuery]);

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
        <div className="mb-10">
          <ExploreSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search spaces, people, events..."
          />
        </div>

        {/* Content: Search Results OR Curated Feed */}
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
            >
              <SearchResultsSection
                query={debouncedQuery}
                spaces={searchSpaces}
                ghostSpaces={searchGhostSpaces}
                people={searchPeople}
                events={searchEvents}
                loading={searchLoading}
              />
            </motion.div>
          ) : (
            <motion.div
              key="curated-feed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
              className="space-y-12"
            >
              <ForYouSection
                spaces={spaces}
                ghostSpaces={ghostSpaces}
                userProfile={userProfile}
                loading={feedLoading}
              />

              <PopularSection
                spaces={spaces}
                loading={feedLoading}
              />

              <PeopleMajorSection
                people={people}
                major={userProfile?.major || null}
                loading={feedLoading}
              />

              <UpcomingEventsSection
                events={events}
                loading={feedLoading}
              />

              <CampusToolsSection
                tools={tools}
                loading={feedLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
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

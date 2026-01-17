/**
 * useBrowsePageState - Unified state management for Spaces Browse Page
 *
 * Extracts all state, computed values, and handlers from the page.
 * Supports dual-mode: discover (new users) vs dashboard (returning users).
 *
 * @author HIVE Frontend Team
 * @version 4.0.0 - Added dual-mode support (Jan 2026)
 */

'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';
import { toast } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { logger } from '@/lib/logger';
import {
  CategoryKey,
  getTerritory,
  TerritoryConfig,
} from '../territory-config';
import { useMySpaces, type MySpace } from './use-my-spaces';
import { useFriendsSpaces, type FriendsSpace } from './use-friends-spaces';
import { useUpcomingEvents, type UpcomingEvent } from './use-upcoming-events';

// ============================================================
// Types
// ============================================================

export interface SpaceSearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  bannerImage?: string;
  tags?: string[];
  lastActivityAt?: string | null;
  trendingScore?: number;
  postCount?: number;
  recentActivity?: {
    type: 'message' | 'event';
    content: string;
    author?: string;
  };
  // Cold start signals (Jan 2026) - show value without activity
  /** Whether this is an official UB organization */
  isVerified?: boolean;
  /** Number of upcoming events */
  upcomingEventCount?: number;
  /** When the next event starts */
  nextEventAt?: string | null;
  /** Title of the next event */
  nextEventTitle?: string | null;
  /** Number of user's friends in this space */
  mutualCount?: number;
  /** Avatar URLs of mutual friends (max 3) */
  mutualAvatars?: string[];
  /** Number of tools deployed */
  toolCount?: number;
}

export interface JoinCelebration {
  spaceName: string;
  spaceId: string;
}

// ============================================================
// Motion Config Helpers
// ============================================================

export function getSnapSpring(config: TerritoryConfig) {
  return {
    type: 'spring' as const,
    stiffness: config.springStiffness,
    damping: config.springDamping,
    mass: 0.8,
  };
}

export function getSnapVariants(config: TerritoryConfig) {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: getSnapSpring(config),
    },
  };
}

export function getStaggerContainer(config: TerritoryConfig) {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: config.staggerMs / 1000,
        delayChildren: config.baseDelayMs / 1000,
      },
    },
  };
}

// ============================================================
// Activity Helpers
// ============================================================

export function formatActivityTime(lastActivityAt: string | null | undefined): string | null {
  if (!lastActivityAt) return null;
  try {
    const date = new Date(lastActivityAt);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 5) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return null;
  }
}

export function isSpaceLive(space: SpaceSearchResult): boolean {
  const activityText = formatActivityTime(space.lastActivityAt);
  return activityText === 'Active now';
}

export function getActivityLevel(lastActivityAt: string | null | undefined): 'live' | 'recent' | 'quiet' {
  if (!lastActivityAt) return 'quiet';
  const diffMs = Date.now() - new Date(lastActivityAt).getTime();
  const diffMins = diffMs / (1000 * 60);
  if (diffMins < 5) return 'live';
  if (diffMins < 30) return 'recent';
  return 'quiet';
}

// ============================================================
// Browse Mode
// ============================================================

/**
 * Browse mode determines the page layout:
 * - 'discover': New user without spaces - shows events, friends' spaces, categories
 * - 'dashboard': Returning user with spaces - shows "Your Spaces" dashboard
 */
export type BrowseMode = 'discover' | 'dashboard';

// ============================================================
// Hook Return Type
// ============================================================

export interface UseBrowsePageStateReturn {
  // Refs
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  // Motion
  shouldReduceMotion: boolean;
  territoryConfig: TerritoryConfig;
  snapVariants: ReturnType<typeof getSnapVariants>;
  staggerContainer: ReturnType<typeof getStaggerContainer>;
  snapSpring: ReturnType<typeof getSnapSpring>;

  // State
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: CategoryKey;
  setSelectedCategory: (category: CategoryKey) => void;
  loading: boolean;
  loadingMore: boolean;
  isSearching: boolean;
  hasMore: boolean;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;

  // Celebration
  joinCelebration: JoinCelebration | null;

  // Computed
  isSearchMode: boolean;
  featuredSpace: SpaceSearchResult | undefined;
  remainingSpaces: Record<string, SpaceSearchResult[]>;
  searchResults: SpaceSearchResult[];

  // === NEW: Dual-mode support ===
  /** Current browse mode: 'discover' for new users, 'dashboard' for returning users */
  browseMode: BrowseMode;
  /** Whether mode is still being determined */
  modeLoading: boolean;
  /** User's joined spaces (for dashboard mode) */
  mySpaces: MySpace[];
  /** Spaces where user's friends are (for discover mode) */
  friendsSpaces: FriendsSpace[];
  /** Upcoming campus events (for discover mode) */
  upcomingEvents: UpcomingEvent[];
  /** Whether there are events to show */
  hasUpcomingEvents: boolean;
  /** Whether there are friends' spaces to show */
  hasFriendsSpaces: boolean;

  // Handlers
  handleSearch: () => Promise<void>;
  clearSearch: () => void;
  handleJoinSpace: (spaceId: string) => Promise<void>;
  navigateToSpace: (spaceId: string) => void;
  loadMore: () => Promise<void>;
}

// ============================================================
// Hook Implementation
// ============================================================

const LIMIT = 30;

export function useBrowsePageState(): UseBrowsePageStateReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: _user } = useAuth();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion() ?? false;

  // === NEW: Dual-mode hooks ===
  const {
    spaces: mySpaces,
    loading: mySpacesLoading,
    hasSpaces,
  } = useMySpaces();

  // Get IDs of user's spaces to exclude from friends' spaces
  const mySpaceIds = React.useMemo(
    () => mySpaces.map(s => s.id),
    [mySpaces]
  );

  const {
    spaces: friendsSpaces,
    loading: friendsSpacesLoading,
    hasFriendsInSpaces,
  } = useFriendsSpaces(mySpaceIds);

  const {
    events: upcomingEvents,
    loading: eventsLoading,
    hasEvents: hasUpcomingEvents,
  } = useUpcomingEvents(5);

  // Compute browse mode based on whether user has spaces
  const modeLoading = mySpacesLoading;
  const browseMode: BrowseMode = hasSpaces ? 'dashboard' : 'discover';

  // State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryKey>('all');
  const [allSpaces, setAllSpaces] = React.useState<SpaceSearchResult[]>([]);
  const [searchResults, setSearchResults] = React.useState<SpaceSearchResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  // Join celebration
  const [joinCelebration, setJoinCelebration] = React.useState<JoinCelebration | null>(null);

  // Territory config
  const territoryConfig = React.useMemo(() => getTerritory(selectedCategory), [selectedCategory]);
  const snapVariants = React.useMemo(() => getSnapVariants(territoryConfig), [territoryConfig]);
  const staggerContainer = React.useMemo(() => getStaggerContainer(territoryConfig), [territoryConfig]);
  const snapSpring = React.useMemo(() => getSnapSpring(territoryConfig), [territoryConfig]);

  // Computed: Is in search mode?
  const isSearchMode = searchQuery.trim().length > 0;

  // Computed: Spaces grouped by category
  const spacesByCategory = React.useMemo(() => {
    const grouped: Record<string, SpaceSearchResult[]> = {};
    const filtered = selectedCategory === 'all'
      ? allSpaces
      : allSpaces.filter(s => s.category === selectedCategory);

    filtered.forEach((space) => {
      const cat = space.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(space);
    });

    return grouped;
  }, [allSpaces, selectedCategory]);

  // Computed: Featured/trending space
  const featuredSpace = React.useMemo(() => {
    const filtered = selectedCategory === 'all'
      ? allSpaces
      : allSpaces.filter(s => s.category === selectedCategory);

    return filtered.sort((a, b) => {
      const aLive = isSpaceLive(a) ? 1 : 0;
      const bLive = isSpaceLive(b) ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;
      return (b.trendingScore || 0) - (a.trendingScore || 0);
    })[0];
  }, [allSpaces, selectedCategory]);

  // Computed: Remaining spaces (exclude featured)
  const remainingSpaces = React.useMemo(() => {
    if (!featuredSpace) return spacesByCategory;

    const grouped: Record<string, SpaceSearchResult[]> = {};
    Object.entries(spacesByCategory).forEach(([cat, spaces]) => {
      grouped[cat] = spaces.filter(s => s.id !== featuredSpace.id);
    });

    return grouped;
  }, [spacesByCategory, featuredSpace]);

  // Auto-focus search from URL param
  React.useEffect(() => {
    if (searchParams.get('focus') === 'search') {
      searchInputRef.current?.focus();
    }
  }, [searchParams]);

  // Load initial spaces
  React.useEffect(() => {
    loadAllSpaces();
  }, []);

  const loadAllSpaces = async () => {
    try {
      setLoading(true);

      const res = await secureApiFetch(`/api/spaces/browse-v2?limit=${LIMIT}&sort=trending`, {
        method: 'GET',
      });
      const response = await res.json();
      const spaces = response?.data?.spaces || response?.spaces || [];
      const cursor = response?.data?.nextCursor || response?.nextCursor || null;
      setAllSpaces(spaces);
      setNextCursor(cursor);
      setHasMore(!!cursor);
    } catch (error) {
      logger.error('Failed to load spaces', { component: 'SpacesBrowsePage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to load spaces', 'Please refresh the page to try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || !nextCursor) return;

    try {
      setLoadingMore(true);

      // Use cursor-based pagination (not offset)
      const res = await secureApiFetch(`/api/spaces/browse-v2?limit=${LIMIT}&cursor=${encodeURIComponent(nextCursor)}&sort=trending`, {
        method: 'GET',
      });
      const response = await res.json();
      const spaces = response?.data?.spaces || response?.spaces || [];
      const cursor = response?.data?.nextCursor || response?.nextCursor || null;

      setAllSpaces(prev => [...prev, ...spaces]);
      setNextCursor(cursor);
      setHasMore(!!cursor);
    } catch (error) {
      logger.error('Failed to load more spaces', { component: 'SpacesBrowsePage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to load more spaces', 'Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);

      const res = await secureApiFetch('/api/spaces/search', {
        method: 'POST',
        body: JSON.stringify({
          q: searchQuery,
          limit: 20,
          offset: 0,
        }),
      });
      const response = await res.json();
      const spaces = response?.data?.spaces || response?.spaces || [];
      setSearchResults(spaces);
    } catch (error) {
      logger.error('Search failed', { component: 'SpacesBrowsePage' }, error instanceof Error ? error : undefined);
      toast.error('Search failed', 'Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = React.useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  }, []);

  const handleJoinSpace = async (spaceId: string) => {
    try {
      const res = await secureApiFetch('/api/spaces/join', {
        method: 'POST',
        body: JSON.stringify({ spaceId }),
      });
      if (!res.ok) throw new Error(`Join failed: ${res.status}`);

      const space = [...allSpaces, ...searchResults].find((s) => s.id === spaceId);
      const spaceName = space?.name || 'the space';

      setJoinCelebration({ spaceName, spaceId });

      setTimeout(() => {
        setJoinCelebration(null);
        router.push(`/spaces/${spaceId}`);
      }, 1500);
    } catch (error) {
      logger.error('Failed to join space', { component: 'SpacesBrowsePage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to join', 'Please try again.');
    }
  };

  const navigateToSpace = React.useCallback((spaceId: string) => {
    router.push(`/spaces/${spaceId}`);
  }, [router]);

  return {
    // Refs
    searchInputRef,

    // Motion
    shouldReduceMotion,
    territoryConfig,
    snapVariants,
    staggerContainer,
    snapSpring,

    // State
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    loading,
    loadingMore,
    isSearching,
    hasMore,
    isFocused,
    setIsFocused,

    // Celebration
    joinCelebration,

    // Computed
    isSearchMode,
    featuredSpace,
    remainingSpaces,
    searchResults,

    // === NEW: Dual-mode support ===
    browseMode,
    modeLoading,
    mySpaces,
    friendsSpaces,
    upcomingEvents,
    hasUpcomingEvents,
    hasFriendsSpaces: hasFriendsInSpaces,

    // Handlers
    handleSearch,
    clearSearch,
    handleJoinSpace,
    navigateToSpace,
    loadMore,
  };
}

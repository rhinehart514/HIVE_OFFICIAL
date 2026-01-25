'use client';

/**
 * DiscoverSection - Browse and join new spaces
 *
 * Features:
 * - Tab navigation by category
 * - Server-side search with debounce
 * - Infinite scroll with cursor-based pagination
 * - Smart sorting with social proof
 *
 * @version 2.0.0 - Added infinite scroll + server-side search (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  Text,
  Skeleton,
  CategoryScroller,
  type CategoryItem,
} from '@hive/ui/design-system/primitives';
import { MOTION } from '@hive/tokens';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { toast } from '@hive/ui';
import {
  SpaceListRow,
  SpaceListRowSkeleton,
  type SpaceListRowSpace,
} from './space-list-row';
import { SpacePreviewModal, type SpacePreviewData } from './space-preview-modal';

// ============================================================
// Hooks
// ============================================================

/**
 * Debounce hook for search input
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Intersection observer hook for infinite scroll
 */
function useIntersectionObserver(
  callback: () => void,
  options?: IntersectionObserverInit
) {
  const targetRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        callback();
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return targetRef;
}

// ============================================================
// Types
// ============================================================

export type DiscoverTab = 'student_orgs' | 'uni_services' | 'residential' | 'greek';

export interface DiscoverSpace extends SpaceListRowSpace {
  trendingScore?: number;
}

export interface DiscoverSectionProps {
  onNavigateToSpace: (spaceId: string) => void;
  onJoinSpace: (spaceId: string) => Promise<void>;
  joinedSpaceIds?: Set<string>;
}

// ============================================================
// Tab Config
// ============================================================

const TABS: { value: DiscoverTab; label: string; apiCategory: string }[] = [
  { value: 'student_orgs', label: 'Student Orgs', apiCategory: 'all' },
  { value: 'uni_services', label: 'Uni Services', apiCategory: 'official' },
  { value: 'residential', label: 'Residential', apiCategory: 'residential' },
  { value: 'greek', label: 'Greek', apiCategory: 'greek' },
];

// ============================================================
// Smart Sorting
// ============================================================

function computeSpaceScore(
  space: DiscoverSpace,
  joinedSpaceIds: Set<string>
): number {
  let score = 0;

  // Social proof (heaviest weight)
  score += (space.mutualCount || 0) * 100;

  // Activity signals
  if (space.lastActivityAt) {
    const hoursSinceActivity =
      (Date.now() - new Date(space.lastActivityAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceActivity < 24) score += 50;
  }

  // Events
  if (space.upcomingEventCount && space.upcomingEventCount > 0) score += 30;

  // Verification trust
  if (space.isVerified) score += 20;

  // Size (logarithmic - big isn't always better)
  score += Math.log10(Math.max(space.memberCount, 1)) * 10;

  // Trending score from API
  score += (space.trendingScore || 0) * 0.5;

  return score;
}

function sortSpacesBySmart(
  spaces: DiscoverSpace[],
  joinedSpaceIds: Set<string>
): DiscoverSpace[] {
  return [...spaces].sort((a, b) => {
    const scoreA = computeSpaceScore(a, joinedSpaceIds);
    const scoreB = computeSpaceScore(b, joinedSpaceIds);
    return scoreB - scoreA;
  });
}

// ============================================================
// Search Input
// ============================================================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

function SearchInput({ value, onChange, onClear, placeholder }: SearchInputProps) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Search spaces...'}
        className={cn(
          'w-full bg-white/[0.02] border border-white/[0.06]',
          'rounded-lg py-2.5 pl-9 pr-9',
          'text-sm text-white placeholder:text-white/30',
          'focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/[0.04]',
          'transition-all duration-150'
        )}
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
        >
          <XMarkIcon className="w-3 h-3 text-white/40" />
        </button>
      )}
    </div>
  );
}

// ============================================================
// Tab Pills
// ============================================================

interface TabPillsProps {
  tabs: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

function TabPills({ tabs, selected, onSelect }: TabPillsProps) {
  const items: CategoryItem[] = tabs.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  return (
    <CategoryScroller
      items={items}
      value={selected}
      onValueChange={onSelect}
      size="sm"
      showFades={true}
    />
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState({ isSearch }: { isSearch?: boolean }) {
  return (
    <motion.div
      className="py-24 px-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: MOTION.ease.premium }}
    >
      {/* Icon with entrance */}
      <motion.div
        className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: MOTION.ease.premium }}
      >
        <MagnifyingGlassIcon className="w-6 h-6 text-white/20" />
      </motion.div>

      {/* Narrative headline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: MOTION.ease.premium }}
      >
        <h3
          className="text-title-lg md:text-heading-sm font-semibold text-white mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {isSearch ? 'Nothing here yet' : 'This category is empty'}
        </h3>
        <p className="text-body-lg text-white/40 max-w-sm mx-auto mb-6">
          {isSearch
            ? 'Try adjusting your search or explore other categories to find your community.'
            : 'Check back soon — new spaces are being created every day.'
          }
        </p>

        {/* Recovery action */}
        {isSearch && (
          <button
            onClick={() => window.location.reload()}
            className="text-body-sm text-[var(--color-gold)]/60 hover:text-[var(--color-gold)]/80 transition-colors"
          >
            Clear search
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Constants
// ============================================================

const ITEMS_PER_PAGE = 30;
const SEARCH_DEBOUNCE_MS = 300;

// ============================================================
// Main Component
// ============================================================

export function DiscoverSection({
  onNavigateToSpace,
  onJoinSpace,
  joinedSpaceIds = new Set(),
}: DiscoverSectionProps) {
  const [selectedTab, setSelectedTab] = React.useState<DiscoverTab>('student_orgs');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [spaces, setSpaces] = React.useState<DiscoverSpace[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [joiningId, setJoiningId] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [cursor, setCursor] = React.useState<string | undefined>(undefined);
  const [previewSpace, setPreviewSpace] = React.useState<SpacePreviewData | null>(null);

  // Debounce search query for server-side search
  const debouncedSearch = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

  // Transform API response to DiscoverSpace format
  const transformSpaces = React.useCallback(
    (fetchedSpaces: {
      id: string;
      name: string;
      description?: string;
      bannerImage?: string;
      iconURL?: string;
      coverImageURL?: string;
      memberCount?: number;
      category?: string;
      isVerified?: boolean;
      isJoined?: boolean;
      lastActivityAt?: string;
      trendingScore?: number;
      mutualCount?: number;
      mutualAvatars?: string[];
      upcomingEventCount?: number;
      nextEventTitle?: string;
    }[]): DiscoverSpace[] => {
      return fetchedSpaces.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        avatarUrl: s.iconURL || s.bannerImage,
        bannerUrl: s.coverImageURL || s.bannerImage,
        category: s.category,
        memberCount: s.memberCount || 0,
        isVerified: s.isVerified,
        isJoined: s.isJoined || joinedSpaceIds.has(s.id),
        lastActivityAt: s.lastActivityAt,
        trendingScore: s.trendingScore,
        mutualCount: s.mutualCount,
        mutualAvatars: s.mutualAvatars,
        upcomingEventCount: s.upcomingEventCount,
        nextEventTitle: s.nextEventTitle,
      }));
    },
    [joinedSpaceIds]
  );

  // Fetch spaces (initial load or when tab/search changes)
  const fetchSpaces = React.useCallback(async (
    isLoadMore = false,
    currentCursor?: string
  ) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setCursor(undefined);
    }

    try {
      const tabConfig = TABS.find((t) => t.value === selectedTab);
      const category = tabConfig?.apiCategory || 'all';

      // Build URL with search and cursor params
      const params = new URLSearchParams({
        category,
        limit: String(ITEMS_PER_PAGE),
        sort: 'trending',
      });

      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }

      if (isLoadMore && currentCursor) {
        params.set('cursor', currentCursor);
      }

      const res = await secureApiFetch(
        `/api/spaces/browse-v2?${params.toString()}`,
        { method: 'GET' }
      );
      const data = await res.json();
      const fetchedSpaces = data?.data?.spaces || data?.spaces || [];
      const nextCursor = data?.data?.nextCursor || data?.nextCursor;
      const hasMoreData = data?.data?.hasMore ?? data?.hasMore ?? false;

      const transformedSpaces = transformSpaces(fetchedSpaces);

      if (isLoadMore) {
        // Append to existing spaces (dedup by ID)
        setSpaces((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newSpaces = transformedSpaces.filter((s) => !existingIds.has(s.id));
          return [...prev, ...newSpaces];
        });
      } else {
        // Replace spaces
        setSpaces(transformedSpaces);
      }

      setCursor(nextCursor);
      setHasMore(hasMoreData);
    } catch {
      if (!isLoadMore) {
        toast.error('Failed to load spaces', 'Please try again.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedTab, debouncedSearch, transformSpaces]);

  // Initial fetch and refetch when tab or debounced search changes
  React.useEffect(() => {
    fetchSpaces(false);
  }, [selectedTab, debouncedSearch, fetchSpaces]);

  // Load more handler
  const handleLoadMore = React.useCallback(() => {
    if (!loadingMore && hasMore && cursor) {
      fetchSpaces(true, cursor);
    }
  }, [loadingMore, hasMore, cursor, fetchSpaces]);

  // Intersection observer for infinite scroll
  const loadMoreRef = useIntersectionObserver(handleLoadMore, {
    rootMargin: '200px', // Start loading 200px before reaching the end
  });

  // Sort spaces by smart algorithm
  const displayedSpaces = React.useMemo(() => {
    return sortSpacesBySmart(spaces, joinedSpaceIds);
  }, [spaces, joinedSpaceIds]);

  // Handle join
  const handleJoin = async (spaceId: string) => {
    setJoiningId(spaceId);
    try {
      await onJoinSpace(spaceId);
      // Update local state to reflect joined status
      setSpaces((prev) =>
        prev.map((s) => (s.id === spaceId ? { ...s, isJoined: true } : s))
      );
      // Also update preview space if it's currently shown
      if (previewSpace?.id === spaceId) {
        setPreviewSpace((prev) => prev ? { ...prev, isJoined: true } : null);
      }
    } catch {
      // Join failed - joiningId will reset in finally
    } finally {
      setJoiningId(null);
    }
  };

  // Handle space card click - open preview modal
  const handleSpaceClick = React.useCallback((space: DiscoverSpace) => {
    const previewData: SpacePreviewData = {
      id: space.id,
      name: space.name,
      description: space.description,
      avatarUrl: space.avatarUrl,
      bannerUrl: space.bannerUrl,
      category: space.category,
      memberCount: space.memberCount,
      onlineCount: undefined, // Not available in browse data
      isJoined: space.isJoined || joinedSpaceIds.has(space.id),
      isVerified: space.isVerified,
      upcomingEvents: space.nextEventTitle
        ? [{ id: '1', title: space.nextEventTitle, date: new Date().toISOString() }]
        : undefined,
      toolCount: undefined, // Could be added if available
    };
    setPreviewSpace(previewData);
  }, [joinedSpaceIds]);

  // Handle preview modal join
  const handlePreviewJoin = async (spaceId: string) => {
    await handleJoin(spaceId);
  };

  return (
    <section>
      {/* Header */}
      <Text
        weight="medium"
        className="text-label-sm uppercase tracking-wider text-white/40 mb-4"
      >
        Discover
      </Text>

      {/* Tabs */}
      <div className="mb-4">
        <TabPills
          tabs={TABS}
          selected={selectedTab}
          onSelect={(v) => setSelectedTab(v as DiscoverTab)}
        />
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder={`Search ${TABS.find((t) => t.value === selectedTab)?.label || 'spaces'}...`}
        />
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="rounded-xl border border-white/[0.06] overflow-hidden"
        >
          {loading ? (
            // Loading skeleton
            <div>
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(i !== 5 && 'border-b border-white/[0.04]')}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: i * 0.05,
                    ease: MOTION.ease.premium
                  }}
                >
                  <SpaceListRowSkeleton />
                </motion.div>
              ))}
            </div>
          ) : displayedSpaces.length === 0 ? (
            // Empty state
            <EmptyState isSearch={!!searchQuery} />
          ) : (
            // Results list
            <div>
              {displayedSpaces.map((space, index) => (
                <motion.div
                  key={space.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.15 }}
                  className={cn(
                    'border-b border-white/[0.04] last:border-b-0'
                  )}
                >
                  <SpaceListRow
                    space={{
                      ...space,
                      isJoined: space.isJoined || joinedSpaceIds.has(space.id),
                    }}
                    onClick={() => handleSpaceClick(space)}
                    onJoin={() => handleJoin(space.id)}
                    showJoinButton={true}
                    showActivityIndicator={false}
                  />
                </motion.div>
              ))}

              {/* Loading more indicator */}
              {loadingMore && (
                <div className="py-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={`loading-${i}`}
                      className={cn(i !== 2 && 'border-b border-white/[0.04]')}
                    >
                      <SpaceListRowSkeleton />
                    </div>
                  ))}
                </div>
              )}

              {/* Infinite scroll trigger */}
              {hasMore && !loadingMore && (
                <div
                  ref={loadMoreRef}
                  className="h-4"
                  aria-hidden="true"
                />
              )}

              {/* End of results indicator */}
              {!hasMore && displayedSpaces.length > ITEMS_PER_PAGE && (
                <div className="py-4 text-center">
                  <Text size="sm" className="text-white/30">
                    You've seen all {displayedSpaces.length} spaces
                  </Text>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Space Preview Modal */}
      <SpacePreviewModal
        space={previewSpace}
        isOpen={!!previewSpace}
        onClose={() => setPreviewSpace(null)}
        onJoin={handlePreviewJoin}
      />
    </section>
  );
}

export default DiscoverSection;

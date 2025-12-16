'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, Badge, toast } from '@hive/ui';
import {
  Search,
  Users,
  SlidersHorizontal,
  ChevronLeft,
  X
} from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { motion, useReducedMotion } from 'framer-motion';
import { logger } from '@/lib/logger';

// Spring config for fluid motion
const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

// Stagger children animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_CONFIG,
  },
};

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

// Note: 'residential' category exists but is hidden from browse UI
// Residential spaces have locked leadership (RA-only) and aren't ready for self-service
type CategoryKey = 'all' | 'student_org' | 'university_org' | 'greek_life';

const CATEGORIES: Record<CategoryKey, string> = {
  all: 'All',
  student_org: 'Student Orgs',
  university_org: 'University',
  greek_life: 'Greek Life',
};

interface SearchFilters {
  category?: string;
  memberCountMin?: number;
  memberCountMax?: number;
}

interface SpaceSearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  bannerImage?: string;
  tags?: string[];
}

// =============================================================================
// SPACE SEARCH CARD
// =============================================================================

function SpaceSearchCard({
  space,
  onClick,
  onJoin
}: {
  space: SpaceSearchResult;
  onClick: () => void;
  onJoin: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={itemVariants}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)] hover:border-[var(--hive-border-hover)] cursor-pointer group focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
      whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.01 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      transition={SPRING_CONFIG}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Avatar */}
      <div className="h-14 w-14 rounded-xl bg-[var(--hive-background-tertiary)] flex items-center justify-center flex-shrink-0">
        {space.bannerImage ? (
          <img src={space.bannerImage} alt={space.name} className="h-full w-full rounded-xl object-cover" />
        ) : (
          <span className="text-xl font-bold text-[var(--hive-text-primary)]">
            {space.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--hive-text-primary)] truncate group-hover:text-white transition-colors">
          {space.name}
        </h3>
        <p className="text-sm text-[var(--hive-text-secondary)] line-clamp-1 mb-1">
          {space.description || 'No description'}
        </p>
        <div className="flex items-center gap-3 text-xs text-[var(--hive-text-tertiary)]">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {space.memberCount} members
          </span>
          {space.category && (
            <Badge variant="secondary" className="text-xs px-2 py-0">
              {CATEGORIES[space.category as CategoryKey] || space.category}
            </Badge>
          )}
        </div>
      </div>

      {/* Join button */}
      <motion.div
        whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
      >
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onJoin();
          }}
          className="flex-shrink-0 focus-visible:ring-2 focus-visible:ring-white/20"
        >
          Join
        </Button>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function SpacesBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: _user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  // Auto-focus search input if coming from /spaces/search redirect
  useEffect(() => {
    if (searchParams.get('focus') === 'search') {
      searchInputRef.current?.focus();
    }
  }, [searchParams]);
  const [results, setResults] = useState<SpaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  // Load initial spaces when category changes
  useEffect(() => {
    setOffset(0);
    loadSpaces(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const loadSpaces = async (currentOffset: number = 0, replace: boolean = false) => {
    try {
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(currentOffset),
      });
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }

      const res = await secureApiFetch(`/api/spaces?${params}`, { method: 'GET' });
      const response = await res.json();
      const newSpaces = response?.data?.spaces || response?.spaces || [];

      if (replace) {
        setResults(newSpaces);
      } else {
        setResults(prev => [...prev, ...newSpaces]);
      }

      // Check if there are more results
      setHasMore(newSpaces.length === LIMIT);
    } catch (error) {
      logger.error('Failed to load spaces', { component: 'SpacesBrowsePage' }, error instanceof Error ? error : undefined);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    loadSpaces(newOffset, false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setOffset(0);
      loadSpaces(0, true);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      setOffset(0);

      const res = await secureApiFetch('/api/spaces/search', {
        method: 'POST',
        body: JSON.stringify({
          q: searchQuery,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          ...filters,
          limit: LIMIT,
          offset: 0,
        })
      });
      const response = await res.json();
      const spaces = response?.data?.spaces || response?.spaces || [];
      setResults(spaces);
      setHasMore(spaces.length === LIMIT);
    } catch (error) {
      logger.error('Search failed', { component: 'SpacesBrowsePage' }, error instanceof Error ? error : undefined);
      toast.error('Search failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSpace = async (spaceId: string) => {
    try {
      const res = await secureApiFetch('/api/spaces/join', {
        method: 'POST',
        body: JSON.stringify({ spaceId }),
      });
      if (!res.ok) throw new Error(`Join failed: ${res.status}`);

      toast.success('Joined space', 'Welcome aboard!');
      router.push(`/spaces/${spaceId}`);
    } catch (error) {
      logger.error('Failed to join space', { component: 'SpacesBrowsePage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to join', 'Please try again.');
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSelectedCategory('all');
    setHasSearched(false);
    setOffset(0);
    loadSpaces(0, true);
  };

  const activeFilterCount = Object.keys(filters).filter(k => filters[k as keyof SearchFilters] !== undefined).length;

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-[var(--hive-background-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--hive-background-primary)]/80 backdrop-blur-xl border-b border-[var(--hive-border-default)]">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-4">
          {/* Title row */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push('/spaces')}
              className="p-2 -ml-2 rounded-lg text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-secondary)] transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
              aria-label="Go back to spaces"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--hive-text-primary)]">Browse Spaces</h1>
              <p className="text-sm text-[var(--hive-text-secondary)]">
                {hasSearched ? `${results.length} results` : `${results.length} spaces available`}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--hive-text-tertiary)] w-4 h-4" />
              <Input
                ref={searchInputRef}
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]"
              />
            </div>

            <Button
              onClick={handleSearch}
              className="bg-[#FFD700] text-[#0A0A0A] hover:bg-[#FFD700]/90 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none font-medium"
            >
              Search
            </Button>

            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="secondary"
              className={`relative focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none ${showFilters ? 'bg-[var(--hive-background-tertiary)]' : ''}`}
              aria-label={showFilters ? 'Hide filters' : 'Show filters'}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--hive-brand-primary)] text-[var(--hive-obsidian)] text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
            {(Object.entries(CATEGORIES) as [CategoryKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none ${
                  selectedCategory === key
                    ? 'bg-[var(--hive-text-primary)] text-[var(--hive-background-primary)]'
                    : 'bg-[var(--hive-background-secondary)] text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-[var(--hive-background-secondary)] rounded-xl border border-[var(--hive-border-default)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--hive-text-primary)]">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)] flex items-center gap-1"
                    aria-label="Clear all filters"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Member Count Range */}
                <div>
                  <label className="text-sm text-[var(--hive-text-secondary)] mb-2 block">Member Count</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.memberCountMin || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, memberCountMin: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="w-1/2 bg-[var(--hive-background-tertiary)] border border-[var(--hive-border-default)] rounded-lg px-3 py-2 text-[var(--hive-text-primary)] text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.memberCountMax || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, memberCountMax: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="w-1/2 bg-[var(--hive-background-tertiary)] border border-[var(--hive-border-default)] rounded-lg px-3 py-2 text-[var(--hive-text-primary)] text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Results */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)] animate-pulse">
                <div className="h-14 w-14 rounded-xl bg-[var(--hive-background-tertiary)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-[var(--hive-background-tertiary)] rounded" />
                  <div className="h-3 w-64 bg-[var(--hive-background-tertiary)] rounded" />
                  <div className="h-3 w-24 bg-[var(--hive-background-tertiary)] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <Card className="p-12 text-center bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--hive-background-tertiary)] flex items-center justify-center">
              <Search className="h-6 w-6 text-[var(--hive-text-tertiary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--hive-text-primary)] mb-2">
              No Spaces Found
            </h3>
            <p className="text-[var(--hive-text-secondary)] mb-6">
              {hasSearched ? 'Try adjusting your search or filters' : 'No spaces available yet'}
            </p>
            {hasSearched && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <>
            <motion.div
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {results.map((space) => (
                <SpaceSearchCard
                  key={space.id}
                  space={space}
                  onClick={() => router.push(`/spaces/${space.id}`)}
                  onJoin={() => handleJoinSpace(space.id)}
                />
              ))}
            </motion.div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-6 text-center">
                <Button
                  variant="secondary"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="min-w-[140px]"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

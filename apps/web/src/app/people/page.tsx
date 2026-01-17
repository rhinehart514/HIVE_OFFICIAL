'use client';

/**
 * /people — People Discovery
 *
 * Archetype: Discovery
 * Pattern: Search + Filter + Cards
 * Shell: ON
 *
 * Features:
 * - Search by name/handle
 * - Filter by major, graduation year, interests
 * - Show mutual connections
 * - "Recommended for you" section
 *
 * @version 1.0.0 - Initial implementation (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import {
  Text,
  Button,
  Skeleton,
  CategoryScroller,
  type CategoryItem,
} from '@hive/ui/design-system/primitives';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { logger } from '@/lib/logger';

// ============================================================
// Types
// ============================================================

interface PersonResult {
  id: string;
  title: string; // displayName
  description?: string; // bio or "Major • Year"
  type: 'person';
  category: string;
  url: string;
  metadata?: {
    handle?: string;
    photoURL?: string;
    major?: string;
    year?: number;
  };
  relevanceScore: number;
}

interface SearchResponse {
  results: PersonResult[];
  totalCount: number;
  query: string;
  category: string;
}

type FilterCategory = 'all' | 'classmates' | 'mutuals' | 'freshmen' | 'seniors';

// ============================================================
// Constants
// ============================================================

const FILTER_OPTIONS: CategoryItem[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'classmates', label: 'Classmates' },
  { value: 'mutuals', label: 'Mutuals' },
  { value: 'freshmen', label: 'Freshmen' },
  { value: 'seniors', label: 'Seniors' },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeIn = (delay: number = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: EASE },
});

// ============================================================
// Components
// ============================================================

function PersonCard({
  person,
  onView,
}: {
  person: PersonResult;
  onView: (id: string) => void;
}) {
  const photoURL = person.metadata?.photoURL;
  const handle = person.metadata?.handle;
  const initials = person.title?.charAt(0) || '?';

  return (
    <motion.button
      onClick={() => onView(person.id)}
      className="
        group flex items-center gap-4 p-4 rounded-xl
        bg-white/[0.02] border border-white/[0.06]
        hover:bg-white/[0.04] hover:border-white/[0.08]
        transition-all duration-200
        text-left w-full
      "
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="w-14 h-14 rounded-xl overflow-hidden"
          style={{
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.06),
              inset 0 1px 1px rgba(255,255,255,0.04)
            `,
          }}
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={person.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              }}
            >
              <span className="text-lg font-semibold text-white/30">
                {initials}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-white truncate">
          {person.title}
        </p>
        {handle && (
          <p className="text-sm text-white/40">@{handle}</p>
        )}
        {person.description && (
          <p className="text-sm text-white/50 mt-0.5 line-clamp-1">
            {person.description}
          </p>
        )}
      </div>

      {/* View action */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-white/40">→</span>
      </div>
    </motion.button>
  );
}

function EmptyState({ query }: { query?: string }) {
  return (
    <motion.div
      {...fadeIn(0.1)}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-6">
        <UserGroupIcon className="w-7 h-7 text-white/30" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">
        {query ? `No results for "${query}"` : 'Find your people'}
      </h3>
      <p className="text-sm text-white/40 text-center max-w-sm">
        {query
          ? 'Try a different name or handle'
          : 'Search for classmates, connect with people who share your interests'
        }
      </p>
    </motion.div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-[88px] rounded-xl" />
      ))}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function PeopleDiscoveryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilter, setSelectedFilter] = React.useState<FilterCategory>('all');
  const [results, setResults] = React.useState<PersonResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  // Debounced search
  React.useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);

      try {
        const res = await secureApiFetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&category=people&limit=20`,
          { method: 'GET' }
        );

        if (!res.ok) {
          throw new Error(`Search failed: ${res.status}`);
        }

        const data: SearchResponse = await res.json();
        setResults(data.results || []);
      } catch (error) {
        logger.error('People search failed', {
          error: error instanceof Error ? error.message : String(error),
          component: 'PeopleDiscoveryPage',
        });
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleViewProfile = (personId: string) => {
    router.push(`/profile/${personId}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen w-full">
      <main className="max-w-4xl mx-auto px-6 py-8" aria-label="People discovery">
        {/* Header */}
        <motion.header {...fadeIn(0)} className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">
            Find People
          </h1>
          <Text size="sm" className="text-white/40">
            Connect with classmates and discover new people at UB
          </Text>
        </motion.header>

        {/* Search Bar */}
        <motion.div {...fadeIn(0.05)} className="mb-6">
          <div
            className="relative rounded-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              background: isFocused
                ? 'linear-gradient(180deg, rgba(56,56,56,1), rgba(44,44,44,1))'
                : 'linear-gradient(180deg, rgba(48,48,48,1), rgba(38,38,38,1))',
              boxShadow: isFocused
                ? '0 6px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)'
                : '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B70]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search by name or @handle..."
              className="
                w-full bg-transparent border-0 outline-none
                py-4 pl-12 pr-12 text-[15px]
                text-[#FAF9F7] placeholder:text-[#6B6B70]
                transition-all duration-300
              "
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="
                  absolute right-4 top-1/2 -translate-y-1/2
                  w-6 h-6 rounded-full bg-white/[0.1]
                  flex items-center justify-center
                  hover:bg-white/[0.15] transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                "
              >
                <XMarkIcon className="w-3.5 h-3.5 text-[#A3A19E]" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Filter Pills */}
        <motion.div {...fadeIn(0.1)} className="mb-8">
          <CategoryScroller
            items={FILTER_OPTIONS}
            value={selectedFilter}
            onValueChange={(value) => setSelectedFilter(value as FilterCategory)}
            size="default"
            showFades={false}
          />
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingGrid />
            </motion.div>
          ) : hasSearched && results.length === 0 ? (
            <EmptyState query={searchQuery} />
          ) : results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Results count */}
              <div className="flex items-center gap-3 mb-4">
                <Text size="xs" className="text-white/40 uppercase tracking-wider">
                  {results.length} {results.length === 1 ? 'person' : 'people'} found
                </Text>
              </div>

              {/* Results grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.map((person, index) => (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <PersonCard
                      person={person}
                      onView={handleViewProfile}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Initial state - show prompt */
            <EmptyState />
          )}
        </AnimatePresence>

        {/* Quick tip */}
        {!hasSearched && (
          <motion.div
            {...fadeIn(0.2)}
            className="mt-12 flex items-center justify-center gap-3 text-[13px] text-white/40"
          >
            <AcademicCapIcon className="w-4 h-4" />
            <span>Try searching for a classmate's name or @handle</span>
          </motion.div>
        )}
      </main>
    </div>
  );
}

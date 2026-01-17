'use client';

/**
 * Browse Page Sections
 *
 * Major UI sections extracted from the browse page for better organization.
 * Uses HIVE design system primitives.
 *
 * @version 4.1.0 - Primitives integration (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence, type Variants, type Transition } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Design system primitives
import {
  Input,
  Button,
  Text,
  Heading,
  Skeleton,
  SkeletonSpaceCard,
  CategoryScroller,
  type CategoryItem,
} from '@hive/ui/design-system/primitives';

import { CategoryKey, CATEGORY_LABELS } from '../territory-config';
import { type SpaceSearchResult, type RecommendedSpace } from '../hooks';
import { HeroSpaceCard, NeighborhoodCard, JoinButton } from './browse-cards';

// ============================================================
// Category Display Names (8-category system)
// ============================================================

const CATEGORY_DISPLAY: Record<CategoryKey, string> = {
  all: 'Trending',
  academics: 'Academics',
  social: 'Social',
  professional: 'Professional',
  interests: 'Interests',
  cultural: 'Cultural',
  service: 'Service',
  official: 'Official',
};

// ============================================================
// Territory Atmosphere
// ============================================================

export function TerritoryAtmosphere({
  isVisible,
  category,
  gradientAccent,
}: {
  isVisible: boolean;
  category: CategoryKey;
  gradientAccent?: string;
}) {
  if (!isVisible) return null;

  return (
    <motion.div
      key={category}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 pointer-events-none z-0"
    >
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
        style={{
          background: `radial-gradient(ellipse at center bottom, ${gradientAccent || 'rgba(255,255,255,0.02)'} 0%, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}

// ============================================================
// First-Time Welcome Card (Shown once after entry)
// ============================================================

const FIRST_VISIT_KEY = 'hive-first-visit-shown';

interface FirstTimeWelcomeProps {
  variants: Variants;
  userName?: string;
}

export function FirstTimeWelcome({ variants, userName }: FirstTimeWelcomeProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    // Check if we came from entry flow (sessionStorage flag)
    const cameFromEntry = sessionStorage.getItem('hive-just-entered');
    const hasSeenWelcome = localStorage.getItem(FIRST_VISIT_KEY);

    if (cameFromEntry && !hasSeenWelcome) {
      setIsVisible(true);
      // Clear the entry flag
      sessionStorage.removeItem('hive-just-entered');
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(FIRST_VISIT_KEY, 'true');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,215,0,0.02) 100%)',
          border: '1px solid rgba(255,215,0,0.15)',
        }}
      >
        {/* Subtle glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top left, rgba(255,215,0,0.1) 0%, transparent 50%)',
          }}
        />

        <div className="relative p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Welcome message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-3"
              >
                <span className="text-2xl">✨</span>
                <h2 className="text-xl font-semibold text-white">
                  Welcome to HIVE{userName ? `, ${userName.split(' ')[0]}` : ''}
                </h2>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-[15px] text-white/60 mb-4 max-w-xl"
              >
                You're now part of UB's student community platform. Start by joining a few spaces —
                they're where all the action happens.
              </motion.p>

              {/* Quick actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center gap-3"
              >
                <div className="flex items-center gap-2 text-[13px] text-white/50">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
                  Browse spaces below
                </div>
                <div className="text-white/20">→</div>
                <div className="flex items-center gap-2 text-[13px] text-white/50">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
                  Click "Join" on any that interest you
                </div>
                <div className="text-white/20">→</div>
                <div className="flex items-center gap-2 text-[13px] text-white/50">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">3</span>
                  Start chatting & connecting
                </div>
              </motion.div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg text-white/30 hover:text-white/50 hover:bg-white/5 transition-colors"
              aria-label="Dismiss welcome message"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Discover Hero (Cold-Start Welcome Section)
// ============================================================

interface DiscoverHeroProps {
  totalSpaces?: number;
  variants: Variants;
  userName?: string;
  isFirstVisit?: boolean;
}

export function DiscoverHero({ totalSpaces = 400, variants, userName, isFirstVisit }: DiscoverHeroProps) {
  return (
    <>
      {/* First-time welcome card */}
      <FirstTimeWelcome variants={variants} userName={userName} />

      <motion.header
        variants={variants}
        initial="hidden"
        animate="visible"
        className="text-center mb-10"
      >
        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3"
        >
          Discover your people
        </motion.h1>

        {/* Value prop */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg text-white/50 mb-6"
        >
          {totalSpaces}+ communities, clubs, and organizations at UB
        </motion.p>

        {/* Quick tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 text-[13px]"
        >
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--life-gold)]" />
            Live activity shown
          </span>
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            Join instantly
          </span>
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            See mutual friends
          </span>
        </motion.div>
      </motion.header>
    </>
  );
}

// ============================================================
// Search Input (Pure Float Style)
// ============================================================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onFocus: () => void;
  onBlur: () => void;
  variants: Variants;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onSearch, onClear, onFocus, onBlur, variants }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="relative max-w-xl mx-auto mb-8"
      >
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
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            onFocus={() => {
              setIsFocused(true);
              onFocus();
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur();
            }}
            placeholder="Search 400+ communities..."
            className="
              w-full bg-transparent border-0 outline-none
              py-4 pl-12 pr-12 text-[15px]
              text-[#FAF9F7] placeholder:text-[#6B6B70]
              transition-all duration-300
            "
          />
          {value && (
            <button
              onClick={onClear}
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
    );
  }
);
SearchInput.displayName = 'SearchInput';

// ============================================================
// Category Pills (using CategoryScroller primitive)
// ============================================================

interface CategoryPillsProps {
  categories: Record<CategoryKey, string>;
  selected: CategoryKey;
  onSelect: (category: CategoryKey) => void;
  variants: Variants;
}

export function CategoryPills({
  categories,
  selected,
  onSelect,
  variants,
}: CategoryPillsProps) {
  // Convert categories to CategoryItem format
  const items: CategoryItem[] = Object.entries(categories).map(([key, label]) => ({
    value: key,
    label,
  }));

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.15 }}
      className="flex items-center justify-center"
    >
      <CategoryScroller
        items={items}
        value={selected}
        onValueChange={(value) => onSelect(value as CategoryKey)}
        size="default"
        showFades={false}
      />
    </motion.div>
  );
}

// ============================================================
// Loading Skeleton
// ============================================================

export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero card skeleton */}
      <Skeleton className="h-64 rounded-2xl" />
      {/* Grid of space card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <SkeletonSpaceCard key={i} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Search Results
// ============================================================

interface SearchResultsProps {
  query: string;
  results: SpaceSearchResult[];
  isSearching: boolean;
  staggerContainer: Variants;
  snapVariants: Variants;
  onNavigate: (spaceId: string) => void;
  onJoin: (spaceId: string) => Promise<void>;
  onClear: () => void;
}

export function SearchResults({
  query,
  results,
  isSearching,
  staggerContainer,
  snapVariants,
  onNavigate,
  onJoin,
  onClear,
}: SearchResultsProps) {
  return (
    <div>
      {/* Search query pill */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-[var(--border)]">
          <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-[13px] text-[var(--text-secondary)]">"{query}"</span>
          <span className="text-[11px] text-[var(--text-muted)]">
            {isSearching ? '...' : `${results.length} found`}
          </span>
        </div>
      </motion.div>

      {results.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {results.map((space) => (
            <motion.div key={space.id} layoutId={`space-card-${space.id}`} variants={snapVariants}>
              <NeighborhoodCard
                space={space}
                onClick={() => onNavigate(space.id)}
                onJoin={() => onJoin(space.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {results.length === 0 && !isSearching && (
        <motion.div variants={snapVariants} initial="hidden" animate="visible" className="py-20 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.02] border border-[var(--border)] flex items-center justify-center"
          >
            <MagnifyingGlassIcon className="w-6 h-6 text-[var(--text-muted)]" />
          </motion.div>
          <p className="text-[15px] text-[var(--text-secondary)] mb-2">
            No spaces match "{query}"
          </p>
          <p className="text-[13px] text-[var(--text-muted)] mb-6">
            Try a different search or browse categories
          </p>
          <motion.button
            onClick={onClear}
            className="px-4 py-2 rounded-full text-[13px] font-medium bg-white/[0.06] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-white/[0.10] active:opacity-80 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Clear search
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// Discovery Content
// ============================================================

interface DiscoveryContentProps {
  selectedCategory: CategoryKey;
  featuredSpace: SpaceSearchResult | undefined;
  remainingSpaces: Record<string, SpaceSearchResult[]>;
  snapVariants: Variants;
  staggerContainer: Variants;
  snapSpring: Transition;
  onNavigate: (spaceId: string) => void;
  onJoin: (spaceId: string) => Promise<void>;
}

export function DiscoveryContent({
  selectedCategory,
  featuredSpace,
  remainingSpaces,
  snapVariants,
  staggerContainer,
  snapSpring,
  onNavigate,
  onJoin,
}: DiscoveryContentProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`discovery-${selectedCategory}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={snapSpring}
      >
        {/* Featured Space */}
        {featuredSpace && (
          <motion.div variants={snapVariants} initial="hidden" animate="visible" className="mb-12">
            <p className="text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-4">
              {selectedCategory === 'all' ? 'Trending Now' : `Top in ${CATEGORY_LABELS[selectedCategory]}`}
            </p>
            <HeroSpaceCard
              space={featuredSpace}
              onEnter={() => onNavigate(featuredSpace.id)}
              onJoin={() => onJoin(featuredSpace.id)}
            />
          </motion.div>
        )}

        {/* Category Neighborhoods */}
        {Object.entries(remainingSpaces).map(([category, spaces]) => {
          if (spaces.length === 0) return null;
          const displayName = CATEGORY_DISPLAY[category as CategoryKey] || category.replace('_', ' ');

          return (
            <motion.section
              key={category}
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="mb-12"
            >
              <motion.h2 variants={snapVariants} className="text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-4">
                {displayName}
              </motion.h2>

              {/* Mobile: Horizontal scroll */}
              <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-6 px-6">
                <div className="flex gap-3 pb-4">
                  {spaces.slice(0, 8).map((space) => (
                    <NeighborhoodCard
                      key={space.id}
                      space={space}
                      onClick={() => onNavigate(space.id)}
                      onJoin={() => onJoin(space.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop: Grid */}
              <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {spaces.slice(0, 8).map((space) => (
                  <NeighborhoodCard
                    key={space.id}
                    space={space}
                    onClick={() => onNavigate(space.id)}
                    onJoin={() => onJoin(space.id)}
                  />
                ))}
              </div>
            </motion.section>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// Join Celebration
// ============================================================

interface JoinCelebrationProps {
  celebration: { spaceName: string; spaceId: string } | null;
  snapSpring: Transition;
  shouldReduceMotion: boolean;
}

export function JoinCelebration({
  celebration,
  snapSpring,
  shouldReduceMotion,
}: JoinCelebrationProps) {
  if (!celebration) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-void)]/95 backdrop-blur-sm"
      >
        {/* Gold glow */}
        {!shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.08, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 60%)',
              filter: 'blur(60px)',
            }}
          />
        )}

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={snapSpring}
          className="text-center relative"
        >
          {/* Checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...snapSpring, delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-[var(--life-gold)] flex items-center justify-center"
            style={{ boxShadow: '0 0 40px rgba(255, 215, 0, 0.3)' }}
          >
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="w-8 h-8 text-[var(--life-gold)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path d="M5 12l5 5L19 7" />
            </motion.svg>
          </motion.div>

          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...snapSpring, delay: 0.2 }}
            className="text-2xl font-semibold text-[var(--life-gold)] mb-2"
          >
            You're in.
          </motion.h2>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...snapSpring, delay: 0.3 }}
            className="text-[15px] text-[var(--text-secondary)]"
          >
            Welcome to {celebration.spaceName}
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// Recommendations Section (Behavioral Psychology Algorithm)
// ============================================================

interface RecommendationCardProps {
  space: RecommendedSpace;
  onNavigate: (id: string) => void;
  onJoin: (id: string) => Promise<void>;
  variant?: 'compact' | 'default';
}

function RecommendationCard({
  space,
  onNavigate,
  onJoin,
  variant = 'default',
}: RecommendationCardProps) {
  if (variant === 'compact') {
    return (
      <motion.button
        onClick={() => onNavigate(space.id)}
        className="
          group flex items-center gap-3 p-3 rounded-xl
          bg-white/[0.02] border border-white/[0.06]
          hover:bg-white/[0.04] hover:border-white/[0.08]
          transition-all duration-200
          text-left w-full
        "
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Avatar/Icon */}
        <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
          {space.bannerImage ? (
            <img
              src={space.bannerImage}
              alt=""
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-sm font-medium text-white/40">
              {space.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{space.name}</p>
          <p className="text-xs text-white/40">
            {space.memberCount} members
            {space.mutualConnections > 0 && ` · ${space.mutualConnections} mutual`}
          </p>
        </div>

        {/* Join */}
        <JoinButton onJoin={() => onJoin(space.id)} />
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={() => onNavigate(space.id)}
      className="
        group flex flex-col p-4 rounded-xl
        bg-white/[0.02] border border-white/[0.06]
        hover:bg-white/[0.04] hover:border-white/[0.08]
        transition-all duration-200
        text-left min-w-[220px] w-[220px]
      "
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Banner */}
      <div className="w-full h-24 rounded-lg bg-white/[0.04] mb-3 overflow-hidden">
        {space.bannerImage ? (
          <img
            src={space.bannerImage}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-white/20">
              {space.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-sm font-medium text-white mb-1 truncate">{space.name}</p>
      <p className="text-xs text-white/40 mb-3 line-clamp-2">{space.description}</p>

      {/* Stats */}
      <div className="flex items-center gap-2 text-xs text-white/40 mt-auto">
        <span>{space.memberCount} members</span>
        {space.mutualConnections > 0 && (
          <>
            <span>·</span>
            <span className="text-emerald-400">{space.mutualConnections} mutual</span>
          </>
        )}
      </div>
    </motion.button>
  );
}

interface RecommendationsSectionProps {
  title: string;
  subtitle?: string;
  spaces: RecommendedSpace[];
  variants: Variants;
  onNavigate: (id: string) => void;
  onJoin: (id: string) => Promise<void>;
  variant?: 'compact' | 'default';
  icon?: React.ReactNode;
}

export function RecommendationsSection({
  title,
  subtitle,
  spaces,
  variants,
  onNavigate,
  onJoin,
  variant = 'default',
  icon,
}: RecommendationsSectionProps) {
  if (spaces.length === 0) return null;

  return (
    <motion.section
      variants={variants}
      initial="hidden"
      animate="visible"
      className="mb-10"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Cards */}
      {variant === 'compact' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {spaces.slice(0, 4).map((space) => (
            <RecommendationCard
              key={space.id}
              space={space}
              onNavigate={onNavigate}
              onJoin={onJoin}
              variant="compact"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
          <div className="flex gap-3 pb-4">
            {spaces.slice(0, 6).map((space) => (
              <RecommendationCard
                key={space.id}
                space={space}
                onNavigate={onNavigate}
                onJoin={onJoin}
                variant="default"
              />
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}

// ============================================================
// Full Recommendations Block (Combines all recommendation types)
// ============================================================

interface RecommendationsBlockProps {
  panicRelief: RecommendedSpace[];
  friendsSpaces: RecommendedSpace[];
  insiderAccess: RecommendedSpace[];
  loading: boolean;
  variants: Variants;
  onNavigate: (id: string) => void;
  onJoin: (id: string) => Promise<void>;
}

export function RecommendationsBlock({
  panicRelief,
  friendsSpaces,
  insiderAccess,
  loading,
  variants,
  onNavigate,
  onJoin,
}: RecommendationsBlockProps) {
  const hasRecommendations = panicRelief.length > 0 || friendsSpaces.length > 0 || insiderAccess.length > 0;

  if (loading) {
    return (
      <div className="space-y-4 mb-10">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-[220px] rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasRecommendations) return null;

  return (
    <div className="mb-6">
      {/* Section divider */}
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-4 mb-8"
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/30">
          Recommended for you
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </motion.div>

      {/* Panic Relief - Help with student anxieties */}
      {panicRelief.length > 0 && (
        <RecommendationsSection
          title="Help You Succeed"
          subtitle="Resources for academic, career & wellness support"
          spaces={panicRelief}
          variants={variants}
          onNavigate={onNavigate}
          onJoin={onJoin}
          icon={
            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
              <span className="text-xs">💪</span>
            </div>
          }
        />
      )}

      {/* Friends Spaces - Social proof */}
      {friendsSpaces.length > 0 && (
        <RecommendationsSection
          title="Where Your Friends Are"
          subtitle="Spaces your connections have joined"
          spaces={friendsSpaces}
          variants={variants}
          onNavigate={onNavigate}
          onJoin={onJoin}
          variant="compact"
          icon={
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <span className="text-xs">👋</span>
            </div>
          }
        />
      )}

      {/* Insider Access - Exclusive opportunities */}
      {insiderAccess.length > 0 && (
        <RecommendationsSection
          title="Insider Access"
          subtitle="Exclusive opportunities & invite-only communities"
          spaces={insiderAccess}
          variants={variants}
          onNavigate={onNavigate}
          onJoin={onJoin}
          icon={
            <div className="w-6 h-6 rounded-full bg-[var(--life-gold)]/10 flex items-center justify-center">
              <span className="text-xs">⭐</span>
            </div>
          }
        />
      )}
    </div>
  );
}

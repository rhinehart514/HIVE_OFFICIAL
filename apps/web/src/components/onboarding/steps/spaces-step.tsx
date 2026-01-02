'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, ArrowRight, ArrowLeft, Loader2, Check, Plus } from 'lucide-react';
import { logger } from '@/lib/logger';
import type { UserType } from '../shared/types';

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

// Skeleton components for loading state
function CategorySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="col-span-2 p-8 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 bg-white/[0.06] rounded-lg mb-2" />
            <div className="h-4 w-20 bg-white/[0.04] rounded" />
          </div>
          <div className="w-10 h-10 rounded-full bg-white/[0.04]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="h-5 w-16 bg-white/[0.06] rounded mb-2" />
          <div className="h-4 w-20 bg-white/[0.04] rounded" />
        </div>
        <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="h-5 w-20 bg-white/[0.06] rounded mb-2" />
          <div className="h-4 w-16 bg-white/[0.04] rounded" />
        </div>
      </div>
    </div>
  );
}

// Space category types matching the domain model
type SpaceCategory = 'student_org' | 'greek_life' | 'residential' | 'university_org';

interface CategoryConfig {
  id: SpaceCategory;
  label: string;
  shortLabel: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'student_org', label: 'Student Orgs', shortLabel: 'Student' },
  { id: 'greek_life', label: 'Greek', shortLabel: 'Greek' },
  { id: 'residential', label: 'Residential', shortLabel: 'Dorms' },
  { id: 'university_org', label: 'Uni Orgs', shortLabel: 'Uni' },
];

interface Space {
  id: string;
  name: string;
  memberCount: number;
  category: SpaceCategory;
  hasLeader: boolean;
  leaderHandle?: string;
}

interface CategoryCounts {
  student_org: { total: number; unclaimed: number };
  greek_life: { total: number; unclaimed: number };
  residential: { total: number; unclaimed: number };
  university_org: { total: number; unclaimed: number };
}

interface SpacesStepProps {
  userType: UserType;
  isSubmitting: boolean;
  mustSelectSpace: boolean;
  isExplorer?: boolean;
  onComplete: (redirectTo: string, selectedSpaceIds?: string[], selectedSpaceNames?: string[]) => Promise<boolean>;
}

/**
 * Step 5: Find your communities - Edge-to-Edge Aesthetic
 * Glass cards on #050505, gold only on selection (earned) and final CTA
 */
export function SpacesStep({ userType, isSubmitting, mustSelectSpace, isExplorer = false, onComplete }: SpacesStepProps) {
  const shouldReduceMotion = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState<SpaceCategory | null>(null);
  const [isSearchAllMode, setIsSearchAllMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({
    student_org: { total: 0, unclaimed: 0 },
    greek_life: { total: 0, unclaimed: 0 },
    residential: { total: 0, unclaimed: 0 },
    university_org: { total: 0, unclaimed: 0 },
  });
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<Set<string>>(new Set());

  // Fetch spaces
  useEffect(() => {
    async function fetchSpaces() {
      try {
        const response = await fetch('/api/spaces/browse-v2?limit=50');
        if (response.ok) {
          const data = await response.json();
          const formattedSpaces: Space[] = (data.spaces || []).map((s: Record<string, unknown>) => ({
            id: s.id as string,
            name: (s.name as string) || 'Unnamed Space',
            memberCount: (s.memberCount as number) || 0,
            category: (s.category as SpaceCategory) || 'student_org',
            hasLeader: Boolean(s.leaderId),
            leaderHandle: (s.leaderHandle as string) || undefined,
          }));
          setSpaces(formattedSpaces);

          const counts: CategoryCounts = {
            student_org: { total: 0, unclaimed: 0 },
            greek_life: { total: 0, unclaimed: 0 },
            residential: { total: 0, unclaimed: 0 },
            university_org: { total: 0, unclaimed: 0 },
          };
          formattedSpaces.forEach((space) => {
            const cat = space.category as keyof CategoryCounts;
            if (counts[cat]) {
              counts[cat].total++;
              if (!space.hasLeader) counts[cat].unclaimed++;
            }
          });
          setCategoryCounts(counts);
        }
      } catch (err) {
        logger.error('Failed to fetch spaces', { component: 'SpacesStep' }, err instanceof Error ? err : undefined);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSpaces();
  }, []);

  const filteredSpaces = useMemo(() => {
    if (isSearchAllMode) {
      if (!searchQuery.trim()) return [];
      return spaces.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (!selectedCategory) return [];
    return spaces
      .filter((s) => s.category === selectedCategory)
      .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [spaces, selectedCategory, searchQuery, isSearchAllMode]);

  const unclaimedSpaces = filteredSpaces.filter((s) => !s.hasLeader);
  const claimedSpaces = filteredSpaces.filter((s) => s.hasLeader);

  const handleToggleSpace = (spaceId: string) => {
    setSelectedSpaceIds(prev => {
      const next = new Set(prev);
      if (next.has(spaceId)) {
        next.delete(spaceId);
      } else {
        next.add(spaceId);
      }
      return next;
    });
  };

  const handleClaimSpace = async (spaceId: string) => {
    setError(null);
    const spaceName = spaces.find(s => s.id === spaceId)?.name;
    await onComplete(`/spaces/${spaceId}`, [spaceId], spaceName ? [spaceName] : []);
  };

  const handleJoinSpaces = async () => {
    if (selectedSpaceIds.size === 0) {
      setError('Select at least one space to join');
      return;
    }
    setError(null);
    const spaceIds = Array.from(selectedSpaceIds);
    const spaceNames = spaceIds
      .map(id => spaces.find(s => s.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    await onComplete(`/spaces/${spaceIds[0]}`, spaceIds, spaceNames);
  };

  const handleSkip = async () => {
    if (mustSelectSpace) {
      setError(isExplorer ? 'Select at least one space to join' : 'Pick a space to lead');
      return;
    }
    setError(null);
    await onComplete('/spaces/browse', []);
  };

  const handleBack = () => {
    if (isSearchAllMode) {
      setIsSearchAllMode(false);
      setSearchQuery('');
    } else {
      setSelectedCategory(null);
      setSearchQuery('');
    }
  };

  // Phase 1: Category selection grid
  if (!selectedCategory && !isSearchAllMode) {
    return (
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={shouldReduceMotion ? {} : { duration: 0.4 }}
        className="flex flex-col relative"
        role="main"
        aria-labelledby="spaces-title"
      >
        {isLoading ? (
          <div className="py-8">
            <div className="animate-pulse mb-12">
              <div className="h-8 w-64 bg-white/[0.04] rounded-lg mx-auto mb-4" />
              <div className="h-5 w-48 bg-white/[0.03] rounded mx-auto" />
            </div>
            <CategorySkeleton />
          </div>
        ) : (
          <>
            {/* Header */}
            <motion.h1
              id="spaces-title"
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? {} : { delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
              className="text-[clamp(1.75rem,4vw,2.25rem)] font-semibold tracking-[-0.02em] text-white mb-3 text-center"
            >
              {isExplorer ? 'Where do you belong?' : 'Where do you lead?'}
            </motion.h1>
            <motion.p
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? {} : { delay: 0.15, duration: 0.5, ease: EASE_PREMIUM }}
              className="text-center text-[15px] text-white/40 mb-10"
            >
              {isExplorer
                ? 'Pick the communities that feel like home'
                : "Claim the space that's waiting for you"}
            </motion.p>

            {/* Category grid - glass cards */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? {} : { delay: 0.2, duration: 0.5, ease: EASE_PREMIUM }}
              className="grid grid-cols-2 gap-4 mb-8"
              role="group"
              aria-label="Select a category"
            >
              {/* Student Orgs - HERO card with gold hover */}
              <motion.button
                whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.01 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                onClick={() => setSelectedCategory('student_org')}
                className="col-span-2 p-6 rounded-xl text-left bg-white/[0.03] border border-white/[0.08] transition-all duration-300 hover:bg-white/[0.05] hover:border-[#FFD700]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 group"
                style={{ boxShadow: 'none' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label={`Student Orgs - ${isExplorer ? `${categoryCounts.student_org.total} communities` : categoryCounts.student_org.unclaimed > 0 ? `${categoryCounts.student_org.unclaimed} unclaimed` : 'All claimed'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[17px] font-medium text-white group-hover:text-[#FFD700] transition-colors duration-300">
                      Student Orgs
                    </h2>
                    <p className="text-[14px] mt-1 text-white/40 group-hover:text-[#FFD700]/70 transition-colors duration-300">
                      {isExplorer
                        ? `${categoryCounts.student_org.total} communities`
                        : categoryCounts.student_org.unclaimed > 0
                          ? `${categoryCounts.student_org.unclaimed} unclaimed`
                          : 'All claimed'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/[0.04] group-hover:bg-[#FFD700]/10 flex items-center justify-center transition-colors duration-300">
                    <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-[#FFD700] transition-colors duration-300" />
                  </div>
                </div>
              </motion.button>

              {/* Greek */}
              <motion.button
                whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.01 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                onClick={() => setSelectedCategory('greek_life')}
                className="p-5 rounded-xl text-left bg-white/[0.03] border border-white/[0.08] transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.16] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label={`Greek - ${isExplorer ? `${categoryCounts.greek_life.total} communities` : categoryCounts.greek_life.unclaimed > 0 ? `${categoryCounts.greek_life.unclaimed} unclaimed` : 'All claimed'}`}
              >
                <h3 className="text-[15px] font-medium text-white">Greek</h3>
                <p className="text-[13px] text-white/40 mt-1">
                  {isExplorer
                    ? `${categoryCounts.greek_life.total} communities`
                    : categoryCounts.greek_life.unclaimed > 0
                      ? `${categoryCounts.greek_life.unclaimed} unclaimed`
                      : 'All claimed'}
                </p>
              </motion.button>

              {/* Residential */}
              <motion.button
                whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.01 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                onClick={() => setSelectedCategory('residential')}
                className="p-5 rounded-xl text-left bg-white/[0.03] border border-white/[0.08] transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.16] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label={`Residential - ${isExplorer ? `${categoryCounts.residential.total} communities` : categoryCounts.residential.unclaimed > 0 ? `${categoryCounts.residential.unclaimed} unclaimed` : 'All claimed'}`}
              >
                <h3 className="text-[15px] font-medium text-white">Residential</h3>
                <p className="text-[13px] text-white/40 mt-1">
                  {isExplorer
                    ? `${categoryCounts.residential.total} communities`
                    : categoryCounts.residential.unclaimed > 0
                      ? `${categoryCounts.residential.unclaimed} unclaimed`
                      : 'All claimed'}
                </p>
              </motion.button>

              {/* Uni Orgs - de-emphasized */}
              <motion.button
                whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                onClick={() => setSelectedCategory('university_org')}
                className="col-span-2 p-4 rounded-lg text-left bg-white/[0.01] border border-white/[0.04] transition-all duration-300 hover:bg-white/[0.03] hover:border-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label={`University Orgs - ${isExplorer ? `${categoryCounts.university_org.total} communities` : categoryCounts.university_org.unclaimed > 0 ? `${categoryCounts.university_org.unclaimed} unclaimed` : 'All claimed'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-white/40">Uni Orgs</span>
                  <span className="text-[12px] text-white/25">
                    {isExplorer
                      ? `${categoryCounts.university_org.total} communities`
                      : categoryCounts.university_org.unclaimed > 0
                        ? `${categoryCounts.university_org.unclaimed} unclaimed`
                        : 'All claimed'}
                  </span>
                </div>
              </motion.button>
            </motion.div>

            {/* Search all */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={shouldReduceMotion ? {} : { delay: 0.3, duration: 0.4 }}
              className="text-center"
            >
              <button
                onClick={() => setIsSearchAllMode(true)}
                className="text-[13px] text-white/40 hover:text-white/70 transition-colors duration-200"
              >
                Search all spaces →
              </button>
            </motion.div>

            {/* Skip */}
            {!mustSelectSpace && (
              <motion.div
                initial={shouldReduceMotion ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={shouldReduceMotion ? {} : { delay: 0.35, duration: 0.4 }}
                className="mt-8 text-center"
              >
                <button
                  onClick={handleSkip}
                  className="text-[13px] text-white/30 hover:text-white/50 transition-colors duration-200"
                >
                  Skip
                </button>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    );
  }

  // Phase 2: Spaces in selected category
  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.4 }}
      className="flex flex-col relative"
      role="main"
      aria-labelledby="category-title"
    >
      {/* Back + Category header */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
        className="flex items-center gap-4 mb-6"
      >
        <button
          onClick={handleBack}
          className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="Go back to categories"
        >
          <ArrowLeft className="w-5 h-5 text-white/40" aria-hidden="true" />
        </button>
        <h1 id="category-title" className="text-xl font-medium text-white">
          {isSearchAllMode ? 'Search All Spaces' : CATEGORIES.find((c) => c.id === selectedCategory)?.label}
        </h1>
      </motion.div>

      {/* Search - underline style */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.15, duration: 0.5, ease: EASE_PREMIUM }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder={isSearchAllMode ? "Type your org name..." : "Search..."}
            aria-label="Search spaces"
            autoFocus={isSearchAllMode}
            className="w-full py-4 pl-7 pr-0 bg-transparent text-white text-lg outline-none placeholder:text-white/20 transition-all duration-300"
            style={{
              borderBottom: isSearchFocused
                ? '1px solid rgba(255, 255, 255, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.15)',
            }}
          />
        </div>
        {isSearchAllMode && !searchQuery && (
          <p className="text-[13px] text-white/30 mt-3 text-center">
            Start typing to find your club or org
          </p>
        )}
      </motion.div>

      {/* EXPLORER MODE: Show all spaces with join toggles */}
      {isExplorer ? (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? {} : { delay: 0.2, duration: 0.5, ease: EASE_PREMIUM }}
          className="mb-24"
          role="list"
          aria-label="Available spaces"
        >
          <div className="space-y-2">
            {filteredSpaces.map((space) => {
              const isSelected = selectedSpaceIds.has(space.id);
              return (
                <motion.button
                  key={space.id}
                  whileHover={shouldReduceMotion ? {} : { y: -2 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                  onClick={() => handleToggleSpace(space.id)}
                  disabled={isSubmitting}
                  className={`
                    w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                    ${isSelected
                      ? 'bg-white/[0.05] border border-[#FFD700]/30'
                      : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.16]'
                    }
                  `}
                  style={isSelected ? { boxShadow: '0 0 20px rgba(255, 215, 0, 0.08)' } : undefined}
                >
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium text-[15px] ${isSelected ? 'text-white' : 'text-white/60'}`}>
                      {space.name}
                    </span>
                    <span className="text-[12px] ml-2 text-white/30">
                      {space.memberCount} members
                    </span>
                  </div>
                  <motion.div
                    initial={false}
                    animate={{ scale: isSelected ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.2 }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#FFD700] text-black'
                        : 'bg-white/[0.04] text-white/30'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </motion.div>
                </motion.button>
              );
            })}
          </div>

          {/* Sticky footer for explorers - GOLD CTA (final action) */}
          <AnimatePresence>
            {selectedSpaceIds.size > 0 && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 100 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 100 }}
                transition={shouldReduceMotion ? { duration: 0.15 } : { type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent"
              >
                <div className="max-w-sm mx-auto flex items-center justify-between gap-4">
                  <span className="text-[13px] text-white/40">
                    <motion.span
                      key={selectedSpaceIds.size}
                      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-block font-medium text-[#FFD700]"
                    >
                      {selectedSpaceIds.size}
                    </motion.span>
                    {' '}{selectedSpaceIds.size === 1 ? 'space' : 'spaces'} selected
                  </span>
                  <motion.button
                    onClick={handleJoinSpaces}
                    disabled={isSubmitting}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    className="py-3 px-6 rounded-full font-medium text-[14px] bg-[#FFD700] text-black flex items-center gap-2 transition-all duration-300 hover:bg-[#FFE44D] disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Enter HIVE
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* LEADER MODE: Show claim UI */
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? {} : { delay: 0.2, duration: 0.5, ease: EASE_PREMIUM }}
        >
          {/* Unclaimed spaces - gold on hover only */}
          {unclaimedSpaces.length > 0 && (
            <div className="mb-8">
              <div className="space-y-3">
                {/* Hero space - gold on hover */}
                {unclaimedSpaces[0] && (
                  <motion.button
                    whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.01 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                    onClick={() => handleClaimSpace(unclaimedSpaces[0].id)}
                    disabled={isSubmitting}
                    className="w-full text-left p-6 rounded-xl bg-white/[0.03] border border-white/[0.08] transition-all duration-300 hover:bg-white/[0.05] hover:border-[#FFD700]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 group"
                    style={{ boxShadow: 'none' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-white group-hover:text-[#FFD700] transition-colors duration-300">
                          {unclaimedSpaces[0].name}
                        </h3>
                        <p className="text-[14px] mt-1 text-white/40">
                          {unclaimedSpaces[0].memberCount} waiting
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-[#FFD700] transition-colors duration-300" />
                    </div>
                  </motion.button>
                )}

                {/* Rest of unclaimed */}
                {unclaimedSpaces.slice(1).map((space) => (
                  <motion.button
                    key={space.id}
                    whileHover={shouldReduceMotion ? {} : { y: -2 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                    onClick={() => handleClaimSpace(space.id)}
                    disabled={isSubmitting}
                    className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.16] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 group"
                  >
                    <span className="font-medium text-[15px] text-white/60 group-hover:text-white transition-colors">
                      {space.name}
                    </span>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {claimedSpaces.length > 0 && unclaimedSpaces.length > 0 && (
            <div className="border-t border-white/[0.06] my-8" />
          )}

          {/* Claimed spaces - compact */}
          {claimedSpaces.length > 0 && (
            <div>
              <p className="text-[12px] mb-3 text-white/25">Already claimed</p>
              <div className="flex flex-wrap gap-2">
                {claimedSpaces.slice(0, 12).map((space, idx) => (
                  <span key={space.id} className="text-[13px] text-white/30">
                    {space.name}
                    {space.leaderHandle && <span className="text-white/20"> @{space.leaderHandle}</span>}
                    {idx < Math.min(claimedSpaces.length, 12) - 1 && ' · '}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* No results */}
      {filteredSpaces.length === 0 && !isLoading && (isSearchAllMode ? searchQuery : true) && (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-[14px] text-white/30">
            {searchQuery
              ? `No matches for "${searchQuery}"`
              : isSearchAllMode
                ? null
                : 'No spaces in this category'}
          </p>
        </motion.div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[14px] text-red-400 mt-6 text-center"
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Skip */}
      {!mustSelectSpace && (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={shouldReduceMotion ? {} : { delay: 0.3, duration: 0.4 }}
          className="mt-10 text-center"
        >
          <button
            onClick={handleSkip}
            className="text-[13px] text-white/30 hover:text-white/50 transition-colors duration-200"
          >
            Skip
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

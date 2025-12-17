'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, ArrowRight, ArrowLeft, Loader2, Check, Plus } from 'lucide-react';
import { Button } from '@hive/ui';
import { logger } from '@/lib/logger';

// Skeleton components for loading state
function CategorySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="col-span-2 p-8 rounded-2xl border border-white/[0.04] bg-white/[0.01]">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 bg-white/[0.06] rounded-lg mb-2" />
            <div className="h-4 w-20 bg-white/[0.04] rounded" />
          </div>
          <div className="w-10 h-10 rounded-full bg-white/[0.04]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-6 rounded-xl border border-white/[0.04] bg-white/[0.01]">
          <div className="h-5 w-16 bg-white/[0.06] rounded mb-2" />
          <div className="h-4 w-20 bg-white/[0.04] rounded" />
        </div>
        <div className="p-6 rounded-xl border border-white/[0.04] bg-white/[0.01]">
          <div className="h-5 w-20 bg-white/[0.06] rounded mb-2" />
          <div className="h-4 w-16 bg-white/[0.04] rounded" />
        </div>
      </div>
      <div className="col-span-2 p-4 rounded-lg border border-white/[0.03] bg-white/[0.005] mt-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 bg-white/[0.04] rounded" />
          <div className="h-3 w-20 bg-white/[0.03] rounded" />
        </div>
      </div>
    </div>
  );
}

function SpaceListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-full px-4 py-3 rounded-lg border border-white/[0.04] bg-white/[0.01] flex items-center justify-between"
        >
          <div className="flex-1 min-w-0">
            <div className="h-5 w-32 bg-white/[0.06] rounded mb-1" style={{ width: `${60 + Math.random() * 40}%` }} />
            <div className="h-3 w-20 bg-white/[0.04] rounded" />
          </div>
          <div className="w-6 h-6 rounded-full bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}
import {
  containerVariants,
  itemVariants,
  cardHoverVariants,
  primaryCardVariants,
  arrowVariants,
  GLOW_GOLD_SUBTLE,
} from '../shared/motion';
import type { UserType } from '../shared/types';

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
  isExplorer?: boolean; // True if "Looking around" was selected
  onComplete: (redirectTo: string, selectedSpaceIds?: string[], selectedSpaceNames?: string[]) => Promise<boolean>;
}

/**
 * Step 3: Claim your territory (leaders) or Find your communities (explorers)
 * Two phases:
 * 1. Category grid - pick your lane
 * 2. Spaces in category - claim one (leader) or join multiple (explorer)
 */
export function SpacesStep({ userType, isSubmitting, mustSelectSpace, isExplorer = false, onComplete }: SpacesStepProps) {
  const shouldReduceMotion = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState<SpaceCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({
    student_org: { total: 0, unclaimed: 0 },
    greek_life: { total: 0, unclaimed: 0 },
    residential: { total: 0, unclaimed: 0 },
    university_org: { total: 0, unclaimed: 0 },
  });
  // For explorers: track multiple selected spaces to join
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<Set<string>>(new Set());

  // Fetch spaces and calculate category counts
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

          // Calculate counts per category
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

  // Filter spaces by selected category and search
  const filteredSpaces = useMemo(() => {
    if (!selectedCategory) return [];
    return spaces
      .filter((s) => s.category === selectedCategory)
      .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [spaces, selectedCategory, searchQuery]);

  const unclaimedSpaces = filteredSpaces.filter((s) => !s.hasLeader);
  const claimedSpaces = filteredSpaces.filter((s) => s.hasLeader);

  // Explorer: Toggle space selection
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

  // Leader: Claim space to lead
  const handleClaimSpace = async (spaceId: string) => {
    setError(null);
    const spaceName = spaces.find(s => s.id === spaceId)?.name;
    await onComplete(`/spaces/${spaceId}`, [spaceId], spaceName ? [spaceName] : []);
  };

  // Explorer: Join selected spaces
  const handleJoinSpaces = async () => {
    if (selectedSpaceIds.size === 0) {
      setError('Select at least one space to join');
      return;
    }
    setError(null);
    const spaceIds = Array.from(selectedSpaceIds);
    // Get the names of selected spaces for display on completion
    const spaceNames = spaceIds
      .map(id => spaces.find(s => s.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    // Redirect to first selected space
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
    setSelectedCategory(null);
    setSearchQuery('');
    // Don't clear selections when going back - user might want to browse other categories
  };

  // Reduced motion variants
  const safeContainerVariants = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : containerVariants;

  const safeItemVariants = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : itemVariants;

  const safeCardHoverVariants = shouldReduceMotion
    ? {}
    : cardHoverVariants;

  const safePrimaryCardVariants = shouldReduceMotion
    ? {}
    : primaryCardVariants;

  // Phase 1: Category selection grid
  if (!selectedCategory) {
    return (
      <motion.div
        variants={safeContainerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen flex flex-col justify-center px-6 py-12"
        role="main"
        aria-labelledby="spaces-title"
      >
        <div className="w-full max-w-2xl mx-auto">
          {isLoading ? (
            <div className="py-8">
              {/* Header skeleton */}
              <div className="animate-pulse mb-8 md:mb-12">
                <div className="h-10 w-64 bg-white/[0.04] rounded-lg mx-auto mb-4" />
                <div className="h-5 w-48 bg-white/[0.03] rounded mx-auto" />
              </div>
              {/* Category grid skeleton */}
              <CategorySkeleton />
            </div>
          ) : (
            <>
              {/* Header - warm, identity-focused copy */}
              <motion.h1
                id="spaces-title"
                variants={safeItemVariants}
                className="text-4xl md:text-5xl font-semibold tracking-tight leading-none mb-8 text-center"
              >
                {isExplorer ? 'Where do you belong?' : 'Where do you lead?'}
              </motion.h1>
              <motion.p
                variants={safeItemVariants}
                className="text-center mb-12 text-lg"
                style={{ color: 'var(--hive-text-secondary)' }}
              >
                {isExplorer
                  ? 'Pick the communities that feel like home'
                  : 'Claim the space that\'s waiting for you'}
              </motion.p>

              {/* Category grid with hierarchy */}
              <motion.div variants={safeItemVariants} className="grid grid-cols-2 gap-4" role="group" aria-label="Select a category">
                {/* Student Orgs - HERO, full width */}
                <motion.button
                  variants={safePrimaryCardVariants}
                  initial="rest"
                  whileHover={shouldReduceMotion ? {} : "hover"}
                  whileTap={shouldReduceMotion ? {} : "tap"}
                  onClick={() => setSelectedCategory('student_org')}
                  className="col-span-2 p-8 rounded-2xl border border-gold-500/20 bg-gold-500/[0.02] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  style={{ boxShadow: GLOW_GOLD_SUBTLE }}
                  aria-label={`Student Orgs - ${isExplorer ? `${categoryCounts.student_org.total} communities` : categoryCounts.student_org.unclaimed > 0 ? `${categoryCounts.student_org.unclaimed} unclaimed` : 'All claimed'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Student Orgs</h2>
                      <p className="text-gold-500 text-sm mt-1">
                        {isExplorer
                          ? `${categoryCounts.student_org.total} communities`
                          : categoryCounts.student_org.unclaimed > 0
                            ? `${categoryCounts.student_org.unclaimed} unclaimed`
                            : 'All claimed'}
                      </p>
                    </div>
                    <motion.div
                      variants={shouldReduceMotion ? {} : arrowVariants}
                      className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <ArrowRight className="w-5 h-5 text-gold-500" />
                    </motion.div>
                  </div>
                </motion.button>

                {/* Greek */}
                <motion.button
                  variants={safeCardHoverVariants}
                  initial="rest"
                  whileHover={shouldReduceMotion ? {} : "hover"}
                  whileTap={shouldReduceMotion ? {} : "tap"}
                  onClick={() => setSelectedCategory('greek_life')}
                  className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  aria-label={`Greek - ${isExplorer ? `${categoryCounts.greek_life.total} communities` : categoryCounts.greek_life.unclaimed > 0 ? `${categoryCounts.greek_life.unclaimed} unclaimed` : 'All claimed'}`}
                >
                  <h3 className="font-semibold text-white">Greek</h3>
                  <p className="text-sm text-gold-500/80 mt-1">
                    {isExplorer
                      ? `${categoryCounts.greek_life.total} communities`
                      : categoryCounts.greek_life.unclaimed > 0
                        ? `${categoryCounts.greek_life.unclaimed} unclaimed`
                        : 'All claimed'}
                  </p>
                </motion.button>

                {/* Residential */}
                <motion.button
                  variants={safeCardHoverVariants}
                  initial="rest"
                  whileHover={shouldReduceMotion ? {} : "hover"}
                  whileTap={shouldReduceMotion ? {} : "tap"}
                  onClick={() => setSelectedCategory('residential')}
                  className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  aria-label={`Residential - ${isExplorer ? `${categoryCounts.residential.total} communities` : categoryCounts.residential.unclaimed > 0 ? `${categoryCounts.residential.unclaimed} unclaimed` : 'All claimed'}`}
                >
                  <h3 className="font-semibold text-white">Residential</h3>
                  <p className="text-sm text-gold-500/80 mt-1">
                    {isExplorer
                      ? `${categoryCounts.residential.total} communities`
                      : categoryCounts.residential.unclaimed > 0
                        ? `${categoryCounts.residential.unclaimed} unclaimed`
                        : 'All claimed'}
                  </p>
                </motion.button>

                {/* Uni Orgs - de-emphasized */}
                <motion.button
                  variants={safeCardHoverVariants}
                  initial="rest"
                  whileHover={shouldReduceMotion ? {} : "hover"}
                  whileTap={shouldReduceMotion ? {} : "tap"}
                  onClick={() => setSelectedCategory('university_org')}
                  className="col-span-2 p-4 rounded-lg border border-white/[0.04] bg-white/[0.01] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  aria-label={`University Orgs - ${isExplorer ? `${categoryCounts.university_org.total} communities` : categoryCounts.university_org.unclaimed > 0 ? `${categoryCounts.university_org.unclaimed} unclaimed` : 'All claimed'}`}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--hive-text-secondary)' }}>Uni Orgs</span>
                    <span className="text-xs" style={{ color: 'var(--hive-text-subtle)' }}>
                      {isExplorer
                        ? `${categoryCounts.university_org.total} communities`
                        : categoryCounts.university_org.unclaimed > 0
                          ? `${categoryCounts.university_org.unclaimed} unclaimed`
                          : 'All claimed'}
                    </span>
                  </div>
                </motion.button>
              </motion.div>

              {/* Search instead */}
              <motion.div variants={safeItemVariants} className="mt-8 text-center">
                <button
                  onClick={() => setSelectedCategory('student_org')}
                  className="text-sm hover:opacity-80 transition-colors focus:outline-none focus-visible:text-white focus-visible:underline"
                  style={{ color: 'var(--hive-text-disabled)' }}
                >
                  Search all →
                </button>
              </motion.div>

              {/* Skip */}
              {!mustSelectSpace && (
                <motion.div variants={safeItemVariants} className="mt-12 text-center">
                  <button
                    onClick={handleSkip}
                    className="text-sm hover:opacity-80 transition-colors focus:outline-none focus-visible:text-white focus-visible:underline"
                    style={{ color: 'var(--hive-text-disabled)' }}
                  >
                    Skip
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    );
  }

  // Phase 2: Spaces in selected category
  return (
    <motion.div
      variants={safeContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex flex-col px-6 py-12"
      role="main"
      aria-labelledby="category-title"
    >
      <div className="w-full max-w-2xl mx-auto">
        {/* Back + Category header */}
        <motion.div variants={safeItemVariants} className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            aria-label="Go back to categories"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--hive-text-secondary)' }} aria-hidden="true" />
          </button>
          <h1 id="category-title" className="text-2xl font-semibold text-white">
            {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
          </h1>
        </motion.div>

        {/* Search */}
        <motion.div variants={safeItemVariants} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--hive-text-subtle)' }} aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              aria-label="Search spaces"
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white focus:outline-none focus:border-gold-500/30 focus:ring-2 focus:ring-gold-500/10 transition-all"
            />
          </div>
        </motion.div>

        {/* EXPLORER MODE: Show all spaces with join toggles */}
        {isExplorer ? (
          <motion.div variants={safeItemVariants} className="mb-24" role="list" aria-label="Available spaces">
            <div className="space-y-2">
              {filteredSpaces.map((space) => {
                const isSelected = selectedSpaceIds.has(space.id);
                return (
                  <motion.button
                    key={space.id}
                    variants={cardHoverVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => handleToggleSpace(space.id)}
                    disabled={isSubmitting}
                    className={`w-full text-left px-4 py-3 rounded-lg border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-gold-500/30 bg-gold-500/[0.05]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className={`font-medium ${isSelected ? 'text-white' : ''}`} style={isSelected ? {} : { color: 'var(--hive-text-secondary)' }}>
                        {space.name}
                      </span>
                      <span className="text-xs ml-2" style={{ color: 'var(--hive-text-subtle)' }}>
                        {space.memberCount} members
                      </span>
                    </div>
                    <motion.div
                      initial={false}
                      animate={{ scale: isSelected ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 0.2 }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-gold-500 text-black'
                          : 'bg-white/5'
                      }`}
                      style={isSelected ? {} : { color: 'var(--hive-text-subtle)' }}
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

            {/* Sticky footer for explorers - slides up when spaces selected */}
            <AnimatePresence>
              {selectedSpaceIds.size > 0 && (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 100 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 100 }}
                  transition={shouldReduceMotion ? { duration: 0.15 } : { type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent"
                >
                  <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
                    <span className="text-sm" style={{ color: 'var(--hive-text-secondary)' }}>
                      <motion.span
                        key={selectedSpaceIds.size}
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block text-gold-500 font-medium"
                      >
                        {selectedSpaceIds.size}
                      </motion.span>
                      {' '}{selectedSpaceIds.size === 1 ? 'space' : 'spaces'} selected
                    </span>
                    <Button
                      onClick={handleJoinSpaces}
                      disabled={isSubmitting}
                      showArrow
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Join all
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* LEADER MODE: Show claim UI */
          <>
            {/* Unclaimed spaces */}
            {unclaimedSpaces.length > 0 && (
              <motion.div variants={itemVariants} className="mb-8">
                <div className="space-y-3">
                  {/* Hero space */}
                  {unclaimedSpaces[0] && (
                    <motion.button
                      variants={primaryCardVariants}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => handleClaimSpace(unclaimedSpaces[0].id)}
                      disabled={isSubmitting}
                      className="w-full text-left p-6 rounded-xl border border-gold-500/20 bg-gold-500/[0.02]"
                      style={{ boxShadow: GLOW_GOLD_SUBTLE }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{unclaimedSpaces[0].name}</h3>
                          <p className="text-sm mt-1" style={{ color: 'var(--hive-text-subtle)' }}>
                            {unclaimedSpaces[0].memberCount} waiting
                          </p>
                        </div>
                        <motion.div variants={arrowVariants}>
                          <ArrowRight className="w-5 h-5 text-gold-500" />
                        </motion.div>
                      </div>
                    </motion.button>
                  )}

                  {/* Rest of unclaimed */}
                  {unclaimedSpaces.slice(1).map((space) => (
                    <motion.button
                      key={space.id}
                      variants={cardHoverVariants}
                      initial="rest"
                      whileHover="hover"
                      onClick={() => handleClaimSpace(space.id)}
                      disabled={isSubmitting}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gold-500/10 bg-gold-500/[0.01] flex items-center justify-between"
                    >
                      <span className="font-medium text-white">{space.name}</span>
                      <ArrowRight className="w-4 h-4 text-gold-500/60" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Divider */}
            {claimedSpaces.length > 0 && unclaimedSpaces.length > 0 && (
              <div className="border-t border-white/[0.06] my-6" />
            )}

            {/* Claimed spaces - compact */}
            {claimedSpaces.length > 0 && (
              <motion.div variants={itemVariants}>
                <p className="text-xs mb-3" style={{ color: 'var(--hive-text-disabled)' }}>Already claimed</p>
                <div className="flex flex-wrap gap-2">
                  {claimedSpaces.slice(0, 12).map((space) => (
                    <span key={space.id} className="text-sm" style={{ color: 'var(--hive-text-subtle)' }}>
                      {space.name}
                      {space.leaderHandle && <span style={{ color: 'var(--hive-text-disabled)' }}> @{space.leaderHandle}</span>}
                      {claimedSpaces.indexOf(space) < claimedSpaces.length - 1 && ' · '}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* No results */}
        {filteredSpaces.length === 0 && !isLoading && (
          <motion.div variants={itemVariants} className="text-center py-12">
            <p style={{ color: 'var(--hive-text-subtle)' }}>
              {searchQuery ? `No matches for "${searchQuery}"` : 'No spaces in this category'}
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
              className="text-sm font-medium text-red-400 mt-6"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Skip */}
        {!mustSelectSpace && (
          <motion.div variants={itemVariants} className="mt-12 text-center">
            <button
              onClick={handleSkip}
              className="text-sm hover:opacity-80 transition-colors"
              style={{ color: 'var(--hive-text-disabled)' }}
            >
              Skip
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

"use client";

/**
 * SpacesDiscoveryPage - Premium Redesign
 *
 * Enhanced discovery experience with:
 * - useSpaceDiscovery hook for unified data management
 * - T1 Premium hero section with Ken Burns effect
 * - T2 motion tier for discovery cards
 * - Join celebration animations
 * - Category filtering with optimistic updates
 *
 * @author HIVE Frontend Team
 * @version 2.0.0
 */

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Search,
  Plus,
  Zap,
  TrendingUp,
  Sparkles,
  Users,
  Check,
  Loader2,
} from "lucide-react";

// HIVE UI Components
import {
  Button,
  Input,
  Card,
  SpacesHeroSection,
  SpacesDiscoveryGrid,
  CategoryFilterBar,
  DiscoverySectionHeader,
  toast,
} from "@hive/ui";
import type {
  SpaceDiscoveryCardData,
  SpaceHeroCardData,
  CategoryFilterItem,
} from "@hive/ui";
import { springPresets, easingArrays } from "@hive/tokens";

// App imports
import { useAuth } from "@hive/auth-logic";
import { useSpaceDiscovery, type SpaceCategory } from "@/hooks/use-space-discovery";
import { SpacesErrorBoundary } from "@/components/error-boundaries";

// =============================================================================
// CATEGORY CONFIGURATION
// =============================================================================

const CATEGORIES: CategoryFilterItem[] = [
  { id: "all", label: "All" },
  { id: "club", label: "Clubs", icon: <Users className="w-3.5 h-3.5" /> },
  { id: "student_org", label: "Student Orgs", icon: <Users className="w-3.5 h-3.5" /> },
  { id: "academic", label: "Academic" },
  { id: "residential", label: "Residential" },
  { id: "university_org", label: "University" },
  { id: "greek_life", label: "Greek Life" },
  { id: "sports", label: "Sports" },
  { id: "arts", label: "Arts" },
];

// =============================================================================
// MOTION VARIANTS
// =============================================================================

const pageTransitionVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easingArrays.silk,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const headerVariants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easingArrays.silk,
      staggerChildren: 0.05,
    },
  },
};

const headerItemVariants = {
  initial: { opacity: 0, y: -10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springPresets.snappy,
  },
};

const joinCelebrationVariants = {
  initial: { scale: 0.5, opacity: 0 },
  animate: {
    scale: [0.5, 1.2, 1],
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: easingArrays.dramatic,
      times: [0, 0.6, 1],
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// =============================================================================
// DATA TRANSFORMERS
// =============================================================================

function toDiscoveryCard(space: {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  bannerUrl?: string;
  iconUrl?: string;
  category: string;
  isVerified?: boolean;
  activityLevel?: string;
  creator?: { id: string; name: string; avatar?: string };
}): SpaceDiscoveryCardData {
  const activityMap: Record<string, "high" | "live" | "quiet"> = {
    high: "high",
    medium: "live",
    low: "quiet",
  };

  return {
    id: space.id,
    name: space.name,
    description: space.description,
    bannerImage: space.bannerUrl,
    memberCount: space.memberCount ?? 0,
    category: space.category ?? "general",
    isVerified: space.isVerified,
    activityLevel: activityMap[space.activityLevel || "low"] ?? "quiet",
  };
}

function toHeroCard(space: {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  bannerUrl?: string;
  iconUrl?: string;
  category: string;
  isVerified?: boolean;
  activityLevel?: string;
}): SpaceHeroCardData {
  return toDiscoveryCard(space);
}

// =============================================================================
// JOIN CELEBRATION TOAST
// =============================================================================

interface JoinCelebrationProps {
  spaceName: string;
  visible: boolean;
}

function JoinCelebration({ spaceName, visible }: JoinCelebrationProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={joinCelebrationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-3 px-8 py-6 bg-black/90 backdrop-blur-xl rounded-2xl border border-[#FFD700]/30 shadow-2xl shadow-[#FFD700]/20">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(255,215,0,0)",
                  "0 0 40px 20px rgba(255,215,0,0.3)",
                  "0 0 0 0 rgba(255,215,0,0)",
                ],
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-12 h-12 rounded-full bg-[#FFD700] flex items-center justify-center"
            >
              <Check className="w-6 h-6 text-black" />
            </motion.div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">Welcome!</p>
              <p className="text-sm text-neutral-400">
                You joined {spaceName}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function SpacesDiscoveryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // Local state for celebration
  const [celebratingSpace, setCelebratingSpace] = useState<string | null>(null);
  const [celebratingSpaceName, setCelebratingSpaceName] = useState("");

  // Use the discovery hook
  const {
    spaces,
    sections,
    filters,
    setCategory,
    setQuery,
    hasActiveFilters,
    isLoading,
    error,
    joinSpace,
    isJoining,
    joiningIds,
    refresh,
  } = useSpaceDiscovery({
    enableSections: true,
    limit: 20,
  });

  // Handle join with celebration
  const handleJoinSpace = useCallback(
    async (spaceId: string) => {
      // Find space name for celebration
      const allSpaces = [
        ...(sections?.featured ?? []),
        ...(sections?.recommended ?? []),
        ...(sections?.popular ?? []),
        ...(sections?.new ?? []),
        ...spaces,
      ];
      const space = allSpaces.find((s) => s.id === spaceId);

      const success = await joinSpace(spaceId);

      if (success && space) {
        // Show celebration
        setCelebratingSpaceName(space.name);
        setCelebratingSpace(spaceId);

        // Hide celebration after delay and navigate
        setTimeout(() => {
          setCelebratingSpace(null);
          router.push(`/spaces/${spaceId}`);
        }, 1500);
      } else if (!success) {
        toast.error("Failed to join", "Please try again.");
      }
    },
    [sections, spaces, joinSpace, router]
  );

  const handleSpaceClick = useCallback(
    (spaceId: string) => {
      router.push(`/spaces/${spaceId}`);
    },
    [router]
  );

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setCategory(categoryId as SpaceCategory);
    },
    [setCategory]
  );

  const handleSearch = useCallback(() => {
    // Search is debounced in the hook
  }, []);

  // Transform sections data
  const heroSpaces = useMemo(
    () => (sections?.featured ?? []).slice(0, 3).map(toHeroCard),
    [sections?.featured]
  );

  const recommendedCards = useMemo(
    () => (sections?.recommended ?? []).map(toDiscoveryCard),
    [sections?.recommended]
  );

  const popularCards = useMemo(
    () => (sections?.popular ?? []).map(toDiscoveryCard),
    [sections?.popular]
  );

  const newCards = useMemo(
    () => (sections?.new ?? []).map(toDiscoveryCard),
    [sections?.new]
  );

  // For search results, use filtered spaces
  const searchResultCards = useMemo(
    () => spaces.map(toDiscoveryCard),
    [spaces]
  );

  const hasNoSpaces =
    !isLoading &&
    heroSpaces.length === 0 &&
    recommendedCards.length === 0 &&
    popularCards.length === 0 &&
    newCards.length === 0 &&
    searchResultCards.length === 0;

  const showSearchResults = hasActiveFilters && searchResultCards.length > 0;

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <SpacesErrorBoundary context="directory">
      <div className="min-h-screen bg-black">
        {/* Join Celebration Overlay */}
        <JoinCelebration
          spaceName={celebratingSpaceName}
          visible={!!celebratingSpace}
        />

        {/* Sticky Header */}
        <motion.header
          variants={shouldReduceMotion ? undefined : headerVariants}
          initial="initial"
          animate="animate"
          className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-neutral-800/50"
        >
          <div className="max-w-5xl mx-auto px-6 pt-6 pb-4">
            {/* Title Row */}
            <div className="flex items-start justify-between mb-6">
              <motion.div variants={headerItemVariants}>
                <h1 className="text-2xl font-bold text-white mb-1">Spaces</h1>
                <p className="text-sm text-neutral-400">
                  Find your communities
                </p>
              </motion.div>

              <motion.div variants={headerItemVariants}>
                <Button
                  className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold"
                  size="sm"
                  onClick={() => router.push("/spaces/create")}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create
                </Button>
              </motion.div>
            </div>

            {/* Search Input */}
            <motion.div
              className="relative mb-4"
              variants={headerItemVariants}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
              <Input
                placeholder="Search spaces..."
                value={filters.query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 bg-neutral-900/50 border-neutral-800 focus:border-[#FFD700]/50 focus:ring-[#FFD700]/20"
              />
            </motion.div>

            {/* Category Filter Bar */}
            <motion.div variants={headerItemVariants}>
              <CategoryFilterBar
                categories={CATEGORIES}
                selectedCategory={filters.category}
                onSelect={handleCategoryChange}
              />
            </motion.div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-6 py-8 space-y-12">
          <AnimatePresence mode="wait">
            {isLoading ? (
              // Loading State
              <motion.div
                key="loading"
                variants={pageTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-8"
              >
                {/* Hero skeleton */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 row-span-2 h-80 rounded-2xl bg-neutral-900/50 animate-pulse" />
                  <div className="h-[152px] rounded-2xl bg-neutral-900/50 animate-pulse" />
                  <div className="h-[152px] rounded-2xl bg-neutral-900/50 animate-pulse" />
                </div>

                {/* Grid skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-24 rounded-xl bg-neutral-900/50 animate-pulse"
                    />
                  ))}
                </div>
              </motion.div>
            ) : hasNoSpaces ? (
              // Empty State
              <motion.div
                key="empty"
                variants={pageTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Card className="p-12 text-center bg-neutral-900/50 border-neutral-800">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-neutral-800 flex items-center justify-center">
                    <Users className="h-8 w-8 text-neutral-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Spaces Found
                  </h3>
                  <p className="text-neutral-400 mb-6 max-w-sm mx-auto">
                    {filters.query
                      ? "Try a different search term or browse categories"
                      : "Be the first to create a space for your community!"}
                  </p>
                  <Button
                    className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
                    onClick={() => router.push("/spaces/create")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Space
                  </Button>
                </Card>
              </motion.div>
            ) : showSearchResults ? (
              // Search Results
              <motion.div
                key="search-results"
                variants={pageTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <DiscoverySectionHeader
                  title={`Search Results`}
                  subtitle={`${searchResultCards.length} spaces found`}
                  icon={<Search className="w-5 h-5" />}
                />
                <SpacesDiscoveryGrid
                  spaces={searchResultCards}
                  onJoin={handleJoinSpace}
                  onSpaceClick={handleSpaceClick}
                  joiningIds={joiningIds}
                  columns={3}
                />
              </motion.div>
            ) : (
              // Discovery Sections
              <motion.div
                key="content"
                variants={pageTransitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-12"
              >
                {/* Featured Hero Section (Bento Grid) */}
                {heroSpaces.length > 0 && (
                  <section>
                    <DiscoverySectionHeader
                      title="Featured"
                      subtitle="Trending on campus"
                      icon={<Sparkles className="w-5 h-5" />}
                      onViewAll={() =>
                        router.push("/spaces/browse?filter=featured")
                      }
                    />
                    <SpacesHeroSection
                      spaces={heroSpaces}
                      onJoin={handleJoinSpace}
                      onSpaceClick={handleSpaceClick}
                    />
                  </section>
                )}

                {/* Recommended Section */}
                {recommendedCards.length > 0 && (
                  <section>
                    <DiscoverySectionHeader
                      title="Recommended for You"
                      icon={<Zap className="w-5 h-5" />}
                      onViewAll={() =>
                        router.push("/spaces/browse?filter=recommended")
                      }
                    />
                    <SpacesDiscoveryGrid
                      spaces={recommendedCards}
                      onJoin={handleJoinSpace}
                      onSpaceClick={handleSpaceClick}
                      joiningIds={joiningIds}
                      columns={3}
                    />
                  </section>
                )}

                {/* Popular Section */}
                {popularCards.length > 0 && (
                  <section>
                    <DiscoverySectionHeader
                      title="Popular on Campus"
                      subtitle="Where your friends are"
                      icon={<TrendingUp className="w-5 h-5" />}
                      onViewAll={() =>
                        router.push("/spaces/browse?filter=popular")
                      }
                    />
                    <SpacesDiscoveryGrid
                      spaces={popularCards}
                      onJoin={handleJoinSpace}
                      onSpaceClick={handleSpaceClick}
                      joiningIds={joiningIds}
                      columns={3}
                    />
                  </section>
                )}

                {/* New Spaces Section */}
                {newCards.length > 0 && (
                  <section>
                    <DiscoverySectionHeader
                      title="Just Launched"
                      subtitle="Be an early member"
                      icon={<Sparkles className="w-5 h-5" />}
                      onViewAll={() =>
                        router.push("/spaces/browse?filter=new")
                      }
                    />
                    <SpacesDiscoveryGrid
                      spaces={newCards}
                      onJoin={handleJoinSpace}
                      onSpaceClick={handleSpaceClick}
                      joiningIds={joiningIds}
                      columns={3}
                    />
                  </section>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
            >
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 backdrop-blur-sm">
                {error}
                <button onClick={refresh} className="ml-3 underline">
                  Retry
                </button>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </SpacesErrorBoundary>
  );
}

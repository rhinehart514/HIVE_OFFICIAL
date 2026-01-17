'use client';

/**
 * /spaces/browse — Space Directory (v4.1)
 *
 * Archetype: Discovery
 * Pattern: Dual-mode directory
 * Shell: ON
 *
 * Modes:
 * - Discover: New user (0 spaces) - featured space, categories, cold start signals
 * - Dashboard: Returning user (1+ spaces) - Your Spaces, Friends, Explore
 *
 * @version 4.1.0 - Dual-mode with v4.1 components (Jan 2026)
 */

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Text } from '@hive/ui/design-system/primitives';

// Local v4.1 components
import {
  TerritoryAtmosphere,
  SearchInput,
  CategoryPills,
  LoadingSkeleton,
  SearchResults,
  DiscoveryContent,
  JoinCelebration,
  DiscoverHero,
  RecommendationsBlock,
  DashboardContent,
} from './components';

// Local hooks
import { useBrowsePageState, useRecommendations } from './hooks';
import { type CategoryKey, CATEGORY_LABELS } from './territory-config';

// ============================================================
// Category Items for CategoryPills (Record format)
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
// Main Component
// ============================================================

export default function SpacesBrowsePage() {
  const state = useBrowsePageState();

  const {
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
    isSearching,
    isFocused,
    setIsFocused,
    // Celebration
    joinCelebration,
    // Computed
    isSearchMode,
    featuredSpace,
    remainingSpaces,
    searchResults,
    // Dual-mode
    browseMode,
    modeLoading,
    mySpaces,
    friendsSpaces,
    // Handlers
    handleSearch,
    clearSearch,
    handleJoinSpace,
    navigateToSpace,
  } = state;

  // Personalized recommendations (behavioral psychology algorithm)
  const recommendations = useRecommendations();

  // Scroll to search when focused
  const handleScrollToSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      searchInputRef.current.focus();
    }
  };

  // Loading state (initial or mode determination)
  if (loading || modeLoading) {
    return (
      <div className="min-h-screen w-full">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative">
      {/* Territory atmosphere background */}
      <TerritoryAtmosphere
        isVisible={!isSearchMode && !shouldReduceMotion}
        category={selectedCategory}
        gradientAccent={territoryConfig.gradientAccent}
      />

      <main className="max-w-6xl mx-auto px-6 py-8 relative z-10" aria-label="Space directory">
        {/* Header - Different for discover vs dashboard mode */}
        {browseMode === 'dashboard' ? (
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-white mb-1 tracking-tight">
              Your Spaces
            </h1>
            <Text size="sm" className="text-white/40">
              {mySpaces.length} space{mySpaces.length !== 1 ? 's' : ''} you're in
            </Text>
          </header>
        ) : (
          <DiscoverHero variants={snapVariants} totalSpaces={400} />
        )}

        {/* Search + Categories (always visible in discover mode, optional in dashboard) */}
        {browseMode === 'discover' && (
          <div className="mb-8 space-y-4" role="search" aria-label="Search and filter spaces">
            {/* Search */}
            <SearchInput
              ref={searchInputRef}
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              onClear={clearSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              variants={snapVariants}
            />

            {/* Category Pills */}
            {!isSearchMode && (
              <CategoryPills
                categories={CATEGORY_DISPLAY}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                variants={snapVariants}
              />
            )}
          </div>
        )}

        {/* Content - depends on mode */}
        <AnimatePresence mode="wait">
          {isSearchMode ? (
            /* Search Results */
            <SearchResults
              key="search-results"
              query={searchQuery}
              results={searchResults}
              isSearching={isSearching}
              snapVariants={snapVariants}
              staggerContainer={staggerContainer}
              onNavigate={navigateToSpace}
              onJoin={handleJoinSpace}
              onClear={clearSearch}
            />
          ) : browseMode === 'discover' ? (
            /* Discovery Mode - New user without spaces */
            <div key="discovery">
              {/* Personalized Recommendations */}
              {recommendations.hasRecommendations && (
                <RecommendationsBlock
                  panicRelief={recommendations.panicRelief}
                  friendsSpaces={recommendations.friendsSpaces}
                  insiderAccess={recommendations.insiderAccess}
                  loading={recommendations.loading}
                  variants={snapVariants}
                  onNavigate={navigateToSpace}
                  onJoin={handleJoinSpace}
                />
              )}

              {/* Category-based Discovery */}
              <DiscoveryContent
                selectedCategory={selectedCategory}
                featuredSpace={featuredSpace}
                remainingSpaces={remainingSpaces}
                snapVariants={snapVariants}
                staggerContainer={staggerContainer}
                snapSpring={snapSpring}
                onNavigate={navigateToSpace}
                onJoin={handleJoinSpace}
              />
            </div>
          ) : (
            /* Dashboard Mode - Returning user with spaces */
            <DashboardContent
              key="dashboard"
              mySpaces={mySpaces}
              friendsSpaces={friendsSpaces}
              mySpacesLoading={false}
              friendsLoading={false}
              staggerContainer={staggerContainer}
              snapVariants={snapVariants}
              snapSpring={snapSpring}
              onNavigate={navigateToSpace}
              onJoin={handleJoinSpace}
              onFindMore={handleScrollToSearch}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Join Celebration Modal */}
      <JoinCelebration
        celebration={joinCelebration}
        snapSpring={snapSpring}
        shouldReduceMotion={shouldReduceMotion}
      />
    </div>
  );
}

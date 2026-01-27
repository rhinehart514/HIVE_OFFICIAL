'use client';

/**
 * /spaces/browse — Territory Discovery
 *
 * Apple-like cognitive UX with About-page emotional resonance.
 * Each category is a full route: /spaces/browse?category={major|interests|home|greek}
 *
 * Design principles:
 * - Animation as pacing — reveals control reading rhythm
 * - Manifesto fragments — copy like "Your campus already has a shape"
 * - Personalization without gamification — show their major first, no progress bars
 * - Full page routes — shareable, bookmarkable, proper navigation
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Button,
  motion,
  MOTION,
  RevealSection,
  NarrativeReveal,
} from '@hive/ui/design-system/primitives';
import { useDebounce } from '@hive/hooks';
import { MajorBrowse } from './components/MajorBrowse';
import { InterestsBrowse } from './components/InterestsBrowse';
import { HomeBrowse } from './components/HomeBrowse';
import { GreekBrowse } from './components/GreekBrowse';

// ============================================================
// Category Configuration
// ============================================================

const BROWSE_CATEGORIES = {
  major: {
    id: 'major',
    label: 'Major',
    hero: 'Your academic home',
    fragment: 'Every major is a community waiting to form. Yours might already be here.',
    gradient: 'from-blue-500/10',
  },
  interests: {
    id: 'interests',
    label: 'Interests',
    hero: 'Where passions become communities',
    fragment: 'Clubs, resources, and everything in between. Find what moves you.',
    gradient: 'from-amber-500/10',
  },
  home: {
    id: 'home',
    label: 'Home',
    hero: 'Your floor, your building, your neighbors',
    fragment: 'The people you live with become the people you build with.',
    gradient: 'from-emerald-500/10',
  },
  greek: {
    id: 'greek',
    label: 'Greek',
    hero: 'Letters that last',
    fragment: 'Brotherhood and sisterhood, organized for the first time.',
    gradient: 'from-rose-500/10',
  },
} as const;

type BrowseCategory = keyof typeof BROWSE_CATEGORIES;

const CATEGORY_NAV = [
  { id: 'major', label: 'Major' },
  { id: 'interests', label: 'Interests' },
  { id: 'home', label: 'Home' },
  { id: 'greek', label: 'Greek' },
] as const;

// ============================================================
// Main Component
// ============================================================

export default function SpacesBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get category from URL, default to major
  const categoryParam = searchParams.get('category') as BrowseCategory | null;
  const category = categoryParam && categoryParam in BROWSE_CATEGORIES
    ? categoryParam
    : 'major';

  const categoryConfig = BROWSE_CATEGORIES[category];
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(false);

  // Debounce search query for API calls (300ms) while keeping immediate UI feedback
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Keyboard shortcut: Cmd+K to open search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      // Escape to close search
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  // Handle category change
  const handleCategoryChange = (newCategory: BrowseCategory) => {
    setSearchQuery('');
    router.push(`/spaces/browse?category=${newCategory}`, { scroll: false });
  };

  // Render category-specific browse content
  // Uses debouncedSearchQuery for API calls to prevent excessive requests
  const renderBrowseContent = () => {
    switch (category) {
      case 'major':
        return <MajorBrowse searchQuery={debouncedSearchQuery} />;
      case 'interests':
        return <InterestsBrowse searchQuery={debouncedSearchQuery} />;
      case 'home':
        return <HomeBrowse searchQuery={debouncedSearchQuery} />;
      case 'greek':
        return <GreekBrowse searchQuery={debouncedSearchQuery} />;
      default:
        return <MajorBrowse searchQuery={debouncedSearchQuery} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--bg-ground)]/80 border-b border-white/[0.04]">
        <div className="px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/spaces')}
              className="text-white/40 hover:text-white/70 hover:bg-white/[0.04] -ml-2"
            >
              <ArrowLeft size={18} className="mr-1.5" />
              Back
            </Button>

            {/* Category Pills */}
            <nav
              className="hidden md:flex items-center gap-1 ml-4"
              role="tablist"
              aria-label="Browse categories"
            >
              {CATEGORY_NAV.map((cat) => (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={category === cat.id}
                  onClick={() => handleCategoryChange(cat.id as BrowseCategory)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-body-sm font-medium transition-all duration-200',
                    category === cat.id
                      ? 'bg-white/[0.08] text-white/90'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Search Toggle */}
          <div className="flex items-center gap-2">
            {showSearch ? (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                transition={{ duration: MOTION.duration.instant }}
              >
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search spaces..."
                    autoFocus
                    aria-label="Search spaces"
                    className={cn(
                      'w-48 md:w-64 px-3 py-1.5 rounded-lg bg-white/[0.04] border text-body text-white/90 placeholder:text-white/30 focus:outline-none transition-colors',
                      searchQuery !== debouncedSearchQuery
                        ? 'border-white/[0.15]' // Subtle highlight while searching
                        : 'border-white/[0.06] focus:border-white/[0.12]'
                    )}
                  />
                  {/* Search loading indicator */}
                  {searchQuery !== debouncedSearchQuery && (
                    <motion.div
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/60 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                    </motion.div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  aria-label="Clear search"
                  className="text-white/40 hover:text-white/70"
                >
                  <X size={16} />
                </Button>
              </motion.div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(true)}
                className="text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              >
                <Search size={18} />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Category Pills */}
        <div
          className="md:hidden px-6 pb-3 flex gap-2 overflow-x-auto scrollbar-hide"
          role="tablist"
          aria-label="Browse categories"
        >
          {CATEGORY_NAV.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={category === cat.id}
              onClick={() => handleCategoryChange(cat.id as BrowseCategory)}
              className={cn(
                'px-3 py-1.5 rounded-full text-body-sm font-medium whitespace-nowrap transition-all duration-200',
                category === cat.id
                  ? 'bg-white/[0.08] text-white/90'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* Hero Section */}
      <RevealSection className="relative overflow-hidden">
        {/* Gradient Background */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-b opacity-30',
            categoryConfig.gradient,
            'to-transparent'
          )}
        />

        <div className="relative px-6 md:px-8 py-16 md:py-24">
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
            className="max-w-3xl"
          >
            <h1
              className="text-heading-lg md:text-display font-medium text-white/95 tracking-tight leading-[1.1] mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {categoryConfig.hero}
            </h1>
            <p className="text-body-lg md:text-title-sm text-white/40 leading-relaxed max-w-xl">
              <NarrativeReveal stagger="words" duration="base">
                {categoryConfig.fragment}
              </NarrativeReveal>
            </p>
          </motion.div>
        </div>
      </RevealSection>

      {/* Browse Content */}
      <main className="px-6 md:px-8 pb-16">
        {renderBrowseContent()}
      </main>
    </div>
  );
}

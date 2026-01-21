'use client';

/**
 * /spaces — Build Your Campus Identity
 *
 * Narrative: Your campus identity lives in layers.
 * Categories reveal progressively with compelling motion.
 *
 * 4 Core Territories:
 * - University Organizations (official, institutional)
 * - Student Organizations (clubs, interests, passion)
 * - Greek Life (chapters, councils)
 * - Residential (dorms, buildings, housing)
 *
 * Design: Dramatic reveal, identity-first messaging
 * @version 9.0.0 - Identity-first redesign (Jan 2026)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import { Search, Grid3x3, List, ChevronRight, Building2, Users, GraduationCap, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Button, Input, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';

// ============================================================
// Types
// ============================================================

interface Space {
  id: string;
  name: string;
  handle?: string;
  description?: string;
  avatarUrl?: string;
  category: string;
  memberCount: number;
  isVerified?: boolean;
  isJoined?: boolean;
}

interface Category {
  id: 'university' | 'student' | 'greek' | 'residential';
  name: string;
  description: string;
  icon: string;
  count: number;
  gradient: string;
}

// ============================================================
// Premium Motion Config
// ============================================================

const EASE = [0.22, 1, 0.36, 1] as const;

const DURATION = {
  fast: 0.15,
  quick: 0.25,
  smooth: 0.4,
  gentle: 0.6,
  dramatic: 0.8,
} as const;

// ============================================================
// Data Hooks
// ============================================================

function useMySpaces() {
  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    secureApiFetch('/api/spaces/my', { method: 'GET' })
      .then(res => res.json())
      .then(data => {
        const activeSpaces = data.data?.activeSpaces || data.activeSpaces || [];
        setSpaces(activeSpaces.map((s: any) => ({
          id: s.id,
          name: s.name,
          handle: s.handle,
          description: s.description,
          avatarUrl: s.avatarUrl,
          category: s.category || 'general',
          memberCount: s.memberCount || 0,
          isVerified: s.isVerified,
          isJoined: true,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return { spaces, loading };
}

function useAllSpaces() {
  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    secureApiFetch('/api/spaces', { method: 'GET' })
      .then(res => res.json())
      .then(data => {
        const allSpaces = data.data?.spaces || data.spaces || [];
        setSpaces(allSpaces.map((s: any) => ({
          id: s.id,
          name: s.name,
          handle: s.handle,
          description: s.description,
          avatarUrl: s.avatarUrl,
          category: s.category || 'general',
          memberCount: s.memberCount || 0,
          isVerified: s.isVerified,
          isJoined: s.isJoined || false,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { spaces, loading };
}

// ============================================================
// Main Component
// ============================================================

export default function SpacesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { spaces: mySpaces, loading: loadingMySpaces } = useMySpaces();
  const { spaces: allSpaces, loading: loadingAllSpaces } = useAllSpaces();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  // Categories with real counts
  const categories: Category[] = React.useMemo(() => {
    const counts = allSpaces.reduce((acc, space) => {
      const cat = space.category || 'student';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      {
        id: 'university',
        name: 'University Organizations',
        description: 'Official departments, programs, and institutional spaces',
        icon: '🏛️',
        count: counts.university || counts.academic || 87,
        gradient: 'from-blue-500/20 to-purple-500/20',
      },
      {
        id: 'student',
        name: 'Student Organizations',
        description: 'Clubs, societies, and student-led communities',
        icon: '✨',
        count: counts.student || counts.social || 142,
        gradient: 'from-purple-500/20 to-pink-500/20',
      },
      {
        id: 'greek',
        name: 'Greek Life',
        description: 'Fraternities, sororities, and Greek councils',
        icon: '🏛️',
        count: counts.greek || 34,
        gradient: 'from-amber-500/20 to-orange-500/20',
      },
      {
        id: 'residential',
        name: 'Residential',
        description: 'Dorms, apartments, and housing communities',
        icon: '🏠',
        count: counts.residential || 56,
        gradient: 'from-green-500/20 to-teal-500/20',
      },
    ];
  }, [allSpaces]);

  // Filter spaces by search and category
  const filteredSpaces = React.useMemo(() => {
    return allSpaces.filter(space => {
      const matchesSearch = !searchQuery ||
        space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || space.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allSpaces, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#0A0A09]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero - Identity First */}
        <HeroSection />

        {/* Your Spaces - Progressive Disclosure */}
        {!loadingMySpaces && mySpaces.length > 0 && (
          <YourSpacesSection spaces={mySpaces} router={router} />
        )}

        {/* Category Reveal - 4 Core Territories */}
        <CategoryRevealSection
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* All Spaces Directory */}
        <AllSpacesSection
          spaces={filteredSpaces}
          loading={loadingAllSpaces}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCategory={selectedCategory}
          router={router}
        />

        {/* Request Space CTA */}
        <RequestSpaceSection searchQuery={searchQuery} />
      </div>
    </div>
  );
}

// ============================================================
// Hero Section - Identity First
// ============================================================

function HeroSection() {
  return (
    <motion.div
      className="mb-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.gentle, ease: EASE }}
    >
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.dramatic, delay: 0.1, ease: EASE }}
      >
        <h1
          className="text-[48px] md:text-[64px] font-semibold text-white tracking-tight leading-[1.1]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Build your campus identity
        </h1>

        <motion.p
          className="text-[18px] md:text-[20px] text-white/50 max-w-2xl leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.gentle, delay: 0.3, ease: EASE }}
        >
          Your identity evolves through the spaces you inhabit. Choose your residence. Join your orgs. Rush a chapter.
          Each space you enter becomes part of who you are.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Your Spaces - Quick Access
// ============================================================

function YourSpacesSection({ spaces, router }: { spaces: Space[]; router: any }) {
  return (
    <motion.div
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.smooth, delay: 0.4, ease: EASE }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-semibold text-white">Your Spaces</h2>
        <Text size="sm" tone="muted">{spaces.length}</Text>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {spaces.slice(0, 8).map((space, i) => (
          <motion.button
            key={space.id}
            onClick={() => router.push(`/s/${space.handle}`)}
            className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.quick, delay: 0.5 + i * 0.03, ease: EASE }}
          >
            <Avatar size="lg">
              {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
              <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-[13px] font-medium text-white truncate w-full">
                {space.name}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// Category Reveal - 4 Core Territories
// ============================================================

function CategoryRevealSection({
  categories,
  selectedCategory,
  onSelectCategory
}: {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className="mb-20">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: DURATION.gentle, ease: EASE }}
      >
        <h2 className="text-[28px] font-semibold text-white mb-2">
          Build your identity in layers
        </h2>
        <p className="text-[15px] text-white/40">
          First your dorm. Then your orgs. Maybe Greek life. Your campus identity evolves as you explore.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category, i) => (
          <CategoryCard
            key={category.id}
            category={category}
            index={i}
            isSelected={selectedCategory === category.id}
            isInView={isInView}
            onSelect={() => onSelectCategory(
              selectedCategory === category.id ? null : category.id
            )}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  index,
  isSelected,
  isInView,
  onSelect
}: {
  category: Category;
  index: number;
  isSelected: boolean;
  isInView: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        'relative group text-left p-6 rounded-2xl border overflow-hidden',
        'transition-all duration-300',
        isSelected
          ? 'bg-white/[0.06] border-white/[0.12] ring-2 ring-white/[0.08]'
          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.08]'
      )}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? {
        opacity: 1,
        y: 0,
        scale: 1
      } : {
        opacity: 0,
        y: 40,
        scale: 0.95
      }}
      transition={{
        duration: DURATION.dramatic,
        delay: 0.6 + index * 0.15,
        ease: EASE
      }}
    >
      {/* Gradient Background */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
        category.gradient
      )} />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          className="text-[48px] mb-4"
          initial={{ scale: 0, rotate: -180 }}
          animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
          transition={{
            duration: DURATION.dramatic,
            delay: 0.7 + index * 0.15,
            ease: EASE,
            type: 'spring',
            stiffness: 200,
            damping: 15
          }}
        >
          {category.icon}
        </motion.div>

        {/* Title */}
        <div className="mb-2">
          <h3 className="text-[18px] font-semibold text-white">
            {category.name}
          </h3>
        </div>

        {/* Description */}
        <motion.p
          className="text-[13px] text-white/50 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: DURATION.gentle, delay: 1.0 + index * 0.15, ease: EASE }}
        >
          {category.description}
        </motion.p>

        {/* Arrow */}
        <motion.div
          className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={{ x: -10 }}
          whileHover={{ x: 0 }}
        >
          <ChevronRight className="w-5 h-5 text-white/40" />
        </motion.div>
      </div>
    </motion.button>
  );
}

// ============================================================
// All Spaces Section
// ============================================================

function AllSpacesSection({
  spaces,
  loading,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  selectedCategory,
  router,
}: {
  spaces: Space[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  selectedCategory: string | null;
  router: any;
}) {
  return (
    <motion.div
      className="mb-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.gentle, delay: 1.2, ease: EASE }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-semibold text-white">
          {selectedCategory ? 'Filtered Spaces' : 'All Spaces'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'list'
                ? 'bg-white/[0.08] text-white'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-white/[0.08] text-white'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <Input
          type="text"
          placeholder="Search spaces..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-11 bg-white/[0.02] border-white/[0.06] text-white placeholder:text-white/30"
        />
      </div>

      {/* Spaces List/Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
        </div>
      ) : spaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/40 mb-2">No spaces found</p>
          <Text size="sm" tone="muted">
            {searchQuery ? 'Try a different search term' : 'Check back later'}
          </Text>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-2">
          {spaces.map((space, i) => (
            <motion.button
              key={space.id}
              onClick={() => router.push(`/s/${space.handle}`)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: DURATION.quick, delay: i * 0.02, ease: EASE }}
            >
              <Avatar size="default">
                {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-white truncate">
                  {space.name}
                </p>
                {space.description && (
                  <Text size="xs" tone="muted" className="truncate">
                    {space.description}
                  </Text>
                )}
              </div>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-white/30" />
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {spaces.map((space, i) => (
            <motion.button
              key={space.id}
              onClick={() => router.push(`/s/${space.handle}`)}
              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: DURATION.quick, delay: i * 0.02, ease: EASE }}
            >
              <Avatar size="lg">
                {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
              </Avatar>
              <div className="text-center w-full">
                <p className="text-[13px] font-medium text-white truncate">
                  {space.name}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// Request Space Section
// ============================================================

function RequestSpaceSection({ searchQuery }: { searchQuery: string }) {
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [requested, setRequested] = React.useState(false);

  const handleRequest = async () => {
    if (!searchQuery.trim()) return;

    setIsRequesting(true);

    try {
      await secureApiFetch('/api/spaces/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedName: searchQuery,
          message: `User is looking for: ${searchQuery}`,
        }),
      });

      setRequested(true);
      setTimeout(() => setRequested(false), 3000);
    } catch (error) {
      console.error('Failed to request space:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (!searchQuery) return null;

  return (
    <motion.div
      className="mt-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.smooth, ease: EASE }}
    >
      <div className="max-w-md mx-auto p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <p className="text-[15px] text-white/60 mb-4">
          Can't find "{searchQuery}"?
        </p>

        {requested ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[14px] text-[var(--color-gold)]"
          >
            ✓ Request submitted. We'll notify you when it's available.
          </motion.div>
        ) : (
          <Button
            onClick={handleRequest}
            disabled={isRequesting}
            variant="secondary"
            size="sm"
          >
            {isRequesting ? 'Requesting...' : 'Request this space'}
          </Button>
        )}

        <p className="text-xs text-white/30 mt-3">
          Your campus map evolves. New spaces appear as organizations form and students organize.
        </p>
      </div>
    </motion.div>
  );
}

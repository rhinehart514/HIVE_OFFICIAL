'use client';

/**
 * /spaces — Campus Spaces Directory
 *
 * Clean, confident narrative arc:
 * 1. Hero: "Your campus, organized"
 * 2. Your Spaces: Quick access (if joined any)
 * 3. Categories: Browse by type
 * 4. All Spaces: Full directory
 *
 * Design: ChatGPT-style minimal confidence
 * @version 8.0.0 - Narrative redesign (Jan 2026)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid3x3, List, ChevronRight, Users, Sparkles } from 'lucide-react';
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
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
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
    secureApiFetch('/api/spaces/browse', { method: 'GET' })
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
// Hero Section
// ============================================================

function HeroSection() {
  return (
    <motion.div
      className="mb-12"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.gentle, ease: EASE }}
    >
      <h1
        className="text-[32px] md:text-[40px] font-semibold text-white mb-2 tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Your campus, organized
      </h1>
      <p className="text-[16px] text-white/50 max-w-xl">
        423 spaces mapped. Join communities, discover orgs, connect with your people.
      </p>
    </motion.div>
  );
}

// ============================================================
// Your Spaces Section (Quick Access)
// ============================================================

function YourSpacesSection({ spaces, onNavigate }: { spaces: Space[]; onNavigate: (space: Space) => void }) {
  if (spaces.length === 0) return null;

  return (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.smooth, delay: 0.1, ease: EASE }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-semibold text-white">
          Your Spaces
        </h2>
        <Text size="sm" tone="muted">
          {spaces.length} joined
        </Text>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {spaces.slice(0, 6).map((space, i) => (
          <motion.button
            key={space.id}
            onClick={() => onNavigate(space)}
            className="group relative p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.quick, delay: 0.15 + i * 0.03, ease: EASE }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Avatar size="sm">
                {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-medium text-white truncate">
                    {space.name}
                  </span>
                  {space.isVerified && (
                    <Sparkles className="w-3 h-3 text-[var(--color-gold)] flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
            <Text size="xs" tone="muted" className="line-clamp-1">
              {space.memberCount.toLocaleString()} members
            </Text>

            {/* Hover indicator */}
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </div>

      {spaces.length > 6 && (
        <motion.button
          className="mt-4 text-sm text-white/50 hover:text-white/70 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          View all {spaces.length} spaces →
        </motion.button>
      )}
    </motion.section>
  );
}

// ============================================================
// Categories Section
// ============================================================

function CategoriesSection({ onSelectCategory }: { onSelectCategory: (category: string) => void }) {
  const categories: Category[] = [
    {
      id: 'academic',
      name: 'Academic',
      description: 'Study groups, departments, research',
      icon: '📚',
      count: 87,
    },
    {
      id: 'social',
      name: 'Social',
      description: 'Clubs, hobbies, interests',
      icon: '🎉',
      count: 142,
    },
    {
      id: 'residential',
      name: 'Residential',
      description: 'Dorms, apartments, housing',
      icon: '🏠',
      count: 56,
    },
    {
      id: 'greek',
      name: 'Greek Life',
      description: 'Fraternities, sororities',
      icon: '🏛️',
      count: 34,
    },
    {
      id: 'sports',
      name: 'Sports & Rec',
      description: 'Teams, fitness, athletics',
      icon: '⚽',
      count: 48,
    },
    {
      id: 'career',
      name: 'Career',
      description: 'Professional orgs, networking',
      icon: '💼',
      count: 56,
    },
  ];

  return (
    <motion.section
      className="mb-12"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.smooth, delay: 0.2, ease: EASE }}
    >
      <h2 className="text-[18px] font-semibold text-white mb-4">
        Browse by Category
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((category, i) => (
          <motion.button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.quick, delay: 0.25 + i * 0.04, ease: EASE }}
          >
            <div className="text-[28px] mb-2">{category.icon}</div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[14px] font-medium text-white">
                {category.name}
              </span>
              <Text size="xs" tone="muted">
                {category.count}
              </Text>
            </div>
            <Text size="xs" tone="muted" className="line-clamp-1">
              {category.description}
            </Text>

            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}

// ============================================================
// All Spaces Section (Directory)
// ============================================================

function AllSpacesSection({
  spaces,
  loading,
  onNavigate
}: {
  spaces: Space[];
  loading: boolean;
  onNavigate: (space: Space) => void;
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list');

  const filteredSpaces = React.useMemo(() => {
    if (!searchQuery.trim()) return spaces;
    const query = searchQuery.toLowerCase();
    return spaces.filter(
      s => s.name.toLowerCase().includes(query) ||
           s.description?.toLowerCase().includes(query)
    );
  }, [spaces, searchQuery]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.smooth, delay: 0.3, ease: EASE }}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-semibold text-white">
          All Spaces
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-white/[0.08] text-white'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'list'
                ? 'bg-white/[0.08] text-white'
                : 'text-white/40 hover:text-white/60'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Search spaces..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.16] transition-colors"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 rounded-lg bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      )}

      {/* Spaces List */}
      {!loading && viewMode === 'list' && (
        <div className="space-y-2">
          {filteredSpaces.map((space, i) => (
            <motion.button
              key={space.id}
              onClick={() => onNavigate(space)}
              className="group w-full flex items-center gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: DURATION.quick, delay: i * 0.02, ease: EASE }}
            >
              <Avatar size="default">
                {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[15px] font-medium text-white truncate">
                    {space.name}
                  </span>
                  {space.isVerified && (
                    <Sparkles className="w-3.5 h-3.5 text-[var(--color-gold)] flex-shrink-0" />
                  )}
                  {space.isJoined && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.08] text-white/60">
                      Joined
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Text size="sm" tone="muted" className="line-clamp-1">
                    {space.description || 'No description'}
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-white/40">
                  <Users className="w-3.5 h-3.5" />
                  <Text size="sm">{space.memberCount.toLocaleString()}</Text>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Spaces Grid */}
      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredSpaces.map((space, i) => (
            <motion.button
              key={space.id}
              onClick={() => onNavigate(space)}
              className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: DURATION.quick, delay: i * 0.02, ease: EASE }}
            >
              <Avatar size="lg" className="mb-3">
                {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
              </Avatar>

              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[14px] font-medium text-white truncate">
                  {space.name}
                </span>
                {space.isVerified && (
                  <Sparkles className="w-3 h-3 text-[var(--color-gold)] flex-shrink-0" />
                )}
              </div>

              <Text size="xs" tone="muted" className="line-clamp-2 mb-2">
                {space.description || 'No description'}
              </Text>

              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-white/40" />
                <Text size="xs" tone="muted">
                  {space.memberCount.toLocaleString()}
                </Text>
                {space.isJoined && (
                  <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.08] text-white/60">
                    Joined
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredSpaces.length === 0 && (
        <div className="py-12 text-center">
          <Text tone="muted" className="mb-2">No spaces found</Text>
          <Text size="sm" tone="muted">Try a different search term</Text>
        </div>
      )}
    </motion.section>
  );
}

// ============================================================
// Main Page Component
// ============================================================

export default function SpacesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { spaces: mySpaces, loading: mySpacesLoading } = useMySpaces();
  const { spaces: allSpaces, loading: allSpacesLoading } = useAllSpaces();

  const handleNavigateToSpace = (space: Space) => {
    const destination = space.handle ? `/s/${space.handle}` : `/s/${space.id}`;
    router.push(destination);
  };

  const handleSelectCategory = (categoryId: string) => {
    // Scroll to all spaces and filter by category
    const allSpacesSection = document.querySelector('section:last-of-type');
    allSpacesSection?.scrollIntoView({ behavior: 'smooth' });
    // TODO: Implement category filtering
  };

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <HeroSection />

        {/* Your Spaces (if logged in and has spaces) */}
        {user && !mySpacesLoading && mySpaces.length > 0 && (
          <YourSpacesSection
            spaces={mySpaces}
            onNavigate={handleNavigateToSpace}
          />
        )}

        {/* Categories */}
        <CategoriesSection onSelectCategory={handleSelectCategory} />

        {/* All Spaces */}
        <AllSpacesSection
          spaces={allSpaces}
          loading={allSpacesLoading}
          onNavigate={handleNavigateToSpace}
        />
      </div>
    </div>
  );
}

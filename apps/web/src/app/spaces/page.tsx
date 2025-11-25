'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, _Avatar } from '@hive/ui';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Users, ChevronRight, Zap, UserPlus, Star } from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { SpacesErrorBoundary } from '@/components/error-boundaries';
import { motion, useReducedMotion } from 'framer-motion';

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
// TYPES
// =============================================================================

interface SpaceData {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  bannerImage?: string;
  category: string;
}

type CategoryKey = 'all' | 'student_org' | 'residential' | 'university_org' | 'greek_life';

const CATEGORIES: Record<CategoryKey, string> = {
  all: 'All',
  student_org: 'Student Orgs',
  residential: 'Residential',
  university_org: 'University',
  greek_life: 'Greek Life',
};

// =============================================================================
// SPACE CARD COMPONENT
// =============================================================================

function SpaceListItem({
  space,
  onJoin,
  onClick,
}: {
  space: SpaceData;
  onJoin: () => void;
  onClick: () => void;
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
      {/* Avatar/Icon */}
      <div className="h-12 w-12 rounded-xl bg-[var(--hive-background-tertiary)] flex items-center justify-center flex-shrink-0">
        {space.bannerImage ? (
          <img src={space.bannerImage} alt={space.name} className="h-full w-full rounded-xl object-cover" />
        ) : (
          <span className="text-lg font-bold text-[var(--hive-text-primary)]">
            {space.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--hive-text-primary)] truncate group-hover:text-white transition-colors">
          {space.name}
        </h3>
        <p className="text-sm text-[var(--hive-text-secondary)] truncate">
          {space.memberCount} members
        </p>
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

export default function SpacesDiscoveryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');

  // Discovery sections
  const [recommendedSpaces, setRecommendedSpaces] = useState<SpaceData[]>([]);
  const [popularSpaces, setPopularSpaces] = useState<SpaceData[]>([]);
  const [newSpaces, setNewSpaces] = useState<SpaceData[]>([]);

  // Load recommendations
  useEffect(() => {
    loadSpaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedCategory]);

  const loadSpaces = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch recommended spaces
      const res = await secureApiFetch('/api/spaces/recommended', { method: 'GET' });
      const response = await res.json();

      // Map API response to our format
      const mapSpace = (space: { id: string; name: string; description?: string; memberCount?: number; bannerImage?: string; category?: string }): SpaceData => ({
        id: space.id,
        name: space.name,
        description: space.description || '',
        memberCount: space.memberCount ?? 0,
        bannerImage: space.bannerImage,
        category: space.category,
      });

      setRecommendedSpaces((response?.panicRelief || []).map(mapSpace));
      setPopularSpaces((response?.whereYourFriendsAre || []).map(mapSpace));
      setNewSpaces((response?.insiderAccess || []).map(mapSpace));

    } catch (error) {
      console.error('Failed to load spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadSpaces();
      return;
    }

    try {
      setLoading(true);
      const res = await secureApiFetch('/api/spaces/search', {
        method: 'POST',
        body: JSON.stringify({ q: searchQuery, limit: 20 })
      });
      const response = await res.json();

      const spaces = (response?.spaces || []).map((space: { id: string; name: string; description?: string; memberCount?: number; bannerImage?: string; category?: string }) => ({
        id: space.id,
        name: space.name,
        description: space.description || '',
        memberCount: space.memberCount ?? 0,
        bannerImage: space.bannerImage,
        category: space.category,
      }));

      setRecommendedSpaces(spaces.slice(0, 6));
      setPopularSpaces([]);
      setNewSpaces([]);
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: 'Search failed',
        description: 'Please try again.',
        type: 'error',
        duration: 5000
      });
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

      toast({
        title: 'Joined space',
        description: 'Welcome aboard!',
        type: 'success',
        duration: 3000
      });
      router.push(`/spaces/${spaceId}`);
    } catch (error) {
      console.error('Failed to join space:', error);
      toast({
        title: 'Failed to join',
        description: 'Please try again.',
        type: 'error',
        duration: 5000
      });
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <SpacesErrorBoundary context="directory">
      <div className="min-h-screen bg-[var(--hive-background-primary)]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[var(--hive-background-primary)]/80 backdrop-blur-xl border-b border-[var(--hive-border-default)]">
          <div className="max-w-4xl mx-auto px-4 pt-6 pb-4">
            {/* Title row */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[var(--hive-text-primary)] mb-1">Spaces</h1>
                <p className="text-sm text-[var(--hive-text-secondary)]">
                  Find your communities at UB
                </p>
              </div>

              <Button
                className="bg-white text-black hover:bg-neutral-100 font-semibold focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
                size="sm"
                onClick={() => router.push('/spaces/create')}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--hive-text-tertiary)] w-4 h-4" />
              <Input
                placeholder="Search spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]"
              />
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
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
          {loading ? (
            // Loading skeletons
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)] animate-pulse">
                  <div className="h-12 w-12 rounded-xl bg-[var(--hive-background-tertiary)]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-[var(--hive-background-tertiary)] rounded" />
                    <div className="h-3 w-20 bg-[var(--hive-background-tertiary)] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Recommended for You */}
              {recommendedSpaces.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-[var(--hive-brand-primary)]" />
                      <h2 className="text-lg font-semibold text-[var(--hive-text-primary)]">
                        Recommended for You
                      </h2>
                    </div>
                    <button
                      onClick={() => router.push('/spaces/browse')}
                      className="text-sm text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)] flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none rounded"
                    >
                      View all <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <motion.div
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {recommendedSpaces.map(space => (
                      <SpaceListItem
                        key={space.id}
                        space={space}
                        onJoin={() => handleJoinSpace(space.id)}
                        onClick={() => router.push(`/spaces/${space.id}`)}
                      />
                    ))}
                  </motion.div>
                </section>
              )}

              {/* Popular Spaces */}
              {popularSpaces.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-[var(--hive-text-secondary)]" />
                    <h2 className="text-lg font-semibold text-[var(--hive-text-primary)]">
                      Popular on Campus
                    </h2>
                  </div>
                  <motion.div
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {popularSpaces.map(space => (
                      <SpaceListItem
                        key={space.id}
                        space={space}
                        onJoin={() => handleJoinSpace(space.id)}
                        onClick={() => router.push(`/spaces/${space.id}`)}
                      />
                    ))}
                  </motion.div>
                </section>
              )}

              {/* New Spaces */}
              {newSpaces.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <UserPlus className="h-5 w-5 text-[var(--hive-text-secondary)]" />
                    <h2 className="text-lg font-semibold text-[var(--hive-text-primary)]">
                      New Spaces
                    </h2>
                  </div>
                  <motion.div
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {newSpaces.map(space => (
                      <SpaceListItem
                        key={space.id}
                        space={space}
                        onJoin={() => handleJoinSpace(space.id)}
                        onClick={() => router.push(`/spaces/${space.id}`)}
                      />
                    ))}
                  </motion.div>
                </section>
              )}

              {/* Empty state */}
              {recommendedSpaces.length === 0 && popularSpaces.length === 0 && newSpaces.length === 0 && (
                <Card className="p-12 text-center bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--hive-background-tertiary)] flex items-center justify-center">
                    <Users className="h-6 w-6 text-[var(--hive-text-tertiary)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--hive-text-primary)] mb-2">
                    No Spaces Found
                  </h3>
                  <p className="text-[var(--hive-text-secondary)] mb-6">
                    {searchQuery ? 'Try a different search term' : 'Be the first to create a space!'}
                  </p>
                  <Button
                    className="bg-white text-black hover:bg-neutral-100"
                    onClick={() => router.push('/spaces/create')}
                  >
                    Create Space
                  </Button>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </SpacesErrorBoundary>
  );
}

'use client';

/**
 * Spaces Browse Page - Territory Discovery
 *
 * Landing page energy brought to discovery.
 * Each category is a TERRITORY with distinct atmosphere:
 * - ALL: Dense constellation, fast rhythm
 * - STUDENT ORGS: Message-heavy, chaotic, club basement
 * - UNIVERSITY: Space-focused, slower, institutional calm
 * - GREEK LIFE: Event-driven, chapter clusters
 *
 * Floating fragments create atmosphere BEHIND the content.
 * The void is the canvas. Life proves itself.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@hive/ui';
import { ArrowRight, Search, X } from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '@/lib/logger';

// Territory system
import {
  CategoryKey,
  CATEGORY_LABELS,
  getTerritory,
  TerritoryConfig,
} from './territory-config';

// =============================================================================
// MOTION CONFIG - Category-specific timing
// =============================================================================

function getSnapSpring(config: TerritoryConfig) {
  return {
    type: 'spring' as const,
    stiffness: config.springStiffness,
    damping: config.springDamping,
    mass: 0.8,
  };
}

function getSnapVariants(config: TerritoryConfig) {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: getSnapSpring(config),
    },
  };
}

function getStaggerContainer(config: TerritoryConfig) {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: config.staggerMs / 1000,
        delayChildren: config.baseDelayMs / 1000,
      },
    },
  };
}

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

// Default SNAP spring for sub-components (page component uses territory-specific)
const DEFAULT_SNAP_SPRING = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

const DEFAULT_SNAP_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: DEFAULT_SNAP_SPRING,
  },
};

const CATEGORY_DISPLAY: Record<CategoryKey, string> = {
  all: 'Trending',
  student_org: 'Student Organizations',
  university_org: 'University Groups',
  greek_life: 'Greek Life',
};

interface SpaceSearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  bannerImage?: string;
  tags?: string[];
  lastActivityAt?: string | null;
  trendingScore?: number;
  postCount?: number;
  recentActivity?: {
    type: 'message' | 'event';
    content: string;
    author?: string;
  };
}

// Helper to format activity time
function formatActivityTime(lastActivityAt: string | null | undefined): string | null {
  if (!lastActivityAt) return null;
  try {
    const date = new Date(lastActivityAt);
    const now = Date.now();
    const activityTime = date.getTime();
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 5) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${formatDistanceToNow(date, { addSuffix: false })} ago`;
  } catch {
    return null;
  }
}

// Check if space is "live"
function isSpaceLive(space: SpaceSearchResult): boolean {
  const activityText = formatActivityTime(space.lastActivityAt);
  return activityText === 'Active now';
}

// Get activity level for heartbeat animation
function getActivityLevel(lastActivityAt: string | null | undefined): 'live' | 'recent' | 'quiet' {
  if (!lastActivityAt) return 'quiet';
  const diffMs = Date.now() - new Date(lastActivityAt).getTime();
  const diffMins = diffMs / (1000 * 60);
  if (diffMins < 5) return 'live';
  if (diffMins < 30) return 'recent';
  return 'quiet';
}

// Heartbeat animation variants based on activity level
const HEARTBEAT_VARIANTS = {
  live: {
    opacity: [0.4, 1, 0.4],
    boxShadow: [
      '0 0 0px rgba(255,215,0,0)',
      '0 0 12px rgba(255,215,0,0.4)',
      '0 0 0px rgba(255,215,0,0)',
    ],
  },
  recent: {
    opacity: [0.3, 0.7, 0.3],
  },
  quiet: {
    opacity: 0.2,
  },
};

// =============================================================================
// HERO CARD - Big featured space with parallax and live ring
// =============================================================================

function HeroSpaceCard({
  space,
  onEnter,
  onJoin,
}: {
  space: SpaceSearchResult;
  onEnter: () => void;
  onJoin: () => Promise<void> | void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const monogram = space.name?.charAt(0)?.toUpperCase() || 'S';
  const isLive = isSpaceLive(space);
  const activityLevel = getActivityLevel(space.lastActivityAt);

  // Heartbeat color for the strip
  const heartbeatColor = {
    live: '#FFD700',
    recent: 'rgba(255,255,255,0.6)',
    quiet: 'rgba(255,255,255,0.15)',
  }[activityLevel];

  return (
    <motion.article
      variants={DEFAULT_SNAP_VARIANTS}
      initial="hidden"
      animate="visible"
      whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.01 }}
      onClick={onEnter}
      className="relative cursor-pointer overflow-hidden rounded-2xl bg-[#0A0A0A] border border-white/[0.06] group"
    >
      {/* Activity Heartbeat Strip */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full z-10"
        style={{ backgroundColor: heartbeatColor }}
        animate={
          shouldReduceMotion
            ? {}
            : activityLevel === 'live'
              ? HEARTBEAT_VARIANTS.live
              : activityLevel === 'recent'
                ? HEARTBEAT_VARIANTS.recent
                : HEARTBEAT_VARIANTS.quiet
        }
        transition={
          activityLevel === 'live'
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : activityLevel === 'recent'
              ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              : {}
        }
      />

      {/* Trending glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,215,0,0.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative p-6 md:p-8 pl-7 md:pl-10">
        {/* Header */}
        <div className="flex items-start gap-5 mb-5">
          {/* Avatar with animated live ring */}
          <div className="relative">
            {/* Animated Live Ring */}
            {isLive && !shouldReduceMotion && (
              <motion.div
                className="absolute -inset-1.5 rounded-2xl pointer-events-none"
                animate={{
                  boxShadow: [
                    '0 0 0 2px rgba(255,215,0,0.2)',
                    '0 0 0 4px rgba(255,215,0,0.1)',
                    '0 0 0 2px rgba(255,215,0,0.2)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <div
              className={`
                w-16 h-16 md:w-20 md:h-20 rounded-2xl flex-shrink-0 overflow-hidden
                bg-white/[0.04] border border-white/[0.08]
              `}
            >
              {space.bannerImage ? (
                <motion.div
                  className="w-full h-full"
                  animate={shouldReduceMotion ? {} : { scale: [1, 1.05, 1] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <img src={space.bannerImage} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl md:text-3xl font-bold text-white/50">{monogram}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 rounded-full bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-semibold uppercase tracking-wider">
                Trending
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                {space.category.replace('_', ' ')}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2 group-hover:text-white/90 transition-colors">
              {space.name}
            </h2>

            {space.description && (
              <p className="text-[14px] text-white/45 line-clamp-2">
                {space.description}
              </p>
            )}

            {/* Typing indicator for live spaces */}
            {isLive && !shouldReduceMotion && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/50"
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-[#FFD700]/60">People are chatting</span>
              </div>
            )}
          </div>
        </div>

        {/* Activity info row */}
        {space.postCount && space.postCount > 0 && (
          <div className="mb-5 flex items-center gap-4 text-[12px] text-white/40">
            <span className="flex items-center gap-1.5">
              <span className="opacity-60">💬</span>
              {space.postCount} messages
            </span>
            {space.trendingScore && space.trendingScore > 0.5 && (
              <span className="flex items-center gap-1.5">
                <span className="opacity-60">🔥</span>
                Trending
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-white/35">
              {space.memberCount.toLocaleString()} members
            </span>
            {isLive && (
              <span className="flex items-center gap-2 text-[13px] text-[#FFD700]">
                <motion.span
                  className="w-2 h-2 rounded-full bg-[#FFD700]"
                  animate={shouldReduceMotion ? {} : {
                    boxShadow: [
                      '0 0 4px rgba(255,215,0,0.3)',
                      '0 0 12px rgba(255,215,0,0.6)',
                      '0 0 4px rgba(255,215,0,0.3)',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                Live now
              </span>
            )}
          </div>

          <JoinButton onJoin={onJoin} variant="hero" />
        </div>
      </div>
    </motion.article>
  );
}

// =============================================================================
// JOIN BUTTON - Morph animation from text to spinner to checkmark
// =============================================================================

type JoinButtonState = 'idle' | 'loading' | 'success';

function JoinButton({
  onJoin,
  variant = 'default',
}: {
  onJoin: () => Promise<void> | void;
  variant?: 'default' | 'hero';
}) {
  const shouldReduceMotion = useReducedMotion();
  const [state, setState] = useState<JoinButtonState>('idle');

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state !== 'idle') return;

    setState('loading');
    try {
      await onJoin();
      setState('success');
    } catch {
      setState('idle');
    }
  };

  const isHero = variant === 'hero';

  // Base classes
  const baseClasses = isHero
    ? 'rounded-full text-[13px] font-semibold transition-all flex items-center justify-center gap-2'
    : 'rounded-lg text-[12px] font-medium transition-all flex items-center justify-center';

  // State-specific classes
  const stateClasses = {
    idle: isHero
      ? 'px-5 py-2.5 bg-white text-black hover:bg-white/90 min-w-[100px]'
      : 'w-full py-2 bg-white/[0.06] text-white/70 border border-white/[0.08] hover:bg-white hover:text-black hover:border-white',
    loading: isHero
      ? 'w-10 h-10 bg-white/10 border border-[#FFD700]/40'
      : 'w-full py-2 bg-white/[0.06] border border-[#FFD700]/40',
    success: isHero
      ? 'w-10 h-10 bg-[#FFD700]/20 border border-[#FFD700]/60'
      : 'w-full py-2 bg-[#FFD700]/20 border border-[#FFD700]/40',
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={state !== 'idle'}
      animate={{
        width: shouldReduceMotion ? undefined : state === 'loading' || state === 'success' ? (isHero ? 40 : undefined) : undefined,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`${baseClasses} ${stateClasses[state]} disabled:cursor-default`}
    >
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {isHero ? (
              <>
                Enter
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              'Join'
            )}
          </motion.span>
        )}

        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
          >
            {/* Spinning gold ring */}
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-[#FFD700]/30 border-t-[#FFD700]"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            {/* Checkmark */}
            <motion.svg
              className="w-4 h-4 text-[#FFD700]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 12l5 5L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// =============================================================================
// NEIGHBORHOOD CARD - Enhanced with heartbeat and hover reveal
// =============================================================================

function NeighborhoodCard({
  space,
  onClick,
  onJoin,
}: {
  space: SpaceSearchResult;
  onClick: () => void;
  onJoin: () => Promise<void> | void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const monogram = space.name?.charAt(0)?.toUpperCase() || 'S';
  const isLive = isSpaceLive(space);
  const activityLevel = getActivityLevel(space.lastActivityAt);

  // Get heartbeat color and animation
  const heartbeatColor = {
    live: '#FFD700',
    recent: 'rgba(255,255,255,0.6)',
    quiet: 'rgba(255,255,255,0.15)',
  }[activityLevel];

  return (
    <motion.div
      variants={DEFAULT_SNAP_VARIANTS}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={shouldReduceMotion ? {} : { y: -6, scale: 1.015 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      className="relative cursor-pointer overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10] transition-colors w-[280px] md:w-auto flex-shrink-0 group"
    >
      {/* Activity Heartbeat Strip */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
        style={{ backgroundColor: heartbeatColor }}
        animate={
          shouldReduceMotion
            ? {}
            : activityLevel === 'live'
              ? HEARTBEAT_VARIANTS.live
              : activityLevel === 'recent'
                ? HEARTBEAT_VARIANTS.recent
                : HEARTBEAT_VARIANTS.quiet
        }
        transition={
          activityLevel === 'live'
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : activityLevel === 'recent'
              ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              : {}
        }
      />

      <div className="p-4 pl-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`
              w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden
              bg-white/[0.04] border border-white/[0.06]
              ${isLive ? 'ring-2 ring-[#FFD700]/40 ring-offset-1 ring-offset-[#050505]' : ''}
            `}
          >
            {space.bannerImage ? (
              <img src={space.bannerImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white/50">{monogram}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-white text-[14px] truncate group-hover:text-white/90">
              {space.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[12px] text-white/35">
                {space.memberCount.toLocaleString()} {space.memberCount === 1 ? 'member' : 'members'}
              </span>
              {isLive && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="flex items-center gap-1 text-[12px] text-[#FFD700]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] shadow-[0_0_6px_rgba(255,215,0,0.6)]" />
                    Live
                  </span>
                </>
              )}
            </div>
            {/* Typing indicator for live spaces */}
            {isLive && !shouldReduceMotion && (
              <div className="flex gap-1 mt-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full bg-white/30"
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity row - compact info */}
        {space.postCount && space.postCount > 0 && (
          <div className="flex items-center gap-2 mb-3 text-[11px] text-white/35">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 flex items-center justify-center opacity-60">💬</span>
              {space.postCount} messages
            </span>
          </div>
        )}

        {/* Hover Reveal - Peek Inside */}
        <AnimatePresence>
          {isHovered && !shouldReduceMotion && space.description && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pb-3 mb-3 border-b border-white/[0.04]">
                <p className="text-[12px] text-white/45 leading-relaxed line-clamp-2">
                  {space.description}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Join button with morph animation */}
        <JoinButton onJoin={onJoin} variant="default" />
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function SpacesBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: _user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [allSpaces, setAllSpaces] = useState<SpaceSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<SpaceSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const LIMIT = 30;

  // Get territory config for current category
  const territoryConfig = useMemo(() => getTerritory(selectedCategory), [selectedCategory]);
  const SNAP_VARIANTS = useMemo(() => getSnapVariants(territoryConfig), [territoryConfig]);
  const STAGGER_CONTAINER = useMemo(() => getStaggerContainer(territoryConfig), [territoryConfig]);
  const SNAP_SPRING = useMemo(() => getSnapSpring(territoryConfig), [territoryConfig]);

  // Join celebration
  const [joinCelebration, setJoinCelebration] = useState<{
    spaceName: string;
    spaceId: string;
  } | null>(null);

  // Computed: Is in search mode?
  const isSearchMode = searchQuery.trim().length > 0;

  // Computed: Spaces grouped by category
  const spacesByCategory = useMemo(() => {
    const grouped: Record<string, SpaceSearchResult[]> = {};
    const filtered = selectedCategory === 'all'
      ? allSpaces
      : allSpaces.filter(s => s.category === selectedCategory);

    filtered.forEach((space) => {
      const cat = space.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(space);
    });

    return grouped;
  }, [allSpaces, selectedCategory]);

  // Computed: Featured/trending space (highest trending score or most recent activity)
  const featuredSpace = useMemo(() => {
    const filtered = selectedCategory === 'all'
      ? allSpaces
      : allSpaces.filter(s => s.category === selectedCategory);

    return filtered.sort((a, b) => {
      // Prioritize live spaces
      const aLive = isSpaceLive(a) ? 1 : 0;
      const bLive = isSpaceLive(b) ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;

      // Then by trending score
      return (b.trendingScore || 0) - (a.trendingScore || 0);
    })[0];
  }, [allSpaces, selectedCategory]);

  // Computed: Remaining spaces (exclude featured)
  const remainingSpaces = useMemo(() => {
    if (!featuredSpace) return spacesByCategory;

    const grouped: Record<string, SpaceSearchResult[]> = {};
    Object.entries(spacesByCategory).forEach(([cat, spaces]) => {
      grouped[cat] = spaces.filter(s => s.id !== featuredSpace.id);
    });

    return grouped;
  }, [spacesByCategory, featuredSpace]);

  // Auto-focus search
  useEffect(() => {
    if (searchParams.get('focus') === 'search') {
      searchInputRef.current?.focus();
    }
  }, [searchParams]);

  // Load initial spaces
  useEffect(() => {
    loadAllSpaces();
  }, []);

  const loadAllSpaces = async () => {
    try {
      setLoading(true);

      const res = await secureApiFetch(`/api/spaces?limit=${LIMIT}&offset=0`, {
        method: 'GET',
      });
      const response = await res.json();
      const spaces = response?.data?.spaces || response?.spaces || [];
      setAllSpaces(spaces);
      setHasMore(spaces.length === LIMIT);
    } catch (error) {
      logger.error('Failed to load spaces', { component: 'SpacesBrowsePage' }, error instanceof Error ? error : undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);

      const res = await secureApiFetch('/api/spaces/search', {
        method: 'POST',
        body: JSON.stringify({
          q: searchQuery,
          limit: 20,
          offset: 0,
        }),
      });
      const response = await res.json();
      const spaces = response?.data?.spaces || response?.spaces || [];
      setSearchResults(spaces);
    } catch (error) {
      logger.error('Search failed', { component: 'SpacesBrowsePage' }, error instanceof Error ? error : undefined);
      toast.error('Search failed', 'Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const handleJoinSpace = async (spaceId: string) => {
    try {
      const res = await secureApiFetch('/api/spaces/join', {
        method: 'POST',
        body: JSON.stringify({ spaceId }),
      });
      if (!res.ok) throw new Error(`Join failed: ${res.status}`);

      const space = [...allSpaces, ...searchResults].find((s) => s.id === spaceId);
      const spaceName = space?.name || 'the space';

      setJoinCelebration({ spaceName, spaceId });

      setTimeout(() => {
        setJoinCelebration(null);
        router.push(`/spaces/${spaceId}`);
      }, 1500);
    } catch (error) {
      logger.error('Failed to join space', { component: 'SpacesBrowsePage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to join', 'Please try again.');
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-[#030303] relative overflow-hidden">
      {/* Territory Atmosphere - Ambient gradient */}
      {!isSearchMode && !loading && (
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 pointer-events-none z-0"
        >
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
            style={{
              background: `radial-gradient(ellipse at center bottom, ${territoryConfig.gradientAccent || 'rgba(255,255,255,0.02)'} 0%, transparent 70%)`,
            }}
          />
        </motion.div>
      )}

      {/* Hero Section */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 pt-16 pb-8 px-6"
      >
        <div className="max-w-4xl mx-auto">
          {/* Headline - Changes with territory */}
          <AnimatePresence mode="wait">
            <motion.h1
              key={selectedCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={SNAP_SPRING}
              className="text-[clamp(2rem,5vw,3rem)] font-bold tracking-tight text-white text-center mb-3"
            >
              {selectedCategory === 'all' ? 'Where do you belong?' : territoryConfig.name}
            </motion.h1>
          </AnimatePresence>

          {/* Territory tagline */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`tagline-${selectedCategory}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[14px] text-white/35 text-center mb-10"
            >
              {territoryConfig.tagline}
            </motion.p>
          </AnimatePresence>

          {/* Search */}
          <motion.div
            variants={SNAP_VARIANTS}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="relative max-w-xl mx-auto mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search 400+ communities..."
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-12 text-[15px] text-white outline-none transition-all placeholder:text-white/25 focus:border-white/[0.15] focus:bg-white/[0.05]"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/[0.1] flex items-center justify-center hover:bg-white/[0.15] transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white/50" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Category Pills - Territory selector */}
          <motion.div
            variants={SNAP_VARIANTS}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-2 flex-wrap"
          >
            {(Object.entries(CATEGORY_LABELS) as [CategoryKey, string][]).map(([key, label]) => {
              const isSelected = selectedCategory === key;
              return (
                <motion.button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200
                    ${isSelected
                      ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                      : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70'
                    }
                  `}
                >
                  {label}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content - Above fragments */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        {loading ? (
          /* Loading State */
          <div className="space-y-6">
            <div className="h-64 rounded-2xl bg-white/[0.02] animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-xl bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          </div>
        ) : isSearchMode ? (
          /* Search Results - Card Grid (maintains the vibe) */
          <div>
            {/* Search query pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08]">
                <Search className="w-3.5 h-3.5 text-white/40" />
                <span className="text-[13px] text-white/60">"{searchQuery}"</span>
                <span className="text-[11px] text-white/30">
                  {isSearching ? '...' : `${searchResults.length} found`}
                </span>
              </div>
            </motion.div>

            {searchResults.length > 0 && (
              <motion.div
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {searchResults.map((space) => (
                  <motion.div
                    key={space.id}
                    layoutId={`space-card-${space.id}`}
                    variants={SNAP_VARIANTS}
                  >
                    <NeighborhoodCard
                      space={space}
                      onClick={() => router.push(`/spaces/${space.id}`)}
                      onJoin={() => handleJoinSpace(space.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {searchResults.length === 0 && !isSearching && (
              <motion.div
                variants={SNAP_VARIANTS}
                initial="hidden"
                animate="visible"
                className="py-20 text-center"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center"
                >
                  <Search className="w-6 h-6 text-white/20" />
                </motion.div>
                <p className="text-[15px] text-white/50 mb-2">
                  No spaces match "{searchQuery}"
                </p>
                <p className="text-[13px] text-white/30 mb-6">
                  Try a different search or browse categories
                </p>
                <motion.button
                  onClick={clearSearch}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-full text-[13px] font-medium bg-white/[0.06] text-white/60 border border-white/[0.08] hover:bg-white/[0.10] transition-colors"
                >
                  Clear search
                </motion.button>
              </motion.div>
            )}
          </div>
        ) : (
          /* Discovery Mode - Hero + Neighborhoods */
          <AnimatePresence mode="wait">
            <motion.div
              key={`discovery-${selectedCategory}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={SNAP_SPRING}
            >
              {/* Featured Space */}
              {featuredSpace && (
                <motion.div
                  variants={SNAP_VARIANTS}
                  initial="hidden"
                  animate="visible"
                  className="mb-12"
                >
                  <p className="text-[11px] uppercase tracking-[0.15em] text-white/30 mb-4">
                    {selectedCategory === 'all' ? 'Trending Now' : `Top in ${CATEGORY_LABELS[selectedCategory]}`}
                  </p>
                  <HeroSpaceCard
                  space={featuredSpace}
                  onEnter={() => router.push(`/spaces/${featuredSpace.id}`)}
                  onJoin={() => handleJoinSpace(featuredSpace.id)}
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
                  variants={STAGGER_CONTAINER}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-100px' }}
                  className="mb-12"
                >
                  <motion.h2
                    variants={SNAP_VARIANTS}
                    className="text-[11px] uppercase tracking-[0.15em] text-white/30 mb-4"
                  >
                    {displayName}
                  </motion.h2>

                  {/* Mobile: Horizontal scroll */}
                  <div className="md:hidden overflow-x-auto scrollbar-hide -mx-6 px-6">
                    <div className="flex gap-3 pb-4">
                      {spaces.slice(0, 8).map((space) => (
                        <NeighborhoodCard
                          key={space.id}
                          space={space}
                          onClick={() => router.push(`/spaces/${space.id}`)}
                          onJoin={() => handleJoinSpace(space.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Desktop: Grid */}
                  <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {spaces.slice(0, 8).map((space) => (
                      <NeighborhoodCard
                        key={space.id}
                        space={space}
                        onClick={() => router.push(`/spaces/${space.id}`)}
                        onJoin={() => handleJoinSpace(space.id)}
                      />
                    ))}
                  </div>
                </motion.section>
              );
            })}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Join Celebration */}
      <AnimatePresence>
        {joinCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#030303]/95 backdrop-blur-sm"
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
              transition={SNAP_SPRING}
              className="text-center relative"
            >
              {/* Checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...SNAP_SPRING, delay: 0.1 }}
                className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-[#FFD700] flex items-center justify-center"
                style={{ boxShadow: '0 0 40px rgba(255, 215, 0, 0.3)' }}
              >
                <motion.svg
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="w-8 h-8 text-[#FFD700]"
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
                transition={{ ...SNAP_SPRING, delay: 0.2 }}
                className="text-2xl font-semibold text-[#FFD700] mb-2"
              >
                You're in.
              </motion.h2>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...SNAP_SPRING, delay: 0.3 }}
                className="text-[15px] text-white/50"
              >
                Welcome to {joinCelebration.spaceName}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


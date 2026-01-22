'use client';

/**
 * /spaces — Your Campus Territory
 *
 * Premium spaces discovery with:
 * - Narrative scroll experience (like /about)
 * - Premium motion primitives from design system
 * - No decorative icons — color and typography only
 * - Personalized when logged in
 *
 * @version 12.0.0 - No decorative icons (Jan 2026)
 */

import * as React from 'react';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Text,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  // Motion primitives
  motion,
  useInView,
  MOTION,
  RevealSection,
  ParallaxText,
  NarrativeReveal,
  AnimatedBorder,
  ScrollIndicator,
  ScrollSpacer,
} from '@hive/ui/design-system/primitives';
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

interface UserIdentity {
  major?: string;
  majorSpaceId?: string;
  majorSpaceUnlocked?: boolean;
  homeSpaceId?: string;
  residenceType?: 'on-campus' | 'off-campus' | 'commuter';
  interests: string[];
  communitySpaceIds: string[];
}

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
      .then((res) => res.json())
      .then((data) => {
        const activeSpaces = data.data?.activeSpaces || data.activeSpaces || [];
        setSpaces(
          activeSpaces.map((s: any) => ({
            id: s.id,
            name: s.name,
            handle: s.handle,
            description: s.description,
            avatarUrl: s.avatarUrl,
            category: s.category || 'general',
            memberCount: s.memberCount || 0,
            isVerified: s.isVerified,
            isJoined: true,
          }))
        );
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
      .then((res) => res.json())
      .then((data) => {
        const allSpaces = data.data?.spaces || data.spaces || [];
        setSpaces(
          allSpaces.map((s: any) => ({
            id: s.id,
            name: s.name,
            handle: s.handle,
            description: s.description,
            avatarUrl: s.avatarUrl,
            category: s.category || 'general',
            memberCount: s.memberCount || 0,
            isVerified: s.isVerified,
            isJoined: s.isJoined || false,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { spaces, loading };
}

function useUserIdentity() {
  const [identity, setIdentity] = React.useState<UserIdentity | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    secureApiFetch('/api/profile/identity', { method: 'GET' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.identity) {
          setIdentity({
            major: data.identity.major,
            majorSpaceId: data.identity.majorSpace?.id,
            majorSpaceUnlocked: data.identity.majorSpace?.isUnlocked,
            homeSpaceId: data.identity.homeSpace?.id,
            residenceType: data.identity.residenceType,
            interests: data.identity.interests || [],
            communitySpaceIds: (data.identity.communitySpaces || []).map(
              (s: any) => s.id
            ),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return { identity, loading };
}

// ============================================================
// Main Component
// ============================================================

export default function SpacesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { spaces: mySpaces, loading: loadingMySpaces } = useMySpaces();
  const { spaces: allSpaces, loading: loadingAllSpaces } = useAllSpaces();
  const { identity: userIdentity, loading: loadingIdentity } = useUserIdentity();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredSpaces = React.useMemo(() => {
    return allSpaces.filter((space) => {
      const matchesSearch =
        !searchQuery ||
        space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [allSpaces, searchQuery]);

  const hasIdentity = !loadingIdentity && userIdentity && user;
  const hasSpaces = !loadingMySpaces && mySpaces.length > 0;

  return (
    <div className="min-h-screen bg-[#0A0A09]">
      <Hero hasIdentity={!!hasIdentity} />
      <ScrollSpacer height={30} />
      {hasSpaces && <YourSpaces spaces={mySpaces} router={router} />}
      {hasIdentity && (
        <TerritorySection
          userIdentity={userIdentity}
          onQuadrantClick={() => {
            document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}
      {(!user || !userIdentity) && <DiscoverySection />}
      <BrowseSection
        spaces={filteredSpaces}
        loading={loadingAllSpaces}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        router={router}
      />
    </div>
  );
}

// ============================================================
// Hero Section
// ============================================================

function Hero({ hasIdentity }: { hasIdentity: boolean }) {
  return (
    <section className="min-h-[85vh] flex flex-col justify-center px-6 py-24">
      <div className="max-w-4xl mx-auto">
        {/* Eyebrow — no icon, just a gold accent */}
        <motion.div
          className="inline-flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.slow, ease: MOTION.ease.premium }}
        >
          <div className="w-6 h-px bg-[var(--color-gold)]/60" />
          <span className="text-[12px] text-white/50 uppercase tracking-wider">
            {hasIdentity ? 'Your territory' : 'Campus ecosystem'}
          </span>
        </motion.div>

        {/* Title */}
        <ParallaxText speed="subtle">
          <motion.h1
            className="text-[48px] md:text-[72px] font-semibold text-white tracking-tight leading-[0.95] mb-8"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: MOTION.duration.slower,
              delay: 0.1,
              ease: MOTION.ease.premium,
            }}
          >
            {hasIdentity ? 'Your territory' : 'Your campus has a shape'}
          </motion.h1>
        </ParallaxText>

        {/* Narrative description */}
        <ParallaxText speed="base">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: MOTION.duration.slow,
              delay: 0.4,
              ease: MOTION.ease.premium,
            }}
          >
            <p className="text-[18px] md:text-[20px] text-white/40 leading-relaxed">
              <NarrativeReveal stagger="words">
                {hasIdentity
                  ? 'Spaces tailored to who you are. Your major. Your interests. Your home. Your community.'
                  : 'Every space you join shapes who you become. Find the ones that fit.'}
              </NarrativeReveal>
            </p>
          </motion.div>
        </ParallaxText>

        {/* Scroll indicator */}
        <motion.div
          className="mt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MOTION.duration.slow, delay: 1.2 }}
        >
          <ScrollIndicator text="Scroll to explore" />
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// Your Spaces Section
// ============================================================

function YourSpaces({ spaces, router }: { spaces: Space[]; router: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: MOTION.viewport.far });

  return (
    <RevealSection className="px-6 py-24" margin="far">
      <div className="max-w-7xl mx-auto">
        <AnimatedBorder variant="horizontal" className="mb-12" />

        <div className="flex items-center justify-between mb-10">
          <ParallaxText speed="subtle">
            <h2 className="text-[24px] font-medium text-white/90">Your spaces</h2>
          </ParallaxText>
          <Text size="sm" tone="muted">
            {spaces.length}
          </Text>
        </div>

        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {spaces.slice(0, 12).map((space, i) => (
            <motion.button
              key={space.id}
              onClick={() => router.push(`/s/${space.handle}`)}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: MOTION.duration.base,
                delay: i * MOTION.stagger.tight,
                ease: MOTION.ease.premium,
              }}
            >
              <div className="relative">
                <Avatar size="lg">
                  {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                  <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
                </Avatar>
                {space.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border-2 border-[#0A0A09]">
                    <span className="text-[10px]">✓</span>
                  </div>
                )}
              </div>
              <p className="text-[13px] font-medium text-white/60 group-hover:text-white/90 truncate w-full text-center transition-colors">
                {space.name}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}

// ============================================================
// Territory Section (Identity-based navigation)
// ============================================================

const TERRITORY_QUADRANTS = [
  {
    id: 'major' as const,
    title: 'Your Major',
    description: 'Academic identity and classmates',
    accent: 'bg-blue-500',
    gradient: 'from-blue-500/8 to-purple-500/8',
    borderColor: 'border-blue-500/10',
    hoverBorder: 'hover:border-blue-500/30',
  },
  {
    id: 'interests' as const,
    title: 'Your Interests',
    description: 'Clubs, hobbies, and passions',
    accent: 'bg-amber-500',
    gradient: 'from-amber-500/8 to-orange-500/8',
    borderColor: 'border-amber-500/10',
    hoverBorder: 'hover:border-amber-500/30',
  },
  {
    id: 'home' as const,
    title: 'Your Home',
    description: 'Dorms and residential life',
    accent: 'bg-green-500',
    gradient: 'from-green-500/8 to-emerald-500/8',
    borderColor: 'border-green-500/10',
    hoverBorder: 'hover:border-green-500/30',
  },
  {
    id: 'community' as const,
    title: 'Your Community',
    description: 'Greek life and cultural groups',
    accent: 'bg-pink-500',
    gradient: 'from-pink-500/8 to-rose-500/8',
    borderColor: 'border-pink-500/10',
    hoverBorder: 'hover:border-pink-500/30',
  },
];

function TerritorySection({
  userIdentity,
  onQuadrantClick,
}: {
  userIdentity: UserIdentity;
  onQuadrantClick: (type: 'major' | 'interests' | 'home' | 'community') => void;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: MOTION.viewport.far });

  return (
    <RevealSection className="px-6 py-32" margin="far">
      <div className="max-w-5xl mx-auto">
        <AnimatedBorder variant="horizontal" className="mb-16" />

        <div className="mb-12">
          <ParallaxText speed="subtle">
            <h2
              className="text-[32px] md:text-[40px] font-semibold text-white tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Your territory
            </h2>
          </ParallaxText>
          <ParallaxText speed="base">
            <p className="text-[16px] text-white/40 max-w-md">
              <NarrativeReveal stagger="words">
                Four dimensions define your campus identity. Explore each to find your people.
              </NarrativeReveal>
            </p>
          </ParallaxText>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TERRITORY_QUADRANTS.map((quadrant, index) => {
            const content = getQuadrantContent(quadrant.id, userIdentity);

            return (
              <motion.button
                key={quadrant.id}
                onClick={() => onQuadrantClick(quadrant.id)}
                className={cn(
                  'group relative overflow-hidden text-left',
                  'p-8 rounded-3xl border transition-all duration-300',
                  'bg-gradient-to-br',
                  quadrant.gradient,
                  quadrant.borderColor,
                  quadrant.hoverBorder
                )}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: MOTION.duration.base,
                  delay: index * MOTION.stagger.relaxed,
                  ease: MOTION.ease.premium,
                }}
              >
                <div className="relative z-10">
                  {/* Accent bar instead of icon */}
                  <div className={cn('w-8 h-1 rounded-full mb-6', quadrant.accent, 'opacity-60')} />

                  <h3 className="text-[20px] font-medium text-white mb-2">
                    {quadrant.title}
                  </h3>

                  <div className="mb-4">
                    {content ? (
                      <p className="text-[14px] text-white/60">{content}</p>
                    ) : (
                      <p className="text-[14px] text-white/30">{quadrant.description}</p>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-2 text-[13px] text-white/40 group-hover:text-white/70 transition-colors">
                    <span>Explore</span>
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </RevealSection>
  );
}

function getQuadrantContent(
  quadrantId: 'major' | 'interests' | 'home' | 'community',
  identity: UserIdentity
): string | null {
  switch (quadrantId) {
    case 'major':
      return identity.major || null;
    case 'interests':
      return identity.interests.length > 0 ? identity.interests.slice(0, 3).join(', ') : null;
    case 'home':
      if (!identity.homeSpaceId) return null;
      return identity.residenceType === 'on-campus'
        ? 'On Campus'
        : identity.residenceType === 'off-campus'
          ? 'Off Campus'
          : 'Commuter';
    case 'community':
      return identity.communitySpaceIds.length > 0
        ? `${identity.communitySpaceIds.length} communities`
        : null;
    default:
      return null;
  }
}

// ============================================================
// Discovery Section (For guests/users without identity)
// ============================================================

const DIMENSIONS = [
  {
    title: 'Major',
    description: 'Your academic path shapes your perspective',
    accent: 'bg-blue-400',
  },
  {
    title: 'Interests',
    description: 'What you care about finds others who care too',
    accent: 'bg-amber-400',
  },
  {
    title: 'Home',
    description: 'Where you live becomes who you know',
    accent: 'bg-green-400',
  },
  {
    title: 'Community',
    description: 'The groups that claim you, claim your growth',
    accent: 'bg-pink-400',
  },
];

function DiscoverySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: MOTION.viewport.far });

  return (
    <RevealSection className="px-6 py-32" margin="far">
      <div className="max-w-4xl mx-auto">
        <AnimatedBorder variant="horizontal" className="mb-16" />

        <div className="mb-16">
          <ParallaxText speed="subtle">
            <h2
              className="text-[32px] md:text-[40px] font-semibold text-white tracking-tight mb-6"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Four dimensions
            </h2>
          </ParallaxText>
          <ParallaxText speed="base">
            <p className="text-[18px] text-white/40 max-w-lg leading-relaxed">
              <NarrativeReveal stagger="words">
                Your campus identity lives in four places. Each dimension connects you to different people, different possibilities.
              </NarrativeReveal>
            </p>
          </ParallaxText>
        </div>

        <div ref={ref} className="space-y-6">
          {DIMENSIONS.map((dimension, index) => (
            <motion.div
              key={dimension.title}
              className="flex items-start gap-5"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: MOTION.duration.base,
                delay: index * MOTION.stagger.base,
                ease: MOTION.ease.premium,
              }}
            >
              {/* Colored dot instead of icon */}
              <div className={cn('w-2 h-2 rounded-full mt-2', dimension.accent, 'opacity-60')} />
              <div>
                <h3 className="text-[16px] font-medium text-white/80 mb-1">
                  {dimension.title}
                </h3>
                <p className="text-[14px] text-white/40">{dimension.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatedBorder variant="container" className="mt-20 rounded-2xl p-10">
          <div className="text-center">
            <p className="text-[20px] font-medium text-white/80 mb-4">
              Sign in to discover your territory
            </p>
            <p className="text-[14px] text-white/40">
              See spaces tailored to your major, interests, and community.
            </p>
          </div>
        </AnimatedBorder>
      </div>
    </RevealSection>
  );
}

// ============================================================
// Browse Section
// ============================================================

function BrowseSection({
  spaces,
  loading,
  searchQuery,
  onSearchChange,
  router,
}: {
  spaces: Space[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  router: any;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: MOTION.viewport.medium });

  return (
    <RevealSection id="browse" className="px-6 py-32" margin="far">
      <div className="max-w-7xl mx-auto">
        <AnimatedBorder variant="horizontal" className="mb-16" />

        <div className="mb-12">
          <ParallaxText speed="subtle">
            <h2
              className="text-[32px] font-semibold text-white tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              All spaces
            </h2>
          </ParallaxText>

          <div className="relative max-w-md mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search spaces..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[14px] text-white placeholder:text-white/30 focus:bg-white/[0.04] focus:border-white/[0.12] transition-all outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
              />
            ))}
          </div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[15px] text-white/40">No spaces found</p>
          </div>
        ) : (
          <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {spaces.map((space, i) => (
              <motion.button
                key={space.id}
                onClick={() => router.push(`/s/${space.handle}`)}
                className="group text-left p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: MOTION.duration.base,
                  delay: Math.min(i * MOTION.stagger.tight, 0.4),
                  ease: MOTION.ease.premium,
                }}
              >
                <div className="flex items-start gap-4">
                  <Avatar size="default">
                    {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                    <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-medium text-white truncate">
                        {space.name}
                      </h3>
                      {space.isVerified && (
                        <span className="text-[10px] text-blue-400">✓</span>
                      )}
                    </div>
                    {space.description && (
                      <p className="text-[13px] text-white/40 line-clamp-2 leading-relaxed">
                        {space.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-[12px] text-white/30">
                        {space.memberCount} members
                      </span>
                      {space.isJoined && (
                        <span className="text-[12px] text-green-400/70">Joined</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </RevealSection>
  );
}

'use client';

/**
 * /spaces — Your Campus Territory
 *
 * Single-screen bento dashboard layout:
 * - Your Spaces (left column)
 * - 4 Territory Quadrants: Major, Interests, Home, Community
 * - Discover section
 * - No scroll required — everything visible
 *
 * @version 14.0.0 - Bento dashboard, no scroll (Jan 2026)
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, BookOpen, Compass, Home, Users, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Text,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  motion,
  MOTION,
  WordReveal,
} from '@hive/ui/design-system/primitives';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { SpaceCreationModal } from '@/components/spaces/SpaceCreationModal';

const STORAGE_KEY = 'hive-spaces-intro-seen';

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

// ============================================================
// Territory Quadrants
// ============================================================

const TERRITORY_QUADRANTS = [
  {
    id: 'major',
    title: 'Major',
    subtitle: 'Your academic tribe',
    icon: GraduationCap,
    accent: 'from-blue-500/20 to-blue-600/10',
    border: 'hover:border-blue-500/30',
    iconColor: 'text-blue-400',
    count: 42,
  },
  {
    id: 'interests',
    title: 'Interests',
    subtitle: 'Clubs & passions',
    icon: Compass,
    accent: 'from-amber-500/20 to-orange-500/10',
    border: 'hover:border-amber-500/30',
    iconColor: 'text-amber-400',
    count: 86,
  },
  {
    id: 'home',
    title: 'Home',
    subtitle: 'Residential life',
    icon: Home,
    accent: 'from-green-500/20 to-emerald-500/10',
    border: 'hover:border-green-500/30',
    iconColor: 'text-green-400',
    count: 24,
  },
  {
    id: 'community',
    title: 'Community',
    subtitle: 'Greek & cultural',
    icon: Users,
    accent: 'from-pink-500/20 to-rose-500/10',
    border: 'hover:border-pink-500/30',
    iconColor: 'text-pink-400',
    count: 128,
  },
];

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
            handle: s.handle || s.slug,
            avatarUrl: s.avatarUrl,
            category: s.category || 'general',
            memberCount: s.memberCount || 0,
            isVerified: s.isVerified,
            isJoined: true,
          }))
        );
      })
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false));
  }, [user]);

  return { spaces, loading };
}

function useDiscoverSpaces() {
  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/spaces?limit=6&sort=trending')
      .then((res) => res.json())
      .then((data) => {
        setSpaces(data.spaces || []);
      })
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false));
  }, []);

  return { spaces, loading };
}

// ============================================================
// Main Component
// ============================================================

export default function SpacesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [hasSeenIntro, setHasSeenIntro] = React.useState<boolean | null>(null);

  const { spaces: mySpaces, loading: loadingMySpaces } = useMySpaces();
  const { spaces: discoverSpaces, loading: loadingDiscover } = useDiscoverSpaces();

  // Check if intro seen
  React.useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    setHasSeenIntro(seen === 'true');
  }, []);

  // Handle ?create=true from /spaces/new redirect
  React.useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      router.replace('/spaces', { scroll: false });
    }
  }, [searchParams, router]);

  const completeIntro = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasSeenIntro(true);
  };

  // Still checking localStorage
  if (hasSeenIntro === null) {
    return null;
  }

  // First visit: Brief intro then show dashboard
  if (!hasSeenIntro) {
    return <IntroOverlay onComplete={completeIntro} />;
  }

  // Main bento dashboard
  return (
    <div className="h-screen bg-[#0A0A09] p-6 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-[28px] font-semibold text-white tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Spaces
          </h1>
          <p className="text-white/40 text-sm">Your campus territory</p>
        </div>
        <Button variant="default" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} className="mr-2" />
          Create Space
        </Button>
      </header>

      {/* Bento Grid */}
      <div className="flex-1 grid grid-cols-4 grid-rows-3 gap-4 min-h-0">
        {/* Your Spaces - Left column, spans 2 rows */}
        <motion.div
          className="col-span-1 row-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-medium text-white">Your Spaces</h2>
            <span className="text-[12px] text-white/30">{mySpaces.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {loadingMySpaces ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : mySpaces.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white/30 text-sm text-center">
                  No spaces yet.<br />
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-white/50 hover:text-white/70 underline underline-offset-2"
                  >
                    Create your first
                  </button>
                </p>
              </div>
            ) : (
              mySpaces.slice(0, 8).map((space) => (
                <button
                  key={space.id}
                  onClick={() => router.push(`/s/${space.handle || space.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                >
                  <Avatar size="sm">
                    {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                    <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white/80 truncate">{space.name}</p>
                    <p className="text-[11px] text-white/30">{space.memberCount} members</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>

        {/* Territory Quadrants - 2x2 grid on the right */}
        {TERRITORY_QUADRANTS.map((quadrant, i) => (
          <motion.button
            key={quadrant.id}
            onClick={() => router.push(`/spaces?category=${quadrant.id}`)}
            className={cn(
              'rounded-2xl border border-white/[0.06] p-5 text-left transition-all duration-300',
              'bg-gradient-to-br',
              quadrant.accent,
              quadrant.border
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: MOTION.duration.base,
              delay: 0.05 * (i + 1),
              ease: MOTION.ease.premium,
            }}
          >
            <quadrant.icon className={cn('w-6 h-6 mb-3', quadrant.iconColor)} />
            <h3 className="text-[17px] font-semibold text-white mb-1">{quadrant.title}</h3>
            <p className="text-[12px] text-white/40 mb-3">{quadrant.subtitle}</p>
            <p className="text-[11px] text-white/30">{quadrant.count} spaces</p>
          </motion.button>
        ))}

        {/* Discover - Bottom row, full width */}
        <motion.div
          className="col-span-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, delay: 0.25, ease: MOTION.ease.premium }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-medium text-white">Discover</h2>
            <button
              onClick={() => router.push('/spaces/browse')}
              className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
            >
              View all →
            </button>
          </div>

          <div className="grid grid-cols-6 gap-3">
            {loadingDiscover ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-white/[0.04] animate-pulse" />
              ))
            ) : (
              discoverSpaces.slice(0, 6).map((space) => (
                <button
                  key={space.id}
                  onClick={() => router.push(`/s/${space.handle || space.id}`)}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <Avatar size="default">
                    {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                    <AvatarFallback>{getInitials(space.name)}</AvatarFallback>
                  </Avatar>
                  <p className="text-[11px] font-medium text-white/50 group-hover:text-white/70 truncate w-full text-center transition-colors">
                    {space.name}
                  </p>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Create Space Modal */}
      <SpaceCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}

// ============================================================
// Intro Overlay (First Visit Only)
// ============================================================

function IntroOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (step < 2) {
        setStep(step + 1);
      } else {
        onComplete();
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [step, onComplete]);

  const messages = [
    'Your campus has a shape',
    'Four dimensions define you',
    'Find your territory',
  ];

  return (
    <div
      className="fixed inset-0 bg-[#0A0A09] z-50 flex items-center justify-center cursor-pointer"
      onClick={onComplete}
    >
      <motion.div
        key={step}
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
      >
        <h1
          className="text-[40px] md:text-[56px] font-semibold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <WordReveal text={messages[step]} />
        </h1>
      </motion.div>

      {/* Progress dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {messages.map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-colors duration-300',
              i <= step ? 'bg-white/60' : 'bg-white/20'
            )}
          />
        ))}
      </div>

      {/* Skip hint */}
      <p className="absolute bottom-8 right-8 text-[11px] text-white/20">
        Click to skip
      </p>
    </div>
  );
}

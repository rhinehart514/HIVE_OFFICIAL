'use client';

/**
 * /spaces — Your Campus Territory
 *
 * GPT/Apple aesthetic:
 * - Dark confidence, minimal chrome
 * - Glass surfaces with subtle blur
 * - Precise typography hierarchy
 * - Generous whitespace
 * - Refined hover states
 *
 * @version 15.0.0 - GPT/Apple aesthetic refinement (Jan 2026)
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
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
}

// ============================================================
// Territory Quadrants — Apple-style minimal
// ============================================================

const QUADRANTS = [
  {
    id: 'major',
    label: 'Major',
    description: 'Academic community',
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    glow: 'group-hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]',
  },
  {
    id: 'interests',
    label: 'Interests',
    description: 'Clubs & passions',
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    glow: 'group-hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]',
  },
  {
    id: 'home',
    label: 'Home',
    description: 'Residential',
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    glow: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]',
  },
  {
    id: 'community',
    label: 'Community',
    description: 'Greek & cultural',
    gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
    glow: 'group-hover:shadow-[0_0_40px_rgba(244,63,94,0.15)]',
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
    fetch('/api/spaces?limit=8&sort=trending')
      .then((res) => res.json())
      .then((data) => setSpaces(data.spaces || []))
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
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [hasSeenIntro, setHasSeenIntro] = React.useState<boolean | null>(null);

  const { spaces: mySpaces, loading: loadingMySpaces } = useMySpaces();
  const { spaces: discoverSpaces, loading: loadingDiscover } = useDiscoverSpaces();

  React.useEffect(() => {
    setHasSeenIntro(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

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

  if (hasSeenIntro === null) return null;
  if (!hasSeenIntro) return <IntroOverlay onComplete={completeIntro} />;

  return (
    <div className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      {/* Header — GPT-style minimal */}
      <header className="px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-medium text-white/90 tracking-tight">
            Spaces
          </h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
        >
          <Plus size={18} className="mr-2" />
          New
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 pb-8 min-h-0">
        <div className="h-full grid grid-cols-12 gap-5">

          {/* Left: Your Spaces — Glass card */}
          <motion.aside
            className="col-span-3 rounded-2xl backdrop-blur-xl overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="p-5 border-b border-white/[0.04]">
              <span className="text-[13px] font-medium text-white/40 uppercase tracking-wider">
                Your Spaces
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loadingMySpaces ? (
                <div className="space-y-1 p-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-11 rounded-xl bg-white/[0.02] animate-pulse" />
                  ))}
                </div>
              ) : mySpaces.length === 0 ? (
                <div className="h-full flex items-center justify-center p-6">
                  <p className="text-[13px] text-white/20 text-center leading-relaxed">
                    No spaces yet
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {mySpaces.slice(0, 10).map((space, i) => (
                    <motion.button
                      key={space.id}
                      onClick={() => router.push(`/s/${space.handle || space.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 hover:bg-white/[0.04]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Avatar size="sm" className="ring-1 ring-white/[0.06]">
                        {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                        <AvatarFallback className="text-[11px]">
                          {getInitials(space.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[14px] text-white/70 truncate flex-1">
                        {space.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>

          {/* Center: Territory Quadrants — 2x2 */}
          <div className="col-span-6 grid grid-cols-2 grid-rows-2 gap-4">
            {QUADRANTS.map((q, i) => (
              <motion.button
                key={q.id}
                onClick={() => router.push(`/spaces/browse?category=${q.id}`)}
                className={cn(
                  'group relative rounded-2xl p-6 text-left overflow-hidden transition-all duration-500',
                  'bg-gradient-to-br',
                  q.gradient,
                  q.glow
                )}
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-[20px] font-medium text-white/90 mb-1">
                    {q.label}
                  </h3>
                  <p className="text-[13px] text-white/30">
                    {q.description}
                  </p>
                </div>

                {/* Hover arrow */}
                <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white/20 text-lg">→</span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right: Discover — Vertical list */}
          <motion.aside
            className="col-span-3 rounded-2xl backdrop-blur-xl overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
            }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="p-5 border-b border-white/[0.04] flex items-center justify-between">
              <span className="text-[13px] font-medium text-white/40 uppercase tracking-wider">
                Discover
              </span>
              <button
                onClick={() => router.push('/spaces/browse')}
                className="text-[11px] text-white/20 hover:text-white/40 transition-colors"
              >
                See all
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loadingDiscover ? (
                <div className="space-y-1 p-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-11 rounded-xl bg-white/[0.02] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {discoverSpaces.slice(0, 8).map((space, i) => (
                    <motion.button
                      key={space.id}
                      onClick={() => router.push(`/s/${space.handle || space.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 hover:bg-white/[0.04]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.03 }}
                    >
                      <Avatar size="sm" className="ring-1 ring-white/[0.06]">
                        {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                        <AvatarFallback className="text-[11px]">
                          {getInitials(space.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-white/70 truncate">{space.name}</p>
                        <p className="text-[11px] text-white/20">{space.memberCount} members</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      </main>

      <SpaceCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}

// ============================================================
// Intro Overlay — Apple-style reveal
// ============================================================

function IntroOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (step < 2) setStep(step + 1);
      else onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [step, onComplete]);

  const lines = [
    'Your campus has a shape',
    'Four dimensions define you',
    'Find your territory',
  ];

  return (
    <div
      className="fixed inset-0 bg-[#0A0A0A] z-50 flex items-center justify-center cursor-pointer"
      onClick={onComplete}
    >
      <motion.h1
        key={step}
        className="text-[48px] md:text-[64px] font-medium text-white/90 tracking-tight text-center px-8"
        style={{ fontFamily: 'var(--font-display)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <WordReveal text={lines[step]} />
      </motion.h1>

      {/* Minimal progress */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3">
        {lines.map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1 h-1 rounded-full transition-all duration-500',
              i <= step ? 'bg-white/60 scale-100' : 'bg-white/10 scale-75'
            )}
          />
        ))}
      </div>
    </div>
  );
}

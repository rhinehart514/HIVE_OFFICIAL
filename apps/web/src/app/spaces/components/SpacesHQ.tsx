'use client';

/**
 * SpacesHQ — Your Spaces Hub
 *
 * Clean layout with real data only:
 * - Identity row (Major, Home, Greek)
 * - Your spaces grid
 * - Browse link
 *
 * States: empty, onboarding, active
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, MOTION, Button } from '@hive/ui/design-system/primitives';
import { useSpacesHQ } from '../hooks/useSpacesHQ';
import { IdentityRow } from './IdentityRow';
import { OrganizationsPanel } from './OrganizationsPanel';
import { SpaceCreationModal } from '@/components/spaces/SpaceCreationModal';

// ============================================================
// Empty State — Manifesto-style with identity quadrants
// ============================================================

function EmptyState({ onCreateSpace }: { onCreateSpace: () => void }) {
  return (
    <motion.div
      className="flex-1 flex flex-col px-6 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
    >
      {/* Your Territory section */}
      <section className="mb-8">
        <motion.h2
          className="text-label text-white/40 uppercase tracking-wider mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.fast, delay: 0.1, ease: MOTION.ease.premium }}
        >
          Your Identity
        </motion.h2>

        {/* Manifesto + Identity Quadrants Card */}
        <motion.div
          className="rounded-2xl p-6 md:p-8"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, delay: 0.15, ease: MOTION.ease.premium }}
        >
          {/* Manifesto copy */}
          <div className="text-center mb-8">
            <p className="text-body-lg text-white/60 leading-relaxed italic">
              "Every student has a shape on campus.
              <br />
              Yours is waiting to be drawn."
            </p>
          </div>

          {/* Identity Quadrant Placeholders */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <IdentityQuadrantPlaceholder type="major" delay={0.2} />
            <IdentityQuadrantPlaceholder type="home" delay={0.25} />
            <IdentityQuadrantPlaceholder type="greek" delay={0.3} />
          </div>

          {/* Primary CTA */}
          <div className="text-center">
            <Link href="/spaces/browse">
              <Button className="bg-white/[0.08] hover:bg-white/[0.12] text-white/90 px-6">
                Discover Your Spaces
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Divider */}
      <div className="border-t border-white/[0.06] my-4" />

      {/* Create section */}
      <motion.section
        className="pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: MOTION.duration.fast, delay: 0.4, ease: MOTION.ease.premium }}
      >
        <p className="text-body text-white/40 mb-4">
          Or create something new
        </p>
        <Button
          variant="ghost"
          onClick={onCreateSpace}
          className="text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
        >
          <Plus size={16} className="mr-2" />
          Create a Space
        </Button>
      </motion.section>
    </motion.div>
  );
}

// Identity Quadrant Placeholder for empty state
function IdentityQuadrantPlaceholder({ type, delay }: { type: 'major' | 'home' | 'greek'; delay: number }) {
  const config = {
    major: {
      label: 'Major',
      emptyText: 'Choose your major',
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      accent: 'text-blue-400',
    },
    home: {
      label: 'Home',
      emptyText: 'Find your residence',
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      accent: 'text-emerald-400',
    },
    greek: {
      label: 'Greek',
      emptyText: 'Join your letters',
      gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
      accent: 'text-rose-400',
    },
  }[type];

  return (
    <motion.div
      className="rounded-xl p-4 text-center"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.02)',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration.fast, delay, ease: MOTION.ease.premium }}
    >
      <span className={`text-label-sm font-medium uppercase tracking-wider ${config.accent}`}>
        {config.label}
      </span>
      <div className="flex justify-center gap-1 mt-3 mb-2">
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span className="w-1 h-1 rounded-full bg-white/20" />
      </div>
      <p className="text-label text-white/30 italic">
        {config.emptyText}
      </p>
    </motion.div>
  );
}

// ============================================================
// Onboarding State
// ============================================================

function OnboardingBanner({ progress, onBrowse }: { progress: number; onBrowse: () => void }) {
  const remaining = 3 - progress;

  return (
    <motion.div
      className="mx-6 mb-6 p-4 rounded-xl"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Progress dots - gold for completed */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < progress ? 'bg-[var(--color-gold)]' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <span className="text-body-sm text-white/60">
            {remaining === 0 ? 'Identity complete!' : `${remaining} identity space${remaining === 1 ? '' : 's'} remaining`}
          </span>
        </div>
        <button
          onClick={onBrowse}
          className="text-label text-white/40 hover:text-white/60 transition-colors"
        >
          Complete setup
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Loading State
// ============================================================

function LoadingState() {
  return (
    <div className="flex-1 px-6 pb-8 flex flex-col gap-8">
      {/* Identity Row Skeleton */}
      <section>
        <motion.div
          className="h-4 w-24 rounded bg-white/[0.04] mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: MOTION.ease.smooth }}
        />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-24 rounded-xl bg-white/[0.02]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: MOTION.ease.smooth,
              }}
            />
          ))}
        </div>
      </section>

      {/* Your Spaces Skeleton */}
      <section className="flex-1">
        <motion.div
          className="h-4 w-28 rounded bg-white/[0.04] mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: MOTION.ease.smooth }}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="h-16 rounded-lg bg-white/[0.02]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.3 + i * 0.05,
                ease: MOTION.ease.smooth,
              }}
            />
          ))}
        </div>
      </section>

      {/* Browse link skeleton */}
      <div className="pt-4 border-t border-white/[0.06]">
        <motion.div
          className="h-4 w-36 rounded bg-white/[0.04]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: MOTION.ease.smooth }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Error State
// ============================================================

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div
      className="flex-1 flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
    >
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <h2 className="text-heading font-medium text-white/90 tracking-tight mb-2">
          Something went wrong
        </h2>
        <p className="text-body text-white/40 leading-relaxed mb-6">
          {error || 'Failed to load your spaces. Please try again.'}
        </p>
        <Button
          onClick={onRetry}
          className="bg-white/[0.08] hover:bg-white/[0.12] text-white/90"
        >
          <RefreshCw size={16} className="mr-2" />
          Try again
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SpacesHQ() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // Handle ?create=true query param
  React.useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      router.replace('/spaces', { scroll: false });
    }
  }, [searchParams, router]);

  const {
    state,
    loading,
    error,
    identityClaims,
    identityProgress,
    organizations,
    refresh,
  } = useSpacesHQ();

  // Quick action handlers
  const handleMuteSpace = async (spaceId: string) => {
    try {
      await fetch(`/api/spaces/${spaceId}/mute`, { method: 'POST' });
      refresh();
    } catch {
      // Error handling via toast is done in OrganizationsPanel
    }
  };

  const handleLeaveSpace = async (spaceId: string) => {
    try {
      await fetch(`/api/spaces/${spaceId}/leave`, { method: 'POST' });
      refresh();
    } catch {
      // Error handling via toast is done in OrganizationsPanel
    }
  };

  // Error state
  if (error) {
    return (
      <div className="h-screen bg-black flex flex-col overflow-hidden">
        <Header onCreateSpace={() => setShowCreateModal(true)} />
        <ErrorState error={error} onRetry={refresh} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen bg-black flex flex-col overflow-hidden">
        <Header onCreateSpace={() => setShowCreateModal(true)} />
        <LoadingState />
      </div>
    );
  }

  // Empty state
  if (state === 'empty') {
    return (
      <div className="h-screen bg-black flex flex-col overflow-hidden">
        <Header onCreateSpace={() => setShowCreateModal(true)} />
        <EmptyState onCreateSpace={() => setShowCreateModal(true)} />
        <SpaceCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header onCreateSpace={() => setShowCreateModal(true)} />

      {/* Onboarding banner */}
      {state === 'onboarding' && (
        <OnboardingBanner
          progress={identityProgress}
          onBrowse={() => router.push('/spaces/browse')}
        />
      )}

      {/* Main content */}
      <main className="flex-1 px-6 pb-8 flex flex-col gap-8">
        {/* Identity Row */}
        <section>
          <h2 className="text-label text-white/40 uppercase tracking-wider mb-4">
            Your Identity
          </h2>
          <IdentityRow
            majorSpace={identityClaims.major}
            homeSpace={identityClaims.home}
            greekSpace={identityClaims.greek}
          />
        </section>

        {/* Your Organizations - full width */}
        <section className="flex-1">
          <h2 className="text-label text-white/40 uppercase tracking-wider mb-4">
            Your Organizations
          </h2>
          <OrganizationsPanel
            spaces={organizations}
            maxVisible={12}
            onMuteSpace={handleMuteSpace}
            onLeaveSpace={handleLeaveSpace}
          />
        </section>

        {/* Browse link */}
        <div className="pt-4 border-t border-white/[0.06]">
          <Link
            href="/spaces/browse"
            className="group flex items-center gap-2 text-body text-white/50 hover:text-white/80 transition-colors"
          >
            Browse more spaces
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
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
// Header
// ============================================================

function Header({ onCreateSpace }: { onCreateSpace: () => void }) {
  return (
    <header className="px-6 py-5 flex items-center justify-between shrink-0">
      <h1 className="text-title-lg font-medium text-white/90 tracking-tight">
        Spaces
      </h1>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCreateSpace}
        className="text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
      >
        <Plus size={18} className="mr-2" />
        New
      </Button>
    </header>
  );
}

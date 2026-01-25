'use client';

/**
 * SpacesHQ — Command Center for Campus Life
 *
 * A viewport-fit dashboard with:
 * - Identity row (Major, Home, Greek)
 * - Organizations panel (clubs/orgs)
 * - Attention panel (actions + live)
 * - Recent activity footer
 *
 * States: empty, onboarding, active
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { motion, MOTION, Button } from '@hive/ui/design-system/primitives';
import { useSpacesHQ, type HQState } from '../hooks/useSpacesHQ';
import { IdentityRow } from './IdentityRow';
import { OrganizationsPanel } from './OrganizationsPanel';
import { AttentionPanel } from './AttentionPanel';
import { RecentActivity } from './RecentActivity';
import { SpaceCreationModal } from '@/components/spaces/SpaceCreationModal';

// ============================================================
// Empty State
// ============================================================

function EmptyState({ onCreateSpace }: { onCreateSpace: () => void }) {
  return (
    <motion.div
      className="flex-1 flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
    >
      <div className="text-center max-w-md">
        <h2 className="text-heading font-medium text-white/90 tracking-tight mb-4">
          Your campus awaits
        </h2>
        <p className="text-body text-white/40 leading-relaxed mb-8">
          Join spaces to connect with your major, residence, Greek life, and campus organizations.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => window.location.href = '/spaces/browse'}
            className="bg-white/[0.08] hover:bg-white/[0.12] text-white/90"
          >
            Browse Spaces
          </Button>
          <Button
            variant="ghost"
            onClick={onCreateSpace}
            className="text-white/50 hover:text-white/80"
          >
            <Plus size={16} className="mr-2" />
            Create Space
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Onboarding State
// ============================================================

function OnboardingBanner({ progress }: { progress: number }) {
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
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < progress ? 'bg-emerald-500' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <span className="text-body-sm text-white/60">
            {remaining === 0 ? 'Identity complete!' : `${remaining} identity space${remaining === 1 ? '' : 's'} remaining`}
          </span>
        </div>
        <button
          onClick={() => window.location.href = '/spaces/browse'}
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
    <div className="flex-1 flex items-center justify-center">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-white/20"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
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
    identityClaims,
    identityProgress,
    organizations,
    actions,
    liveSpaces,
    recentActivity,
  } = useSpacesHQ();

  if (loading) {
    return (
      <div className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
        <Header onCreateSpace={() => setShowCreateModal(true)} />
        <LoadingState />
      </div>
    );
  }

  // Empty state
  if (state === 'empty') {
    return (
      <div className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
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
    <div className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      <Header onCreateSpace={() => setShowCreateModal(true)} />

      {/* Onboarding banner */}
      {state === 'onboarding' && <OnboardingBanner progress={identityProgress} />}

      {/* Main content - no scroll */}
      <main className="flex-1 px-6 pb-6 min-h-0 flex flex-col gap-5">
        {/* Identity Row */}
        <IdentityRow
          majorSpace={identityClaims.major}
          homeSpace={identityClaims.home}
          greekSpace={identityClaims.greek}
        />

        {/* Middle section: Organizations + Attention */}
        <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">
          {/* Organizations Panel - spans 8 cols */}
          <div className="col-span-8 min-h-0">
            <OrganizationsPanel spaces={organizations} maxVisible={8} />
          </div>

          {/* Attention Panel - spans 4 cols */}
          <div className="col-span-4 min-h-0">
            <AttentionPanel actions={actions} liveSpaces={liveSpaces} />
          </div>
        </div>

        {/* Recent Activity Footer */}
        <RecentActivity activities={recentActivity} maxVisible={4} />
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

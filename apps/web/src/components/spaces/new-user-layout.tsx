'use client';

/**
 * NewUserLayout - Discovery-first layout for users with no joined spaces
 *
 * When a user hasn't joined any spaces yet, we lead with discovery
 * to help them find their people immediately.
 *
 * Layout Order:
 * 1. Hero section with discovery CTA
 * 2. DiscoverSection (primary)
 * 3. IdentityCards (secondary, smaller)
 *
 * @version 1.0.0 - Spaces Page Redesign (Jan 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Text } from '@hive/ui/design-system/primitives';
import {
  DiscoverSection,
  IdentityCards,
  type IdentityType,
  type IdentityClaim,
} from '@/components/spaces';

// ============================================================
// Types
// ============================================================

export interface NewUserLayoutProps {
  // Identity
  claims: Record<IdentityType, IdentityClaim | null>;
  claimsLoading: boolean;
  onClaimClick: (type: IdentityType) => void;
  onViewSpace: (spaceId: string) => void;

  // Discovery
  onNavigateToSpace: (spaceId: string) => void;
  onJoinSpace: (spaceId: string) => Promise<void>;
  joinedSpaceIds: Set<string>;
}

// ============================================================
// Hero Section
// ============================================================

function DiscoveryHero({ onScrollToDiscover }: { onScrollToDiscover: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative mb-8 p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gold-500/10 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-4">
          <SparklesIcon className="w-3.5 h-3.5 text-gold-500" />
          <Text size="xs" className="text-white/60">
            400+ communities
          </Text>
        </div>

        {/* Headline */}
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2 tracking-tight">
          Your campus, organized
        </h2>
        <Text className="text-white/50 mb-6 max-w-md">
          Find your clubs, connect with your dorm, and discover communities that match your vibe.
        </Text>

        {/* CTA */}
        <button
          onClick={onScrollToDiscover}
          className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[#0A0A09] font-medium text-sm hover:bg-white/90 transition-all duration-200"
        >
          Start exploring
          <ArrowDownIcon className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-200" />
        </button>
      </div>
    </motion.section>
  );
}

// ============================================================
// Identity Cards (Compact variant for new users)
// ============================================================

function CompactIdentitySection({
  claims,
  loading,
  onClaimClick,
  onViewSpace,
}: {
  claims: Record<IdentityType, IdentityClaim | null>;
  loading: boolean;
  onClaimClick: (type: IdentityType) => void;
  onViewSpace: (spaceId: string) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mt-10"
    >
      {/* Section header with "also try" language */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <Text size="xs" className="text-white/30 px-2">
          or claim your identity
        </Text>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <IdentityCards
        claims={claims}
        loading={loading}
        onClaimClick={onClaimClick}
        onViewSpace={onViewSpace}
      />
    </motion.section>
  );
}

// ============================================================
// Main Component
// ============================================================

export function NewUserLayout({
  claims,
  claimsLoading,
  onClaimClick,
  onViewSpace,
  onNavigateToSpace,
  onJoinSpace,
  joinedSpaceIds,
}: NewUserLayoutProps) {
  const discoverRef = React.useRef<HTMLDivElement>(null);

  const handleScrollToDiscover = React.useCallback(() => {
    discoverRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero - drives discovery action */}
      <DiscoveryHero onScrollToDiscover={handleScrollToDiscover} />

      {/* Discovery - Primary focus for new users */}
      <div ref={discoverRef} id="discover-section">
        <DiscoverSection
          onNavigateToSpace={onNavigateToSpace}
          onJoinSpace={onJoinSpace}
          joinedSpaceIds={joinedSpaceIds}
        />
      </div>

      {/* Identity Cards - Secondary for new users */}
      <CompactIdentitySection
        claims={claims}
        loading={claimsLoading}
        onClaimClick={onClaimClick}
        onViewSpace={onViewSpace}
      />
    </div>
  );
}

export default NewUserLayout;

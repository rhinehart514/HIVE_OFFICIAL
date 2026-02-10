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
import { WordReveal, AnimatedLine } from '@hive/ui/motion';
import { MOTION } from '@hive/tokens';
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
      transition={{ duration: MOTION.duration.gentle / 1000, ease: MOTION.ease.premium }}
      className="relative mb-10 overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.06] p-10"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[var(--color-gold)]/8 blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.06] mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: MOTION.ease.premium }}
        >
          <SparklesIcon className="w-3.5 h-3.5 text-[var(--color-gold)]/60" />
          <Text size="xs" className="text-white/50">
            400+ communities
          </Text>
        </motion.div>

        {/* Headline with word reveal */}
        <h2
          className="text-heading-lg md:text-display-sm font-semibold text-white mb-4 tracking-tight leading-[1.0]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <WordReveal stagger={0.12} delay={0.2}>
            Your campus, organized
          </WordReveal>
        </h2>

        {/* Subtext */}
        <motion.p
          className="text-title-sm md:text-title leading-relaxed text-white/50 mb-8 max-w-md"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: MOTION.ease.premium }}
        >
          Every club, dorm, and org has a home here. Find yours.
        </motion.p>

        {/* CTA */}
        <motion.button
          onClick={onScrollToDiscover}
          className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[var(--color-bg-void,#0A0A09)] font-medium text-sm hover:bg-white transition-all duration-200"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7, ease: MOTION.ease.premium }}
        >
          Start exploring
          <ArrowDownIcon className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-200" />
        </motion.button>
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
        <Text size="xs" className="text-white/50 px-2">
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
    <div className="space-y-10">
      {/* Hero - drives discovery action */}
      <DiscoveryHero onScrollToDiscover={handleScrollToDiscover} />

      {/* Animated separator */}
      <AnimatedLine className="my-10" delay={0.8} />

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

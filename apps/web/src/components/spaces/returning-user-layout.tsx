'use client';

/**
 * ReturningUserLayout - Spaces-first layout for users with joined spaces
 *
 * When a user has already joined spaces, we lead with their spaces
 * to get them re-engaged with their communities.
 *
 * Layout Order:
 * 1. YourSpacesList (primary)
 * 2. IdentityCards (compact inline)
 * 3. DiscoverSection (secondary, "Discover More")
 *
 * @version 1.0.0 - Spaces Page Redesign (Jan 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Text } from '@hive/ui/design-system/primitives';
import {
  YourSpacesList,
  DiscoverSection,
  IdentityCards,
  type YourSpace,
  type IdentityType,
  type IdentityClaim,
} from '@/components/spaces';

// ============================================================
// Types
// ============================================================

export interface ReturningUserLayoutProps {
  // Your Spaces
  mySpaces: YourSpace[];
  spacesLoading: boolean;
  onNavigateToSpace: (spaceId: string) => void;
  onBrowseAll: () => void;

  // Identity
  claims: Record<IdentityType, IdentityClaim | null>;
  claimsLoading: boolean;
  onClaimClick: (type: IdentityType) => void;
  onViewSpace: (spaceId: string) => void;

  // Discovery
  onJoinSpace: (spaceId: string) => Promise<void>;
  joinedSpaceIds: Set<string>;
}

// ============================================================
// Compact Identity Strip (inline for returning users)
// ============================================================

function CompactIdentityStrip({
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
  // Count unclaimed identities
  const unclaimedCount = Object.values(claims).filter((c) => c === null).length;

  // If all claimed or none claimed, show regular grid
  if (unclaimedCount === 0 || unclaimedCount === 3) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <IdentityCards
          claims={claims}
          loading={loading}
          onClaimClick={onClaimClick}
          onViewSpace={onViewSpace}
        />
      </motion.section>
    );
  }

  // Partial claims - show compact
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
    >
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
// Discover More Section (secondary for returning users)
// ============================================================

function DiscoverMoreSection({
  onNavigateToSpace,
  onJoinSpace,
  joinedSpaceIds,
}: {
  onNavigateToSpace: (spaceId: string) => void;
  onJoinSpace: (spaceId: string) => Promise<void>;
  joinedSpaceIds: Set<string>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.2 }}
      id="discover-section"
    >
      {/* Section divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <Text weight="medium" className="text-[11px] uppercase tracking-wider text-white/40">
          Discover More
        </Text>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <DiscoverSection
        onNavigateToSpace={onNavigateToSpace}
        onJoinSpace={onJoinSpace}
        joinedSpaceIds={joinedSpaceIds}
      />
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ReturningUserLayout({
  mySpaces,
  spacesLoading,
  onNavigateToSpace,
  onBrowseAll,
  claims,
  claimsLoading,
  onClaimClick,
  onViewSpace,
  onJoinSpace,
  joinedSpaceIds,
}: ReturningUserLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Your Spaces - Primary focus for returning users */}
      <YourSpacesList
        spaces={mySpaces}
        loading={spacesLoading}
        onNavigateToSpace={onNavigateToSpace}
        onBrowseAll={onBrowseAll}
      />

      {/* Identity Cards - Compact for returning users */}
      <CompactIdentityStrip
        claims={claims}
        loading={claimsLoading}
        onClaimClick={onClaimClick}
        onViewSpace={onViewSpace}
      />

      {/* Discover More - Secondary for returning users */}
      <DiscoverMoreSection
        onNavigateToSpace={onNavigateToSpace}
        onJoinSpace={onJoinSpace}
        joinedSpaceIds={joinedSpaceIds}
      />
    </div>
  );
}

export default ReturningUserLayout;

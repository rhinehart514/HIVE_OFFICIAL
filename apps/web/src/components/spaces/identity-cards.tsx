'use client';

/**
 * IdentityCards - Campus identity claims section
 *
 * Displays three identity cards: Residential, Major, Greek
 * Each can be claimed once and defines campus identity.
 *
 * @version 1.0.0 - Spaces Hub redesign (Jan 2026)
 */

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  Text,
  SimpleAvatar,
  Skeleton,
} from '@hive/ui/design-system/primitives';
import { MOTION } from '@hive/tokens';

// ============================================================
// Types
// ============================================================

export type IdentityType = 'residential' | 'major' | 'greek';

export interface IdentityClaim {
  id: string;
  type: IdentityType;
  spaceId: string;
  spaceName: string;
  spaceAvatarUrl?: string;
  memberCount: number;
  claimedAt: Date | string;
}

export interface IdentityCardsProps {
  claims: Record<IdentityType, IdentityClaim | null>;
  loading?: boolean;
  onClaimClick: (type: IdentityType) => void;
  onViewSpace: (spaceId: string) => void;
  /** When true and some claims exist, unclaimed cards collapse to compact chips */
  compact?: boolean;
}

// ============================================================
// Identity Card Config
// ============================================================

const IDENTITY_CONFIG: Record<
  IdentityType,
  {
    label: string;
    emptyLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    gradient: string;
    borderColor: string;
  }
> = {
  residential: {
    label: 'Home',
    emptyLabel: 'Claim your dorm',
    icon: HomeIcon,
    description: 'Your residential community',
    gradient: 'from-blue-400/5 to-transparent',
    borderColor: 'border-blue-400/10',
  },
  major: {
    label: 'Major',
    emptyLabel: 'Claim your major',
    icon: AcademicCapIcon,
    description: 'Your academic department',
    gradient: 'from-purple-400/5 to-transparent',
    borderColor: 'border-purple-400/10',
  },
  greek: {
    label: 'Greek',
    emptyLabel: 'Claim chapter',
    icon: UserGroupIcon,
    description: 'Your Greek organization',
    gradient: 'from-[var(--color-gold)]/5 to-transparent',
    borderColor: 'border-[var(--color-gold)]/10',
  },
};

// ============================================================
// Single Identity Card
// ============================================================

interface IdentityCardProps {
  type: IdentityType;
  claim: IdentityClaim | null;
  onClaimClick: () => void;
  onViewSpace: (spaceId: string) => void;
  /** Render as compact chip instead of full card */
  asChip?: boolean;
}

function IdentityCard({
  type,
  claim,
  onClaimClick,
  onViewSpace: _onViewSpace,
  asChip = false,
}: IdentityCardProps) {
  const config = IDENTITY_CONFIG[type];
  const Icon = config.icon;
  const isEmpty = !claim;

  // Compact chip for unclaimed (progressive disclosure)
  if (isEmpty && asChip) {
    return (
      <motion.button
        onClick={onClaimClick}
        whileHover={{ opacity: 0.9 }}
        whileTap={{ opacity: 0.8 }}
        className={cn(
          'group flex items-center gap-2 px-3 py-2',
          'rounded-lg',
          'bg-white/[0.02] hover:bg-white/[0.04]',
          'border border-white/[0.06] hover:border-white/[0.10]',
          'transition-all duration-200',
          'h-[48px]'
        )}
      >
        <PlusIcon className="w-3.5 h-3.5 text-white/30" />
        <Text size="sm" className="text-white/40 group-hover:text-white/50">
          + {config.label}
        </Text>
      </motion.button>
    );
  }

  // Empty state - clickable to claim (full card)
  if (isEmpty) {
    return (
      <motion.button
        onClick={onClaimClick}
        whileHover={{ opacity: 0.9 }}
        whileTap={{ opacity: 0.8 }}
        className={cn(
          'group relative flex flex-col items-start p-4',
          'rounded-xl',
          'bg-white/[0.02] hover:bg-white/[0.04]',
          'border border-white/[0.06] hover:border-white/[0.10]',
          'transition-all duration-200',
          'text-left w-full h-full min-h-[100px]'
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg mb-2',
            'bg-white/[0.04] group-hover:bg-white/[0.06]',
            'transition-colors duration-200'
          )}
        >
          <Icon className="w-4 h-4 text-white/30 group-hover:text-white/40" />
        </div>

        {/* Label */}
        <Text weight="medium" className="text-white/50 group-hover:text-white/60 mb-1">
          {config.label}
        </Text>

        {/* CTA */}
        <div className="flex items-center gap-1.5 mt-auto">
          <PlusIcon className="w-3.5 h-3.5 text-white/30" />
          <Text size="sm" className="text-white/40 group-hover:text-white/50">
            {config.emptyLabel}
          </Text>
        </div>
      </motion.button>
    );
  }

  // Filled state - clickable to view space
  return (
    <motion.div
      whileHover={{ opacity: 0.9 }}
      whileTap={{ opacity: 0.8 }}
      className="w-full h-full"
    >
      <Link
        href={`/spaces/${claim.spaceId}`}
        className={cn(
          'group relative flex flex-col items-start p-4',
          'rounded-xl',
          'bg-white/[0.02] hover:bg-white/[0.04]',
          'border border-white/[0.06] hover:border-white/[0.08]',
          'transition-all duration-200',
          'text-left w-full h-full min-h-[100px]'
        )}
      >
        {/* Subtle gradient */}
        <div
          className={cn(
            'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100',
            'bg-gradient-to-br',
            config.gradient,
            'transition-opacity duration-300'
          )}
        />

        {/* Content */}
        <div className="relative z-10 flex items-start gap-3 w-full">
          {/* Avatar */}
          <SimpleAvatar
            src={claim.spaceAvatarUrl}
            fallback={claim.spaceName.substring(0, 2)}
            size="sm"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Text size="xs" className="text-white/40 mb-0.5">
              {config.label}
            </Text>
            <Text weight="medium" className="text-white/90 truncate">
              {claim.spaceName}
            </Text>
          </div>
        </div>

        {/* Member count */}
        <div className="relative z-10 mt-auto pt-2">
          <Text size="xs" className="text-white/30">
            {claim.memberCount.toLocaleString()} {claim.memberCount === 1 ? 'member' : 'members'}
          </Text>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================================
// Identity Card Skeleton
// ============================================================

function IdentityCardSkeleton() {
  return (
    <div className="flex flex-col p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] min-h-[100px]">
      <div className="flex items-start gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-auto pt-2">
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function IdentityCards({
  claims,
  loading = false,
  onClaimClick,
  onViewSpace,
  compact = false,
}: IdentityCardsProps) {
  const identityTypes: IdentityType[] = ['residential', 'major', 'greek'];

  // Count claimed vs unclaimed for progressive disclosure
  const claimedTypes = identityTypes.filter((type) => claims[type] !== null);
  const unclaimedTypes = identityTypes.filter((type) => claims[type] === null);
  const hasAnyClaims = claimedTypes.length > 0;
  const shouldShowCompact = compact && hasAnyClaims && unclaimedTypes.length > 0;

  if (loading) {
    return (
      <section className="mb-8">
        <Text
          weight="medium"
          className="text-label-sm uppercase tracking-wider text-white/40 mb-4"
        >
          Your Campus Identity
        </Text>
        <div className="grid grid-cols-3 gap-3">
          {identityTypes.map((type) => (
            <IdentityCardSkeleton key={type} />
          ))}
        </div>
      </section>
    );
  }

  // Progressive disclosure: show claimed at full size, unclaimed as chips
  if (shouldShowCompact) {
    return (
      <section className="mb-8">
        <Text
          weight="medium"
          className="text-label-sm uppercase tracking-wider text-white/40 mb-4"
        >
          Your Campus Identity
        </Text>

        {/* Claimed cards at full size */}
        <div className={cn(
          'grid gap-3 mb-3',
          claimedTypes.length === 1 && 'grid-cols-1',
          claimedTypes.length === 2 && 'grid-cols-2',
          claimedTypes.length === 3 && 'grid-cols-3'
        )}>
          {claimedTypes.map((type) => (
            <IdentityCard
              key={type}
              type={type}
              claim={claims[type]}
              onClaimClick={() => onClaimClick(type)}
              onViewSpace={onViewSpace}
            />
          ))}
        </div>

        {/* Unclaimed as compact chips */}
        <div className="flex flex-wrap gap-2">
          {unclaimedTypes.map((type) => (
            <IdentityCard
              key={type}
              type={type}
              claim={null}
              onClaimClick={() => onClaimClick(type)}
              onViewSpace={onViewSpace}
              asChip
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <Text
        weight="medium"
        className="text-label-sm uppercase tracking-wider text-white/40 mb-4"
      >
        Your Campus Identity
      </Text>

      {/* Desktop: Horizontal row */}
      <div className="hidden md:grid md:grid-cols-3 gap-3">
        {identityTypes.map((type, index) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
              duration: 0.6,
              delay: index * 0.1,
              ease: MOTION.ease.premium
            }}
          >
            <IdentityCard
              type={type}
              claim={claims[type]}
              onClaimClick={() => onClaimClick(type)}
              onViewSpace={onViewSpace}
            />
          </motion.div>
        ))}
      </div>

      {/* Mobile: Vertical stack */}
      <div className="md:hidden space-y-2">
        {identityTypes.map((type) => (
          <IdentityCard
            key={type}
            type={type}
            claim={claims[type]}
            onClaimClick={() => onClaimClick(type)}
            onViewSpace={onViewSpace}
          />
        ))}
      </div>
    </section>
  );
}

export default IdentityCards;

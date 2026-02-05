'use client';

/**
 * HubOnboarding - First 7 days: "Building my territory"
 *
 * Features:
 * - Identity constellation prominent (60% of viewport)
 * - Progress indicator: 3 dots, filled = claimed
 * - Gold ambient glow (intensity based on claims)
 * - Organizations section below (collapsed if < 2 spaces)
 * - Motion: Identity cards pulse subtly until claimed
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import {
  motion,
  MOTION,
  Button,
} from '@hive/ui/design-system/primitives';
import { SPACES_MOTION, SPACES_GOLD } from '@hive/ui/tokens';
import { IdentityConstellation } from './identity-constellation';
import { OrganizationsGrid } from './space-orbit';
import type { IdentityClaim, Space } from '../hooks/useSpacesHQ';

// ============================================================
// Types
// ============================================================

interface HubOnboardingProps {
  identityClaims: {
    major: IdentityClaim | null;
    home: IdentityClaim | null;
    greek: IdentityClaim | null;
  };
  identityProgress: number;
  organizations: Space[];
  onCreateSpace?: () => void;
  onMuteSpace?: (spaceId: string) => void;
  onLeaveSpace?: (spaceId: string) => void;
}

// ============================================================
// Progress Indicator
// ============================================================

function ProgressDots({ progress }: { progress: number }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full transition-colors"
          style={{
            backgroundColor: i < progress ? SPACES_GOLD.primary : 'rgba(255,215,0,0.2)',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.3,
            delay: i * 0.1,
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Section Header
// ============================================================

function SectionHeader({
  title,
  progress,
  showProgress = false,
  isGold = false,
}: {
  title: string;
  progress?: number;
  showProgress?: boolean;
  isGold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className={`text-xs font-medium uppercase tracking-wider ${
        isGold ? 'text-gold-500/70' : 'text-white/40'
      }`}>
        {title}
      </h2>
      {showProgress && progress !== undefined && (
        <div className="flex items-center gap-3">
          <ProgressDots progress={progress} />
          <span className="text-xs text-gold-500/50">
            {progress}/3
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function HubOnboarding({
  identityClaims,
  identityProgress,
  organizations,
  onCreateSpace,
  onMuteSpace,
  onLeaveSpace,
}: HubOnboardingProps) {
  const shouldReduceMotion = useReducedMotion();
  const showOrganizations = organizations.length >= 1;

  return (
    <div className="flex-1 flex flex-col px-6 pb-8">
      {/* Claim Your Identity - Prominent Section */}
      <motion.section
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.base,
          ease: MOTION.ease.premium,
        }}
      >
        <SectionHeader
          title="Claim Your Identity"
          progress={identityProgress}
          showProgress
          isGold
        />

        {/* Identity Constellation - Prominent layout */}
        <IdentityConstellation
          major={identityClaims.major}
          home={identityClaims.home}
          greek={identityClaims.greek}
          isOnboarding
          layout="prominent"
        />

        {/* Encouragement message */}
        {identityProgress < 3 && (
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
              delay: shouldReduceMotion ? 0 : 0.5,
              ease: MOTION.ease.premium,
            }}
          >
            <Link
              href="/spaces/browse"
              className="inline-flex items-center gap-2 text-sm text-gold-500/60 hover:text-gold-500/80 transition-colors"
            >
              {identityProgress === 0
                ? 'Start by finding your spaces'
                : `Claim ${3 - identityProgress} more to complete your identity`}
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        )}
      </motion.section>

      {/* Organizations Section - Only show if >= 2 spaces */}
      {showOrganizations && (
        <motion.section
          className="flex-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : MOTION.duration.base,
            delay: shouldReduceMotion ? 0 : 0.3,
            ease: MOTION.ease.premium,
          }}
        >
          <SectionHeader title="Your Organizations" />
          <OrganizationsGrid
            spaces={organizations}
            maxVisible={8}
            onMuteSpace={onMuteSpace}
            onLeaveSpace={onLeaveSpace}
          />
        </motion.section>
      )}

      {/* Bottom Actions */}
      <motion.div
        className="mt-auto pt-6 border-t border-white/[0.04]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
          delay: shouldReduceMotion ? 0 : 0.5,
          ease: MOTION.ease.premium,
        }}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/spaces/browse"
            className="group flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            Browse more spaces
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

          {onCreateSpace && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateSpace}
              className="text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
            >
              <Plus size={14} className="mr-1.5" />
              Create
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

HubOnboarding.displayName = 'HubOnboarding';

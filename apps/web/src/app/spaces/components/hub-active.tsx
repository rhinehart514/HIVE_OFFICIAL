'use client';

/**
 * HubActive - Established: "My world at a glance"
 *
 * Features:
 * - Identity constellation at top (compact, horizontal)
 * - Organizations grid fills remaining space
 * - Energy signals prominent on all cards
 * - Browse link at bottom
 * - Motion: Stagger entrance, warmth glows based on activity
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
import { IdentityConstellation } from './identity-constellation';
import { OrganizationsGrid } from './space-orbit';
import type { IdentityClaim, Space } from '../hooks/useSpacesHQ';

// ============================================================
// Types
// ============================================================

interface HubActiveProps {
  identityClaims: {
    major: IdentityClaim | null;
    home: IdentityClaim | null;
    greek: IdentityClaim | null;
  };
  organizations: Space[];
  onCreateSpace?: () => void;
  onMuteSpace?: (spaceId: string) => void;
  onLeaveSpace?: (spaceId: string) => void;
}

// ============================================================
// Section Header
// ============================================================

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-medium uppercase tracking-wider text-white/40 mb-4">
      {title}
    </h2>
  );
}

// ============================================================
// Main Component
// ============================================================

export function HubActive({
  identityClaims,
  organizations,
  onCreateSpace,
  onMuteSpace,
  onLeaveSpace,
}: HubActiveProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex-1 flex flex-col px-6 pb-8">
      {/* Your Territory - Compact */}
      <motion.section
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.base,
          ease: MOTION.ease.premium,
        }}
      >
        <SectionHeader title="Your Territory" />
        <IdentityConstellation
          major={identityClaims.major}
          home={identityClaims.home}
          greek={identityClaims.greek}
          layout="compact"
        />
      </motion.section>

      {/* Organizations Grid - Main Content */}
      <motion.section
        className="flex-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.base,
          delay: shouldReduceMotion ? 0 : 0.2,
          ease: MOTION.ease.premium,
        }}
      >
        <SectionHeader title="Your Organizations" />
        <OrganizationsGrid
          spaces={organizations}
          maxVisible={12}
          onMuteSpace={onMuteSpace}
          onLeaveSpace={onLeaveSpace}
        />
      </motion.section>

      {/* Bottom Actions */}
      <motion.div
        className="mt-6 pt-4 border-t border-white/[0.04]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
          delay: shouldReduceMotion ? 0 : 0.4,
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

HubActive.displayName = 'HubActive';

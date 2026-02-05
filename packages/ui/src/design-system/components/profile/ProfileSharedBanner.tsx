'use client';

/**
 * ProfileSharedBanner - Shared spaces social proof banner
 *
 * Shows "You're both in Design Club and 2 others" when viewing
 * someone else's profile. Prominent placement for social proof.
 *
 * @version 2.0.0 - Belonging-First Profile Layout
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ProfileSharedBannerProps {
  sharedSpaceNames: string[];
  sharedSpacesCount: number;
  mutualConnectionsCount: number;
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

function buildSharedText(names: string[], totalCount: number): string {
  if (totalCount === 0 && names.length === 0) return '';

  const count = Math.max(totalCount, names.length);

  if (names.length === 0) {
    return `You're both in ${count} space${count !== 1 ? 's' : ''}`;
  }

  if (count === 1) {
    return `You're both in ${names[0]}`;
  }

  if (count === 2 && names.length >= 2) {
    return `You're both in ${names[0]} and ${names[1]}`;
  }

  const remaining = count - 1;
  return `You're both in ${names[0]} and ${remaining} other${remaining !== 1 ? 's' : ''}`;
}

// ============================================================================
// Component
// ============================================================================

export function ProfileSharedBanner({
  sharedSpaceNames,
  sharedSpacesCount,
  mutualConnectionsCount,
  className,
}: ProfileSharedBannerProps) {
  const hasSharedSpaces = sharedSpacesCount > 0 || sharedSpaceNames.length > 0;
  const hasMutualConnections = mutualConnectionsCount > 0;

  if (!hasSharedSpaces && !hasMutualConnections) return null;

  const sharedText = buildSharedText(sharedSpaceNames, sharedSpacesCount);

  return (
    <motion.div
      className={cn('w-full', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Icon */}
        <span
          className="text-base flex-shrink-0"
          style={{ color: 'var(--text-secondary)' }}
        >
          &#x1F91D;
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {hasSharedSpaces && (
            <p
              className="text-[13px] font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {sharedText}
            </p>
          )}
          {hasMutualConnections && (
            <p
              className="text-[12px]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {mutualConnectionsCount} mutual connection{mutualConnectionsCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ProfileSharedBanner;

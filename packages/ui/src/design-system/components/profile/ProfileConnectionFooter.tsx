'use client';

/**
 * ProfileConnectionFooter - Zone 3: Relationship context
 *
 * Design Philosophy:
 * - Subtle, informational — not hero content
 * - Dashed divider, inline text
 * - "YOU & [NAME]: X shared spaces · Y mutual connections"
 * - Hidden for own profile
 *
 * @version 1.0.0 - 3-Zone Profile Layout
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ProfileConnectionFooterProps {
  userName: string;
  sharedSpacesCount: number;
  mutualConnectionsCount: number;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ProfileConnectionFooter({
  userName,
  sharedSpacesCount,
  mutualConnectionsCount,
  className,
}: ProfileConnectionFooterProps) {
  // Don't render if no overlap at all
  const hasOverlap = sharedSpacesCount > 0 || mutualConnectionsCount > 0;

  // Build connection text
  const parts: string[] = [];
  if (sharedSpacesCount > 0) {
    parts.push(`${sharedSpacesCount} shared space${sharedSpacesCount !== 1 ? 's' : ''}`);
  }
  if (mutualConnectionsCount > 0) {
    parts.push(`${mutualConnectionsCount} mutual connection${mutualConnectionsCount !== 1 ? 's' : ''}`);
  }

  // Get first name for display
  const firstName = userName.split(' ')[0];

  return (
    <div className={cn('w-full', className)}>
      {/* Dashed divider */}
      <div
        className="w-full mb-3"
        style={{
          borderTop: '1px dashed var(--border-default)',
        }}
      />

      {/* Connection text */}
      <p
        className="text-[13px] font-normal"
        style={{ color: 'var(--text-secondary)' }}
      >
        {hasOverlap ? (
          <>
            <span style={{ color: 'var(--text-tertiary)' }}>YOU & {firstName.toUpperCase()}:</span>
            {' '}
            {parts.join(' · ')}
          </>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>
            No shared spaces yet · 0 mutual connections
          </span>
        )}
      </p>
    </div>
  );
}

export default ProfileConnectionFooter;

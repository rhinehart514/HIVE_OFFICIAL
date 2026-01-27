'use client';

/**
 * ProfileLeadershipCard - Zone 2: Space leadership display
 *
 * Design Philosophy:
 * - Shows where they LEAD — spaces with authority
 * - Gold star icon (always visible — this IS leadership)
 * - Space name, role + tenure, member count
 * - Gold left border (subtle leadership indicator)
 *
 * @version 1.0.0 - 3-Zone Profile Layout
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ProfileLeadershipSpace {
  id: string;
  name: string;
  emoji?: string;
  memberCount: number;
  tenure?: string; // e.g., "2 years", "6 months"
  role?: 'owner' | 'admin';
}

export interface ProfileLeadershipCardProps {
  space: ProfileLeadershipSpace;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ProfileLeadershipCard({
  space,
  onClick,
  className,
}: ProfileLeadershipCardProps) {
  const roleLabel = space.role === 'owner' ? 'Owner' : 'Leader';

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative p-4 text-left overflow-hidden w-full',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        // Gold left border — leadership indicator
        borderLeft: '2px solid var(--life-gold)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}
      whileHover={{
        y: -2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
      whileTap={{ opacity: 0.9 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Subtle glass overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 40%)',
          borderRadius: '16px',
        }}
      />

      <div className="relative">
        {/* Header with gold star */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-base"
            style={{ color: 'var(--life-gold)' }}
          >
            ★
          </span>
          <h4
            className="text-base font-semibold truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {space.name}
          </h4>
        </div>

        {/* Role + Tenure */}
        <p
          className="text-[13px] font-normal"
          style={{ color: 'var(--text-secondary)' }}
        >
          {roleLabel}
          {space.tenure && ` · ${space.tenure}`}
        </p>

        {/* Member count */}
        <p
          className="text-[13px] font-normal mt-0.5"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {space.memberCount.toLocaleString()} member{space.memberCount !== 1 ? 's' : ''}
        </p>
      </div>
    </motion.button>
  );
}

export default ProfileLeadershipCard;

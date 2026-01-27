'use client';

/**
 * ProfileSpacePill - Zone 3: Compact space membership
 *
 * Design Philosophy:
 * - Compact pill showing space membership
 * - Gold star if leader
 * - Horizontal layout, minimal chrome
 *
 * @version 1.0.0 - 3-Zone Profile Layout
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ProfileSpacePillSpace {
  id: string;
  name: string;
  emoji?: string;
  isLeader?: boolean;
}

export interface ProfileSpacePillProps {
  space: ProfileSpacePillSpace;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ProfileSpacePill({
  space,
  onClick,
  className,
}: ProfileSpacePillProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2 text-left',
        className
      )}
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: '12px',
      }}
      whileHover={{
        backgroundColor: 'rgba(255,255,255,0.08)',
      }}
      whileTap={{ opacity: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      {/* Emoji if present */}
      {space.emoji && (
        <span className="text-sm flex-shrink-0">
          {space.emoji}
        </span>
      )}

      {/* Space name */}
      <span
        className="text-[13px] font-medium truncate max-w-[120px]"
        style={{ color: 'var(--text-primary)' }}
      >
        {space.name}
      </span>

      {/* Leader star */}
      {space.isLeader && (
        <span
          className="text-xs flex-shrink-0"
          style={{ color: 'var(--life-gold)' }}
        >
          ★
        </span>
      )}
    </motion.button>
  );
}

export default ProfileSpacePill;

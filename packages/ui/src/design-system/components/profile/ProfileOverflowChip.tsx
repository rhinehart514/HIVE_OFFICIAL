'use client';

/**
 * ProfileOverflowChip - Collapse indicator for many items
 *
 * Design Philosophy:
 * - Shows "+ N more" for collapsed sections
 * - Subtle, clickable to expand
 * - Used when tools > 3 or spaces > 6
 *
 * @version 1.0.0 - 3-Zone Profile Layout
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ProfileOverflowChipProps {
  count: number;
  label?: string; // e.g., "tools", "spaces"
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ProfileOverflowChip({
  count,
  label,
  onClick,
  className,
}: ProfileOverflowChipProps) {
  if (count <= 0) return null;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center px-3 py-2',
        className
      )}
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: '12px',
        border: '1px dashed rgba(255,255,255,0.1)',
      }}
      whileHover={{
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.15)',
      }}
      whileTap={{ opacity: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      <span
        className="text-[13px] font-medium"
        style={{ color: 'var(--text-tertiary)' }}
      >
        +{count}{label ? ` ${label}` : ''}
      </span>
    </motion.button>
  );
}

export default ProfileOverflowChip;

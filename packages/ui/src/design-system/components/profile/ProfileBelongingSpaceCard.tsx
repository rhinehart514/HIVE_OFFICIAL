'use client';

/**
 * ProfileBelongingSpaceCard - Belonging-first space membership card
 *
 * Shows a space the user is part of with:
 * - Emoji + name
 * - Role badge (member/leader/admin)
 * - Gold accent for leader spaces (left border)
 * - "You're both here" shared badge when viewer shares the space
 *
 * @version 2.0.0 - Belonging-First Profile Layout
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface BelongingSpace {
  id: string;
  name: string;
  emoji?: string;
  role: 'member' | 'admin' | 'owner' | 'leader';
  memberCount?: number;
  isShared?: boolean;
}

export interface ProfileBelongingSpaceCardProps {
  space: BelongingSpace;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// Utilities
// ============================================================================

function getRoleLabel(role: BelongingSpace['role']): string | null {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
    case 'leader':
      return 'Leader';
    case 'member':
    default:
      return null;
  }
}

function isLeaderRole(role: BelongingSpace['role']): boolean {
  return role === 'owner' || role === 'admin' || role === 'leader';
}

// ============================================================================
// Component
// ============================================================================

export function ProfileBelongingSpaceCard({
  space,
  onClick,
  className,
}: ProfileBelongingSpaceCardProps) {
  const leader = isLeaderRole(space.role);
  const roleLabel = getRoleLabel(space.role);

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 p-4 text-left w-full overflow-hidden',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        borderLeft: leader ? '2px solid var(--life-gold)' : '2px solid transparent',
        boxShadow: leader
          ? '0 4px 24px rgba(0,0,0,0.25), 0 1px 8px rgba(255,215,0,0.06)'
          : '0 4px 24px rgba(0,0,0,0.25)',
      }}
      whileHover={{
        y: -2,
        boxShadow: leader
          ? '0 8px 32px rgba(0,0,0,0.3), 0 2px 12px rgba(255,215,0,0.1)'
          : '0 8px 32px rgba(0,0,0,0.3)',
      }}
      whileTap={{ opacity: 0.9 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Glass overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 40%)',
          borderRadius: '16px',
        }}
      />

      {/* Emoji */}
      <span className="relative text-xl flex-shrink-0">
        {space.emoji || '\u{1F3E0}'}
      </span>

      {/* Content */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {space.name}
          </h4>

          {/* Role badge */}
          {roleLabel && (
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{
                backgroundColor: 'rgba(255,215,0,0.1)',
                color: 'var(--life-gold)',
                border: '1px solid rgba(255,215,0,0.2)',
              }}
            >
              {roleLabel}
            </span>
          )}
        </div>

        {/* Member count or shared badge */}
        <div className="flex items-center gap-2 mt-0.5">
          {space.memberCount !== undefined && space.memberCount > 0 && (
            <span
              className="text-[12px]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {space.memberCount.toLocaleString()} member{space.memberCount !== 1 ? 's' : ''}
            </span>
          )}
          {space.isShared && (
            <span
              className="text-[11px] px-1.5 py-px rounded-full font-medium"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: 'var(--text-secondary)',
              }}
            >
              You&apos;re both here
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <span
        className="relative text-sm flex-shrink-0"
        style={{ color: 'var(--text-tertiary)' }}
      >
        &rsaquo;
      </span>
    </motion.button>
  );
}

export default ProfileBelongingSpaceCard;

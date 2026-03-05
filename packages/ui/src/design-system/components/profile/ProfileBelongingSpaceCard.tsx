'use client';

/**
 * ProfileBelongingSpaceCard - Belonging-first space membership card
 *
 * - Gold left border for leader spaces
 * - No glass, no shadows, no translateY hover
 * - 100ms transitions only
 *
 * @version 3.0.0 - Desktop rebuild, design rules compliant
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';

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

function getRoleLabel(role: BelongingSpace['role']): string | null {
  switch (role) {
    case 'owner': return 'Owner';
    case 'admin':
    case 'leader': return 'Leader';
    case 'member':
    default: return null;
  }
}

function isLeaderRole(role: BelongingSpace['role']): boolean {
  return role === 'owner' || role === 'admin' || role === 'leader';
}

export function ProfileBelongingSpaceCard({
  space,
  onClick,
  className,
}: ProfileBelongingSpaceCardProps) {
  const leader = isLeaderRole(space.role);
  const roleLabel = getRoleLabel(space.role);

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 p-4 text-left w-full overflow-hidden',
        'rounded-2xl transition-opacity duration-100 hover:opacity-90',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderLeft: leader ? '2px solid var(--life-gold)' : '2px solid transparent',
        border: leader ? undefined : '1px solid var(--border-default)',
        borderLeftColor: leader ? 'var(--life-gold)' : undefined,
        borderLeftWidth: leader ? '2px' : undefined,
      }}
    >
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

        <div className="flex items-center gap-2 mt-0.5">
          {space.memberCount !== undefined && space.memberCount > 0 && (
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
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
    </button>
  );
}

export default ProfileBelongingSpaceCard;

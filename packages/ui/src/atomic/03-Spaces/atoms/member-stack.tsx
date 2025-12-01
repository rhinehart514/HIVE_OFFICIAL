'use client';

/**
 * MemberStack - Overlapping avatar cluster with count
 *
 * Design Token Compliance:
 * - Avatar sizing: 28px (7 Tailwind units) with 8px overlap
 * - Border: 2px solid background color for separation
 * - Gradient fallback: Gold gradient for missing avatars
 *
 * Usage: Show recent members on space cards with "+N more" indicator
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../../lib/utils';

const stackVariants = cva('flex items-center', {
  variants: {
    size: {
      sm: '', // 24px avatars
      md: '', // 28px avatars
      lg: '', // 32px avatars
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const avatarSizes = {
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-7 h-7 text-[10px]',
  lg: 'w-8 h-8 text-[11px]',
};

const overlapSizes = {
  sm: '-space-x-1.5',
  md: '-space-x-2',
  lg: '-space-x-2.5',
};

export interface MemberStackMember {
  /** Avatar image URL */
  avatarUrl?: string;
  /** Display name (used for fallback initial) */
  name?: string;
}

export interface MemberStackProps extends VariantProps<typeof stackVariants> {
  /** Array of member data */
  members: MemberStackMember[];
  /** Total member count (for "+N more" display) */
  total: number;
  /** Maximum avatars to display */
  maxDisplay?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className */
  className?: string;
}

export function MemberStack({
  members,
  total,
  maxDisplay = 4,
  size = 'md',
  className,
}: MemberStackProps) {
  const displayMembers = members.slice(0, maxDisplay);
  const remaining = total - displayMembers.length;

  return (
    <div className={cn(stackVariants({ size }), className)}>
      <div className={cn('flex', overlapSizes[size])}>
        {displayMembers.map((member, index) => (
          <div
            key={index}
            className={cn(
              'rounded-full border-2 border-neutral-900 flex items-center justify-center overflow-hidden',
              'bg-gradient-to-br from-neutral-700 to-neutral-800',
              avatarSizes[size]
            )}
            style={{ zIndex: displayMembers.length - index }}
          >
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.name || 'Member'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-medium text-neutral-400">
                {member.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
        ))}
      </div>

      {remaining > 0 && (
        <span
          className={cn(
            'ml-2 font-medium text-neutral-500 tabular-nums',
            size === 'sm' && 'text-[10px]',
            size === 'md' && 'text-xs',
            size === 'lg' && 'text-sm'
          )}
        >
          +{remaining.toLocaleString()}
        </span>
      )}
    </div>
  );
}

export default MemberStack;

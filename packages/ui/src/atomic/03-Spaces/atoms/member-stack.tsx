'use client';

/**
 * MemberStack - Overlapping avatar cluster with count
 *
 * Design Token Compliance:
 * - Avatar sizing: 28px (7 Tailwind units) with 8px overlap
 * - Border: 2px solid background color for separation
 * - Gradient fallback: Gold gradient for missing avatars
 * - Presence: Green dots appear on HOVER only (felt, not watched)
 *
 * Usage: Show recent members on space cards with "+N more" indicator
 *
 * @version 2.0.0 - Added presence indicators (hover reveal)
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
  /** Whether member is online (shown on hover) */
  isOnline?: boolean;
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
    <div className={cn(stackVariants({ size }), 'group', className)}>
      <div className={cn('flex', overlapSizes[size])}>
        {displayMembers.map((member, index) => (
          <div
            key={index}
            className="relative"
            style={{ zIndex: displayMembers.length - index }}
          >
            <div
              className={cn(
                'rounded-full border-2 border-[#1A1A1A] flex items-center justify-center overflow-hidden',
                'bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A]',
                avatarSizes[size]
              )}
            >
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name || 'Member'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-medium text-[#A1A1A6]">
                  {member.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            {/* Online indicator - appears on hover only */}
            {member.isOnline && (
              <div
                className={cn(
                  'absolute -bottom-0.5 -right-0.5',
                  'w-2 h-2 rounded-full',
                  'bg-green-500 border border-[#1A1A1A]',
                  'opacity-0 group-hover:opacity-100',
                  'transition-opacity duration-150'
                )}
                aria-label="Online"
              />
            )}
          </div>
        ))}
      </div>

      {remaining > 0 && (
        <span
          className={cn(
            'ml-2 font-medium text-[#71717A] tabular-nums',
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

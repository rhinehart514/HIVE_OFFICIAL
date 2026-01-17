'use client';

/**
 * ProfileInterestsCard - Displays user interests as pills
 *
 * Features:
 * - Flex-wrapped interest pills
 * - Shared interests highlighted with gold border
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';
import { ProfileCard } from './ProfileCard';

export interface ProfileInterestsCardProps {
  interests: string[];
  sharedInterests?: string[];
  className?: string;
}

export function ProfileInterestsCard({
  interests,
  sharedInterests = [],
  className,
}: ProfileInterestsCardProps) {
  const sharedSet = new Set(sharedInterests);

  return (
    <ProfileCard
      icon="✨"
      title="Into"
      className={cn('min-h-[160px]', className)}
    >
      {interests.length === 0 ? (
        <div className="py-4 text-center">
          <p
            className="text-sm mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            What are you into?
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Add interests to connect with like minds
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => {
            const isShared = sharedSet.has(interest);
            return (
              <span
                key={interest}
                className="px-3 py-1.5 rounded-full text-sm transition-all"
                style={{
                  backgroundColor: isShared
                    ? 'var(--life-subtle)'
                    : 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  boxShadow: isShared ? 'inset 0 0 0 1px var(--life-gold)' : undefined,
                }}
              >
                {interest}
              </span>
            );
          })}
        </div>
      )}
    </ProfileCard>
  );
}

export default ProfileInterestsCard;

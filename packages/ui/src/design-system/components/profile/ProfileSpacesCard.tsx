'use client';

/**
 * ProfileSpacesCard - Displays spaces the user belongs to
 *
 * Features:
 * - List of spaces with emoji and name
 * - Leader badge for spaces they lead
 * - Shared space highlighting
 * - "See all" action
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';
import { ProfileCard } from './ProfileCard';

export interface ProfileSpace {
  id: string;
  name: string;
  emoji?: string;
  isLeader?: boolean;
  isShared?: boolean;
}

export interface ProfileSpacesCardProps {
  spaces: ProfileSpace[];
  maxVisible?: number;
  onSpaceClick?: (id: string) => void;
  onViewAll?: () => void;
  className?: string;
}

export function ProfileSpacesCard({
  spaces,
  maxVisible = 4,
  onSpaceClick,
  onViewAll,
  className,
}: ProfileSpacesCardProps) {
  const visibleSpaces = spaces.slice(0, maxVisible);
  const hiddenCount = spaces.length - maxVisible;

  return (
    <ProfileCard
      icon="🏠"
      title="Spaces"
      action={spaces.length > 0 ? { label: 'See all', onClick: onViewAll || (() => {}) } : undefined}
      className={cn('min-h-[200px]', className)}
    >
      <div className="flex flex-col gap-1">
        {visibleSpaces.length === 0 ? (
          <div className="py-6 text-center">
            <p
              className="text-sm mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Find your people
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Join spaces that match your vibe
            </p>
          </div>
        ) : (
          visibleSpaces.map((space) => (
            <button
              key={space.id}
              onClick={() => onSpaceClick?.(space.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left w-full"
              style={{
                backgroundColor: space.isShared
                  ? 'var(--life-subtle)'
                  : 'transparent',
                boxShadow: space.isShared ? 'inset 0 0 0 1px var(--life-glow)' : undefined,
              }}
              onMouseEnter={(e) => {
                if (!space.isShared) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = space.isShared
                  ? 'var(--life-subtle)'
                  : 'transparent';
              }}
            >
              <span className="text-lg flex-shrink-0">
                {space.emoji || '🏠'}
              </span>
              <span
                className="text-sm font-medium truncate flex-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {space.name}
              </span>
              {space.isLeader && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: 'var(--life-subtle)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--life-gold)',
                  }}
                >
                  Leader
                </span>
              )}
            </button>
          ))
        )}
        {hiddenCount > 0 && (
          <button
            onClick={onViewAll}
            className="px-3 py-2 text-sm text-left"
            style={{ color: 'var(--text-tertiary)' }}
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </ProfileCard>
  );
}

export default ProfileSpacesCard;

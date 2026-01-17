'use client';

/**
 * ProfileConnectionsCard - Displays connections with mutual highlighting
 *
 * Features:
 * - Avatar stack of mutual connections
 * - Total connection count
 * - "View all" action
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';
import { ProfileCard } from './ProfileCard';

export interface ProfileConnection {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface ProfileConnectionsCardProps {
  totalConnections: number;
  mutualConnections: ProfileConnection[];
  onViewAll?: () => void;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileConnectionsCard({
  totalConnections,
  mutualConnections,
  onViewAll,
  className,
}: ProfileConnectionsCardProps) {
  const displayedMutuals = mutualConnections.slice(0, 4);
  const nonMutualCount = totalConnections - mutualConnections.length;

  return (
    <ProfileCard
      icon="👥"
      title="Connections"
      action={totalConnections > 0 ? { label: 'See all', onClick: onViewAll || (() => {}) } : undefined}
      className={cn('min-h-[160px]', className)}
    >
      {totalConnections === 0 ? (
        <div className="py-4 text-center">
          <p
            className="text-sm mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            Building your network
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Connect with others to grow
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          {/* Avatar stack */}
          {displayedMutuals.length > 0 && (
            <div className="flex -space-x-2">
              {displayedMutuals.map((conn, i) => (
                <div
                  key={conn.id}
                  className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    boxShadow: '0 0 0 2px var(--bg-surface)',
                    zIndex: displayedMutuals.length - i,
                  }}
                >
                  {conn.avatarUrl ? (
                    <img
                      src={conn.avatarUrl}
                      alt={conn.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-xs font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {getInitials(conn.fullName)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Count text */}
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {mutualConnections.length > 0 && (
              <span style={{ color: 'var(--text-primary)' }}>
                {mutualConnections.length} mutual
              </span>
            )}
            {mutualConnections.length > 0 && nonMutualCount > 0 && (
              <span> · </span>
            )}
            {nonMutualCount > 0 && (
              <span>+{nonMutualCount} more</span>
            )}
          </div>
        </div>
      )}
    </ProfileCard>
  );
}

export default ProfileConnectionsCard;

'use client';

/**
 * SpaceCard - Card for discovered spaces
 *
 * Shows:
 * - Space name and handle
 * - Member count and online count
 * - Recent activity indicator
 * - Join/Preview CTA
 *
 * Uses for stagger-coordinated entrance.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Badge } from '@hive/ui/design-system/primitives';
import { } from '@hive/tokens';
import { CATEGORY_LABELS, SpaceCategoryEnum } from '@hive/core';
import { cn } from '@/lib/utils';

export interface SpaceCardData {
  id: string;
  name: string;
  handle: string;
  description?: string;
  memberCount: number;
  onlineCount: number;
  lastActive?: Date;
  category?: string;
  isMember?: boolean;
}

export interface SpaceCardProps {
  space: SpaceCardData;
}

export function SpaceCard({ space }: SpaceCardProps) {
  const lastActiveText = space.lastActive
    ? getRelativeTime(space.lastActive)
    : null;

  return (
    <motion.div
      whileHover="hover"
      initial="initial"
    >
      <>
        <Link href={`/s/${space.handle}`}>
          <motion.div>
            <div
             
              className={cn(
                'p-5 rounded-lg transition-colors duration-200',
                'border border-white/[0.06] hover:border-white/[0.06]'
              )}
            >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-body font-medium text-white truncate">
                    {space.name}
                  </h3>
                  <p className="text-body-sm text-white/50">@{space.handle}</p>
                </div>

                {/* Online indicator */}
                {space.onlineCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--life-gold)]" />
                    <span className="text-label text-white/50">
                      {space.onlineCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {space.description && (
                <p className="text-body-sm text-white/50 line-clamp-2">
                  {space.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-label text-white/50">
                  <span>{space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}</span>
                  {lastActiveText && (
                    <>
                      <span>·</span>
                      <span>Active {lastActiveText}</span>
                    </>
                  )}
                </div>

                {space.category && (
                  <Badge variant="neutral" size="sm">
                    {CATEGORY_LABELS[space.category as SpaceCategoryEnum] || space.category}
                  </Badge>
                )}
              </div>
            </div>
            </div>
          </motion.div>
        </Link>
      </>
    </motion.div>
  );
}

// ============================================
// HELPERS
// ============================================

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

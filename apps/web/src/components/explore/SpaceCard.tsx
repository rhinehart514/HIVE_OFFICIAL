'use client';

/**
 * SpaceCard - Card for discovered spaces
 *
 * Shows:
 * - Space name and handle
 * - Member count and online count
 * - Recent activity indicator
 * - Join/Preview CTA
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Tilt, GlassSurface, Badge, MOTION } from '@hive/ui/design-system/primitives';
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
  index?: number;
}

export function SpaceCard({ space, index = 0 }: SpaceCardProps) {
  const lastActiveText = space.lastActive
    ? getRelativeTime(space.lastActive)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.fast,
        delay: index * 0.03,
        ease: MOTION.ease.premium,
      }}
    >
      <Tilt intensity={4}>
        <Link href={`/s/${space.handle}`}>
          <GlassSurface
            intensity="subtle"
            className={cn(
              'p-5 rounded-xl transition-all duration-200',
              'border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]'
            )}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-medium text-white truncate">
                    {space.name}
                  </h3>
                  <p className="text-[13px] text-white/40">@{space.handle}</p>
                </div>

                {/* Online indicator */}
                {space.onlineCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--life-gold)] animate-pulse" />
                    <span className="text-[12px] text-white/50">
                      {space.onlineCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {space.description && (
                <p className="text-[13px] text-white/50 line-clamp-2">
                  {space.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-[12px] text-white/30">
                  <span>{space.memberCount} members</span>
                  {lastActiveText && (
                    <>
                      <span>·</span>
                      <span>Active {lastActiveText}</span>
                    </>
                  )}
                </div>

                {space.category && (
                  <Badge variant="neutral" size="sm">
                    {space.category}
                  </Badge>
                )}
              </div>
            </div>
          </GlassSurface>
        </Link>
      </Tilt>
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

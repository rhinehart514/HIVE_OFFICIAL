'use client';

/**
 * GhostSpaceCard - Card for unclaimed (ghost) spaces
 *
 * Pre-seeded organization spaces waiting to be claimed.
 * Shows waitlist count for FOMO.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Tilt,
  GlassSurface,
  Badge,
  Button,
  GradientText,
  MOTION,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export interface GhostSpaceData {
  id: string;
  name: string;
  handle: string;
  category?: string;
  waitlistCount: number;
}

export interface GhostSpaceCardProps {
  space: GhostSpaceData;
  index?: number;
}

export function GhostSpaceCard({ space, index = 0 }: GhostSpaceCardProps) {
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
        <GlassSurface
          intensity="subtle"
          className={cn(
            'p-5 rounded-xl transition-all duration-200',
            'border border-dashed border-white/10 hover:border-[var(--life-gold)]/30',
            'bg-white/[0.01]'
          )}
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-medium text-white/70 truncate">
                    {space.name}
                  </h3>
                  <Badge variant="neutral" size="sm" className="bg-white/[0.04] text-white/40">
                    Unclaimed
                  </Badge>
                </div>
                <p className="text-[13px] text-white/30">@{space.handle}</p>
              </div>
            </div>

            {/* Waitlist count - FOMO */}
            {space.waitlistCount > 0 && (
              <p className="text-[13px] text-white/50">
                <GradientText variant="gold" className="font-medium">
                  {space.waitlistCount} students
                </GradientText>{' '}
                waiting for this space
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              {space.category && (
                <Badge variant="neutral" size="sm">
                  {space.category}
                </Badge>
              )}

              <Link href={`/spaces/claim?handle=${space.handle}`}>
                <Button variant="ghost" size="sm" className="text-[var(--life-gold)]">
                  Claim This Space
                </Button>
              </Link>
            </div>
          </div>
        </GlassSurface>
      </Tilt>
    </motion.div>
  );
}

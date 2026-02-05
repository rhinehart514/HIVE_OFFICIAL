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
} from '@hive/ui/design-system/primitives';
import { revealVariants, cardHoverVariants } from '@hive/tokens';
import { toast } from '@hive/ui';
import { cn } from '@/lib/utils';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

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
  const [isOnWaitlist, setIsOnWaitlist] = React.useState(false);
  const [isJoining, setIsJoining] = React.useState(false);

  const handleJoinWaitlist = async () => {
    setIsJoining(true);
    try {
      const response = await fetch('/api/spaces/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId: space.id }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsOnWaitlist(true);
        toast.success(
          data.alreadyOnWaitlist ? 'Already on waitlist' : 'Joined waitlist',
          "We'll notify you when this space is claimed."
        );
      } else {
        toast.error('Could not join waitlist', data.error || 'Please try again.');
      }
    } catch {
      toast.error('Network error', 'Please check your connection.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <motion.div
      variants={revealVariants}
      whileHover={cardHoverVariants.hover}
      whileTap={{ scale: 0.98 }}
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
                  <h3 className="text-body font-medium text-white/70 truncate">
                    {space.name}
                  </h3>
                  <Badge variant="neutral" size="sm" className="bg-white/[0.04] text-white/40">
                    Unclaimed
                  </Badge>
                </div>
                <p className="text-body-sm text-white/30">@{space.handle}</p>
              </div>
            </div>

            {/* Waitlist count - FOMO */}
            {space.waitlistCount > 0 && (
              <p className="text-body-sm text-white/50">
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

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleJoinWaitlist}
                  disabled={isJoining || isOnWaitlist}
                  className={isOnWaitlist ? 'text-green-400' : 'text-white/50 hover:text-white/70'}
                >
                  {isOnWaitlist ? (
                    <>
                      <CheckIcon className="w-4 h-4 mr-1" />
                      On Waitlist
                    </>
                  ) : (
                    <>
                      <BellIcon className="w-4 h-4 mr-1" />
                      {isJoining ? 'Joining...' : 'Notify Me'}
                    </>
                  )}
                </Button>
                <Link href={`/spaces/claim?handle=${space.handle}`}>
                  <Button variant="ghost" size="sm" className="text-[var(--life-gold)]">
                    Claim This Space
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </GlassSurface>
      </Tilt>
    </motion.div>
  );
}

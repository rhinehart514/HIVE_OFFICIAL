'use client';

/**
 * UnclaimedSpace — State for 650+ CampusLabs-imported spaces
 *
 * NOT an empty chat. Shows:
 * - Name, description, category from CampusLabs
 * - "I'm Interested" demand signal button
 * - "Claim this Space" CTA for leaders
 * - Upcoming events if any
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Users, Heart, ChevronLeft, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';

interface UpcomingEventPreview {
  id: string;
  title: string;
  time: string;
}

interface UnclaimedSpaceProps {
  space: {
    id: string;
    handle: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    memberCount: number;
    orgTypeName?: string;
  };
  upcomingEvents?: UpcomingEventPreview[];
  onInterested: () => void;
  onClaim: () => void;
  isInteresting?: boolean;
  isClaiming?: boolean;
}

export function UnclaimedSpace({
  space,
  upcomingEvents = [],
  onInterested,
  onClaim,
  isInteresting = false,
  isClaiming = false,
}: UnclaimedSpaceProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="h-14 flex items-center px-4 flex-shrink-0">
        <a
          href="/discover"
          className="flex items-center gap-1 text-[13px] text-white/40 hover:text-white/60 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Spaces
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 -mt-14">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-2xl bg-[#080808] border border-white/[0.06] p-6">
            {/* Avatar + Name */}
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar size="lg" className="mb-4">
                {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
                <AvatarFallback className="text-lg">{getInitials(space.name)}</AvatarFallback>
              </Avatar>

              <h2
                className="text-xl font-semibold text-white mb-1"
                style={{ fontFamily: "var(--font-clash, 'Clash Display', sans-serif)" }}
              >
                {space.name}
              </h2>

              <span className="text-[13px] font-sans text-white/40 mb-3">
                @{space.handle}
              </span>

              {/* Category + member count */}
              <div className="flex items-center gap-3 text-[13px] text-white/40">
                {space.orgTypeName && (
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-white/30 text-[11px]">
                    {space.orgTypeName}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>{space.memberCount} interested</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {space.description && (
              <p className="text-[14px] text-white/50 leading-relaxed text-center mb-6 line-clamp-4">
                {space.description}
              </p>
            )}

            {/* Upcoming events */}
            {upcomingEvents.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-6">
                <p className="text-[11px] font-sans uppercase tracking-[0.14em] text-white/30 mb-2">
                  Upcoming
                </p>
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 2).map((event) => (
                    <div key={event.id} className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-white/30 flex-shrink-0" />
                      <span className="text-[13px] text-white/60 truncate">{event.title}</span>
                      <span className="text-[11px] text-white/30 flex-shrink-0">
                        {new Date(event.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-2">
              <Button
                variant="cta"
                size="default"
                onClick={onInterested}
                disabled={isInteresting}
                className={cn(
                  'w-full justify-center',
                  isInteresting && 'bg-[var(--color-gold)]/20 text-[var(--color-gold)]'
                )}
              >
                <Heart className={cn('h-4 w-4 mr-1.5', isInteresting && 'fill-current')} />
                {isInteresting ? "I'm Interested" : "I'm Interested"}
              </Button>

              <Button
                variant="ghost"
                size="default"
                onClick={onClaim}
                disabled={isClaiming}
                loading={isClaiming}
                className="w-full justify-center text-white/40"
              >
                {isClaiming ? 'Claiming...' : 'Claim This Space'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

UnclaimedSpace.displayName = 'UnclaimedSpace';

'use client';

import * as React from 'react';
import Link from 'next/link';
import { Settings, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const displayFont = "font-display";

function getActivityPulse(space: SpaceHeaderProps['space']): string | null {
  const { recentMessageCount, lastActivityAt, newMembers7d, onlineCount } = space;

  // Priority: online now > recent messages > new members > last activity
  if (onlineCount >= 3) return `${onlineCount} people here right now`;
  if (recentMessageCount && recentMessageCount >= 5) return `${recentMessageCount} messages today — things are moving`;
  if (recentMessageCount && recentMessageCount >= 1) return `${recentMessageCount} new since you last checked`;
  if (newMembers7d && newMembers7d >= 3) return `${newMembers7d} new members this week`;
  if (newMembers7d === 1) return `Someone new just joined`;

  if (lastActivityAt) {
    const last = typeof lastActivityAt === 'string' ? new Date(lastActivityAt) : lastActivityAt;
    const hoursAgo = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60));
    if (hoursAgo < 1) return 'Active just now';
    if (hoursAgo < 24) return `Last active ${hoursAgo}h ago`;
  }

  return null;
}

interface SpaceHeaderProps {
  space: {
    id: string;
    handle: string;
    name: string;
    avatarUrl?: string;
    onlineCount: number;
    memberCount: number;
    isVerified?: boolean;
    socialLinks?: Record<string, string | undefined>;
    recentMessageCount?: number;
    lastActivityAt?: string | Date | null;
    newMembers7d?: number;
    isClaimed?: boolean;
  };
  isLeader?: boolean;
  isMember?: boolean;
  onSettingsClick?: () => void;
  onMembersClick?: () => void;
  onSpaceInfoClick?: () => void;
  onBuildToolClick?: () => void;
  onCreateEventClick?: () => void;
  onModerationClick?: () => void;
  onClaimClick?: () => void;
  onCreatePoll?: () => void;
  onCreateRsvp?: () => void;
  onCreateSignup?: () => void;
  onCreateCountdown?: () => void;
  onCreateWithAI?: () => void;
  canModerate?: boolean;
  isMuted?: boolean;
  onMuteChange?: (muteUntil: string | null) => void;
  className?: string;
}

export function SpaceHeader({
  space,
  isMember = true,
  onSettingsClick,
  onMembersClick,
  onSpaceInfoClick,
  onClaimClick,
  className,
}: SpaceHeaderProps) {
  const activityPulse = getActivityPulse(space);

  return (
    <header
      className={cn(
        'flex items-center justify-between',
        className
      )}
    >
      {/* Left: Back + Space name + activity pulse */}
      <div className="flex items-center gap-1 min-w-0">
        <Link
          href="/discover"
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-white/30 hover:text-white/50 hover:bg-white/[0.10] transition-colors flex-shrink-0"
          aria-label="Back to Spaces"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <button
            onClick={onSpaceInfoClick}
            className="flex items-center gap-3 min-w-0 group"
          >
            <h1
              className={`${displayFont} text-[20px] font-semibold text-white truncate`}
            >
              {space.name}
            </h1>
          </button>
          {activityPulse && (
            <p className="text-[11px] font-mono text-white/50 truncate pl-0.5">
              {space.onlineCount >= 3 && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 relative -top-px" />
              )}
              {activityPulse}
            </p>
          )}
        </div>
      </div>

      {/* Right: Member count pill + gear */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Claim CTA for unclaimed spaces */}
        {space.isClaimed === false && onClaimClick && (
          <button
            onClick={onClaimClick}
            className="rounded-full px-4 py-1.5 text-xs font-medium bg-white text-black hover:opacity-90 transition-opacity"
          >
            Claim
          </button>
        )}

        {/* Member count pill */}
        {onMembersClick && (
          <button
            onClick={onMembersClick}
            className="rounded-full px-3 py-1.5 text-[12px] font-mono tabular-nums text-white/50 bg-white/[0.03] hover:bg-white/[0.10] transition-colors"
          >
            {space.memberCount} {space.memberCount === 1 ? 'member' : 'members'}
          </button>
        )}

        {/* Settings gear */}
        {isMember && onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="rounded-full p-2 text-white/50 hover:text-white hover:bg-white/[0.10] transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}

SpaceHeader.displayName = 'SpaceHeader';

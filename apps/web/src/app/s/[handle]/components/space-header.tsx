'use client';

import * as React from 'react';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

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
  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 py-3',
        'border-b border-white/[0.04]',
        className
      )}
    >
      {/* Left: Space name */}
      <button
        onClick={onSpaceInfoClick}
        className="flex items-center gap-3 min-w-0 group"
      >
        <h1
          className={`${clashDisplay} text-[20px] font-semibold text-white truncate`}
        >
          {space.name}
        </h1>
      </button>

      {/* Right: Member count pill + gear */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Claim CTA for unclaimed spaces */}
        {space.isClaimed === false && onClaimClick && (
          <button
            onClick={onClaimClick}
            className="rounded-full px-4 py-1.5 text-xs font-medium bg-[#FFD700] text-black hover:opacity-90 transition-opacity"
          >
            Claim
          </button>
        )}

        {/* Member count pill */}
        {onMembersClick && (
          <button
            onClick={onMembersClick}
            className="rounded-full px-3 py-1.5 text-[12px] font-mono text-white/50 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
          >
            {space.memberCount} members
          </button>
        )}

        {/* Settings gear */}
        {isMember && onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="rounded-full p-2 text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
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

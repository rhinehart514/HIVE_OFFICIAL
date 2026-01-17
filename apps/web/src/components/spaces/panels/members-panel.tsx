/**
 * Members Panel - Member overview for Hub mode
 *
 * Features:
 * - Online count indicator
 * - Leader showcase (top roles)
 * - Recent members
 * - Invite button (leaders)
 * - Link to full members page
 *
 * @version 2.0.0 - Full implementation (Jan 2026)
 */

"use client";

import * as React from 'react';
import { motion } from 'framer-motion';
import { UserPlusIcon, ChevronRightIcon, UsersIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button, SimpleAvatar } from '@hive/ui';

// ============================================================
// Types
// ============================================================

export interface SpaceMember {
  id: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  isOnline?: boolean;
  joinedAt?: string;
}

export interface MembersPanelProps {
  spaceId: string;
  members: SpaceMember[];
  totalCount?: number;
  onlineCount?: number;
  isLoading?: boolean;
  isLeader?: boolean;
  currentUserId?: string;
  onViewProfile?: (memberId: string) => void;
  onInvite?: () => void;
  onViewAll?: () => void;
  className?: string;
}

// ============================================================
// Constants
// ============================================================

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  owner: { label: 'Owner', color: 'text-[var(--life-gold)] bg-[var(--life-gold)]/10' },
  admin: { label: 'Admin', color: 'text-purple-400 bg-purple-500/10' },
  moderator: { label: 'Mod', color: 'text-blue-400 bg-blue-500/10' },
  member: { label: 'Member', color: 'text-white/50 bg-white/5' },
};

// ============================================================
// Sub-Components
// ============================================================

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.member;
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide',
      config.color
    )}>
      {config.label}
    </span>
  );
}

function MemberRow({
  member,
  isCurrentUser,
  onClick
}: {
  member: SpaceMember;
  isCurrentUser?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-lg transition-all',
        'hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Avatar with online indicator */}
      <div className="relative">
        <SimpleAvatar
          src={member.avatarUrl}
          fallback={member.name?.[0] || '?'}
          size="sm"
          className="w-9 h-9"
        />
        {member.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[var(--bg-ground)]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">
            {member.name}
            {isCurrentUser && <span className="text-white/40 ml-1">(you)</span>}
          </span>
        </div>
        {member.handle && (
          <span className="text-xs text-white/40">@{member.handle}</span>
        )}
      </div>

      {/* Role badge */}
      {member.role !== 'member' && (
        <RoleBadge role={member.role} />
      )}
    </button>
  );
}

function OnlineIndicator({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white/70">{count} online</span>
      </div>
    </div>
  );
}

function EmptyState({ isLeader, onInvite }: { isLeader?: boolean; onInvite?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-14 h-14 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
        <UsersIcon className="w-7 h-7 text-white/40" />
      </div>
      <h3 className="text-base font-medium text-white mb-1">No members yet</h3>
      <p className="text-sm text-white/50 text-center max-w-[200px] mb-4">
        {isLeader
          ? 'Invite people to build your community'
          : 'Be the first to join this space'
        }
      </p>
      {isLeader && onInvite && (
        <Button onClick={onInvite} size="sm" className="gap-1.5">
          <UserPlusIcon className="w-4 h-4" />
          Invite Members
        </Button>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function MembersPanel({
  spaceId,
  members,
  totalCount,
  onlineCount = 0,
  isLoading,
  isLeader,
  currentUserId,
  onViewProfile,
  onInvite,
  onViewAll,
  className,
}: MembersPanelProps) {
  // Separate leaders from regular members
  const leaders = members.filter(m => ['owner', 'admin', 'moderator'].includes(m.role));
  const regularMembers = members.filter(m => m.role === 'member');

  // Show leaders first, then a few regular members
  const displayMembers = [...leaders, ...regularMembers.slice(0, Math.max(0, 6 - leaders.length))];
  const displayCount = totalCount ?? members.length;

  return (
    <div className={cn('flex flex-col h-full bg-[var(--bg-ground)]', className)}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">Members</h2>
            {displayCount > 0 && (
              <span className="text-sm text-white/40">
                {displayCount.toLocaleString()}
              </span>
            )}
          </div>
          {onlineCount > 0 && <OnlineIndicator count={onlineCount} />}
        </div>

        {/* Invite button for leaders */}
        {isLeader && onInvite && (
          <Button
            onClick={onInvite}
            size="sm"
            variant="outline"
            className="w-full gap-1.5 mb-3"
          >
            <UserPlusIcon className="w-4 h-4" />
            Invite Members
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-white/[0.02] animate-pulse"
              />
            ))}
          </div>
        ) : displayMembers.length === 0 ? (
          <EmptyState isLeader={isLeader} onInvite={onInvite} />
        ) : (
          <div className="space-y-1">
            {/* Leaders Section */}
            {leaders.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 px-2">
                  Leadership
                </h3>
                {leaders.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MemberRow
                      member={member}
                      isCurrentUser={member.id === currentUserId}
                      onClick={onViewProfile ? () => onViewProfile(member.id) : undefined}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Regular Members Section */}
            {regularMembers.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2 px-2">
                  Members
                </h3>
                {regularMembers.slice(0, 6 - leaders.length).map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MemberRow
                      member={member}
                      isCurrentUser={member.id === currentUserId}
                      onClick={onViewProfile ? () => onViewProfile(member.id) : undefined}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* View All Footer */}
      {displayCount > displayMembers.length && onViewAll && (
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <button
            onClick={onViewAll}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            View all {displayCount.toLocaleString()} members
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default MembersPanel;

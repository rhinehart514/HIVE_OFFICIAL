'use client';

/**
 * MembersList - Space members directory
 * CREATED: Jan 21, 2026
 *
 * Displays all space members with search, filtering, and role badges.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, Crown, Shield, Users as UsersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { MOTION } from '@hive/tokens';

export interface Member {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  // Roles: owner > admin > moderator > member
  // Note: Legacy data may have 'leader' which is treated as 'admin' for display
  role?: 'owner' | 'admin' | 'moderator' | 'member';
  isOnline?: boolean;
  /** Timestamp of last heartbeat for activity status */
  lastSeen?: Date | string | null;
  joinedAt?: string;
}

/**
 * Format a timestamp into a relative activity label.
 * Returns null if the timestamp is missing or very old (>30d).
 */
function formatActivityTime(lastSeen: Date | string | null | undefined): string | null {
  if (!lastSeen) return null;

  const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) return null;

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return 'Active just now';
  if (minutes < 60) return `Active ${minutes}m ago`;
  if (hours < 24) return `Active ${hours}h ago`;
  if (days <= 30) return `Last seen ${days}d ago`;

  return null;
}

interface MembersListProps {
  members: Member[];
  isLoading?: boolean;
  currentUserId?: string;
  onMemberClick?: (memberId: string) => void;
  className?: string;
}

export function MembersList({
  members,
  isLoading,
  currentUserId,
  onMemberClick,
  className,
}: MembersListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter members by search query
  const filteredMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return members;

    const query = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.handle.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  // Group by role - Leaders section includes owners and admins
  // Note: 'leader' check kept for backwards compatibility with legacy data
  const groupedMembers = React.useMemo(() => {
    const leaders = filteredMembers.filter(
      (m) => m.role === 'owner' || m.role === 'admin' || (m.role as string) === 'leader'
    );
    const moderators = filteredMembers.filter((m) => m.role === 'moderator');
    const regularMembers = filteredMembers.filter((m) => !m.role || m.role === 'member');

    return { leaders, moderators, regularMembers };
  }, [filteredMembers]);

  if (isLoading) {
    return <MembersListSkeleton />;
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search */}
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className={cn(
              'w-full pl-10 pr-4 py-2',
              'rounded-lg text-sm',
              'bg-white/[0.04] border border-white/[0.06]',
              'text-white placeholder:text-white/30',
              'focus:outline-none focus:ring-2 focus:ring-white/20',
              'transition-all duration-150'
            )}
          />
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filteredMembers.length === 0 ? (
          <div className="py-12 text-center">
            <UsersIcon className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <Text tone="muted">
              {searchQuery ? 'No members found' : 'No members yet'}
            </Text>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Leaders */}
            {groupedMembers.leaders.length > 0 && (
              <MemberSection
                title="Leaders"
                members={groupedMembers.leaders}
                currentUserId={currentUserId}
                onMemberClick={onMemberClick}
              />
            )}

            {/* Moderators */}
            {groupedMembers.moderators.length > 0 && (
              <MemberSection
                title="Moderators"
                members={groupedMembers.moderators}
                currentUserId={currentUserId}
                onMemberClick={onMemberClick}
              />
            )}

            {/* Members */}
            {groupedMembers.regularMembers.length > 0 && (
              <MemberSection
                title={`Members — ${groupedMembers.regularMembers.length}`}
                members={groupedMembers.regularMembers}
                currentUserId={currentUserId}
                onMemberClick={onMemberClick}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface MemberSectionProps {
  title: string;
  members: Member[];
  currentUserId?: string;
  onMemberClick?: (memberId: string) => void;
}

function MemberSection({
  title,
  members,
  currentUserId,
  onMemberClick,
}: MemberSectionProps) {
  return (
    <div>
      <Text
        size="xs"
        weight="medium"
        className="uppercase tracking-wider text-white/40 mb-3"
      >
        {title}
      </Text>
      <div className="space-y-1">
        {members.map((member, index) => (
          <MemberRow
            key={member.id}
            member={member}
            isCurrentUser={member.id === currentUserId}
            onClick={() => onMemberClick?.(member.id)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

interface MemberRowProps {
  member: Member;
  isCurrentUser: boolean;
  onClick?: () => void;
  index: number;
}

function MemberRow({ member, isCurrentUser, onClick, index }: MemberRowProps) {
  const getRoleBadge = () => {
    if (member.role === 'owner') {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-gold)]/10">
          <Crown className="w-3 h-3 text-[var(--color-gold)]" />
          <span className="text-[10px] font-medium text-[var(--color-gold)]">Owner</span>
        </span>
      );
    }
    // Admin role (also handles legacy 'leader' data)
    if (member.role === 'admin' || (member.role as string) === 'leader') {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-gold)]/10">
          <Crown className="w-3 h-3 text-[var(--color-gold)]/70" />
          <span className="text-[10px] font-medium text-[var(--color-gold)]/70">Admin</span>
        </span>
      );
    }
    if (member.role === 'moderator') {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10">
          <Shield className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-medium text-blue-400">Mod</span>
        </span>
      );
    }
    return null;
  };

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.2,
        delay: Math.min(index * 0.02, 0.3),
        ease: MOTION.ease.premium,
      }}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg',
        'hover:bg-white/[0.04] transition-colors',
        'text-left',
        isCurrentUser && 'bg-white/[0.02]'
      )}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        <Avatar size="default">
          {member.avatarUrl && <AvatarImage src={member.avatarUrl} />}
          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
        </Avatar>
        {/* Online indicator - green for online, grey for offline */}
        {member.isOnline ? (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0A0A09]" />
        ) : (() => {
          // Show amber dot for recently active (< 1h), grey otherwise
          const lastSeenDate = member.lastSeen
            ? typeof member.lastSeen === 'string' ? new Date(member.lastSeen) : member.lastSeen
            : null;
          const recentlyActive = lastSeenDate && (Date.now() - lastSeenDate.getTime()) < 3600000;
          return (
            <span
              className={cn(
                'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A09]',
                recentlyActive ? 'bg-amber-400/60' : 'bg-white/10'
              )}
            />
          );
        })()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Text size="sm" weight="medium" className="truncate">
            {member.name}
            {isCurrentUser && <span className="text-white/40 ml-1">(you)</span>}
          </Text>
          {getRoleBadge()}
        </div>
        <Text size="xs" tone="muted" className="font-mono truncate">
          @{member.handle}
        </Text>
      </div>

      {/* Activity status text */}
      <div className="flex-shrink-0">
        {member.isOnline ? (
          <Text size="xs" className="text-emerald-400/70">
            Online
          </Text>
        ) : (
          (() => {
            const activityLabel = formatActivityTime(member.lastSeen);
            if (!activityLabel) return null;
            return (
              <Text size="xs" className="text-white/30">
                {activityLabel}
              </Text>
            );
          })()
        )}
      </div>
    </motion.button>
  );
}

function MembersListSkeleton() {
  return (
    <div className="px-6 py-4 space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

MembersList.displayName = 'MembersList';

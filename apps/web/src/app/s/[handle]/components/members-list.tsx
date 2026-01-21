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
  role?: 'leader' | 'moderator' | 'member';
  isOnline?: boolean;
  joinedAt?: string;
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

  // Group by role
  const groupedMembers = React.useMemo(() => {
    const leaders = filteredMembers.filter((m) => m.role === 'leader');
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
  const getRoleIcon = () => {
    if (member.role === 'leader') return <Crown className="w-3.5 h-3.5 text-[var(--color-gold)]" />;
    if (member.role === 'moderator') return <Shield className="w-3.5 h-3.5 text-blue-400" />;
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
        {member.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[var(--color-gold)] rounded-full border-2 border-[#0A0A09]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text size="sm" weight="medium" className="truncate">
            {member.name}
            {isCurrentUser && <span className="text-white/40 ml-1">(you)</span>}
          </Text>
          {getRoleIcon()}
        </div>
        <Text size="xs" tone="muted" className="font-mono truncate">
          @{member.handle}
        </Text>
      </div>

      {/* Online status text */}
      {member.isOnline && (
        <Text size="xs" className="text-[var(--color-gold)]/70 flex-shrink-0">
          Online
        </Text>
      )}
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

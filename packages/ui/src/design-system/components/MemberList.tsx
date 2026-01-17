'use client';

/**
 * MemberList Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Displays a list of space members with roles and presence.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * FULL LIST VIEW:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Members (24)                                              [Search]    │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │  LEADERS (2)                                                            │
 * │  ──────────────────────────────────────────────────────────────────────│
 * │  ┌────┐                                                                │
 * │  │🟢AV│  Jane Doe                               👑 Leader   [···]      │
 * │  └────┘  @jane                                                         │
 * │                                                                         │
 * │  ┌────┐                                                                │
 * │  │🟡AV│  John Smith                             👑 Leader   [···]      │
 * │  └────┘  @johnsmith                                                    │
 * │                                                                         │
 * │  MEMBERS (22)                                                           │
 * │  ──────────────────────────────────────────────────────────────────────│
 * │  ┌────┐                                                                │
 * │  │🟢AV│  Alex Chen                                          [···]      │
 * │  └────┘  @alexc                                                        │
 * │                                                                         │
 * │  ┌────┐                                                                │
 * │  │⚪AV│  Sarah Wilson                                       [···]      │
 * │  └────┘  @sarahw                                                       │
 * │                                                                         │
 * │  [Load more...]                                                        │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * MEMBER ROW:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌────┐                                                                │
 * │  │🟢AV│  Jane Doe                               👑 Leader   [···]      │
 * │  └────┘  @jane                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *      │           │                                     │         │
 *      │           │                                     │         └── Context menu
 *      │           │                                     └── Role badge (if leader/mod)
 *      │           └── Name + handle
 *      └── Avatar with presence dot
 *
 * PRESENCE DOTS:
 * - 🟢 Online: Gold (#FFD700)
 * - 🟡 Away: Gold at 50% opacity
 * - ⚪ Offline: Muted gray
 * - 🔴 DND: Red
 *
 * ROLE BADGES:
 * - 👑 Leader: Gold badge
 * - 🛡️ Moderator: Gray badge
 * - ✨ VIP: Purple badge (if applicable)
 *
 * COMPACT VIEW (Sidebar):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Members (24)                                                          │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  🟢 Jane Doe         👑                                                │
 * │  🟡 John Smith       👑                                                │
 * │  🟢 Alex Chen                                                          │
 * │  ⚪ Sarah Wilson                                                       │
 * │  ...                                                                   │
 * │  +18 more                                                              │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * AVATAR STACK VIEW (Mini):
 * ┌──────────────────────────────────────────────────────────────┐
 * │  [AV][AV][AV][AV]+20                                         │
 * └──────────────────────────────────────────────────────────────┘
 * - Overlapping avatars
 * - +N for overflow
 *
 * STATES:
 * - Loading: Skeleton rows
 * - Empty: "No members yet" message
 * - Error: Error message with retry
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';
import { SimpleAvatar, getInitials } from '../primitives/Avatar';

type MemberRole = 'leader' | 'moderator' | 'member';
type PresenceStatus = 'online' | 'away' | 'offline' | 'dnd';

export interface Member {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  role: MemberRole;
  presence: PresenceStatus;
  joinedAt?: Date | string;
}

const memberListVariants = cva('', {
  variants: {
    variant: {
      full: '',
      compact: '',
      stack: 'flex items-center',
    },
  },
  defaultVariants: {
    variant: 'full',
  },
});

export interface MemberListProps extends VariantProps<typeof memberListVariants> {
  /** Members to display */
  members: Member[];
  /** Total member count (for pagination) */
  totalCount?: number;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Show search input */
  showSearch?: boolean;
  /** Search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Load more handler */
  onLoadMore?: () => void;
  /** Has more to load */
  hasMore?: boolean;
  /** Member click handler */
  onMemberClick?: (member: Member) => void;
  /** Member action handler */
  onMemberAction?: (member: Member, action: string) => void;
  /** Max visible in stack mode */
  maxVisible?: number;
  /** Group by role */
  groupByRole?: boolean;
  /** Additional className */
  className?: string;
}

// Role display config
const roleConfig: Record<MemberRole, { icon: string; label: string; color: string }> = {
  leader: { icon: '👑', label: 'Leader', color: 'var(--life-gold)' },
  moderator: { icon: '🛡️', label: 'Mod', color: '#888888' },
  member: { icon: '', label: 'Member', color: 'transparent' },
};

// Presence colors
const presenceColors: Record<PresenceStatus, string> = {
  online: 'var(--life-gold)',
  away: 'var(--life-gold-50)',
  offline: 'var(--color-text-muted)',
  dnd: '#FF6B6B',
};

/**
 * MemberList - Member listing component
 */
const MemberList: React.FC<MemberListProps> = ({
  variant = 'full',
  members,
  totalCount,
  loading = false,
  error,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  onLoadMore,
  hasMore = false,
  onMemberClick,
  onMemberAction,
  maxVisible = 4,
  groupByRole = true,
  className,
}) => {
  // Stack variant
  if (variant === 'stack') {
    const visibleMembers = members.slice(0, maxVisible);
    const overflow = members.length - maxVisible;

    return (
      <div className={cn(memberListVariants({ variant }), className)}>
        <div className="flex -space-x-2">
          {visibleMembers.map((member) => (
            <SimpleAvatar
              key={member.id}
              src={member.avatar}
              fallback={getInitials(member.name)}
              size="sm"
              className="ring-2 ring-[var(--color-bg-page)]"
            />
          ))}
        </div>
        {overflow > 0 && (
          <Text size="sm" tone="muted" className="ml-2">
            +{overflow}
          </Text>
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    const visibleMembers = members.slice(0, 5);
    const overflow = members.length - 5;

    return (
      <div className={cn('space-y-1', className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1">
          <Text size="xs" weight="medium" tone="muted">
            Members ({totalCount || members.length})
          </Text>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 animate-pulse">
                <div className="w-5 h-5 rounded-lg bg-[var(--color-bg-elevated)]" />
                <div className="h-3 flex-1 bg-[var(--color-bg-elevated)] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {visibleMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => onMemberClick?.(member)}
                className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="relative">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: presenceColors[member.presence] }}
                  />
                </div>
                <Text size="xs" className="flex-1 text-left truncate">
                  {member.name}
                </Text>
                {member.role !== 'member' && (
                  <span className="text-xs">{roleConfig[member.role].icon}</span>
                )}
              </button>
            ))}
            {overflow > 0 && (
              <button
                onClick={onLoadMore}
                className="w-full px-2 py-1 text-left"
              >
                <Text size="xs" tone="muted">+{overflow} more</Text>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full variant
  // Group members by role if enabled
  const groupedMembers = groupByRole
    ? {
        leaders: members.filter((m) => m.role === 'leader'),
        moderators: members.filter((m) => m.role === 'moderator'),
        members: members.filter((m) => m.role === 'member'),
      }
    : { all: members };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with search */}
      <div className="flex items-center justify-between">
        <Text size="default" weight="semibold">
          Members ({totalCount || members.length})
        </Text>
        {showSearch && (
          <div className="flex items-center gap-2 h-8 px-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[var(--color-text-muted)]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search..."
              className="w-24 bg-transparent border-none outline-none text-xs"
            />
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <Text size="sm" className="text-red-500">{error}</Text>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <MemberRowSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && members.length === 0 && (
        <div className="p-8 text-center">
          <Text size="sm" tone="muted">No members found</Text>
        </div>
      )}

      {/* Member list */}
      {!loading && members.length > 0 && (
        <>
          {groupByRole ? (
            <>
              {groupedMembers.leaders && groupedMembers.leaders.length > 0 && (
                <MemberGroup
                  title="Leaders"
                  count={groupedMembers.leaders.length}
                  members={groupedMembers.leaders}
                  onMemberClick={onMemberClick}
                  onMemberAction={onMemberAction}
                />
              )}
              {groupedMembers.moderators && groupedMembers.moderators.length > 0 && (
                <MemberGroup
                  title="Moderators"
                  count={groupedMembers.moderators.length}
                  members={groupedMembers.moderators}
                  onMemberClick={onMemberClick}
                  onMemberAction={onMemberAction}
                />
              )}
              {groupedMembers.members && groupedMembers.members.length > 0 && (
                <MemberGroup
                  title="Members"
                  count={groupedMembers.members.length}
                  members={groupedMembers.members}
                  onMemberClick={onMemberClick}
                  onMemberAction={onMemberAction}
                />
              )}
            </>
          ) : (
            <div className="space-y-1">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onClick={() => onMemberClick?.(member)}
                  onAction={(action) => onMemberAction?.(member, action)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-2 text-center hover:bg-white/5 rounded-lg transition-colors"
        >
          <Text size="sm" tone="muted">Load more...</Text>
        </button>
      )}
    </div>
  );
};

MemberList.displayName = 'MemberList';

/**
 * MemberGroup - Group of members with heading
 */
interface MemberGroupProps {
  title: string;
  count: number;
  members: Member[];
  onMemberClick?: (member: Member) => void;
  onMemberAction?: (member: Member, action: string) => void;
}

const MemberGroup: React.FC<MemberGroupProps> = ({
  title,
  count,
  members,
  onMemberClick,
  onMemberAction,
}) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <Text size="xs" weight="medium" tone="muted">
        {title.toUpperCase()} ({count})
      </Text>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
    <div className="space-y-1">
      {members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          onClick={() => onMemberClick?.(member)}
          onAction={(action) => onMemberAction?.(member, action)}
        />
      ))}
    </div>
  </div>
);

/**
 * MemberRow - Single member row
 */
interface MemberRowProps {
  member: Member;
  onClick?: () => void;
  onAction?: (action: string) => void;
}

const MemberRow: React.FC<MemberRowProps> = ({ member, onClick, onAction }) => (
  <div
    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
    onClick={onClick}
  >
    {/* Avatar with presence */}
    <div className="relative">
      <SimpleAvatar src={member.avatar} fallback={getInitials(member.name)} size="default" />
      <div
        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--color-bg-page)]"
        style={{ backgroundColor: presenceColors[member.presence] }}
      />
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <Text size="sm" weight="medium" className="truncate">
        {member.name}
      </Text>
      <Text size="xs" tone="muted">
        @{member.handle}
      </Text>
    </div>

    {/* Role badge */}
    {member.role !== 'member' && (
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
        style={{
          backgroundColor: `${roleConfig[member.role].color}20`,
          color: roleConfig[member.role].color,
        }}
      >
        <span>{roleConfig[member.role].icon}</span>
        <span>{roleConfig[member.role].label}</span>
      </div>
    )}

    {/* Actions */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onAction?.('menu');
      }}
      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[var(--color-text-muted)]">
        <circle cx="12" cy="6" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="18" r="1.5" />
      </svg>
    </button>
  </div>
);

/**
 * MemberRowSkeleton - Loading state
 */
const MemberRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-2 animate-pulse">
    <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-elevated)]" />
    <div className="flex-1">
      <div className="h-4 w-24 bg-[var(--color-bg-elevated)] rounded mb-1" />
      <div className="h-3 w-16 bg-[var(--color-bg-elevated)] rounded" />
    </div>
  </div>
);

export { MemberList, MemberRow, MemberRowSkeleton };

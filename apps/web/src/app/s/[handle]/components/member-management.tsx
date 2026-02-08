'use client';

/**
 * MemberManagement - Role management for space settings
 * CREATED: Jan 26, 2026
 *
 * Full member management UI for the Settings > Members tab.
 * Features:
 * - Member list grouped by role
 * - Search/filter
 * - Hover action buttons (Promote, Demote)
 * - More menu (View profile, Suspend, Remove)
 * - Confirmation dialogs for destructive actions
 * - Pagination
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  User,
  Ban,
  UserX,
  Crown,
  Shield,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Text,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  ConfirmDialog,
  toast,
} from '@hive/ui';
import { MOTION } from '@hive/tokens';

// ============================================================
// Types
// ============================================================

type MemberRole = 'owner' | 'admin' | 'moderator' | 'member';

interface SpaceMember {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role: MemberRole;
  status: 'online' | 'offline';
  joinedAt: string;
  isOnline?: boolean;
}

interface MemberManagementProps {
  spaceId: string;
  currentUserId: string;
  currentUserRole: MemberRole;
  className?: string;
}

// ============================================================
// Constants
// ============================================================

const ROLE_HIERARCHY: Record<MemberRole, number> = {
  owner: 4,
  admin: 3,
  moderator: 2,
  member: 1,
};

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Leader',
  moderator: 'Moderator',
  member: 'Member',
};

const PAGE_SIZE = 20;

// ============================================================
// Hook: useMemberManagement
// ============================================================

function useMemberManagement(spaceId: string) {
  const [members, setMembers] = React.useState<SpaceMember[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [offset, setOffset] = React.useState(0);

  const fetchMembers = React.useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/members?limit=${PAGE_SIZE}&offset=${currentOffset}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data = await response.json();
      const fetchedMembers: SpaceMember[] = data.data?.members || data.members || [];
      const total = data.data?.total || data.total || fetchedMembers.length;

      if (reset) {
        setMembers(fetchedMembers);
        setOffset(PAGE_SIZE);
      } else {
        setMembers((prev) => [...prev, ...fetchedMembers]);
        setOffset((prev) => prev + PAGE_SIZE);
      }

      setTotalCount(total);
      setHasMore(currentOffset + fetchedMembers.length < total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, offset]);

  React.useEffect(() => {
    fetchMembers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId]);

  const updateMemberRole = async (memberId: string, newRole: MemberRole) => {
    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );

    try {
      const response = await fetch(`/api/spaces/${spaceId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      return true;
    } catch {
      // Rollback
      fetchMembers(true);
      return false;
    }
  };

  const suspendMember = async (memberId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberId, action: 'suspend', reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to suspend member');
      }

      fetchMembers(true);
      return true;
    } catch {
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    // Optimistic update
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    setTotalCount((prev) => prev - 1);

    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/members?userId=${memberId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      return true;
    } catch {
      // Rollback
      fetchMembers(true);
      return false;
    }
  };

  return {
    members,
    isLoading,
    error,
    totalCount,
    hasMore,
    fetchMore: () => fetchMembers(false),
    refresh: () => fetchMembers(true),
    updateMemberRole,
    suspendMember,
    removeMember,
  };
}

// ============================================================
// Sub-Components
// ============================================================

interface MemberRowProps {
  member: SpaceMember;
  isCurrentUser: boolean;
  canPromote: boolean;
  canDemote: boolean;
  canSuspend: boolean;
  canRemove: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onSuspend: () => void;
  onRemove: () => void;
  onViewProfile: () => void;
}

function MemberRow({
  member,
  isCurrentUser,
  canPromote,
  canDemote,
  canSuspend,
  canRemove,
  onPromote,
  onDemote,
  onSuspend,
  onRemove,
  onViewProfile,
}: MemberRowProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleIcon = () => {
    if (member.role === 'owner' || member.role === 'admin') {
      return <Crown className="w-3.5 h-3.5 text-[var(--color-gold)]" />;
    }
    if (member.role === 'moderator') {
      return <Shield className="w-3.5 h-3.5 text-blue-400" />;
    }
    return null;
  };

  const formatJoinDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const hasActions = canPromote || canDemote || canSuspend || canRemove;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'hover:bg-white/[0.03] transition-colors',
        isCurrentUser && 'bg-white/[0.02]'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar size="default">
          {member.avatar && <AvatarImage src={member.avatar} />}
          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
        </Avatar>
        {member.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[var(--bg-ground)]" />
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
          @{member.username}
        </Text>
      </div>

      {/* Join Date (desktop) */}
      <Text size="xs" tone="muted" className="hidden md:block flex-shrink-0">
        {isCurrentUser && member.role === 'owner' ? 'Founder' : `Joined ${formatJoinDate(member.joinedAt)}`}
      </Text>

      {/* Actions */}
      {hasActions && !isCurrentUser && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity">
          {/* Mobile: always show menu button */}
          <div className="md:hidden">
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              <AnimatePresence>
                {showMenu && (
                  <MemberMenu
                    canPromote={canPromote}
                    canDemote={canDemote}
                    canSuspend={canSuspend}
                    canRemove={canRemove}
                    onPromote={() => { onPromote(); setShowMenu(false); }}
                    onDemote={() => { onDemote(); setShowMenu(false); }}
                    onSuspend={() => { onSuspend(); setShowMenu(false); }}
                    onRemove={() => { onRemove(); setShowMenu(false); }}
                    onViewProfile={() => { onViewProfile(); setShowMenu(false); }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop: inline actions + menu */}
          <div className="hidden md:flex items-center gap-1">
            {canPromote && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPromote}
                className="h-7 px-2 text-xs text-white/60 hover:text-white"
                title="Promote"
              >
                <ChevronUp className="w-3.5 h-3.5 mr-1" />
                Promote
              </Button>
            )}
            {canDemote && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDemote}
                className="h-7 px-2 text-xs text-white/60 hover:text-white"
                title="Demote"
              >
                <ChevronDown className="w-3.5 h-3.5 mr-1" />
                Demote
              </Button>
            )}
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
                className="h-7 w-7 p-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              <AnimatePresence>
                {showMenu && (
                  <MemberMenu
                    canPromote={false}
                    canDemote={false}
                    canSuspend={canSuspend}
                    canRemove={canRemove}
                    onPromote={() => {}}
                    onDemote={() => {}}
                    onSuspend={() => { onSuspend(); setShowMenu(false); }}
                    onRemove={() => { onRemove(); setShowMenu(false); }}
                    onViewProfile={() => { onViewProfile(); setShowMenu(false); }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MemberMenuProps {
  canPromote: boolean;
  canDemote: boolean;
  canSuspend: boolean;
  canRemove: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onSuspend: () => void;
  onRemove: () => void;
  onViewProfile: () => void;
}

function MemberMenu({
  canPromote,
  canDemote,
  canSuspend,
  canRemove,
  onPromote,
  onDemote,
  onSuspend,
  onRemove,
  onViewProfile,
}: MemberMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'absolute right-0 top-full mt-1 z-50',
        'min-w-[160px] py-1',
        'bg-[var(--bg-elevated)] border border-white/[0.08] rounded-xl shadow-xl'
      )}
    >
      <button
        onClick={onViewProfile}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/[0.04]"
      >
        <User className="w-4 h-4" />
        View profile
      </button>

      {(canPromote || canDemote) && (
        <>
          <div className="h-px bg-white/[0.06] my-1" />
          {canPromote && (
            <button
              onClick={onPromote}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/[0.04]"
            >
              <ChevronUp className="w-4 h-4" />
              Promote
            </button>
          )}
          {canDemote && (
            <button
              onClick={onDemote}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/[0.04]"
            >
              <ChevronDown className="w-4 h-4" />
              Demote
            </button>
          )}
        </>
      )}

      {(canSuspend || canRemove) && (
        <>
          <div className="h-px bg-white/[0.06] my-1" />
          {canSuspend && (
            <button
              onClick={onSuspend}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-400/70 hover:text-orange-400 hover:bg-orange-500/[0.04]"
            >
              <Ban className="w-4 h-4" />
              Suspend
            </button>
          )}
          {canRemove && (
            <button
              onClick={onRemove}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.04]"
            >
              <UserX className="w-4 h-4" />
              Remove
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}

function MemberSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <Text
        size="xs"
        weight="medium"
        className="uppercase tracking-wider text-white/40 mb-2 px-3"
      >
        {title} ({count})
      </Text>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function MemberManagement({
  spaceId,
  currentUserId,
  currentUserRole,
  className,
}: MemberManagementProps) {
  const {
    members,
    isLoading,
    error,
    totalCount,
    hasMore,
    fetchMore,
    updateMemberRole,
    suspendMember,
    removeMember,
  } = useMemberManagement(spaceId);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    variant: 'danger' | 'warning';
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    variant: 'danger',
    title: '',
    description: '',
    confirmText: '',
    onConfirm: async () => {},
  });
  const [isConfirming, setIsConfirming] = React.useState(false);

  // Filter and group members
  const filteredMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.username.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const groupedMembers = React.useMemo(() => {
    const leaders = filteredMembers.filter(
      (m) => m.role === 'owner' || m.role === 'admin'
    );
    const moderators = filteredMembers.filter((m) => m.role === 'moderator');
    const regularMembers = filteredMembers.filter((m) => m.role === 'member');
    return { leaders, moderators, members: regularMembers };
  }, [filteredMembers]);

  // Permission checks
  const currentUserLevel = ROLE_HIERARCHY[currentUserRole];

  const canManageMember = (member: SpaceMember) => {
    if (member.id === currentUserId) return false;
    if (member.role === 'owner') return false;
    return currentUserLevel > ROLE_HIERARCHY[member.role];
  };

  const canPromote = (member: SpaceMember) => {
    if (!canManageMember(member)) return false;
    if (member.role === 'admin') return false; // Can't promote to owner
    return true;
  };

  const canDemote = (member: SpaceMember) => {
    if (!canManageMember(member)) return false;
    if (member.role === 'member') return false; // Already at lowest
    return true;
  };

  // Actions
  const handlePromote = async (member: SpaceMember) => {
    const nextRole: MemberRole =
      member.role === 'member' ? 'moderator' : member.role === 'moderator' ? 'admin' : member.role;

    const success = await updateMemberRole(member.id, nextRole);
    if (success) {
      toast.success(
        'Member promoted',
        `${member.name} is now a ${ROLE_LABELS[nextRole]}`
      );
    } else {
      toast.error('Failed to promote', 'Please try again');
    }
  };

  const handleDemote = async (member: SpaceMember) => {
    const nextRole: MemberRole =
      member.role === 'admin' ? 'moderator' : member.role === 'moderator' ? 'member' : member.role;

    const success = await updateMemberRole(member.id, nextRole);
    if (success) {
      toast.success(
        'Member demoted',
        `${member.name} is now a ${ROLE_LABELS[nextRole]}`
      );
    } else {
      toast.error('Failed to demote', 'Please try again');
    }
  };

  const handleSuspend = (member: SpaceMember) => {
    setConfirmDialog({
      open: true,
      variant: 'warning',
      title: `Suspend ${member.name}?`,
      description:
        'They will be temporarily unable to post or participate in this space. You can unsuspend them later.',
      confirmText: 'Suspend member',
      onConfirm: async () => {
        const success = await suspendMember(member.id);
        if (success) {
          toast.success('Member suspended', `${member.name} has been suspended`);
        } else {
          toast.error('Failed to suspend', 'Please try again');
        }
      },
    });
  };

  const handleRemove = (member: SpaceMember) => {
    setConfirmDialog({
      open: true,
      variant: 'danger',
      title: `Remove ${member.name}?`,
      description:
        'They will lose access to this space and its content. They can rejoin if the space is public or with a new invite.',
      confirmText: 'Remove member',
      onConfirm: async () => {
        const success = await removeMember(member.id);
        if (success) {
          toast.success('Member removed', `${member.name} has been removed`);
        } else {
          toast.error('Failed to remove', 'Please try again');
        }
      },
    });
  };

  const handleViewProfile = (member: SpaceMember) => {
    // Navigate to profile page
    window.open(`/@${member.username}`, '_blank');
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await fetchMore();
    setIsLoadingMore(false);
  };

  const handleConfirmAction = async () => {
    setIsConfirming(true);
    try {
      await confirmDialog.onConfirm();
    } finally {
      setIsConfirming(false);
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  // Loading state
  if (isLoading && members.length === 0) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02]"
          >
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

  // Error state
  if (error) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <Text tone="muted" className="mb-3">
          Failed to load members
        </Text>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className={cn(
              'w-full pl-10 pr-4 py-2.5',
              'rounded-xl text-sm',
              'bg-white/[0.04] border border-white/[0.08]',
              'text-white placeholder:text-white/30',
              'focus:outline-none focus:ring-2 focus:ring-white/20',
              'transition-all duration-150'
            )}
          />
        </div>
      </div>

      {/* Member List */}
      {filteredMembers.length === 0 ? (
        <div className="py-12 text-center">
          <Text tone="muted">
            {searchQuery ? 'No members found' : 'No members yet'}
          </Text>
        </div>
      ) : (
        <div>
          {/* Leaders */}
          {groupedMembers.leaders.length > 0 && (
            <MemberSection title="Leaders" count={groupedMembers.leaders.length}>
              {groupedMembers.leaders.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: Math.min(index * 0.03, 0.2),
                    ease: MOTION.ease.premium,
                  }}
                >
                  <MemberRow
                    member={member}
                    isCurrentUser={member.id === currentUserId}
                    canPromote={canPromote(member)}
                    canDemote={canDemote(member)}
                    canSuspend={canManageMember(member)}
                    canRemove={canManageMember(member)}
                    onPromote={() => handlePromote(member)}
                    onDemote={() => handleDemote(member)}
                    onSuspend={() => handleSuspend(member)}
                    onRemove={() => handleRemove(member)}
                    onViewProfile={() => handleViewProfile(member)}
                  />
                </motion.div>
              ))}
            </MemberSection>
          )}

          {/* Moderators */}
          {groupedMembers.moderators.length > 0 && (
            <MemberSection title="Moderators" count={groupedMembers.moderators.length}>
              {groupedMembers.moderators.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: Math.min(index * 0.03, 0.2),
                    ease: MOTION.ease.premium,
                  }}
                >
                  <MemberRow
                    member={member}
                    isCurrentUser={member.id === currentUserId}
                    canPromote={canPromote(member)}
                    canDemote={canDemote(member)}
                    canSuspend={canManageMember(member)}
                    canRemove={canManageMember(member)}
                    onPromote={() => handlePromote(member)}
                    onDemote={() => handleDemote(member)}
                    onSuspend={() => handleSuspend(member)}
                    onRemove={() => handleRemove(member)}
                    onViewProfile={() => handleViewProfile(member)}
                  />
                </motion.div>
              ))}
            </MemberSection>
          )}

          {/* Members */}
          {groupedMembers.members.length > 0 && (
            <MemberSection title="Members" count={groupedMembers.members.length}>
              {groupedMembers.members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: Math.min(index * 0.03, 0.2),
                    ease: MOTION.ease.premium,
                  }}
                >
                  <MemberRow
                    member={member}
                    isCurrentUser={member.id === currentUserId}
                    canPromote={canPromote(member)}
                    canDemote={canDemote(member)}
                    canSuspend={canManageMember(member)}
                    canRemove={canManageMember(member)}
                    onPromote={() => handlePromote(member)}
                    onDemote={() => handleDemote(member)}
                    onSuspend={() => handleSuspend(member)}
                    onRemove={() => handleRemove(member)}
                    onViewProfile={() => handleViewProfile(member)}
                  />
                </motion.div>
              ))}
            </MemberSection>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="pt-4 pb-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="text-white/50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load more (${totalCount - filteredMembers.length} remaining)`
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        variant={confirmDialog.variant}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        onConfirm={handleConfirmAction}
        loading={isConfirming}
      />
    </div>
  );
}

MemberManagement.displayName = 'MemberManagement';

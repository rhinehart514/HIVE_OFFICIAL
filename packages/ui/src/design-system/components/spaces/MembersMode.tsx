'use client';

/**
 * MembersMode Component
 *
 * Full-screen members view for theater mode.
 * Identity-forward display of space members.
 *
 * Features:
 * - Leaders section at top (larger cards, bento)
 * - Members grid below
 * - Online status prominent (gold presence dots)
 * - Search/filter bar
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { JoinRequestsPanel, type JoinRequestItem } from './JoinRequestsPanel';

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
  joinedAt?: string | Date;
  bio?: string;
}

export interface MembersModeProps {
  /** Space ID */
  spaceId: string;
  /** Members to display */
  members: SpaceMember[];
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Can user invite */
  canInvite?: boolean;
  /** Current user ID */
  currentUserId?: string;
  /** View profile callback */
  onViewProfile?: (memberId: string) => void;
  /** Invite callback */
  onInvite?: () => void;
  /** Remove member callback (for leaders) */
  onRemoveMember?: (memberId: string) => void;
  /** Is the space private (enables join requests) */
  isPrivateSpace?: boolean;
  /** Is the current user a leader (can see join requests) */
  isLeader?: boolean;
  /** Join requests for private spaces */
  joinRequests?: JoinRequestItem[];
  /** Join requests loading */
  joinRequestsLoading?: boolean;
  /** Join requests error */
  joinRequestsError?: string | null;
  /** Approve join request */
  onApproveRequest?: (requestId: string) => Promise<boolean>;
  /** Reject join request */
  onRejectRequest?: (requestId: string, reason?: string) => Promise<boolean>;
  /** Refresh join requests */
  onRefreshRequests?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// Helpers
// ============================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatJoinDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ============================================================
// Member Card Component
// ============================================================

interface MemberCardProps {
  member: SpaceMember;
  size?: 'large' | 'medium' | 'small';
  isCurrentUser?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
}

function MemberCard({
  member,
  size = 'medium',
  isCurrentUser = false,
  onClick,
  onRemove,
  canRemove = false,
}: MemberCardProps) {
  const [showActions, setShowActions] = React.useState(false);
  const isLarge = size === 'large';
  const isSmall = size === 'small';
  const isLeader = member.role === 'owner' || member.role === 'admin';

  return (
    <motion.button
      whileHover={{ opacity: 0.9 }}
      whileTap={{ opacity: 0.8 }}
      className={cn(
        'relative w-full text-left rounded-2xl overflow-hidden',
        'bg-[#141312] border border-white/[0.06]',
        'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:border-white/[0.12]',
        'focus:outline-none focus:ring-2 focus:ring-white/50',
        isLarge && 'col-span-2 row-span-2',
        isSmall ? 'p-3' : 'p-5',
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={cn(
        'flex items-center',
        isLarge ? 'flex-col text-center' : 'gap-3',
      )}>
        {/* Avatar */}
        <div className={cn(
          'relative rounded-xl bg-[#1E1D1B] overflow-hidden flex-shrink-0',
          isLarge ? 'w-20 h-20 mb-3' : isSmall ? 'w-10 h-10' : 'w-12 h-12',
        )}>
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={cn(
              'w-full h-full flex items-center justify-center text-[#6B6B70] font-medium',
              isLarge ? 'text-2xl' : 'text-sm',
            )}>
              {getInitials(member.name)}
            </div>
          )}

          {/* Online indicator */}
          {member.isOnline && (
            <div className={cn(
              'absolute rounded-full bg-[#FFD700] ring-2 ring-[#141312]',
              isLarge ? 'w-4 h-4 bottom-0 right-0' : 'w-2.5 h-2.5 bottom-0 right-0',
            )} />
          )}
        </div>

        {/* Content */}
        <div className={cn('flex-1 min-w-0', isLarge && 'w-full')}>
          {/* Name */}
          <div className={cn(
            'flex items-center gap-2',
            isLarge && 'justify-center',
          )}>
            <span className={cn(
              'font-medium text-white truncate',
              isSmall ? 'text-sm' : 'text-base',
            )}>
              {member.name}
            </span>
            {isCurrentUser && (
              <span className="text-[#6B6B70] text-xs">(you)</span>
            )}
          </div>

          {/* Handle */}
          {member.handle && !isSmall && (
            <p className="text-[#6B6B70] text-sm truncate">@{member.handle}</p>
          )}

          {/* Role badge */}
          {isLeader && (
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-xs font-medium uppercase tracking-wide mt-1',
              member.role === 'owner'
                ? 'bg-[#FFD700]/20 text-[#FFD700]'
                : 'bg-white/[0.08] text-[#A3A19E]',
            )}>
              {member.role === 'owner' && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              {member.role}
            </span>
          )}

          {/* Bio (large only) */}
          {isLarge && member.bio && (
            <p className="text-[#A3A19E] text-sm line-clamp-2 mt-2">
              {member.bio}
            </p>
          )}

          {/* Joined date (large only) */}
          {isLarge && member.joinedAt && (
            <p className="text-[#6B6B70] text-xs mt-2">
              Joined {formatJoinDate(member.joinedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Remove action (for leaders) */}
      {canRemove && showActions && onRemove && !isCurrentUser && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/[0.06]
            hover:bg-red-500/20 text-[#6B6B70] hover:text-red-400 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Remove from space"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      )}
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function MembersMode({
  spaceId,
  members,
  isLoading = false,
  error,
  onRetry,
  canInvite = false,
  currentUserId,
  onViewProfile,
  onInvite,
  onRemoveMember,
  isPrivateSpace = false,
  isLeader = false,
  joinRequests = [],
  joinRequestsLoading = false,
  joinRequestsError,
  onApproveRequest,
  onRejectRequest,
  onRefreshRequests,
  className,
}: MembersModeProps) {
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'online' | 'leaders' | 'requests'>('all');
  const [requestsFilter, setRequestsFilter] = React.useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // Show requests tab for leaders in private spaces
  const showRequestsTab = isPrivateSpace && isLeader;
  const pendingRequestsCount = joinRequests.filter(r => r.status === 'pending').length;

  // Separate leaders and members
  const leaders = members.filter((m) => m.role === 'owner' || m.role === 'admin');
  const regularMembers = members.filter((m) => m.role !== 'owner' && m.role !== 'admin');

  // Filter members
  const filteredMembers = React.useMemo(() => {
    let result = members;

    // Apply role filter
    if (filter === 'leaders') {
      result = leaders;
    } else if (filter === 'online') {
      result = result.filter((m) => m.isOnline);
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((m) =>
        m.name.toLowerCase().includes(searchLower) ||
        m.handle?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [members, leaders, filter, search]);

  // Online count
  const onlineCount = members.filter((m) => m.isOnline).length;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="flex items-center gap-2 text-[#6B6B70]">
          <div className="w-2 h-2 rounded-full bg-[#6B6B70] animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-[#6B6B70] animate-pulse delay-100" />
          <div className="w-2 h-2 rounded-full bg-[#6B6B70] animate-pulse delay-200" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="text-center px-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-[#A3A19E] text-base mb-2">Something went wrong</p>
          <p className="text-[#6B6B70] text-sm mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-lg bg-white/[0.06] text-white text-sm font-medium
                hover:bg-white/[0.10] active:scale-95 transition-all"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-y-auto', className)}>
      <div className="max-w-4xl mx-auto px-3 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Members</h1>
            <p className="text-[#6B6B70] text-sm mt-1">
              {members.length} members · {onlineCount} online
            </p>
          </div>
          {canInvite && onInvite && (
            <button
              className="px-4 py-2 rounded-lg bg-[#FFD700] text-black font-medium
                hover:bg-[#FFD700]/90 active:scale-95 transition-all"
              onClick={onInvite}
            >
              Invite
            </button>
          )}
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B70]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg
                bg-[#141312] border border-white/[0.06]
                text-white placeholder:text-[#6B6B70]
                focus:outline-none focus:border-white/[0.12] focus:ring-2 focus:ring-white/[0.10]
                transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === 'all'
                  ? 'bg-white/[0.10] text-white'
                  : 'bg-white/[0.04] text-[#A3A19E] hover:bg-white/[0.08]',
              )}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                filter === 'online'
                  ? 'bg-white/[0.10] text-white'
                  : 'bg-white/[0.04] text-[#A3A19E] hover:bg-white/[0.08]',
              )}
              onClick={() => setFilter('online')}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
              Online
            </button>
            <button
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === 'leaders'
                  ? 'bg-white/[0.10] text-white'
                  : 'bg-white/[0.04] text-[#A3A19E] hover:bg-white/[0.08]',
              )}
              onClick={() => setFilter('leaders')}
            >
              Leaders
            </button>
            {showRequestsTab && (
              <button
                className={cn(
                  'relative px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  filter === 'requests'
                    ? 'bg-white/[0.10] text-white'
                    : 'bg-white/[0.04] text-[#A3A19E] hover:bg-white/[0.08]',
                )}
                onClick={() => setFilter('requests')}
              >
                Requests
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFD700] text-black text-label-xs font-bold flex items-center justify-center">
                    {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {filter === 'requests' ? (
          /* Join Requests Panel */
          <JoinRequestsPanel
            requests={joinRequests.filter(r =>
              requestsFilter === 'all' ? true : r.status === requestsFilter
            )}
            isLoading={joinRequestsLoading}
            isActing={false}
            error={joinRequestsError}
            statusFilter={requestsFilter}
            onFilterChange={setRequestsFilter}
            onApprove={onApproveRequest || (async () => false)}
            onReject={onRejectRequest || (async () => false)}
            onRefresh={onRefreshRequests}
          />
        ) : filter === 'all' && !search ? (
          <>
            {/* Leaders section */}
            {leaders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-[#FFD700] mb-4 uppercase tracking-wide flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Leaders
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {leaders.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      size="large"
                      isCurrentUser={member.id === currentUserId}
                      onClick={() => onViewProfile?.(member.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Members section */}
            {regularMembers.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-[#A3A19E] mb-4 uppercase tracking-wide">
                  Members
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {regularMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      size="small"
                      isCurrentUser={member.id === currentUserId}
                      onClick={() => onViewProfile?.(member.id)}
                      onRemove={onRemoveMember ? () => onRemoveMember(member.id) : undefined}
                      canRemove={canInvite}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Filtered/searched results */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                size={leaders.includes(member) ? 'medium' : 'small'}
                isCurrentUser={member.id === currentUserId}
                onClick={() => onViewProfile?.(member.id)}
                onRemove={onRemoveMember ? () => onRemoveMember(member.id) : undefined}
                canRemove={canInvite && member.role === 'member'}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {filter !== 'requests' && filteredMembers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#6B6B70]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-[#A3A19E] text-lg mb-2">
              {search ? 'No members found' : 'No members yet'}
            </p>
            <p className="text-[#6B6B70] text-sm mb-6">
              {search ? 'Try a different search term' : 'Invite people to join this space'}
            </p>
            {!search && canInvite && onInvite && (
              <button
                onClick={onInvite}
                className="px-4 py-2 rounded-lg bg-[#FFD700] text-black font-medium
                  hover:bg-[#FFD700]/90 active:scale-95 transition-all"
              >
                Invite Members
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

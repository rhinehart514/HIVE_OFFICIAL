'use client';

/**
 * Space Members Page — Manage space membership
 *
 * Archetype: Discovery (Shell ON)
 * Pattern: Table with sections (Leaders, Members)
 * Shell: ON
 *
 * @version 7.0.0 - Redesigned for Spaces Vertical Slice (Jan 2026)
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Category accent colors (domain-based)
const CATEGORY_COLORS: Record<string, string> = {
  university: '#3B82F6',
  student_org: '#F59E0B',
  residential: '#10B981',
  greek: '#8B5CF6',
};
import { Button, Input, Card, toast, HiveConfirmModal, JoinRequestsPanel } from '@hive/ui';
import {
  MemberCard,
  MemberList,
  type MemberCardData,
  type MemberRole,
} from '@hive/ui/design-system/primitives';
import { useJoinRequests } from '@/hooks/use-join-requests';
import {
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  UserMinusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { logger } from '@/lib/logger';
import { NoMembersEmptyState } from '@/components/ui/empty-state';

// Animation configs
const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_CONFIG,
  },
};

// Pagination config
const MEMBERS_PER_PAGE = 20;

interface Member {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
  status: 'online' | 'offline';
  joinedAt: string;
  lastActive: string;
  major?: string;
  graduationYear?: string;
}

// Convert API member to MemberCardData
function toMemberCardData(member: Member): MemberCardData {
  const roleMap: Record<string, MemberRole> = {
    owner: 'leader',
    admin: 'admin',
    moderator: 'moderator',
    member: 'member',
    guest: 'member',
  };

  return {
    id: member.id,
    name: member.name,
    handle: `@${member.username}`,
    avatarUrl: member.avatar,
    role: roleMap[member.role] || 'member',
    roleTitle: member.role === 'owner' ? 'Leader' : undefined,
    presence: member.status === 'online' ? 'online' : 'offline',
    bio: member.major
      ? `${member.major}${member.graduationYear ? ` '${member.graduationYear.slice(-2)}` : ''}`
      : undefined,
  };
}

interface MembersSummary {
  totalMembers: number;
  onlineMembers: number;
  activeMembers: number;
}

// Action menu component for member management
interface MemberActionMenuProps {
  member: Member;
  userRole: string;
  actionLoading: boolean;
  hasProvisionalAccess: boolean;
  onRoleChange: (memberId: string, newRole: string) => Promise<void>;
  onRemove: (id: string, name: string) => void;
}

function MemberActionMenu({
  member,
  userRole,
  actionLoading,
  hasProvisionalAccess,
  onRoleChange,
  onRemove,
}: MemberActionMenuProps) {
  return (
    <div
      className="absolute right-0 mt-1 w-48 rounded-lg border border-white/[0.06] bg-[var(--bg-surface)] shadow-lg z-10"
      role="menu"
      aria-label={`Actions for ${member.name}`}
    >
      <div className="py-1">
        {userRole === 'owner' && member.role !== 'admin' && (
          <button
            onClick={() => onRoleChange(member.id, 'admin')}
            disabled={actionLoading}
            role="menuitem"
            aria-label={`Promote ${member.name} to admin`}
            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/[0.05] flex items-center gap-2 transition-colors duration-150"
          >
            {actionLoading ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
            )}
            Make Admin
          </button>
        )}
        {member.role === 'admin' && userRole === 'owner' && (
          <button
            onClick={() => onRoleChange(member.id, 'member')}
            disabled={actionLoading}
            role="menuitem"
            aria-label={`Remove admin role from ${member.name}`}
            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/[0.05] flex items-center gap-2 transition-colors duration-150"
          >
            {actionLoading ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <UserMinusIcon className="h-4 w-4" aria-hidden="true" />
            )}
            Remove Admin
          </button>
        )}
        {/* Hide remove button when leader has provisional access */}
        {!hasProvisionalAccess && (
          <button
            onClick={() => onRemove(member.id, member.name)}
            disabled={actionLoading}
            role="menuitem"
            aria-label={`Remove ${member.name} from space`}
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors duration-150"
          >
            <UserMinusIcon className="h-4 w-4" aria-hidden="true" />
            Remove Member
          </button>
        )}
      </div>
    </div>
  );
}

export default function SpaceMembersPage() {
  const router = useRouter();
  const params = useParams<{ spaceId: string }>();
  const spaceId = params?.spaceId;
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<MembersSummary | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('member');
  const [spaceName, setSpaceName] = useState('');

  // Action states
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [spaceCategory, setSpaceCategory] = useState<string>('student_org');

  // Provisional access state - restricts destructive actions while verification is pending
  const [hasProvisionalAccess, setHasProvisionalAccess] = useState(false);

  // Private space and tab state
  const [isPrivateSpace, setIsPrivateSpace] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');

  // Load members
  useEffect(() => {
    const loadMembers = async () => {
      if (!spaceId || !user) return;

      try {
        setLoading(true);

        // Get space info
        const spaceRes = await secureApiFetch(`/api/spaces/${spaceId}`);
        if (spaceRes.ok) {
          const spaceData = await spaceRes.json();
          setSpaceName(spaceData.name || 'Space');
          setSpaceCategory(spaceData.category || 'student_org');
          setIsPrivateSpace(spaceData.visibility === 'private' || spaceData.isPrivate === true);

          // Check if user has provisional access (pending verification)
          if (user?.uid && spaceData.leaderRequests) {
            const userRequest = spaceData.leaderRequests.find(
              (r: { profileId: string; status: string; provisionalAccessGranted?: boolean; reviewedAt?: string | null }) =>
                r.profileId === user.uid && r.status === 'pending'
            );
            setHasProvisionalAccess(
              userRequest?.provisionalAccessGranted && !userRequest.reviewedAt
            );
          }
        }

        // Get current user's role
        const meRes = await secureApiFetch(`/api/spaces/${spaceId}/members/me`);
        if (meRes.ok) {
          const meData = await meRes.json();
          setUserRole(meData.role || 'member');
        }

        // Get members
        let url = `/api/spaces/${spaceId}/members?limit=100`;
        if (roleFilter) url += `&role=${roleFilter}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await secureApiFetch(url);
        if (!res.ok) {
          throw new Error('Failed to load members');
        }

        const data = await res.json();
        setMembers(data.members || []);
        setSummary(data.summary || null);
      } catch (error) {
        logger.error('Failed to load members', { component: 'MembersPage' }, error instanceof Error ? error : undefined);
        toast.error('Failed to load members', 'Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [spaceId, user, roleFilter, search]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Split members into leaders and regular members
  const { leaders, regularMembers } = useMemo(() => {
    const leaderRoles = ['owner', 'admin', 'moderator'];
    return {
      leaders: members.filter((m) => leaderRoles.includes(m.role)),
      regularMembers: members.filter((m) => !leaderRoles.includes(m.role)),
    };
  }, [members]);

  // Paginate regular members
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * MEMBERS_PER_PAGE;
    const end = start + MEMBERS_PER_PAGE;
    return regularMembers.slice(start, end);
  }, [regularMembers, currentPage]);

  const totalPages = Math.ceil(regularMembers.length / MEMBERS_PER_PAGE);

  const canManageMembers = userRole === 'owner' || userRole === 'admin';

  // Join requests (only for leaders of private spaces)
  const canViewRequests = canManageMembers && isPrivateSpace;
  const joinRequests = useJoinRequests(spaceId, canViewRequests && activeTab === 'requests');

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      setActionLoading(true);
      const res = await secureApiFetch(`/api/spaces/${spaceId}/members`, {
        method: 'PATCH',
        body: JSON.stringify({
          userId: memberId,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update role');
      }

      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole as Member['role'] } : m))
      );

      toast.success('Role updated', `Member role changed to ${newRole}.`);
    } catch (error) {
      logger.error('Failed to update role', { component: 'MembersPage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to update role', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setActionLoading(false);
      setSelectedMember(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setActionLoading(true);
      const res = await secureApiFetch(
        `/api/spaces/${spaceId}/members?userId=${memberId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Handle provisional access restriction
        if (data.code === 'PROVISIONAL_ACCESS_RESTRICTED') {
          toast.error(
            'Action restricted',
            'Member removal is disabled while your leader verification is pending.'
          );
          return;
        }
        throw new Error(data.error || 'Failed to remove member');
      }

      // Update local state
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      if (summary) {
        setSummary({ ...summary, totalMembers: summary.totalMembers - 1 });
      }

      toast.success('Member removed', 'The member has been removed from this space.');
    } catch (error) {
      logger.error('Failed to remove member', { component: 'MembersPage' }, error instanceof Error ? error : undefined);
      toast.error('Failed to remove member', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setActionLoading(false);
      setSelectedMember(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-[var(--bg-surface)] rounded" />
            <div className="h-4 w-64 bg-[var(--bg-surface)] rounded" />
            <div className="h-64 bg-[var(--bg-surface)] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Get category color for accent
  const categoryColor = CATEGORY_COLORS[spaceCategory] || CATEGORY_COLORS.student_org;

  return (
    <div className="min-h-screen bg-[var(--bg-ground)] relative">
      {/* Category accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-40"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-ground)]/80 backdrop-blur-xl border-b border-white/[0.06] pt-1">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/spaces/${spaceId}/settings`)}
                aria-label="Back to space settings"
                className="p-2 -ml-2 rounded-lg text-white/70 hover:text-white hover:bg-[var(--bg-surface)] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Members</h1>
                <p className="text-sm text-white/70">{spaceName}</p>
              </div>
            </div>

            {canManageMembers && (
              <Button
                onClick={() => {
                  toast.info('Coming soon', 'Member invite will be available soon.');
                }}
                aria-label="Invite new members"
                className="bg-white text-black hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <UserPlusIcon className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Invite
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs for private spaces (leaders only) */}
      {canViewRequests && (
        <div className="sticky top-[61px] z-20 bg-[var(--bg-ground)]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-1 py-2" role="tablist" aria-label="Member management tabs">
              <button
                onClick={() => setActiveTab('members')}
                role="tab"
                aria-selected={activeTab === 'members'}
                aria-controls="members-panel"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'members'
                    ? 'bg-white/[0.10] text-white'
                    : 'text-white/50 hover:text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                Members
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                role="tab"
                aria-selected={activeTab === 'requests'}
                aria-controls="requests-panel"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  activeTab === 'requests'
                    ? 'bg-white/[0.10] text-white'
                    : 'text-white/50 hover:text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                Join Requests
                {joinRequests.requests.filter(r => r.status === 'pending').length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--life-gold)] text-black text-[10px] font-bold flex items-center justify-center"
                    aria-label={`${joinRequests.requests.filter(r => r.status === 'pending').length} pending requests`}
                  >
                    {joinRequests.requests.filter(r => r.status === 'pending').length > 9
                      ? '9+'
                      : joinRequests.requests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Join Requests Panel (for private spaces) */}
        {canViewRequests && activeTab === 'requests' ? (
          <JoinRequestsPanel
            requests={joinRequests.requests}
            isLoading={joinRequests.isLoading}
            isActing={joinRequests.isActing}
            error={joinRequests.error}
            statusFilter={joinRequests.statusFilter}
            onFilterChange={joinRequests.filterByStatus}
            onApprove={joinRequests.approveRequest}
            onReject={joinRequests.rejectRequest}
            onRefresh={joinRequests.refresh}
            className="min-h-[400px]"
          />
        ) : (
          <>
        {/* Provisional Access Warning */}
        {hasProvisionalAccess && (
          <div className="p-4 mb-6 bg-amber-500/10 rounded-lg border border-amber-500/30">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-400 mb-1">
                  Verification Pending
                </h3>
                <p className="text-sm text-amber-400/70">
                  Member removal is disabled while your leader verification is in progress.
                  You can still view members and change roles. Verification usually takes less than 24 hours.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" role="region" aria-label="Member statistics">
            <Card className="p-4 bg-[var(--bg-surface)] border-white/[0.06]">
              <p className="text-2xl font-bold text-white">
                {summary.totalMembers}
              </p>
              <p className="text-sm text-white/50">Total Members</p>
            </Card>
            <Card className="p-4 bg-[var(--bg-surface)] border-white/[0.06]">
              <p className="text-2xl font-bold text-green-400">{summary.onlineMembers}</p>
              <p className="text-sm text-white/50">Online Now</p>
            </Card>
            <Card className="p-4 bg-[var(--bg-surface)] border-white/[0.06]">
              <p className="text-2xl font-bold text-white">
                {summary.activeMembers}
              </p>
              <p className="text-sm text-white/50">Active (7d)</p>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6" role="search">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" aria-hidden="true" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              aria-label="Search members by name"
              className="pl-9"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
            className="bg-[var(--bg-surface)] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-shadow"
          >
            <option value="">All Roles</option>
            <option value="owner">Owners</option>
            <option value="admin">Admins</option>
            <option value="moderator">Moderators</option>
            <option value="member">Members</option>
          </select>
        </div>

        {/* Members List with Sections */}
        {members.length === 0 ? (
          <NoMembersEmptyState />
        ) : (
          <div className="space-y-8">
            {/* Leaders Section */}
            {leaders.length > 0 && (
              <section aria-labelledby="leaders-heading">
                <h2 id="leaders-heading" className="text-[11px] uppercase tracking-[0.15em] text-white/50 mb-4">
                  Leaders ({leaders.length})
                </h2>
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  variants={prefersReducedMotion ? undefined : containerVariants}
                  initial={prefersReducedMotion ? undefined : "hidden"}
                  animate={prefersReducedMotion ? undefined : "visible"}
                >
                  {leaders.map((member) => (
                    <motion.div
                      key={member.id}
                      variants={prefersReducedMotion ? undefined : itemVariants}
                      className="relative"
                    >
                      <MemberCard
                        member={toMemberCardData(member)}
                        size="large"
                        showBio
                        onMemberClick={() => router.push(`/profile/${member.id}`)}
                      />
                      {/* Action menu for leaders */}
                      {canManageMembers && member.role !== 'owner' && member.id !== user?.uid && (
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(selectedMember === member.id ? null : member.id);
                            }}
                            aria-label={`Actions for ${member.name}`}
                            aria-expanded={selectedMember === member.id}
                            aria-haspopup="menu"
                            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                          >
                            <EllipsisVerticalIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {selectedMember === member.id && (
                            <MemberActionMenu
                              member={member}
                              userRole={userRole}
                              actionLoading={actionLoading}
                              hasProvisionalAccess={hasProvisionalAccess}
                              onRoleChange={handleRoleChange}
                              onRemove={(id, name) => {
                                setMemberToRemove({ id, name });
                                setSelectedMember(null);
                              }}
                            />
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            )}

            {/* Regular Members Section */}
            {regularMembers.length > 0 && (
              <section aria-labelledby="members-heading">
                <h2 id="members-heading" className="text-[11px] uppercase tracking-[0.15em] text-white/50 mb-4">
                  Members ({regularMembers.length})
                </h2>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                  variants={prefersReducedMotion ? undefined : containerVariants}
                  initial={prefersReducedMotion ? undefined : "hidden"}
                  animate={prefersReducedMotion ? undefined : "visible"}
                >
                  {paginatedMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      variants={prefersReducedMotion ? undefined : itemVariants}
                      className="relative"
                    >
                      <MemberCard
                        member={toMemberCardData(member)}
                        size="compact"
                        onMemberClick={() => router.push(`/profile/${member.id}`)}
                      />
                      {/* Action menu for regular members */}
                      {canManageMembers && member.id !== user?.uid && (
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(selectedMember === member.id ? null : member.id);
                            }}
                            aria-label={`Actions for ${member.name}`}
                            aria-expanded={selectedMember === member.id}
                            aria-haspopup="menu"
                            className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                          >
                            <EllipsisVerticalIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          {selectedMember === member.id && (
                            <MemberActionMenu
                              member={member}
                              userRole={userRole}
                              actionLoading={actionLoading}
                              hasProvisionalAccess={hasProvisionalAccess}
                              onRoleChange={handleRoleChange}
                              onRemove={(id, name) => {
                                setMemberToRemove({ id, name });
                                setSelectedMember(null);
                              }}
                            />
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label="Go to previous page"
                      className="text-white/50 hover:text-white disabled:opacity-30"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-white/50 px-4" aria-current="page">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Go to next page"
                      className="text-white/50 hover:text-white disabled:opacity-30"
                    >
                      Next
                    </Button>
                  </nav>
                )}
              </section>
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* Remove Member Confirmation */}
      <HiveConfirmModal
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Remove Member"
        description={`Are you sure you want to remove ${memberToRemove?.name} from this space? They will lose access to all space content.`}
        confirmText="Remove"
        variant="danger"
        isLoading={actionLoading}
        onConfirm={() => {
          if (memberToRemove) {
            handleRemoveMember(memberToRemove.id);
            setMemberToRemove(null);
          }
        }}
      />
    </div>
  );
}

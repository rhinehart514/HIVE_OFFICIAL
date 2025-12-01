'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Input, Card, toast } from '@hive/ui';
import {
  ChevronLeft,
  Search,
  MoreVertical,
  UserPlus,
  Shield,
  UserMinus,
  Crown,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { motion } from 'framer-motion';

// Spring config for fluid motion
const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

// Stagger children animation
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

interface MembersSummary {
  totalMembers: number;
  onlineMembers: number;
  activeMembers: number;
}

export default function SpaceMembersPage() {
  const router = useRouter();
  const params = useParams<{ spaceId: string }>();
  const spaceId = params?.spaceId;
  const { user } = useAuth();

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
        console.error('Failed to load members:', error);
        toast.error('Failed to load members', 'Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast is stable
  }, [spaceId, user, roleFilter, search]);

  const canManageMembers = userRole === 'owner' || userRole === 'admin';

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
      console.error('Failed to update role:', error);
      toast.error('Failed to update role', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setActionLoading(false);
      setSelectedMember(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      setActionLoading(true);
      const res = await secureApiFetch(
        `/api/spaces/${spaceId}/members?userId=${memberId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      // Update local state
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      if (summary) {
        setSummary({ ...summary, totalMembers: summary.totalMembers - 1 });
      }

      toast.success('Member removed', 'The member has been removed from this space.');
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setActionLoading(false);
      setSelectedMember(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-[var(--hive-brand-primary)]" />;
      case 'admin':
        return <Shield className="h-3 w-3 text-blue-400" />;
      case 'moderator':
        return <Shield className="h-3 w-3 text-green-400" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-[var(--hive-brand-primary)]/20 text-[var(--hive-brand-primary)]';
      case 'admin':
        return 'bg-blue-500/20 text-blue-400';
      case 'moderator':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-[var(--hive-background-tertiary)] text-[var(--hive-text-tertiary)]';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--hive-background-primary)]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-[var(--hive-background-secondary)] rounded" />
            <div className="h-4 w-64 bg-[var(--hive-background-secondary)] rounded" />
            <div className="h-64 bg-[var(--hive-background-secondary)] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--hive-background-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--hive-background-primary)]/80 backdrop-blur-xl border-b border-[var(--hive-border-default)]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/spaces/${spaceId}/settings`)}
                className="p-2 -ml-2 rounded-lg text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-secondary)] transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-[var(--hive-text-primary)]">Members</h1>
                <p className="text-sm text-[var(--hive-text-secondary)]">{spaceName}</p>
              </div>
            </div>

            {canManageMembers && (
              <Button
                onClick={() => {
                  toast.info('Coming soon', 'Member invite will be available soon.');
                }}
                className="bg-white text-black hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Invite
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
              <p className="text-2xl font-bold text-[var(--hive-text-primary)]">
                {summary.totalMembers}
              </p>
              <p className="text-sm text-[var(--hive-text-tertiary)]">Total Members</p>
            </Card>
            <Card className="p-4 bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
              <p className="text-2xl font-bold text-green-400">{summary.onlineMembers}</p>
              <p className="text-sm text-[var(--hive-text-tertiary)]">Online Now</p>
            </Card>
            <Card className="p-4 bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)]">
              <p className="text-2xl font-bold text-[var(--hive-text-primary)]">
                {summary.activeMembers}
              </p>
              <p className="text-sm text-[var(--hive-text-tertiary)]">Active (7d)</p>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--hive-text-tertiary)]" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="pl-9"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[var(--hive-background-secondary)] border border-[var(--hive-border-default)] rounded-lg px-3 py-2 text-sm text-[var(--hive-text-primary)]"
          >
            <option value="">All Roles</option>
            <option value="owner">Owners</option>
            <option value="admin">Admins</option>
            <option value="moderator">Moderators</option>
            <option value="member">Members</option>
          </select>
        </div>

        {/* Members List */}
        <Card className="bg-[var(--hive-background-secondary)] border-[var(--hive-border-default)] overflow-hidden">
          {members.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[var(--hive-text-secondary)]">No members found</p>
            </div>
          ) : (
            <motion.div
              className="divide-y divide-[var(--hive-border-default)]"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {members.map((member) => (
                <motion.div
                  key={member.id}
                  variants={itemVariants}
                  className="flex items-center justify-between p-4 hover:bg-[var(--hive-background-tertiary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[var(--hive-background-tertiary)] flex items-center justify-center">
                          <span className="text-sm font-medium text-[var(--hive-text-secondary)]">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {member.status === 'online' && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-[var(--hive-background-secondary)]" />
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--hive-text-primary)]">
                          {member.name}
                        </span>
                        {getRoleIcon(member.role)}
                      </div>
                      <p className="text-sm text-[var(--hive-text-tertiary)]">
                        @{member.username}
                        {member.major && ` · ${member.major}`}
                        {member.graduationYear && ` '${member.graduationYear.slice(-2)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role Badge */}
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${getRoleBadgeColor(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>

                    {/* Actions */}
                    {canManageMembers && member.role !== 'owner' && member.id !== user?.uid && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setSelectedMember(selectedMember === member.id ? null : member.id)
                          }
                          className="p-1.5 rounded-lg text-[var(--hive-text-tertiary)] hover:text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {selectedMember === member.id && (
                          <div className="absolute right-0 mt-1 w-48 rounded-lg border border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] shadow-lg z-10">
                            <div className="py-1">
                              {userRole === 'owner' && member.role !== 'admin' && (
                                <button
                                  onClick={() => handleRoleChange(member.id, 'admin')}
                                  disabled={actionLoading}
                                  className="w-full px-3 py-2 text-left text-sm text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] flex items-center gap-2"
                                >
                                  <Shield className="h-4 w-4" />
                                  Make Admin
                                </button>
                              )}
                              {member.role === 'admin' && userRole === 'owner' && (
                                <button
                                  onClick={() => handleRoleChange(member.id, 'member')}
                                  disabled={actionLoading}
                                  className="w-full px-3 py-2 text-left text-sm text-[var(--hive-text-primary)] hover:bg-[var(--hive-background-tertiary)] flex items-center gap-2"
                                >
                                  <UserMinus className="h-4 w-4" />
                                  Remove Admin
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                disabled={actionLoading}
                                className="w-full px-3 py-2 text-left text-sm text-[var(--hive-status-error)] hover:bg-[var(--hive-status-error)]/10 flex items-center gap-2"
                              >
                                {actionLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <UserMinus className="h-4 w-4" />
                                )}
                                Remove Member
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}

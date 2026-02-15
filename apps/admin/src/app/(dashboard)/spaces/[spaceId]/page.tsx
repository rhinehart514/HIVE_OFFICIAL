"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import { TableSkeleton, ListSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  WrenchIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  ArchiveBoxIcon,
  PencilIcon,
  GlobeAltIcon,
  StarIcon,
  MagnifyingGlassIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

interface SpaceDetail {
  id: string;
  name: string;
  handle?: string;
  description: string;
  type: string;
  category: string;
  status: string;
  activationStatus: "ghost" | "gathering" | "open";
  isVerified: boolean;
  isFeatured: boolean;
  campusId: string;
  campusName?: string;
  memberCount: number;
  activationThreshold: number;
  healthScore: number;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  leader?: { id: string; displayName: string; handle?: string };
  surfaces: {
    chat: boolean;
    events: boolean;
    tools: boolean;
    members: boolean;
  };
  moderationInfo?: {
    flags: number;
    reports: number;
    lastReviewedAt?: string;
  };
}

interface SpaceMember {
  id: string;
  userId: string;
  displayName: string;
  email?: string;
  role: "admin" | "leader" | "moderator" | "member";
  joinedAt: string;
  isFoundingMember: boolean;
}

interface ModerationItem {
  id: string;
  type: string;
  status: string;
  reason: string;
  reportedBy?: string;
  createdAt: string;
  contentPreview?: string;
}

type TabId = "overview" | "members" | "events" | "moderation";

const CATEGORY_COLORS: Record<string, string> = {
  student_org: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  university_org: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  greek_life: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  campus_living: "bg-green-500/20 text-green-400 border-green-500/30",
  hive_exclusive: "bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30",
};

export default function SpaceDetailPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = use(params);
  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [moderation, setModeration] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [actionLoading, setActionLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const fetchSpace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/spaces/${spaceId}`);
      if (!res.ok) throw new Error("Failed to fetch space");
      const data = await res.json();
      setSpace(data.data?.space || data.space || data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load space");
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const res = await fetchWithAuth(`/api/admin/spaces/${spaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.data?.members || data.members || []);
      }
    } catch {
      // OK
    } finally {
      setMembersLoading(false);
    }
  }, [spaceId]);

  const fetchModeration = useCallback(async () => {
    setModerationLoading(true);
    try {
      const res = await fetchWithAuth(`/api/admin/spaces/${spaceId}/moderation`);
      if (res.ok) {
        const data = await res.json();
        setModeration(data.data?.items || data.items || data.data || []);
      }
    } catch {
      // OK
    } finally {
      setModerationLoading(false);
    }
  }, [spaceId]);

  const handleAction = async (action: string, reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/api/admin/spaces/${spaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} space`);
      await fetchSpace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchSpace();
  }, [fetchSpace]);

  useEffect(() => {
    if (activeTab === "members") fetchMembers();
    if (activeTab === "moderation") fetchModeration();
  }, [activeTab, fetchMembers, fetchModeration]);

  const healthColor = (score: number) =>
    score >= 70 ? "text-green-400" : score >= 40 ? "text-yellow-400" : "text-red-400";

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: ChartBarIcon },
    { id: "members", label: "Members", icon: UsersIcon },
    { id: "events", label: "Events", icon: CalendarIcon },
    { id: "moderation", label: "Moderation", icon: ShieldCheckIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error && !space) {
    return (
      <div className="space-y-4">
        <Link href="/spaces" className="inline-flex items-center gap-2 text-white/50 hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Spaces
        </Link>
        <ErrorState message={error} onRetry={fetchSpace} />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="space-y-4">
        <Link href="/spaces" className="inline-flex items-center gap-2 text-white/50 hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Spaces
        </Link>
        <EmptyState variant="no-data" title="Space not found" />
      </div>
    );
  }

  const filteredMembers = memberSearch
    ? members.filter(
        (m) =>
          m.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
          (m.email && m.email.toLowerCase().includes(memberSearch.toLowerCase()))
      )
    : members;

  return (
    <div className="space-y-6">
      <Link href="/spaces" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Spaces
      </Link>

      {error && <ErrorState message={error} onRetry={fetchSpace} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 flex items-center justify-center shrink-0">
            <GlobeAltIcon className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{space.name}</h1>
              {space.isFeatured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30">
                  <StarIconSolid className="h-3 w-3" /> Featured
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[space.category] || "bg-white/10 text-white/50 border-white/20"}`}>
                {space.category?.replace(/_/g, " ")}
              </span>
            </div>
            {space.handle && <p className="text-white/50 mt-1">@{space.handle}</p>}
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-white/60 flex items-center gap-1">
                <UsersIcon className="h-4 w-4" />
                {space.memberCount} members
              </span>
              <span className={`font-medium ${healthColor(space.healthScore)}`}>
                Health: {space.healthScore}/100
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchSpace}
            className="p-2 text-white/50 hover:text-white hover:bg-white/[0.06] rounded-lg border border-white/[0.06]"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          {space.isFeatured ? (
            <button
              onClick={() => handleAction("unfeature")}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white/[0.04] text-white/60 rounded-lg hover:bg-white/[0.08] border border-white/[0.06] disabled:opacity-50"
            >
              <StarIcon className="h-4 w-4" />
              Unfeature
            </button>
          ) : (
            <button
              onClick={() => handleAction("feature")}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#FFD700]/20 text-[#FFD700] rounded-lg hover:bg-[#FFD700]/30 border border-[#FFD700]/30 disabled:opacity-50"
            >
              <StarIcon className="h-4 w-4" />
              Feature
            </button>
          )}
          <button
            onClick={() => handleAction("archive", "Admin action")}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50"
          >
            <ArchiveBoxIcon className="h-4 w-4" />
            Archive
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                isActive ? "text-[#FFD700]" : "text-white/50 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700]" />}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4 space-y-3">
            <h3 className="text-sm font-medium text-white/50">Basic Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">ID</span>
                <span className="text-white font-mono text-xs">{space.id.slice(0, 12)}…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Type</span>
                <span className="text-white capitalize">{space.type?.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Campus</span>
                <span className="text-white">{space.campusName || space.campusId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Created</span>
                <span className="text-white">{new Date(space.createdAt).toLocaleDateString()}</span>
              </div>
              {space.activatedAt && (
                <div className="flex justify-between">
                  <span className="text-white/40">Activated</span>
                  <span className="text-white">{new Date(space.activatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4 space-y-3">
            <h3 className="text-sm font-medium text-white/50">Activation Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/40">Phase</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                  space.activationStatus === "open"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : space.activationStatus === "gathering"
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : "bg-white/10 text-white/50 border-white/20"
                }`}>
                  {space.activationStatus}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40">Progress</span>
                  <span className="text-white">{space.memberCount}/{space.activationThreshold}</span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-[#FFD700] rounded-full"
                    style={{ width: `${Math.min(100, (space.memberCount / space.activationThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Leader Info */}
          <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4 space-y-3">
            <h3 className="text-sm font-medium text-white/50">Leader</h3>
            {space.leader ? (
              <Link
                href={`/users/${space.leader.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-amber-600/20 flex items-center justify-center text-white text-sm font-medium">
                  {space.leader.displayName?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-white font-medium">{space.leader.displayName}</p>
                  {space.leader.handle && <p className="text-white/40 text-sm">@{space.leader.handle}</p>}
                </div>
              </Link>
            ) : (
              <p className="text-white/40 text-sm">No leader assigned</p>
            )}

            <h3 className="text-sm font-medium text-white/50 pt-2">Surfaces</h3>
            <div className="space-y-1.5">
              {Object.entries(space.surfaces).map(([surface, enabled]) => (
                <div key={surface} className="flex items-center justify-between text-sm">
                  <span className="text-white/50 capitalize">{surface}</span>
                  <span className={`w-2 h-2 rounded-full ${enabled ? "bg-green-500" : "bg-white/20"}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4 lg:col-span-3">
            <h3 className="text-sm font-medium text-white/50 mb-2">Description</h3>
            <p className="text-white/70 text-sm">{space.description || "No description provided."}</p>
          </div>
        </div>
      )}

      {/* Members */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#FFD700]/50"
            />
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#141414] overflow-hidden">
            {membersLoading ? (
              <div className="p-4"><TableSkeleton rows={5} columns={4} /></div>
            ) : filteredMembers.length === 0 ? (
              <EmptyState variant={memberSearch ? "no-results" : "no-data"} title={memberSearch ? "No members match" : "No members"} />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{m.displayName}</span>
                          {m.isFoundingMember && (
                            <span className="text-xs bg-[#FFD700]/20 text-[#FFD700] px-1.5 py-0.5 rounded-full border border-[#FFD700]/30">
                              Founder
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/50">{m.email || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          m.role === "leader"
                            ? "bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30"
                            : m.role === "moderator"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : m.role === "admin"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : "bg-white/10 text-white/50 border-white/20"
                        }`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/40">
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Events */}
      {activeTab === "events" && (
        <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
          <EmptyState
            variant="no-data"
            title="Events view coming soon"
            description="Event analytics and management will be available in a future update."
          />
        </div>
      )}

      {/* Moderation */}
      {activeTab === "moderation" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
              <span className="text-white/50 text-sm">Active Flags</span>
              <p className="text-2xl font-bold text-white mt-1">{space.moderationInfo?.flags || 0}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
              <span className="text-white/50 text-sm">Reports</span>
              <p className="text-2xl font-bold text-white mt-1">{space.moderationInfo?.reports || 0}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
              <span className="text-white/50 text-sm">Last Reviewed</span>
              <p className="text-lg font-medium text-white mt-1">
                {space.moderationInfo?.lastReviewedAt
                  ? new Date(space.moderationInfo.lastReviewedAt).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
          </div>

          {/* Moderation Items */}
          <div className="rounded-xl border border-white/[0.06] bg-[#141414] overflow-hidden">
            {moderationLoading ? (
              <div className="p-4"><ListSkeleton count={3} /></div>
            ) : moderation.length === 0 ? (
              <EmptyState variant="no-data" title="No flagged content" description="No reports or flags for this space." />
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {moderation.map((item) => (
                  <div key={item.id} className="px-4 py-3 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <FlagIcon className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-white/70">{item.reason}</p>
                        {item.contentPreview && (
                          <p className="text-xs text-white/40 mt-1 line-clamp-1">{item.contentPreview}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        item.status === "resolved"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : item.status === "dismissed"
                          ? "bg-white/10 text-white/40 border-white/20"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      }`}>
                        {item.status}
                      </span>
                      <p className="text-xs text-white/30 mt-1">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
            <h3 className="text-sm font-medium text-white/50 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 border border-yellow-500/30">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Warn Leader
              </button>
              <button
                onClick={() => handleAction("freeze", "Admin moderation action")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50"
              >
                <XCircleIcon className="h-4 w-4" />
                Freeze Space
              </button>
              <Link href={`/spaces/${spaceId}/moderation`}>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white/[0.04] text-white/60 rounded-lg hover:bg-white/[0.08] border border-white/[0.06]">
                  <ShieldCheckIcon className="h-4 w-4" />
                  Full Moderation Queue
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

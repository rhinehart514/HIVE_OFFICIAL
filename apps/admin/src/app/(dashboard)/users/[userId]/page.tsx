"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import { TableSkeleton, ListSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  ArrowLeftIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  EyeIcon,
  DevicePhoneMobileIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  displayName: string;
  email?: string;
  handle: string;
  role: string;
  status: "active" | "suspended" | "pending" | "deleted";
  onboardingCompleted: boolean;
  createdAt: string;
  lastActive: string;
  spaceCount: number;
  toolCount?: number;
  avatar?: string;
  deviceInfo?: { platform?: string; lastSeen?: string };
}

interface UserSpace {
  id: string;
  name: string;
  handle?: string;
  role: string;
  joinedAt: string;
}

interface ActivityEntry {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

type Tab = "overview" | "spaces" | "activity";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    suspended: "bg-red-500/20 text-red-400 border-red-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-white/10 text-white/50 border-white/20"}`}>
      {status}
    </span>
  );
}

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<UserSpace[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data.data || data.user || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchSpaces = useCallback(async () => {
    setSpacesLoading(true);
    try {
      const res = await fetchWithAuth(`/api/admin/users/${userId}?include=spaces`);
      if (res.ok) {
        const data = await res.json();
        setSpaces(data.data?.spaces || data.spaces || []);
      }
    } catch {
      // OK
    } finally {
      setSpacesLoading(false);
    }
  }, [userId]);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await fetchWithAuth(`/api/admin/users/${userId}?include=activity`);
      if (res.ok) {
        const data = await res.json();
        setActivity(data.data?.activity || data.activity || []);
      }
    } catch {
      // OK
    } finally {
      setActivityLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (activeTab === "spaces") fetchSpaces();
    if (activeTab === "activity") fetchActivity();
  }, [activeTab, fetchSpaces, fetchActivity]);

  const handleAction = async (action: "suspend" | "unsuspend") => {
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/api/admin/users/${userId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin action" }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} user`);
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "spaces", label: "Spaces" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <div>
      <header className="flex items-center gap-4 h-14 px-6 border-b border-white/[0.06] bg-[#0A0A0A] sticky top-0 z-10">
        <Link
          href="/users"
          className="p-2 -ml-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-white">User Details</h1>
      </header>

      <div className="p-6 max-w-5xl space-y-6">
        {error && <ErrorState message={error} onRetry={fetchUser} />}

        {loading ? (
          <ListSkeleton count={6} />
        ) : !user ? (
          <EmptyState
            variant="no-data"
            title="User not found"
            action={{ label: "Back to Users", onClick: () => router.push("/users") }}
          />
        ) : (
          <>
            {/* Profile Header */}
            <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-amber-600/20 flex items-center justify-center text-white text-3xl font-medium shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    user.displayName?.[0]?.toUpperCase() || "?"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-semibold text-white">
                      {user.displayName || "Unknown User"}
                    </h2>
                    <StatusBadge status={user.status} />
                  </div>
                  <p className="text-white/50 mt-1">@{user.handle}</p>
                  {user.email && (
                    <p className="text-sm text-white/30 mt-1 flex items-center gap-1.5">
                      <EnvelopeIcon className="h-3.5 w-3.5" />
                      {user.email}
                    </p>
                  )}
                  <p className="text-sm text-white/30 mt-1 flex items-center gap-1.5">
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {user.status === "suspended" ? (
                    <button
                      onClick={() => handleAction("unsuspend")}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 border border-green-500/30"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Unsuspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction("suspend")}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50 border border-red-500/30"
                    >
                      <NoSymbolIcon className="h-4 w-4" />
                      Suspend
                    </button>
                  )}
                  <Link
                    href={`/preview/impersonate?userId=${userId}`}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white/[0.04] text-white/60 rounded-lg hover:bg-white/[0.08] border border-white/[0.06]"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View as User
                  </Link>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/[0.06] -mb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? "text-[#FFD700]"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700]" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                    <UsersIcon className="h-4 w-4" />
                    Spaces
                  </div>
                  <p className="text-2xl font-semibold text-white">{user.spaceCount || 0}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                    <ClockIcon className="h-4 w-4" />
                    Days on Platform
                  </div>
                  <p className="text-2xl font-semibold text-white">
                    {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                    <ShieldCheckIcon className="h-4 w-4" />
                    Role
                  </div>
                  <p className="text-2xl font-semibold text-white capitalize">{user.role}</p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4 md:col-span-2 space-y-3">
                  <h3 className="text-sm font-medium text-white/50">Account Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/40">Onboarding</span>
                      <span className={user.onboardingCompleted ? "text-green-400" : "text-yellow-400"}>
                        {user.onboardingCompleted ? "Complete" : "Incomplete"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Last Active</span>
                      <span className="text-white/70">
                        {user.lastActive ? new Date(user.lastActive).toLocaleString() : "Never"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">User ID</span>
                      <span className="text-white/50 font-mono text-xs">{user.id}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4 space-y-3">
                  <h3 className="text-sm font-medium text-white/50 flex items-center gap-1.5">
                    <DevicePhoneMobileIcon className="h-4 w-4" />
                    Device
                  </h3>
                  <p className="text-sm text-white/60">
                    {user.deviceInfo?.platform || "Unknown"}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "spaces" && (
              <div className="rounded-xl border border-white/[0.06] bg-[#141414] overflow-hidden">
                {spacesLoading ? (
                  <div className="p-4"><TableSkeleton rows={3} columns={3} /></div>
                ) : spaces.length === 0 ? (
                  <EmptyState variant="no-data" title="Not a member of any spaces" />
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Space</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {spaces.map((s) => (
                        <tr
                          key={s.id}
                          onClick={() => router.push(`/spaces/${s.id}`)}
                          className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="text-white font-medium">{s.name}</span>
                            {s.handle && <span className="text-white/40 ml-2">@{s.handle}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              s.role === "leader"
                                ? "bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30"
                                : s.role === "moderator"
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                : "bg-white/10 text-white/50 border-white/20"
                            }`}>
                              {s.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/50">
                            {new Date(s.joinedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="rounded-xl border border-white/[0.06] bg-[#141414] overflow-hidden">
                {activityLoading ? (
                  <div className="p-4"><ListSkeleton count={5} /></div>
                ) : activity.length === 0 ? (
                  <EmptyState variant="no-data" title="No recent activity" />
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {activity.map((a) => (
                      <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-medium text-white/40 uppercase mr-2 bg-white/[0.06] px-1.5 py-0.5 rounded">
                            {a.type}
                          </span>
                          <span className="text-sm text-white/70">{a.description}</span>
                        </div>
                        <span className="text-xs text-white/30 shrink-0 ml-4">
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

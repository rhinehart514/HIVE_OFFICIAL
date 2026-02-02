"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import {
  Button,
  HiveCard as Card,
  CardContent,
  Badge,
} from "@hive/ui";
import {
  ArrowLeftIcon,
  UsersIcon,
  WrenchIcon,
  ClockIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  displayName: string;
  email?: string;
  handle: string;
  role: "user" | "builder" | "admin" | "super_admin";
  status: "active" | "suspended" | "pending" | "deleted";
  onboardingCompleted: boolean;
  createdAt: string;
  lastActive: string;
  spaceCount: number;
  toolCount?: number;
  avatar?: string;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { admin, loading: authLoading, isAuthenticated } = useAdminAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      const data = await response.json();
      setUser(data.data || data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, fetchUser]);

  const suspendUser = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin action", duration: "permanent" }),
      });
      if (!response.ok) throw new Error("Failed to suspend user");
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const unsuspendUser = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/unsuspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to unsuspend user");
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const updateUserRole = async (role: "user" | "builder") => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error("Failed to update role");
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Admin</Badge>;
      case "builder":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Builder</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "suspended":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Suspended</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="flex items-center gap-4 h-14 px-6 border-b border-white/10 bg-[#0A0A0A]">
          <Link
            href="/users"
            className="p-2 -ml-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-white">User Details</h1>
        </header>

        <div className="p-6 max-w-4xl">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          {user && (
            <div className="space-y-6">
              {/* Profile Header */}
              <Card className="border-white/10 bg-[#141414]">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-amber-600/20 flex items-center justify-center text-white text-3xl font-medium">
                      {user.displayName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-white">
                        {user.displayName || "Unknown User"}
                      </h2>
                      <p className="text-white/50">@{user.handle}</p>
                      {user.email && (
                        <p className="text-sm text-white/30 mt-1">{user.email}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status)}
                        {!user.onboardingCompleted && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            Onboarding Incomplete
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-white/10 bg-[#141414]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <UsersIcon className="h-4 w-4" />
                      Spaces
                    </div>
                    <p className="text-2xl font-semibold text-white">{user.spaceCount || 0}</p>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-[#141414]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <WrenchIcon className="h-4 w-4" />
                      Tools
                    </div>
                    <p className="text-2xl font-semibold text-white">{user.toolCount || 0}</p>
                  </CardContent>
                </Card>
                <Card className="border-white/10 bg-[#141414]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <ClockIcon className="h-4 w-4" />
                      Days on Platform
                    </div>
                    <p className="text-2xl font-semibold text-white">
                      {Math.floor(
                        (Date.now() - new Date(user.createdAt).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Timestamps */}
              <Card className="border-white/10 bg-[#141414]">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/50">Joined</span>
                    <span className="text-white">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Last Active</span>
                    <span className="text-white">
                      {user.lastActive
                        ? new Date(user.lastActive).toLocaleDateString()
                        : "Never"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="border-white/10 bg-[#141414]">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-white/50 mb-3">Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {user.role === "user" && (
                      <Button
                        variant="outline"
                        onClick={() => updateUserRole("builder")}
                        disabled={actionLoading}
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      >
                        <ShieldCheckIcon className="h-4 w-4 mr-2" />
                        Make Builder
                      </Button>
                    )}
                    {user.role === "builder" && (
                      <Button
                        variant="outline"
                        onClick={() => updateUserRole("user")}
                        disabled={actionLoading}
                        className="border-white/20 text-white/50 hover:bg-white/5"
                      >
                        Remove Builder
                      </Button>
                    )}
                    {user.status === "suspended" ? (
                      <Button
                        variant="outline"
                        onClick={unsuspendUser}
                        disabled={actionLoading}
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Unsuspend
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={suspendUser}
                        disabled={actionLoading}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <NoSymbolIcon className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!user && !loading && (
            <Card className="border-white/10 bg-[#141414]">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg font-medium text-white">User not found</p>
                <Link
                  href="/users"
                  className="mt-4 text-amber-400 hover:text-amber-300"
                >
                  Back to Users
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

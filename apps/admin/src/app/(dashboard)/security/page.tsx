"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import {
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@hive/ui";
import {
  ShieldCheckIcon,
  KeyIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface AdminSession {
  id: string;
  adminId: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}

interface SecurityEvent {
  id: string;
  type: "login_success" | "login_failed" | "password_change" | "session_revoked" | "permission_change";
  adminId: string;
  email: string;
  ipAddress: string;
  details: string;
  timestamp: string;
}

interface SecurityStats {
  activeSessions: number;
  failedLoginsToday: number;
  lastPasswordChange: string | null;
  twoFactorEnabled: boolean;
}

export default function SecurityPage() {
  const router = useRouter();
  const { admin, loading: authLoading, isAuthenticated } = useAdminAuth();

  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSecurityData = useCallback(async () => {
    if (!admin) return;

    setLoading(true);
    setError(null);

    try {
      const [sessionsRes, eventsRes] = await Promise.all([
        fetchWithAuth("/api/admin/security/sessions"),
        fetchWithAuth("/api/admin/security/events?limit=10"),
      ]);

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions || []);
        setStats({
          activeSessions: sessionsData.sessions?.length || 0,
          failedLoginsToday: sessionsData.failedLoginsToday || 0,
          lastPasswordChange: sessionsData.lastPasswordChange || null,
          twoFactorEnabled: sessionsData.twoFactorEnabled || false,
        });
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load security data");
    } finally {
      setLoading(false);
    }
  }, [admin]);

  const revokeSession = async (sessionId: string) => {
    setActionLoading(true);
    try {
      const response = await fetchWithAuth(`/api/admin/security/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to revoke session");
      await fetchSecurityData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke session");
    } finally {
      setActionLoading(false);
    }
  };

  const revokeAllOtherSessions = async () => {
    setActionLoading(true);
    try {
      const response = await fetchWithAuth("/api/admin/security/sessions/revoke-all", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to revoke sessions");
      await fetchSecurityData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke sessions");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSecurityData();
    }
  }, [isAuthenticated, fetchSecurityData]);

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes("Mobile") || userAgent.includes("iPhone") || userAgent.includes("Android")) {
      return <DevicePhoneMobileIcon className="h-4 w-4" />;
    }
    return <ComputerDesktopIcon className="h-4 w-4" />;
  };

  const getEventIcon = (type: SecurityEvent["type"]) => {
    switch (type) {
      case "login_success":
        return <CheckCircleIcon className="h-4 w-4 text-green-400" />;
      case "login_failed":
        return <XCircleIcon className="h-4 w-4 text-red-400" />;
      case "password_change":
        return <KeyIcon className="h-4 w-4 text-blue-400" />;
      case "session_revoked":
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />;
      case "permission_change":
        return <ShieldCheckIcon className="h-4 w-4 text-purple-400" />;
      default:
        return <GlobeAltIcon className="h-4 w-4 text-white/50" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
      </div>
    );
  }
  return (
    <div>
      <header className="flex items-center justify-between h-14 px-6 border-b border-white/10 bg-[#0A0A0A]">
          <h1 className="text-lg font-semibold text-white">Security</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchSecurityData}
            disabled={loading}
            className="text-white/50 hover:text-white"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </header>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          {/* Security Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-white/10 bg-[#141414]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#A1A1A6]">Active Sessions</p>
                    <p className="text-2xl font-bold text-white">{stats?.activeSessions || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <ComputerDesktopIcon className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#141414]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#A1A1A6]">Failed Logins Today</p>
                    <p className="text-2xl font-bold text-white">{stats?.failedLoginsToday || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#141414]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#A1A1A6]">Two-Factor Auth</p>
                    <p className="text-2xl font-bold text-white">
                      {stats?.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    stats?.twoFactorEnabled ? "bg-green-500/10" : "bg-yellow-500/10"
                  }`}>
                    <ShieldCheckIcon className={`h-5 w-5 ${
                      stats?.twoFactorEnabled ? "text-green-400" : "text-yellow-400"
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#141414]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#A1A1A6]">Last Password Change</p>
                    <p className="text-lg font-bold text-white">
                      {stats?.lastPasswordChange
                        ? formatTimeAgo(stats.lastPasswordChange)
                        : "Never"}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <KeyIcon className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Sessions */}
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <ComputerDesktopIcon className="h-5 w-5 text-[#A1A1A6]" />
                Active Sessions
              </CardTitle>
              {sessions.filter(s => !s.isCurrent).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={revokeAllOtherSessions}
                  disabled={actionLoading}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  Revoke All Other Sessions
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-[#FFD700]" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-white/50 text-center py-8">No active sessions found</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/50">
                          {getDeviceIcon(session.userAgent)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {session.userAgent.split(" ")[0] || "Unknown Device"}
                            </span>
                            {session.isCurrent && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/50">
                            <span>{session.ipAddress}</span>
                            <span>•</span>
                            <span>Last active {formatTimeAgo(session.lastActive)}</span>
                          </div>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeSession(session.id)}
                          disabled={actionLoading}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Security Events */}
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-[#A1A1A6]" />
                Recent Security Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-[#FFD700]" />
                </div>
              ) : events.length === 0 ? (
                <p className="text-white/50 text-center py-8">No recent security events</p>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{event.details}</p>
                        <div className="flex items-center gap-3 text-xs text-white/50">
                          <span>{event.email}</span>
                          <span>•</span>
                          <span>{event.ipAddress}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(event.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}

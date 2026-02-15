"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAdminAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import { OverviewDashboard } from "@/components/overview-dashboard";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { CommandCenterDashboard } from "@/components/command";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import {
  BellIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

type AdminMode = "command" | "operations";

export default function DashboardPage() {
  const { admin } = useAdminAuth();
  const [adminMode, setAdminMode] = useState<AdminMode>("operations");
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationBellRef = useRef<HTMLButtonElement>(null);
  const [pendingCounts, setPendingCounts] = useState({
    builderRequests: 0,
    flaggedContent: 0,
    userReports: 0,
    pendingClaims: 0,
  });

  const fetchPendingCounts = useCallback(async () => {
    if (!admin) return;

    try {
      const [builderResponse, contentResponse, claimsResponse] = await Promise.all([
        fetchWithAuth('/api/admin/builder-requests'),
        fetchWithAuth('/api/admin/content-moderation'),
        fetchWithAuth('/api/admin/claims?status=pending'),
      ]);

      const builderData = await builderResponse.json();
      const contentData = await contentResponse.json();
      const claimsData = claimsResponse.ok ? await claimsResponse.json() : { claims: [] };

      setPendingCounts({
        builderRequests: builderData.requests?.filter((r: { status: string }) => r.status === 'pending').length || 0,
        flaggedContent: contentData.flaggedContent?.filter((c: { status: string }) => c.status === 'pending').length || 0,
        userReports: 0,
        pendingClaims: claimsData.data?.summary?.pending || claimsData.summary?.pending || (claimsData.data?.claims || claimsData.claims || []).length,
      });
    } catch {
      // Pending counts fetch failed - will retry on next interval
    }
  }, [admin]);

  useEffect(() => {
    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingCounts]);

  // Command mode shows full-screen Command Center
  if (adminMode === "command") {
    return (
      <div className="min-h-screen bg-black">
        <div className="fixed top-4 right-4 z-50">
          <ModeSwitcher
            currentMode={adminMode}
            onModeChange={setAdminMode}
          />
        </div>
        <CommandCenterDashboard />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between h-14 px-6 border-b border-white/10 bg-[#0A0A0A]">
        <h1 className="text-lg font-semibold text-white">Overview</h1>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 pl-10 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/50"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              ref={notificationBellRef}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <BellIcon className="h-5 w-5" />
              {(pendingCounts.builderRequests + pendingCounts.flaggedContent + pendingCounts.pendingClaims) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <NotificationPanel
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              anchorRef={notificationBellRef}
            />
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{admin?.email}</p>
              <p className="text-xs text-white/40 capitalize">{admin?.role}</p>
            </div>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <OverviewDashboard />
      </div>
    </div>
  );
}

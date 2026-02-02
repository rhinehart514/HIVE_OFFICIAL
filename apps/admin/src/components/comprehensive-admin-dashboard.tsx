"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { HiveCard as Card, CardContent, CardHeader, CardTitle } from "@hive/ui";
import { useAdminAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import { AdminSidebar } from "./admin-sidebar";
import { OverviewDashboard } from "./overview-dashboard";
import { UserManagementDashboard } from "./user-management-dashboard";
import { SpaceManagementDashboard } from "./space-management-dashboard";
import { SchoolManagementDashboard } from "./school-management-dashboard";
import { ContentModerationDashboard } from "./content-moderation-dashboard";
import { BuilderQueueEnhanced } from "./builder-queue-enhanced";
import { AnalyticsDashboard } from "./analytics-dashboard";
import { AdminNotifications } from "./admin-notifications";
import { AdminActivityLogDashboard } from "./admin-activity-log";
import { FeatureFlagManagement } from "./feature-flag-management";
import { SpaceHealthDashboard } from "./space-health-dashboard";
import { ToolReviewDashboard } from "./tool-review-dashboard";
import { OnboardingFunnelDashboard } from "./onboarding-funnel-dashboard";
import { AlertPanel } from "./alert-panel";
import { SystemHealthDashboard } from "./system-health-dashboard";
import { ActivityLogViewer } from "./activity-log-viewer";
import { ClaimsQueue } from "./claims-queue";
import { LeaderHealthDashboard } from "./leader-health-dashboard";
import { CommandCenterDashboard } from "./command";
import { OperationsCenterDashboard } from "./operations";
import { ModeSwitcher } from "./ModeSwitcher";
import { NotificationPanel } from "./notifications/NotificationPanel";
import {
  BellIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

type AdminMode = "command" | "operations";

// Aliases for lucide compatibility
const Bell = BellIcon;
const Search = MagnifyingGlassIcon;
const LogOut = ArrowRightOnRectangleIcon;

interface AdminDashboardProps {
  initialTab?: string;
}

export function ComprehensiveAdminDashboard({ initialTab = 'overview' }: AdminDashboardProps) {
  const { admin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
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
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingCounts]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard />;
      case 'users':
        return <UserManagementDashboard />;
      case 'spaces':
        return <SpaceManagementDashboard />;
      case 'schools':
        return <SchoolManagementDashboard />;
      case 'content':
        return <ContentModerationDashboard />;
      case 'builders':
        return (
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-white">Builder Approval Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <BuilderQueueEnhanced />
            </CardContent>
          </Card>
        );
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'flags':
        return <FeatureFlagManagement />;
      case 'system':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-white/10 bg-[#141414]">
                <CardHeader>
                  <CardTitle className="text-white">System Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="font-semibold text-white mb-2">Platform Settings</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/50">Registration:</span>
                            <span className="text-green-400">Open</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Content Moderation:</span>
                            <span className="text-green-400">Enabled</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Auto-Approval:</span>
                            <span className="text-red-400">Disabled</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="font-semibold text-white mb-2">Feature Flags</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/50">Rituals System:</span>
                            <span className="text-yellow-400">Beta</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Tool Marketplace:</span>
                            <span className="text-green-400">Live</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Real-time Chat:</span>
                            <span className="text-green-400">Live</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <AdminNotifications />
            </div>
            <AdminActivityLogDashboard />
          </div>
        );
      case 'alerts':
        return <AlertPanel />;
      case 'health':
        return <SystemHealthDashboard />;
      case 'logs':
        return <ActivityLogViewer />;
      case 'security':
        return (
          <Card className="border-white/10 bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/50">Navigate to /security for full security dashboard.</p>
            </CardContent>
          </Card>
        );
      case 'spaceHealth':
        return <SpaceHealthDashboard />;
      case 'toolReview':
        return <ToolReviewDashboard />;
      case 'onboardingFunnel':
        return <OnboardingFunnelDashboard />;
      case 'claims':
        return <ClaimsQueue />;
      case 'leaderHealth':
        return <LeaderHealthDashboard />;
      default:
        return (
          <div className="text-center py-8">
            <p className="text-white/50">Select a section from the sidebar</p>
          </div>
        );
    }
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    );
  }

  // If in Command mode, show Command Center directly
  if (adminMode === "command") {
    return (
      <div className="min-h-screen bg-black">
        {/* Floating mode switcher for Command Center */}
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
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar
        pendingCounts={pendingCounts}
        currentMode={adminMode}
        onModeChange={setAdminMode}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between h-14 px-6 border-b border-white/10 bg-[#0A0A0A]">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
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
                <Bell className="h-5 w-5" />
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
                <p className="text-sm font-medium text-white">{admin.email}</p>
                <p className="text-xs text-white/40 capitalize">{admin.role}</p>
              </div>
              <button
                onClick={() => window.location.href = '/auth/login'}
                className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

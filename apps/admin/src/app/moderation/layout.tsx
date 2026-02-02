"use client";

import { ReactNode, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import { AdminSidebar } from "@/components/admin-sidebar";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import {
  ShieldCheckIcon,
  FlagIcon,
  ScaleIcon,
  InboxStackIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

interface ModerationLayoutProps {
  children: ReactNode;
}

const navItems = [
  {
    href: "/moderation/queue",
    label: "Queue",
    icon: InboxStackIcon,
  },
  {
    href: "/moderation/reports",
    label: "Reports",
    icon: FlagIcon,
  },
  {
    href: "/moderation/appeals",
    label: "Appeals",
    icon: ScaleIcon,
  },
];

export default function ModerationLayout({ children }: ModerationLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, loading, isAuthenticated } = useAdminAuth();
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
      // Silent fail
    }
  }, [admin]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingCounts]);

  const isActive = (href: string) => pathname === href;

  if (loading) {
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
      <AdminSidebar pendingCounts={pendingCounts} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header with sub-navigation */}
        <header className="border-b border-white/[0.08] bg-[#0A0A0A]">
          <div className="flex items-center justify-between h-14 px-6">
            {/* Title and sub-nav */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-amber-400" />
                <h1 className="text-lg font-semibold text-white">Moderation</h1>
              </div>

              {/* Sub-navigation tabs */}
              <nav className="flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                        ${active
                          ? "bg-amber-500/10 text-amber-400"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/50"
                />
              </div>

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
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

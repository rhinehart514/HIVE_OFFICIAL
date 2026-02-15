"use client";

import { fetchWithAuth } from "@/hooks/use-admin-api";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  BellIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

// ============================================================================
// Types
// ============================================================================

interface AdminNotification {
  id: string;
  type: "report" | "claim" | "tool" | "appeal" | "system" | "alert";
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

// ============================================================================
// Component
// ============================================================================

export function NotificationPanel({ isOpen, onClose, anchorRef }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch from multiple sources and combine
      const [reportsRes, claimsRes, toolsRes, alertsRes] = await Promise.allSettled([
        fetch("/api/admin/moderation/reports?status=pending&limit=5", { credentials: "include" }),
        fetch("/api/admin/claims?status=pending&limit=5", { credentials: "include" }),
        fetch("/api/admin/tools/pending?limit=5", { credentials: "include" }),
        fetch("/api/admin/alerts?unread=true&limit=5", { credentials: "include" }),
      ]);

      const notifs: AdminNotification[] = [];

      // Process reports
      if (reportsRes.status === "fulfilled" && reportsRes.value.ok) {
        const data = await reportsRes.value.json();
        const reports = data.data?.reports || data.reports || [];
        reports.slice(0, 3).forEach((r: Record<string, unknown>) => {
          notifs.push({
            id: `report-${r.id}`,
            type: "report",
            title: "Content Report",
            message: r.reason as string || "New report pending review",
            severity: r.priority === "high" ? "warning" : "info",
            read: false,
            createdAt: r.createdAt as string || new Date().toISOString(),
            actionUrl: "/admin?tab=content",
          });
        });
      }

      // Process claims
      if (claimsRes.status === "fulfilled" && claimsRes.value.ok) {
        const data = await claimsRes.value.json();
        const claims = data.data?.claims || data.claims || [];
        claims.slice(0, 3).forEach((c: Record<string, unknown>) => {
          notifs.push({
            id: `claim-${c.id}`,
            type: "claim",
            title: "Space Claim",
            message: `Claim for ${c.spaceName || "space"} pending`,
            severity: "info",
            read: false,
            createdAt: c.createdAt as string || new Date().toISOString(),
            actionUrl: "/admin?tab=claims",
          });
        });
      }

      // Process tools
      if (toolsRes.status === "fulfilled" && toolsRes.value.ok) {
        const data = await toolsRes.value.json();
        const tools = data.data?.tools || data.tools || [];
        tools.slice(0, 3).forEach((t: Record<string, unknown>) => {
          notifs.push({
            id: `tool-${t.id}`,
            type: "tool",
            title: "Tool Review",
            message: `"${t.name || "New tool"}" awaiting approval`,
            severity: "info",
            read: false,
            createdAt: t.createdAt as string || new Date().toISOString(),
            actionUrl: "/admin?tab=toolReview",
          });
        });
      }

      // Process alerts
      if (alertsRes.status === "fulfilled" && alertsRes.value.ok) {
        const data = await alertsRes.value.json();
        const alerts = data.data?.alerts || data.alerts || [];
        alerts.slice(0, 3).forEach((a: Record<string, unknown>) => {
          notifs.push({
            id: `alert-${a.id}`,
            type: "alert",
            title: a.title as string || "System Alert",
            message: a.message as string || "",
            severity: a.severity as AdminNotification["severity"] || "warning",
            read: a.read as boolean || false,
            createdAt: a.createdAt as string || new Date().toISOString(),
            actionUrl: "/admin?tab=alerts",
          });
        });
      }

      // Sort by date
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(notifs.slice(0, 10));
    } catch {
      // Silent fail - notifications are not critical
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on open
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  // Mark as read
  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    // Optionally call API to persist
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetchWithAuth("/api/admin/alerts/acknowledge", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      // Silent fail
    }
  };

  // Get icon for notification type
  const getIcon = (type: AdminNotification["type"], severity: AdminNotification["severity"]) => {
    const iconClass = severity === "critical" || severity === "error"
      ? "text-red-400"
      : severity === "warning"
      ? "text-amber-400"
      : "text-[#A1A1A6]";

    switch (type) {
      case "report":
        return <ShieldExclamationIcon className={`h-5 w-5 ${iconClass}`} />;
      case "claim":
        return <UserGroupIcon className={`h-5 w-5 ${iconClass}`} />;
      case "tool":
        return <WrenchScrewdriverIcon className={`h-5 w-5 ${iconClass}`} />;
      case "alert":
        return <ExclamationTriangleIcon className={`h-5 w-5 ${iconClass}`} />;
      default:
        return <DocumentTextIcon className={`h-5 w-5 ${iconClass}`} />;
    }
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 w-96 z-50"
        >
          <div className="bg-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BellIcon className="h-5 w-5 text-[#A1A1A6]" />
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 text-[#A1A1A6] hover:text-white hover:bg-white/5 rounded-lg transition-colors text-xs"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-[#A1A1A6] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-[#FFD700]" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-[#A1A1A6]">
                  <BellIcon className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <motion.a
                      key={notification.id}
                      href={notification.actionUrl || "#"}
                      onClick={() => markAsRead(notification.id)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`block px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                        !notification.read ? "bg-white/[0.02]" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type, notification.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${notification.read ? "text-[#A1A1A6]" : "text-white"}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#FFD700]" />
                            )}
                          </div>
                          <p className="text-xs text-[#818187] mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-[#636366] mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/10">
                <a
                  href="/admin?tab=alerts"
                  className="text-xs text-[#A1A1A6] hover:text-white transition-colors"
                >
                  View all notifications
                </a>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

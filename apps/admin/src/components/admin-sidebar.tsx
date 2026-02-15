"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@hive/ui";
import { CompactModeSwitcher } from "./ModeSwitcher";
import {
  Squares2X2Icon,
  UsersIcon,
  HashtagIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  WrenchIcon,
  ChartBarIcon,
  FlagIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  ShieldCheckIcon,
  ChartBarIcon as ActivityIcon,
  RocketLaunchIcon,
  Square2StackIcon,
  UserPlusIcon,
  DocumentTextIcon as ScrollTextIcon,
  TrophyIcon,
  HeartIcon,
  PresentationChartBarIcon,
  InboxStackIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

type AdminMode = "command" | "operations";

// Aliases for lucide compatibility
const LayoutDashboard = Squares2X2Icon;
const Users = UsersIcon;
const Hash = HashtagIcon;
const GraduationCap = AcademicCapIcon;
const FileText = DocumentTextIcon;
const Wrench = WrenchIcon;
const BarChart3 = ChartBarIcon;
const Flag = FlagIcon;
const Settings = Cog6ToothIcon;
const ChevronLeft = ChevronLeftIcon;
const ChevronRight = ChevronRightIcon;
const Bell = BellIcon;
const Shield = ShieldCheckIcon;
const Activity = ActivityIcon;
const Rocket = RocketLaunchIcon;
const Layers = Square2StackIcon;
const UserPlus = UserPlusIcon;
const ScrollText = ScrollTextIcon;
const Crown = TrophyIcon;
const HeartPulse = HeartIcon;

interface AdminSidebarProps {
  pendingCounts?: {
    builderRequests: number;
    flaggedContent: number;
    userReports: number;
    alerts?: number;
    pendingClaims?: number;
  };
  // Mode switcher props
  currentMode?: AdminMode;
  onModeChange?: (mode: AdminMode) => void;
}

const navigationItems = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    href: "/dashboard",
    description: "Platform overview and key metrics",
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    href: "/users",
    description: "User management and search",
    badgeKey: "userReports" as const,
  },
  {
    id: "spaces",
    label: "Spaces",
    icon: Hash,
    href: "/spaces",
    description: "Space management and configuration",
  },
  {
    id: "schools",
    label: "Schools",
    icon: GraduationCap,
    href: "/schools",
    description: "Multi-campus school configuration",
  },
  {
    id: "content",
    label: "Moderation",
    icon: FileText,
    href: "/moderation",
    description: "Content moderation and flags",
    badgeKey: "flaggedContent" as const,
  },
  {
    id: "builders",
    label: "HiveLab",
    icon: Wrench,
    href: "/builder-requests",
    description: "Builder approval queue",
    badgeKey: "builderRequests" as const,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    href: "/analytics",
    description: "Platform analytics and insights",
  },
  {
    id: "flags",
    label: "Flags",
    icon: Flag,
    href: "/flags",
    description: "Feature flag management",
  },
  {
    id: "system",
    label: "System",
    icon: Settings,
    href: "/system",
    description: "System settings and configuration",
  },
  {
    id: "preview",
    label: "Preview",
    icon: EyeIcon,
    href: "/preview",
    description: "Preview and test the production frontend",
  },
];

const crossSliceItems = [
  {
    id: "claims",
    label: "Leader Claims",
    icon: Crown,
    href: "/spaces/claims",
    description: "Leader verification queue",
    badgeKey: "pendingClaims" as const,
  },
  {
    id: "leaderHealth",
    label: "Leader Health",
    icon: HeartPulse,
    href: "/leader-health",
    description: "Leader activation and health metrics",
  },
  {
    id: "spaceHealth",
    label: "Space Health",
    icon: Rocket,
    href: "/spaces/health",
    description: "Launch readiness and space metrics",
  },
  {
    id: "toolReview",
    label: "Tool Review",
    icon: Layers,
    href: "/tool-review",
    description: "HiveLab tool approval queue",
  },
  {
    id: "onboardingFunnel",
    label: "Onboarding",
    icon: UserPlus,
    href: "/onboarding",
    description: "Onboarding funnel analytics",
  },
];

const platformItems = [
  {
    id: "appConfig",
    label: "App Config",
    icon: Settings,
    href: "/config",
    description: "Platform configuration management",
  },
];

const secondaryItems = [
  {
    id: "alerts",
    label: "Alerts",
    icon: Bell,
    href: "/system/alerts",
    description: "Alert configuration",
    badgeKey: "alerts" as const,
  },
  {
    id: "health",
    label: "Health",
    icon: Activity,
    href: "/system/health",
    description: "System health monitoring",
  },
  {
    id: "logs",
    label: "Logs",
    icon: ScrollText,
    href: "/system/logs",
    description: "Activity logs and audit trail",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    href: "/security",
    description: "Security settings",
  },
];

export function AdminSidebar({
  pendingCounts,
  currentMode = "operations",
  onModeChange,
}: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const getBadgeCount = (key?: keyof NonNullable<typeof pendingCounts>) => {
    if (!key || !pendingCounts) return 0;
    return pendingCounts[key] || 0;
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={{ duration: 0.2 }}
      className="relative flex flex-col h-full bg-[#0A0A0A] border-r border-white/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center">
                <span className="text-black font-bold text-sm">H</span>
              </div>
              <span className="font-semibold text-white">Admin</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Mode Switcher */}
      {onModeChange && (
        <div className="px-3 py-2 border-b border-white/10">
          {!isCollapsed ? (
            <div className="space-y-2">
              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                Mode
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => onModeChange("command")}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    currentMode === "command"
                      ? "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <PresentationChartBarIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">Command</span>
                </button>
                <button
                  onClick={() => onModeChange("operations")}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    currentMode === "operations"
                      ? "bg-white/10 text-white border border-white/30"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <InboxStackIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">Ops</span>
                </button>
              </div>
            </div>
          ) : (
            <CompactModeSwitcher
              currentMode={currentMode}
              onModeChange={onModeChange}
              className="w-full justify-center"
            />
          )}
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <div className="mb-2">
          {!isCollapsed && (
            <span className="px-3 text-xs font-medium text-white/40 uppercase tracking-wider">
              Main
            </span>
          )}
        </div>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const badge = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                group relative flex items-center w-full rounded-lg transition-all duration-150
                ${isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"}
                ${
                  active
                    ? "bg-[#FFD700]/10 text-[#FFD700]"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${active ? "text-[#FFD700]" : ""}`} />

              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">
                    {item.label}
                  </span>
                  {badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="h-5 min-w-[20px] px-1.5 text-xs bg-red-500/20 text-red-400 border-red-500/30"
                    >
                      {badge}
                    </Badge>
                  )}
                </>
              )}

              {isCollapsed && badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--bg-void)] border border-white/10 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  <span className="text-sm text-white">{item.label}</span>
                  {badge > 0 && (
                    <span className="ml-2 text-xs text-red-400">({badge})</span>
                  )}
                </div>
              )}
            </Link>
          );
        })}

        {/* Cross-Slice Integration */}
        <div className="mt-6 pt-4 border-t border-white/10">
          {!isCollapsed && (
            <span className="px-3 text-xs font-medium text-white/40 uppercase tracking-wider">
              Cross-Slice
            </span>
          )}
          <div className="mt-2 space-y-1">
            {crossSliceItems.map((item) => {
              const Icon = item.icon;
              const badge = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    group relative flex items-center w-full rounded-lg transition-all duration-150
                    ${isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"}
                    ${
                      active
                        ? "bg-[#FFD700]/10 text-[#FFD700]"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${active ? "text-[#FFD700]" : ""}`} />

                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">
                        {item.label}
                      </span>
                      {badge > 0 && (
                        <Badge
                          variant="destructive"
                          className="h-5 min-w-[20px] px-1.5 text-xs bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30"
                        >
                          {badge}
                        </Badge>
                      )}
                    </>
                  )}

                  {isCollapsed && badge > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#FFD700] rounded-full" />
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--bg-void)] border border-white/10 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                      <span className="text-sm text-white">{item.label}</span>
                      {badge > 0 && (
                        <span className="ml-2 text-xs text-[#FFD700]">({badge})</span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Platform */}
        <div className="mt-6 pt-4 border-t border-white/10">
          {!isCollapsed && (
            <span className="px-3 text-xs font-medium text-white/40 uppercase tracking-wider">
              Platform
            </span>
          )}
          <div className="mt-2 space-y-1">
            {platformItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    group relative flex items-center w-full rounded-lg transition-all duration-150
                    ${isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"}
                    ${
                      active
                        ? "bg-[#FFD700]/10 text-[#FFD700]"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${active ? "text-[#FFD700]" : ""}`} />

                  {!isCollapsed && (
                    <span className="flex-1 text-left text-sm font-medium">
                      {item.label}
                    </span>
                  )}

                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--bg-void)] border border-white/10 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                      <span className="text-sm text-white">{item.label}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="mt-6 pt-4 border-t border-white/10">
          {!isCollapsed && (
            <span className="px-3 text-xs font-medium text-white/40 uppercase tracking-wider">
              System
            </span>
          )}
          <div className="mt-2 space-y-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const badge = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    group relative flex items-center w-full rounded-lg transition-all duration-150
                    ${isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"}
                    ${
                      active
                        ? "bg-[#FFD700]/10 text-[#FFD700]"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${active ? "text-[#FFD700]" : ""}`} />

                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">
                        {item.label}
                      </span>
                      {badge > 0 && (
                        <Badge
                          variant="destructive"
                          className="h-5 min-w-[20px] px-1.5 text-xs bg-red-500/20 text-red-400 border-red-500/30"
                        >
                          {badge}
                        </Badge>
                      )}
                    </>
                  )}

                  {isCollapsed && badge > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--bg-void)] border border-white/10 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                      <span className="text-sm text-white">{item.label}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-white/50">System Healthy</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </motion.aside>
  );
}

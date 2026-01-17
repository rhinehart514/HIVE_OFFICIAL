"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@hive/ui";
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
} from "@heroicons/react/24/outline";

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
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCounts?: {
    builderRequests: number;
    flaggedContent: number;
    userReports: number;
    alerts?: number;
    pendingClaims?: number;
  };
}

const navigationItems = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Platform overview and key metrics",
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    description: "User management and search",
    badgeKey: "userReports" as const,
  },
  {
    id: "spaces",
    label: "Spaces",
    icon: Hash,
    description: "Space management and configuration",
  },
  {
    id: "schools",
    label: "Schools",
    icon: GraduationCap,
    description: "Multi-campus school configuration",
  },
  {
    id: "content",
    label: "Content",
    icon: FileText,
    description: "Content moderation and flags",
    badgeKey: "flaggedContent" as const,
  },
  {
    id: "builders",
    label: "HiveLab",
    icon: Wrench,
    description: "Builder approval queue",
    badgeKey: "builderRequests" as const,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Platform analytics and insights",
  },
  {
    id: "flags",
    label: "Flags",
    icon: Flag,
    description: "Feature flag management",
  },
  {
    id: "system",
    label: "System",
    icon: Settings,
    description: "System settings and configuration",
  },
];

const crossSliceItems = [
  {
    id: "claims",
    label: "Leader Claims",
    icon: Crown,
    description: "Leader verification queue",
    badgeKey: "pendingClaims" as const,
  },
  {
    id: "leaderHealth",
    label: "Leader Health",
    icon: HeartPulse,
    description: "Leader activation and health metrics",
  },
  {
    id: "spaceHealth",
    label: "Space Health",
    icon: Rocket,
    description: "Launch readiness and space metrics",
  },
  {
    id: "toolReview",
    label: "Tool Review",
    icon: Layers,
    description: "HiveLab tool approval queue",
  },
  {
    id: "onboardingFunnel",
    label: "Onboarding",
    icon: UserPlus,
    description: "Onboarding funnel analytics",
  },
];

const secondaryItems = [
  {
    id: "alerts",
    label: "Alerts",
    icon: Bell,
    description: "Alert configuration",
    badgeKey: "alerts" as const,
  },
  {
    id: "health",
    label: "Health",
    icon: Activity,
    description: "System health monitoring",
  },
  {
    id: "logs",
    label: "Logs",
    icon: ScrollText,
    description: "Activity logs and audit trail",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Security settings",
  },
];

export function AdminSidebar({
  activeTab,
  onTabChange,
  pendingCounts,
}: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getBadgeCount = (key?: keyof NonNullable<typeof pendingCounts>) => {
    if (!key || !pendingCounts) return 0;
    return pendingCounts[key] || 0;
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
          className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <div className="mb-2">
          {!isCollapsed && (
            <span className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Main
            </span>
          )}
        </div>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const badge = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                group relative flex items-center w-full rounded-lg transition-all duration-150
                ${isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"}
                ${
                  isActive
                    ? "bg-[#FFD700]/10 text-[#FFD700]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-[#FFD700]" : ""}`} />

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
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 border border-white/10 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  <span className="text-sm text-white">{item.label}</span>
                  {badge > 0 && (
                    <span className="ml-2 text-xs text-red-400">({badge})</span>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {/* Cross-Slice Integration */}
        <div className="mt-6 pt-4 border-t border-white/10">
          {!isCollapsed && (
            <span className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cross-Slice
            </span>
          )}
          <div className="mt-2 space-y-1">
            {crossSliceItems.map((item) => {
              const Icon = item.icon;
              const badge = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`
                    group relative flex items-center w-full rounded-lg transition-all duration-150
                    ${isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"}
                    ${
                      isActive
                        ? "bg-[#FFD700]/10 text-[#FFD700]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-[#FFD700]" : ""}`} />

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
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 border border-white/10 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                      <span className="text-sm text-white">{item.label}</span>
                      {badge > 0 && (
                        <span className="ml-2 text-xs text-[#FFD700]">({badge})</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="mt-6 pt-4 border-t border-white/10">
          {!isCollapsed && (
            <span className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              System
            </span>
          )}
          <div className="mt-2 space-y-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const badge = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`
                    group relative flex items-center w-full rounded-lg transition-all duration-150
                    ${isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"}
                    ${
                      isActive
                        ? "bg-[#FFD700]/10 text-[#FFD700]"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-[#FFD700]" : ""}`} />

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
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 border border-white/10 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                      <span className="text-sm text-white">{item.label}</span>
                    </div>
                  )}
                </button>
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
            <span className="text-xs text-gray-400">System Healthy</span>
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

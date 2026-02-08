"use client";

/**
 * Operations Center Dashboard
 *
 * Main container for daily admin workflow hub.
 * Surfaces all operational tools in a unified interface.
 *
 * Sections:
 * - Queues: All actionable items
 * - Controls: Feature flags & settings
 * - Users: User management
 * - Spaces: Space management
 * - Content: Moderation
 * - Tools: HiveLab review
 * - Comms: Communications
 * - System: Config & logs
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@hive/ui";
import { QueueDashboard } from "./QueueDashboard";
import { ControlPanel } from "./ControlPanel";
import { CommsPanel } from "./CommsPanel";
import { UserManagementDashboard } from "../user-management-dashboard";
import { SpaceManagementDashboard } from "../space-management-dashboard";
import { ContentModerationDashboard } from "../content-moderation-dashboard";
import { ToolReviewDashboard } from "../tool-review-dashboard";
import { SystemHealthDashboard } from "../system-health-dashboard";
import {
  InboxStackIcon,
  Cog6ToothIcon,
  UsersIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  WrenchIcon,
  MegaphoneIcon,
  ServerStackIcon,
} from "@heroicons/react/24/outline";

type Section =
  | "queues"
  | "controls"
  | "users"
  | "spaces"
  | "content"
  | "tools"
  | "comms"
  | "system";

interface NavItem {
  id: Section;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    id: "queues",
    label: "Queues",
    shortLabel: "Queues",
    icon: InboxStackIcon,
    description: "All action items",
  },
  {
    id: "controls",
    label: "Controls",
    shortLabel: "Controls",
    icon: Cog6ToothIcon,
    description: "Feature flags",
  },
  {
    id: "users",
    label: "Users",
    shortLabel: "Users",
    icon: UsersIcon,
    description: "User management",
  },
  {
    id: "spaces",
    label: "Spaces",
    shortLabel: "Spaces",
    icon: BuildingOffice2Icon,
    description: "Space management",
  },
  {
    id: "content",
    label: "Content",
    shortLabel: "Content",
    icon: ShieldCheckIcon,
    description: "Moderation",
  },
  {
    id: "tools",
    label: "Tools",
    shortLabel: "Tools",
    icon: WrenchIcon,
    description: "HiveLab review",
  },
  {
    id: "comms",
    label: "Comms",
    shortLabel: "Comms",
    icon: MegaphoneIcon,
    description: "Communications",
  },
  {
    id: "system",
    label: "System",
    shortLabel: "System",
    icon: ServerStackIcon,
    description: "Config & logs",
  },
];

function OperationsNav({
  activeSection,
  onSectionChange,
}: {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}) {
  return (
    <nav className="flex items-center gap-1 p-1 bg-[#111] rounded-xl border border-white/10 overflow-x-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap
              ${isActive ? "text-[#FFD700]" : "text-white/50 hover:text-white hover:bg-white/5"}
            `}
          >
            {isActive && (
              <motion.div
                layoutId="activeOpsTab"
                className="absolute inset-0 bg-[#FFD700]/10 rounded-lg border border-[#FFD700]/30"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="h-4 w-4 relative z-10" />
            <span className="text-sm font-medium relative z-10 hidden sm:block">
              {item.shortLabel}
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <Badge className="relative z-10 bg-red-500/20 text-red-400 border-red-500/30 border text-xs px-1.5">
                {item.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export function OperationsCenterDashboard() {
  const [activeSection, setActiveSection] = useState<Section>("queues");

  const renderSection = () => {
    switch (activeSection) {
      case "queues":
        return <QueueDashboard />;
      case "controls":
        return <ControlPanel />;
      case "users":
        return <UserManagementDashboard />;
      case "spaces":
        return <SpaceManagementDashboard />;
      case "content":
        return <ContentModerationDashboard />;
      case "tools":
        return <ToolReviewDashboard />;
      case "comms":
        return <CommsPanel />;
      case "system":
        return <SystemHealthDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Operations Center</h1>
                <p className="text-xs text-white/40">Admin Workflow Hub</p>
              </div>
            </div>

            {/* Nav */}
            <OperationsNav
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />

            {/* Spacer for alignment */}
            <div className="w-20 hidden md:block" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

"use client";

/**
 * Command Center Dashboard
 *
 * Executive-grade visualization platform for demos, sales,
 * and university stakeholder presentations.
 *
 * Features:
 * - Real-time pulse metrics
 * - Space ecosystem visualization
 * - Growth timeline
 * - Health/risk dashboard
 * - Impact/success metrics
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCommandStore, selectActiveView, selectIsConnected } from "@/lib/stores";
import { PulseView } from "./PulseView";
import { TerritoryView } from "./TerritoryView";
import { MomentumView } from "./MomentumView";
import { HealthView } from "./HealthView";
import { ImpactView } from "./ImpactView";
import {
  SignalIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

type View = "pulse" | "territory" | "momentum" | "health" | "impact";

interface NavItem {
  id: View;
  label: string;
  icon: React.ElementType;
  description: string;
}

const navItems: NavItem[] = [
  {
    id: "pulse",
    label: "Pulse",
    icon: SignalIcon,
    description: "Real-time heartbeat",
  },
  {
    id: "territory",
    label: "Territory",
    icon: GlobeAltIcon,
    description: "Space ecosystem",
  },
  {
    id: "momentum",
    label: "Momentum",
    icon: ArrowTrendingUpIcon,
    description: "Growth timeline",
  },
  {
    id: "health",
    label: "Health",
    icon: ShieldCheckIcon,
    description: "Risk indicators",
  },
  {
    id: "impact",
    label: "Impact",
    icon: TrophyIcon,
    description: "Success metrics",
  },
];

const viewComponents: Record<View, React.ComponentType> = {
  pulse: PulseView,
  territory: TerritoryView,
  momentum: MomentumView,
  health: HealthView,
  impact: ImpactView,
};

function CommandNav({
  activeView,
  onViewChange,
}: {
  activeView: View;
  onViewChange: (view: View) => void;
}) {
  return (
    <nav className="flex items-center gap-1 p-1 bg-[#111] rounded-xl border border-white/10">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
              ${isActive ? "text-[#FFD700]" : "text-white/50 hover:text-white hover:bg-white/5"}
            `}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[#FFD700]/10 rounded-lg border border-[#FFD700]/30"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="h-4 w-4 relative z-10" />
            <span className="text-sm font-medium relative z-10 hidden md:block">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function ConnectionIndicator() {
  const isConnected = useCommandStore(selectIsConnected);

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`w-2 h-2 rounded-full transition-colors ${
          isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
        }`}
      />
      <span className={isConnected ? "text-green-400" : "text-red-400"}>
        {isConnected ? "Live" : "Offline"}
      </span>
    </div>
  );
}

export function CommandCenterDashboard() {
  const activeView = useCommandStore(selectActiveView);
  const setActiveView = useCommandStore((state) => state.setActiveView);
  const connectSSE = useCommandStore((state) => state.connectSSE);
  const disconnectSSE = useCommandStore((state) => state.disconnectSSE);

  // Connect SSE on mount
  useEffect(() => {
    connectSSE();
    return () => disconnectSSE();
  }, [connectSSE, disconnectSSE]);

  const ActiveViewComponent = viewComponents[activeView];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center">
                <span className="text-black font-bold text-sm">H</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Command Center</h1>
                <p className="text-xs text-white/40">Executive Dashboard</p>
              </div>
            </div>

            {/* Nav */}
            <CommandNav activeView={activeView} onViewChange={setActiveView} />

            {/* Connection status */}
            <ConnectionIndicator />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ActiveViewComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

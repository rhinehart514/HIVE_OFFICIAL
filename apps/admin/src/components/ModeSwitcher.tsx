"use client";

/**
 * Mode Switcher
 *
 * Toggle between Command Center and Operations Center modes.
 * Command Center: Executive-grade visualization for demos/sales
 * Operations Center: Daily admin workflow hub
 */

import { motion } from "framer-motion";
import {
  PresentationChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

type Mode = "command" | "operations";

interface ModeSwitcherProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  className?: string;
}

const modes = [
  {
    id: "command" as const,
    label: "Command",
    shortLabel: "CMD",
    icon: PresentationChartBarIcon,
    description: "Executive visualization",
    color: "text-[#FFD700]",
    bgColor: "bg-[#FFD700]/10",
    borderColor: "border-[#FFD700]/30",
  },
  {
    id: "operations" as const,
    label: "Operations",
    shortLabel: "OPS",
    icon: Cog6ToothIcon,
    description: "Admin workflow hub",
    color: "text-white",
    bgColor: "bg-white/10",
    borderColor: "border-white/30",
  },
];

export function ModeSwitcher({ currentMode, onModeChange, className = "" }: ModeSwitcherProps) {
  return (
    <div className={`flex items-center gap-1 p-1 bg-[#111] rounded-lg border border-white/10 ${className}`}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`
              relative flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200
              ${isActive ? mode.color : "text-white/40 hover:text-white/70"}
            `}
            title={mode.description}
          >
            {isActive && (
              <motion.div
                layoutId="modeIndicator"
                className={`absolute inset-0 ${mode.bgColor} rounded-md border ${mode.borderColor}`}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="h-4 w-4 relative z-10" />
            <span className="text-sm font-medium relative z-10 hidden sm:block">
              {mode.shortLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact Mode Switcher
 *
 * Smaller version for tight spaces, shows only icons.
 */
export function CompactModeSwitcher({ currentMode, onModeChange, className = "" }: ModeSwitcherProps) {
  return (
    <div className={`flex items-center gap-0.5 p-0.5 bg-[#111] rounded-md border border-white/10 ${className}`}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`
              relative p-1.5 rounded transition-all duration-200
              ${isActive ? mode.color : "text-white/40 hover:text-white/70"}
              ${isActive ? mode.bgColor : ""}
            `}
            title={`${mode.label}: ${mode.description}`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Mode Indicator Badge
 *
 * Shows current mode as a badge, useful in headers.
 */
export function ModeIndicator({ mode }: { mode: Mode }) {
  const config = modes.find((m) => m.id === mode) || modes[0];
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
        ${config.bgColor} ${config.color} border ${config.borderColor}
      `}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}

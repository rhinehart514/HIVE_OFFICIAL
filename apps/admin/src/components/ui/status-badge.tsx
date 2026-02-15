"use client";

import React from "react";

type BadgeStatus = "active" | "inactive" | "pending" | "suspended" | "flagged";

const statusStyles: Record<BadgeStatus, { dot: string; text: string; bg: string }> = {
  active: { dot: "bg-green-400", text: "text-green-400", bg: "bg-green-400/10" },
  inactive: { dot: "bg-white/30", text: "text-white/50", bg: "bg-white/[0.06]" },
  pending: { dot: "bg-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400/10" },
  suspended: { dot: "bg-red-400", text: "text-red-400", bg: "bg-red-400/10" },
  flagged: { dot: "bg-orange-400", text: "text-orange-400", bg: "bg-orange-400/10" },
};

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const s = statusStyles[status] || statusStyles.inactive;
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${s.bg}`}>
      <span className={`${dotSize} rounded-full ${s.dot}`} />
      <span className={`${textSize} font-medium capitalize ${s.text}`}>{status}</span>
    </span>
  );
}

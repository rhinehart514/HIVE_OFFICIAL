"use client";

import { Sparkline } from "./sparkline";

interface MetricCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  sparkData?: number[];
  formatValue?: (value: number | string) => string;
}

export function MetricCard({
  title,
  value,
  previousValue,
  sparkData,
  formatValue = (v) => (typeof v === "number" ? v.toLocaleString() : v),
}: MetricCardProps) {
  const numValue = typeof value === "number" ? value : parseFloat(value);
  const trend =
    previousValue !== undefined && previousValue !== 0 && !isNaN(numValue)
      ? ((numValue - previousValue) / previousValue) * 100
      : null;

  return (
    <div
      className="flex items-center justify-between rounded-[16px] border border-white/[0.06] px-5 py-4"
      style={{ backgroundColor: "#080808" }}
    >
      <div className="flex flex-col gap-1">
        <span
          className="text-white/40"
          style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)" }}
        >
          {title}
        </span>
        <span className="text-[32px] font-bold leading-tight text-white">
          {formatValue(value)}
        </span>
        {trend !== null && (
          <span
            className={`text-xs font-medium ${
              trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-white/40"
            }`}
          >
            {trend > 0 ? "↑" : trend < 0 ? "↓" : ""}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      {sparkData && sparkData.length > 1 && (
        <Sparkline data={sparkData} width={80} height={32} />
      )}
    </div>
  );
}

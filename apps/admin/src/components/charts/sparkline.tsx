"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  showArea?: boolean;
  trend?: "up" | "down" | "neutral";
}

export function Sparkline({
  data,
  color,
  height = 32,
  width = 80,
  showArea = true,
  trend,
}: SparklineProps) {
  // Auto-detect trend if not provided
  const detectedTrend =
    trend ||
    (data.length > 1
      ? data[data.length - 1] > data[0]
        ? "up"
        : data[data.length - 1] < data[0]
        ? "down"
        : "neutral"
      : "neutral");

  const trendColors = {
    up: "#22C55E",
    down: "#EF4444",
    neutral: "#6B7280",
  };

  const strokeColor = color || trendColors[detectedTrend];

  // Convert array to chart data format
  const chartData = data.map((value, index) => ({
    index,
    value,
  }));

  const gradientId = `sparkline-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={{ width, height }} className="inline-block">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={showArea ? `url(#${gradientId})` : "none"}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

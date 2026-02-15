"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";

interface SparklineProps {
  data: number[];
  dataKey?: string;
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 32,
  color,
}: SparklineProps) {
  const { chartData, strokeColor, gradientId } = useMemo(() => {
    const id = `spark-${Math.random().toString(36).slice(2, 8)}`;
    if (!data || data.length < 2) {
      return { chartData: [], strokeColor: "rgba(255,255,255,0.5)", gradientId: id };
    }
    const trend = data[data.length - 1]! - data[0]!;
    const auto = trend > 0 ? "#22C55E" : trend < 0 ? "#EF4444" : "rgba(255,255,255,0.5)";
    return {
      chartData: data.map((v, i) => ({ i, v })),
      strokeColor: color || auto,
      gradientId: id,
    };
  }, [data, color]);

  if (chartData.length === 0) {
    return <div style={{ width, height }} className="inline-block" />;
  }

  return (
    <div style={{ width, height }} className="inline-block">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

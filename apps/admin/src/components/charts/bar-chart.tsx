"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BarConfig {
  dataKey: string;
  color?: string;
}

interface BarChartProps {
  data: Record<string, unknown>[];
  bars?: BarConfig[];
  xAxisKey?: string;
  title?: string;
  height?: number;
  layout?: "horizontal" | "vertical";
  color?: string;
}

export function BarChart({
  data,
  bars,
  xAxisKey = "name",
  title,
  height = 240,
  layout = "vertical",
  color = "#FFD700",
}: BarChartProps) {
  const resolvedBars = bars || [{ dataKey: "value", color }];
  if (!data || data.length === 0) {
    return (
      <div className="w-full" style={{ height }}>
        {title && (
          <h4 className="mb-3 text-sm font-medium text-white/50">{title}</h4>
        )}
        <div
          className="flex items-center justify-center rounded-lg border border-white/[0.06] bg-black text-sm text-white/30"
          style={{ height: height - (title ? 32 : 0) }}
        >
          No data
        </div>
      </div>
    );
  }

  const isHorizontal = layout === "horizontal";

  return (
    <div className="w-full">
      {title && (
        <h4 className="mb-3 text-sm font-medium text-white/50">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 8, left: isHorizontal ? 80 : 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            horizontal={!isHorizontal}
            vertical={isHorizontal}
          />
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={75}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xAxisKey}
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "#0a0a0a",
              border: "1px solid rgba(255,215,0,0.2)",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}
            itemStyle={{ color: "#fff" }}
            cursor={{ fill: "rgba(255,215,0,0.06)" }}
          />
          {resolvedBars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.color || color}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              stackId={resolvedBars.length > 1 ? "stack" : undefined}
              animationDuration={600}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

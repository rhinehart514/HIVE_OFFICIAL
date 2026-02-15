"use client";

import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AreaConfig {
  dataKey: string;
  color: string;
  name?: string;
}

interface AreaChartProps {
  data: Record<string, unknown>[];
  dataKey?: string;
  xAxisKey?: string;
  title?: string;
  height?: number;
  formatValue?: (value: number) => string;
  color?: string;
  gradientId?: string;
  areas?: AreaConfig[];
}

export function AreaChart({
  data,
  dataKey = "value",
  xAxisKey = "date",
  title,
  height = 240,
  formatValue = (v) => v.toLocaleString(),
  color = "#FFD700",
  areas,
}: AreaChartProps) {
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

  const areaConfigs: AreaConfig[] = areas || [{ dataKey, color }];

  return (
    <div className="w-full">
      {title && (
        <h4 className="mb-3 text-sm font-medium text-white/50">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            {areaConfigs.map((a) => (
              <linearGradient key={a.dataKey} id={`area-grad-${a.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={a.color} stopOpacity={0.1} />
                <stop offset="100%" stopColor={a.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
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
            tickFormatter={formatValue}
            width={48}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0a0a0a",
              border: "1px solid rgba(255,215,0,0.2)",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}
            itemStyle={{ color: "#fff" }}
            cursor={{ stroke: "rgba(255,215,0,0.3)" }}
          />
          {areaConfigs.map((a) => (
            <Area
              key={a.dataKey}
              type="monotone"
              dataKey={a.dataKey}
              stroke={a.color}
              strokeWidth={2}
              fill={`url(#area-grad-${a.dataKey})`}
              name={a.name}
              animationDuration={800}
              animationEasing="ease-out"
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

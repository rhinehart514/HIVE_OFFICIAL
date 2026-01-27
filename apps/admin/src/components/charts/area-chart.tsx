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

interface DataPoint {
  date?: string;
  name?: string;
  value?: number;
  [key: string]: string | number | undefined;
}

interface AreaConfig {
  dataKey: string;
  color: string;
  name?: string;
}

interface AreaChartProps {
  data: DataPoint[];
  title?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  valueFormatter?: (value: number) => string;
  gradientId?: string;
  areas?: AreaConfig[];
  xAxisKey?: string;
}

export function AreaChart({
  data,
  title,
  color = "#FFD700",
  height = 200,
  showGrid = true,
  valueFormatter = (v) => v.toLocaleString(),
  gradientId = "areaGradient",
  areas,
  xAxisKey = "date",
}: AreaChartProps) {
  // If areas is provided, use multi-area mode; otherwise use single area with "value" dataKey
  const areaConfigs: AreaConfig[] = areas || [{ dataKey: "value", color, name: "Value" }];

  return (
    <div className="w-full">
      {title && (
        <h4 className="mb-3 text-sm font-medium text-white/50">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            {areaConfigs.map((area, index) => (
              <linearGradient key={`gradient-${index}`} id={`${gradientId}-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={area.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={area.color} stopOpacity={0} />
              </linearGradient>
            ))}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
          )}
          <XAxis
            dataKey={xAxisKey === "date" ? "date" : "name"}
            tick={{ fill: "#6B7280", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={valueFormatter}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#141414",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
            labelStyle={{ color: "#9CA3AF" }}
            itemStyle={{ color: "#FAFAFA" }}
          />
          {areaConfigs.map((area, index) => (
            <Area
              key={`area-${index}`}
              type="monotone"
              dataKey={area.dataKey}
              stroke={area.color}
              strokeWidth={2}
              fill={`url(#${gradientId}-${area.dataKey})`}
              name={area.name}
            />
          ))}
          </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

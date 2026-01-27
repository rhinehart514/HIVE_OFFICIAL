"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
}

interface PieChartProps {
  data: DataPoint[];
  title?: string;
  colors?: string[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
}

const DEFAULT_COLORS = [
  "#FFD700", // Gold
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#A855F7", // Purple
  "#F97316", // Orange
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#EAB308", // Yellow
];

export function PieChart({
  data,
  title,
  colors = DEFAULT_COLORS,
  height = 200,
  innerRadius = 50,
  outerRadius = 80,
  showLegend = true,
  valueFormatter = (v) => v.toLocaleString(),
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full">
      {title && (
        <h4 className="mb-3 text-sm font-medium text-white/50">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#141414",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            }}
            labelStyle={{ color: "#9CA3AF" }}
            itemStyle={{ color: "#FAFAFA" }}
            formatter={(value, name) => [
              `${valueFormatter(value as number)} (${(((value as number) / total) * 100).toFixed(1)}%)`,
              name as string,
            ]}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-white/50">{value}</span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

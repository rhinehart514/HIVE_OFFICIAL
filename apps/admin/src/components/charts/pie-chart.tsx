"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface PieChartProps {
  data: Record<string, unknown>[];
  dataKey?: string;
  nameKey?: string;
  title?: string;
  height?: number;
}

const GOLD_PALETTE = [
  "#FFD700",
  "#FFC107",
  "#FFB300",
  "#FFA000",
  "#FF8F00",
  "#E6BE00",
  "#CCB800",
  "#B8A000",
];

export function PieChart({
  data,
  dataKey = "value",
  nameKey = "name",
  title,
  height = 280,
}: PieChartProps) {
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

  const total = data.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0);

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
            cy="45%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey={dataKey}
            nameKey={nameKey}
            stroke="none"
            animationDuration={600}
            label={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={GOLD_PALETTE[i % GOLD_PALETTE.length]} />
            ))}
          </Pie>
          {/* Center label */}
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize={24}
            fontWeight={700}
          >
            {total.toLocaleString()}
          </text>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0a0a0a",
              border: "1px solid rgba(255,215,0,0.2)",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.5)" }}
            itemStyle={{ color: "#fff" }}
            formatter={(value: unknown, name: unknown) => [
              `${Number(value).toLocaleString()} (${total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0}%)`,
              String(name),
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                {value}
              </span>
            )}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';

/**
 * Chart Display Element - Refactored with Core Abstractions
 *
 * Data visualization with:
 * - Bar, Line, and Pie chart types
 * - HIVE color palette
 * - Responsive container
 */

import * as React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { Card, CardContent } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import type { ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface ChartDisplayConfig {
  chartType?: 'bar' | 'line' | 'pie';
  title?: string;
  data?: ChartDataPoint[];
  height?: number;
  showLegend?: boolean;
  dataKey?: string;
  secondaryKey?: string;
}

interface ChartDisplayElementProps extends ElementProps {
  config: ChartDisplayConfig;
  mode?: ElementMode;
}

// ============================================================
// Constants
// ============================================================

/** Default sample data for charts */
const DEFAULT_CHART_DATA: ChartDataPoint[] = [
  { name: 'Week 1', value: 60, secondary: 45 },
  { name: 'Week 2', value: 40, secondary: 55 },
  { name: 'Week 3', value: 80, secondary: 70 },
  { name: 'Week 4', value: 55, secondary: 50 },
  { name: 'Week 5', value: 70, secondary: 65 },
];

/** HIVE color palette for charts - uses CSS custom properties */
const CHART_COLORS = [
  'var(--life-gold)', // Gold - primary
  'var(--hivelab-text-primary)', // White - secondary
  'var(--hivelab-text-secondary)', // Gray
  'var(--hivelab-surface)', // Dark gray
  'var(--hivelab-text-tertiary)', // Medium gray
];

// ============================================================
// Main Chart Display Element
// ============================================================

export function ChartDisplayElement({
  config,
  data,
  mode = 'runtime',
}: ChartDisplayElementProps) {
  const chartType = (config.chartType as string) || 'bar';
  const title = (config.title as string) || 'Analytics';
  const chartData = (data?.chartData as ChartDataPoint[]) ||
                    (config.data as ChartDataPoint[]) ||
                    DEFAULT_CHART_DATA;
  const height = (config.height as number) || 280;
  const showLegend = config.showLegend !== false;
  const dataKey = (config.dataKey as string) || 'value';
  const secondaryKey = (config.secondaryKey as string) || undefined;

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.5)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[0], strokeWidth: 0 }}
                activeDot={{ r: 6, fill: CHART_COLORS[0] }}
              />
              {secondaryKey && (
                <Line
                  type="monotone"
                  dataKey={secondaryKey}
                  stroke={CHART_COLORS[1]}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS[1], strokeWidth: 0 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey={dataKey}
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.5)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              {showLegend && <Legend />}
              <Bar
                dataKey={dataKey}
                fill={CHART_COLORS[0]}
                radius={[4, 4, 0, 0]}
              />
              {secondaryKey && (
                <Bar
                  dataKey={secondaryKey}
                  fill={CHART_COLORS[1]}
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="bg-gradient-to-br from-muted/50 to-muted">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Analytics</p>
            <p className="text-xl font-semibold">{title}</p>
          </div>
          <Badge variant="outline" className="uppercase text-body-xs tracking-wide">
            {chartType} chart
          </Badge>
        </div>

        <div className="w-full">
          {renderChart()}
        </div>

        {!data?.chartData && !config.data && (
          <div className="text-xs text-muted-foreground text-center">
            Sample data shown. Connect analytics data to see real metrics.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ChartDisplayElement;

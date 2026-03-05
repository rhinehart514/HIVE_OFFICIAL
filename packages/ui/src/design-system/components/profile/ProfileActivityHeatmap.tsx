'use client';

/**
 * ProfileActivityHeatmap - Contribution graph
 *
 * - No glass, no heavy shadows
 * - 4px gap (gap-1) on heatmap grid
 * - Gold for high intensity cells
 *
 * @version 6.0.0 - Desktop rebuild, design rules compliant
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';

export interface ActivityContribution {
  date: string;
  count: number;
}

export interface ProfileActivityHeatmapProps {
  contributions: ActivityContribution[];
  totalContributions: number;
  streak?: number;
  className?: string;
}

function getIntensityLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const INTENSITY_COLORS = [
  'rgba(255, 255, 255, 0.04)',
  'rgba(255, 255, 255, 0.12)',
  'rgba(255, 255, 255, 0.25)',
  'rgba(255, 215, 0, 0.35)',
  'rgba(255, 215, 0, 0.8)',
];

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ProfileActivityHeatmap({
  contributions,
  totalContributions,
  streak = 0,
  className,
}: ProfileActivityHeatmapProps) {
  const [hoveredCell, setHoveredCell] = React.useState<ActivityContribution | null>(null);

  const contributionMap = React.useMemo(() => {
    const map = new Map<string, number>();
    contributions.forEach((c) => {
      map.set(c.date, c.count);
    });
    return map;
  }, [contributions]);

  const cells = React.useMemo(() => {
    const result: { date: string; count: number; dayOfWeek: number; week: number }[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363);

    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    for (let week = 0; week < 52; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (week * 7) + day);
        const dateStr = date.toISOString().split('T')[0];
        const count = contributionMap.get(dateStr) || 0;
        result.push({ date: dateStr, count, dayOfWeek: day, week });
      }
    }

    return result;
  }, [contributionMap]);

  const weeks = React.useMemo(() => {
    const result: typeof cells[] = [];
    for (let w = 0; w < 52; w++) {
      result.push(cells.filter((c) => c.week === w));
    }
    return result;
  }, [cells]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-[var(--border-default)]',
        className
      )}
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-baseline gap-3">
              <span
                className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {formatNumber(totalContributions)}
              </span>
              <span
                className="text-sm font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Activity
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              contributions this year
            </p>
          </div>

          {streak > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
              }}
            >
              <span className="text-lg">🔥</span>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: 'var(--life-gold)' }}
              >
                {streak} day streak
              </span>
            </div>
          )}
        </div>

        {/* Heatmap grid — gap-1 (4px) */}
        <div className="relative">
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((cell) => {
                  const intensity = getIntensityLevel(cell.count);
                  const isActive = hoveredCell?.date === cell.date;

                  return (
                    <div
                      key={cell.date}
                      className={cn(
                        'w-3 h-3 rounded-[3px] cursor-pointer transition-opacity duration-100',
                        isActive && 'scale-125'
                      )}
                      style={{
                        backgroundColor: INTENSITY_COLORS[intensity],
                      }}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {hoveredCell && (
            <div
              className="absolute top-0 left-1/2 -translate-y-full -translate-x-1/2 px-3 py-2 rounded-lg text-xs whitespace-nowrap pointer-events-none z-10"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
              }}
            >
              <span className="font-semibold">
                {hoveredCell.count} contribution{hoveredCell.count !== 1 ? 's' : ''}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {' '}on {formatDate(hoveredCell.date)}
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div
          className="flex items-center justify-end gap-2 mt-4 text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span>Less</span>
          {INTENSITY_COLORS.map((color, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-[3px]"
              style={{ backgroundColor: color }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export default ProfileActivityHeatmap;

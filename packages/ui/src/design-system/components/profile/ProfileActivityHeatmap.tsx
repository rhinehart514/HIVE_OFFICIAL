'use client';

/**
 * ProfileActivityHeatmap - Premium Apple-style contribution graph
 *
 * Design Philosophy:
 * - Apple: Large numbers as hero visual, clean grid, subtle polish
 * - GitHub inspiration: Contribution heatmap but more beautiful
 * - HIVE: Gold for high intensity, warm grayscale for rest
 *
 * @version 5.0.0 - Apple widget aesthetic
 */

import * as React from 'react';
import { motion } from 'framer-motion';
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

// Map count to intensity level (0-4)
function getIntensityLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

// Intensity colors - more visible progression
const INTENSITY_COLORS = [
  'rgba(255, 255, 255, 0.04)',  // 0: Empty - subtle grid
  'rgba(255, 255, 255, 0.12)',  // 1: Low
  'rgba(255, 255, 255, 0.25)',  // 2: Medium-low
  'rgba(255, 215, 0, 0.35)',    // 3: Medium-high (gold hint)
  'rgba(255, 215, 0, 0.8)',     // 4: High (gold)
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
  const [isHovered, setIsHovered] = React.useState(false);

  // Build a map of date -> contribution for quick lookup
  const contributionMap = React.useMemo(() => {
    const map = new Map<string, number>();
    contributions.forEach((c) => {
      map.set(c.date, c.count);
    });
    return map;
  }, [contributions]);

  // Generate last 52 weeks of dates (364 days)
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
        result.push({
          date: dateStr,
          count,
          dayOfWeek: day,
          week,
        });
      }
    }

    return result;
  }, [contributionMap]);

  // Group by week for rendering
  const weeks = React.useMemo(() => {
    const result: typeof cells[] = [];
    for (let w = 0; w < 52; w++) {
      result.push(cells.filter((c) => c.week === w));
    }
    return result;
  }, [cells]);

  return (
    <motion.div
      className={cn('relative overflow-hidden', className)}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '24px',
        border: '1px solid var(--border-default)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 40%)',
          borderRadius: '24px',
        }}
      />

      <div className="relative p-6">
        {/* Header - Hero numbers */}
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
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              contributions this year
            </p>
          </div>

          {/* Streak badge */}
          {streak > 0 && (
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-lg">🔥</span>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: 'var(--life-gold)' }}
              >
                {streak} day streak
              </span>
            </motion.div>
          )}
        </div>

        {/* Heatmap grid */}
        <div className="relative">
          <div className="flex gap-[3px] overflow-x-auto pb-2 scrollbar-none">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((cell) => {
                  const intensity = getIntensityLevel(cell.count);
                  const isActive = hoveredCell?.date === cell.date;

                  return (
                    <motion.div
                      key={cell.date}
                      className="w-3 h-3 rounded-[3px] cursor-pointer"
                      style={{
                        backgroundColor: INTENSITY_COLORS[intensity],
                        boxShadow: intensity === 4 ? '0 0 8px rgba(255, 215, 0, 0.4)' : undefined,
                      }}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      whileHover={{ opacity: 0.8 }}
                      animate={{
                        scale: isActive ? 1.3 : 1,
                        opacity: isActive ? 1 : isHovered ? 0.9 : 1,
                      }}
                      transition={{ duration: 0.15 }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {hoveredCell && (
            <motion.div
              className="absolute top-0 left-1/2 -translate-y-full px-3 py-2 rounded-lg text-xs whitespace-nowrap pointer-events-none z-10"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
              initial={{ opacity: 0, y: 4, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0 }}
            >
              <span className="font-semibold">
                {hoveredCell.count} contribution{hoveredCell.count !== 1 ? 's' : ''}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {' '}on {formatDate(hoveredCell.date)}
              </span>
            </motion.div>
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
              style={{
                backgroundColor: color,
                boxShadow: i === 4 ? '0 0 6px rgba(255, 215, 0, 0.3)' : undefined,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </motion.div>
  );
}

export default ProfileActivityHeatmap;

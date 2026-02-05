'use client';

/**
 * ProfileStatsWidget - Compact stats display for bento grid
 *
 * Design Philosophy:
 * - Apple: Large numbers as hero visual, SF-style typography
 * - Linear: Dense, scannable metrics
 * - HIVE: Gold accent for standout stats (streak)
 *
 * @version 1.0.0 - Apple bento widget
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { easingArrays } from '@hive/tokens';

export interface ProfileStatsWidgetProps {
  spacesCount: number;
  toolsCount: number;
  activityCount: number;
  streakDays: number;
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export function ProfileStatsWidget({
  spacesCount,
  toolsCount,
  activityCount,
  streakDays,
  className,
}: ProfileStatsWidgetProps) {
  const stats = [
    {
      label: 'Spaces',
      value: spacesCount,
      icon: '🏠',
      isHighlighted: false,
    },
    {
      label: 'Tools',
      value: toolsCount,
      icon: '🛠️',
      isHighlighted: toolsCount >= 3,
    },
    {
      label: 'Activity',
      value: activityCount,
      icon: '📊',
      isHighlighted: false,
    },
    {
      label: 'Streak',
      value: streakDays,
      icon: '🔥',
      isHighlighted: streakDays > 0,
    },
  ];

  return (
    <motion.div
      className={cn('relative overflow-hidden', className)}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '24px',
        border: '1px solid var(--border-default)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
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

      <div className="relative p-5">
        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4, ease: easingArrays.default }}
            >
              {/* Icon */}
              <span className="text-lg mb-2">{stat.icon}</span>

              {/* Value */}
              <span
                className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight"
                style={{
                  color: stat.isHighlighted ? 'var(--life-gold)' : 'var(--text-primary)',
                }}
              >
                {formatNumber(stat.value)}
              </span>

              {/* Label */}
              <span
                className="text-xs font-medium uppercase tracking-wider mt-1"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default ProfileStatsWidget;

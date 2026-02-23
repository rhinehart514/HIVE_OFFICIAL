'use client';

/**
 * ProfileStatsRow - Premium 4-column stats display
 *
 * Features:
 * - Larger numbers with tabular numerals
 * - Hover lift on individual stats
 * - Gold accent for Activity (earned metric)
 * - Integrated into hero flow
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

export interface ProfileStatsRowProps {
  spaces: number;
  friends: number;
  tools: number;
  activity: number;
  onSpacesClick?: () => void;
  onFriendsClick?: () => void;
  onToolsClick?: () => void;
  onActivityClick?: () => void;
  className?: string;
}

interface StatItemProps {
  value: number;
  label: string;
  onClick?: () => void;
  accent?: boolean;
  delay?: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

function StatItem({ value, label, onClick, accent = false, delay = 0 }: StatItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex-1 flex flex-col items-center justify-center py-4 px-2 transition-all duration-200 rounded-lg',
        onClick && 'cursor-pointer'
      )}
      style={{
        backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ opacity: onClick ? 0.9 : 1 }}
      whileTap={{ opacity: onClick ? 0.8 : 1 }}
    >
      <span
        className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight"
        style={{
          color: accent ? 'var(--life-gold)' : 'var(--text-primary)',
          textShadow: accent ? '0 0 20px rgba(255, 215, 0, 0.3)' : undefined,
        }}
      >
        {formatNumber(value)}
      </span>
      <span
        className="text-xs sm:text-sm mt-1 font-medium uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
    </motion.button>
  );
}

export function ProfileStatsRow({
  spaces,
  friends,
  tools,
  activity,
  onSpacesClick,
  onFriendsClick,
  onToolsClick,
  onActivityClick,
  className,
}: ProfileStatsRowProps) {
  // Build stats list — only show items that have values or are creations (always show)
  const items: { value: number; label: string; onClick?: () => void; accent?: boolean }[] = [];

  if (spaces > 0) items.push({ value: spaces, label: 'Spaces', onClick: onSpacesClick });
  if (friends > 0) items.push({ value: friends, label: 'Friends', onClick: onFriendsClick });
  if (tools > 0) items.push({ value: tools, label: 'Creations', onClick: onToolsClick });
  if (activity > 0) items.push({ value: activity, label: 'Activity', onClick: onActivityClick, accent: true });

  // If nothing to show, don't render
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        'flex items-stretch py-2 px-4',
        className
      )}
    >
      {items.map((item, i) => (
        <StatItem
          key={item.label}
          value={item.value}
          label={item.label}
          onClick={item.onClick}
          accent={item.accent}
          delay={i}
        />
      ))}
    </div>
  );
}

export default ProfileStatsRow;

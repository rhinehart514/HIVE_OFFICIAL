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
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
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
  return (
    <div
      className={cn(
        'flex items-stretch py-2 px-4',
        className
      )}
    >
      <StatItem
        value={spaces}
        label="Spaces"
        onClick={onSpacesClick}
        delay={0}
      />
      <StatItem
        value={friends}
        label="Friends"
        onClick={onFriendsClick}
        delay={1}
      />
      <StatItem
        value={tools}
        label="Tools"
        onClick={onToolsClick}
        delay={2}
      />
      <StatItem
        value={activity}
        label="Activity"
        onClick={onActivityClick}
        accent={activity > 0}
        delay={3}
      />
    </div>
  );
}

export default ProfileStatsRow;

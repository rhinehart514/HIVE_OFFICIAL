'use client';

/**
 * ProfileStatsRow - 4-column stats display
 *
 * - No stagger animations, no spring physics
 * - No text-shadow glow
 * - Simple hover: bg-white/[0.05]
 * - transition-colors duration-100 only
 *
 * @version 2.0.0 - Desktop rebuild, design rules compliant
 */

import * as React from 'react';
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

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

function StatItem({
  value,
  label,
  onClick,
  accent = false,
}: {
  value: number;
  label: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-lg',
        'transition-colors duration-100',
        onClick && 'cursor-pointer hover:bg-white/[0.05]'
      )}
    >
      <span
        className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight"
        style={{
          color: accent ? 'var(--life-gold)' : 'var(--text-primary)',
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
    </button>
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
  const items: { value: number; label: string; onClick?: () => void; accent?: boolean }[] = [];

  if (spaces > 0) items.push({ value: spaces, label: 'Spaces', onClick: onSpacesClick });
  if (friends > 0) items.push({ value: friends, label: 'Friends', onClick: onFriendsClick });
  if (tools > 0) items.push({ value: tools, label: 'Creations', onClick: onToolsClick });
  if (activity > 0) items.push({ value: activity, label: 'Reach', onClick: onActivityClick, accent: true });

  if (items.length === 0) return null;

  return (
    <div className={cn('flex items-stretch py-2 px-4', className)}>
      {items.map((item) => (
        <StatItem
          key={item.label}
          value={item.value}
          label={item.label}
          onClick={item.onClick}
          accent={item.accent}
        />
      ))}
    </div>
  );
}

export default ProfileStatsRow;

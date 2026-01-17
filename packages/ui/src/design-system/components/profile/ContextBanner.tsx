'use client';

/**
 * ContextBanner - "You're both in..." anticipatory context display
 *
 * Shows shared context between viewer and profile owner:
 * - Shared spaces
 * - Mutual friends
 * - Builder context
 *
 * Only renders if there's shared context to show.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

export interface ContextBannerProps {
  sharedSpaces?: string[];
  mutualFriends?: number;
  bothBuilders?: boolean;
  toolRuns?: number;
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export function ContextBanner({
  sharedSpaces = [],
  mutualFriends = 0,
  bothBuilders = false,
  toolRuns = 0,
  className,
}: ContextBannerProps) {
  // Build context message
  const parts: string[] = [];

  // Shared spaces context
  if (sharedSpaces.length === 1) {
    parts.push(`You're both in ${sharedSpaces[0]}`);
  } else if (sharedSpaces.length > 1) {
    parts.push(`You're both in ${sharedSpaces[0]} and ${sharedSpaces.length - 1} more`);
  }

  // Mutual friends
  if (mutualFriends > 0) {
    parts.push(`${mutualFriends} mutual friend${mutualFriends !== 1 ? 's' : ''}`);
  }

  // Builder context
  if (bothBuilders && toolRuns > 0) {
    parts.push(`Their tools have ${formatNumber(toolRuns)} runs`);
  }

  // Don't render if no context
  if (parts.length === 0) {
    return null;
  }

  // Determine icon based on context type
  const icon = bothBuilders && toolRuns > 0 ? '🛠️' : '✨';
  const message = parts.join(' · ');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-lg',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderLeft: '3px solid var(--life-gold)',
      }}
    >
      <span className="text-sm">{icon}</span>
      <span
        className="text-sm"
        style={{ color: 'var(--text-primary)' }}
      >
        {message}
      </span>
    </motion.div>
  );
}

export default ContextBanner;

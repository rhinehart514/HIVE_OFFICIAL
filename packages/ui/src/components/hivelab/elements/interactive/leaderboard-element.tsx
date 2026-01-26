'use client';

/**
 * Leaderboard Element - Refactored with Core Abstractions
 *
 * Ranked standings display with:
 * - useLeaderboardState hook for state management
 * - StateContainer for loading/error/empty states
 * - Animated rank changes
 */

import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Button } from '../../../../design-system/primitives';
import { Card, CardContent } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { useLeaderboardState, ElementEmpty, type ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface LeaderboardConfig {
  title?: string;
  maxEntries?: number;
  showRank?: boolean;
  showScore?: boolean;
  showSubtitle?: boolean;
  scoreLabel?: string;
  highlightTop?: number;
}

interface LeaderboardElementProps extends ElementProps {
  config: LeaderboardConfig;
  mode?: ElementMode;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
  subtitle?: string;
}

// ============================================================
// Rank Icon Component
// ============================================================

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <TrophyIcon className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <TrophyIcon className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <TrophyIcon className="h-5 w-5 text-amber-600" />;
  return <span className="w-5 text-center text-muted-foreground font-mono">{rank}</span>;
}

// ============================================================
// Leaderboard Entry Row
// ============================================================

interface EntryRowProps {
  entry: LeaderboardEntry;
  index: number;
  showScore: boolean;
  scoreLabel: string;
  showSubtitle: boolean;
  highlightTop: number;
}

function EntryRow({ entry, index, showScore, scoreLabel, showSubtitle, highlightTop }: EntryRowProps) {
  const isHighlighted = entry.rank <= highlightTop;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, ...springPresets.snappy }}
      className={`px-6 py-3 flex items-center gap-4 ${
        isHighlighted ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''
      }`}
    >
      {/* Rank */}
      <motion.div
        className="flex items-center justify-center w-8"
        initial={isHighlighted ? { scale: 0, rotate: -180 } : {}}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.05 + 0.1, ...springPresets.bouncy }}
      >
        <RankIcon rank={entry.rank} />
      </motion.div>

      {/* Name & Subtitle */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{entry.name}</div>
        {showSubtitle && entry.subtitle && (
          <div className="text-xs text-muted-foreground">{entry.subtitle}</div>
        )}
      </div>

      {/* Score */}
      {showScore && (
        <motion.div
          className="text-right"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.15 }}
        >
          <div className="font-semibold tabular-nums">
            {entry.score.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">{scoreLabel}</div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================
// Empty State
// ============================================================

function LeaderboardEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springPresets.gentle}
      className="px-6 py-12 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/15 to-amber-500/10 flex items-center justify-center mx-auto mb-4"
      >
        <TrophyIcon className="h-8 w-8 text-yellow-500/60" />
      </motion.div>
      <p className="font-medium text-foreground mb-1">No entries yet</p>
      <p className="text-sm text-muted-foreground">Be the first to score!</p>
    </motion.div>
  );
}

// ============================================================
// Main Leaderboard Element
// ============================================================

export function LeaderboardElement({
  id,
  config,
  data,
  onAction,
  sharedState,
  userState,
  context,
  mode = 'runtime',
}: LeaderboardElementProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use core state hook
  const leaderboardState = useLeaderboardState(id, sharedState, userState, context?.userId);

  // Config with defaults
  const maxEntries = config.maxEntries ?? 10;
  const showRank = config.showRank !== false;
  const showScore = config.showScore !== false;
  const showSubtitle = config.showSubtitle ?? false;
  const scoreLabel = config.scoreLabel ?? 'pts';
  const highlightTop = config.highlightTop ?? 3;

  // Build entries from state or legacy data
  const entries = useMemo((): LeaderboardEntry[] => {
    // Prefer state from hook
    if (leaderboardState.value?.entries.length) {
      return leaderboardState.value.entries.map(e => ({
        id: e.userId,
        name: e.displayName,
        score: e.score,
        rank: e.rank,
      }));
    }

    // Fall back to legacy data
    const serverEntries = data?.entries as Record<string, { score: number; name?: string }> | undefined;
    if (serverEntries && Object.keys(serverEntries).length > 0) {
      return Object.entries(serverEntries)
        .map(([entryId, entry]) => ({
          id: entryId,
          name: entry.name || `User ${entryId.slice(0, 6)}`,
          score: entry.score || 0,
          rank: 0,
        }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
    }

    return [];
  }, [leaderboardState.value?.entries, data?.entries]);

  const displayEntries = entries.slice(0, maxEntries);
  const hasData = displayEntries.length > 0;

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    onAction?.('refresh', {});
    setTimeout(() => setIsRefreshing(false), 500);
  }, [onAction]);

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">{config.title || 'Leaderboard'}</span>
        </div>

        {/* Entries */}
        <div className="divide-y divide-border">
          {hasData ? (
            displayEntries.map((entry, index) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                index={index}
                showScore={showScore}
                scoreLabel={scoreLabel}
                showSubtitle={showSubtitle}
                highlightTop={highlightTop}
              />
            ))
          ) : (
            <LeaderboardEmpty />
          )}
        </div>

        {/* View All Button */}
        {hasData && entries.length > maxEntries && (
          <div className="px-6 py-3 border-t border-border text-center">
            <Button variant="ghost" size="sm">
              View all {entries.length} entries
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LeaderboardElement;

'use client';

/**
 * BracketCard — Native bracket/tournament format shell.
 *
 * Compact layout: current matchup to vote on + round indicator.
 * Expand: full bracket tree (future).
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOTION, CARD } from '@hive/tokens';
import type { ShellComponentProps, BracketConfig, BracketState, BracketMatchup } from '@/lib/shells/types';

// ============================================================================
// HELPERS
// ============================================================================

function getActiveMatchup(matchups: BracketMatchup[], currentRound: number): BracketMatchup | null {
  return matchups.find((m) => m.round === currentRound && !m.winner) ?? null;
}

function getMatchupVoteCount(matchup: BracketMatchup): { a: number; b: number } {
  const votes = Object.values(matchup.votes || {});
  return {
    a: votes.filter((v) => v === 'A').length,
    b: votes.filter((v) => v === 'B').length,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

function BracketCard({
  config,
  state,
  currentUserId,
  onAction,
  compact = true,
}: ShellComponentProps<BracketConfig, BracketState>) {
  const { topic, entries } = config;
  const [expanded, setExpanded] = useState(false);

  const matchups = state?.matchups ?? [];
  const currentRound = state?.currentRound ?? 1;
  const totalRounds = state?.totalRounds ?? Math.ceil(Math.log2(entries.length));
  const winner = state?.winner;
  const completed = state?.completed ?? false;

  const activeMatchup = useMemo(
    () => getActiveMatchup(matchups, currentRound),
    [matchups, currentRound]
  );

  const myVote = activeMatchup?.votes?.[currentUserId] ?? null;
  const hasVoted = myVote !== null;

  const handleVote = (choice: 'A' | 'B') => {
    if (!activeMatchup || hasVoted) return;
    onAction({ type: 'bracket_vote', matchupId: activeMatchup.id, choice });
  };

  const voteCounts = activeMatchup ? getMatchupVoteCount(activeMatchup) : { a: 0, b: 0 };
  const totalMatchupVotes = voteCounts.a + voteCounts.b;

  // Winner celebration
  if (completed && winner) {
    return (
      <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'} text-center`}>
        <p className="text-xs text-white/30 mb-1">{topic}</p>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', ...MOTION.spring.bouncy }}
        >
          <span className="text-2xl mb-2 block">&#x1F3C6;</span>
          <p className="text-[#FFD700] font-medium text-base">{winner}</p>
        </motion.div>
        <p className="text-xs text-white/30 mt-2">{entries.length} entries \u00B7 {totalRounds} rounds</p>
      </div>
    );
  }

  // No active matchup (waiting for round to progress or no state yet)
  if (!activeMatchup) {
    return (
      <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
        <p className="text-xs text-white/30 mb-1">{topic}</p>
        <p className="text-white/50 text-sm">Waiting for next matchup...</p>
        <p className="text-xs text-white/30 mt-2">
          Round {currentRound} of {totalRounds} \u00B7 {entries.length} entries
        </p>
      </div>
    );
  }

  return (
    <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-white/30">{topic}</p>
        <span className="text-xs text-white/30">
          Round {currentRound}/{totalRounds}
        </span>
      </div>

      {/* Matchup */}
      <div className="flex gap-2">
        {(['A', 'B'] as const).map((choice) => {
          const entry = choice === 'A' ? activeMatchup.entryA : activeMatchup.entryB;
          const isMyChoice = myVote === choice;
          const count = choice === 'A' ? voteCounts.a : voteCounts.b;
          const pct = totalMatchupVotes > 0 ? Math.round((count / totalMatchupVotes) * 100) : 0;

          return (
            <button
              key={choice}
              onClick={() => handleVote(choice)}
              disabled={hasVoted}
              className={`
                flex-1 relative overflow-hidden rounded-xl p-3 text-center text-sm
                transition-all duration-200
                ${hasVoted ? 'cursor-default' : 'cursor-pointer hover:bg-white/[0.06]'}
                ${isMyChoice
                  ? 'border border-[#FFD700]/40 bg-[#FFD700]/[0.06]'
                  : 'border border-white/[0.08] bg-white/[0.02]'
                }
              `}
            >
              {hasVoted && (
                <motion.div
                  className={`absolute inset-y-0 left-0 ${
                    isMyChoice ? 'bg-[#FFD700]/[0.10]' : 'bg-white/[0.03]'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.3, ease: MOTION.ease.default as unknown as string }}
                />
              )}
              <span className={`relative z-10 block truncate ${isMyChoice ? 'text-[#FFD700]' : 'text-white/80'}`}>
                {entry}
              </span>
              {hasVoted && (
                <motion.span
                  className={`relative z-10 text-xs mt-1 block ${isMyChoice ? 'text-[#FFD700]/70' : 'text-white/30'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {pct}%
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-white/30">
          {totalMatchupVotes} vote{totalMatchupVotes !== 1 ? 's' : ''}
        </span>
        {!compact && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            {expanded ? 'Hide bracket' : 'Show bracket'}
          </button>
        )}
      </div>

      {/* Expanded bracket view (future: full tree viz) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-3 border-t border-white/[0.06] pt-3"
          >
            <div className="grid grid-cols-2 gap-1">
              {entries.map((entry, i) => (
                <div
                  key={i}
                  className={`text-xs px-2 py-1 rounded-lg ${
                    entry === winner
                      ? 'text-[#FFD700] bg-[#FFD700]/[0.06]'
                      : 'text-white/40 bg-white/[0.02]'
                  }`}
                >
                  {entry}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BracketCard;

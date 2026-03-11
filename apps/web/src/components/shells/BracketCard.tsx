'use client';

/**
 * BracketCard — Native bracket/tournament format shell.
 *
 * Split-panel matchups: winner side gets stronger fill.
 * Current matchup is tappable, past matchups are display-only.
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOTION, CARD } from '@hive/tokens';
import type { ShellComponentProps, BracketConfig, BracketState, BracketMatchup } from '@/lib/shells/types';

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
        <p className="text-[12px] text-white/30 mb-1">{topic}</p>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', ...MOTION.spring.bouncy }}
        >
          <span className="text-2xl mb-2 block">&#x1F3C6;</span>
          <p className="text-[#FFD700] font-medium text-base">{winner}</p>
        </motion.div>
        <p className="text-[12px] text-white/30 mt-2">{entries.length} entries · {totalRounds} rounds</p>
      </div>
    );
  }

  // No active matchup
  if (!activeMatchup) {
    return (
      <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
        <p className="text-[12px] text-white/30 mb-1">{topic}</p>
        <p className="text-white/50 text-sm">Waiting for next matchup...</p>
        <p className="text-[12px] text-white/30 mt-2">
          Round {currentRound} of {totalRounds} · {entries.length} entries
        </p>
      </div>
    );
  }

  return (
    <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-white text-sm font-medium">{topic}</p>
        <span className="font-mono text-[11px] text-white/30 tabular-nums">
          {currentRound}/{totalRounds}
        </span>
      </div>

      {/* Matchup — split panel */}
      <div className="flex overflow-hidden rounded-xl border border-white/[0.10]">
        {(['A', 'B'] as const).map((choice) => {
          const entry = choice === 'A' ? activeMatchup.entryA : activeMatchup.entryB;
          const isMyChoice = myVote === choice;
          const count = choice === 'A' ? voteCounts.a : voteCounts.b;
          const pct = totalMatchupVotes > 0 ? Math.round((count / totalMatchupVotes) * 100) : 0;
          const isLeading = totalMatchupVotes > 0 && count > (choice === 'A' ? voteCounts.b : voteCounts.a);

          return (
            <button
              key={choice}
              onClick={() => handleVote(choice)}
              disabled={hasVoted}
              className={`
                flex-1 relative overflow-hidden p-3 text-center
                transition-colors duration-100
                ${hasVoted ? 'cursor-default' : 'cursor-pointer hover:bg-white/[0.05]'}
                ${isMyChoice
                  ? 'bg-[#FFD700]/[0.10]'
                  : hasVoted && isLeading
                    ? 'bg-white/[0.05]'
                    : 'bg-white/[0.03]'
                }
                ${choice === 'A' ? 'border-r border-white/[0.05]' : ''}
              `}
            >
              <span className={`block text-sm truncate ${
                isMyChoice
                  ? 'text-[#FFD700] font-medium'
                  : hasVoted && isLeading
                    ? 'text-white font-medium'
                    : hasVoted
                      ? 'text-white/30'
                      : 'text-white/70'
              }`}>
                {entry}
              </span>
              {hasVoted && (
                <motion.span
                  className={`block font-mono text-[12px] tabular-nums mt-1 ${
                    isMyChoice ? 'text-[#FFD700]/70' : isLeading ? 'text-white/50' : 'text-white/30'
                  }`}
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
        <span className="text-[12px] text-white/30">
          {totalMatchupVotes} vote{totalMatchupVotes !== 1 ? 's' : ''}
        </span>
        {!compact && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[12px] text-white/30 hover:text-white/50 transition-colors duration-100"
          >
            {expanded ? 'Hide bracket' : 'Show bracket'}
          </button>
        )}
      </div>

      {/* Expanded bracket view */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-3 border-t border-white/[0.05] pt-3"
          >
            <div className="grid grid-cols-2 gap-1">
              {entries.map((entry, i) => (
                <div
                  key={i}
                  className={`text-[12px] px-2 py-1.5 rounded-lg ${
                    entry === winner
                      ? 'text-[#FFD700] bg-[#FFD700]/[0.05]'
                      : 'text-white/30 bg-white/[0.03]'
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

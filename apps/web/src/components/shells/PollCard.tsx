'use client';

/**
 * PollCard — Native poll format shell.
 *
 * Compact layout (~150px) for stream: question + tappable option bars
 * with vote percentage fill animation. Gold accent on selected vote.
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOTION, CARD } from '@hive/tokens';
import type { ShellComponentProps, PollConfig, PollState } from '@/lib/shells/types';

// ============================================================================
// COMPONENT
// ============================================================================

function PollCard({
  config,
  state,
  currentUserId,
  isCreator,
  onAction,
  compact = true,
}: ShellComponentProps<PollConfig, PollState>) {
  const { question, options } = config;
  const votes = state?.votes ?? {};
  const voteCounts = state?.voteCounts ?? options.map(() => 0);
  const closed = state?.closed ?? false;

  const myVote = votes[currentUserId]
    ? typeof votes[currentUserId] === 'object'
      ? votes[currentUserId].optionIndex
      : votes[currentUserId]
    : null;

  const hasVoted = myVote !== null;

  const totalVotes = useMemo(
    () => voteCounts.reduce((sum, c) => sum + c, 0),
    [voteCounts]
  );

  const handleVote = (idx: number) => {
    if (closed || hasVoted) return;
    onAction({ type: 'poll_vote', optionIndex: idx });
  };

  const handleClose = () => {
    onAction({ type: 'poll_close' });
  };

  return (
    <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      {/* Question */}
      <p className="text-white/90 text-sm font-medium mb-3 leading-snug">{question}</p>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {options.map((option, idx) => {
          const count = voteCounts[idx] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isMyVote = myVote === idx;
          const showResults = hasVoted || closed;

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={closed || hasVoted}
              className={`
                relative overflow-hidden rounded-xl h-10 px-3 text-left text-sm
                transition-all duration-200
                ${showResults ? 'cursor-default' : 'cursor-pointer hover:bg-white/[0.06]'}
                ${isMyVote
                  ? 'border border-[#FFD700]/40 bg-[#FFD700]/[0.06]'
                  : 'border border-white/[0.08] bg-white/[0.02]'
                }
                disabled:cursor-default
              `}
            >
              {/* Fill bar */}
              {showResults && (
                <motion.div
                  className={`absolute inset-y-0 left-0 ${
                    isMyVote ? 'bg-[#FFD700]/[0.12]' : 'bg-white/[0.04]'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{
                    duration: MOTION.duration.standard / 1000,
                    ease: MOTION.ease.default as unknown as string,
                  }}
                />
              )}

              {/* Content */}
              <span className="relative z-10 flex items-center justify-between h-full">
                <span className={`truncate ${isMyVote ? 'text-[#FFD700]' : 'text-white/80'}`}>
                  {option}
                </span>
                {showResults && (
                  <motion.span
                    className={`text-xs ml-2 shrink-0 ${isMyVote ? 'text-[#FFD700]/80' : 'text-white/40'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    {pct}%
                  </motion.span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-white/30">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          {closed && ' \u00B7 Closed'}
        </span>

        {isCreator && !closed && (
          <button
            onClick={handleClose}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Close poll
          </button>
        )}
      </div>
    </div>
  );
}

export default PollCard;

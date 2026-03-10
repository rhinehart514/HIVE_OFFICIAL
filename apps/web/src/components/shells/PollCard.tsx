'use client';

/**
 * PollCard — Native poll format shell.
 *
 * Tappable option bars with vote percentage fill animation.
 * Leading option gets stronger fill. Gold accent on user's vote.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MOTION, CARD } from '@hive/tokens';
import type { ShellComponentProps, PollConfig, PollState } from '@/lib/shells/types';

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

  const leadingIdx = useMemo(() => {
    if (totalVotes === 0) return -1;
    let maxIdx = 0;
    voteCounts.forEach((c, i) => { if (c > voteCounts[maxIdx]) maxIdx = i; });
    return maxIdx;
  }, [voteCounts, totalVotes]);

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
      <p className="text-white text-sm font-medium mb-3 leading-snug">{question}</p>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {options.map((option, idx) => {
          const count = voteCounts[idx] ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isMyVote = myVote === idx;
          const isLeading = idx === leadingIdx && totalVotes > 0;
          const showResults = hasVoted || closed;

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={closed || hasVoted}
              className={`
                relative overflow-hidden rounded-xl h-10 text-left text-sm
                transition-colors duration-100
                ${showResults ? 'cursor-default' : 'cursor-pointer hover:bg-white/[0.05]'}
                ${isMyVote
                  ? 'border border-[#FFD700]/40 bg-[#FFD700]/[0.05]'
                  : 'border border-white/[0.10] bg-white/[0.03]'
                }
                disabled:cursor-default
              `}
            >
              {/* Fill bar */}
              {showResults && (
                <motion.div
                  className={`absolute inset-y-0 left-0 rounded-xl ${
                    isMyVote
                      ? 'bg-[#FFD700]/[0.15]'
                      : isLeading
                        ? 'bg-white/[0.10]'
                        : 'bg-white/[0.05]'
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
              <span className="relative z-10 flex items-center justify-between h-full px-3">
                <span className={`truncate ${
                  isMyVote
                    ? 'text-[#FFD700] font-medium'
                    : showResults && isLeading
                      ? 'text-white font-medium'
                      : 'text-white/70'
                }`}>
                  {option}
                </span>
                {showResults && (
                  <motion.span
                    className={`font-mono text-[12px] tabular-nums ml-2 shrink-0 ${
                      isMyVote
                        ? 'text-[#FFD700]/80'
                        : isLeading
                          ? 'text-white/50'
                          : 'text-white/30'
                    }`}
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
        <span className="text-[12px] text-white/30">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          {closed && ' · Closed'}
        </span>

        {isCreator && !closed && (
          <button
            onClick={handleClose}
            className="text-[12px] text-white/30 hover:text-white/50 transition-colors duration-100"
          >
            Close poll
          </button>
        )}
      </div>
    </div>
  );
}

export default PollCard;

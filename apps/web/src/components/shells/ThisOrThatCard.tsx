'use client';

/**
 * ThisOrThatCard — Two choices, pick one.
 *
 * Two panels side by side, tap to choose, percentage split after.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOTION, CARD } from '@hive/tokens';
import type { ShellComponentProps, ThisOrThatConfig, ThisOrThatState } from '@/lib/shells/types';

function ThisOrThatCard({
  config,
  state,
  currentUserId,
  onAction,
  compact = true,
}: ShellComponentProps<ThisOrThatConfig, ThisOrThatState>) {
  const { pairs } = config;
  const votes = state?.votes ?? {};
  const counts = state?.counts ?? pairs.map(() => ({ a: 0, b: 0 }));

  const [currentIdx, setCurrentIdx] = useState(0);

  const pair = pairs[currentIdx];
  if (!pair) return null;

  const myVote = votes[currentIdx]?.[currentUserId] ?? null;
  const pairCounts = counts[currentIdx] ?? { a: 0, b: 0 };
  const total = pairCounts.a + pairCounts.b;
  const aPct = total > 0 ? Math.round((pairCounts.a / total) * 100) : 50;

  const handleVote = (choice: 'a' | 'b') => {
    if (myVote) return;
    onAction({ type: 'thisorthat_vote', pairIdx: currentIdx, choice });
  };

  return (
    <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      {/* Progress dots */}
      {pairs.length > 1 && (
        <div className="flex gap-1 mb-3 justify-center">
          {pairs.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-100 ${
                i === currentIdx ? 'bg-[#FFD700]' : i < currentIdx ? 'bg-white/30' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      )}

      {/* Two panels */}
      <div className="flex gap-2 min-h-[100px]">
        <button
          onClick={() => handleVote('a')}
          disabled={!!myVote}
          className={`
            flex-1 rounded-2xl border p-4 flex flex-col items-center justify-center text-center
            transition-colors duration-100
            ${myVote === 'a'
              ? 'border-[#FFD700]/40 bg-[#FFD700]/[0.05]'
              : myVote
                ? 'border-white/[0.05] bg-white/[0.02]'
                : 'border-white/[0.10] bg-white/[0.03] hover:bg-white/[0.05] cursor-pointer'
            }
          `}
        >
          <span className={`text-sm font-medium ${myVote === 'a' ? 'text-[#FFD700]' : 'text-white'}`}>
            {pair.a}
          </span>
          {myVote && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-[12px] text-white/30 mt-2"
            >
              {aPct}%
            </motion.span>
          )}
        </button>

        <div className="flex items-center">
          <span className="text-[11px] text-white/30 font-mono">or</span>
        </div>

        <button
          onClick={() => handleVote('b')}
          disabled={!!myVote}
          className={`
            flex-1 rounded-2xl border p-4 flex flex-col items-center justify-center text-center
            transition-colors duration-100
            ${myVote === 'b'
              ? 'border-[#FFD700]/40 bg-[#FFD700]/[0.05]'
              : myVote
                ? 'border-white/[0.05] bg-white/[0.02]'
                : 'border-white/[0.10] bg-white/[0.03] hover:bg-white/[0.05] cursor-pointer'
            }
          `}
        >
          <span className={`text-sm font-medium ${myVote === 'b' ? 'text-[#FFD700]' : 'text-white'}`}>
            {pair.b}
          </span>
          {myVote && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-[12px] text-white/30 mt-2"
            >
              {100 - aPct}%
            </motion.span>
          )}
        </button>
      </div>

      {/* Navigation + footer */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-[12px] text-white/30">
          {total} vote{total !== 1 ? 's' : ''}
        </span>
        {pairs.length > 1 && (
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="text-[12px] text-white/30 hover:text-white/50 disabled:opacity-30 transition-colors duration-100"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentIdx(Math.min(pairs.length - 1, currentIdx + 1))}
              disabled={currentIdx === pairs.length - 1}
              className="text-[12px] text-white/30 hover:text-white/50 disabled:opacity-30 transition-colors duration-100"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThisOrThatCard;

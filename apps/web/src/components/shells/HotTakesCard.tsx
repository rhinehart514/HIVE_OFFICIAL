'use client';

/**
 * HotTakesCard — Agree or disagree on statements.
 *
 * Statement centered, agree/disagree pills below, split bar after voting.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOTION, CARD } from '@hive/tokens';
import type { ShellComponentProps, HotTakesConfig, HotTakesState } from '@/lib/shells/types';

function HotTakesCard({
  config,
  state,
  currentUserId,
  onAction,
  compact = true,
}: ShellComponentProps<HotTakesConfig, HotTakesState>) {
  const { statements } = config;
  const reactions = state?.reactions ?? {};
  const agreeCounts = state?.agreeCounts ?? statements.map(() => 0);
  const disagreeCounts = state?.disagreeCounts ?? statements.map(() => 0);

  const [currentIdx, setCurrentIdx] = useState(0);

  const myReaction = (idx: number) => {
    const stmtReactions = reactions[idx];
    if (!stmtReactions) return null;
    return stmtReactions[currentUserId] ?? null;
  };

  const handleReact = (reaction: 'agree' | 'disagree') => {
    if (myReaction(currentIdx)) return;
    onAction({ type: 'hottake_react', statementIdx: currentIdx, reaction });
  };

  const stmt = statements[currentIdx];
  if (!stmt) return null;

  const reacted = myReaction(currentIdx);
  const agreeCount = agreeCounts[currentIdx] ?? 0;
  const disagreeCount = disagreeCounts[currentIdx] ?? 0;
  const total = agreeCount + disagreeCount;
  const agreePct = total > 0 ? Math.round((agreeCount / total) * 100) : 50;

  return (
    <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      {/* Progress dots */}
      {statements.length > 1 && (
        <div className="flex gap-1 mb-3 justify-center">
          {statements.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-100 ${
                i === currentIdx ? 'bg-[#FFD700]' : i < currentIdx ? 'bg-white/30' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      )}

      {/* Statement */}
      <p className="text-white text-[15px] font-medium text-center leading-snug mb-4 min-h-[48px] flex items-center justify-center">
        "{stmt}"
      </p>

      {/* Agree/Disagree pills */}
      {!reacted ? (
        <div className="flex gap-2">
          <button
            onClick={() => handleReact('agree')}
            className="flex-1 py-2.5 rounded-full border border-emerald-500/20 text-emerald-400 text-sm font-medium
              hover:bg-emerald-500/10 transition-colors duration-100"
          >
            Agree
          </button>
          <button
            onClick={() => handleReact('disagree')}
            className="flex-1 py-2.5 rounded-full border border-red-400/20 text-red-400 text-sm font-medium
              hover:bg-red-400/10 transition-colors duration-100"
          >
            Disagree
          </button>
        </div>
      ) : (
        <div>
          {/* Split bar */}
          <div className="h-8 rounded-xl overflow-hidden flex mb-2">
            <motion.div
              className="bg-emerald-500/20 flex items-center justify-center"
              initial={{ width: '50%' }}
              animate={{ width: `${agreePct}%` }}
              transition={{ duration: MOTION.duration.standard / 1000 }}
            >
              <span className="text-[12px] font-mono text-emerald-400">{agreePct}%</span>
            </motion.div>
            <motion.div
              className="bg-red-400/20 flex items-center justify-center"
              initial={{ width: '50%' }}
              animate={{ width: `${100 - agreePct}%` }}
              transition={{ duration: MOTION.duration.standard / 1000 }}
            >
              <span className="text-[12px] font-mono text-red-400">{100 - agreePct}%</span>
            </motion.div>
          </div>
          <p className="text-[11px] text-white/30 text-center">
            {total} response{total !== 1 ? 's' : ''} · You {reacted === 'agree' ? 'agreed' : 'disagreed'}
          </p>
        </div>
      )}

      {/* Navigation */}
      {statements.length > 1 && (
        <div className="flex justify-between mt-3">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="text-[12px] text-white/30 hover:text-white/50 disabled:opacity-30 transition-colors duration-100"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentIdx(Math.min(statements.length - 1, currentIdx + 1))}
            disabled={currentIdx === statements.length - 1}
            className="text-[12px] text-white/30 hover:text-white/50 disabled:opacity-30 transition-colors duration-100"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default HotTakesCard;

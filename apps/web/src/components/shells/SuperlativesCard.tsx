'use client';

/**
 * SuperlativesCard — Nominate people for award categories.
 *
 * Step through categories, type name or tap top nominations, see winners.
 */

import { useState } from 'react';
import { CARD } from '@hive/tokens';
import type { ShellComponentProps, SuperlativesConfig, SuperlativesState } from '@/lib/shells/types';

function SuperlativesCard({
  config,
  state,
  currentUserId,
  onAction,
  compact = true,
}: ShellComponentProps<SuperlativesConfig, SuperlativesState>) {
  const { title, categories } = config;
  const nominations = state?.nominations ?? {};
  const tallies = state?.tallies ?? {};
  const participantCount = state?.participantCount ?? 0;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState('');

  const category = categories[currentIdx];
  if (!category) return null;

  const myNomination = nominations[currentIdx]?.[currentUserId] ?? null;
  const categoryTallies = tallies[currentIdx] ?? {};
  const topNominees = Object.entries(categoryTallies)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const handleNominate = (name: string) => {
    if (!name.trim() || myNomination) return;
    onAction({ type: 'superlative_nominate', categoryIdx: currentIdx, name: name.trim() });
    setInputValue('');
  };

  return (
    <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      <p className="text-white text-sm font-medium mb-1 leading-snug">{title}</p>

      {/* Progress */}
      {categories.length > 1 && (
        <div className="flex gap-1 mb-3">
          {categories.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-100 ${
                i === currentIdx ? 'bg-[#FFD700]' : i < currentIdx ? 'bg-white/20' : 'bg-white/[0.05]'
              }`}
            />
          ))}
        </div>
      )}

      {/* Category */}
      <p className="text-[#FFD700] text-[13px] font-medium mb-3">{category}</p>

      {/* Input or result */}
      {!myNomination ? (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim()) {
                e.preventDefault();
                handleNominate(inputValue);
              }
            }}
            placeholder="Type a name..."
            className="flex-1 px-3 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/[0.05]
              text-white placeholder:text-white/30 focus:outline-none focus:outline-2 focus:outline-[#FFD700]"
          />
          <button
            onClick={() => handleNominate(inputValue)}
            disabled={!inputValue.trim()}
            className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold
              disabled:opacity-30 transition-opacity duration-100"
          >
            Pick
          </button>
        </div>
      ) : (
        <div className="mb-3 px-3 py-2 rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/[0.05]">
          <span className="text-[13px] text-[#FFD700]">You nominated: {myNomination}</span>
        </div>
      )}

      {/* Top nominations */}
      {topNominees.length > 0 && (
        <div className="space-y-1">
          {topNominees.map(([name, count], i) => (
            <button
              key={name}
              onClick={() => !myNomination && handleNominate(name)}
              disabled={!!myNomination}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[13px]
                text-white/50 hover:text-white/70 hover:bg-white/[0.03] transition-colors duration-100
                disabled:cursor-default disabled:hover:bg-transparent"
            >
              <span>{i === 0 && myNomination ? '👑 ' : ''}{name}</span>
              <span className="font-mono text-[11px] text-white/30">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-[12px] text-white/30">{participantCount} participated</span>
        {categories.length > 1 && (
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="text-[12px] text-white/30 hover:text-white/50 disabled:opacity-30 transition-colors duration-100"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentIdx(Math.min(categories.length - 1, currentIdx + 1))}
              disabled={currentIdx === categories.length - 1}
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

export default SuperlativesCard;

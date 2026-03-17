'use client';

/**
 * TierListCard — Rank items into tiers (S/A/B/C/D).
 *
 * Tap item → tap tier to place. After submit, show aggregated results.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CARD } from '@hive/tokens';
import type { ShellComponentProps, TierListConfig, TierListState } from '@/lib/shells/types';

function TierListCard({
  config,
  state,
  currentUserId,
  onAction,
  compact = true,
}: ShellComponentProps<TierListConfig, TierListState>) {
  const { topic, items, tiers } = config;
  const placements = state?.placements ?? {};
  const aggregated = state?.aggregated ?? {};
  const participantCount = state?.participantCount ?? 0;

  const myPlacements = placements[currentUserId] ?? {};
  const hasSubmitted = Object.keys(myPlacements).length > 0 && state?.placements?.[currentUserId] !== undefined;

  const [localPlacements, setLocalPlacements] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const allPlaced = items.every((item) => localPlacements[item]);

  const handlePlaceItem = (tier: string) => {
    if (!selectedItem || hasSubmitted) return;
    setLocalPlacements((prev) => ({ ...prev, [selectedItem]: tier }));
    onAction({ type: 'tierlist_place', item: selectedItem, tier });
    setSelectedItem(null);
  };

  const handleSubmit = () => {
    if (!allPlaced) return;
    onAction({ type: 'tierlist_submit' });
  };

  // Group items by tier for display
  const itemsByTier = useMemo(() => {
    const source = hasSubmitted ? myPlacements : localPlacements;
    const grouped: Record<string, string[]> = {};
    for (const tier of tiers) grouped[tier] = [];
    for (const [item, tier] of Object.entries(source)) {
      if (grouped[tier]) grouped[tier].push(item);
    }
    return grouped;
  }, [hasSubmitted, myPlacements, localPlacements, tiers]);

  const unplacedItems = items.filter((item) =>
    hasSubmitted ? !myPlacements[item] : !localPlacements[item]
  );

  const TIER_COLORS: Record<string, string> = {
    S: 'bg-[#FFD700]/20 border-[#FFD700]/30 text-[#FFD700]',
    A: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400',
    B: 'bg-blue-500/15 border-blue-500/25 text-blue-400',
    C: 'bg-orange-500/15 border-orange-500/25 text-orange-400',
    D: 'bg-red-500/15 border-red-500/25 text-red-400',
  };

  const getTierStyle = (tier: string) =>
    TIER_COLORS[tier] ?? 'bg-white/[0.05] border-white/[0.10] text-white/70';

  return (
    <div className={`${CARD.default} p-4 ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      <p className="text-white text-sm font-medium mb-3 leading-snug">{topic}</p>

      {/* Tier rows */}
      <div className="flex flex-col gap-1.5 mb-3">
        {tiers.map((tier) => (
          <button
            key={tier}
            onClick={() => handlePlaceItem(tier)}
            disabled={!selectedItem || hasSubmitted}
            className={`
              flex items-center gap-2 min-h-[36px] px-3 py-1.5 rounded-xl border text-sm
              transition-colors duration-100
              ${getTierStyle(tier)}
              ${selectedItem && !hasSubmitted ? 'hover:brightness-125 cursor-pointer' : 'cursor-default'}
            `}
          >
            <span className="font-semibold text-xs w-5 shrink-0">{tier}</span>
            <div className="flex flex-wrap gap-1">
              {(itemsByTier[tier] ?? []).map((item) => (
                <span key={item} className="px-2 py-0.5 rounded-lg bg-white/[0.05] text-[12px] text-white/70">
                  {item}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Unplaced items */}
      {!hasSubmitted && unplacedItems.length > 0 && (
        <div className="mb-3">
          <p className="font-mono text-[11px] uppercase tracking-wider text-white/30 mb-1.5">
            Tap an item, then a tier
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unplacedItems.map((item) => (
              <button
                key={item}
                onClick={() => setSelectedItem(item === selectedItem ? null : item)}
                className={`
                  px-3 py-1.5 rounded-xl text-[13px] border transition-colors duration-100
                  ${item === selectedItem
                    ? 'border-[#FFD700]/40 bg-[#FFD700]/[0.05] text-[#FFD700]'
                    : 'border-white/[0.10] bg-white/[0.03] text-white/70 hover:bg-white/[0.05]'
                  }
                `}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit button */}
      {!hasSubmitted && allPlaced && unplacedItems.length === 0 && (
        <button
          onClick={handleSubmit}
          className="w-full py-2.5 rounded-full bg-white text-black font-semibold text-sm transition-colors duration-100 hover:bg-white/90"
        >
          Submit ranking
        </button>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-[12px] text-white/30">
          {participantCount} ranked
        </span>
      </div>
    </div>
  );
}

export default TierListCard;

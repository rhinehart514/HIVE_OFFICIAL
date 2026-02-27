'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlacedToolDTO } from '@/hooks/use-space-tools';

const CATEGORY_GRADIENTS: Record<string, string> = {
  productivity: 'from-blue-500/40 to-indigo-500/40',
  social: 'from-pink-500/40 to-rose-500/40',
  game: 'from-green-500/40 to-emerald-500/40',
  utility: 'from-amber-500/40 to-orange-500/40',
  creative: 'from-purple-500/40 to-violet-500/40',
};

const DEFAULT_GRADIENT = 'from-white/10 to-white/5';

function getCategoryGradient(category?: string): string {
  if (!category) return DEFAULT_GRADIENT;
  return CATEGORY_GRADIENTS[category.toLowerCase()] || DEFAULT_GRADIENT;
}

export interface CreationCardProps {
  tool: PlacedToolDTO;
  spaceHandle: string;
  onTryIt: (tool: PlacedToolDTO) => void;
}

export function CreationCard({ tool, spaceHandle, onTryIt }: CreationCardProps) {
  const displayName = tool.titleOverride || tool.name;
  const useCount = tool.activityCount ?? 0;
  const initial = (tool.originalTool?.creatorId || displayName || '?')[0].toUpperCase();
  const gradient = getCategoryGradient(tool.category);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#080808] overflow-hidden">
      {/* Category gradient header */}
      <div className={cn('h-10 bg-gradient-to-r', gradient)} />

      <div className="p-4">
        {/* Name + description */}
        <h3 className="text-[15px] font-semibold text-white truncate">{displayName}</h3>
        {tool.description && (
          <p className="mt-1 text-[13px] text-white/40 line-clamp-2 leading-relaxed">
            {tool.description}
          </p>
        )}

        {/* Stats + creator */}
        <div className="flex items-center gap-3 mt-3">
          {useCount > 0 && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                useCount >= 10
                  ? 'bg-[#FFD700]/15 text-[#FFD700]'
                  : 'bg-white/[0.06] text-white/50'
              )}
            >
              <Play className="w-3 h-3" />
              {useCount} use{useCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Creator byline */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
            <span className="text-[9px] font-semibold text-white/60">{initial}</span>
          </div>
          <span className="text-[11px] text-white/30 truncate">{tool.category || 'app'}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => onTryIt(tool)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium bg-white/[0.06] border border-white/[0.06] text-white/70 hover:bg-white/[0.10] hover:border-white/[0.10] transition-all duration-150 active:scale-[0.97]"
          >
            Try it
          </button>
          <Link
            href={`/s/${spaceHandle}/tools/${tool.toolId}`}
            className="px-3 py-2 rounded-xl text-[13px] font-medium text-white/40 hover:text-white/60 transition-colors"
          >
            Full view
          </Link>
        </div>
      </div>
    </div>
  );
}

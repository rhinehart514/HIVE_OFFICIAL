'use client';

import { useState } from 'react';
import { GitFork, Play, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FeedTool {
  id: string;
  title: string;
  description?: string;
  creatorId?: string;
  creatorName?: string;
  spaceOriginName?: string;
  forkCount: number;
  useCount: number;
  category?: string;
  createdAt: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export interface FeedToolCardProps {
  tool: FeedTool;
  onRemix: (id: string) => void;
  onAddToSpace?: (toolId: string) => void;
  isRemixing: boolean;
  index: number;
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  expandedContent?: React.ReactNode;
}

export function FeedToolCard({ tool, onRemix, onAddToSpace, isRemixing, index, isExpanded, onToggleExpand, expandedContent }: FeedToolCardProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = isExpanded ?? localExpanded;

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand(tool.id);
    } else {
      setLocalExpanded(prev => !prev);
    }
  };

  const initial = (tool.creatorName || '?')[0].toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/[0.06] bg-[#080808] overflow-hidden hover:border-white/[0.10] transition-all duration-200"
    >
      <div className="p-4">
        {/* Builder byline */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-[#FFD700]/15 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-[#FFD700]/80">{initial}</span>
          </div>
          <span className="text-[12px] text-white/50 truncate">{tool.creatorName || 'Anonymous'}</span>
          <span className="text-[10px] text-white/20">{relativeTime(tool.createdAt)}</span>
        </div>

        {/* Title + description */}
        <h3 className="text-[16px] font-semibold text-white leading-snug">{tool.title}</h3>
        {tool.description && (
          <p className="mt-1.5 text-[13px] text-white/40 line-clamp-3 leading-relaxed">{tool.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 mt-3 text-[12px] text-white/30">
          {tool.useCount > 0 && (
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              {tool.useCount} use{tool.useCount !== 1 ? 's' : ''}
            </span>
          )}
          {tool.forkCount > 0 && (
            <span className="flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              {tool.forkCount} remix{tool.forkCount !== 1 ? 'es' : ''}
            </span>
          )}
          {tool.useCount === 0 && tool.forkCount === 0 && (
            <span className="text-white/20">New</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handleToggle}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 active:scale-[0.97]',
              expanded
                ? 'bg-white/[0.08] border border-white/[0.10] text-white/60'
                : 'bg-white/[0.06] border border-white/[0.06] text-white/70 hover:bg-white/[0.08] hover:border-white/[0.10]'
            )}
          >
            {expanded ? 'Close' : 'Try it'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemix(tool.id);
            }}
            disabled={isRemixing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium border border-[#FFD700]/20 text-[#FFD700]/70 hover:border-[#FFD700]/30 hover:text-[#FFD700]/90 hover:bg-[#FFD700]/[0.04] transition-all duration-150 active:scale-[0.97] disabled:opacity-40"
          >
            <GitFork className="w-3.5 h-3.5" />
            {isRemixing ? 'Remixing...' : 'Remix'}
          </button>
          {onAddToSpace && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToSpace(tool.id);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium bg-white/[0.04] border border-white/[0.06] text-white/40 hover:bg-white/[0.06] hover:border-white/[0.10] hover:text-white/60 transition-all duration-150 active:scale-[0.97]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to space
            </button>
          )}
        </div>
      </div>

      {/* Expanded area */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
            className="overflow-hidden"
          >
            <div className="max-h-[400px] overflow-y-auto border-t border-white/[0.06]">
              <div className="p-4">
                {expandedContent}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

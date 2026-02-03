'use client';

/**
 * ToolCard — Dashboard tool card with status, stats, and hover state
 *
 * Matches SpacesHQ density and motion patterns.
 * Shows tool name, status badge, usage stats, and last updated.
 */

import { motion } from 'framer-motion';
import { Clock, BarChart3, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/hivelab/create-tool';
import { MOTION } from '@hive/tokens';

const EASE = MOTION.ease.premium;

export interface ToolData {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'deployed';
  updatedAt: Date | string;
  useCount?: number;
}

interface ToolCardProps {
  tool: ToolData;
  onClick: (toolId: string) => void;
  index?: number;
}

const STATUS_CONFIG = {
  deployed: {
    label: 'Live',
    bg: 'bg-[var(--ide-status-success-bg)]',
    text: 'text-[var(--ide-status-success)]',
  },
  published: {
    label: 'Ready',
    bg: 'bg-[var(--ide-status-info-bg)]',
    text: 'text-[var(--ide-status-info)]',
  },
  draft: {
    label: 'Draft',
    bg: 'bg-[var(--ide-surface-elevated)]',
    text: 'text-[var(--ide-text-muted)]',
  },
};

export function ToolCard({ tool, onClick, index = 0 }: ToolCardProps) {
  const status = STATUS_CONFIG[tool.status] || STATUS_CONFIG.draft;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: index * 0.05,
        ease: EASE,
      }}
      onClick={() => onClick(tool.id)}
      className="group relative flex flex-col items-start p-4 rounded-xl
        border border-[var(--ide-border-subtle)] bg-[var(--ide-surface-panel)]
        hover:border-[var(--ide-border-default)] hover:bg-[var(--ide-surface-toolbar)]
        transition-all duration-200 text-left w-full"
    >
      {/* Header: Name + Status */}
      <div className="flex items-center justify-between w-full mb-1.5">
        <span className="text-[var(--ide-text-primary)] font-medium text-sm truncate pr-2 flex-1">
          {tool.name || 'Untitled Tool'}
        </span>
        <span className={`text-label-xs px-2 py-0.5 rounded-full uppercase tracking-wide
          ${status.bg} ${status.text} flex-shrink-0`}>
          {status.label}
        </span>
      </div>

      {/* Description (if present) */}
      {tool.description && (
        <p className="text-[var(--ide-text-muted)] text-xs line-clamp-1 w-full mb-2">
          {tool.description}
        </p>
      )}

      {/* Footer: Stats + Updated */}
      <div className="flex items-center gap-3 mt-auto pt-2 text-[var(--ide-text-muted)] text-label-sm w-full">
        {tool.useCount !== undefined && tool.useCount > 0 && (
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {tool.useCount} uses
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(tool.updatedAt)}
        </span>
      </div>

      {/* Hover arrow */}
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
        text-transparent group-hover:text-[var(--ide-text-muted)] transition-colors" />
    </motion.button>
  );
}

/**
 * NewToolCard — The "+ New" card at the end of the tools grid
 */
interface NewToolCardProps {
  onClick: () => void;
  index?: number;
}

export function NewToolCard({ onClick, index = 0 }: NewToolCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: index * 0.05,
        ease: EASE,
      }}
      onClick={onClick}
      className="group flex flex-col items-center justify-center p-4 rounded-xl
        border border-dashed border-[var(--ide-border-subtle)] bg-transparent
        hover:border-[var(--ide-border-default)] hover:bg-[var(--ide-surface-panel)]
        transition-all duration-200 min-h-[88px]"
    >
      <div className="w-8 h-8 rounded-full bg-[var(--ide-interactive-default)] flex items-center justify-center
        group-hover:bg-[var(--ide-accent-primary-bg)] transition-colors mb-1.5">
        <span className="text-[var(--ide-text-muted)] group-hover:text-[var(--ide-accent-primary)] text-lg transition-colors">
          +
        </span>
      </div>
      <span className="text-[var(--ide-text-muted)] text-xs group-hover:text-[var(--ide-text-secondary)] transition-colors">
        New Tool
      </span>
    </motion.button>
  );
}

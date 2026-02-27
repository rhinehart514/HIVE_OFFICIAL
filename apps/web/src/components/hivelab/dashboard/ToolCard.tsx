'use client';

/**
 * ToolCard — Dashboard tool card with status, stats, and quick actions
 *
 * Shows tool name, status badge (color-coded), WAU, deployment count,
 * last updated, and quick action buttons.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock,
  BarChart3,
  ChevronRight,
  Pencil,
  Rocket,
  Users,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/hivelab/create-tool';

export interface ToolData {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'pending_review' | 'deployed';
  updatedAt: Date | string;
  createdAt?: Date | string;
  useCount?: number;
  deployments?: number;
  wau?: number;
  weeklyInteractions?: number;
  templateId?: string | null;
}

interface ToolCardProps {
  tool: ToolData;
  onClick: (toolId: string) => void;
  onDelete?: (toolId: string) => void;
  variant?: 'compact' | 'full';
}

const STATUS_CONFIG = {
  deployed: {
    label: 'Deployed',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  published: {
    label: 'Published',
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    dot: 'bg-green-400',
  },
  pending_review: {
    label: 'Pending',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  draft: {
    label: 'Draft',
    bg: 'bg-white/[0.06]',
    text: 'text-white/50',
    dot: 'bg-white/50',
  },
};

export function ToolCard({ tool, onClick, onDelete, variant = 'full' }: ToolCardProps) {
  const router = useRouter();
  const status = STATUS_CONFIG[tool.status] || STATUS_CONFIG.draft;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/lab/${tool.id}`);
  }, [router, tool.id]);

  const handleAnalytics = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/lab/${tool.id}?analytics=true`);
  }, [router, tool.id]);

  const handleDeploy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/lab/${tool.id}?deploy=true`);
  }, [router, tool.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete?.(tool.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      // Reset after 3s if not confirmed
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }, [confirmDelete, onDelete, tool.id]);

  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ opacity: 0.96 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onClick(tool.id)}
        className="group relative flex flex-col items-start p-4 rounded-2xl
         border border-white/[0.06] bg-[#080808]
          hover:bg-white/[0.03]
          transition-all duration-200 text-left w-full"
      >
        <div className="flex items-center justify-between w-full mb-1.5">
          <span className="text-white font-medium text-sm truncate pr-2 flex-1">
            {tool.name || 'Untitled Tool'}
          </span>
          <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
            ${status.bg} ${status.text} flex-shrink-0`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-auto pt-2 text-white/50 text-xs w-full">
          {(tool.useCount ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {tool.useCount}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(tool.updatedAt)}
          </span>
        </div>
        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
          text-transparent group-hover:text-white/50 transition-colors" />
      </motion.button>
    );
  }

  return (
    <motion.div
      whileHover={{ opacity: 0.96 }}
      className="group relative flex flex-col p-4 rounded-2xl
       border border-white/[0.06] bg-[#080808]
        hover:bg-white/[0.03]
        transition-all duration-200 text-left w-full cursor-pointer"
      onClick={() => onClick(tool.id)}
    >
      {/* Header: Name + Status */}
      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-white font-medium text-sm truncate pr-2 flex-1">
          {tool.name || 'Untitled Tool'}
        </span>
        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
          ${status.bg} ${status.text} flex-shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      {/* Description */}
      {tool.description && (
        <p className="text-white/50 text-xs line-clamp-1 w-full mb-3">
          {tool.description}
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 text-white/50 text-xs mb-3">
        {(tool.wau ?? 0) > 0 && (
          <span className="flex items-center gap-1" title="Weekly active users">
            <Users className="w-3 h-3" />
            {tool.wau} WAU
          </span>
        )}
        {(tool.deployments ?? 0) > 0 && (
          <span className="flex items-center gap-1" title="Deployed to spaces">
            <Rocket className="w-3 h-3" />
            {tool.deployments} {tool.deployments === 1 ? 'space' : 'spaces'}
          </span>
        )}
        {(tool.weeklyInteractions ?? 0) > 0 && (
          <span className="flex items-center gap-1" title="Interactions this week">
            <TrendingUp className="w-3 h-3" />
            {tool.weeklyInteractions}
          </span>
        )}
      </div>

      {/* Footer: Updated + Quick Actions */}
      <div className="flex items-center justify-between w-full pt-2 border-t border-white/[0.06]">
        <span className="flex items-center gap-1 text-white/50 text-xs">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(tool.updatedAt)}
        </span>

        {/* Quick actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-white/50 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleAnalytics}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-white/50 transition-colors"
            title="Analytics"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          {tool.status === 'draft' || tool.status === 'published' ? (
            <button
              onClick={handleDeploy}
              className="p-1.5 rounded-md hover:bg-white/[0.06] text-white/50 hover:text-white/50 transition-colors"
              title="Deploy"
            >
              <Rocket className="w-3.5 h-3.5" />
            </button>
          ) : null}
          {onDelete && (
            <button
              onClick={handleDelete}
              className={`p-1.5 rounded-md transition-colors ${
                confirmDelete
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'hover:bg-white/[0.06] text-white/50 hover:text-red-400'
              }`}
              title={confirmDelete ? 'Click again to confirm' : 'Delete'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}


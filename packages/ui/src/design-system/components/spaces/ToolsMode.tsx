'use client';

/**
 * ToolsMode Component
 *
 * Full-screen tools grid for theater mode.
 * Browse and use HiveLab tools in the space.
 *
 * Features:
 * - Tool cards in grid layout
 * - Active tools highlighted with gold edge
 * - Category filters
 * - Quick tool execution
 */

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================
// Types
// ============================================================

export interface SpaceTool {
  id: string;
  toolId: string;
  placementId?: string;
  name: string;
  description?: string;
  type: string;
  iconUrl?: string;
  isActive?: boolean;
  responseCount?: number;
  creatorName?: string;
  creatorAvatarUrl?: string;
}

export interface ToolsModeProps {
  /** Space ID */
  spaceId: string;
  /** Tools to display */
  tools: SpaceTool[];
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Can user add tools */
  canAddTools?: boolean;
  /** Run tool callback */
  onRunTool?: (toolId: string) => void;
  /** View tool details */
  onViewTool?: (toolId: string) => void;
  /** Add tool to space */
  onAddTool?: () => void;
  /** Build new tool in HiveLab */
  onBuildTool?: () => void;
  /** Remove tool from space */
  onRemoveTool?: (placementId: string) => void;
  /** Additional className */
  className?: string;
}

// ============================================================
// Tool Type Icons
// ============================================================

const toolTypeIcons: Record<string, React.ReactNode> = {
  poll: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  countdown: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  form: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  calculator: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  quiz: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  default: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
};

// ============================================================
// Tool Card Component
// ============================================================

interface ToolCardProps {
  tool: SpaceTool;
  onRun?: () => void;
  onView?: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
}

function ToolCard({ tool, onRun, onView, onRemove, canRemove }: ToolCardProps) {
  const [showActions, setShowActions] = React.useState(false);
  const icon = toolTypeIcons[tool.type] || toolTypeIcons.default;

  return (
    <motion.div
      whileHover={{ opacity: 0.96 }}
      className={cn(
        'relative rounded-2xl p-5',
        'bg-[#141312] border border-white/[0.06]',
        'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:border-white/[0.12]',
        tool.isActive && 'shadow-[inset_0_0_0_1px_rgba(255,215,0,0.20)]',
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Icon */}
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          tool.isActive
            ? 'bg-[#FFD700]/20 text-[#FFD700]'
            : 'bg-white/[0.06] text-[#A3A19E]',
        )}>
          {tool.iconUrl ? (
            <Image src={tool.iconUrl} alt="" width={24} height={24} sizes="24px" />
          ) : (
            icon
          )}
        </div>

        {/* Active indicator */}
        {tool.isActive && (
          <div className="absolute top-4 right-4">
            <span className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse block" />
          </div>
        )}
      </div>

      {/* Content */}
      <h3 className="text-white font-medium mb-1">{tool.name}</h3>
      {tool.description && (
        <p className="text-[#6B6B70] text-sm line-clamp-2 mb-3">
          {tool.description}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-[#6B6B70]">
        <span className="capitalize">{tool.type}</span>
        {tool.responseCount !== undefined && tool.responseCount > 0 && (
          <>
            <span className="text-[#3D3D42]">·</span>
            <span>{tool.responseCount} uses</span>
          </>
        )}
      </div>

      {/* Hover actions */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute inset-x-0 bottom-0 p-3 pt-8
              bg-gradient-to-t from-[#141312] to-transparent
              rounded-b-2xl"
          >
            <div className="flex gap-2">
              {onRun && (
                <button
                  className="flex-1 px-3 py-2 rounded-lg bg-[#FFD700] text-black text-sm font-medium
                    hover:bg-[#FFD700]/90 transition-colors"
                  onClick={onRun}
                >
                  Run
                </button>
              )}
              {onView && (
                <button
                  className="px-3 py-2 rounded-lg bg-white/[0.06] text-white text-sm font-medium
                    hover:bg-white/[0.10] transition-colors"
                  onClick={onView}
                >
                  View
                </button>
              )}
              {canRemove && onRemove && (
                <button
                  className="px-3 py-2 rounded-lg bg-white/[0.06] text-[#A3A19E] text-sm
                    hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  onClick={onRemove}
                  title="Remove from space"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ToolsMode({
  spaceId,
  tools,
  isLoading = false,
  error,
  onRetry,
  canAddTools = false,
  onRunTool,
  onViewTool,
  onAddTool,
  onBuildTool,
  onRemoveTool,
  className,
}: ToolsModeProps) {
  const [filter, setFilter] = React.useState<string | null>(null);

  // Get unique tool types for filter
  const toolTypes = React.useMemo(() => {
    const types = new Set(tools.map((t) => t.type));
    return Array.from(types);
  }, [tools]);

  // Filter tools
  const filteredTools = React.useMemo(() => {
    if (!filter) return tools;
    return tools.filter((t) => t.type === filter);
  }, [tools, filter]);

  // Separate active and inactive tools
  const activeTools = filteredTools.filter((t) => t.isActive);
  const inactiveTools = filteredTools.filter((t) => !t.isActive);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="flex items-center gap-2 text-[#6B6B70]">
          <div className="w-2 h-2 rounded-full bg-[#6B6B70] animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-[#6B6B70] animate-pulse delay-100" />
          <div className="w-2 h-2 rounded-full bg-[#6B6B70] animate-pulse delay-200" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="text-center px-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-[#A3A19E] text-base mb-2">Something went wrong</p>
          <p className="text-[#6B6B70] text-sm mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-lg bg-white/[0.06] text-white text-sm font-medium
                hover:bg-white/[0.10] active:scale-95 transition-all"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 overflow-y-auto', className)}>
      <div className="max-w-5xl mx-auto px-3 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Tools</h1>
          {canAddTools && (
            <div className="flex items-center gap-2">
              {/* Build new tool in HiveLab */}
              {onBuildTool && (
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg
                    bg-[#FFD700] text-black font-medium
                    hover:bg-[#FFD700]/90 active:scale-95 transition-all"
                  onClick={onBuildTool}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Build Tool
                </button>
              )}
              {/* Add existing tool */}
              {onAddTool && (
                <button
                  className="px-4 py-2 rounded-lg bg-white/[0.06] text-white font-medium
                    hover:bg-white/[0.10] active:scale-95 transition-all"
                  onClick={onAddTool}
                >
                  Add Existing
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        {toolTypes.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                !filter
                  ? 'bg-white/[0.10] text-white'
                  : 'bg-white/[0.04] text-[#A3A19E] hover:bg-white/[0.08]',
              )}
              onClick={() => setFilter(null)}
            >
              All
            </button>
            {toolTypes.map((type) => (
              <button
                key={type}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
                  filter === type
                    ? 'bg-white/[0.10] text-white'
                    : 'bg-white/[0.04] text-[#A3A19E] hover:bg-white/[0.08]',
                )}
                onClick={() => setFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {/* Active tools */}
        {activeTools.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-[#FFD700] mb-4 uppercase tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
              Active
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onRun={onRunTool ? () => onRunTool(tool.toolId) : undefined}
                  onView={onViewTool ? () => onViewTool(tool.toolId) : undefined}
                  onRemove={tool.placementId && onRemoveTool ? () => onRemoveTool(tool.placementId!) : undefined}
                  canRemove={canAddTools}
                />
              ))}
            </div>
          </div>
        )}

        {/* All tools */}
        {inactiveTools.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-[#A3A19E] mb-4 uppercase tracking-wide">
              {activeTools.length > 0 ? 'Available' : 'All Tools'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onRun={onRunTool ? () => onRunTool(tool.toolId) : undefined}
                  onView={onViewTool ? () => onViewTool(tool.toolId) : undefined}
                  onRemove={tool.placementId && onRemoveTool ? () => onRemoveTool(tool.placementId!) : undefined}
                  canRemove={canAddTools}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {tools.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#6B6B70]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-[#A3A19E] text-lg mb-2">No tools yet</p>
            <p className="text-[#6B6B70] text-sm mb-6">
              {canAddTools ? 'Build custom tools for your space or add existing ones' : 'Check back later for available tools'}
            </p>
            {canAddTools && (
              <div className="flex items-center justify-center gap-3">
                {onBuildTool && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFD700] text-black font-medium
                      hover:bg-[#FFD700]/90 active:scale-95 transition-all"
                    onClick={onBuildTool}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Build Tool
                  </button>
                )}
                {onAddTool && (
                  <button
                    className="px-4 py-2 rounded-lg bg-white/[0.06] text-white font-medium
                      hover:bg-white/[0.10] active:scale-95 transition-all"
                    onClick={onAddTool}
                  >
                    Add Existing
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

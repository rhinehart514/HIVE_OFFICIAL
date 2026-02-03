'use client';

/**
 * ToolsList - Pinned tools section in sidebar
 *
 * Shows tools deployed to this space's sidebar.
 * Quick access to run tools without leaving chat.
 *
 * @version 2.1.0 - Rich SidebarToolCard Integration (Feb 2026)
 */

import * as React from 'react';
import Link from 'next/link';
import { Wrench, Plus, Loader2, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarToolCard } from '@/components/spaces/sidebar-tool-card';
import type { PlacedToolDTO } from '@/hooks/use-space-tools';

export interface ToolsListProps {
  tools: PlacedToolDTO[];
  isLoading?: boolean;
  activeToolId?: string;
  isLeader?: boolean;
  onToolClick?: (tool: PlacedToolDTO) => void;
  onToolRun?: (tool: PlacedToolDTO) => void;
  onViewFull?: (tool: PlacedToolDTO) => void;
  onAddTool?: () => void;
}

export function ToolsList({
  tools,
  isLoading = false,
  activeToolId,
  isLeader = false,
  onToolClick,
  onToolRun,
  onViewFull,
  onAddTool,
}: ToolsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tools.map((tool) => {
        const isActive = tool.toolId === activeToolId;

        return (
          <SidebarToolCard
            key={tool.placementId}
            tool={tool}
            isActive={isActive}
            isDraggable={isLeader}
            onClick={() => onToolClick?.(tool)}
            onRun={() => onToolRun?.(tool)}
            onViewFull={onViewFull ? () => onViewFull(tool) : undefined}
          />
        );
      })}

      {/* Add tool button (leaders only) */}
      {isLeader && onAddTool && (
        <button
          onClick={onAddTool}
          className={cn(
            'w-full px-3 py-2 rounded-lg',
            'flex items-center gap-2',
            'text-white/40 hover:text-white/60',
            'hover:bg-white/[0.04]',
            'transition-all duration-150',
            'border border-dashed border-white/[0.06] hover:border-white/[0.12]',
            tools.length > 0 && 'mt-2'
          )}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add tool</span>
        </button>
      )}

      {/* Enhanced empty state for leaders */}
      {tools.length === 0 && isLeader && (
        <div className="text-center py-4">
          <Wrench className="w-5 h-5 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/40 mb-2">Build tools for your org</p>
          <p className="text-xs text-white/30">Track dues, collect RSVPs, run polls...</p>
        </div>
      )}

      {/* Empty state for members */}
      {tools.length === 0 && !isLeader && (
        <div className="text-center py-4">
          <Wrench className="w-5 h-5 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/30">No tools yet</p>
        </div>
      )}

      {/* Browse more tools link */}
      <Link
        href="/explore?tab=tools"
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'text-xs text-white/30 hover:text-white/60',
          'hover:bg-white/[0.04]',
          'transition-colors duration-150',
          tools.length > 0 && 'mt-1'
        )}
      >
        <Compass className="w-3.5 h-3.5" />
        <span>Browse more tools</span>
      </Link>
    </div>
  );
}

ToolsList.displayName = 'ToolsList';

export default ToolsList;

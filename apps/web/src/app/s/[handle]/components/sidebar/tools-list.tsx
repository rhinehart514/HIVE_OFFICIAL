'use client';

/**
 * ToolsList - Pinned tools section in sidebar
 *
 * Shows tools deployed to this space's sidebar.
 * Quick access to run tools without leaving chat.
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Plus, Play, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPACE_COMPONENTS } from '@hive/tokens';

export interface SidebarTool {
  toolId: string;
  name: string;
  icon?: string;
  deploymentId?: string;
}

export interface ToolsListProps {
  tools: SidebarTool[];
  isLoading?: boolean;
  activeToolId?: string;
  isLeader?: boolean;
  onToolClick?: (tool: SidebarTool) => void;
  onToolRun?: (tool: SidebarTool) => void;
  onAddTool?: () => void;
}

export function ToolsList({
  tools,
  isLoading = false,
  activeToolId,
  isLeader = false,
  onToolClick,
  onToolRun,
  onAddTool,
}: ToolsListProps) {
  const { boardItem } = SPACE_COMPONENTS;

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
        const [isHovered, setIsHovered] = React.useState(false);

        return (
          <motion.button
            key={tool.toolId}
            onClick={() => onToolClick?.(tool)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'w-full rounded-lg',
              'flex items-center gap-2',
              'transition-colors duration-150',
              'text-left group',
              isActive
                ? 'bg-white/[0.08] text-white'
                : 'hover:bg-white/[0.04] text-white/60 hover:text-white/80'
            )}
            style={{
              height: `${boardItem.height}px`,
              paddingLeft: `${boardItem.paddingX}px`,
              paddingRight: `${boardItem.paddingX}px`,
              borderRadius: `${boardItem.borderRadius}px`,
            }}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Tool icon */}
            {tool.icon ? (
              <span className="text-sm">{tool.icon}</span>
            ) : (
              <Wrench
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive ? 'text-white' : 'text-white/40'
                )}
              />
            )}

            {/* Tool name */}
            <span className="flex-1 truncate text-sm font-medium">
              {tool.name}
            </span>

            {/* Hover actions */}
            {isHovered && (
              <div className="flex items-center gap-1">
                {onToolRun && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToolRun(tool);
                    }}
                    className="p-1 rounded hover:bg-white/[0.08] transition-colors"
                    title="Run tool"
                  >
                    <Play className="w-3 h-3 text-white/60" />
                  </button>
                )}
              </div>
            )}
          </motion.button>
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

      {/* Empty state */}
      {tools.length === 0 && !isLeader && (
        <div className="text-center py-4">
          <Wrench className="w-5 h-5 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/30">No tools yet</p>
        </div>
      )}
    </div>
  );
}

ToolsList.displayName = 'ToolsList';

export default ToolsList;

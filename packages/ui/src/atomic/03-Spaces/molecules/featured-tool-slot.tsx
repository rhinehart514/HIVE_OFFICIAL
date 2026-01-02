'use client';

/**
 * FeaturedToolSlot - Prominent tool display above conversation
 *
 * Design Direction:
 * - Each space can have ONE featured tool always visible
 * - Positioned above the chat conversation
 * - Leader chooses which tool to feature on deploy
 * - Subtle shadow, feels physical
 * - Collapsible but defaults to expanded
 *
 * @author HIVE Frontend Team
 * @version 2.0.0 - Dark-first design update
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Maximize2, X, MoreHorizontal } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../00-Global/molecules/dropdown-menu';

// ============================================================
// Types
// ============================================================

export interface FeaturedToolSlotProps {
  /** Tool ID for reference */
  toolId: string;
  /** Tool display name */
  toolName: string;
  /** Tool icon (optional emoji or icon component) */
  toolIcon?: React.ReactNode;
  /** Current interaction count (votes, responses, etc.) */
  interactionCount?: number;
  /** Interaction label (e.g., "votes", "responses") */
  interactionLabel?: string;
  /** Whether the slot is expanded */
  isExpanded?: boolean;
  /** Whether the current user can manage this tool */
  canManage?: boolean;
  /** Callback when expand/collapse is toggled */
  onToggleExpand?: () => void;
  /** Callback when tool is maximized to full view */
  onMaximize?: () => void;
  /** Callback when tool is removed from featured slot */
  onRemove?: () => void;
  /** Callback when tool settings are clicked */
  onSettings?: () => void;
  /** The tool content to render */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function FeaturedToolSlot({
  toolId,
  toolName,
  toolIcon,
  interactionCount,
  interactionLabel = 'interactions',
  isExpanded = true,
  canManage = false,
  onToggleExpand,
  onMaximize,
  onRemove,
  onSettings,
  children,
  className,
}: FeaturedToolSlotProps) {
  return (
    <motion.div
      layout
      className={cn(
        // Dark-first design: Elevated surface with subtle shadow
        'relative mx-4 mb-4 rounded-xl overflow-hidden',
        'bg-[#141414] border border-[#2A2A2A]',
        'shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
        className
      )}
    >
      {/* Header bar */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'border-b border-[#2A2A2A]',
          'bg-[#0A0A0A]/50'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Tool icon */}
          {toolIcon && (
            <span className="text-lg flex-shrink-0">{toolIcon}</span>
          )}

          {/* Tool name */}
          <span className="text-sm font-medium text-[#FAFAFA]">
            {toolName}
          </span>

          {/* Interaction count badge */}
          {interactionCount !== undefined && interactionCount > 0 && (
            <span
              className={cn(
                'px-2 py-0.5 text-xs rounded-full',
                'bg-white/[0.08] text-neutral-300 font-medium'
              )}
            >
              {interactionCount} {interactionLabel}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Expand/Collapse toggle */}
          {onToggleExpand && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleExpand}
              className={cn(
                'p-1.5 rounded-lg',
                'text-[#818187] hover:text-[#FAFAFA] hover:bg-white/[0.04]',
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
              )}
              aria-label={isExpanded ? 'Collapse tool' : 'Expand tool'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </motion.button>
          )}

          {/* Maximize */}
          {onMaximize && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onMaximize}
              className={cn(
                'p-1.5 rounded-lg',
                'text-[#818187] hover:text-[#FAFAFA] hover:bg-white/[0.04]',
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
              )}
              aria-label="Maximize tool"
            >
              <Maximize2 className="w-4 h-4" />
            </motion.button>
          )}

          {/* Manager actions */}
          {canManage && (onRemove || onSettings) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'p-1.5 rounded-lg',
                    'text-[#818187] hover:text-[#FAFAFA] hover:bg-white/[0.04]',
                    'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
                  )}
                  aria-label="Tool options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onSettings && (
                  <DropdownMenuItem onClick={onSettings}>
                    Tool settings
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <DropdownMenuItem
                    onClick={onRemove}
                    className="text-red-400 focus:text-red-400"
                  >
                    Remove from featured
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Tool content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Empty State Component
// ============================================================

export interface FeaturedToolEmptyProps {
  /** Whether the user can add a featured tool */
  canAdd?: boolean;
  /** Callback when add tool is clicked */
  onAddTool?: () => void;
  /** Additional className */
  className?: string;
}

export function FeaturedToolEmpty({
  canAdd = false,
  onAddTool,
  className,
}: FeaturedToolEmptyProps) {
  if (!canAdd) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onAddTool}
      className={cn(
        'mx-4 mb-4 w-[calc(100%-2rem)] p-4 rounded-xl',
        'border border-dashed border-[#2A2A2A]',
        'text-[#818187] hover:text-[#A1A1A6]',
        'hover:border-[#3A3A3A] hover:bg-white/[0.02]',
        'transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
        className
      )}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-medium">+ Feature a tool</span>
      </div>
    </motion.button>
  );
}

export default FeaturedToolSlot;

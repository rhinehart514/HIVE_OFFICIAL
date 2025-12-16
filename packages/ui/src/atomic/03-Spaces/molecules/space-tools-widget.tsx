'use client';

/**
 * SpaceToolsWidget - Active tools section for space sidebar
 *
 * Refactored to use CollapsibleWidget pattern and glass morphism.
 * Now leverages centralized motion variants for consistent animation.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Zap, Clock, ChevronRight, Wrench } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { CollapsibleWidget } from './collapsible-widget';
import { SpaceEmptyState, ToolsEmptyState } from './space-empty-state';
import { railWidgetVariants, staggerFadeItemVariants, listStaggerVariants } from '../../../lib/motion-variants-spaces';
import {
  Badge,
  Button,
} from '../../00-Global/atoms';

export interface SpaceTool {
  id: string;
  name: string;
  icon?: string;
  type: string;
  closeTime?: string; // e.g., "2h 15m" or "Ends in 3 days"
  isActive: boolean;
  responseCount?: number;
}

export interface SpaceToolsWidgetData {
  spaceId: string;
  tools: SpaceTool[];
  hasMore: boolean;
}

export interface SpaceToolsWidgetCallbacks {
  onToolClick?: (toolId: string) => void;
  onViewAll?: (spaceId: string) => void;
}

export interface SpaceToolsWidgetProps
  extends SpaceToolsWidgetCallbacks,
    React.HTMLAttributes<HTMLDivElement> {
  data: SpaceToolsWidgetData;
  maxVisible?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Compact mode for mobile inline sections */
  compact?: boolean;
  /**
   * Inline mode: renders content without any wrapper styling
   * Used when widget is rendered inside a unified container (SpaceSidebar unified mode)
   */
  inline?: boolean;
}

export const SpaceToolsWidget = React.forwardRef<HTMLDivElement, SpaceToolsWidgetProps>(
  (
    {
      data,
      maxVisible = 3,
      collapsible = true,
      defaultCollapsed = false,
      compact = false,
      inline = false,
      onToolClick,
      onViewAll,
      className,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();
    const visibleTools = data.tools.slice(0, maxVisible);
    const hiddenCount = Math.max(0, data.tools.length - maxVisible);

    const content = data.tools.length === 0 ? (
      <ToolsEmptyState
        size={compact ? 'sm' : 'md'}
        animate={false}
      />
    ) : (
      <>
        {/* Tool List */}
        <motion.div
          className="flex flex-col gap-2"
          variants={shouldReduceMotion ? undefined : listStaggerVariants}
          initial="hidden"
          animate="visible"
        >
          {visibleTools.map((tool) => (
            <motion.button
              key={tool.id}
              onClick={() => onToolClick?.(tool.id)}
              variants={shouldReduceMotion ? undefined : staggerFadeItemVariants}
              className={cn(
                'group flex items-start gap-3 rounded-xl border border-transparent p-3 text-left',
                'transition-colors duration-150',
                'hover:border-[#2A2A2A]/50 hover:bg-[#141414]/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
              )}
              whileHover={shouldReduceMotion ? undefined : { x: 4 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              aria-label={`Open ${tool.name} tool${tool.responseCount ? `, ${tool.responseCount} responses` : ''}`}
            >
              {/* Tool Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFD700]/10 text-lg">
                {tool.icon ? (
                  <span>{tool.icon}</span>
                ) : (
                  <Zap className="h-5 w-5 text-[#FFD700]" />
                )}
              </div>

              {/* Tool Info */}
              <div className="flex flex-1 flex-col gap-2 min-w-0">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[#FAFAFA] truncate group-hover:text-[#FFD700] transition-colors">
                    {tool.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] text-[#818187] border-[#2A2A2A]"
                    >
                      {tool.type}
                    </Badge>
                    {tool.responseCount !== undefined && tool.responseCount > 0 && (
                      <span className="text-[10px] text-[#818187]">
                        {tool.responseCount} responses
                      </span>
                    )}
                  </div>
                </div>

                {/* Close Time Countdown */}
                {tool.closeTime && (
                  <div className="flex items-center gap-1.5 text-xs text-[#A1A1A6]">
                    <Clock className="h-3.5 w-3.5 text-[#FFD700]" />
                    <span>{tool.closeTime}</span>
                  </div>
                )}
              </div>

              {/* Chevron */}
              <ChevronRight className="h-4 w-4 shrink-0 text-[#52525B] transition-colors group-hover:text-[#A1A1A6]" />
            </motion.button>
          ))}
        </motion.div>

        {/* View All Link */}
        {(hiddenCount > 0 || data.hasMore) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewAll?.(data.spaceId)}
            className="mt-3 w-full text-[#A1A1A6] hover:text-[#FAFAFA]"
          >
            View all tools
            {hiddenCount > 0 && ` (+${hiddenCount} more)`}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </>
    );

    // INLINE MODE: No wrapper, just content with horizontal padding
    // Used when rendered inside a unified sidebar container
    if (inline || !collapsible) {
      return (
        <div ref={ref} className={cn('px-4', className)} {...props}>
          {/* Section header for inline mode */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[#A1A1A6]" />
              <span className="font-medium text-sm text-[#FAFAFA]">Active Tools</span>
            </div>
            {data.tools.length > 0 && (
              <span className="text-xs text-[#818187] bg-[#1A1A1A]/50 px-1.5 py-0.5 rounded-full">
                {data.tools.length}
              </span>
            )}
          </div>
          {content}
        </div>
      );
    }

    // STANDALONE MODE: Use CollapsibleWidget for collapsible version
    return (
      <div ref={ref} className={className} {...props}>
        <CollapsibleWidget
          title="Active Tools"
          icon={<Wrench className="h-4 w-4" />}
          badge={data.tools.length > 0 ? data.tools.length : undefined}
          defaultCollapsed={defaultCollapsed}
          persistKey={`space-tools-${data.spaceId}`}
          glass
          isEmpty={data.tools.length === 0}
        >
          {content}
        </CollapsibleWidget>
      </div>
    );
  }
);

SpaceToolsWidget.displayName = 'SpaceToolsWidget';

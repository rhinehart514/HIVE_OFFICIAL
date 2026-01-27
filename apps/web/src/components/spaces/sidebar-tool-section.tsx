'use client';

/**
 * SidebarToolSection - Collapsible section for tools in sidebar
 *
 * Shows pinned tools in the space sidebar with:
 * - Collapsible header "PINNED TOOLS"
 * - List of SidebarToolCard components
 * - Empty state with "Add from HiveLab" CTA
 * - Loading skeleton
 * - Drag-to-reorder for leaders
 *
 * @version 1.1.0 - HiveLab Phase 0 Polish (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/solid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Text } from '@hive/ui/design-system/primitives';
import { MOTION } from '@hive/tokens';
import { SidebarToolCard } from './sidebar-tool-card';
import type { PlacedToolDTO } from '@/hooks/use-space-tools';

// ============================================================
// Types
// ============================================================

export interface SidebarToolSectionProps {
  /** Tools to display */
  tools: PlacedToolDTO[];
  /** Loading state */
  isLoading?: boolean;
  /** Whether current user is a leader (can add/reorder tools) */
  isLeader?: boolean;
  /** Currently active/selected tool ID */
  activeToolId?: string;
  /** Handler when a tool card is clicked */
  onToolClick?: (tool: PlacedToolDTO) => void;
  /** Handler for "Run" action */
  onToolRun?: (tool: PlacedToolDTO) => void;
  /** Handler for "View Full" action */
  onToolViewFull?: (tool: PlacedToolDTO) => void;
  /** Handler for "Add Tool" button (leaders only) */
  onAddTool?: () => void;
  /** Handler for tool reorder (leaders only) */
  onReorder?: (orderedPlacementIds: string[]) => void;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
}

// ============================================================
// Sortable Tool Card Wrapper
// ============================================================

interface SortableToolCardProps {
  tool: PlacedToolDTO;
  isActive: boolean;
  isLeader: boolean;
  onToolClick?: (tool: PlacedToolDTO) => void;
  onToolRun?: (tool: PlacedToolDTO) => void;
  onToolViewFull?: (tool: PlacedToolDTO) => void;
}

function SortableToolCard({
  tool,
  isActive,
  isLeader,
  onToolClick,
  onToolRun,
  onToolViewFull,
}: SortableToolCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tool.placementId, disabled: !isLeader });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isLeader ? 'grab' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isLeader ? listeners : {})}
    >
      <SidebarToolCard
        tool={tool}
        isActive={isActive}
        isDraggable={isLeader}
        onClick={() => onToolClick?.(tool)}
        onRun={() => onToolRun?.(tool)}
        onViewFull={() => onToolViewFull?.(tool)}
      />
    </div>
  );
}

// ============================================================
// Loading Skeleton
// ============================================================

function ToolSectionSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-9 rounded-lg bg-white/[0.04] animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState({
  isLeader,
  onAddTool,
}: {
  isLeader: boolean;
  onAddTool?: () => void;
}) {
  return (
    <div className="py-4 px-2 text-center">
      <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
        <WrenchScrewdriverIcon className="w-5 h-5 text-white/30" />
      </div>
      <Text size="sm" className="text-white/40 mb-3">
        No tools pinned yet
      </Text>
      {isLeader && onAddTool && (
        <button
          onClick={onAddTool}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md',
            'text-xs font-medium',
            'bg-white/[0.04] hover:bg-white/[0.08]',
            'text-white/60 hover:text-white/80',
            'transition-colors duration-150'
          )}
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add from HiveLab
        </button>
      )}
    </div>
  );
}

// ============================================================
// Section Header
// ============================================================

function SectionHeader({
  isCollapsed,
  toolCount,
  onToggle,
}: {
  isCollapsed: boolean;
  toolCount: number;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center justify-between w-full py-2',
        'text-left group'
      )}
    >
      <div className="flex items-center gap-2">
        <Text
          size="xs"
          weight="medium"
          className="uppercase tracking-wider text-white/40 group-hover:text-white/60 transition-colors"
        >
          Pinned Tools
        </Text>
        {toolCount > 0 && (
          <span className="px-1.5 py-0.5 text-label-xs font-medium rounded bg-white/[0.06] text-white/40">
            {toolCount}
          </span>
        )}
      </div>
      <motion.div
        animate={{ rotate: isCollapsed ? -90 : 0 }}
        transition={{ duration: 0.15 }}
      >
        <ChevronDownIcon className="w-3.5 h-3.5 text-white/30 group-hover:text-white/50 transition-colors" />
      </motion.div>
    </button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SidebarToolSection({
  tools,
  isLoading = false,
  isLeader = false,
  activeToolId,
  onToolClick,
  onToolRun,
  onToolViewFull,
  onAddTool,
  onReorder,
  defaultCollapsed = false,
}: SidebarToolSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // Sort tools: leader-pinned first, then by order
  const sortedTools = React.useMemo(() => {
    return [...tools].sort((a, b) => {
      // Leader-pinned tools first
      if (a.source === 'leader' && b.source !== 'leader') return -1;
      if (a.source !== 'leader' && b.source === 'leader') return 1;
      // Then by order
      return a.order - b.order;
    });
  }, [tools]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px drag before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = sortedTools.findIndex(
          (t) => t.placementId === active.id
        );
        const newIndex = sortedTools.findIndex(
          (t) => t.placementId === over.id
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(sortedTools, oldIndex, newIndex);
          onReorder?.(reordered.map((t) => t.placementId));
        }
      }
    },
    [sortedTools, onReorder]
  );

  // Don't render section if loading is done and no tools + not a leader
  if (!isLoading && tools.length === 0 && !isLeader) {
    return null;
  }

  return (
    <motion.div
      className="mt-4 pt-4 border-t border-white/[0.06]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: MOTION.duration.standard / 1000, ease: MOTION.ease.premium }}
    >
      {/* Section Header */}
      <SectionHeader
        isCollapsed={isCollapsed}
        toolCount={sortedTools.length}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: MOTION.ease.premium }}
            className="overflow-hidden"
          >
            {isLoading ? (
              <ToolSectionSkeleton />
            ) : sortedTools.length === 0 ? (
              <EmptyState isLeader={isLeader} onAddTool={onAddTool} />
            ) : isLeader && onReorder ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedTools.map((t) => t.placementId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1 py-1">
                    {sortedTools.map((tool) => (
                      <SortableToolCard
                        key={tool.placementId}
                        tool={tool}
                        isActive={tool.placementId === activeToolId}
                        isLeader={isLeader}
                        onToolClick={onToolClick}
                        onToolRun={onToolRun}
                        onToolViewFull={onToolViewFull}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-1 py-1">
                {sortedTools.map((tool) => (
                  <SidebarToolCard
                    key={tool.placementId}
                    tool={tool}
                    isActive={tool.placementId === activeToolId}
                    onClick={() => onToolClick?.(tool)}
                    onRun={() => onToolRun?.(tool)}
                    onViewFull={() => onToolViewFull?.(tool)}
                  />
                ))}
              </div>
            )}

            {/* Add Tool Button (leaders only, shown below tools) */}
            {!isLoading && sortedTools.length > 0 && isLeader && onAddTool && (
              <motion.button
                onClick={onAddTool}
                className={cn(
                  'mt-2 w-full px-2 py-2 rounded-lg',
                  'flex items-center gap-2',
                  'text-white/40 hover:text-white/60',
                  'hover:bg-white/[0.04]',
                  'transition-all duration-150',
                  'border border-dashed border-white/[0.06] hover:border-white/[0.12]'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PlusIcon className="w-4 h-4" />
                <Text size="sm">Add tool</Text>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SidebarToolSection;

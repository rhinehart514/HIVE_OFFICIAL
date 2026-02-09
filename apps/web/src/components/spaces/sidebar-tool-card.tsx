'use client';

/**
 * SidebarToolCard - Individual tool card for sidebar placement
 *
 * Displays a tool in the space sidebar with:
 * - Tool icon and name
 * - Activity badge showing recent interactions
 * - Hover actions: Run (opens modal), View Full (navigates to app)
 * - Active state with gold accent
 *
 * @version 1.0.0 - HiveLab Sprint 1 (Jan 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  ArrowTopRightOnSquareIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { MapPinIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils';
import { Text } from '@hive/ui/design-system/primitives';
import type { PlacedToolDTO } from '@/hooks/use-space-tools';
import { useUnpinTool } from '@/hooks/mutations/use-unpin-tool';

// ============================================================
// Types
// ============================================================

export interface SidebarToolCardProps {
  /** The placed tool data */
  tool: PlacedToolDTO;
  /** Space ID (required for unpin action) */
  spaceId?: string;
  /** Whether this tool is currently active/selected */
  isActive?: boolean;
  /** Whether drag handle should be shown (leaders only) */
  isDraggable?: boolean;
  /** Whether user is a leader (enables unpin button) */
  isLeader?: boolean;
  /** Handler when tool is clicked (default action) */
  onClick?: () => void;
  /** Handler for "Run" action (opens tool in modal) */
  onRun?: () => void;
  /** Handler for "View Full" action (navigates to full app) */
  onViewFull?: () => void;
}

// ============================================================
// Activity Badge
// ============================================================

function ActivityBadge({ count }: { count: number }) {
  if (count === 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'px-1.5 py-0.5 text-label-xs font-medium rounded-full',
        'bg-[var(--color-accent-gold,#FFD700)] text-black'
      )}
    >
      {displayCount}
    </motion.span>
  );
}

// ============================================================
// Tool Icon
// ============================================================

function ToolIcon({
  category,
  isActive,
}: {
  category: string;
  isActive: boolean;
}) {
  // Map categories to colors for visual differentiation
  const categoryColors: Record<string, string> = {
    productivity: 'text-blue-400',
    academic: 'text-emerald-400',
    social: 'text-pink-400',
    utility: 'text-amber-400',
    entertainment: 'text-purple-400',
    other: 'text-white/60',
  };

  const colorClass = isActive
    ? 'text-white'
    : categoryColors[category] || 'text-white/40';

  return (
    <div
      className={cn(
        'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0',
        'bg-white/[0.06]',
        isActive && 'bg-[var(--color-accent-gold,#FFD700)]/20'
      )}
    >
      <WrenchScrewdriverIcon className={cn('w-3.5 h-3.5', colorClass)} />
    </div>
  );
}

// ============================================================
// Hover Actions
// ============================================================

function HoverActions({
  onRun,
  onViewFull,
  onUnpin,
  showViewFull,
  showUnpin,
}: {
  onRun?: () => void;
  onViewFull?: () => void;
  onUnpin?: () => void;
  showViewFull: boolean;
  showUnpin: boolean;
}) {
  return (
    <motion.div
      className="flex items-center gap-1"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15 }}
    >
      {/* Run Button */}
      {onRun && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRun();
          }}
          className={cn(
            'p-1 rounded transition-colors',
            'hover:bg-[var(--color-accent-gold,#FFD700)]/20',
            'text-[var(--color-accent-gold,#FFD700)]'
          )}
          title="Run tool"
        >
          <PlayIcon className="w-3.5 h-3.5" />
        </button>
      )}

      {/* View Full Button (only if tool supports app mode) */}
      {showViewFull && onViewFull && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewFull();
          }}
          className={cn(
            'p-1 rounded transition-colors',
            'hover:bg-white/[0.08]',
            'text-white/40 hover:text-white/60'
          )}
          title="View in Lab"
        >
          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Unpin Button (leaders only, for pinned tools) */}
      {showUnpin && onUnpin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnpin();
          }}
          className={cn(
            'p-1 rounded transition-colors',
            'hover:bg-red-500/20',
            'text-white/40 hover:text-red-400'
          )}
          title="Unpin from sidebar"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SidebarToolCard({
  tool,
  spaceId,
  isActive = false,
  isDraggable: _isDraggable = false,
  isLeader = false,
  onClick,
  onRun,
  onViewFull,
}: SidebarToolCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const unpinMutation = useUnpinTool();

  // Display name (use override if set)
  const displayName = tool.titleOverride || tool.name;

  // Is this a leader-pinned tool?
  const isPinned = tool.source === 'leader';

  // Handle unpin
  const handleUnpin = React.useCallback(() => {
    if (!spaceId) return;
    unpinMutation.mutate({
      spaceId,
      placementId: tool.placementId,
    });
  }, [spaceId, tool.placementId, unpinMutation]);

  return (
    <motion.button
      onClick={onClick || onRun}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group w-full px-2 py-2 rounded-lg',
        'flex items-center gap-2',
        'transition-all duration-150',
        'text-left',
        // Active state
        isActive && [
          'bg-white/[0.08]',
          'text-white',
          'border-l-2 border-[var(--color-accent-gold,#FFD700)]',
          'ml-[-2px]',
        ],
        // Inactive state
        !isActive && [
          'hover:bg-white/[0.04]',
          'text-white/60 hover:text-white/80',
        ]
      )}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Tool Icon with Pin Indicator */}
      <div className="relative flex-shrink-0">
        <ToolIcon category={tool.category} isActive={isActive} />
        {isPinned && (
          <MapPinIcon
            className="absolute -top-1 -right-1 w-2.5 h-2.5 text-[var(--color-accent-gold,#FFD700)]"
            aria-label="Pinned by leader"
          />
        )}
      </div>

      {/* Tool Name */}
      <Text
        size="sm"
        weight={isActive ? 'medium' : 'normal'}
        className="flex-1 truncate"
      >
        {displayName}
      </Text>

      {/* Activity Badge or Hover Actions */}
      <AnimatePresence mode="wait">
        {isHovered ? (
          <HoverActions
            key="actions"
            onRun={onRun}
            onViewFull={onViewFull}
            onUnpin={handleUnpin}
            showViewFull={!!onViewFull}
            showUnpin={isLeader && isPinned}
          />
        ) : (
          tool.activityCount !== undefined &&
          tool.activityCount > 0 && (
            <ActivityBadge key="badge" count={tool.activityCount} />
          )
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default SidebarToolCard;

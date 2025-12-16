'use client';

/**
 * SidebarToolSlot - HiveLab tool renderer for space sidebar
 *
 * Renders a single deployed HiveLab tool within the space sidebar.
 * Supports edit mode with drag handle, configure, and remove buttons.
 * Each sidebar widget is a deployed tool - no hard-coded widgets.
 *
 * ## Visual Language
 * - Collapsible card with header and content area
 * - Edit mode: drag handle, gear icon, X button
 * - Gold border when in edit mode
 * - Smooth collapse/expand animation
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { GripVertical, Settings, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../../lib/utils';

// ============================================================
// Types
// ============================================================

export interface SidebarSlotData {
  /** Unique slot ID */
  slotId: string;
  /** HiveLab tool ID (null for system templates) */
  toolId: string | null;
  /** Deployment reference ID */
  deploymentId: string;
  /** Display name */
  name: string;
  /** Tool type/category */
  type: string;
  /** Slot order position */
  order: number;
  /** Whether collapsed */
  collapsed: boolean;
  /** Tool-specific configuration */
  config: Record<string, unknown>;
}

export interface SidebarToolSlotProps {
  /** Slot data */
  slot: SidebarSlotData;
  /** Whether edit mode is active (leader only) */
  isEditMode?: boolean;
  /** Callback when slot is clicked */
  onClick?: () => void;
  /** Callback when configure is clicked (edit mode) */
  onConfigure?: () => void;
  /** Callback when remove is clicked (edit mode) */
  onRemove?: () => void;
  /** Callback when collapse state changes */
  onToggleCollapse?: () => void;
  /** Child content to render (tool output) */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Drag handle props for dnd-kit */
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

// ============================================================
// Component
// ============================================================

export function SidebarToolSlot({
  slot,
  isEditMode = false,
  onClick,
  onConfigure,
  onRemove,
  onToggleCollapse,
  children,
  className,
  dragHandleProps,
}: SidebarToolSlotProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Motion variants based on reduced motion preference
  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 500, damping: 30 };

  return (
    <motion.div
      layout={!shouldReduceMotion}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      transition={springTransition}
      className={cn(
        'rounded-xl overflow-hidden transition-all duration-200',
        'bg-[#141414]/80 border',
        isEditMode
          ? 'border-[#FFD700]/30 shadow-[0_0_12px_rgba(255,215,0,0.1)]'
          : 'border-[#2A2A2A]/50',
        isHovered && !isEditMode && 'border-[#3A3A3A]/50',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2.5',
          'border-b border-[#2A2A2A]/50',
          !slot.collapsed && 'bg-[#141414]/50'
        )}
      >
        {/* Drag handle (edit mode only) */}
        {isEditMode && (
          <button
            {...dragHandleProps}
            className={cn(
              'flex-shrink-0 p-1 -ml-1 rounded cursor-grab active:cursor-grabbing',
              'text-[#818187] hover:text-[#A1A1A6] hover:bg-white/5',
              // White focus ring (not gold)
              'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
            )}
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        {/* Title - clickable to expand/collapse */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            'flex-1 flex items-center gap-2 min-w-0 text-left',
            // White focus ring (not gold)
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded'
          )}
          aria-expanded={!slot.collapsed}
        >
          <span className="text-sm font-medium text-white truncate">
            {slot.name}
          </span>
          {slot.collapsed ? (
            <ChevronDown className="w-4 h-4 text-[#818187] flex-shrink-0" />
          ) : (
            <ChevronUp className="w-4 h-4 text-[#818187] flex-shrink-0" />
          )}
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Configure button (edit mode only) */}
          {isEditMode && onConfigure && (
            <motion.button
              whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
              }}
              className={cn(
                'p-1.5 rounded-lg',
                'text-[#818187] hover:text-[#FFD700] hover:bg-[#FFD700]/10',
                // White focus ring (not gold)
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20'
              )}
              aria-label={`Configure ${slot.name}`}
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          )}

          {/* Remove button (edit mode only) */}
          {isEditMode && onRemove && (
            <motion.button
              whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className={cn(
                'p-1.5 rounded-lg',
                'text-[#818187] hover:text-red-400 hover:bg-red-400/10',
                // Red focus ring for danger action is acceptable
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40'
              )}
              aria-label={`Remove ${slot.name}`}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Content (collapsible) */}
      <AnimatePresence initial={false}>
        {!slot.collapsed && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={springTransition}
            className="overflow-hidden"
          >
            <div
              className={cn('p-3', onClick && 'cursor-pointer')}
              onClick={onClick}
            >
              {children || (
                <div className="text-sm text-[#818187] italic">
                  Loading tool content...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SidebarToolSlot;

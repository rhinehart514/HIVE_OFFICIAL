'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import type { ToolElement, ToolCanvasContext, ToolCanvasProps } from '../tool-canvas';
import type { ElementSharedState, ElementUserState } from '../../../lib/hivelab/element-system';

/**
 * CompactSurface
 *
 * Sprint 5: Surface-Specific UI
 *
 * Optimized for sidebar placement:
 * - Reduced padding (12px vs 16px)
 * - Single primary metric or summary
 * - Minimal chrome
 * - Truncated content with hover expansion
 */

export interface CompactSurfaceProps {
  /** Tool elements to render */
  elements: ToolElement[];
  /** Current state */
  state: Record<string, unknown>;
  /** Shared state for collaborative features */
  sharedState?: ElementSharedState;
  /** Per-user state */
  userState?: ElementUserState;
  /** Context for space-aware elements */
  context?: ToolCanvasContext;
  /** Callback when element state changes */
  onElementChange?: (instanceId: string, data: unknown) => void;
  /** Callback when element triggers an action */
  onElementAction?: (instanceId: string, action: string, payload: unknown) => void;
  /** Whether to show expand affordance */
  expandable?: boolean;
  /** Callback when user wants to expand */
  onExpand?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Title to display */
  title?: string;
  /** Icon component */
  icon?: React.ReactNode;
}

/**
 * Extract primary metric from tool state
 * Looks for common patterns like counters, vote counts, etc.
 */
function extractPrimaryMetric(
  state: Record<string, unknown>,
  sharedState?: ElementSharedState
): { label: string; value: string | number } | null {
  // Check shared state counters first
  if (sharedState?.counters) {
    const counters = sharedState.counters;
    const counterKeys = Object.keys(counters);
    if (counterKeys.length > 0) {
      const key = counterKeys[0];
      return {
        label: formatLabel(key),
        value: counters[key],
      };
    }
  }

  // Check for common patterns in state
  const patterns = ['count', 'total', 'votes', 'responses', 'participants', 'members'];
  for (const [key, value] of Object.entries(state)) {
    if (typeof value === 'number' && patterns.some(p => key.toLowerCase().includes(p))) {
      return {
        label: formatLabel(key),
        value,
      };
    }
  }

  return null;
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

const glass = {
  surface: "bg-white/[0.03] border border-white/[0.06] backdrop-blur-md",
  hover: "hover:bg-white/[0.05] hover:border-white/[0.08]",
};

export function CompactSurface({
  elements,
  state,
  sharedState,
  userState,
  context,
  onElementChange,
  onElementAction,
  expandable = true,
  onExpand,
  className,
  title,
  icon,
}: CompactSurfaceProps) {
  const prefersReducedMotion = useReducedMotion();
  const metric = extractPrimaryMetric(state, sharedState);

  const handleClick = () => {
    if (expandable && onExpand) {
      onExpand();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        "rounded-lg p-3 cursor-pointer transition-all duration-150",
        glass.surface,
        expandable && glass.hover,
        className
      )}
      onClick={handleClick}
      role={expandable ? "button" : undefined}
      tabIndex={expandable ? 0 : undefined}
      onKeyDown={expandable ? (e) => e.key === 'Enter' && onExpand?.() : undefined}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        {icon && (
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-gray-400">
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-medium text-gray-200 truncate">
              {title}
            </p>
          )}
          {metric && (
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-semibold text-white tabular-nums">
                {typeof metric.value === 'number'
                  ? metric.value.toLocaleString()
                  : metric.value}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {metric.label}
              </span>
            </div>
          )}
        </div>

        {/* Expand affordance */}
        {expandable && (
          <motion.div
            className="flex-shrink-0 text-gray-500"
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default CompactSurface;

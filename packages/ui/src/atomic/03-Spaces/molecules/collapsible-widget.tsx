/**
 * CollapsibleWidget - Shared collapsible pattern for sidebar widgets
 *
 * Extracted pattern used by all Space sidebar widgets for consistent
 * collapse/expand behavior with optional localStorage persistence.
 *
 * Features:
 * - Smooth height animation on collapse/expand
 * - Optional badge/count display in header
 * - Optional icon in header
 * - Glass morphism styling
 * - localStorage persistence for collapse state
 * - Empty state support
 *
 * @example
 * <CollapsibleWidget
 *   title="About"
 *   icon={<InfoIcon />}
 *   persistKey="space-about"
 * >
 *   <AboutContent />
 * </CollapsibleWidget>
 */
'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { GlassWidget } from '../atoms/glass-surface';
import {
  collapsibleVariants,
  chevronRotateVariants,
  railWidgetVariants,
} from '../../../lib/motion-variants-spaces';

export interface CollapsibleWidgetProps {
  /** Widget title displayed in header */
  title: string;
  /** Optional badge content (e.g., count) */
  badge?: React.ReactNode;
  /** Optional icon for header */
  icon?: React.ReactNode;
  /** Whether collapsed by default */
  defaultCollapsed?: boolean;
  /** Controlled collapsed state */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** localStorage key for persisting collapse state */
  persistKey?: string;
  /** Content to render when empty */
  emptyState?: React.ReactNode;
  /** Whether to apply glass morphism styling */
  glass?: boolean;
  /** Whether content is empty (triggers empty state) */
  isEmpty?: boolean;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Additional header actions */
  headerActions?: React.ReactNode;
  /** Children content */
  children: React.ReactNode;
  /** Additional className for wrapper */
  className?: string;
}

export function CollapsibleWidget({
  title,
  badge,
  icon,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  persistKey,
  emptyState,
  glass = true,
  isEmpty = false,
  animate = true,
  headerActions,
  children,
  className,
}: CollapsibleWidgetProps) {
  // Initialize state from localStorage or default
  const [internalCollapsed, setInternalCollapsed] = React.useState(() => {
    if (typeof window !== 'undefined' && persistKey) {
      const stored = localStorage.getItem(`collapsible-${persistKey}`);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return defaultCollapsed;
  });

  // Use controlled or internal state
  const isCollapsed = controlledCollapsed ?? internalCollapsed;

  // Handle toggle
  const handleToggle = React.useCallback(() => {
    const newValue = !isCollapsed;

    // Update internal state if uncontrolled
    if (controlledCollapsed === undefined) {
      setInternalCollapsed(newValue);
    }

    // Persist to localStorage if key provided
    if (persistKey && typeof window !== 'undefined') {
      localStorage.setItem(`collapsible-${persistKey}`, String(newValue));
    }

    // Notify parent
    onCollapsedChange?.(newValue);
  }, [isCollapsed, controlledCollapsed, persistKey, onCollapsedChange]);

  // Wrapper component - glass or plain div
  const Wrapper = glass ? GlassWidget : 'div';
  const wrapperProps = glass ? {} : { className: 'bg-neutral-900/50 rounded-2xl border border-neutral-800/50' };

  return (
    <motion.div
      variants={animate ? railWidgetVariants : undefined}
      initial={animate ? 'initial' : undefined}
      animate={animate ? 'animate' : undefined}
      whileHover={animate ? 'hover' : undefined}
      className={className}
    >
      <Wrapper {...wrapperProps}>
        {/* Header - always visible */}
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'flex w-full items-center justify-between',
            'px-4 py-3',
            'text-left',
            'hover:bg-white/[0.02] transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-inset',
            'rounded-t-2xl',
            !isCollapsed && 'border-b border-white/[0.04]'
          )}
          aria-expanded={!isCollapsed}
        >
          <div className="flex items-center gap-2">
            {icon && (
              <span className="text-neutral-400 flex-shrink-0">
                {icon}
              </span>
            )}
            <span className="font-medium text-sm text-neutral-100">
              {title}
            </span>
            {badge && (
              <span className="text-xs text-neutral-500 bg-neutral-800/50 px-1.5 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {headerActions}
            <motion.span
              variants={chevronRotateVariants}
              animate={isCollapsed ? 'collapsed' : 'expanded'}
              className="text-neutral-500"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </div>
        </button>

        {/* Content - collapsible */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              variants={collapsibleVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="overflow-hidden"
            >
              <div className="px-4 py-3">
                {isEmpty && emptyState ? emptyState : children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Wrapper>
    </motion.div>
  );
}

// Compact variant for tighter spaces
export interface CompactCollapsibleWidgetProps extends CollapsibleWidgetProps {
  /** Compact mode reduces padding */
  compact?: boolean;
}

export function CompactCollapsibleWidget({
  compact = true,
  ...props
}: CompactCollapsibleWidgetProps) {
  return <CollapsibleWidget {...props} />;
}

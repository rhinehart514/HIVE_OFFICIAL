'use client';

/**
 * ElementShowcaseGrid
 *
 * Responsive grid layout for element bundles.
 * Handles the 4-bundle display with expand/collapse behavior.
 */

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BUNDLE_ORDER } from './element-showcase-data';
import { ElementBundleCard } from './ElementBundleCard';
import { cn } from '../../../lib/utils';
import { staggerContainerVariants } from '../../../lib/motion-variants';

// ============================================================================
// Types
// ============================================================================

export interface ElementShowcaseGridProps {
  /** Callback when an element is selected */
  onElementSelect?: (elementId: string) => void;
  /** Callback when a prompt suggestion is clicked */
  onPromptClick?: (prompt: string) => void;
  /** Initially expanded bundle ID */
  defaultExpanded?: string | null;
  /** Controlled expanded state */
  expandedBundle?: string | null;
  /** Callback for controlled expand state */
  onExpandChange?: (bundleId: string | null) => void;
  /** Layout mode */
  layout?: 'grid' | 'list' | 'compact';
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Animation Variants
// ============================================================================

const gridItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

// ============================================================================
// ElementShowcaseGrid Component
// ============================================================================

export function ElementShowcaseGrid({
  onElementSelect,
  onPromptClick,
  defaultExpanded = null,
  expandedBundle: controlledExpanded,
  onExpandChange,
  layout = 'grid',
  className,
}: ElementShowcaseGridProps) {
  // Internal expanded state (uncontrolled mode)
  const [internalExpanded, setInternalExpanded] = useState<string | null>(defaultExpanded);

  // Use controlled or internal state
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  const handleExpand = useCallback(
    (bundleId: string) => {
      const newValue = expanded === bundleId ? null : bundleId;

      if (isControlled) {
        onExpandChange?.(newValue);
      } else {
        setInternalExpanded(newValue);
      }
    },
    [expanded, isControlled, onExpandChange]
  );

  const handleElementSelect = useCallback(
    (elementId: string) => {
      onElementSelect?.(elementId);
    },
    [onElementSelect]
  );

  const handlePromptClick = useCallback(
    (prompt: string) => {
      onPromptClick?.(prompt);
    },
    [onPromptClick]
  );

  // Layout classes
  const layoutClasses = {
    grid: 'grid grid-cols-1 gap-4 md:grid-cols-2',
    list: 'flex flex-col gap-4',
    compact: 'grid grid-cols-2 gap-3 md:grid-cols-4',
  };

  return (
    <motion.div
      className={cn(
        'element-showcase-grid',
        layoutClasses[layout],
        className
      )}
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {BUNDLE_ORDER.map((bundleId) => {
          const isExpanded = expanded === bundleId;

          return (
            <motion.div
              key={bundleId}
              variants={gridItemVariants}
              layout
              className={cn(
                // When expanded in grid mode, span full width
                isExpanded && layout === 'grid' && 'md:col-span-2'
              )}
            >
              <ElementBundleCard
                bundleId={bundleId}
                expanded={isExpanded}
                onExpand={handleExpand}
                onElementSelect={handleElementSelect}
                onPromptClick={handlePromptClick}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Compact Sidebar Variant
// ============================================================================

export interface ElementShowcaseSidebarProps {
  /** Callback when an element is selected */
  onElementSelect?: (elementId: string) => void;
  /** Callback when a prompt suggestion is clicked */
  onPromptClick?: (prompt: string) => void;
  /** Callback when a template is selected */
  onTemplateSelect?: (template: ToolComposition) => void;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Callback for collapse toggle */
  onCollapseChange?: (collapsed: boolean) => void;
  /** Additional class names */
  className?: string;
}

export function ElementShowcaseSidebar({
  onElementSelect,
  onPromptClick,
  onTemplateSelect,
  collapsed = false,
  onCollapseChange,
  className,
}: ElementShowcaseSidebarProps) {
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'elements' | 'templates'>('elements');

  const handleExpand = useCallback((bundleId: string | null) => {
    setExpandedBundle(bundleId);
    // Auto-expand sidebar when a bundle is expanded
    if (bundleId && collapsed) {
      onCollapseChange?.(false);
    }
  }, [collapsed, onCollapseChange]);

  return (
    <motion.aside
      className={cn(
        'element-showcase-sidebar flex flex-col gap-3 overflow-y-auto',
        collapsed ? 'w-16' : 'w-80',
        className
      )}
      animate={{ width: collapsed ? 64 : 320 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        {!collapsed && (
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-semibold text-muted-foreground"
          >
            Build Tools
          </motion.h3>
        )}
        <button
          onClick={() => onCollapseChange?.(!collapsed)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            animate={{ rotate: collapsed ? 180 : 0 }}
          >
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </button>
      </div>

      {/* Tab Switcher (only when expanded) */}
      {!collapsed && (
        <div className="flex gap-1 px-3">
          <button
            onClick={() => setActiveTab('elements')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              activeTab === 'elements'
                ? 'bg-[#1A1A1A] text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-[#1A1A1A]/50'
            )}
          >
            Elements
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              activeTab === 'templates'
                ? 'bg-[#1A1A1A] text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-[#1A1A1A]/50'
            )}
          >
            Templates
          </button>
        </div>
      )}

      {/* Content */}
      {collapsed ? (
        // Collapsed: Show only icons
        <div className="flex flex-col gap-2 px-2">
          {BUNDLE_ORDER.map((bundleId) => (
            <CollapsedBundleButton
              key={bundleId}
              bundleId={bundleId}
              onClick={() => handleExpand(bundleId)}
            />
          ))}
        </div>
      ) : (
        // Expanded: Show elements or templates based on active tab
        <div className="flex flex-col gap-3 px-3 pb-3">
          <AnimatePresence mode="wait">
            {activeTab === 'elements' ? (
              <motion.div
                key="elements"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <ElementShowcaseGrid
                  layout="list"
                  expandedBundle={expandedBundle}
                  onExpandChange={handleExpand}
                  onElementSelect={onElementSelect}
                  onPromptClick={onPromptClick}
                />
              </motion.div>
            ) : (
              <motion.div
                key="templates"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                <TemplateBrowser
                  onTemplateSelect={onTemplateSelect}
                  compact
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.aside>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

import { ELEMENT_BUNDLES } from './element-showcase-data';
import { TemplateBrowser } from './TemplateBrowser';
import type { ToolComposition } from '../../../lib/hivelab/element-system';

function CollapsedBundleButton({
  bundleId,
  onClick,
}: {
  bundleId: string;
  onClick: () => void;
}) {
  const bundle = ELEMENT_BUNDLES[bundleId];
  if (!bundle) return null;

  const BundleIcon = bundle.icon;

  return (
    <motion.button
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title={bundle.name}
    >
      <BundleIcon className="h-5 w-5" />
    </motion.button>
  );
}

export default ElementShowcaseGrid;

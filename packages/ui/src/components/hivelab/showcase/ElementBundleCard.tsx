'use client';

/**
 * ElementBundleCard
 *
 * Problem-first bundle card that groups related elements.
 * Expands to show live interactive element previews.
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  ELEMENT_BUNDLES,
  getBundleElements,
  type ElementBundleDefinition,
} from './element-showcase-data';
import { ElementShowcase } from './ElementShowcase';
import { cn } from '../../../lib/utils';
import { springPresets } from '@hive/tokens';

// ============================================================================
// Types
// ============================================================================

export interface ElementBundleCardProps {
  /** Bundle ID (run-event, engage-members, organize-find, track-display) */
  bundleId: string;
  /** Whether the bundle is expanded */
  expanded?: boolean;
  /** Callback when expand/collapse is triggered */
  onExpand?: (bundleId: string) => void;
  /** Callback when an element is selected */
  onElementSelect?: (elementId: string) => void;
  /** Callback when prompt suggestion is clicked */
  onPromptClick?: (prompt: string) => void;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Color Variants
// ============================================================================

const bundleColorVariants: Record<string, { bg: string; border: string; accent: string }> = {
  amber: {
    bg: 'bg-amber-500/5 hover:bg-amber-500/10',
    border: 'border-amber-500/20',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  violet: {
    bg: 'bg-violet-500/5 hover:bg-violet-500/10',
    border: 'border-violet-500/20',
    accent: 'text-violet-600 dark:text-violet-400',
  },
  sky: {
    bg: 'bg-sky-500/5 hover:bg-sky-500/10',
    border: 'border-sky-500/20',
    accent: 'text-sky-600 dark:text-sky-400',
  },
  emerald: {
    bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
    border: 'border-emerald-500/20',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
};

// ============================================================================
// Animation Variants
// ============================================================================

const cardVariants = {
  collapsed: {
    height: 'auto',
  },
  expanded: {
    height: 'auto',
  },
};

const contentVariants = {
  collapsed: {
    opacity: 0,
    height: 0,
    transition: {
      ...springPresets.gentle,
      opacity: { duration: 0.15 },
    },
  },
  expanded: {
    opacity: 1,
    height: 'auto',
    transition: {
      ...springPresets.gentle,
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
};

const elementGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const elementItemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springPresets.gentle,
  },
};

// ============================================================================
// Collapsed Thumbnail Grid
// ============================================================================

function ThumbnailGrid({
  elements,
  colors,
}: {
  elements: string[];
  colors: { bg: string; border: string };
}) {
  // Show max 4 thumbnails in a 2x2 grid
  const displayElements = elements.slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {displayElements.map((elementId) => (
        <div
          key={elementId}
          className={cn(
            'aspect-square rounded-md border',
            colors.border,
            'bg-background/60 p-1'
          )}
        >
          {/* Mini element preview - could be an icon or simplified view */}
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ElementBundleCard Component
// ============================================================================

export function ElementBundleCard({
  bundleId,
  expanded = false,
  onExpand,
  onElementSelect,
  onPromptClick,
  className,
}: ElementBundleCardProps) {
  const bundle = ELEMENT_BUNDLES[bundleId] as ElementBundleDefinition | undefined;
  const elements = getBundleElements(bundleId);
  const colors = bundleColorVariants[bundle?.color || 'amber'];

  // Handle missing bundle
  if (!bundle) {
    return (
      <div className={cn('p-4 text-sm text-muted-foreground', className)}>
        Unknown bundle: {bundleId}
      </div>
    );
  }

  const BundleIcon = bundle.icon;

  const handleToggle = useCallback(() => {
    onExpand?.(bundleId);
  }, [bundleId, onExpand]);

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

  return (
    <motion.div
      className={cn(
        'bundle-card rounded-xl border transition-colors',
        colors.bg,
        colors.border,
        expanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md',
        className
      )}
      layout
      variants={cardVariants}
      animate={expanded ? 'expanded' : 'collapsed'}
      transition={springPresets.gentle}
    >
      {/* Header - always visible */}
      <motion.button
        className={cn(
          'flex w-full items-center gap-3 p-4 text-left',
          expanded && 'border-b ' + colors.border
        )}
        onClick={handleToggle}
        whileHover={{ opacity: 0.9 }}
        whileTap={{ opacity: 0.8 }}
      >
        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            colors.bg,
            colors.accent
          )}
        >
          <BundleIcon className="h-5 w-5" />
        </div>

        {/* Title & Tagline */}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">{bundle.name}</h3>
          <p className="truncate text-sm text-muted-foreground">{bundle.tagline}</p>
        </div>

        {/* Collapsed: Thumbnail Grid | Expanded: Close button */}
        {expanded ? (
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            whileHover={{ opacity: 0.9 }}
            whileTap={{ opacity: 0.8 }}
          >
            <XMarkIcon className="h-4 w-4" />
          </motion.div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <ThumbnailGrid elements={bundle.elements} colors={colors} />
            </div>
            <motion.div
              className={cn('text-muted-foreground', colors.accent)}
              animate={{ x: [0, 4, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </motion.div>
          </div>
        )}
      </motion.button>

      {/* Expanded Content */}
      <AnimatePresence mode="wait">
        {expanded && (
          <motion.div
            key="content"
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            {/* Element Grid */}
            <motion.div
              className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2"
              variants={elementGridVariants}
              initial="hidden"
              animate="visible"
            >
              {elements.map((element) => (
                <motion.div key={element.elementId} variants={elementItemVariants}>
                  <ElementShowcase
                    elementId={element.elementId}
                    variant="expanded"
                    interactive={false}
                    showPromptHint
                    onSelect={handleElementSelect}
                    onPromptClick={handlePromptClick}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Bundle Prompt Suggestion */}
            <div className="border-t px-4 py-3" style={{ borderColor: colors.border }}>
              <motion.button
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-left transition-colors',
                  colors.bg,
                  'hover:opacity-80'
                )}
                onClick={() => handlePromptClick(bundle.promptSuggestion)}
                whileHover={{ opacity: 0.9 }}
                whileTap={{ opacity: 0.8 }}
              >
                <span className={cn('text-sm font-medium', colors.accent)}>
                  Try:
                </span>
                <span className="flex-1 text-sm text-foreground">
                  &ldquo;{bundle.promptSuggestion}&rdquo;
                </span>
                <ChevronRightIcon className={cn('h-4 w-4', colors.accent)} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ElementBundleCard;

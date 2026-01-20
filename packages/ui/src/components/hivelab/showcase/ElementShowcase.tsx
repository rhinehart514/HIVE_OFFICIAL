'use client';

/**
 * ElementShowcase
 *
 * Core interactive wrapper that renders live element previews.
 * Uses IsolatedElementRenderer pattern for safe hook isolation.
 */

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { renderElement } from '../element-renderers';
import { ELEMENT_SHOWCASE_DATA, type ElementShowcaseMetadata } from './element-showcase-data';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ElementShowcaseProps {
  /** Element ID to showcase */
  elementId: string;
  /** Display variant */
  variant?: 'card' | 'expanded' | 'minimal';
  /** Enable interactivity */
  interactive?: boolean;
  /** Show prompt hint below */
  showPromptHint?: boolean;
  /** Callback when element is selected */
  onSelect?: (elementId: string) => void;
  /** Callback when prompt hint is clicked */
  onPromptClick?: (prompt: string) => void;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// IsolatedElementRenderer (memo-wrapped for hook isolation)
// ============================================================================

/**
 * Isolates element rendering to prevent hook state leakage.
 * Each element render is a separate component instance.
 */
const IsolatedElementRenderer = memo(({
  elementId,
  config,
  interactive = false,
}: {
  elementId: string;
  config: Record<string, unknown>;
  interactive?: boolean;
}) => {
  // Generate stable instance ID for this preview
  const instanceId = `showcase-${elementId}`;

  // No-op handlers for showcase mode (non-interactive)
  const handleChange = useCallback(() => {
    // Showcase elements don't persist changes
  }, []);

  const handleAction = useCallback(() => {
    // Showcase elements don't trigger real actions
  }, []);

  return (
    <div
      className={cn(
        'element-showcase-renderer',
        !interactive && 'pointer-events-none select-none'
      )}
    >
      {renderElement(elementId, {
        id: instanceId,
        config: config as Record<string, unknown>,
        onChange: handleChange,
        onAction: handleAction,
      })}
    </div>
  );
});

IsolatedElementRenderer.displayName = 'IsolatedElementRenderer';

// ============================================================================
// ElementShowcase Component
// ============================================================================

export function ElementShowcase({
  elementId,
  variant = 'card',
  interactive = false,
  showPromptHint = false,
  onSelect,
  onPromptClick,
  className,
}: ElementShowcaseProps) {
  const metadata = ELEMENT_SHOWCASE_DATA[elementId];

  // Fallback for unknown elements
  if (!metadata) {
    return (
      <div className={cn('p-4 text-sm text-muted-foreground', className)}>
        Unknown element: {elementId}
      </div>
    );
  }

  const handleClick = useCallback(() => {
    onSelect?.(elementId);
  }, [elementId, onSelect]);

  const handlePromptClick = useCallback(() => {
    if (metadata.prompts.length > 0) {
      onPromptClick?.(metadata.prompts[0]);
    }
  }, [metadata.prompts, onPromptClick]);

  // Minimal variant - just the element preview
  if (variant === 'minimal') {
    return (
      <div className={cn('showcase-minimal', className)}>
        <IsolatedElementRenderer
          elementId={elementId}
          config={metadata.demoConfig}
          interactive={interactive}
        />
      </div>
    );
  }

  // Expanded variant - full preview with more detail
  if (variant === 'expanded') {
    return (
      <div
        className={cn(
          'showcase-expanded rounded-xl border border-border/50 bg-card p-4',
          className
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-medium text-foreground">
            {metadata.shortDescription}
          </h4>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {elementId}
          </span>
        </div>

        <div className="showcase-preview rounded-lg border border-border/30 bg-background/50 p-4">
          <IsolatedElementRenderer
            elementId={elementId}
            config={metadata.demoConfig}
            interactive={interactive}
          />
        </div>

        {showPromptHint && metadata.prompts.length > 0 && (
          <motion.button
            onClick={handlePromptClick}
            className="mt-3 w-full rounded-lg bg-muted/50 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            whileHover={{ opacity: 0.9 }}
            whileTap={{ opacity: 0.8 }}
          >
            <span className="opacity-60">Try: </span>
            &ldquo;{metadata.prompts[0]}&rdquo;
          </motion.button>
        )}
      </div>
    );
  }

  // Card variant (default) - compact preview
  return (
    <motion.div
      className={cn(
        'showcase-card group cursor-pointer rounded-xl border border-border/40 bg-card/80 p-3 backdrop-blur-sm transition-colors',
        'hover:border-primary/30 hover:bg-card',
        className
      )}
      onClick={handleClick}
      whileHover={{ y: -4, opacity: 0.9 }}
      whileTap={{ opacity: 0.8 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      {/* Element Preview */}
      <div className="showcase-preview mb-2 overflow-hidden rounded-lg border border-border/20 bg-background/60 p-2">
        <div className="max-h-24 overflow-hidden">
          <IsolatedElementRenderer
            elementId={elementId}
            config={metadata.demoConfig}
            interactive={false}
          />
        </div>
      </div>

      {/* Element Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {metadata.shortDescription}
          </p>
        </div>
        <motion.div
          className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-opacity group-hover:opacity-100"
          initial={false}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className="translate-x-0.5"
          >
            <path
              d="M1 5h7M5 1l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </div>

      {/* Prompt Hint (optional) */}
      {showPromptHint && metadata.prompts.length > 0 && (
        <p className="mt-1.5 truncate text-xs text-muted-foreground">
          &ldquo;{metadata.prompts[0]}&rdquo;
        </p>
      )}
    </motion.div>
  );
}

export default ElementShowcase;

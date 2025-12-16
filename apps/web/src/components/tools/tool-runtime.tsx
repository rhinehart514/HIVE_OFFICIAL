"use client";

/**
 * Tool Runtime - Full implementation with ToolCanvas
 *
 * Renders a HiveLab tool composition using the element rendering system.
 * Supports preview, run, and embed modes with proper state management.
 *
 * @author HIVE Frontend Team
 * @version 2.0.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, BoxSelect, RefreshCw } from 'lucide-react';
import { ToolCanvas } from '@hive/ui';
import { useToolRuntime } from '@/hooks/use-tool-runtime';
import type { ToolComposition } from '@hive/core';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface ToolRuntimeProps {
  /** Tool composition (for preview mode without fetching) */
  composition?: ToolComposition;
  /** Tool ID (for run/embed mode - fetches from API) */
  toolId?: string;
  /** User ID for state persistence */
  userId: string;
  /** Execution mode */
  mode: 'preview' | 'run' | 'embed';
  /** Space context (for embedded tools) */
  spaceId?: string;
  /** Placement ID (for state persistence) */
  placementId?: string;
  /** Deployment ID (overrides spaceId+placementId) */
  deploymentId?: string;
  /** Callback when execution completes */
  onExecutionResult?: (result: unknown) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Additional className */
  className?: string;
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const glass = {
  container: 'bg-[#141414]/95 backdrop-blur-xl border border-[#2A2A2A] rounded-xl',
  loading: 'bg-[#141414]/50',
  error: 'bg-red-500/5 border border-red-500/20 rounded-xl',
  empty: 'bg-[#141414]/50 border border-dashed border-[#2A2A2A] rounded-xl',
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ToolRuntime: React.FC<ToolRuntimeProps> = ({
  composition,
  toolId,
  userId,
  mode,
  spaceId,
  placementId,
  deploymentId,
  onExecutionResult,
  onError,
  className,
}) => {
  // Use runtime hook for run/embed modes (fetches tool data)
  const runtime = useToolRuntime({
    toolId: toolId || composition?.id || '',
    spaceId,
    placementId,
    deploymentId,
    enabled: mode !== 'preview' && !!(toolId || composition?.id),
  });

  // For preview mode, use composition directly
  const tool = mode === 'preview' && composition
    ? {
        id: composition.id,
        name: composition.name,
        description: composition.description,
        elements: composition.elements.map((el, idx) => ({
          elementId: el.elementId,
          instanceId: el.instanceId || `${el.elementId}-${idx}`,
          config: el.config,
          position: el.position,
          size: el.size,
        })),
        config: { layout: composition.layout },
      }
    : runtime.tool;

  const state = mode === 'preview' ? {} : runtime.state;
  const isLoading = mode === 'preview' ? false : runtime.isLoading;
  const error = mode === 'preview' ? null : runtime.error;

  // Handle element state changes
  const handleElementChange = React.useCallback(
    (instanceId: string, data: unknown) => {
      if (mode !== 'preview') {
        runtime.updateState({ [instanceId]: data });
      }
    },
    [mode, runtime]
  );

  // Handle element actions
  const handleElementAction = React.useCallback(
    async (instanceId: string, action: string, payload: unknown) => {
      if (mode === 'preview') return;

      try {
        const result = await runtime.executeAction(
          instanceId,
          action,
          payload as Record<string, unknown>
        );
        onExecutionResult?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Action failed');
        onError?.(error);
      }
    },
    [mode, runtime, onExecutionResult, onError]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', glass.loading, className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[#FFD700] animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#A1A1A6]">Loading tool...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-6 text-center', glass.error, className)}>
        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 font-medium mb-2">Failed to load tool</p>
        <p className="text-sm text-red-400/60 mb-4">{error.message}</p>
        {mode !== 'preview' && (
          <button
            onClick={() => runtime.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>
    );
  }

  // No tool data
  if (!tool) {
    return (
      <div className={cn('p-8 text-center', glass.empty, className)}>
        <BoxSelect className="h-8 w-8 text-[#818187] mx-auto mb-3" />
        <p className="text-[#A1A1A6] font-medium mb-1">Tool not found</p>
        <p className="text-sm text-[#818187]">
          The tool could not be loaded.
        </p>
      </div>
    );
  }

  // No elements
  if (!tool.elements || tool.elements.length === 0) {
    return (
      <div className={cn('p-8 text-center', glass.empty, className)}>
        <BoxSelect className="h-8 w-8 text-[#818187] mx-auto mb-3" />
        <p className="text-[#A1A1A6] font-medium mb-1">No elements</p>
        <p className="text-sm text-[#818187]">
          This tool hasn't been configured with any elements yet.
        </p>
      </div>
    );
  }

  // Get layout from tool config
  const layout = (tool.config?.layout as 'grid' | 'flow' | 'stack') || 'stack';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className={cn(glass.container, 'overflow-hidden', className)}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2A2A2A]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#FAFAFA]">
              {tool.name}
            </h3>
            {tool.description && (
              <p className="text-sm text-[#A1A1A6] mt-0.5 line-clamp-1">
                {tool.description}
              </p>
            )}
          </div>
          {mode !== 'preview' && runtime.isSaving && (
            <div className="flex items-center gap-1.5 text-xs text-[#A1A1A6]">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="p-4">
        <ToolCanvas
          elements={tool.elements}
          state={state}
          layout={layout}
          onElementChange={handleElementChange}
          onElementAction={handleElementAction}
          context={{
            spaceId,
            deploymentId: deploymentId || (spaceId && placementId ? `space:${spaceId}_${placementId}` : undefined),
            userId,
          }}
        />
      </div>
    </motion.div>
  );
};

export default ToolRuntime;

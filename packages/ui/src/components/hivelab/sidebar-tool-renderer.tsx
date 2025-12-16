'use client';

/**
 * SidebarToolRenderer - Renders a deployed HiveLab tool in space sidebar
 *
 * This component bridges the gap between:
 * - useToolRuntime hook (fetches tool, manages state)
 * - ToolCanvas (renders elements)
 *
 * Used by SpaceSidebarConfigurable for non-system tools.
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, Wrench, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ToolCanvas } from './tool-canvas';

// ============================================================================
// TYPES
// ============================================================================

export interface ToolRuntimeState {
  tool: {
    id: string;
    name: string;
    description?: string;
    elements: Array<{
      elementId: string;
      instanceId: string;
      config: Record<string, unknown>;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
    }>;
    config?: Record<string, unknown>;
  } | null;
  state: Record<string, unknown>;
  isLoading: boolean;
  isExecuting: boolean;
  isSaving: boolean;
  isSynced: boolean;
  lastSaved: Date | null;
  error: Error | null;
  executeAction: (
    elementId: string,
    actionName: string,
    payload?: Record<string, unknown>
  ) => Promise<{ success: boolean; result?: unknown; error?: string }>;
  updateState: (updates: Record<string, unknown>) => void;
  reload: () => Promise<void>;
}

export interface SidebarToolRendererProps {
  /** Tool ID to render */
  toolId: string;
  /** Space ID context */
  spaceId: string;
  /** Placement ID for state persistence */
  placementId: string;
  /** Runtime state from useToolRuntime hook */
  runtime: ToolRuntimeState;
  /** Compact mode for smaller sidebar widgets */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const glass = {
  loading: 'bg-white/[0.02]',
  error: 'bg-red-500/5 border border-red-500/20',
  empty: 'bg-white/[0.02] border border-dashed border-white/[0.12]',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SidebarToolRenderer({
  toolId,
  spaceId,
  placementId,
  runtime,
  compact = false,
  className,
}: SidebarToolRendererProps) {
  const { tool, state, isLoading, error, executeAction, updateState, reload } = runtime;

  // Handle element state changes
  const handleElementChange = React.useCallback(
    (instanceId: string, data: unknown) => {
      updateState({ [instanceId]: data });
    },
    [updateState]
  );

  // Handle element actions
  const handleElementAction = React.useCallback(
    async (instanceId: string, action: string, payload: unknown) => {
      await executeAction(instanceId, action, payload as Record<string, unknown>);
    },
    [executeAction]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-6', glass.loading, className)}>
        <Loader2 className="h-5 w-5 text-[#FFD700] animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('rounded-lg p-4 text-center', glass.error, className)}>
        <AlertTriangle className="h-5 w-5 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-400 mb-2">{error.message}</p>
        <button
          onClick={() => reload()}
          className="text-xs text-red-400/70 hover:text-red-400 flex items-center gap-1 mx-auto"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  // No tool loaded
  if (!tool) {
    return (
      <div className={cn('rounded-lg p-4 text-center', glass.empty, className)}>
        <Wrench className="h-5 w-5 text-[#818187] mx-auto mb-2" />
        <p className="text-sm text-[#818187]">Tool not found</p>
      </div>
    );
  }

  // No elements
  if (!tool.elements || tool.elements.length === 0) {
    return (
      <div className={cn('rounded-lg p-4 text-center', glass.empty, className)}>
        <Wrench className="h-5 w-5 text-[#818187] mx-auto mb-2" />
        <p className="text-sm text-[#818187]">No elements configured</p>
      </div>
    );
  }

  // Get layout from tool config (default to stack for sidebar)
  const layout = (tool.config?.layout as 'grid' | 'flow' | 'stack') || 'stack';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('sidebar-tool-renderer', className)}
    >
      <ToolCanvas
        elements={tool.elements}
        state={state}
        layout={compact ? 'stack' : layout}
        onElementChange={handleElementChange}
        onElementAction={handleElementAction}
        context={{
          spaceId,
          deploymentId: `space:${spaceId}_${placementId}`,
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// STANDALONE VERSION (with built-in hook)
// ============================================================================

/**
 * Props for the standalone version that manages its own runtime
 */
export interface SidebarToolRendererStandaloneProps {
  toolId: string;
  spaceId: string;
  placementId: string;
  /** Hook to use for runtime (injected to avoid circular deps) */
  useToolRuntimeHook: (options: {
    toolId: string;
    spaceId: string;
    placementId: string;
  }) => ToolRuntimeState;
  compact?: boolean;
  className?: string;
}

/**
 * Standalone version that creates its own runtime
 * Use this when the parent doesn't manage runtime state
 */
export function SidebarToolRendererStandalone({
  toolId,
  spaceId,
  placementId,
  useToolRuntimeHook,
  compact = false,
  className,
}: SidebarToolRendererStandaloneProps) {
  const runtime = useToolRuntimeHook({
    toolId,
    spaceId,
    placementId,
  });

  return (
    <SidebarToolRenderer
      toolId={toolId}
      spaceId={spaceId}
      placementId={placementId}
      runtime={runtime}
      compact={compact}
      className={className}
    />
  );
}

export default SidebarToolRenderer;

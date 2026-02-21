'use client';

/**
 * ToolRuntimeModal - Modal wrapper for tool execution within Spaces
 *
 * Allows users to interact with HiveLab tools without leaving the Space context.
 * Uses the existing ToolCanvas for rendering but in a modal/drawer format.
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowsPointingOutIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { springPresets } from '@hive/tokens';

// Import base components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../design-system/components/Dialog';
import { Button } from '../../design-system/primitives';

// Import the ToolCanvas for rendering elements
import { ToolCanvas } from './tool-canvas';

// ============================================================================
// TYPES
// ============================================================================

export interface ToolRuntimeModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Tool ID to load */
  toolId: string;
  /** Space context ID */
  spaceId: string;
  /** Placement ID within the space (preferred - hook generates deployment ID) */
  placementId?: string;
  /** @deprecated Use placementId instead. Deployment ID for state persistence */
  deploymentId?: string;
  /** Tool name for display */
  toolName?: string;
  /** Tool description */
  toolDescription?: string;
  /** Callback to open full page version */
  onExpandToFullPage?: () => void;
  /** Runtime hook - passed from parent to avoid duplicate hooks */
  runtime?: {
    tool: {
      id: string;
      name: string;
      description?: string;
      status: string;
      elements?: Array<{
        elementId: string;
        instanceId: string;
        config: Record<string, unknown>;
        position?: { x: number; y: number };
        size?: { width: number; height: number };
      }>;
      connections?: Array<{
        from: { instanceId: string; output?: string; port?: string };
        to: { instanceId: string; input?: string; port?: string };
      }>;
      config?: Record<string, unknown>;
    } | null;
    state: Record<string, unknown>;
    // Phase 1: SharedState Architecture
    sharedState?: {
      counters: Record<string, number>;
      collections: Record<string, Record<string, { id: string; createdAt: string; createdBy: string; data: Record<string, unknown> }>>;
      timeline: Array<{ id: string; type: string; timestamp: string; userId: string; action: string; data?: Record<string, unknown> }>;
      computed: Record<string, unknown>;
      version: number;
      lastModified: string;
    };
    userState?: {
      selections?: Record<string, unknown>;
      participation?: Record<string, boolean>;
      personal?: Record<string, unknown>;
      ui?: Record<string, unknown>;
      [key: string]: unknown;
    };
    isLoading: boolean;
    isExecuting: boolean;
    isSaving: boolean;
    isSynced: boolean;
    lastSaved: Date | null;
    error: string | null;
    executeAction: (action: string, elementId?: string, data?: Record<string, unknown>) => Promise<{
      success: boolean;
      data?: Record<string, unknown>;
      error?: string;
    }>;
    updateState: (elementId: string, data: unknown) => void;
  };
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const glass = {
  overlay: 'bg-black/60 backdrop-blur-sm',
  modal: 'bg-black/80 backdrop-blur-2xl border border-white/[0.08]',
};

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SyncIndicator({
  isSynced,
  isSaving,
  lastSaved,
}: {
  isSynced: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
}) {
  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <ArrowPathIcon className="h-3 w-3 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (isSynced) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
        <CheckCircleIcon className="h-3 w-3" />
        <span>Saved</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-amber-400">
      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      <span>Unsaved</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ToolRuntimeModal({
  open,
  onOpenChange,
  toolId,
  spaceId,
  deploymentId,
  toolName,
  toolDescription,
  onExpandToFullPage,
  runtime,
}: ToolRuntimeModalProps) {
  // Handle element state changes
  const handleElementChange = React.useCallback(
    (instanceId: string, data: unknown) => {
      runtime?.updateState(instanceId, data);
    },
    [runtime]
  );

  // Handle element actions
  const handleElementAction = React.useCallback(
    async (instanceId: string, action: string, payload: unknown) => {
      if (!runtime) return;
      await runtime.executeAction(action, instanceId, payload as Record<string, unknown>);
    },
    [runtime]
  );

  // Determine content to show
  const tool = runtime?.tool;
  const elements = tool?.elements || [];
  const connections = tool?.connections || [];
  const toolConfig = tool?.config || {};
  const state = runtime?.state || {};
  // Phase 1: SharedState Architecture
  const sharedState = runtime?.sharedState;
  const userState = runtime?.userState;
  const isLoading = runtime?.isLoading ?? true;
  const error = runtime?.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'sm:max-w-xl md:max-w-2xl lg:max-w-3xl',
          'max-h-[80vh] sm:max-h-[85vh]',
          'p-0 gap-0 overflow-hidden',
          'flex flex-col',
          glass.modal
        )}
      >
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <DialogTitle className="text-base font-semibold text-white truncate">
                {toolName || tool?.name || 'Tool'}
              </DialogTitle>
              {runtime && (
                <SyncIndicator
                  isSynced={runtime.isSynced}
                  isSaving={runtime.isSaving}
                  lastSaved={runtime.lastSaved}
                />
              )}
            </div>
            <div className="flex items-center gap-1">
              {onExpandToFullPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExpandToFullPage}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                  title="Open in full page"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {(toolDescription || tool?.description) && (
            <p className="text-sm text-gray-400 mt-1 truncate">
              {toolDescription || tool?.description}
            </p>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center py-16"
              >
                <div className="text-center space-y-4">
                  {/* Element-shaped skeleton for modal loading */}
                  <div className="w-64 mx-auto space-y-3">
                    <div className="h-10 bg-white/[0.04] rounded-lg animate-pulse" />
                    <div className="h-10 bg-white/[0.04] rounded-lg animate-pulse w-3/4" />
                    <div className="h-10 bg-white/[0.04] rounded-lg animate-pulse w-1/2" />
                  </div>
                  <p className="text-sm text-gray-400">Loading tool...</p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex items-center justify-center py-16"
              >
                <div className="text-center max-w-sm px-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <ExclamationCircleIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <h3 className="text-base font-medium text-white mb-2">Something went wrong</h3>
                  <p className="text-sm text-gray-400 mb-4">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : elements.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center py-16"
              >
                <div className="text-center max-w-sm px-4">
                  <div className="w-12 h-12 rounded-xl bg-neutral-700/50 flex items-center justify-center mx-auto mb-4">
                    <ExclamationCircleIcon className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h3 className="text-base font-medium text-white mb-2">No elements</h3>
                  <p className="text-sm text-gray-400">
                    This tool hasn't been configured with any elements yet.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="p-4"
                style={{
                  backgroundColor:
                    typeof toolConfig.backgroundColor === 'string'
                      ? toolConfig.backgroundColor
                      : undefined,
                }}
              >
                <ToolCanvas
                  elements={elements}
                  state={state}
                  sharedState={sharedState}
                  userState={userState}
                  connections={connections}
                  layout={(toolConfig.layout as 'grid' | 'flow' | 'stack') || 'stack'}
                  onElementChange={handleElementChange}
                  onElementAction={handleElementAction}
                  isLoading={false}
                  error={null}
                  context={{
                    spaceId,
                    deploymentId,
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with actions */}
        <div className="px-4 py-3 border-t border-white/[0.06] flex justify-end gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] sm:min-h-0"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ToolRuntimeModal;

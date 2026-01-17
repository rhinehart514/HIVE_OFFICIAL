'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowPathIcon, ExclamationTriangleIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const BoxSelect = ViewfinderCircleIcon;
import { renderElementSafe } from './element-renderers';
import { cn } from '../../lib/utils';
import type { ElementProps, ElementSharedState, ElementUserState } from '../../lib/hivelab/element-system';

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const glass = {
  empty: "bg-white/[0.02] border border-dashed border-white/[0.12]",
  error: "bg-red-500/5 border border-red-500/20",
};

// Motion variants (T2: Standard interactions)
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const elementVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] }
  },
};

// ============================================================================
// TYPES
// ============================================================================

export interface ToolElement {
  elementId: string;
  instanceId: string;
  config: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface ToolCanvasContext {
  /** Space ID for space-scoped tools */
  spaceId?: string;
  /** Deployment ID for state persistence */
  deploymentId?: string;
  /** User ID for user-scoped actions */
  userId?: string;
  /** Whether user is a space leader */
  isSpaceLeader?: boolean;
}

export interface ToolCanvasProps {
  /** Array of elements to render */
  elements: ToolElement[];
  /** Current state for all elements, keyed by instanceId */
  state: Record<string, unknown>;
  /** Layout mode for the canvas */
  layout?: 'grid' | 'flow' | 'stack';
  /** Callback when element state changes */
  onElementChange?: (instanceId: string, data: unknown) => void;
  /** Callback when element triggers an action */
  onElementAction?: (instanceId: string, action: string, payload: unknown) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the tool is loading */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Context for space/deployment-aware elements */
  context?: ToolCanvasContext;

  // ============================================================================
  // Phase 1: Shared State Architecture
  // ============================================================================

  /**
   * Shared state visible to all users (aggregate data like vote counts, RSVP lists)
   * Read from: deployedTools/{deploymentId}/sharedState/current
   */
  sharedState?: ElementSharedState;

  /**
   * Per-user state (personal selections, participation, UI state)
   * Read from: toolStates/{deploymentId}_{userId}
   */
  userState?: ElementUserState;
}

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

interface LayoutProps {
  elements: ToolElement[];
  state: Record<string, unknown>;
  onElementChange?: (instanceId: string, data: unknown) => void;
  onElementAction?: (instanceId: string, action: string, payload: unknown) => void;
  context?: ToolCanvasContext;
  // Phase 1: SharedState Architecture
  sharedState?: ElementSharedState;
  userState?: ElementUserState;
}

// Grid layout: position-based rendering with 12-column grid
function GridLayout({ elements, state, onElementChange, onElementAction, context, sharedState, userState }: LayoutProps) {
  const prefersReducedMotion = useReducedMotion();

  // Sort by position (top to bottom, left to right)
  const sortedElements = [...elements].sort((a, b) => {
    const ay = a.position?.y ?? 0;
    const by = b.position?.y ?? 0;
    if (ay !== by) return ay - by;
    return (a.position?.x ?? 0) - (b.position?.x ?? 0);
  });

  // Group elements by row (y position)
  const rows = sortedElements.reduce((acc, el) => {
    const y = el.position?.y ?? 0;
    if (!acc[y]) acc[y] = [];
    acc[y].push(el);
    return acc;
  }, {} as Record<number, ToolElement[]>);

  return (
    <motion.div
      className="space-y-4"
      variants={prefersReducedMotion ? fadeIn : staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {Object.entries(rows)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([rowY, rowElements]) => (
          <div key={rowY} className="grid grid-cols-12 gap-4">
            {rowElements.map((el) => {
              const colSpan = el.size?.width ?? 12;
              return (
                <motion.div
                  key={el.instanceId}
                  variants={prefersReducedMotion ? fadeIn : elementVariants}
                  className={cn(
                    'min-h-[60px]',
                    colSpan === 12 && 'col-span-12',
                    colSpan === 6 && 'col-span-12 md:col-span-6',
                    colSpan === 4 && 'col-span-12 md:col-span-4',
                    colSpan === 3 && 'col-span-6 md:col-span-3',
                    colSpan === 8 && 'col-span-12 md:col-span-8',
                    colSpan === 9 && 'col-span-12 md:col-span-9',
                  )}
                >
                  <ElementWrapper
                    element={el}
                    state={state}
                    onElementChange={onElementChange}
                    onElementAction={onElementAction}
                    context={context}
                    sharedState={sharedState}
                    userState={userState}
                  />
                </motion.div>
              );
            })}
          </div>
        ))}
    </motion.div>
  );
}

// Flow layout: flex wrap for responsive horizontal flow
function FlowLayout({ elements, state, onElementChange, onElementAction, context, sharedState, userState }: LayoutProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-wrap gap-4"
      variants={prefersReducedMotion ? fadeIn : staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {elements.map((el) => (
        <motion.div
          key={el.instanceId}
          variants={prefersReducedMotion ? fadeIn : elementVariants}
          className="flex-1 min-w-[280px] max-w-full"
        >
          <ElementWrapper
            element={el}
            state={state}
            onElementChange={onElementChange}
            onElementAction={onElementAction}
            context={context}
            sharedState={sharedState}
            userState={userState}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Stack layout: vertical stack (default, mobile-friendly)
function StackLayout({ elements, state, onElementChange, onElementAction, context, sharedState, userState }: LayoutProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col gap-4"
      variants={prefersReducedMotion ? fadeIn : staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {elements.map((el) => (
        <motion.div
          key={el.instanceId}
          variants={prefersReducedMotion ? fadeIn : elementVariants}
        >
          <ElementWrapper
            element={el}
            state={state}
            onElementChange={onElementChange}
            onElementAction={onElementAction}
            context={context}
            sharedState={sharedState}
            userState={userState}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

// ============================================================================
// ELEMENT WRAPPER
// ============================================================================

function ElementWrapper({
  element,
  state,
  onElementChange,
  onElementAction,
  context,
  sharedState,
  userState,
}: {
  element: ToolElement;
  state: Record<string, unknown>;
  onElementChange?: (instanceId: string, data: unknown) => void;
  onElementAction?: (instanceId: string, action: string, payload: unknown) => void;
  context?: ToolCanvasContext;
  // Phase 1: SharedState Architecture
  sharedState?: ElementSharedState;
  userState?: ElementUserState;
}) {
  const elementState = state[element.instanceId];

  const handleChange = React.useCallback(
    (data: unknown) => {
      onElementChange?.(element.instanceId, data);
    },
    [element.instanceId, onElementChange]
  );

  const handleAction = React.useCallback(
    (action: string, payload: unknown) => {
      onElementAction?.(element.instanceId, action, payload);
    },
    [element.instanceId, onElementAction]
  );

  // Convert ToolCanvasContext to ElementProps context format
  const elementContext = context ? {
    userId: context.userId,
    spaceId: context.spaceId,
    isSpaceLeader: context.isSpaceLeader,
    campusId: 'ub-buffalo', // Current campus - will be configurable
  } : undefined;

  const props: ElementProps = {
    id: element.instanceId,
    config: element.config as Record<string, unknown>,
    data: elementState,
    onChange: handleChange,
    onAction: handleAction,
    context: elementContext,
    // Phase 1: SharedState Architecture
    sharedState,
    userState,
  };

  return renderElementSafe(element.elementId, props);
}

// ============================================================================
// STATE COMPONENTS
// ============================================================================

function CanvasSkeleton() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn("space-y-4", !prefersReducedMotion && "animate-pulse")}>
      <div className="h-11 bg-white/[0.04] rounded-lg w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-32 bg-white/[0.04] rounded-xl" />
        <div className="h-32 bg-white/[0.04] rounded-xl" />
      </div>
      <div className="h-48 bg-white/[0.04] rounded-xl" />
    </div>
  );
}

function CanvasError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("rounded-xl p-6 text-center", glass.error)}
    >
      <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
      </div>
      <p className="text-red-400 font-medium mb-1">Failed to load tool</p>
      <p className="text-sm text-red-400/60">{message}</p>
    </motion.div>
  );
}

function CanvasEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("rounded-xl p-12 text-center", glass.empty)}
    >
      <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
        <BoxSelect className="h-6 w-6 text-gray-500" />
      </div>
      <p className="text-gray-400 font-medium mb-1">No elements configured</p>
      <p className="text-sm text-gray-500">
        This tool has no elements to render yet.
      </p>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ToolCanvas - Renders a tool's elements with proper layout
 *
 * Takes elements from a tool definition and renders them using
 * the element-renderers, wiring up state and action callbacks.
 *
 * Supports three layouts:
 * - stack: Vertical stack (default, mobile-friendly)
 * - grid: 12-column grid with position/size
 * - flow: Flex wrap for horizontal flow
 */
export function ToolCanvas({
  elements,
  state,
  layout = 'stack',
  onElementChange,
  onElementAction,
  className,
  isLoading,
  error,
  context,
  sharedState,
  userState,
}: ToolCanvasProps) {
  if (isLoading) {
    return <CanvasSkeleton />;
  }

  if (error) {
    return <CanvasError message={error} />;
  }

  if (!elements || elements.length === 0) {
    return <CanvasEmpty />;
  }

  const layoutProps = {
    elements,
    state,
    onElementChange,
    onElementAction,
    context,
    // Phase 1: SharedState Architecture
    sharedState,
    userState,
  };

  return (
    <div className={cn('tool-canvas', className)}>
      {layout === 'grid' && <GridLayout {...layoutProps} />}
      {layout === 'flow' && <FlowLayout {...layoutProps} />}
      {layout === 'stack' && <StackLayout {...layoutProps} />}
    </div>
  );
}

export default ToolCanvas;

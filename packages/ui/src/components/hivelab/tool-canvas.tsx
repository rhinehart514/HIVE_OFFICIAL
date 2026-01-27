'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowPathIcon, ExclamationTriangleIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const BoxSelect = ViewfinderCircleIcon;
import { renderElementSafe } from './element-renderers';
import { cn } from '../../lib/utils';
import type { ElementProps, ElementSharedState, ElementUserState } from '../../lib/hivelab/element-system';
import type {
  ResolvedToolTheme,
  ToolError,
  ToolRuntimeContext,
  VisibilityCondition,
  ConditionGroup,
} from '@hive/core';
import {
  isToolError,
  isRecoverableError,
  evaluateCondition,
  evaluateConditionGroup,
} from '@hive/core';

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
  /** Visibility conditions for conditional rendering */
  visibilityConditions?: VisibilityCondition[] | ConditionGroup;
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
  /** Campus ID for campus-scoped data (replaces hardcoded value) */
  campusId?: string;
  /** Full runtime context for visibility evaluation and interpolation */
  runtimeContext?: ToolRuntimeContext;
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
  /** Error to display (string for legacy, ToolError for structured) */
  error?: string | ToolError | null;
  /** Callback when user clicks retry on recoverable errors */
  onRetry?: () => void;
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

  // ============================================================================
  // Sprint 5: Theme Inheritance
  // ============================================================================

  /**
   * Resolved theme from space brand
   * Applied as CSS custom properties for consistent styling
   */
  theme?: ResolvedToolTheme;
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
  // Evaluate visibility conditions if present
  const isVisible = React.useMemo(() => {
    const conditions = element.visibilityConditions;
    if (!conditions) return true;

    // Need runtime context to evaluate conditions
    const runtimeContext = context?.runtimeContext;
    if (!runtimeContext) return true; // Show by default if no context

    // Handle both array of conditions (implicit AND) and ConditionGroup
    if (Array.isArray(conditions)) {
      // Array of conditions - all must be true (AND logic)
      return conditions.every((condition) => evaluateCondition(condition, runtimeContext));
    }

    // ConditionGroup with explicit logic
    return evaluateConditionGroup(conditions, runtimeContext);
  }, [element.visibilityConditions, context?.runtimeContext]);

  // Don't render hidden elements
  if (!isVisible) {
    return null;
  }

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
  // Include full context objects from runtimeContext if available
  const runtimeCtx = context?.runtimeContext;
  const elementContext = context ? {
    userId: context.userId,
    spaceId: context.spaceId,
    isSpaceLeader: context.isSpaceLeader,
    campusId: context.campusId || runtimeCtx?.campusId,
    // Sprint 2: Full context objects for advanced element personalization
    temporal: runtimeCtx?.temporal,
    space: runtimeCtx?.space,
    member: runtimeCtx?.member,
    capabilities: runtimeCtx?.capabilities,
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
    // Sprint 2: Visibility conditions (pass through for element self-awareness)
    visibilityConditions: element.visibilityConditions,
  };

  return renderElementSafe(element.elementId, props);
}

// ============================================================================
// STATE COMPONENTS
// ============================================================================

function CanvasSkeleton() {
  const prefersReducedMotion = useReducedMotion();

  const shimmerVariant = {
    hidden: { opacity: 0.3 },
    visible: { opacity: 0.6 },
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="h-11 bg-white/[0.04] rounded-lg w-full"
        variants={shimmerVariant}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          className="h-32 bg-white/[0.04] rounded-xl"
          variants={shimmerVariant}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', delay: 0.1 }}
        />
        <motion.div
          className="h-32 bg-white/[0.04] rounded-xl"
          variants={shimmerVariant}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', delay: 0.2 }}
        />
      </div>
      <motion.div
        className="h-48 bg-white/[0.04] rounded-xl"
        variants={shimmerVariant}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', delay: 0.3 }}
      />
    </motion.div>
  );
}

interface CanvasErrorProps {
  error: string | ToolError;
  onRetry?: () => void;
}

function CanvasError({ error, onRetry }: CanvasErrorProps) {
  const prefersReducedMotion = useReducedMotion();

  // Normalize error to structured format
  const errorObj: { message: string; recoverable: boolean; code?: string } =
    typeof error === 'string'
      ? { message: error, recoverable: true }
      : {
          message: error.message,
          recoverable: error.recoverable,
          code: error.code,
        };

  const showRetry = errorObj.recoverable && onRetry;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className={cn("rounded-xl p-8 text-center", glass.error)}
      role="alert"
      aria-live="polite"
    >
      <motion.div
        className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"
        animate={prefersReducedMotion ? {} : {
          y: [0, -4, 0],
          rotate: [0, -2, 2, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut'
        }}
      >
        <ExclamationTriangleIcon className="h-7 w-7 text-red-400" />
      </motion.div>
      <p className="text-red-400 font-medium mb-1">
        {errorObj.recoverable ? 'Something went wrong' : 'Unable to load tool'}
      </p>
      <p className="text-sm text-red-400/60 mb-4">{errorObj.message}</p>
      {showRetry && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Try again
        </motion.button>
      )}
    </motion.div>
  );
}

function CanvasEmpty() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className={cn("rounded-xl p-16 text-center", glass.empty)}
    >
      <motion.div
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] flex items-center justify-center mx-auto mb-5"
        animate={prefersReducedMotion ? {} : {
          y: [0, -6, 0],
          rotate: [0, 3, -3, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut'
        }}
      >
        <BoxSelect className="h-8 w-8 text-gray-400" />
      </motion.div>
      <p className="text-gray-300 font-medium mb-1">No elements configured</p>
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
  onRetry,
  context,
  sharedState,
  userState,
  theme,
}: ToolCanvasProps) {
  // Build CSS variable style object from theme
  const themeStyle = React.useMemo(() => {
    if (!theme?.cssVariables) return undefined;
    return theme.cssVariables as React.CSSProperties;
  }, [theme]);

  if (isLoading) {
    return <CanvasSkeleton />;
  }

  if (error) {
    return <CanvasError error={error} onRetry={onRetry} />;
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
    <div
      className={cn('tool-canvas', className)}
      style={themeStyle}
      data-theme-source={theme?.source}
    >
      {layout === 'grid' && <GridLayout {...layoutProps} />}
      {layout === 'flow' && <FlowLayout {...layoutProps} />}
      {layout === 'stack' && <StackLayout {...layoutProps} />}
    </div>
  );
}

export default ToolCanvas;

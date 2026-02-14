'use client';

import * as React from 'react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
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
} from '@hive/core/client';
import {
  isToolError,
  isRecoverableError,
  evaluateCondition,
  evaluateConditionGroup,
} from '@hive/core/client';

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const glass = {
  empty: "bg-white/[0.02] border border-dashed border-white/[0.08]",
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
  /** Display name for runtime personalization */
  userDisplayName?: string;
  /** Runtime role for personalization */
  userRole?: 'admin' | 'moderator' | 'member' | 'guest';
  /** Whether user is a space leader */
  isSpaceLeader?: boolean;
  /** Campus ID for campus-scoped data (replaces hardcoded value) */
  campusId?: string;
  /** Space name for runtime personalization */
  spaceName?: string;
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
  /** Callback when element emits an output event */
  onElementOutput?: (instanceId: string, outputId: string, data: unknown) => void;
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

  /**
   * Intra-tool element connections for runtime I/O resolution.
   */
  connections?: ElementProps['connections'];

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
  onElementOutput?: (instanceId: string, outputId: string, data: unknown) => void;
  context?: ToolCanvasContext;
  // Phase 1: SharedState Architecture
  sharedState?: ElementSharedState;
  userState?: ElementUserState;
  connections?: ElementProps['connections'];
}

// Grid layout: position-based rendering with 12-column grid
function GridLayout({ elements, state, onElementChange, onElementAction, onElementOutput, context, sharedState, userState, connections }: LayoutProps) {
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
                    onElementOutput={onElementOutput}
                    context={context}
                    sharedState={sharedState}
                    userState={userState}
                    connections={connections}
                    elementDefinitions={elements.map((item) => ({
                      instanceId: item.instanceId,
                      elementId: item.elementId,
                    }))}
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
function FlowLayout({ elements, state, onElementChange, onElementAction, onElementOutput, context, sharedState, userState, connections }: LayoutProps) {
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
          className="flex-1 min-w-0 sm:min-w-[280px] max-w-full basis-full sm:basis-auto"
        >
          <ElementWrapper
            element={el}
            state={state}
            onElementChange={onElementChange}
            onElementAction={onElementAction}
            onElementOutput={onElementOutput}
            context={context}
            sharedState={sharedState}
            userState={userState}
            connections={connections}
            elementDefinitions={elements.map((item) => ({
              instanceId: item.instanceId,
              elementId: item.elementId,
            }))}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Stack layout: vertical stack (default, mobile-friendly)
function StackLayout({ elements, state, onElementChange, onElementAction, onElementOutput, context, sharedState, userState, connections }: LayoutProps) {
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
            onElementOutput={onElementOutput}
            context={context}
            sharedState={sharedState}
            userState={userState}
            connections={connections}
            elementDefinitions={elements.map((item) => ({
              instanceId: item.instanceId,
              elementId: item.elementId,
            }))}
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
  onElementOutput,
  context,
  sharedState,
  userState,
  connections,
  elementDefinitions,
}: {
  element: ToolElement;
  state: Record<string, unknown>;
  onElementChange?: (instanceId: string, data: unknown) => void;
  onElementAction?: (instanceId: string, action: string, payload: unknown) => void;
  onElementOutput?: (instanceId: string, outputId: string, data: unknown) => void;
  context?: ToolCanvasContext;
  // Phase 1: SharedState Architecture
  sharedState?: ElementSharedState;
  userState?: ElementUserState;
  connections?: ElementProps['connections'];
  elementDefinitions?: ElementProps['elementDefinitions'];
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

  const handleOutput = React.useCallback(
    (outputId: string, data: unknown) => {
      onElementOutput?.(element.instanceId, outputId, data);
    },
    [element.instanceId, onElementOutput]
  );

  // Convert ToolCanvasContext to ElementProps context format
  // Include full context objects from runtimeContext if available
  const runtimeCtx = context?.runtimeContext;
  const runtimeRole = runtimeCtx?.member?.role;
  const normalizedRuntimeRole: ToolCanvasContext['userRole'] =
    runtimeRole === 'owner'
      ? 'admin'
      : runtimeRole === 'admin' || runtimeRole === 'moderator' || runtimeRole === 'member' || runtimeRole === 'guest'
        ? runtimeRole
        : undefined;
  const elementContext = context ? {
    userId: context.userId,
    userDisplayName: context.userDisplayName || runtimeCtx?.member?.displayName,
    userRole: context.userRole || normalizedRuntimeRole || (context.isSpaceLeader ? 'admin' : undefined),
    spaceId: context.spaceId,
    spaceName: context.spaceName || runtimeCtx?.space?.spaceName,
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
    onOutput: handleOutput,
    context: elementContext,
    // Phase 1: SharedState Architecture
    sharedState,
    userState,
    connections,
    allElementStates: state,
    elementDefinitions,
    // Sprint 2: Visibility conditions (pass through for element self-awareness)
    visibilityConditions: element.visibilityConditions,
  };

  return renderElementSafe(element.elementId, props);
}

// ============================================================================
// STATE COMPONENTS
// ============================================================================

function CanvasSkeleton() {
  const shimmerVariant = {
    hidden: { opacity: 0.3 },
    visible: { opacity: 0.6 },
  };

  // Element-shaped skeleton placeholders
  const skeletonElements = [
    // Poll-like element
    { height: 'h-auto', content: (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-36 bg-white/[0.06] rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-11 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="h-11 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="h-11 bg-white/[0.04] rounded-lg animate-pulse" />
        </div>
        <div className="mt-3 flex justify-between">
          <div className="h-3 w-16 bg-white/[0.04] rounded animate-pulse" />
          <div className="h-3 w-12 bg-white/[0.04] rounded animate-pulse" />
        </div>
      </div>
    )},
    // Counter-like element
    { height: 'h-auto', content: (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="text-center">
          <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse mx-auto mb-4" />
          <div className="flex items-center justify-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/[0.04] animate-pulse" />
            <div className="h-12 w-24 bg-white/[0.06] rounded-lg animate-pulse" />
            <div className="h-12 w-12 rounded-full bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      </div>
    )},
    // RSVP/button-like element
    { height: 'h-auto', content: (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-3 w-20 bg-white/[0.04] rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 bg-white/[0.04] rounded animate-pulse" />
            <div className="h-3 w-12 bg-white/[0.04] rounded animate-pulse" />
          </div>
        </div>
        <div className="h-2 bg-white/[0.04] rounded-full mb-4 animate-pulse" />
        <div className="h-10 bg-white/[0.06] rounded-lg animate-pulse" />
      </div>
    )},
  ];

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {skeletonElements.map((skeleton, index) => (
        <motion.div
          key={index}
          variants={shimmerVariant}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', delay: index * 0.1 }}
        >
          {skeleton.content}
        </motion.div>
      ))}
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
          whileHover={{ opacity: 0.96 }}
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
  onElementOutput,
  className,
  isLoading,
  error,
  onRetry,
  context,
  sharedState,
  userState,
  connections,
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
    onElementOutput,
    context,
    // Phase 1: SharedState Architecture
    sharedState,
    userState,
    connections,
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

// ============================================================================
// TOOL ERROR BOUNDARY
// ============================================================================

interface ToolErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ToolErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Tool-level error boundary.
 * Wraps the entire ToolCanvas to catch any unhandled errors.
 * Shows a friendly error state with retry button.
 */
export class ToolErrorBoundary extends Component<ToolErrorBoundaryProps, ToolErrorBoundaryState> {
  constructor(props: ToolErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ToolErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('[HiveLab] Tool crashed:', error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ToolErrorFallback
          error={this.state.error}
          onRetry={() => {
            this.setState({ hasError: false, error: null });
            this.props.onRetry?.();
          }}
        />
      );
    }

    return this.props.children;
  }
}

function ToolErrorFallback({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="rounded-xl p-8 text-center bg-red-500/5 border border-red-500/20"
      role="alert"
      aria-live="polite"
    >
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <ExclamationTriangleIcon className="h-7 w-7 text-red-400" />
      </div>
      <p className="text-red-400 font-medium mb-1">Something went wrong</p>
      <p className="text-sm text-red-400/60 mb-4">
        This tool encountered an error while rendering.
      </p>
      {process.env.NODE_ENV === 'development' && error && (
        <pre className="text-xs text-red-400/50 bg-red-500/5 p-3 rounded-lg mb-4 overflow-x-auto text-left max-w-md mx-auto">
          {error.message}
        </pre>
      )}
      <motion.button
        whileHover={{ opacity: 0.96 }}
        whileTap={{ scale: 0.98 }}
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium min-h-[44px]"
      >
        <ArrowPathIcon className="w-4 h-4" />
        Try again
      </motion.button>
    </motion.div>
  );
}

export default ToolCanvas;

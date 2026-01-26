/**
 * Tool Connection Cascade Engine
 *
 * Processes element connections when an action completes.
 * When an element outputs data, this engine finds all connected
 * elements and triggers them with the output value as input.
 */

import {
  extractOutputValue,
} from '@hive/core';

// =============================================================================
// Inlined Types (previously from ./tool-action-handlers)
// =============================================================================

export interface ToolElement {
  id: string;
  elementId?: string;
  instanceId?: string;
  type?: string;
  config?: Record<string, unknown>;
  actions?: Array<{ id: string; type: string; handler?: string; config?: Record<string, unknown> }>;
  [key: string]: unknown;
}

export interface ActionContext {
  deployment: { id: string; [key: string]: unknown };
  tool: { elements?: ToolElement[]; [key: string]: unknown };
  userId: string;
  elementId?: string;
  element: ToolElement | null;
  data: Record<string, unknown>;
  state: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  spaceContext?: Record<string, unknown>;
}

export interface ActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  feedContent?: {
    type: 'post' | 'update' | 'achievement';
    content: string;
    metadata?: Record<string, unknown>;
  };
  state?: Record<string, unknown>;
  notifications?: Array<{
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    recipients?: string[];
  }>;
}

// Action handler registry
type ActionHandler = (context: ActionContext) => Promise<ActionResult>;

const actionHandlers: Record<string, ActionHandler> = {};
const elementActionHandlers: Record<string, Record<string, ActionHandler>> = {};

/**
 * Register an action handler for a specific element type
 */
export function registerElementActionHandler(
  elementType: string,
  actionName: string,
  handler: ActionHandler
): void {
  if (!elementActionHandlers[elementType]) {
    elementActionHandlers[elementType] = {};
  }
  elementActionHandlers[elementType][actionName] = handler;
}

/**
 * Execute an action with the given context
 */
async function executeAction(actionName: string, context: ActionContext): Promise<ActionResult> {
  const normalizedAction = actionName.toLowerCase().replace(/-/g, '_');

  // Check element-specific handlers first
  const elementType = context.element?.elementId || context.element?.type;
  if (elementType && elementActionHandlers[elementType]?.[normalizedAction]) {
    try {
      return await elementActionHandlers[elementType][normalizedAction](context);
    } catch (error) {
      return {
        success: false,
        error: `Element handler failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Check global handlers
  const handler = actionHandlers[normalizedAction];
  if (handler) {
    try {
      return await handler(context);
    } catch (error) {
      return {
        success: false,
        error: `Action handler failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Default: just record the action
  return {
    success: true,
    state: {
      ...context.state,
      lastAction: {
        name: actionName,
        elementId: context.elementId,
        data: context.data,
        executedAt: new Date().toISOString(),
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Element connection definition
 * Describes data flow from one element's output to another's input
 */
export interface ElementConnection {
  /** Source element info */
  from: {
    instanceId: string;
    output: string; // e.g., 'results', 'votes', 'data'
  };
  /** Target element info */
  to: {
    instanceId: string;
    input: string; // e.g., 'data', 'items', 'value'
  };
  /** Optional transform function name */
  transform?: string;
}

/**
 * Tool composition structure
 */
export interface ToolComposition {
  elements: ToolElement[];
  connections: ElementConnection[];
}

/**
 * Cascade execution context
 */
export interface CascadeContext {
  composition: ToolComposition;
  state: Record<string, unknown>;
  triggerElementId: string;
  triggerOutput: string;
  userId: string;
  deploymentId: string;
  maxDepth?: number; // Prevent infinite loops
}

/**
 * Cascade execution result
 */
export interface CascadeResult {
  updatedState: Record<string, unknown>;
  executedElements: string[];
  errors: Array<{ elementId: string; error: string }>;
}

// ═══════════════════════════════════════════════════════════════════
// OUTPUT EXTRACTORS - Imported from @hive/core (element-ports.ts)
// ═══════════════════════════════════════════════════════════════════

/**
 * Transform data if a transform is specified
 */
function applyTransform(data: unknown, transform?: string): unknown {
  if (!transform) return data;

  switch (transform) {
    case 'toArray':
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        return Object.entries(data).map(([id, value]) => ({
          id,
          ...(typeof value === 'object' ? value : { value }),
        }));
      }
      return data;

    case 'toCount':
      if (Array.isArray(data)) return data.length;
      if (typeof data === 'object' && data !== null) return Object.keys(data).length;
      return 0;

    case 'toSorted':
      if (Array.isArray(data)) {
        return [...data].sort((a, b) => {
          type Scored = { score?: number };
          const scoreA = typeof a === 'object' && a !== null ? (a as Scored).score || 0 : 0;
          const scoreB = typeof b === 'object' && b !== null ? (b as Scored).score || 0 : 0;
          return scoreB - scoreA;
        });
      }
      return data;

    case 'toTop5':
      if (Array.isArray(data)) {
        return [...data]
          .sort((a, b) => {
            type Scored = { score?: number };
            return ((b as Scored).score || 0) - ((a as Scored).score || 0);
          })
          .slice(0, 5);
      }
      return data;

    default:
      return data;
  }
}

// ═══════════════════════════════════════════════════════════════════
// CASCADE ENGINE
// ═══════════════════════════════════════════════════════════════════

/**
 * Execute cascading connections when an element outputs data
 */
export async function cascadeConnections(ctx: CascadeContext): Promise<CascadeResult> {
  const {
    composition,
    state,
    triggerElementId,
    triggerOutput,
    userId,
    deploymentId,
    maxDepth = 5,
  } = ctx;

  const executedElements: string[] = [];
  const errors: Array<{ elementId: string; error: string }> = [];
  let updatedState = { ...state };

  // Find the triggering element
  const triggerElement = composition.elements.find(
    (el) => el.instanceId === triggerElementId
  );

  if (!triggerElement) {
    return { updatedState, executedElements, errors };
  }

  // Get the trigger element's current state
  const triggerState = (updatedState[triggerElementId] as Record<string, unknown>) || {};

  // Extract the output value
  const outputValue = extractOutputValue(
    triggerState,
    triggerOutput,
    triggerElement.elementId
  );

  // Find connections FROM this element's output
  const outgoingConnections = composition.connections.filter(
    (conn) =>
      conn.from.instanceId === triggerElementId &&
      conn.from.output === triggerOutput
  );

  if (outgoingConnections.length === 0) {
    return { updatedState, executedElements, errors };
  }

  // Process each connection
  for (const connection of outgoingConnections) {
    const targetElement = composition.elements.find(
      (el) => el.instanceId === connection.to.instanceId
    );

    if (!targetElement) {
      errors.push({
        elementId: connection.to.instanceId,
        error: `Target element not found: ${connection.to.instanceId}`,
      });
      continue;
    }

    // Prevent duplicate execution in same cascade
    if (executedElements.includes(connection.to.instanceId)) {
      continue;
    }

    // Apply any transform
    const transformedValue = applyTransform(outputValue, connection.transform);

    // Create input data for target element
    const inputData = {
      [connection.to.input]: transformedValue,
      _cascadeSource: triggerElementId,
      _cascadeOutput: triggerOutput,
    };

    // Execute target element's refresh/update action
    const actionContext: ActionContext = {
      deployment: { id: deploymentId },
      tool: { elements: composition.elements },
      userId,
      elementId: targetElement.instanceId,
      element: targetElement,
      data: inputData,
      state: updatedState,
      metadata: { cascade: true, depth: maxDepth },
    };

    try {
      // Try 'refresh' action first, then 'update'
      let result = await executeAction('refresh', actionContext);

      if (!result.success && result.error?.includes('No handler')) {
        result = await executeAction('update', actionContext);
      }

      if (!result.success && result.error?.includes('No handler')) {
        // Just update the element's state with the input data
        const instanceId = targetElement.instanceId ?? connection.to.instanceId;
        result = {
          success: true,
          state: {
            ...updatedState,
            [instanceId]: {
              ...((updatedState[instanceId] as Record<string, unknown>) || {}),
              ...inputData,
              _lastCascadeAt: new Date().toISOString(),
            },
          },
        };
      }

      if (result.success && result.state) {
        updatedState = { ...updatedState, ...result.state };
        executedElements.push(connection.to.instanceId);

        // Recursive cascade from this element (if depth allows)
        if (maxDepth > 1) {
          const nestedResult = await cascadeConnections({
            composition,
            state: updatedState,
            triggerElementId: connection.to.instanceId,
            triggerOutput: 'data', // Default output for cascading
            userId,
            deploymentId,
            maxDepth: maxDepth - 1,
          });

          updatedState = nestedResult.updatedState;
          executedElements.push(...nestedResult.executedElements);
          errors.push(...nestedResult.errors);
        }
      } else if (!result.success) {
        errors.push({
          elementId: connection.to.instanceId,
          error: result.error || 'Unknown error',
        });
      }
    } catch (err) {
      errors.push({
        elementId: connection.to.instanceId,
        error: err instanceof Error ? err.message : 'Cascade execution failed',
      });
    }
  }

  return { updatedState, executedElements, errors };
}

/**
 * Determine which outputs an action affects
 */
export function getAffectedOutputs(action: string, elementId: string): string[] {
  // Complete action→output mappings for all 27 element types
  const outputMappings: Record<string, Record<string, string[]>> = {
    // ═══════════════════════════════════════════════════════════════════
    // UNIVERSAL ELEMENTS (15)
    // ═══════════════════════════════════════════════════════════════════
    'poll-element': {
      vote: ['results', 'votes', 'data'],
      submit: ['results', 'votes', 'data'],
      reset: ['results', 'votes', 'data'],
    },
    'form-builder': {
      submit: ['submissions', 'data', 'count'],
      reset: ['submissions', 'data', 'count'],
      validate: ['data'],
    },
    'leaderboard': {
      update_score: ['entries', 'data', 'rankings'],
      increment: ['entries', 'data', 'rankings'],
      refresh: ['entries', 'data', 'rankings'],
    },
    'counter': {
      increment: ['value', 'count', 'data'],
      decrement: ['value', 'count', 'data'],
      update: ['value', 'count', 'data'],
      reset: ['value', 'count', 'data'],
    },
    'timer': {
      start: ['running', 'data'],
      stop: ['elapsed', 'time', 'data'],
      reset: ['elapsed', 'time', 'running', 'data'],
      tick: ['elapsed', 'time', 'data'],
    },
    'countdown-timer': {
      start: ['timeLeft', 'data'],
      finished: ['finished', 'complete', 'data'],
      reset: ['timeLeft', 'finished', 'data'],
    },
    'search-input': {
      search: ['query', 'searchTerm', 'data'],
      change: ['query', 'data'],
      clear: ['query', 'data'],
    },
    'filter-selector': {
      select: ['selectedFilters', 'filters', 'data'],
      change: ['selectedFilters', 'filters', 'data'],
      clear: ['selectedFilters', 'data'],
    },
    'result-list': {
      select: ['selectedItem', 'selection', 'data'],
      refresh: ['items', 'data'],
    },
    'date-picker': {
      select: ['selectedDate', 'date', 'data'],
      change: ['selectedDate', 'date', 'data'],
      clear: ['selectedDate', 'data'],
    },
    'tag-cloud': {
      select: ['selectedTags', 'tags', 'data'],
      toggle: ['selectedTags', 'tags', 'data'],
      clear: ['selectedTags', 'data'],
    },
    'map-view': {
      select: ['selectedLocation', 'location', 'data'],
      add_marker: ['markers', 'data'],
      remove_marker: ['markers', 'data'],
    },
    'chart-display': {
      select: ['selectedPoint', 'selection', 'data'],
      refresh: ['chartData', 'data'],
    },
    'notification-display': {
      add: ['notifications', 'count', 'data'],
      dismiss: ['notifications', 'count', 'data'],
      clear: ['notifications', 'count', 'data'],
    },
    'availability-heatmap': {
      select_slot: ['selectedSlot', 'data'],
      toggle_availability: ['availability', 'slots', 'data'],
      refresh: ['availability', 'slots', 'suggestions', 'data'],
      clear: ['selectedSlot', 'data'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // CONNECTED ELEMENTS (5)
    // ═══════════════════════════════════════════════════════════════════
    'event-picker': {
      select: ['selectedEvent', 'eventId', 'data'],
      change: ['selectedEvent', 'eventId', 'data'],
      refresh: ['events', 'data'],
    },
    'space-picker': {
      select: ['selectedSpace', 'spaceId', 'data'],
      change: ['selectedSpace', 'spaceId', 'data'],
      refresh: ['spaces', 'data'],
    },
    'user-selector': {
      select: ['selectedUser', 'userId', 'data'],
      change: ['selectedUser', 'userId', 'data'],
      search: ['users', 'data'],
    },
    'rsvp-button': {
      rsvp: ['attendees', 'count', 'data'],
      cancel_rsvp: ['attendees', 'count', 'data'],
      join_waitlist: ['waitlist', 'data'],
    },
    'connection-list': {
      select: ['selectedConnection', 'selected', 'data'],
      refresh: ['connections', 'data'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // SPACE ELEMENTS (7)
    // ═══════════════════════════════════════════════════════════════════
    'member-list': {
      select: ['selectedMember', 'selected', 'data'],
      refresh: ['members', 'data'],
    },
    'member-selector': {
      select: ['selectedMember', 'member', 'data'],
      change: ['selectedMember', 'member', 'data'],
      multi_select: ['selectedMembers', 'members', 'data'],
    },
    'space-events': {
      select: ['selectedEvent', 'data'],
      refresh: ['events', 'upcomingEvents', 'data'],
    },
    'space-feed': {
      post: ['posts', 'feed', 'data'],
      refresh: ['posts', 'feed', 'data'],
    },
    'space-stats': {
      refresh: ['stats', 'metrics', 'data'],
    },
    'announcement': {
      send: ['sent', 'recipients', 'data'],
      post: ['sent', 'recipients', 'data'],
    },
    'role-gate': {
      check: ['isAllowed', 'role', 'data'],
      refresh: ['isAllowed', 'role', 'data'],
    },
  };

  // Check element-specific outputs
  const elementOutputs = outputMappings[elementId];
  if (elementOutputs && elementOutputs[action]) {
    return elementOutputs[action];
  }

  // Default: action name is the output
  return [action, 'data'];
}

/**
 * Process all connections for an action result
 */
export async function processActionConnections(
  composition: ToolComposition,
  state: Record<string, unknown>,
  action: string,
  elementId: string,
  instanceId: string,
  userId: string,
  deploymentId: string
): Promise<CascadeResult> {
  const affectedOutputs = getAffectedOutputs(action, elementId);

  let finalState = { ...state };
  const allExecutedElements: string[] = [];
  const allErrors: Array<{ elementId: string; error: string }> = [];

  // Cascade for each affected output
  for (const output of affectedOutputs) {
    const result = await cascadeConnections({
      composition,
      state: finalState,
      triggerElementId: instanceId,
      triggerOutput: output,
      userId,
      deploymentId,
    });

    finalState = result.updatedState;
    allExecutedElements.push(...result.executedElements);
    allErrors.push(...result.errors);
  }

  // Remove duplicates from executed elements
  const uniqueExecuted = [...new Set(allExecutedElements)];

  return {
    updatedState: finalState,
    executedElements: uniqueExecuted,
    errors: allErrors,
  };
}

// ═══════════════════════════════════════════════════════════════════
// ACTION HANDLER REGISTRATION (Refresh handlers for cascade targets)
// ═══════════════════════════════════════════════════════════════════

/**
 * Generic refresh handler for any element
 * Updates element state with cascaded input data
 */
const genericRefreshHandler = async (context: ActionContext): Promise<ActionResult> => {
  const { element, data, state } = context;
  const elemId = element?.instanceId || element?.id;

  if (!elemId) {
    return { success: false, error: 'Element ID required' };
  }

  const newState = { ...state };
  const currentElementState = (newState[elemId] as Record<string, unknown>) || {};

  // Merge cascaded data into element state
  const cascadeData = { ...data };
  delete cascadeData._cascadeSource;
  delete cascadeData._cascadeOutput;

  newState[elemId] = {
    ...currentElementState,
    ...cascadeData,
    _lastRefreshAt: new Date().toISOString(),
  };

  return {
    success: true,
    state: newState,
    data: { refreshed: true },
  };
};

// Register refresh handlers for all elements that may be cascade targets
// This ensures any element can receive data from connected elements

// Universal elements
registerElementActionHandler('leaderboard', 'refresh', genericRefreshHandler);
registerElementActionHandler('result-list', 'refresh', genericRefreshHandler);
registerElementActionHandler('chart-display', 'refresh', genericRefreshHandler);
registerElementActionHandler('notification-display', 'refresh', genericRefreshHandler);
registerElementActionHandler('tag-cloud', 'refresh', genericRefreshHandler);
registerElementActionHandler('map-view', 'refresh', genericRefreshHandler);
registerElementActionHandler('filter-selector', 'refresh', genericRefreshHandler);
registerElementActionHandler('availability-heatmap', 'refresh', genericRefreshHandler);

// Connected elements
registerElementActionHandler('event-picker', 'refresh', genericRefreshHandler);
registerElementActionHandler('space-picker', 'refresh', genericRefreshHandler);
registerElementActionHandler('user-selector', 'refresh', genericRefreshHandler);
registerElementActionHandler('connection-list', 'refresh', genericRefreshHandler);
registerElementActionHandler('rsvp-button', 'refresh', genericRefreshHandler);

// Space elements
registerElementActionHandler('member-list', 'refresh', genericRefreshHandler);
registerElementActionHandler('member-selector', 'refresh', genericRefreshHandler);
registerElementActionHandler('space-events', 'refresh', genericRefreshHandler);
registerElementActionHandler('space-feed', 'refresh', genericRefreshHandler);
registerElementActionHandler('space-stats', 'refresh', genericRefreshHandler);
registerElementActionHandler('announcement', 'refresh', genericRefreshHandler);
registerElementActionHandler('role-gate', 'refresh', genericRefreshHandler);

// Additional universal elements (previously missing)
registerElementActionHandler('search-input', 'refresh', genericRefreshHandler);
registerElementActionHandler('form-builder', 'refresh', genericRefreshHandler);
registerElementActionHandler('poll-element', 'refresh', genericRefreshHandler);
registerElementActionHandler('counter', 'refresh', genericRefreshHandler);
registerElementActionHandler('timer', 'refresh', genericRefreshHandler);
registerElementActionHandler('countdown-timer', 'refresh', genericRefreshHandler);
registerElementActionHandler('date-picker', 'refresh', genericRefreshHandler);

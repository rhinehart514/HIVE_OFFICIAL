/**
 * Tool Action Handlers
 *
 * Extensible action handler system for HiveLab tool execution.
 * Allows registering custom action handlers for different element types.
 */

import { dbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ToolElement {
  id: string;
  elementId: string; // e.g., 'poll-element', 'countdown-timer'
  instanceId: string;
  type?: string; // Legacy - use elementId instead
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ToolData {
  id?: string;
  name?: string;
  elements?: ToolElement[];
  [key: string]: unknown;
}

export interface DeploymentData {
  id: string;
  toolId?: string;
  deployedTo?: 'profile' | 'space';
  targetId?: string;
  surface?: string;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ActionContext {
  deployment: DeploymentData;
  tool: ToolData;
  userId: string;
  elementId?: string;
  element?: ToolElement | null;
  data: Record<string, unknown>;
  state: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  state?: Record<string, unknown>;
  feedContent?: {
    type: 'post' | 'update' | 'achievement';
    content: string;
    metadata?: Record<string, unknown>;
  };
  notifications?: Array<{
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    recipients?: string[];
  }>;
}

export type ActionHandler = (context: ActionContext) => Promise<ActionResult>;

// ═══════════════════════════════════════════════════════════════════
// ACTION HANDLER REGISTRY
// ═══════════════════════════════════════════════════════════════════

/**
 * Registry of action handlers by action name
 */
const actionHandlers = new Map<string, ActionHandler>();

/**
 * Registry of element-specific action handlers
 * Key format: "{elementId}:{action}"
 */
const elementActionHandlers = new Map<string, ActionHandler>();

/**
 * Register a global action handler
 */
export function registerActionHandler(action: string, handler: ActionHandler): void {
  actionHandlers.set(action, handler);
}

/**
 * Register an element-specific action handler
 */
export function registerElementActionHandler(
  elementId: string,
  action: string,
  handler: ActionHandler
): void {
  elementActionHandlers.set(`${elementId}:${action}`, handler);
}

/**
 * Get the appropriate handler for an action
 * Priority: element-specific > global > default
 */
export function getActionHandler(action: string, elementId?: string): ActionHandler | undefined {
  // Check for element-specific handler first
  if (elementId) {
    const elementHandler = elementActionHandlers.get(`${elementId}:${action}`);
    if (elementHandler) return elementHandler;
  }

  // Fall back to global handler
  return actionHandlers.get(action);
}

/**
 * Execute an action with the appropriate handler
 */
export async function executeAction(
  action: string,
  context: ActionContext
): Promise<ActionResult> {
  const elementId = context.element?.elementId || context.element?.type;
  const handler = getActionHandler(action, elementId);

  if (!handler) {
    return {
      success: false,
      error: `No handler registered for action: ${action}`,
    };
  }

  return handler(context);
}

// ═══════════════════════════════════════════════════════════════════
// BUILT-IN ACTION HANDLERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Initialize tool state
 */
const initializeHandler: ActionHandler = async (context) => {
  const { tool, state } = context;
  const initialState = { ...state };

  // Initialize state for each element based on its type
  tool.elements?.forEach((element) => {
    const elemId = element.instanceId || element.id;
    if (!initialState[elemId]) {
      initialState[elemId] = getInitialElementState(element);
    }
  });

  return {
    success: true,
    state: initialState,
    data: { initialized: true },
  };
};

/**
 * Save arbitrary data to state
 */
const saveDataHandler: ActionHandler = async (context) => {
  const { data, state } = context;
  const newState = { ...state, ...data };

  return {
    success: true,
    state: newState,
    data: { saved: true },
  };
};

/**
 * Generic form submission handler
 */
const submitFormHandler: ActionHandler = async (context) => {
  const { tool, element, data, state, userId } = context;
  const newState = { ...state };
  const elemId = element?.instanceId || element?.id;

  if (elemId) {
    const currentElementState = (newState[elemId] as Record<string, unknown>) || {};
    newState[elemId] = {
      ...currentElementState,
      lastSubmission: data,
      submissionCount: ((currentElementState.submissionCount as number) || 0) + 1,
      lastSubmittedAt: new Date().toISOString(),
      lastSubmittedBy: userId,
    };
  }

  return {
    success: true,
    state: newState,
    data: { submitted: true, formData: data },
    feedContent: {
      type: 'post',
      content: `Submitted response to ${tool.name || 'tool'}`,
      metadata: { toolId: tool.id, submissionTime: new Date().toISOString() },
    },
  };
};

// ═══════════════════════════════════════════════════════════════════
// ELEMENT-SPECIFIC HANDLERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Poll element: submit vote
 */
const pollSubmitHandler: ActionHandler = async (context) => {
  const { element, data, state, userId, tool } = context;
  const elemId = element?.instanceId || element?.id;

  if (!elemId) {
    return { success: false, error: 'Element ID required for poll' };
  }

  const newState = { ...state };
  const pollState = (newState[elemId] as Record<string, unknown>) || {
    responses: {},
    totalVotes: 0,
  };
  const responses = (pollState.responses as Record<string, unknown>) || {};

  // Check if user already voted (if not allowing multiple votes)
  const allowMultiple = element?.config?.allowMultipleVotes as boolean;
  if (!allowMultiple && responses[userId]) {
    return { success: false, error: 'You have already voted' };
  }

  // Record vote
  const choice = data.choice as string;
  const updatedResponses = {
    ...responses,
    [userId]: {
      choice,
      timestamp: new Date().toISOString(),
    },
  };

  newState[elemId] = {
    ...pollState,
    responses: updatedResponses,
    totalVotes: Object.keys(updatedResponses).length,
    lastVoteAt: new Date().toISOString(),
  };

  return {
    success: true,
    state: newState,
    data: {
      voted: true,
      choice,
      totalVotes: Object.keys(updatedResponses).length,
    },
    feedContent: {
      type: 'update',
      content: `Voted in poll: ${element?.config?.question || 'Poll'}`,
      metadata: { toolId: tool.id, pollId: elemId },
    },
  };
};

/**
 * RSVP element: respond to event
 */
const rsvpSubmitHandler: ActionHandler = async (context) => {
  const { element, data, state, userId, tool } = context;
  const elemId = element?.instanceId || element?.id;

  if (!elemId) {
    return { success: false, error: 'Element ID required for RSVP' };
  }

  const newState = { ...state };
  const rsvpState = (newState[elemId] as Record<string, unknown>) || {
    attendees: {},
    count: 0,
    waitlist: [],
  };

  const maxAttendees = (element?.config?.maxAttendees as number) || Infinity;
  const attendees = (rsvpState.attendees as Record<string, unknown>) || {};
  const waitlist = (rsvpState.waitlist as string[]) || [];
  const currentCount = Object.keys(attendees).length;

  const response = data.response as 'yes' | 'no' | 'maybe';

  if (response === 'yes') {
    if (currentCount >= maxAttendees) {
      // Add to waitlist
      if (!waitlist.includes(userId)) {
        waitlist.push(userId);
      }
      newState[elemId] = { ...rsvpState, waitlist };

      return {
        success: true,
        state: newState,
        data: { rsvp: 'waitlist', position: waitlist.indexOf(userId) + 1 },
        notifications: [
          {
            type: 'info',
            message: `You've been added to the waitlist (position ${waitlist.indexOf(userId) + 1})`,
            recipients: [userId],
          },
        ],
      };
    }

    attendees[userId] = {
      response: 'yes',
      timestamp: new Date().toISOString(),
    };
  } else if (response === 'no') {
    delete attendees[userId];
    // Remove from waitlist if present
    const waitlistIndex = waitlist.indexOf(userId);
    if (waitlistIndex > -1) {
      waitlist.splice(waitlistIndex, 1);
    }
  } else {
    attendees[userId] = {
      response: 'maybe',
      timestamp: new Date().toISOString(),
    };
  }

  newState[elemId] = {
    ...rsvpState,
    attendees,
    count: Object.values(attendees).filter((a: unknown) => (a as { response: string }).response === 'yes').length,
    waitlist,
  };

  return {
    success: true,
    state: newState,
    data: {
      rsvp: response,
      attendeeCount: Object.keys(attendees).length,
      spotsRemaining: Math.max(0, maxAttendees - Object.keys(attendees).length),
    },
    feedContent:
      response === 'yes'
        ? {
            type: 'update',
            content: `RSVP'd to ${element?.config?.eventName || 'event'}`,
            metadata: { toolId: tool.id, rsvpId: elemId },
          }
        : undefined,
  };
};

/**
 * Countdown timer: check status
 */
const countdownCheckHandler: ActionHandler = async (context) => {
  const { element, state } = context;
  const elemId = element?.instanceId || element?.id;

  if (!elemId) {
    return { success: false, error: 'Element ID required' };
  }

  const config = element?.config || {};
  const targetDate = config.targetDate as string;

  if (!targetDate) {
    return { success: false, error: 'Countdown has no target date' };
  }

  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const remaining = Math.max(0, target - now);
  const isComplete = remaining === 0;

  const newState = { ...state };
  newState[elemId] = {
    ...(newState[elemId] as Record<string, unknown>),
    remaining,
    isComplete,
    checkedAt: new Date().toISOString(),
  };

  return {
    success: true,
    state: newState,
    data: {
      remaining,
      isComplete,
      targetDate,
      remainingFormatted: formatDuration(remaining),
    },
  };
};

/**
 * Leaderboard: update score
 */
const leaderboardUpdateHandler: ActionHandler = async (context) => {
  const { element, data, state, userId } = context;
  const elemId = element?.instanceId || element?.id;

  if (!elemId) {
    return { success: false, error: 'Element ID required' };
  }

  const newState = { ...state };
  const leaderboardState = (newState[elemId] as Record<string, unknown>) || {
    entries: {},
  };
  const entries = (leaderboardState.entries as Record<string, { score: number; name?: string; updatedAt: string }>) || {};

  const scoreChange = (data.score as number) || 0;
  const currentEntry = entries[userId] || { score: 0, updatedAt: '' };
  const newScore = currentEntry.score + scoreChange;

  entries[userId] = {
    ...currentEntry,
    score: newScore,
    name: (data.name as string) || currentEntry.name,
    updatedAt: new Date().toISOString(),
  };

  newState[elemId] = {
    ...leaderboardState,
    entries,
    lastUpdated: new Date().toISOString(),
  };

  // Calculate rank
  const sortedEntries = Object.entries(entries).sort((a, b) => b[1].score - a[1].score);
  const rank = sortedEntries.findIndex(([id]) => id === userId) + 1;

  return {
    success: true,
    state: newState,
    data: {
      score: newScore,
      rank,
      totalParticipants: sortedEntries.length,
    },
  };
};

/**
 * Counter: increment/decrement
 */
const counterUpdateHandler: ActionHandler = async (context) => {
  const { element, data, state } = context;
  const elemId = element?.instanceId || element?.id;

  if (!elemId) {
    return { success: false, error: 'Element ID required' };
  }

  const newState = { ...state };
  const counterState = (newState[elemId] as Record<string, unknown>) || { value: 0 };
  const currentValue = (counterState.value as number) || 0;
  const delta = (data.delta as number) || (data.increment as number) || 1;
  const newValue = currentValue + delta;

  // Check bounds if configured
  const minValue = element?.config?.minValue as number | undefined;
  const maxValue = element?.config?.maxValue as number | undefined;

  if (minValue !== undefined && newValue < minValue) {
    return { success: false, error: `Value cannot be less than ${minValue}` };
  }
  if (maxValue !== undefined && newValue > maxValue) {
    return { success: false, error: `Value cannot exceed ${maxValue}` };
  }

  newState[elemId] = {
    ...counterState,
    value: newValue,
    lastUpdated: new Date().toISOString(),
  };

  return {
    success: true,
    state: newState,
    data: { value: newValue, delta },
  };
};

/**
 * Timer: start
 */
const timerStartHandler: ActionHandler = async (context) => {
  const { element, state } = context;
  const elemId = element?.instanceId || element?.id;

  if (!elemId) {
    return { success: false, error: 'Element ID required' };
  }

  const newState = { ...state };
  const timerState = (newState[elemId] as Record<string, unknown>) || {};

  if (timerState.isRunning) {
    return { success: false, error: 'Timer is already running' };
  }

  newState[elemId] = {
    ...timerState,
    startTime: new Date().toISOString(),
    isRunning: true,
    elapsed: (timerState.elapsed as number) || 0,
  };

  return {
    success: true,
    state: newState,
    data: { started: true, startTime: new Date().toISOString() },
  };
};

/**
 * Timer: stop
 */
const timerStopHandler: ActionHandler = async (context) => {
  const { element, state } = context;
  const elemId = element?.instanceId || element?.id;

  if (!elemId) {
    return { success: false, error: 'Element ID required' };
  }

  const newState = { ...state };
  const timerState = (newState[elemId] as Record<string, unknown>) || {};

  if (!timerState.isRunning) {
    return { success: false, error: 'Timer is not running' };
  }

  const startTime = new Date(timerState.startTime as string).getTime();
  const sessionElapsed = Date.now() - startTime;
  const totalElapsed = ((timerState.elapsed as number) || 0) + sessionElapsed;

  newState[elemId] = {
    ...timerState,
    isRunning: false,
    elapsed: totalElapsed,
    lastSession: sessionElapsed,
    stoppedAt: new Date().toISOString(),
  };

  return {
    success: true,
    state: newState,
    data: {
      stopped: true,
      sessionTime: sessionElapsed,
      totalTime: totalElapsed,
      formattedSession: formatDuration(sessionElapsed),
      formattedTotal: formatDuration(totalElapsed),
    },
    feedContent: {
      type: 'update',
      content: `Completed ${formatDuration(sessionElapsed)} session`,
      metadata: { sessionTime: sessionElapsed, totalTime: totalElapsed },
    },
  };
};

/**
 * Timer: reset
 */
const timerResetHandler: ActionHandler = async (context) => {
  const { element, state } = context;
  const elemId = element?.instanceId || element?.id;

  if (!elemId) {
    return { success: false, error: 'Element ID required' };
  }

  const newState = { ...state };
  newState[elemId] = {
    startTime: null,
    isRunning: false,
    elapsed: 0,
    lastSession: 0,
    resetAt: new Date().toISOString(),
  };

  return {
    success: true,
    state: newState,
    data: { reset: true },
  };
};

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get initial state for an element based on its type
 */
function getInitialElementState(element: ToolElement): Record<string, unknown> {
  const elementType = element.elementId || element.type;
  const config = element.config || {};

  switch (elementType) {
    case 'counter':
      return { value: (config.initialValue as number) || 0 };

    case 'timer':
    case 'countdown-timer':
      return {
        startTime: null,
        elapsed: 0,
        isRunning: false,
        targetDate: config.targetDate,
      };

    case 'poll-element':
    case 'poll':
      return {
        responses: {},
        totalVotes: 0,
      };

    case 'rsvp-button':
    case 'rsvp':
      return {
        attendees: {},
        count: 0,
        waitlist: [],
      };

    case 'leaderboard':
      return {
        entries: {},
      };

    case 'form-builder':
    case 'form':
      return {
        submissions: [],
        submissionCount: 0,
      };

    case 'result-list':
    case 'results':
      return {
        items: [],
        filters: {},
      };

    default:
      return {};
  }
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return '< 1 second';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// ═══════════════════════════════════════════════════════════════════
// REGISTER DEFAULT HANDLERS
// ═══════════════════════════════════════════════════════════════════

// Global handlers
registerActionHandler('initialize', initializeHandler);
registerActionHandler('save_data', saveDataHandler);
registerActionHandler('submit_form', submitFormHandler);

// Poll element handlers
registerElementActionHandler('poll-element', 'submit', pollSubmitHandler);
registerElementActionHandler('poll-element', 'vote', pollSubmitHandler);
registerElementActionHandler('poll', 'submit_poll', pollSubmitHandler);

// RSVP element handlers
registerElementActionHandler('rsvp-button', 'submit', rsvpSubmitHandler);
registerElementActionHandler('rsvp-button', 'rsvp', rsvpSubmitHandler);

// Countdown timer handlers
registerElementActionHandler('countdown-timer', 'check', countdownCheckHandler);
registerElementActionHandler('countdown-timer', 'get_status', countdownCheckHandler);

// Leaderboard handlers
registerElementActionHandler('leaderboard', 'update_score', leaderboardUpdateHandler);
registerElementActionHandler('leaderboard', 'increment', leaderboardUpdateHandler);

// Counter handlers
registerElementActionHandler('counter', 'update', counterUpdateHandler);
registerElementActionHandler('counter', 'update_counter', counterUpdateHandler);
registerElementActionHandler('counter', 'increment', counterUpdateHandler);
registerElementActionHandler('counter', 'decrement', async (ctx) =>
  counterUpdateHandler({ ...ctx, data: { delta: -(ctx.data.delta as number || 1) } })
);

// Timer handlers
registerElementActionHandler('timer', 'start', timerStartHandler);
registerElementActionHandler('timer', 'start_timer', timerStartHandler);
registerElementActionHandler('timer', 'stop', timerStopHandler);
registerElementActionHandler('timer', 'stop_timer', timerStopHandler);
registerElementActionHandler('timer', 'reset', timerResetHandler);
registerElementActionHandler('timer', 'reset_timer', timerResetHandler);

// Form handlers
registerElementActionHandler('form-builder', 'submit', submitFormHandler);
registerElementActionHandler('form-builder', 'submit_form', submitFormHandler);

// Export types and utilities
export { getInitialElementState, formatDuration };

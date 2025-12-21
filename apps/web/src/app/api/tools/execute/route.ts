// Use admin SDK methods since we're in an API route
import { dbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { logger } from "@/lib/logger";
import { getPlacementFromDeploymentDoc } from '@/lib/tool-placement';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import {
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { z } from "zod";
import {
  processActionConnections,
  type ToolComposition,
} from '@/lib/tool-connection-engine';
import { rateLimit } from '@/lib/rate-limit-simple';

// Rate limiter for tool executions: 60 requests per minute per user
const toolExecuteRateLimiter = rateLimit({
  maxRequests: 60,
  windowMs: 60000,
  identifier: 'tool-execute',
  blockOnError: true,
});

// =============================================================================
// Inlined Action Handlers (previously from @/lib/tool-action-handlers)
// =============================================================================

// Types for action handling
export interface ActionToolElement {
  id: string;
  type: string;
  config?: Record<string, unknown>;
  actions?: Array<{ id: string; type: string; handler?: string; config?: Record<string, unknown> }>;
  [key: string]: unknown;
}

export interface ActionToolData {
  id?: string;
  elements?: ActionToolElement[];
  useCount?: number;
  [key: string]: unknown;
}

export interface ActionDeploymentData {
  id: string;
  status?: string;
  toolId?: string;
  deployedTo?: 'profile' | 'space';
  targetId?: string;
  surface?: string;
  permissions?: { canInteract?: boolean; allowedRoles?: string[] };
  settings?: { collectAnalytics?: boolean; [key: string]: unknown };
  usageCount?: number;
  [key: string]: unknown;
}

export interface ActionContext {
  deployment: ActionDeploymentData;
  tool: ActionToolData;
  userId: string;
  elementId?: string;
  element: ActionToolElement | null;
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
  outputs?: Record<string, unknown>; // Output values for cascade connections
  notifications?: Array<{
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    recipients?: string[];
  }>;
}

// Action handler registry
type ActionHandler = (context: ActionContext) => Promise<ActionResult>;

const actionHandlers: Record<string, ActionHandler> = {
  // Default handlers for common actions
  async submit(context: ActionContext): Promise<ActionResult> {
    return {
      success: true,
      state: { ...context.state, submitted: true, submittedAt: new Date().toISOString() },
      data: { action: 'submit', elementId: context.elementId },
    };
  },

  async vote(context: ActionContext): Promise<ActionResult> {
    const { data, state, elementId } = context;
    const optionId = data.optionId as string;
    const pollState = (state[elementId || 'poll'] || { votes: {} }) as { votes: Record<string, number> };

    return {
      success: true,
      state: {
        ...state,
        [elementId || 'poll']: {
          ...pollState,
          votes: {
            ...pollState.votes,
            [optionId]: (pollState.votes[optionId] || 0) + 1,
          },
          lastVotedAt: new Date().toISOString(),
          votedBy: [...(((pollState as Record<string, unknown>).votedBy as string[]) || []), context.userId],
        },
      },
    };
  },

  async increment(context: ActionContext): Promise<ActionResult> {
    const { state, elementId } = context;
    const key = elementId || 'counter';
    const currentValue = (state[key] as number) || 0;

    return {
      success: true,
      state: { ...state, [key]: currentValue + 1 },
    };
  },

  async decrement(context: ActionContext): Promise<ActionResult> {
    const { state, elementId } = context;
    const key = elementId || 'counter';
    const currentValue = (state[key] as number) || 0;

    return {
      success: true,
      state: { ...state, [key]: Math.max(0, currentValue - 1) },
    };
  },

  async toggle(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = (data.key as string) || elementId || 'toggle';
    const currentValue = Boolean(state[key]);

    return {
      success: true,
      state: { ...state, [key]: !currentValue },
    };
  },

  async save_input(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'input';

    return {
      success: true,
      state: { ...state, [key]: data.value },
    };
  },

  async select(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'selection';

    return {
      success: true,
      state: { ...state, [key]: data.selectedValue || data.value },
    };
  },

  async rsvp(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data, userId } = context;
    const eventKey = elementId || 'event';
    const status = data.status as string || 'going';
    const eventState = (state[eventKey] || { rsvps: {} }) as { rsvps: Record<string, string> };

    return {
      success: true,
      state: {
        ...state,
        [eventKey]: {
          ...eventState,
          rsvps: { ...eventState.rsvps, [userId]: status },
          lastUpdatedAt: new Date().toISOString(),
        },
      },
    };
  },

  // =============================================================================
  // Timer & Countdown Actions
  // =============================================================================

  async start(context: ActionContext): Promise<ActionResult> {
    const { state, elementId } = context;
    const key = elementId || 'timer';
    const timerState = (state[key] || { elapsed: 0, isRunning: false }) as { elapsed: number; isRunning: boolean; startedAt?: string };

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          ...timerState,
          isRunning: true,
          startedAt: new Date().toISOString(),
        },
      },
    };
  },

  async stop(context: ActionContext): Promise<ActionResult> {
    const { state, elementId } = context;
    const key = elementId || 'timer';
    const timerState = (state[key] || { elapsed: 0, isRunning: false }) as { elapsed: number; isRunning: boolean; startedAt?: string };

    // Calculate elapsed time if timer was running
    let elapsed = timerState.elapsed || 0;
    if (timerState.isRunning && timerState.startedAt) {
      elapsed += Date.now() - new Date(timerState.startedAt).getTime();
    }

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          ...timerState,
          isRunning: false,
          elapsed,
          stoppedAt: new Date().toISOString(),
        },
      },
    };
  },

  async reset(context: ActionContext): Promise<ActionResult> {
    const { state, elementId } = context;
    const key = elementId || 'timer';

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          elapsed: 0,
          isRunning: false,
          resetAt: new Date().toISOString(),
        },
      },
    };
  },

  async lap(context: ActionContext): Promise<ActionResult> {
    const { state, elementId } = context;
    const key = elementId || 'timer';
    const timerState = (state[key] || { elapsed: 0, laps: [] }) as { elapsed: number; laps: number[]; startedAt?: string };

    let currentElapsed = timerState.elapsed || 0;
    if (timerState.startedAt) {
      currentElapsed += Date.now() - new Date(timerState.startedAt).getTime();
    }

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          ...timerState,
          laps: [...(timerState.laps || []), currentElapsed],
        },
      },
    };
  },

  // =============================================================================
  // Search & Filter Actions
  // =============================================================================

  async search(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'search';
    const query = (data.query as string) || '';

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          query,
          searchedAt: new Date().toISOString(),
        },
      },
    };
  },

  async apply_filters(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'filters';
    const filters = (data.filters as Record<string, unknown>) || {};

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          activeFilters: filters,
          appliedAt: new Date().toISOString(),
        },
      },
    };
  },

  async clear_filters(context: ActionContext): Promise<ActionResult> {
    const { state, elementId } = context;
    const key = elementId || 'filters';

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          activeFilters: {},
          clearedAt: new Date().toISOString(),
        },
      },
    };
  },

  // =============================================================================
  // Selection Actions (pickers, lists)
  // =============================================================================

  async select_date(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'datePicker';

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          selectedDate: data.date,
          selectedAt: new Date().toISOString(),
        },
      },
    };
  },

  async select_user(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'userSelector';

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          selectedUserId: data.userId,
          selectedUser: data.user || null,
          selectedAt: new Date().toISOString(),
        },
      },
    };
  },

  async select_event(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'eventPicker';

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          selectedEventId: data.eventId,
          selectedEvent: data.event || null,
          selectedAt: new Date().toISOString(),
        },
      },
    };
  },

  async select_space(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'spacePicker';

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          selectedSpaceId: data.spaceId,
          selectedSpace: data.space || null,
          selectedAt: new Date().toISOString(),
        },
      },
    };
  },

  async select_item(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'resultList';

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          selectedItemId: data.itemId,
          selectedItem: data.item || null,
          selectedAt: new Date().toISOString(),
        },
      },
    };
  },

  async select_tag(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'tagCloud';
    const tagState = (state[key] || { selectedTags: [] }) as { selectedTags: string[] };
    const tag = data.tag as string;
    const isSelected = tagState.selectedTags.includes(tag);

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          selectedTags: isSelected
            ? tagState.selectedTags.filter(t => t !== tag)
            : [...tagState.selectedTags, tag],
          lastUpdatedAt: new Date().toISOString(),
        },
      },
    };
  },

  async select_member(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'memberList';

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          selectedMemberId: data.memberId,
          selectedMember: data.member || null,
          selectedAt: new Date().toISOString(),
        },
      },
    };
  },

  async select_members(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'memberSelector';
    const memberIds = (data.memberIds as string[]) || [];

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          selectedMemberIds: memberIds,
          selectedCount: memberIds.length,
          selectedAt: new Date().toISOString(),
        },
      },
    };
  },

  // =============================================================================
  // Chart & Data Visualization Actions
  // =============================================================================

  async select_point(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'chart';

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          selectedPoint: data.point,
          selectedIndex: data.index,
          selectedAt: new Date().toISOString(),
        },
      },
    };
  },

  // =============================================================================
  // Leaderboard Actions
  // =============================================================================

  async update_score(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data, userId } = context;
    const key = elementId || 'leaderboard';
    const leaderboardState = (state[key] || { scores: {} }) as { scores: Record<string, number> };
    const targetUserId = (data.userId as string) || userId;
    const delta = (data.delta as number) || 0;
    const newScore = (data.score as number) ?? (leaderboardState.scores[targetUserId] || 0) + delta;

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          ...leaderboardState,
          scores: {
            ...leaderboardState.scores,
            [targetUserId]: Math.max(0, newScore),
          },
          lastUpdatedAt: new Date().toISOString(),
        },
      },
    };
  },

  // =============================================================================
  // Map / Location Actions
  // =============================================================================

  async select_location(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'map';
    const marker = data.marker as { id: string; name: string; x?: number; y?: number; type?: string } | undefined;

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          selectedMarker: marker || null,
          selectedMarkerId: data.markerId as string || marker?.id || null,
          selectedLocation: marker?.name || data.name || null,
          selectedAt: new Date().toISOString(),
        },
      },
      outputs: marker ? { location: marker.name, markerId: marker.id } : undefined,
    };
  },

  // =============================================================================
  // Notification Actions
  // =============================================================================

  async dismiss_notification(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'notifications';
    const notifState = (state[key] || { dismissed: [] }) as { dismissed: string[] };
    const notificationId = data.notificationId as string;

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          ...notifState,
          dismissed: [...notifState.dismissed, notificationId],
        },
      },
    };
  },

  async mark_read(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'notifications';
    const notifState = (state[key] || { read: [] }) as { read: string[] };
    const notificationId = data.notificationId as string;

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          ...notifState,
          read: [...notifState.read, notificationId],
        },
      },
    };
  },

  async mark_all_read(context: ActionContext): Promise<ActionResult> {
    const { state, elementId } = context;
    const key = elementId || 'notifications';

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          read: 'all',
          markedAt: new Date().toISOString(),
        },
      },
    };
  },

  // =============================================================================
  // Form Actions
  // =============================================================================

  async submit_form(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data, userId } = context;
    const key = elementId || 'form';
    const formData = (data.formData as Record<string, unknown>) || data;

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          submitted: true,
          formData,
          submittedBy: userId,
          submittedAt: new Date().toISOString(),
        },
      },
      data: {
        formSubmission: formData,
      },
    };
  },

  async update_field(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data } = context;
    const key = elementId || 'form';
    const formState = (state[key] || { fields: {} }) as { fields: Record<string, unknown> };
    const fieldName = data.fieldName as string;
    const fieldValue = data.value;

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          ...formState,
          fields: {
            ...formState.fields,
            [fieldName]: fieldValue,
          },
        },
      },
    };
  },

  // =============================================================================
  // Announcement Actions
  // =============================================================================

  async send_announcement(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data, userId } = context;
    const key = elementId || 'announcement';
    const content = data.content as string;
    const recipients = (data.recipients as string[]) || [];

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          sent: true,
          content,
          recipients,
          sentBy: userId,
          sentAt: new Date().toISOString(),
        },
      },
      notifications: recipients.length > 0 ? [{
        type: 'info',
        message: content,
        recipients,
      }] : undefined,
    };
  },

  async dismiss_announcement(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, userId } = context;
    const key = elementId || 'announcement';
    const announcementState = (state[key] || { dismissedBy: [] }) as { dismissedBy: string[] };

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          ...announcementState,
          dismissedBy: [...announcementState.dismissedBy, userId],
        },
      },
    };
  },

  // =============================================================================
  // Connection Actions
  // =============================================================================

  async request_connection(context: ActionContext): Promise<ActionResult> {
    const { state, elementId, data, userId } = context;
    const key = elementId || 'connections';
    const targetUserId = data.targetUserId as string;

    return {
      success: true,
      state: {
        ...state,
        [key]: {
          lastRequest: {
            from: userId,
            to: targetUserId,
            requestedAt: new Date().toISOString(),
          },
        },
      },
    };
  },
};

/**
 * Execute an action with the given context
 */
async function executeAction(actionName: string, context: ActionContext): Promise<ActionResult> {
  // Normalize action name
  const normalizedAction = actionName.toLowerCase().replace(/-/g, '_');

  // Check if we have a handler for this action
  const handler = actionHandlers[normalizedAction];

  if (handler) {
    try {
      return await handler(context);
    } catch (error) {
      logger.error('Action handler error', { action: normalizedAction, error });
      return {
        success: false,
        error: `Action handler failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Check if the element has a custom action defined
  if (context.element?.actions) {
    const customAction = context.element.actions.find(
      a => a.type === actionName || a.id === actionName
    );

    if (customAction) {
      // Execute custom action based on handler type
      return {
        success: true,
        state: {
          ...context.state,
          [`${context.elementId}_${actionName}`]: {
            executedAt: new Date().toISOString(),
            data: context.data,
          },
        },
      };
    }
  }

  // Default: just record the action
  logger.info('Unknown action executed', { action: actionName, elementId: context.elementId });
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

// Deployment data interface
interface DeploymentData {
  id: string;
  status?: string;
  toolId?: string;
  deployedTo?: 'profile' | 'space';
  targetId?: string;
  surface?: string;
  permissions?: {
    canInteract?: boolean;
    allowedRoles?: string[];
  };
  settings?: {
    collectAnalytics?: boolean;
    [key: string]: unknown;
  };
  usageCount?: number;
  [key: string]: unknown;
}

// Tool data interface
interface ToolData {
  id?: string;
  elements?: ToolElement[];
  useCount?: number;
  [key: string]: unknown;
}

// Tool element interface
interface ToolElement {
  id: string;
  type: string;
  config?: Record<string, unknown>;
  actions?: ToolAction[];
  [key: string]: unknown;
}

// Tool action interface
interface ToolAction {
  id: string;
  type: string;
  handler?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

// Tool execution request interface
interface _ToolExecutionRequest {
  deploymentId: string;
  action: string;
  elementId?: string;
  data?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

// Tool execution result interface
interface ToolExecutionResult {
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

// Input sanitization: Limit string lengths and validate patterns
const MAX_ID_LENGTH = 128;
const MAX_ACTION_LENGTH = 64;
const MAX_DATA_KEYS = 50;
const MAX_STRING_VALUE_LENGTH = 10000;

// Allowed characters for IDs and actions (alphanumeric, underscore, hyphen, colon)
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_:-]+$/;
const SAFE_ACTION_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

/**
 * Sanitize string values in data objects to prevent XSS
 * Truncates long strings and escapes HTML entities
 */
function sanitizeDataValue(value: unknown, maxLength = MAX_STRING_VALUE_LENGTH): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    // Truncate long strings
    let sanitized = value.length > maxLength ? value.slice(0, maxLength) : value;
    // Escape HTML entities to prevent XSS if rendered
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    return sanitized;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 100).map(v => sanitizeDataValue(v, maxLength));
  }
  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    const keys = Object.keys(value as Record<string, unknown>).slice(0, MAX_DATA_KEYS);
    for (const key of keys) {
      sanitized[key] = sanitizeDataValue((value as Record<string, unknown>)[key], maxLength);
    }
    return sanitized;
  }
  return value;
}

const ToolExecutionSchema = z.object({
  deploymentId: z.string()
    .min(1, "Deployment ID is required")
    .max(MAX_ID_LENGTH, `Deployment ID too long (max ${MAX_ID_LENGTH})`)
    .refine(val => SAFE_ID_PATTERN.test(val), "Invalid deployment ID format"),
  action: z.string()
    .min(1, "Action is required")
    .max(MAX_ACTION_LENGTH, `Action name too long (max ${MAX_ACTION_LENGTH})`)
    .refine(val => SAFE_ACTION_PATTERN.test(val), "Invalid action name format"),
  elementId: z.string()
    .max(MAX_ID_LENGTH, `Element ID too long (max ${MAX_ID_LENGTH})`)
    .refine(val => !val || SAFE_ID_PATTERN.test(val), "Invalid element ID format")
    .optional(),
  data: z.record(z.unknown())
    .refine(val => !val || Object.keys(val).length <= MAX_DATA_KEYS, `Too many data keys (max ${MAX_DATA_KEYS})`)
    .optional(),
  context: z.record(z.unknown())
    .refine(val => !val || Object.keys(val).length <= MAX_DATA_KEYS, `Too many context keys (max ${MAX_DATA_KEYS})`)
    .optional(),
});

/**
 * Resolve deployment document from various ID formats:
 * 1. Composite ID: "space:spaceId_placementId" → placed_tools subcollection
 * 2. Direct ID → deployedTools collection
 */
async function resolveDeployment(deploymentId: string): Promise<{
  doc: admin.firestore.DocumentSnapshot | null;
  ref: admin.firestore.DocumentReference | null;
  placementRef: admin.firestore.DocumentReference | null;
  spaceId: string | null;
}> {
  // Check for composite ID format: "space:spaceId_placementId"
  if (deploymentId.startsWith('space:')) {
    const rest = deploymentId.slice(6); // Remove 'space:' prefix
    const underscoreIndex = rest.indexOf('_');
    if (underscoreIndex > 0) {
      const spaceId = rest.slice(0, underscoreIndex);
      const placementId = rest.slice(underscoreIndex + 1);

      // Get from placed_tools subcollection
      const placementRef = dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('placed_tools')
        .doc(placementId);

      const placementDoc = await placementRef.get();
      if (placementDoc.exists) {
        return {
          doc: placementDoc,
          ref: placementRef,
          placementRef,
          spaceId,
        };
      }
    }
  }

  // Fallback: Check deployedTools collection
  const deploymentRef = dbAdmin.collection('deployedTools').doc(deploymentId);
  const deploymentDoc = await deploymentRef.get();

  if (deploymentDoc.exists) {
    const data = deploymentDoc.data();
    return {
      doc: deploymentDoc,
      ref: deploymentRef,
      placementRef: null,
      spaceId: data?.targetId || null,
    };
  }

  return { doc: null, ref: null, placementRef: null, spaceId: null };
}

// POST - Execute tool action
export const POST = withAuthValidationAndErrors(
  ToolExecutionSchema,
  async (
    request,
    _context,
    body,
    respond
  ) => {
    try {
      const userId = getUserId(request as AuthenticatedRequest);

      // SECURITY: Rate limit tool executions per user
      const rateLimitResult = toolExecuteRateLimiter.check(userId);
      if (!rateLimitResult.success) {
        logger.warn('Tool execution rate limited', {
          userId,
          remaining: rateLimitResult.remaining,
          retryAfter: rateLimitResult.retryAfter
        });
        return respond.error(
          'Too many requests. Please slow down.',
          'RATE_LIMITED',
          { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter || 60) } }
        );
      }

      const { deploymentId, action, elementId, data, context } = body;

      // SECURITY: Sanitize user-provided data to prevent XSS and limit payload sizes
      const sanitizedData = data ? sanitizeDataValue(data) as Record<string, unknown> : undefined;
      const sanitizedContext = context ? sanitizeDataValue(context) as Record<string, unknown> : undefined;

    // Get deployment details from either placed_tools or deployedTools
    const resolved = await resolveDeployment(deploymentId);
    if (!resolved.doc) {
        return respond.error("Deployment not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const deploymentDocData = resolved.doc.data() || {};
    const deployment = { id: resolved.doc.id, ...deploymentDocData } as DeploymentData;

    // For placed_tools, fill in missing fields
    if (resolved.placementRef && resolved.spaceId) {
      deployment.deployedTo = 'space';
      deployment.targetId = resolved.spaceId;
    }

    // Enforce campus isolation
    if ((deployment as Record<string, unknown>)?.campusId && (deployment as Record<string, unknown>).campusId !== CURRENT_CAMPUS_ID) {
        return respond.error("Access denied for this campus", "FORBIDDEN", { status: 403 });
    }

    // Use resolved placementRef or fall back to getPlacementFromDeploymentDoc
    let placementContext: { snapshot: admin.firestore.DocumentSnapshot; ref: admin.firestore.DocumentReference } | null = null;
    if (resolved.placementRef) {
      placementContext = { snapshot: resolved.doc, ref: resolved.placementRef };
    } else {
      placementContext = await getPlacementFromDeploymentDoc(resolved.doc);
    }
    const placementData = placementContext?.snapshot?.data() as (Record<string, unknown> | undefined);

    // Check if deployment is active
    const deploymentStatus = placementData?.status || deployment.status;
    if (deploymentStatus !== 'active') {
        return respond.error("Tool deployment is not active", "FORBIDDEN", { status: 403 });
    }

    // Check user permissions
    const permissionCheck = await canUserExecuteTool(userId, deployment, placementData);
    if (!permissionCheck.allowed) {
        return respond.error(permissionCheck.reason, permissionCheck.code, { status: 403 });
    }

    // Get tool details
    if (!deployment.toolId) {
        return respond.error("Invalid deployment: missing toolId", "INVALID_DATA", { status: 400 });
    }
    const toolDoc = await dbAdmin.collection('tools').doc(deployment.toolId).get();
    if (!toolDoc.exists) {
        return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const tool = toolDoc.data() as ToolData;
    if ((tool as Record<string, unknown>)?.campusId && (tool as Record<string, unknown>).campusId !== CURRENT_CAMPUS_ID) {
        return respond.error("Access denied for this campus", "FORBIDDEN", { status: 403 });
    }
    if (!tool) {
        return respond.error("Tool data not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    // Execute tool action with sanitized inputs
    const executionResult = await executeToolAction({
      deployment,
      tool,
      user: { uid: userId },
      action,
      elementId,
      data: sanitizedData || {},
      context: sanitizedContext || {},
      placementContext
    });

    // Update deployment usage stats
    const nowIso = new Date().toISOString();

    // Update the appropriate deployment document based on source
    if (placementContext) {
      // For placed_tools, update via placementContext.ref
      await placementContext.ref.update({
        usageCount: admin.firestore.FieldValue.increment(1),
        lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (resolved.ref) {
      // For deployedTools, update directly
      await resolved.ref.update({
        usageCount: admin.firestore.FieldValue.increment(1),
        lastUsed: nowIso
      });
    }

    // Update tool usage stats
    await dbAdmin.collection('tools').doc(deployment.toolId).update({
      useCount: (tool.useCount || 0) + 1,
      lastUsedAt: nowIso
    });

    // Log activity event (exclude undefined values for Firestore compatibility)
    const activityEvent: Record<string, unknown> = {
      userId,
      type: 'tool_interaction',
      toolId: deployment.toolId,
      metadata: {
        action,
        elementId,
        deploymentId,
        success: executionResult.success,
        surface: deployment.surface
      },
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      campusId: CURRENT_CAMPUS_ID,
    };
    // Only add optional fields if they have values
    if (deployment.deployedTo === 'space' && deployment.targetId) {
      activityEvent.spaceId = deployment.targetId;
    }
    if (sanitizedContext?.duration) {
      activityEvent.duration = sanitizedContext.duration;
    }
    await dbAdmin.collection('activityEvents').add(activityEvent);

    // Record analytics event for tool usage tracking
    // This powers the analytics dashboard at /tools/[toolId]/analytics
    if (executionResult.success) {
      // Look up element type from tool composition if not provided in data
      let elementType: string | null = sanitizedData?.elementType as string || null;
      if (!elementType && elementId && tool.elements) {
        const element = tool.elements.find(
          (el: { id?: string; instanceId?: string; elementId?: string; type?: string }) =>
            el.id === elementId || el.instanceId === elementId
        );
        if (element) {
          const resolvedType = element.elementId || element.type;
          elementType = typeof resolvedType === 'string' ? resolvedType : null;
        }
      }

      const analyticsEvent = {
        toolId: deployment.toolId || tool.id,
        deploymentId,
        userId,
        action,
        elementId: elementId || null,
        elementType, // Resolved from tool composition or request data
        feature: action, // Track action as feature for feature usage breakdown
        timestamp: new Date(),
        campusId: CURRENT_CAMPUS_ID,
        spaceId: deployment.deployedTo === 'space' ? deployment.targetId : null,
        metadata: {
          elementType,
          feature: action,
          // Track additional context for richer analytics
          elementInstanceId: elementId || null,
          deploymentType: deployment.deployedTo || 'unknown',
          surface: deployment.surface || null,
        },
      };
      // Fire and forget - don't block on analytics write
      dbAdmin.collection('analytics_events').add(analyticsEvent).catch(err => {
        logger.error('Failed to record analytics event', { error: err instanceof Error ? err.message : String(err) });
      });
    }

    // Generate feed content if requested and successful
    if (executionResult.success && executionResult.feedContent) {
      await generateFeedContent(deployment, tool, userId, executionResult.feedContent);
    }

    // Send notifications if any
    if (executionResult.notifications) {
      await processNotifications(deployment, executionResult.notifications);
    }

      return respond.success({
      result: executionResult,
      deploymentId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(
      `Error executing tool at /api/tools/execute`,
      { error: error instanceof Error ? error.message : String(error) }
    );
      return respond.error("Failed to execute tool", "INTERNAL_ERROR", { status: 500 });
  }
  }
);

// Permission check result type for detailed error messages
type PermissionResult =
  | { allowed: true }
  | { allowed: false; reason: string; code: 'INTERACTION_DISABLED' | 'PROFILE_ACCESS_DENIED' | 'NOT_SPACE_MEMBER' | 'ROLE_NOT_ALLOWED' | 'UNKNOWN_TARGET_TYPE' | 'PERMISSION_CHECK_ERROR' };

// Helper function to check tool execution permissions
async function canUserExecuteTool(
  userId: string,
  deployment: DeploymentData,
  placement?: Record<string, unknown>
): Promise<PermissionResult> {
  try {
    const permissionConfig = (placement?.permissions || deployment.permissions) as { canInteract?: boolean; allowedRoles?: string[] } | undefined;
    if (permissionConfig?.canInteract === false) {
      return {
        allowed: false,
        reason: 'This tool does not allow interactions',
        code: 'INTERACTION_DISABLED'
      };
    }

    const targetType = placement?.targetType || deployment.deployedTo;
    const targetId = placement?.targetId || deployment.targetId;

    if (targetType === 'profile') {
      if (targetId === userId) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'You can only use tools deployed to your own profile',
        code: 'PROFILE_ACCESS_DENIED'
      };
    }

    if (targetType === 'space') {
      // Check both 'status' and 'isActive' fields for compatibility
      const membershipQuery = dbAdmin.collection('spaceMembers')
        .where('userId', '==', userId)
        .where('spaceId', '==', targetId)
        .where('campusId', '==', CURRENT_CAMPUS_ID);
      const membershipSnapshot = await membershipQuery.get();

      // Find an active membership (check both isActive and status fields)
      const activeMembership = membershipSnapshot.docs.find(doc => {
        const data = doc.data();
        return data.isActive === true || data.status === 'active';
      });

      if (!activeMembership) {
        return {
          allowed: false,
          reason: 'You must be a member of this space to use this tool',
          code: 'NOT_SPACE_MEMBER'
        };
      }

      const memberData = activeMembership.data() as { role: string; [key: string]: unknown };
      const allowedRoles = permissionConfig?.allowedRoles || deployment.permissions?.allowedRoles;

      // If no role restrictions, any member can access
      if (!allowedRoles || allowedRoles.length === 0) {
        return { allowed: true };
      }

      if (allowedRoles.includes(memberData.role)) {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: `This tool requires one of these roles: ${allowedRoles.join(', ')}. Your role: ${memberData.role}`,
        code: 'ROLE_NOT_ALLOWED'
      };
    }

    logger.warn('Unknown tool deployment target type', { targetType, deploymentId: deployment.id });
    return {
      allowed: false,
      reason: `Unknown deployment target type: ${targetType}`,
      code: 'UNKNOWN_TARGET_TYPE'
    };
  } catch (error) {
    logger.error(
      `Error checking tool execution permissions at /api/tools/execute`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return {
      allowed: false,
      reason: 'Permission check failed due to an internal error',
      code: 'PERMISSION_CHECK_ERROR'
    };
  }
}

// Helper function to execute tool action
async function executeToolAction(params: {
  deployment: DeploymentData;
  tool: ToolData;
  user: { uid: string };
  action: string;
  elementId?: string;
  data: Record<string, unknown>;
  context: Record<string, unknown>;
  placementContext?: Awaited<ReturnType<typeof getPlacementFromDeploymentDoc>> | null;
}): Promise<ToolExecutionResult> {
  const { deployment, tool, user, action, elementId, data, placementContext } = params;

  try {
    // Get or create tool state
    const stateId = `${deployment.id}_${user.uid}`;
    let currentState: Record<string, unknown> = {};

    let placementStateRef: admin.firestore.DocumentReference<admin.firestore.DocumentData> | null = null;
    if (placementContext) {
      placementStateRef = placementContext.ref.collection('state').doc(user.uid);
      const stateSnapshot = await placementStateRef.get();
      if (stateSnapshot.exists) {
        currentState = (stateSnapshot.data()?.state as Record<string, unknown>) || {};
      }
    } else {
      const stateDoc = await dbAdmin.collection('toolStates').doc(stateId).get();
      currentState = stateDoc.exists ? (stateDoc.data() as { state?: Record<string, unknown> })?.state || {} : {};
    }

    // Find the target element if elementId is provided
    // Elements may have 'id', 'instanceId', or 'elementId' as identifiers
    let targetElement: ToolElement | null = null;
    if (elementId) {
      targetElement = tool.elements?.find((el: ToolElement & { instanceId?: string; elementId?: string }) =>
        el.id === elementId ||
        el.instanceId === elementId ||
        el.elementId === elementId
      ) || null;
      if (!targetElement) {
        return {
          success: false,
          error: `Element ${elementId} not found in tool`
        };
      }
    }

    // Fetch space context if tool is deployed to a space
    // This provides events, members, and other space data to HiveLab tools
    let spaceContext: Record<string, unknown> | undefined;
    const targetType = (placementContext?.snapshot?.data() as Record<string, unknown> | undefined)?.targetType || deployment.deployedTo;
    const targetId = (placementContext?.snapshot?.data() as Record<string, unknown> | undefined)?.targetId || deployment.targetId;

    if (targetType === 'space' && targetId) {
      spaceContext = await fetchSpaceContext(targetId as string, user.uid);
    }

    // Build action context for the extensible handler system
    const actionContext: ActionContext = {
      deployment: deployment as ActionDeploymentData,
      tool: tool as ActionToolData,
      userId: user.uid,
      elementId,
      element: targetElement as ActionToolElement | null,
      data,
      state: currentState,
      metadata: params.context,
      spaceContext, // Inject space data (events, members, etc.)
    };

    // Execute action through the extensible handler registry
    let result = await executeAction(action, actionContext) as ToolExecutionResult;

    // Process connection cascades if action was successful and tool has connections
    if (result.success && result.state && targetElement) {
      const toolConnections = (tool as unknown as { connections?: Array<unknown> }).connections || [];

      if (toolConnections.length > 0) {
        const composition: ToolComposition = {
          elements: (tool.elements || []).map(el => ({
            id: el.id,
            elementId: el.type,
            instanceId: el.id,
            config: el.config,
          })),
          connections: toolConnections as ToolComposition['connections'],
        };

        const cascadeResult = await processActionConnections(
          composition,
          result.state,
          action,
          targetElement.type,
          targetElement.id,
          user.uid,
          deployment.id
        );

        // Merge cascade state with result state
        result = {
          ...result,
          state: cascadeResult.updatedState,
          data: {
            ...result.data,
            cascadedElements: cascadeResult.executedElements,
          },
        };
      }
    }

    // Save updated state and submission atomically using batch write
    if (result.success && (result.state || (placementContext && action.startsWith('submit')))) {
      const batch = dbAdmin.batch();

      // State update
      if (result.state) {
        const statePayload = {
          deploymentId: deployment.id,
          toolId: tool.id || deployment.toolId,
          userId: user.uid,
          state: result.state,
          updatedAt: new Date().toISOString(),
          campusId: CURRENT_CAMPUS_ID,
        };

        if (placementStateRef) {
          batch.set(placementStateRef, statePayload, { merge: true });
        }

        batch.set(dbAdmin.collection('toolStates').doc(stateId), statePayload, { merge: true });
      }

      // Submission record (if applicable)
      if (placementContext && action.startsWith('submit')) {
        const submissionRecord = {
          userId: user.uid,
          actionName: action,
          elementId: elementId || null,
          payload: data || {},
          response: result.data || {},
          metadata: {},
          submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        batch.set(
          placementContext.ref.collection('responses').doc(user.uid),
          submissionRecord,
          { merge: true }
        );

        batch.set(
          placementContext.ref,
          {
            responseCount: admin.firestore.FieldValue.increment(1),
            lastResponseAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      // Commit all writes atomically
      try {
        await batch.commit();
      } catch (batchError) {
        logger.error(
          'Failed to save tool state atomically',
          { error: batchError instanceof Error ? batchError.message : String(batchError) }
        );
        // Return error to indicate state wasn't saved - client should retry
        return {
          success: false,
          error: 'Failed to save state. Please try again.',
          data: result.data, // Still return the action result data
        };
      }
    }

    return result;
  } catch (error) {
    logger.error(
      `Error in tool execution at /api/tools/execute`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return {
      success: false,
      error: 'Tool execution failed'
    };
  }
}

// Helper function to generate feed content
async function generateFeedContent(deployment: DeploymentData, tool: ToolData, userId: string, feedContent: ToolExecutionResult['feedContent']) {
  try {
    if (deployment.deployedTo === 'space' && deployment.settings?.collectAnalytics && feedContent) {
      await dbAdmin.collection('posts').add({
        authorId: userId,
        spaceId: deployment.targetId,
        campusId: CURRENT_CAMPUS_ID,
        type: 'tool_generated',
        toolId: deployment.toolId,
        content: feedContent.content,
        metadata: {
          ...feedContent.metadata,
          deploymentId: deployment.id,
          generatedBy: 'tool_execution'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'published',
        engagement: { likes: 0, comments: 0, shares: 0 }
      });
    }
  } catch (error) {
    logger.error(
      `Error generating feed content at /api/tools/execute`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

// Helper function to process notifications
async function processNotifications(deployment: DeploymentData, notifications: ToolExecutionResult['notifications']) {
  try {
    if (!notifications) return;
    for (const notification of notifications) {
      await dbAdmin.collection('notifications').add({
        type: notification.type,
        message: notification.message,
        recipients: notification.recipients || [],
        deploymentId: deployment.id,
        toolId: deployment.toolId,
        spaceId: deployment.deployedTo === 'space' ? deployment.targetId : undefined,
        campusId: CURRENT_CAMPUS_ID,
        createdAt: new Date().toISOString(),
        read: false
      });
    }
  } catch (error) {
    logger.error(
      `Error processing notifications at /api/tools/execute`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Fetch space context for HiveLab tool execution
 *
 * This provides space data (events, members, space info) to tools that need it.
 * Used by elements like event-picker, member-selector, space-events, etc.
 *
 * @param spaceId - The space ID
 * @param userId - The user executing the tool (for privacy filtering)
 * @returns Space context with events, members, and space info
 */
async function fetchSpaceContext(spaceId: string, userId: string): Promise<Record<string, unknown>> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Fetch space, events, and members in parallel
    const [spaceDoc, eventsSnapshot, membersSnapshot] = await Promise.all([
      // Space info
      dbAdmin.collection('spaces').doc(spaceId).get(),

      // Upcoming and recent events (limited to 20)
      dbAdmin.collection('events')
        .where('spaceId', '==', spaceId)
        .where('campusId', '==', CURRENT_CAMPUS_ID)
        .where('startDate', '>=', thirtyDaysAgo.toISOString())
        .where('startDate', '<=', sixtyDaysFromNow.toISOString())
        .orderBy('startDate', 'asc')
        .limit(20)
        .get(),

      // Active members (limited to 50)
      dbAdmin.collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('campusId', '==', CURRENT_CAMPUS_ID)
        .where('isActive', '==', true)
        .limit(50)
        .get(),
    ]);

    // Process space info
    const spaceData = spaceDoc.exists ? spaceDoc.data() : {};

    // Process events with proper typing
    interface EventData {
      id: string;
      startDate?: string;
      [key: string]: unknown;
    }
    const events: EventData[] = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Separate upcoming vs past events
    const upcomingEvents = events.filter(e => e.startDate && new Date(e.startDate) >= now);
    const recentEvents = events.filter(e => e.startDate && new Date(e.startDate) < now);

    // Process members (basic info only for privacy)
    const memberIds = membersSnapshot.docs.map(doc => doc.data().userId);

    // Fetch user profiles for members
    const memberProfiles: Record<string, unknown>[] = [];
    if (memberIds.length > 0) {
      // Batch fetch user profiles (Firestore limits to 10 per 'in' query)
      const batches = [];
      for (let i = 0; i < memberIds.length; i += 10) {
        const batch = memberIds.slice(i, i + 10);
        batches.push(
          dbAdmin.collection('users')
            .where(admin.firestore.FieldPath.documentId(), 'in', batch)
            .get()
        );
      }

      const profileSnapshots = await Promise.all(batches);
      for (const snapshot of profileSnapshots) {
        for (const doc of snapshot.docs) {
          const userData = doc.data();
          // Only include basic public info
          memberProfiles.push({
            id: doc.id,
            displayName: userData.displayName || userData.fullName || 'Anonymous',
            avatarUrl: userData.avatarUrl || null,
            role: membersSnapshot.docs.find(m => m.data().userId === doc.id)?.data()?.role || 'member',
          });
        }
      }
    }

    return {
      space: {
        id: spaceId,
        name: spaceData?.name || 'Unknown Space',
        description: spaceData?.description || '',
        category: spaceData?.category || 'student_org',
        memberCount: spaceData?.metrics?.memberCount || memberProfiles.length,
      },
      events: {
        upcoming: upcomingEvents,
        recent: recentEvents,
        total: events.length,
      },
      members: {
        list: memberProfiles,
        total: memberProfiles.length,
        currentUserIsMember: memberIds.includes(userId),
      },
      // Timestamps for cache invalidation
      fetchedAt: now.toISOString(),
    };
  } catch (error) {
    logger.error('Error fetching space context for tool execution', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      userId,
    });

    // Return minimal context on error
    return {
      space: { id: spaceId },
      events: { upcoming: [], recent: [], total: 0 },
      members: { list: [], total: 0, currentUserIsMember: false },
      fetchedAt: new Date().toISOString(),
      error: 'Failed to fetch complete space context',
    };
  }
}

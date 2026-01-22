// Use admin SDK methods since we're in an API route
import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { logger } from "@/lib/logger";
import { getPlacementFromDeploymentDoc } from '@/lib/tool-placement';
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { z } from "zod";
import {
  processActionConnections,
  type ToolComposition,
} from '@/lib/tool-connection-engine';
import { rateLimit } from '@/lib/rate-limit-simple';
import { verifyRequestAppCheck } from '@/lib/app-check-server';
import { shardedCounterService } from '@/lib/services/sharded-counter.service';
import { extractedCollectionService } from '@/lib/services/extracted-collection.service';
import { toolStateBroadcaster } from '@/lib/services/tool-state-broadcaster.service';
import type {
  ToolSharedState,
  ToolSharedEntity,
  ToolSharedStateUpdate,
  ToolUserStateUpdate,
  ToolCapabilities,
  ToolBudgets,
  BudgetUsage,
} from '@hive/core';
import {
  hasCapability,
  validateActionCapabilities,
  checkBudget,
  CAPABILITY_PRESETS,
  DEFAULT_BUDGETS,
} from '@hive/core';

// Feature flags for Phase 1 Scaling Architecture (enable after migration)
const USE_SHARDED_COUNTERS = process.env.USE_SHARDED_COUNTERS === 'true';
const USE_EXTRACTED_COLLECTIONS = process.env.USE_EXTRACTED_COLLECTIONS === 'true';
// P0: Enable RTDB broadcast by default for real-time updates (can disable with env var)
const USE_RTDB_BROADCAST = process.env.USE_RTDB_BROADCAST !== 'false';

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
  /** @deprecated Use sharedState and userState instead */
  state: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  spaceContext?: Record<string, unknown>;

  // ============================================================================
  // Phase 1: Shared State Architecture
  // ============================================================================

  /**
   * Shared state visible to all users (aggregate data)
   * Contains: counters, collections, timeline, computed values
   */
  sharedState: ToolSharedState;

  /**
   * Per-user state (personal data)
   * Contains: selections, participation, personal, ui
   */
  userState: Record<string, unknown>;
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
  /** @deprecated Use sharedStateUpdate for aggregate data, userStateUpdate for personal data */
  state?: Record<string, unknown>;
  outputs?: Record<string, unknown>; // Output values for cascade connections
  notifications?: Array<{
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    recipients?: string[];
  }>;

  // ============================================================================
  // Phase 1: Shared State Architecture
  // ============================================================================

  /**
   * Updates to apply to shared state (visible to all users)
   * Used for aggregate actions like vote, rsvp, update_score
   */
  sharedStateUpdate?: ToolSharedStateUpdate;

  /**
   * Updates to apply to user state (per-user, personal)
   * Used for personal actions like toggle, select, save_draft
   */
  userStateUpdate?: ToolUserStateUpdate;
}

// Action handler registry
type ActionHandler = (context: ActionContext) => Promise<ActionResult>;

const actionHandlers: Record<string, ActionHandler> = {
  // Default handlers for common actions
  async submit(context: ActionContext): Promise<ActionResult> {
    const { elementId, data, userId, sharedState } = context;
    const instanceId = elementId || 'form';
    const formData = data.formData as Record<string, unknown> || data;
    const submissionsKey = `${instanceId}:submissions`;
    const submissionId = `${userId}_${Date.now()}`;

    // Get current submission count
    const currentCount = sharedState.counters[`${instanceId}:submissionCount`] || 0;

    return {
      success: true,
      data: {
        action: 'submit',
        elementId: context.elementId,
        submissionId,
        message: 'Form submitted successfully',
      },
      // Update shared state (visible to all users)
      sharedStateUpdate: {
        // Increment submission counter
        counterDeltas: {
          [`${instanceId}:submissionCount`]: 1,
        },
        // Store the submission in a collection
        collectionUpserts: {
          [submissionsKey]: {
            [submissionId]: {
              id: submissionId,
              createdAt: new Date().toISOString(),
              createdBy: userId,
              data: {
                ...formData,
                submittedAt: data.timestamp || new Date().toISOString(),
                submissionNumber: currentCount + 1,
              },
            },
          },
        },
        // Add to timeline
        timelineAppend: [
          {
            type: 'form_submission',
            userId,
            elementInstanceId: instanceId,
            action: 'submit',
            data: { submissionId, formFields: Object.keys(formData) },
          },
        ],
      },
      // Update user state (personal tracking)
      userStateUpdate: {
        participation: { [`${instanceId}:hasSubmitted`]: true },
        selections: { [`${instanceId}:lastSubmissionId`]: submissionId },
      },
    };
  },

  async vote(context: ActionContext): Promise<ActionResult> {
    const { data, elementId, userId, sharedState } = context;
    const optionId = data.optionId as string;
    const instanceId = elementId || 'poll';

    // Check if user already voted (prevent double voting)
    const voterKey = `${instanceId}:voters`;
    const existingVoters = sharedState.collections[voterKey] || {};
    if (existingVoters[userId]) {
      return {
        success: false,
        error: 'You have already voted',
      };
    }

    // Build counter key: "{instanceId}:{optionId}"
    const counterKey = `${instanceId}:${optionId}`;

    return {
      success: true,
      data: {
        action: 'vote',
        optionId,
        message: 'Vote recorded',
      },
      // Update shared state (visible to all users)
      sharedStateUpdate: {
        // Increment the vote counter for this option
        counterDeltas: {
          [counterKey]: 1,
          [`${instanceId}:total`]: 1, // Also track total votes
        },
        // Track who voted (for preventing double votes)
        collectionUpserts: {
          [voterKey]: {
            [userId]: {
              id: userId,
              createdAt: new Date().toISOString(),
              createdBy: userId,
              data: { optionId, votedAt: new Date().toISOString() },
            },
          },
        },
        // Add to timeline
        timelineAppend: [
          {
            type: 'vote',
            userId,
            elementInstanceId: instanceId,
            action: 'vote',
            data: { optionId },
          },
        ],
      },
      // Update user state (personal tracking)
      userStateUpdate: {
        participation: { [`${instanceId}:hasVoted`]: true },
        selections: { [`${instanceId}:selectedOption`]: optionId },
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
    const { elementId, data, userId, sharedState, spaceContext } = context;
    const instanceId = elementId || 'event';
    const status = (data.status as string) || 'going';
    const attendeesKey = `${instanceId}:attendees`;

    // Get existing RSVP status to adjust counters correctly
    const existingRsvps = sharedState.collections[attendeesKey] || {};
    const previousRsvp = existingRsvps[userId];
    const previousStatus = previousRsvp?.data?.status as string | undefined;

    // Build counter deltas based on status change
    const counterDeltas: Record<string, number> = {};

    // Decrement old status counter if user had previous RSVP
    if (previousStatus && previousStatus !== status) {
      counterDeltas[`${instanceId}:${previousStatus}`] = -1;
    }

    // Increment new status counter
    if (!previousStatus || previousStatus !== status) {
      counterDeltas[`${instanceId}:${status}`] = 1;
    }

    // Track total unique RSVPs if this is a new RSVP
    if (!previousStatus) {
      counterDeltas[`${instanceId}:total`] = 1;
    }

    // Get user display name from space context if available
    const userDisplayName =
      (spaceContext?.members as { list?: Array<{ id: string; displayName?: string }> })?.list
        ?.find(m => m.id === userId)?.displayName || 'Anonymous';

    return {
      success: true,
      data: {
        action: 'rsvp',
        status,
        previousStatus,
        message: `RSVP updated to ${status}`,
      },
      // Update shared state
      sharedStateUpdate: {
        counterDeltas,
        // Upsert the RSVP entry
        collectionUpserts: {
          [attendeesKey]: {
            [userId]: {
              id: userId,
              createdAt: previousRsvp?.createdAt || new Date().toISOString(),
              createdBy: userId,
              updatedAt: new Date().toISOString(),
              data: {
                status,
                displayName: userDisplayName,
                rsvpAt: new Date().toISOString(),
              },
            },
          },
        },
        // Add to timeline
        timelineAppend: [
          {
            type: 'rsvp',
            userId,
            elementInstanceId: instanceId,
            action: previousStatus ? 'rsvp_updated' : 'rsvp_created',
            data: { status, previousStatus },
          },
        ],
      },
      // Update user state
      userStateUpdate: {
        participation: { [`${instanceId}:hasRsvped`]: true },
        selections: { [`${instanceId}:rsvpStatus`]: status },
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
    const { elementId, data, userId, sharedState, spaceContext } = context;
    const instanceId = elementId || 'leaderboard';
    const targetUserId = (data.userId as string) || userId;
    const delta = (data.delta as number) || 0;
    const absoluteScore = data.score as number | undefined;

    // Key format: "{instanceId}:score:{userId}"
    const scoreKey = `${instanceId}:score:${targetUserId}`;
    const currentScore = sharedState.counters[scoreKey] || 0;

    // Determine the score change
    let newScore: number;
    let scoreDelta: number;

    if (absoluteScore !== undefined) {
      // Absolute score set
      newScore = Math.max(0, absoluteScore);
      scoreDelta = newScore - currentScore;
    } else {
      // Delta-based update
      scoreDelta = delta;
      newScore = Math.max(0, currentScore + delta);
    }

    // Get user display name from space context if available
    const userDisplayName =
      (spaceContext?.members as { list?: Array<{ id: string; displayName?: string }> })?.list
        ?.find(m => m.id === targetUserId)?.displayName || 'Anonymous';

    // Update leaderboard entries collection for quick lookup
    const entriesKey = `${instanceId}:entries`;

    return {
      success: true,
      data: {
        action: 'update_score',
        targetUserId,
        previousScore: currentScore,
        newScore,
        delta: scoreDelta,
      },
      sharedStateUpdate: {
        // Update the score counter atomically
        counterDeltas: {
          [scoreKey]: scoreDelta,
        },
        // Upsert the leaderboard entry for this user
        collectionUpserts: {
          [entriesKey]: {
            [targetUserId]: {
              id: targetUserId,
              createdAt: new Date().toISOString(),
              createdBy: userId,
              updatedAt: new Date().toISOString(),
              data: {
                displayName: userDisplayName,
                score: newScore,
                lastUpdated: new Date().toISOString(),
              },
            },
          },
        },
        // Add to timeline
        timelineAppend: [
          {
            type: 'score_update',
            userId,
            elementInstanceId: instanceId,
            action: 'update_score',
            data: { targetUserId, previousScore: currentScore, newScore, delta: scoreDelta },
          },
        ],
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
  /** @deprecated Use sharedStateUpdate and userStateUpdate instead */
  state?: Record<string, unknown>;
  notifications?: Array<{
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    recipients?: string[];
  }>;

  // ============================================================================
  // Phase 1: Shared State Architecture
  // ============================================================================

  /**
   * Updates to apply to shared state (visible to all users)
   * Used for aggregate actions like vote, rsvp, update_score
   */
  sharedStateUpdate?: ToolSharedStateUpdate;

  /**
   * Updates to apply to user state (per-user, personal)
   * Used for personal actions like toggle, select, save_draft
   */
  userStateUpdate?: ToolUserStateUpdate;
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
      const campusId = getCampusId(request as AuthenticatedRequest);

      // SECURITY: Verify App Check token (logs violations, doesn't block yet for gradual rollout)
      const appCheckResult = await verifyRequestAppCheck(request as Request);
      if (!appCheckResult.valid) {
        // Log App Check failures for monitoring (gradual rollout - don't block yet)
        logger.warn('App Check verification failed for tool execution', {
          userId,
          error: appCheckResult.error,
          url: (request as Request).url,
        });
        // TODO: Once App Check is fully deployed, uncomment to enforce:
        // return NextResponse.json(
        //   { error: 'App Check verification failed', code: 'APP_CHECK_FAILED' },
        //   { status: 401 }
        // );
      }

      // SECURITY: Rate limit tool executions per user
      const rateLimitResult = toolExecuteRateLimiter.check(userId);
      if (!rateLimitResult.success) {
        logger.warn('Tool execution rate limited', {
          userId,
          remaining: rateLimitResult.remaining,
          retryAfter: rateLimitResult.retryAfter
        });
        return NextResponse.json(
          { error: 'Too many requests. Please slow down.', code: 'RATE_LIMITED' },
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
    if ((deployment as Record<string, unknown>)?.campusId && (deployment as Record<string, unknown>).campusId !== campusId) {
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

    // Check deployment status (supports governance statuses)
    const deploymentStatus = placementData?.status || deployment.status;
    if (deploymentStatus === 'disabled') {
        return respond.error("This tool has been disabled", "FORBIDDEN", { status: 403 });
    }
    if (deploymentStatus === 'quarantined') {
        return respond.error("This tool is under review", "FORBIDDEN", { status: 403 });
    }
    if (deploymentStatus === 'paused') {
        return respond.error("This tool is currently paused", "FORBIDDEN", { status: 403 });
    }
    if (deploymentStatus !== 'active' && deploymentStatus !== 'experimental') {
        return respond.error("Tool deployment is not active", "FORBIDDEN", { status: 403 });
    }

    // Check user permissions
    const permissionCheck = await canUserExecuteTool(userId, deployment, campusId, placementData);
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
    if ((tool as Record<string, unknown>)?.campusId && (tool as Record<string, unknown>).campusId !== campusId) {
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
      placementContext,
      campusId,
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
      campusId: campusId,
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
        campusId: campusId,
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

    // ===========================================================================
    // Capability & Budget Enforcement (Hackability Governance Layer)
    // ===========================================================================
    const capabilities = deployment.capabilities || CAPABILITY_PRESETS.SAFE;
    // Ensure budgets has required properties (empty object {} is truthy but invalid)
    const rawBudgets = deployment.budgets;
    const isValidBudgets = rawBudgets &&
      typeof rawBudgets === 'object' &&
      'notificationsPerDay' in rawBudgets;
    const budgets: ToolBudgets = isValidBudgets
      ? (rawBudgets as ToolBudgets)
      : DEFAULT_BUDGETS.safe;

    // Load today's budget usage
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const budgetDocId = `${deployment.id}_${today}`;
    const budgetRef = dbAdmin.collection('toolBudgetUsage').doc(budgetDocId);

    // Generate feed content if requested and successful (with capability check)
    if (executionResult.success && executionResult.feedContent) {
      // Check capability
      if (!hasCapability(capabilities, 'create_posts')) {
        logger.warn('Tool tried to create post without capability', {
          deploymentId: deployment.id,
          lane: deployment.capabilityLane || 'safe',
        });
        // Silently skip - don't fail the execution
      } else {
        // Check budget
        const budgetDoc = await budgetRef.get();
        const usage: BudgetUsage = budgetDoc.exists
          ? (budgetDoc.data() as BudgetUsage)
          : { deploymentId: deployment.id, date: today, notificationsSent: 0, postsCreated: 0, automationsTriggered: 0, userExecutions: {} };
        const budgetCheck = checkBudget(budgets, usage, { creatingPost: true });

        if (!budgetCheck.allowed) {
          logger.warn('Tool exceeded post budget', {
            deploymentId: deployment.id,
            reason: budgetCheck.reason,
          });
          // Silently skip - don't fail the execution
        } else {
          await generateFeedContent(deployment, tool, userId, executionResult.feedContent);
          // Increment budget usage
          await budgetRef.set({
            deploymentId: deployment.id,
            date: today,
            postsCreated: admin.firestore.FieldValue.increment(1),
          }, { merge: true });
        }
      }
    }

    // Send notifications if any (with capability check)
    if (executionResult.notifications && executionResult.notifications.length > 0) {
      // Check capability
      if (!hasCapability(capabilities, 'send_notifications')) {
        logger.warn('Tool tried to send notification without capability', {
          deploymentId: deployment.id,
          lane: deployment.capabilityLane || 'safe',
        });
        // Silently skip - don't fail the execution
      } else {
        // Check budget for each notification
        const budgetDoc = await budgetRef.get();
        const usage: BudgetUsage = budgetDoc.exists
          ? (budgetDoc.data() as BudgetUsage)
          : { deploymentId: deployment.id, date: today, notificationsSent: 0, postsCreated: 0, automationsTriggered: 0, userExecutions: {} };
        const budgetCheck = checkBudget(budgets, usage, { sendingNotification: true });

        if (!budgetCheck.allowed) {
          logger.warn('Tool exceeded notification budget', {
            deploymentId: deployment.id,
            reason: budgetCheck.reason,
            count: executionResult.notifications.length,
          });
          // Silently skip - don't fail the execution
        } else {
          await processNotifications(deployment, executionResult.notifications);
          // Increment budget usage
          await budgetRef.set({
            deploymentId: deployment.id,
            date: today,
            notificationsSent: admin.firestore.FieldValue.increment(executionResult.notifications.length),
          }, { merge: true });
        }
      }
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
  campusId: string,
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
        .where('campusId', '==', campusId);
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
/**
 * Create empty/default shared state structure
 */
function createEmptySharedState(): ToolSharedState {
  return {
    counters: {},
    collections: {},
    timeline: [],
    computed: {},
    version: 0,
    lastModified: new Date().toISOString(),
  };
}

async function executeToolAction(params: {
  deployment: DeploymentData;
  tool: ToolData;
  user: { uid: string };
  action: string;
  elementId?: string;
  data: Record<string, unknown>;
  context: Record<string, unknown>;
  placementContext?: Awaited<ReturnType<typeof getPlacementFromDeploymentDoc>> | null;
  campusId: string;
}): Promise<ToolExecutionResult> {
  const { deployment, tool, user, action, elementId, data, placementContext, campusId } = params;

  try {
    // =========================================================================
    // Load State: Both shared (aggregate) and user (personal) state
    // =========================================================================

    const userStateId = `${deployment.id}_${user.uid}`;
    let currentUserState: Record<string, unknown> = {};
    let currentSharedState: ToolSharedState = createEmptySharedState();

    // Reference to the deployment doc for shared state
    const deploymentRef = dbAdmin.collection('deployedTools').doc(deployment.id);
    const sharedStateRef = deploymentRef.collection('sharedState').doc('current');

    // Load shared state (aggregate data visible to all users)
    const sharedStateDoc = await sharedStateRef.get();
    if (sharedStateDoc.exists) {
      const data = sharedStateDoc.data();
      currentSharedState = {
        counters: (data?.counters as Record<string, number>) || {},
        collections: (data?.collections as Record<string, Record<string, ToolSharedEntity>>) || {},
        timeline: (data?.timeline as ToolSharedState['timeline']) || [],
        computed: (data?.computed as Record<string, unknown>) || {},
        version: (data?.version as number) || 0,
        lastModified: (data?.lastModified as string) || new Date().toISOString(),
      };
    }

    // Load user state (per-user personal data)
    let placementStateRef: admin.firestore.DocumentReference<admin.firestore.DocumentData> | null = null;
    if (placementContext) {
      placementStateRef = placementContext.ref.collection('state').doc(user.uid);
      const stateSnapshot = await placementStateRef.get();
      if (stateSnapshot.exists) {
        currentUserState = (stateSnapshot.data()?.state as Record<string, unknown>) || {};
      }
    } else {
      const stateDoc = await dbAdmin.collection('toolStates').doc(userStateId).get();
      currentUserState = stateDoc.exists ? (stateDoc.data() as { state?: Record<string, unknown> })?.state || {} : {};
    }

    // Legacy: Keep currentState for backward compatibility
    const currentState = currentUserState;

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
      state: currentState, // Legacy - deprecated
      metadata: params.context,
      spaceContext, // Inject space data (events, members, etc.)
      // Phase 1: Shared State Architecture
      sharedState: currentSharedState,
      userState: currentUserState,
    };

    // Execute action through the extensible handler registry
    let result = await executeAction(action, actionContext) as ToolExecutionResult;

    // Process connection cascades if action was successful and tool has connections
    if (result.success && result.state && targetElement) {
      const toolConnections = (tool as unknown as { connections?: Array<unknown> }).connections || [];

      // P0: Log cascade execution for debugging
      logger.info('[execute] Checking cascade connections', {
        toolId: tool.id,
        action,
        hasConnections: toolConnections.length > 0,
        connectionCount: toolConnections.length,
      });

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

        // P0: Log cascade result
        logger.info('[execute] Cascade execution completed', {
          toolId: tool.id,
          action,
          executedElements: cascadeResult.executedElements?.length || 0,
          executedElementIds: cascadeResult.executedElements || [],
        });

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

    // =========================================================================
    // Save State: Handle both shared and user state updates
    // =========================================================================

    const hasSharedStateUpdate = result.sharedStateUpdate &&
      (result.sharedStateUpdate.counterDeltas ||
       result.sharedStateUpdate.collectionUpserts ||
       result.sharedStateUpdate.collectionDeletes ||
       result.sharedStateUpdate.timelineAppend ||
       result.sharedStateUpdate.computedUpdates);

    const hasUserStateUpdate = result.userStateUpdate || result.state;
    const hasSubmission = placementContext && action.startsWith('submit');

    if (result.success && (hasSharedStateUpdate || hasUserStateUpdate || hasSubmission)) {
      try {
        // =====================================================================
        // Apply Shared State Update
        // Phase 1 Scaling: Uses sharded counters for high-throughput scenarios
        // =====================================================================
        if (hasSharedStateUpdate && result.sharedStateUpdate) {
          // Handle counter deltas
          if (result.sharedStateUpdate.counterDeltas) {
            const counterDeltas = result.sharedStateUpdate.counterDeltas;

            if (USE_SHARDED_COUNTERS) {
              // New path: Use sharded counters for 200+ writes/sec capacity
              const deltas = Object.entries(counterDeltas).map(([key, delta]) => ({
                counterKey: key,
                delta,
              }));

              if (deltas.length > 0) {
                await shardedCounterService.incrementBatch(deployment.id, deltas);
              }
            } else {
              // Legacy path: Use transaction (limited to 25 writes/sec)
              await dbAdmin.runTransaction(async (transaction) => {
                const sharedDoc = await transaction.get(sharedStateRef);
                const existingData = sharedDoc.exists ? sharedDoc.data() : {};
                const existingCounters = (existingData?.counters as Record<string, number>) || {};

                const updatedCounters = { ...existingCounters };
                for (const [key, delta] of Object.entries(counterDeltas)) {
                  updatedCounters[key] = (updatedCounters[key] || 0) + delta;
                }

                transaction.set(sharedStateRef, {
                  ...existingData,
                  counters: updatedCounters,
                  version: ((existingData?.version as number) || 0) + 1,
                  lastModified: new Date().toISOString(),
                  campusId: campusId,
                }, { merge: true });
              });
            }
          }

          // Handle collections, timeline, and computed
          const hasCollectionUpdates =
            result.sharedStateUpdate.collectionUpserts ||
            result.sharedStateUpdate.collectionDeletes;
          const hasTimelineOrComputedUpdates =
            result.sharedStateUpdate.timelineAppend ||
            result.sharedStateUpdate.computedUpdates;

          // Handle collection updates (extracted or inline based on feature flag)
          if (hasCollectionUpdates) {
            if (USE_EXTRACTED_COLLECTIONS) {
              // New path: Use subcollections for unlimited scale
              const upserts: Array<{ collectionKey: string; entityId: string; entity: ToolSharedEntity }> = [];
              const deletes: Array<{ collectionKey: string; entityId: string }> = [];

              // Collect upserts
              if (result.sharedStateUpdate.collectionUpserts) {
                for (const [collectionKey, entities] of Object.entries(result.sharedStateUpdate.collectionUpserts)) {
                  for (const [entityId, entity] of Object.entries(entities)) {
                    upserts.push({ collectionKey, entityId, entity });
                  }
                }
              }

              // Collect deletes
              if (result.sharedStateUpdate.collectionDeletes) {
                for (const [collectionKey, idsToDelete] of Object.entries(result.sharedStateUpdate.collectionDeletes)) {
                  for (const entityId of idsToDelete) {
                    deletes.push({ collectionKey, entityId });
                  }
                }
              }

              // Execute in parallel
              await Promise.all([
                upserts.length > 0 ? extractedCollectionService.upsertBatch(deployment.id, upserts) : Promise.resolve(),
                deletes.length > 0 ? extractedCollectionService.deleteBatch(deployment.id, deletes) : Promise.resolve(),
              ]);
            } else {
              // Legacy path: Update inline collections in main document
              const sharedDoc = await sharedStateRef.get();
              const existingData = sharedDoc.exists ? sharedDoc.data() : {};
              const existingCollections = (existingData?.collections as Record<string, Record<string, ToolSharedEntity>>) || {};
              const existingVersion = (existingData?.version as number) || 0;

              const updatedCollections = { ...existingCollections };

              // Apply upserts
              if (result.sharedStateUpdate.collectionUpserts) {
                for (const [collectionKey, entities] of Object.entries(result.sharedStateUpdate.collectionUpserts)) {
                  updatedCollections[collectionKey] = {
                    ...updatedCollections[collectionKey],
                    ...entities,
                  };
                }
              }

              // Apply deletes
              if (result.sharedStateUpdate.collectionDeletes) {
                for (const [collectionKey, idsToDelete] of Object.entries(result.sharedStateUpdate.collectionDeletes)) {
                  if (updatedCollections[collectionKey]) {
                    for (const id of idsToDelete) {
                      delete updatedCollections[collectionKey][id];
                    }
                  }
                }
              }

              await sharedStateRef.set({
                collections: updatedCollections,
                version: existingVersion + 1,
                lastModified: new Date().toISOString(),
                campusId: campusId,
              }, { merge: true });
            }
          }

          // Handle timeline and computed updates (always in main document)
          if (hasTimelineOrComputedUpdates) {
            const sharedDoc = await sharedStateRef.get();
            const existingData = sharedDoc.exists ? sharedDoc.data() : {};
            const existingTimeline = (existingData?.timeline as ToolSharedState['timeline']) || [];
            const existingComputed = (existingData?.computed as Record<string, unknown>) || {};
            const existingVersion = (existingData?.version as number) || 0;

            // Append to timeline (limit to last 100 events)
            let updatedTimeline = [...existingTimeline];
            if (result.sharedStateUpdate.timelineAppend) {
              const newEvents = result.sharedStateUpdate.timelineAppend.map((event) => ({
                ...event,
                id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                timestamp: new Date().toISOString(),
              }));
              updatedTimeline = [...updatedTimeline, ...newEvents].slice(-100);
            }

            // Apply computed updates
            const updatedComputed = {
              ...existingComputed,
              ...(result.sharedStateUpdate.computedUpdates || {}),
            };

            // Write updated shared state (merge to preserve other fields)
            await sharedStateRef.set({
              timeline: updatedTimeline,
              computed: updatedComputed,
              version: existingVersion + 1,
              lastModified: new Date().toISOString(),
              campusId: campusId,
              // Only include counters/collections if NOT using extracted services
              ...(USE_SHARDED_COUNTERS ? {} : { counters: existingData?.counters || {} }),
              ...(USE_EXTRACTED_COLLECTIONS ? {} : { collections: existingData?.collections || {} }),
            }, { merge: true });
          }
        }

        // =====================================================================
        // Apply User State Update (using batch for efficiency)
        // =====================================================================
        if (hasUserStateUpdate || hasSubmission) {
          const batch = dbAdmin.batch();

          // Merge user state updates
          let finalUserState = { ...currentUserState };

          // Apply userStateUpdate if present
          if (result.userStateUpdate) {
            if (result.userStateUpdate.selections) {
              finalUserState = {
                ...finalUserState,
                selections: {
                  ...((finalUserState.selections as Record<string, unknown>) || {}),
                  ...result.userStateUpdate.selections,
                },
              };
            }
            if (result.userStateUpdate.participation) {
              finalUserState = {
                ...finalUserState,
                participation: {
                  ...((finalUserState.participation as Record<string, boolean>) || {}),
                  ...result.userStateUpdate.participation,
                },
              };
            }
            if (result.userStateUpdate.personal) {
              finalUserState = {
                ...finalUserState,
                personal: {
                  ...((finalUserState.personal as Record<string, unknown>) || {}),
                  ...result.userStateUpdate.personal,
                },
              };
            }
            if (result.userStateUpdate.ui) {
              finalUserState = {
                ...finalUserState,
                ui: {
                  ...((finalUserState.ui as Record<string, unknown>) || {}),
                  ...result.userStateUpdate.ui,
                },
              };
            }
          }

          // Apply legacy state if present (backward compatibility)
          if (result.state) {
            finalUserState = { ...finalUserState, ...result.state };
          }

          // Save user state
          const statePayload = {
            deploymentId: deployment.id,
            toolId: tool.id || deployment.toolId,
            userId: user.uid,
            state: finalUserState,
            updatedAt: new Date().toISOString(),
            campusId: campusId,
          };

          if (placementStateRef) {
            batch.set(placementStateRef, statePayload, { merge: true });
          }

          batch.set(dbAdmin.collection('toolStates').doc(userStateId), statePayload, { merge: true });

          // Submission record (if applicable)
          if (hasSubmission && placementContext) {
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

          await batch.commit();
        }

        // =====================================================================
        // Broadcast State to RTDB (Phase S3: Real-Time Updates)
        // =====================================================================
        if (USE_RTDB_BROADCAST && hasSharedStateUpdate && result.sharedStateUpdate) {
          try {
            // Broadcast counter updates for real-time poll/vote displays
            if (result.sharedStateUpdate.counterDeltas) {
              // Get updated counter values (aggregate from shards if using sharding)
              const counterKeys = Object.keys(result.sharedStateUpdate.counterDeltas);
              let updatedCounters: Record<string, number>;

              if (USE_SHARDED_COUNTERS) {
                updatedCounters = await shardedCounterService.getCountBatch(deployment.id, counterKeys);
              } else {
                // Read from Firestore
                const sharedDoc = await sharedStateRef.get();
                const allCounters = (sharedDoc.data()?.counters as Record<string, number>) || {};
                updatedCounters = {};
                for (const key of counterKeys) {
                  updatedCounters[key] = allCounters[key] || 0;
                }
              }

              // Broadcast each updated counter
              for (const [key, value] of Object.entries(updatedCounters)) {
                await toolStateBroadcaster.broadcastCounterUpdate(deployment.id, key, value);
              }
            }

            // Broadcast timeline events for activity feeds
            if (result.sharedStateUpdate.timelineAppend) {
              for (const event of result.sharedStateUpdate.timelineAppend) {
                await toolStateBroadcaster.broadcastTimelineEvent(deployment.id, {
                  id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                  type: event.type,
                  userId: event.userId,
                  action: event.action,
                  timestamp: new Date().toISOString(),
                });
              }
            }

            // Broadcast collection count updates for RSVP displays
            if (result.sharedStateUpdate.collectionUpserts || result.sharedStateUpdate.collectionDeletes) {
              const affectedCollections = new Set<string>();
              if (result.sharedStateUpdate.collectionUpserts) {
                Object.keys(result.sharedStateUpdate.collectionUpserts).forEach(k => affectedCollections.add(k));
              }
              if (result.sharedStateUpdate.collectionDeletes) {
                Object.keys(result.sharedStateUpdate.collectionDeletes).forEach(k => affectedCollections.add(k));
              }

              for (const collectionKey of affectedCollections) {
                let count: number;
                if (USE_EXTRACTED_COLLECTIONS) {
                  count = await extractedCollectionService.countEntities(deployment.id, collectionKey);
                } else {
                  const sharedDoc = await sharedStateRef.get();
                  const collections = (sharedDoc.data()?.collections as Record<string, Record<string, unknown>>) || {};
                  count = Object.keys(collections[collectionKey] || {}).length;
                }
                await toolStateBroadcaster.broadcastCollectionCount(deployment.id, collectionKey, count);
              }
            }
          } catch (broadcastError) {
            // Log but don't fail - RTDB broadcast is best-effort
            logger.warn('RTDB broadcast failed', {
              error: broadcastError instanceof Error ? broadcastError.message : String(broadcastError),
              deploymentId: deployment.id,
            });
          }
        }

      } catch (stateError) {
        logger.error(
          'Failed to save tool state',
          { error: stateError instanceof Error ? stateError.message : String(stateError) }
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
async function generateFeedContent(deployment: DeploymentData, tool: ToolData, userId: string, feedContent: ToolExecutionResult['feedContent'], campusId: string) {
  try {
    if (deployment.deployedTo === 'space' && deployment.settings?.collectAnalytics && feedContent) {
      await dbAdmin.collection('posts').add({
        authorId: userId,
        spaceId: deployment.targetId,
        campusId,
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
async function processNotifications(deployment: DeploymentData, notifications: ToolExecutionResult['notifications'], campusId: string) {
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
        campusId,
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
 * @param campusId - The campus ID for isolation
 * @returns Space context with events, members, and space info
 */
async function fetchSpaceContext(spaceId: string, userId: string, campusId: string): Promise<Record<string, unknown>> {
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
        .where('campusId', '==', campusId)
        .where('startDate', '>=', thirtyDaysAgo.toISOString())
        .where('startDate', '<=', sixtyDaysFromNow.toISOString())
        .orderBy('startDate', 'asc')
        .limit(20)
        .get(),

      // Active members (limited to 50)
      dbAdmin.collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('campusId', '==', campusId)
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

/**
 * On Event Cloud Function
 *
 * Sprint 4: Automations - Event Triggers
 *
 * Triggered when an event is written to a tool's events subcollection.
 * Processes event-triggered automations.
 *
 * Trigger: Firestore document create at deployedTools/{deploymentId}/events/{eventId}
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import type {
  ToolAutomation,
  ToolAutomationRun,
  ToolSharedState,
} from '../types';
import {
  evaluateAllConditions,
  canRunAutomation,
} from '../types';
import { executeAllActions, type ExecutionContext } from './action-executors';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// TYPES
// ============================================================================

interface ToolEvent {
  type: string;
  action: string;
  elementId: string | null;
  userId: string;
  timestamp: admin.firestore.Timestamp;
  processed: boolean;
  spaceId?: string | null;
  counterDeltas?: Record<string, number>;
  counterValues?: Record<string, number>;
  collectionKeys?: string[];
  data?: Record<string, unknown>;
  source?: {
    type: 'automation' | 'user';
    automationId?: string;
    deploymentId?: string;
  };
}

interface EventContext {
  deploymentId: string;
  eventId: string;
  event: ToolEvent;
  currentState: ToolSharedState | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get today's run count for an automation
 */
async function getRunsToday(
  deploymentId: string,
  automationId: string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const runsRef = db
    .collection('deployedTools')
    .doc(deploymentId)
    .collection('automationRuns')
    .where('automationId', '==', automationId)
    .where('timestamp', '>=', today.toISOString());

  const snapshot = await runsRef.count().get();
  return snapshot.data().count;
}

/**
 * Log an automation run
 */
async function logRun(
  deploymentId: string,
  run: ToolAutomationRun
): Promise<void> {
  await db
    .collection('deployedTools')
    .doc(deploymentId)
    .collection('automationRuns')
    .doc(run.id)
    .set(run);
}

/**
 * Update automation stats after run
 */
async function updateAutomationStats(
  deploymentId: string,
  automationId: string,
  success: boolean,
  currentRunCount: number,
  currentErrorCount: number
): Promise<void> {
  await db
    .collection('deployedTools')
    .doc(deploymentId)
    .collection('automations')
    .doc(automationId)
    .update({
      lastRun: new Date().toISOString(),
      runCount: currentRunCount + 1,
      errorCount: success ? currentErrorCount : currentErrorCount + 1,
    });
}

/**
 * Mark event as processed
 */
async function markEventProcessed(
  deploymentId: string,
  eventId: string
): Promise<void> {
  await db
    .collection('deployedTools')
    .doc(deploymentId)
    .collection('events')
    .doc(eventId)
    .update({
      processed: true,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Load current tool state
 */
async function loadToolState(deploymentId: string): Promise<ToolSharedState | null> {
  const stateRef = db
    .collection('deployedTools')
    .doc(deploymentId)
    .collection('sharedState')
    .doc('current');

  const stateDoc = await stateRef.get();

  if (!stateDoc.exists) {
    return null;
  }

  const data = stateDoc.data();
  return {
    counters: (data?.counters as Record<string, number>) || {},
    collections: (data?.collections as Record<string, Record<string, unknown>>) || {},
    timeline: (data?.timeline as ToolSharedState['timeline']) || [],
    computed: (data?.computed as Record<string, unknown>) || {},
    version: (data?.version as number) || 0,
    lastModified: (data?.lastModified as string) || new Date().toISOString(),
  };
}

/**
 * Check if an automation's event trigger matches the event
 */
function eventMatchesTrigger(
  automation: ToolAutomation,
  event: ToolEvent
): boolean {
  if (automation.trigger.type !== 'event') {
    return false;
  }

  const trigger = automation.trigger;

  // Match element ID if specified (null means any element)
  if (trigger.elementId && event.elementId && trigger.elementId !== event.elementId) {
    return false;
  }

  // Match event name/type
  // The trigger.event can match either event.type or event.action
  if (trigger.event !== event.type && trigger.event !== event.action) {
    return false;
  }

  return true;
}

/**
 * Execute actions for an automation
 */
async function executeActions(
  automation: ToolAutomation,
  context: EventContext
): Promise<{ success: boolean; error?: string; actionsExecuted?: string[] }> {
  logger.info('Executing automation actions', {
    automationId: automation.id,
    actions: automation.actions.map(a => a.type),
  });

  const execContext: ExecutionContext = {
    automationId: automation.id,
    deploymentId: context.deploymentId,
    state: context.currentState,
    triggerData: {
      triggerType: 'event',
      eventType: context.event.type,
      action: context.event.action,
      elementId: context.event.elementId,
      userId: context.event.userId,
      counterDeltas: context.event.counterDeltas,
      counterValues: context.event.counterValues,
    },
  };

  const result = await executeAllActions(automation.actions, execContext);

  return {
    success: result.success,
    error: result.results.find(r => !r.success)?.error,
    actionsExecuted: result.results.filter(r => r.success).map(r => r.actionType),
  };
}

/**
 * Process a single automation for an event
 */
async function processEventAutomation(
  automation: ToolAutomation,
  context: EventContext
): Promise<void> {
  // Check if event matches this automation's trigger
  if (!eventMatchesTrigger(automation, context.event)) {
    return;
  }

  const startTime = Date.now();
  let status: 'success' | 'skipped' | 'failed' = 'success';
  let error: string | undefined;
  let actionsExecuted: string[] = [];

  try {
    // Check rate limits
    const runsToday = await getRunsToday(context.deploymentId, automation.id);
    const canRun = canRunAutomation(automation, runsToday);

    if (!canRun.canRun) {
      status = 'skipped';
      error = canRun.reason;
    } else {
      // Evaluate conditions
      if (automation.conditions && automation.conditions.length > 0) {
        const conditionContext: Record<string, unknown> = {
          state: context.currentState || {},
          trigger: {
            type: 'event',
            eventType: context.event.type,
            action: context.event.action,
            elementId: context.event.elementId,
            userId: context.event.userId,
          },
          event: context.event,
        };

        const conditionEval = evaluateAllConditions(
          automation.conditions,
          conditionContext
        );

        if (!conditionEval.allMet) {
          status = 'skipped';
          error = 'Conditions not met';
        }
      }

      // Execute actions if not skipped
      if (status !== 'skipped') {
        const result = await executeActions(automation, context);
        if (!result.success) {
          status = 'failed';
          error = result.error;
        } else {
          actionsExecuted = result.actionsExecuted || [];
        }
      }
    }
  } catch (err) {
    status = 'failed';
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  const duration = Date.now() - startTime;

  // Log the run
  const run: ToolAutomationRun = {
    id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    automationId: automation.id,
    deploymentId: context.deploymentId,
    timestamp: new Date().toISOString(),
    status,
    triggerType: 'event',
    triggerData: {
      eventId: context.eventId,
      eventType: context.event.type,
      action: context.event.action,
      elementId: context.event.elementId,
      userId: context.event.userId,
    },
    actionsExecuted,
    error,
    duration,
  };

  await logRun(context.deploymentId, run);
  await updateAutomationStats(
    context.deploymentId,
    automation.id,
    status === 'success',
    automation.runCount,
    automation.errorCount
  );

  logger.info('Event automation processed', {
    automationId: automation.id,
    eventType: context.event.type,
    status,
    duration,
  });
}

// ============================================================================
// MAIN CLOUD FUNCTION
// ============================================================================

/**
 * Cloud Function triggered when a tool event is created.
 * Processes event-triggered automations.
 */
export const onToolEvent = onDocumentCreated(
  'deployedTools/{deploymentId}/events/{eventId}',
  async (event) => {
    const deploymentId = event.params.deploymentId;
    const eventId = event.params.eventId;

    logger.info('Tool event detected', {
      deploymentId,
      eventId,
    });

    // Get event data
    const eventData = event.data?.data() as ToolEvent | undefined;
    if (!eventData) {
      logger.warn('No event data found', { deploymentId, eventId });
      return;
    }

    // Skip already processed events
    if (eventData.processed) {
      logger.info('Event already processed', { deploymentId, eventId });
      return;
    }

    // Skip events from automations to prevent infinite loops
    if (eventData.source?.type === 'automation') {
      logger.info('Skipping automation-sourced event to prevent loop', {
        deploymentId,
        eventId,
        sourceAutomation: eventData.source.automationId,
      });
      // Still mark as processed
      await markEventProcessed(deploymentId, eventId);
      return;
    }

    // Load current tool state for condition evaluation
    const currentState = await loadToolState(deploymentId);

    const eventContext: EventContext = {
      deploymentId,
      eventId,
      event: eventData,
      currentState,
    };

    // Query for enabled event-triggered automations
    const automationsRef = db
      .collection('deployedTools')
      .doc(deploymentId)
      .collection('automations')
      .where('enabled', '==', true)
      .where('trigger.type', '==', 'event');

    const snapshot = await automationsRef.get();

    if (snapshot.empty) {
      logger.info('No enabled event automations found', { deploymentId });
      await markEventProcessed(deploymentId, eventId);
      return;
    }

    const eventAutomations = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as ToolAutomation));

    logger.info('Processing event automations', {
      deploymentId,
      eventType: eventData.type,
      action: eventData.action,
      automationCount: eventAutomations.length,
    });

    // Process all matching automations in parallel
    await Promise.all(
      eventAutomations.map(automation =>
        processEventAutomation(automation, eventContext)
      )
    );

    // Mark event as processed
    await markEventProcessed(deploymentId, eventId);

    logger.info('Event processing complete', {
      deploymentId,
      eventId,
      automationsChecked: eventAutomations.length,
    });
  }
);

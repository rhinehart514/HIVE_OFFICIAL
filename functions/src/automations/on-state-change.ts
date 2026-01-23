/**
 * On State Change Cloud Function
 *
 * Sprint 4: Automations
 *
 * Triggered when a tool's shared state changes.
 * Processes event triggers and threshold triggers for automations.
 *
 * Trigger: Firestore document write at deployedTools/{deploymentId}/sharedState/current
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
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

/**
 * Interface for state change context
 */
interface StateChangeContext {
  deploymentId: string;
  previousState: ToolSharedState | null;
  currentState: ToolSharedState;
  changedPaths: string[];
}

/**
 * Detect which paths changed between previous and current state
 */
function detectChangedPaths(
  previous: ToolSharedState | null,
  current: ToolSharedState
): string[] {
  const changes: string[] = [];

  if (!previous) {
    // All paths are new
    if (current.counters) {
      Object.keys(current.counters).forEach(key => {
        changes.push(`counters.${key}`);
      });
    }
    if (current.collections) {
      Object.keys(current.collections).forEach(key => {
        changes.push(`collections.${key}`);
      });
    }
    return changes;
  }

  // Check counters
  const prevCounters = previous.counters || {};
  const currCounters = current.counters || {};
  const allCounterKeys = new Set([
    ...Object.keys(prevCounters),
    ...Object.keys(currCounters),
  ]);
  allCounterKeys.forEach(key => {
    if (prevCounters[key] !== currCounters[key]) {
      changes.push(`counters.${key}`);
    }
  });

  // Check collections
  const prevCollections = previous.collections || {};
  const currCollections = current.collections || {};
  const allCollectionKeys = new Set([
    ...Object.keys(prevCollections),
    ...Object.keys(currCollections),
  ]);
  allCollectionKeys.forEach(key => {
    const prevSize = Object.keys(prevCollections[key] || {}).length;
    const currSize = Object.keys(currCollections[key] || {}).length;
    if (prevSize !== currSize) {
      changes.push(`collections.${key}`);
    }
  });

  return changes;
}

/**
 * Get value at a dot-notation path from state
 */
function getValueAtPath(state: ToolSharedState, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = state;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Check if threshold was crossed
 */
function wasThresholdCrossed(
  prevValue: unknown,
  currValue: unknown,
  operator: '>' | '<' | '==' | '>=' | '<=',
  threshold: number
): boolean {
  const prev = typeof prevValue === 'number' ? prevValue : 0;
  const curr = typeof currValue === 'number' ? currValue : 0;

  const compare = (val: number): boolean => {
    switch (operator) {
      case '>': return val > threshold;
      case '<': return val < threshold;
      case '==': return val === threshold;
      case '>=': return val >= threshold;
      case '<=': return val <= threshold;
      default: return false;
    }
  };

  // Threshold crossed = wasn't meeting condition before, but is now
  return !compare(prev) && compare(curr);
}

/**
 * COST OPTIMIZATION: Batch fetch run counts for multiple automations
 * Reduces N queries to 1 query + in-memory aggregation
 */
async function batchGetRunsToday(
  deploymentId: string,
  automationIds: string[]
): Promise<Map<string, number>> {
  if (automationIds.length === 0) {
    return new Map();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Single query to get all runs for today
  const runsRef = db
    .collection('deployedTools')
    .doc(deploymentId)
    .collection('automationRuns')
    .where('timestamp', '>=', today.toISOString());

  const snapshot = await runsRef.get();

  // Aggregate counts in memory (much cheaper than N separate count queries)
  const counts = new Map<string, number>();
  automationIds.forEach(id => counts.set(id, 0));

  snapshot.docs.forEach(doc => {
    const automationId = doc.data().automationId;
    if (counts.has(automationId)) {
      counts.set(automationId, (counts.get(automationId) || 0) + 1);
    }
  });

  return counts;
}

/**
 * Get runs today count for rate limiting (single automation)
 * @deprecated Use batchGetRunsToday for multiple automations
 */
async function getRunsToday(
  deploymentId: string,
  automationId: string
): Promise<number> {
  const counts = await batchGetRunsToday(deploymentId, [automationId]);
  return counts.get(automationId) || 0;
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
 * Execute automation actions using the action executors
 */
async function executeActions(
  automation: ToolAutomation,
  context: StateChangeContext
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
      triggerType: 'threshold',
      previousState: context.previousState,
      changedPaths: context.changedPaths,
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
 * Process a single automation for threshold triggers
 * COST OPTIMIZATION: Accepts pre-fetched runsToday to avoid N+1 queries
 */
async function processThresholdAutomation(
  automation: ToolAutomation,
  context: StateChangeContext,
  runsToday: number
): Promise<void> {
  const trigger = automation.trigger;
  if (trigger.type !== 'threshold') return;

  // COST OPTIMIZATION: Early exit if path didn't change (avoids unnecessary computation)
  const triggerPathPrefix = trigger.path.split('.').slice(0, 2).join('.');
  const pathChanged = context.changedPaths.some(cp => cp.startsWith(triggerPathPrefix) || triggerPathPrefix.startsWith(cp));
  if (!pathChanged) {
    return;
  }

  const prevValue = context.previousState
    ? getValueAtPath(context.previousState, trigger.path)
    : 0;
  const currValue = getValueAtPath(context.currentState, trigger.path);

  // Check if threshold was crossed
  if (!wasThresholdCrossed(prevValue, currValue, trigger.operator, trigger.value)) {
    return;
  }

  const startTime = Date.now();
  let status: 'success' | 'skipped' | 'failed' = 'success';
  let error: string | undefined;

  try {
    // Check rate limits (using pre-fetched count)
    const canRun = canRunAutomation(automation, runsToday);

    if (!canRun.canRun) {
      status = 'skipped';
      error = canRun.reason;
    } else {
      // Evaluate conditions
      if (automation.conditions && automation.conditions.length > 0) {
        const conditionContext = {
          state: context.currentState,
          trigger: {
            type: 'threshold',
            previousValue: prevValue,
            currentValue: currValue,
          },
        };

        const conditionEval = evaluateAllConditions(
          automation.conditions,
          conditionContext as Record<string, unknown>
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
    triggerType: 'threshold',
    triggerData: {
      path: trigger.path,
      previousValue: prevValue,
      currentValue: currValue,
      threshold: trigger.value,
      operator: trigger.operator,
    },
    actionsExecuted: status === 'success' ? automation.actions.map(a => a.type) : [],
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

  logger.info('Threshold automation processed', {
    automationId: automation.id,
    status,
    duration,
  });
}

/**
 * Main Cloud Function - triggered on state changes
 */
export const onToolStateChange = onDocumentWritten(
  'deployedTools/{deploymentId}/sharedState/current',
  async (event) => {
    const deploymentId = event.params.deploymentId;

    logger.info('Tool state change detected', {
      deploymentId,
      hasBeforeData: event.data?.before.exists ?? false,
      hasAfterData: event.data?.after.exists ?? false,
    });

    // Skip if no data (shouldn't happen but TypeScript requires check)
    if (!event.data) {
      logger.info('No event data, skipping');
      return;
    }

    // Skip deletes
    if (!event.data.after.exists) {
      logger.info('State was deleted, skipping automation check');
      return;
    }

    const previousState = event.data.before.exists
      ? (event.data.before.data() as ToolSharedState)
      : null;
    const currentState = event.data.after.data() as ToolSharedState;

    // Detect what changed
    const changedPaths = detectChangedPaths(previousState, currentState);

    if (changedPaths.length === 0) {
      logger.info('No meaningful changes detected');
      return;
    }

    const stateContext: StateChangeContext = {
      deploymentId,
      previousState,
      currentState,
      changedPaths,
    };

    // COST OPTIMIZATION: Filter by trigger.type in query (reduces documents loaded)
    const automationsRef = db
      .collection('deployedTools')
      .doc(deploymentId)
      .collection('automations')
      .where('enabled', '==', true)
      .where('trigger.type', '==', 'threshold');

    const snapshot = await automationsRef.get();

    if (snapshot.empty) {
      logger.info('No enabled threshold automations found');
      return;
    }

    const thresholdAutomations = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as ToolAutomation));

    logger.info('Processing threshold automations', {
      deploymentId,
      count: thresholdAutomations.length,
      changedPaths,
    });

    // COST OPTIMIZATION: Batch fetch all run counts in single query (N queries → 1)
    const automationIds = thresholdAutomations.map(a => a.id);
    const runCounts = await batchGetRunsToday(deploymentId, automationIds);

    // COST OPTIMIZATION: Process automations in parallel with Promise.all
    // Each automation gets its pre-fetched run count
    await Promise.all(
      thresholdAutomations.map(automation =>
        processThresholdAutomation(
          automation,
          stateContext,
          runCounts.get(automation.id) || 0
        )
      )
    );
  });

/**
 * Export for testing
 */
export const _test = {
  detectChangedPaths,
  getValueAtPath,
  wasThresholdCrossed,
  batchGetRunsToday,
};

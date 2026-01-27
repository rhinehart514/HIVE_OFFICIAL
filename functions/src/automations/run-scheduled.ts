/**
 * Run Scheduled Automations Cloud Function
 *
 * Sprint 4: Automations
 *
 * Called every minute by Cloud Scheduler to execute scheduled automations.
 * Checks all tools for automations with schedule triggers that are due.
 *
 * Trigger: Cloud Scheduler - every minute
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { parseExpression } from 'cron-parser';
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
 * COST OPTIMIZATION: Batch fetch run counts for multiple automations across deployments
 * Groups by deploymentId to minimize queries
 */
async function batchGetRunsTodayByDeployment(
  automations: Array<{ id: string; deploymentId: string }>
): Promise<Map<string, number>> {
  if (automations.length === 0) {
    return new Map();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  // Group automations by deployment
  const byDeployment = new Map<string, string[]>();
  automations.forEach(({ id, deploymentId }) => {
    if (!byDeployment.has(deploymentId)) {
      byDeployment.set(deploymentId, []);
    }
    byDeployment.get(deploymentId)!.push(id);
  });

  // Fetch runs in parallel for each deployment (one query per deployment)
  const counts = new Map<string, number>();
  automations.forEach(({ id }) => counts.set(id, 0));

  await Promise.all(
    Array.from(byDeployment.entries()).map(async ([deploymentId, automationIds]) => {
      const runsRef = db
        .collection('deployedTools')
        .doc(deploymentId)
        .collection('automationRuns')
        .where('timestamp', '>=', todayStr);

      const snapshot = await runsRef.get();

      // Aggregate counts in memory
      snapshot.docs.forEach(doc => {
        const automationId = doc.data().automationId;
        if (automationIds.includes(automationId)) {
          counts.set(automationId, (counts.get(automationId) || 0) + 1);
        }
      });
    })
  );

  return counts;
}

/**
 * COST OPTIMIZATION: Batch fetch tool states for multiple deployments
 */
async function batchGetToolStates(
  deploymentIds: string[]
): Promise<Map<string, ToolSharedState | null>> {
  if (deploymentIds.length === 0) {
    return new Map();
  }

  // Deduplicate deployment IDs
  const uniqueIds = [...new Set(deploymentIds)];

  const states = new Map<string, ToolSharedState | null>();

  // Fetch in parallel
  await Promise.all(
    uniqueIds.map(async (deploymentId) => {
      const state = await getToolState(deploymentId);
      states.set(deploymentId, state);
    })
  );

  return states;
}

/**
 * Get runs today count for rate limiting (single automation - fallback)
 * @deprecated Use batchGetRunsTodayByDeployment for multiple automations
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
 * Get tool's shared state
 */
async function getToolState(deploymentId: string): Promise<ToolSharedState | null> {
  const stateRef = db
    .collection('deployedTools')
    .doc(deploymentId)
    .collection('sharedState')
    .doc('current');

  const doc = await stateRef.get();
  if (!doc.exists) return null;

  const data = doc.data();
  return {
    counters: data?.counters || {},
    collections: data?.collections || {},
    timeline: data?.timeline || [],
    computed: data?.computed || {},
    version: data?.version || 0,
    lastModified: data?.lastModified || new Date().toISOString(),
  };
}

/**
 * Calculate next run time from cron expression using cron-parser
 *
 * @param cron - Cron expression (e.g., "0 9 * * *" for 9 AM daily)
 * @param timezone - IANA timezone (e.g., "America/New_York"), defaults to America/New_York
 * @returns Next scheduled run time
 */
function calculateNextRun(cron: string, timezone: string = 'America/New_York'): Date {
  try {
    const interval = parseExpression(cron, {
      tz: timezone,
      currentDate: new Date(),
    });
    return interval.next().toDate();
  } catch (error) {
    // If cron parsing fails, fall back to 1 hour from now
    logger.warn('Failed to parse cron expression, using fallback', {
      cron,
      timezone,
      error: error instanceof Error ? error.message : String(error),
    });
    const next = new Date();
    next.setHours(next.getHours() + 1);
    next.setMinutes(0, 0, 0);
    return next;
  }
}

/**
 * Update automation after run
 */
async function updateAutomationAfterRun(
  deploymentId: string,
  automationId: string,
  success: boolean,
  currentRunCount: number,
  currentErrorCount: number,
  cron: string,
  timezone?: string
): Promise<void> {
  const nextRun = calculateNextRun(cron, timezone);

  await db
    .collection('deployedTools')
    .doc(deploymentId)
    .collection('automations')
    .doc(automationId)
    .update({
      lastRun: new Date().toISOString(),
      nextRun: nextRun.toISOString(),
      runCount: currentRunCount + 1,
      errorCount: success ? currentErrorCount : currentErrorCount + 1,
    });
}

/**
 * Execute automation actions using the action executors
 */
async function executeActions(
  automation: ToolAutomation,
  state: ToolSharedState | null
): Promise<{ success: boolean; error?: string; actionsExecuted?: string[] }> {
  logger.info('Executing scheduled automation actions', {
    automationId: automation.id,
    actions: automation.actions.map(a => a.type),
  });

  const context: ExecutionContext = {
    automationId: automation.id,
    deploymentId: automation.deploymentId,
    state,
    triggerData: {
      triggerType: 'schedule',
      scheduledTime: automation.nextRun,
    },
  };

  const result = await executeAllActions(automation.actions, context);

  return {
    success: result.success,
    error: result.results.find(r => !r.success)?.error,
    actionsExecuted: result.results.filter(r => r.success).map(r => r.actionType),
  };
}

/**
 * Process a single scheduled automation
 * COST OPTIMIZATION: Accepts pre-fetched runsToday and state to avoid N+1 queries
 */
async function processScheduledAutomation(
  automation: ToolAutomation,
  runsToday: number,
  state: ToolSharedState | null
): Promise<void> {
  const trigger = automation.trigger;
  if (trigger.type !== 'schedule') return;

  const now = new Date();
  const startTime = Date.now();
  let status: 'success' | 'skipped' | 'failed' = 'success';
  let error: string | undefined;

  // Check if it's time to run
  if (automation.nextRun) {
    const nextRunTime = new Date(automation.nextRun);
    if (now < nextRunTime) {
      // Not time yet
      return;
    }
  }

  try {
    // Check rate limits (using pre-fetched count)
    const canRun = canRunAutomation(automation, runsToday);

    if (!canRun.canRun) {
      status = 'skipped';
      error = canRun.reason;
    } else {
      // Evaluate conditions (using pre-fetched state)
      if (automation.conditions && automation.conditions.length > 0) {
        const conditionContext = {
          state: state || {},
          trigger: { type: 'schedule' },
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
        const result = await executeActions(automation, state);
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
    deploymentId: automation.deploymentId,
    timestamp: new Date().toISOString(),
    status,
    triggerType: 'schedule',
    triggerData: {
      cron: trigger.cron,
      scheduledTime: automation.nextRun,
    },
    actionsExecuted: status === 'success' ? automation.actions.map(a => a.type) : [],
    error,
    duration,
  };

  await logRun(automation.deploymentId, run);
  await updateAutomationAfterRun(
    automation.deploymentId,
    automation.id,
    status === 'success',
    automation.runCount,
    automation.errorCount,
    trigger.cron,
    trigger.timezone
  );

  logger.info('Scheduled automation processed', {
    automationId: automation.id,
    deploymentId: automation.deploymentId,
    status,
    duration,
  });
}

/**
 * Main Cloud Function - runs every minute
 */
export const runScheduledAutomations = onSchedule(
  { schedule: '* * * * *', timeZone: 'America/New_York' },
  async () => {
    const now = new Date();
    logger.info('Running scheduled automations check', {
      timestamp: now.toISOString(),
    });

    // Query all scheduled automations that are due
    // Note: This queries across all deployments - consider sharding for scale
    const automationsQuery = db
      .collectionGroup('automations')
      .where('enabled', '==', true)
      .where('trigger.type', '==', 'schedule')
      .where('nextRun', '<=', now.toISOString());

    const snapshot = await automationsQuery.get();

    if (snapshot.empty) {
      logger.info('No scheduled automations due');
      return;
    }

    logger.info('Found scheduled automations to process', {
      count: snapshot.size,
    });

    // Parse automations and extract deployment IDs
    const automations = snapshot.docs.map((doc) => {
      const automation = {
        id: doc.id,
        ...doc.data(),
      } as ToolAutomation;

      // Extract deploymentId from path
      const pathParts = doc.ref.path.split('/');
      const deploymentIdx = pathParts.indexOf('deployedTools') + 1;
      automation.deploymentId = pathParts[deploymentIdx];

      return automation;
    });

    // COST OPTIMIZATION: Batch fetch all run counts and states upfront
    // This reduces N+1 queries to 2 parallel batch fetches
    const [runCounts, toolStates] = await Promise.all([
      batchGetRunsTodayByDeployment(automations),
      batchGetToolStates(automations.map(a => a.deploymentId)),
    ]);

    logger.info('Pre-fetched data for scheduled automations', {
      runCountsSize: runCounts.size,
      toolStatesSize: toolStates.size,
    });

    // Process each automation with pre-fetched data
    const results = await Promise.allSettled(
      automations.map((automation) =>
        processScheduledAutomation(
          automation,
          runCounts.get(automation.id) || 0,
          toolStates.get(automation.deploymentId) || null
        )
      )
    );

    // Log summary
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info('Scheduled automations run complete', {
      total: snapshot.size,
      successful,
      failed,
    });
  });

/**
 * HTTP trigger for manual testing
 */
export const runScheduledAutomationsHttp = onRequest(
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Check for admin auth (implement based on your auth setup)
    // For now, require a secret header
    const adminSecret = req.get('X-Admin-Secret');
    if (adminSecret !== process.env.ADMIN_SECRET) {
      res.status(401).send('Unauthorized');
      return;
    }

    const now = new Date();
    logger.info('Manual scheduled automations run triggered', {
      timestamp: now.toISOString(),
    });

    const automationsQuery = db
      .collectionGroup('automations')
      .where('enabled', '==', true)
      .where('trigger.type', '==', 'schedule')
      .where('nextRun', '<=', now.toISOString());

    const snapshot = await automationsQuery.get();

    if (snapshot.empty) {
      res.json({ message: 'No scheduled automations due', processed: 0 });
      return;
    }

    // Parse automations
    const automations = snapshot.docs.map((doc) => {
      const automation = {
        id: doc.id,
        ...doc.data(),
      } as ToolAutomation;

      const pathParts = doc.ref.path.split('/');
      const deploymentIdx = pathParts.indexOf('deployedTools') + 1;
      automation.deploymentId = pathParts[deploymentIdx];

      return automation;
    });

    // COST OPTIMIZATION: Batch fetch all data upfront
    const [runCounts, toolStates] = await Promise.all([
      batchGetRunsTodayByDeployment(automations),
      batchGetToolStates(automations.map(a => a.deploymentId)),
    ]);

    // Process in parallel with pre-fetched data
    const results = await Promise.allSettled(
      automations.map((automation) =>
        processScheduledAutomation(
          automation,
          runCounts.get(automation.id) || 0,
          toolStates.get(automation.deploymentId) || null
        )
      )
    );

    const processed = results.filter(r => r.status === 'fulfilled').length;
    const errors = results.filter(r => r.status === 'rejected').length;

    res.json({
      message: 'Scheduled automations processed',
      total: snapshot.size,
      processed,
      errors,
    });
  }
);

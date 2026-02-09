/**
 * Scheduled Tool Automations Cron Endpoint
 *
 * Called by Vercel Cron every 5 minutes to process:
 * - Scheduled tool automations (cron-based triggers)
 *
 * POST /api/cron/tool-automations
 *
 * Requires CRON_SECRET header for security.
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { createBulkNotifications } from '@/lib/notification-service';

const CRON_SECRET = process.env.CRON_SECRET;

interface AutomationResult {
  automationId: string;
  deploymentId: string;
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: AutomationResult[] = [];
  const now = new Date();

  try {
    // Get all tool deployments with scheduled automations
    const deploymentsSnapshot = await dbAdmin.collection('deployedTools').get();

    for (const deploymentDoc of deploymentsSnapshot.docs) {
      const deploymentId = deploymentDoc.id;
      const deploymentData = deploymentDoc.data();

      // Get scheduled automations for this deployment
      const automationsSnapshot = await dbAdmin
        .collection('deployedTools')
        .doc(deploymentId)
        .collection('automations')
        .where('trigger.type', '==', 'schedule')
        .where('enabled', '==', true)
        .get();

      if (automationsSnapshot.empty) continue;

      for (const automationDoc of automationsSnapshot.docs) {
        const automation = automationDoc.data();

        // Check if it's time to run
        if (!shouldRunSchedule(automation, now)) continue;

        // Check rate limits
        const runsToday = await getRunsToday(deploymentId, automationDoc.id);
        const maxRunsPerDay = automation.limits?.maxRunsPerDay || 100;
        if (runsToday >= maxRunsPerDay) continue;

        try {
          // Get current tool state
          const stateDoc = await dbAdmin
            .collection('deployedTools')
            .doc(deploymentId)
            .collection('sharedState')
            .doc('current')
            .get();

          const state = stateDoc.exists ? stateDoc.data() || {} : {};

          // Execute actions
          const spaceId = deploymentData.targetId || deploymentData.spaceId;
          for (const action of automation.actions || []) {
            await executeAutomationAction(action, deploymentId, spaceId, state);
          }

          // Log run and update stats
          const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          await dbAdmin
            .collection('deployedTools')
            .doc(deploymentId)
            .collection('automationRuns')
            .doc(runId)
            .set({
              automationId: automationDoc.id,
              deploymentId,
              timestamp: now.toISOString(),
              status: 'success',
              triggerType: 'schedule',
              triggerData: {
                cron: automation.trigger.cron,
              },
              actionsExecuted: (automation.actions || []).map((a: { type: string }) => a.type),
              duration: Date.now() - now.getTime(),
            });

          // Calculate next run time
          const nextRun = calculateNextRun(automation.trigger.cron);

          await automationDoc.ref.update({
            lastRun: now.toISOString(),
            nextRun: nextRun.toISOString(),
            runCount: FieldValue.increment(1),
          });

          results.push({
            automationId: automationDoc.id,
            deploymentId,
            success: true,
          });

          logger.info('Scheduled tool automation executed', {
            automationId: automationDoc.id,
            deploymentId,
            automationName: automation.name,
          });
        } catch (error) {
          await automationDoc.ref.update({
            errorCount: FieldValue.increment(1),
            lastRun: now.toISOString(),
          });

          results.push({
            automationId: automationDoc.id,
            deploymentId,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });

          logger.error('Scheduled tool automation failed', {
            automationId: automationDoc.id,
            deploymentId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    logger.info('Tool automations cron processed', {
      total: results.length,
      success: successCount,
      failed: failCount,
    });

    return NextResponse.json({
      processed: results.length,
      success: successCount,
      failed: failCount,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error('Tool automations cron failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if a scheduled automation should run now
 */
function shouldRunSchedule(
  automation: Record<string, unknown>,
  now: Date
): boolean {
  const trigger = automation.trigger as { cron?: string } | undefined;
  const lastRun = automation.lastRun as string | undefined;
  const nextRun = automation.nextRun as string | undefined;

  // If we have a nextRun time, check if it's past
  if (nextRun) {
    const nextRunTime = new Date(nextRun);
    if (now >= nextRunTime) return true;
    return false;
  }

  // If we have a lastRun, check cooldown (minimum 1 hour between runs)
  if (lastRun) {
    const lastRunTime = new Date(lastRun);
    const hoursSinceLastRun = (now.getTime() - lastRunTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastRun < 1) return false;
  }

  // Parse cron expression for simple daily checks
  if (trigger?.cron) {
    return shouldCronRun(trigger.cron, now);
  }

  return false;
}

/**
 * Simple cron expression check
 * Format: minute hour day month weekday
 */
function shouldCronRun(cron: string, now: Date): boolean {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [minute, hour, day, month, weekday] = parts;
  const currentMinute = now.getMinutes();
  const currentHour = now.getHours();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentWeekday = now.getDay();

  // Check each part (simplified - only supports * and numbers)
  if (minute !== '*' && parseInt(minute, 10) !== currentMinute) return false;
  if (hour !== '*' && parseInt(hour, 10) !== currentHour) return false;
  if (day !== '*' && parseInt(day, 10) !== currentDay) return false;
  if (month !== '*' && parseInt(month, 10) !== currentMonth) return false;
  if (weekday !== '*' && parseInt(weekday, 10) !== currentWeekday) return false;

  return true;
}

/**
 * Calculate next run time from cron expression.
 * Supports standard 5-field cron: minute hour day month weekday
 */
function calculateNextRun(cron: string): Date {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    const fallback = new Date();
    fallback.setHours(fallback.getHours() + 1);
    return fallback;
  }

  const [minuteSpec, hourSpec, daySpec, monthSpec, weekdaySpec] = parts;

  function matchesField(spec: string, value: number): boolean {
    if (spec === '*') return true;
    if (spec.startsWith('*/')) {
      const step = parseInt(spec.slice(2), 10);
      return step > 0 && value % step === 0;
    }
    return spec.split(',').some(v => parseInt(v, 10) === value);
  }

  const now = new Date();
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);
  const maxMinutes = 48 * 60;

  for (let i = 0; i < maxMinutes; i++) {
    if (
      matchesField(minuteSpec, candidate.getMinutes()) &&
      matchesField(hourSpec, candidate.getHours()) &&
      matchesField(daySpec, candidate.getDate()) &&
      matchesField(monthSpec, candidate.getMonth() + 1) &&
      matchesField(weekdaySpec, candidate.getDay())
    ) {
      return candidate;
    }
    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  const fallback = new Date();
  fallback.setHours(fallback.getHours() + 24);
  return fallback;
}

/**
 * Get runs today count for rate limiting
 */
async function getRunsToday(deploymentId: string, automationId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const runsRef = dbAdmin
    .collection('deployedTools')
    .doc(deploymentId)
    .collection('automationRuns')
    .where('automationId', '==', automationId)
    .where('timestamp', '>=', today.toISOString());

  const snapshot = await runsRef.count().get();
  return snapshot.data().count;
}

/**
 * Execute a single automation action
 */
async function executeAutomationAction(
  action: { type: string; [key: string]: unknown },
  deploymentId: string,
  spaceId: string,
  _state: Record<string, unknown>
): Promise<void> {
  if (action.type === 'notify') {
    // Get recipients
    let userIds: string[] = [];
    const to = action.to as string;

    if (to === 'all' && spaceId) {
      const membersSnapshot = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('status', '==', 'active')
        .get();
      userIds = membersSnapshot.docs.map(d => d.data().userId);
    } else if (to === 'role' && action.roleName && spaceId) {
      const membersSnapshot = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('role', '==', action.roleName)
        .where('status', '==', 'active')
        .get();
      userIds = membersSnapshot.docs.map(d => d.data().userId);
    }

    if (userIds.length > 0) {
      await createBulkNotifications(userIds, {
        type: 'system',
        category: 'tools',
        title: (action.title as string) || 'Scheduled Notification',
        body: (action.body as string) || '',
        actionUrl: spaceId ? `/s/${spaceId}` : undefined,
        metadata: {
          deploymentId,
          automationType: 'schedule',
        },
      });
    }
  } else if (action.type === 'mutate') {
    const elementId = action.elementId as string;
    const mutation = action.mutation as Record<string, unknown>;

    // Update element state
    const stateRef = dbAdmin
      .collection('deployedTools')
      .doc(deploymentId)
      .collection('sharedState')
      .doc('current');

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(mutation)) {
      updates[`${elementId}.${key}`] = value;
    }
    updates.lastModified = new Date().toISOString();

    await stateRef.set(updates, { merge: true });
  }
}

// Also support GET for Vercel Cron
export async function GET(request: Request) {
  return POST(request);
}

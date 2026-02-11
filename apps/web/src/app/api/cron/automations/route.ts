/**
 * Scheduled Automations Cron Endpoint
 *
 * Called by Vercel Cron or external scheduler to process:
 * - event_reminder automations (X minutes before events)
 * - scheduled automations (cron-based triggers)
 *
 * POST /api/cron/automations
 *
 * Requires CRON_SECRET header for security.
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { createBulkNotifications } from '@/lib/notification-service';
import { withCache } from '../../../../lib/cache-headers';

const CRON_SECRET = process.env.CRON_SECRET;

interface AutomationResult {
  automationId: string;
  spaceId: string;
  type: string;
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  // Verify cron secret — reject if missing or mismatched
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: AutomationResult[] = [];
  const now = new Date();

  try {
    // 1. Process event_reminder automations
    await processEventReminders(now, results);

    // 2. Process scheduled automations
    await processScheduledAutomations(now, results);

    // 3. Process tool_state_change automations (bridge space↔tool)
    await processToolStateTriggers(now, results);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    logger.info('Cron automations processed', {
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
    logger.error('Cron automations failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process event reminder automations
 * Sends reminders X minutes before events
 */
async function processEventReminders(
  now: Date,
  results: AutomationResult[]
): Promise<void> {
  // Get all spaces with event_reminder automations
  const spacesSnapshot = await dbAdmin.collection('spaces').get();

  for (const spaceDoc of spacesSnapshot.docs) {
    const spaceId = spaceDoc.id;
    const spaceData = spaceDoc.data();

    // Get event_reminder automations for this space
    const automationsSnapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('automations')
      .where('trigger.type', '==', 'event_reminder')
      .where('enabled', '==', true)
      .get();

    if (automationsSnapshot.empty) continue;

    // Get upcoming events for this space
    const eventsSnapshot = await dbAdmin
      .collection('events')
      .where('spaceId', '==', spaceId)
      .where('startTime', '>', now)
      .orderBy('startTime', 'asc')
      .limit(10)
      .get();

    if (eventsSnapshot.empty) continue;

    for (const automationDoc of automationsSnapshot.docs) {
      const automation = automationDoc.data();
      const trigger = automation.trigger || {};
      const minutesBefore = trigger.minutesBefore || 60; // Default 1 hour

      for (const eventDoc of eventsSnapshot.docs) {
        const event = eventDoc.data();
        const eventStart = event.startTime?.toDate?.() || new Date(event.startTime);
        const reminderTime = new Date(eventStart.getTime() - minutesBefore * 60 * 1000);

        // Check if it's time to send reminder (within 1 minute window)
        const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
        if (timeDiff > 60 * 1000) continue;

        // Check if already sent for this event
        const sentKey = `reminder_sent_${eventDoc.id}`;
        if (automation[sentKey]) continue;

        try {
          // Execute the automation action
          await executeEventReminderAction(
            automation.action,
            spaceId,
            spaceData.name || 'Space',
            eventDoc.id,
            event.title || 'Event',
            eventStart
          );

          // Mark as sent
          await automationDoc.ref.update({
            [sentKey]: true,
            'stats.timesTriggered': FieldValue.increment(1),
            'stats.successCount': FieldValue.increment(1),
            'stats.lastTriggered': now,
          });

          results.push({
            automationId: automationDoc.id,
            spaceId,
            type: 'event_reminder',
            success: true,
          });

          logger.info('Event reminder sent', {
            automationId: automationDoc.id,
            spaceId,
            eventId: eventDoc.id,
            eventTitle: event.title,
          });
        } catch (error) {
          await automationDoc.ref.update({
            'stats.timesTriggered': FieldValue.increment(1),
            'stats.failureCount': FieldValue.increment(1),
            'stats.lastTriggered': now,
          });

          results.push({
            automationId: automationDoc.id,
            spaceId,
            type: 'event_reminder',
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }
}

/**
 * Process scheduled automations (cron-based)
 */
async function processScheduledAutomations(
  now: Date,
  results: AutomationResult[]
): Promise<void> {
  // Get all spaces
  const spacesSnapshot = await dbAdmin.collection('spaces').get();

  for (const spaceDoc of spacesSnapshot.docs) {
    const spaceId = spaceDoc.id;

    // Get scheduled automations
    const automationsSnapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('automations')
      .where('trigger.type', '==', 'schedule')
      .where('enabled', '==', true)
      .get();

    if (automationsSnapshot.empty) continue;

    for (const automationDoc of automationsSnapshot.docs) {
      const automation = automationDoc.data();
      const trigger = automation.trigger || {};

      // Check if it's time to run based on schedule
      if (!shouldRunSchedule(trigger, now, automation.lastRun)) continue;

      try {
        // Execute the action
        await executeScheduledAction(
          automation.action,
          spaceId,
          automation
        );

        // Update stats
        await automationDoc.ref.update({
          lastRun: now.toISOString(),
          'stats.timesTriggered': FieldValue.increment(1),
          'stats.successCount': FieldValue.increment(1),
          'stats.lastTriggered': now,
        });

        results.push({
          automationId: automationDoc.id,
          spaceId,
          type: 'schedule',
          success: true,
        });

        logger.info('Scheduled automation executed', {
          automationId: automationDoc.id,
          spaceId,
          scheduleName: automation.name,
        });
      } catch (error) {
        await automationDoc.ref.update({
          'stats.timesTriggered': FieldValue.increment(1),
          'stats.failureCount': FieldValue.increment(1),
          'stats.lastTriggered': now,
        });

        results.push({
          automationId: automationDoc.id,
          spaceId,
          type: 'schedule',
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}

/**
 * Check if a schedule should run now
 */
function shouldRunSchedule(
  trigger: Record<string, unknown>,
  now: Date,
  lastRun?: string
): boolean {
  const scheduleType = trigger.scheduleType as string;
  const hour = trigger.hour as number | undefined;
  const minute = trigger.minute as number | undefined;
  const dayOfWeek = trigger.dayOfWeek as number | undefined;
  const dayOfMonth = trigger.dayOfMonth as number | undefined;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDayOfWeek = now.getDay();
  const currentDayOfMonth = now.getDate();

  // Check if already ran today/this hour
  if (lastRun) {
    const lastRunDate = new Date(lastRun);
    const hoursSinceLastRun = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60);

    // Prevent running more than once per hour for any schedule
    if (hoursSinceLastRun < 1) return false;
  }

  // Check time match (within 5 minute window)
  const timeMatches = hour !== undefined && minute !== undefined
    ? currentHour === hour && Math.abs(currentMinute - minute) <= 5
    : true;

  if (!timeMatches) return false;

  switch (scheduleType) {
    case 'daily':
      return true;

    case 'weekly':
      return dayOfWeek !== undefined ? currentDayOfWeek === dayOfWeek : true;

    case 'monthly':
      return dayOfMonth !== undefined ? currentDayOfMonth === dayOfMonth : true;

    case 'hourly':
      // For hourly, just check if it's been at least an hour
      return true;

    default:
      return false;
  }
}

/**
 * Execute event reminder action
 */
async function executeEventReminderAction(
  action: { type: string; config?: Record<string, unknown> },
  spaceId: string,
  spaceName: string,
  eventId: string,
  eventTitle: string,
  eventStart: Date
): Promise<void> {
  if (!action) return;

  if (action.type === 'notify') {
    const config = action.config || {};
    const recipients = (config.recipients as string) || 'attendees';

    let userIds: string[] = [];

    if (recipients === 'attendees') {
      // Get event attendees from flat /rsvps collection (not subcollection)
      const rsvpsSnapshot = await dbAdmin
        .collection('rsvps')
        .where('eventId', '==', eventId)
        .where('status', '==', 'going')
        .get();

      userIds = rsvpsSnapshot.docs.map(d => d.data().userId);
    } else if (recipients === 'all') {
      // Get all space members
      const membersSnapshot = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('isActive', '==', true)
        .get();

      userIds = membersSnapshot.docs.map(d => d.data().userId);
    }

    if (userIds.length === 0) return;

    const timeUntil = formatTimeUntil(eventStart);
    let title = (config.title as string) || `${eventTitle} starting ${timeUntil}`;
    let body = (config.body as string) || `Don't forget: ${eventTitle} is coming up!`;

    title = title
      .replace(/\{event\}/g, eventTitle)
      .replace(/\{event\.title\}/g, eventTitle)
      .replace(/\{time\}/g, timeUntil);

    body = body
      .replace(/\{event\}/g, eventTitle)
      .replace(/\{event\.title\}/g, eventTitle)
      .replace(/\{time\}/g, timeUntil);

    await createBulkNotifications(userIds, {
      type: 'event_reminder',
      category: 'events',
      title,
      body,
      actionUrl: `/s/${spaceId}/events/${eventId}`,
      metadata: {
        spaceId,
        spaceName,
        eventId,
        eventTitle,
        eventStart: eventStart.toISOString(),
      },
    });
  } else if (action.type === 'send_message') {
    const config = action.config || {};
    const boardId = (config.boardId as string) || 'general';
    let content = (config.content as string) || `Reminder: ${eventTitle} is starting soon!`;

    const timeUntil = formatTimeUntil(eventStart);
    content = content
      .replace(/\{event\}/g, eventTitle)
      .replace(/\{event\.title\}/g, eventTitle)
      .replace(/\{time\}/g, timeUntil);

    // Find the target board
    let targetBoardId = boardId;
    if (boardId === 'general') {
      const generalBoard = await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('boards')
        .where('name', '==', 'General')
        .limit(1)
        .get();

      if (!generalBoard.empty) {
        targetBoardId = generalBoard.docs[0].id;
      }
    }

    // Send message
    await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards')
      .doc(targetBoardId)
      .collection('messages')
      .add({
        content,
        authorId: 'system',
        authorName: 'HIVE Bot',
        authorAvatarUrl: null,
        authorRole: 'system',
        type: 'system',
        timestamp: Date.now(),
        isDeleted: false,
        isPinned: false,
        reactions: [],
        threadCount: 0,
        metadata: {
          isEventReminder: true,
          eventId,
          eventTitle,
        },
      });
  }
}

/**
 * Execute scheduled action
 */
async function executeScheduledAction(
  action: { type: string; config?: Record<string, unknown> },
  spaceId: string,
  automation: Record<string, unknown>
): Promise<void> {
  if (!action) return;

  if (action.type === 'send_message') {
    const config = action.config || {};
    const boardId = (config.boardId as string) || 'general';
    const content = (config.content as string) || 'Scheduled message';

    let targetBoardId = boardId;
    if (boardId === 'general') {
      const generalBoard = await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('boards')
        .where('name', '==', 'General')
        .limit(1)
        .get();

      if (!generalBoard.empty) {
        targetBoardId = generalBoard.docs[0].id;
      }
    }

    await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('boards')
      .doc(targetBoardId)
      .collection('messages')
      .add({
        content,
        authorId: 'system',
        authorName: 'HIVE Bot',
        authorAvatarUrl: null,
        authorRole: 'system',
        type: 'system',
        timestamp: Date.now(),
        isDeleted: false,
        isPinned: false,
        reactions: [],
        threadCount: 0,
        metadata: {
          isScheduledMessage: true,
          automationName: automation.name,
        },
      });
  } else if (action.type === 'notify') {
    const config = action.config || {};
    const recipients = (config.recipients as string) || 'all';

    let userIds: string[] = [];

    if (recipients === 'leaders') {
      const leadersSnapshot = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('role', 'in', ['owner', 'admin', 'moderator', 'leader'])
        .where('isActive', '==', true)
        .get();

      userIds = leadersSnapshot.docs.map(d => d.data().userId);
    } else {
      const membersSnapshot = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('isActive', '==', true)
        .get();

      userIds = membersSnapshot.docs.map(d => d.data().userId);
    }

    if (userIds.length === 0) return;

    const title = (config.title as string) || 'Scheduled Notification';
    const body = (config.body as string) || '';

    await createBulkNotifications(userIds, {
      type: 'system',
      category: 'spaces',
      title,
      body,
      actionUrl: `/s/${spaceId}`,
      metadata: {
        spaceId,
        isScheduledNotification: true,
        automationName: automation.name,
      },
    });
  }
}

/**
 * Format time until event
 */
function formatTimeUntil(eventStart: Date): string {
  const now = new Date();
  const diff = eventStart.getTime() - now.getTime();
  const minutes = Math.round(diff / (1000 * 60));

  if (minutes < 60) {
    return `in ${minutes} minutes`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  }

  const days = Math.round(hours / 24);
  return `in ${days} day${days > 1 ? 's' : ''}`;
}


/**
 * Process tool_state_change automations
 * Checks deployed tool shared state against trigger conditions
 */
async function processToolStateTriggers(
  now: Date,
  results: AutomationResult[]
): Promise<void> {
  const spacesSnapshot = await dbAdmin.collection('spaces').get();

  for (const spaceDoc of spacesSnapshot.docs) {
    const spaceId = spaceDoc.id;

    // Get tool_state_change automations for this space
    const automationsSnapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('automations')
      .where('trigger.type', '==', 'tool_state_change')
      .where('enabled', '==', true)
      .get();

    if (automationsSnapshot.empty) continue;

    for (const automationDoc of automationsSnapshot.docs) {
      const automation = automationDoc.data();
      const trigger = automation.trigger || {};
      const config = trigger.config || {};

      const deploymentId = config.deploymentId as string;
      const watchPath = config.watchPath as string;
      const operator = config.operator as string;
      const threshold = config.value;

      if (!deploymentId || !watchPath || !operator || threshold === undefined) continue;

      // Cooldown: 1 hour between triggers
      const lastTriggered = automation.stats?.lastTriggered;
      if (lastTriggered) {
        const lastTime = lastTriggered.toDate ? lastTriggered.toDate() : new Date(lastTriggered);
        if (now.getTime() - lastTime.getTime() < 60 * 60 * 1000) continue;
      }

      try {
        // Read the deployment's shared state
        const stateDoc = await dbAdmin
          .collection('deployedTools')
          .doc(deploymentId)
          .collection('sharedState')
          .doc('current')
          .get();

        if (!stateDoc.exists) continue;

        const state = stateDoc.data() || {};

        // Resolve watchPath (e.g. 'counters.poll_001:total')
        const currentValue = resolveDotPath(state, watchPath);
        if (currentValue === undefined) continue;

        // Evaluate condition
        if (!evaluateCondition(currentValue, operator, threshold)) continue;

        // Condition met — execute the automation action
        await executeScheduledAction(
          automation.action,
          spaceId,
          automation
        );

        // Update stats
        await automationDoc.ref.update({
          'stats.timesTriggered': FieldValue.increment(1),
          'stats.successCount': FieldValue.increment(1),
          'stats.lastTriggered': now,
        });

        results.push({
          automationId: automationDoc.id,
          spaceId,
          type: 'tool_state_change',
          success: true,
        });

        logger.info('Tool state change automation triggered', {
          automationId: automationDoc.id,
          spaceId,
          deploymentId,
          watchPath,
          currentValue,
          threshold,
        });
      } catch (error) {
        await automationDoc.ref.update({
          'stats.timesTriggered': FieldValue.increment(1),
          'stats.failureCount': FieldValue.increment(1),
          'stats.lastTriggered': now,
        });

        results.push({
          automationId: automationDoc.id,
          spaceId,
          type: 'tool_state_change',
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}

/**
 * Resolve a dot-path (e.g. 'counters.poll_001:total') to a value
 */
function resolveDotPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Evaluate a comparison condition
 */
function evaluateCondition(current: unknown, operator: string, threshold: unknown): boolean {
  const numCurrent = typeof current === 'number' ? current : Number(current);
  const numThreshold = typeof threshold === 'number' ? threshold : Number(threshold);

  if (isNaN(numCurrent) || isNaN(numThreshold)) {
    // Fall back to string comparison for 'eq'
    if (operator === 'eq') return String(current) === String(threshold);
    return false;
  }

  switch (operator) {
    case 'eq': return numCurrent === numThreshold;
    case 'gt': return numCurrent > numThreshold;
    case 'gte': return numCurrent >= numThreshold;
    case 'lt': return numCurrent < numThreshold;
    case 'lte': return numCurrent <= numThreshold;
    default: return false;
  }
}

// Also support GET for Vercel Cron
async function _GET(request: Request) {
  return POST(request);
}

export const GET = withCache(_GET, 'PRIVATE');

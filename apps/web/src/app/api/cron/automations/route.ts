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
import { createBulkNotifications, notifyRitualCheckIn } from '@/lib/notification-service';

const CRON_SECRET = process.env.CRON_SECRET;

interface AutomationResult {
  automationId: string;
  spaceId: string;
  type: string;
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
    // 1. Process event_reminder automations
    await processEventReminders(now, results);

    // 2. Process scheduled automations
    await processScheduledAutomations(now, results);

    // 3. Process ritual check-in reminders (daily at ~9am)
    await processRitualReminders(now, results);

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
 * Process ritual check-in reminders
 * Sends daily reminders to participants of active rituals
 */
async function processRitualReminders(
  now: Date,
  results: AutomationResult[]
): Promise<void> {
  // Only run during morning hours (8am-10am local time)
  const currentHour = now.getHours();
  if (currentHour < 8 || currentHour > 10) return;

  try {
    // Get all active rituals
    const ritualsSnapshot = await dbAdmin
      .collection('rituals')
      .where('phase', '==', 'active')
      .get();

    if (ritualsSnapshot.empty) return;

    for (const ritualDoc of ritualsSnapshot.docs) {
      const ritual = ritualDoc.data();
      const ritualId = ritualDoc.id;

      // Handle both 'title' (typed) and 'name' (legacy) field names
      const ritualName = (ritual.title || ritual.name || 'Ritual') as string;
      const ritualSlug = (ritual.slug || ritualId) as string;

      // Get active participants who haven't checked in today
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const participantsSnapshot = await dbAdmin
        .collection('ritual_participants')
        .where('ritualId', '==', ritualId)
        .where('status', '==', 'active')
        .get();

      if (participantsSnapshot.empty) continue;

      let sentCount = 0;
      for (const participantDoc of participantsSnapshot.docs) {
        const participant = participantDoc.data();

        // Check if already participated today
        const lastParticipated = participant.lastParticipatedAt
          ? new Date(participant.lastParticipatedAt)
          : null;

        if (lastParticipated && lastParticipated >= todayStart) {
          // Already checked in today, skip
          continue;
        }

        // Send reminder notification
        try {
          await notifyRitualCheckIn({
            userId: participant.userId,
            ritualId,
            ritualName,
            ritualSlug,
            currentStreak: participant.streakCount || 0,
          });
          sentCount++;
        } catch (err) {
          logger.warn('Failed to send ritual check-in reminder', {
            error: err instanceof Error ? err.message : String(err),
            ritualId,
            userId: participant.userId,
          });
        }
      }

      if (sentCount > 0) {
        results.push({
          automationId: `ritual_reminder_${ritualId}`,
          spaceId: ritual.spaceId || 'global',
          type: 'ritual_reminder',
          success: true,
        });

        logger.info('Ritual check-in reminders sent', {
          ritualId,
          ritualName,
          sentCount,
        });
      }
    }
  } catch (error) {
    logger.error('Failed to process ritual reminders', {
      error: error instanceof Error ? error.message : String(error),
    });

    results.push({
      automationId: 'ritual_reminders',
      spaceId: 'global',
      type: 'ritual_reminder',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Also support GET for Vercel Cron
export async function GET(request: Request) {
  return POST(request);
}

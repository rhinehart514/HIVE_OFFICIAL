/**
 * Cron endpoint for event reminders (30-minute push notifications)
 *
 * Runs every 5 minutes via Vercel cron. Finds events starting in ~30 minutes
 * and sends push notifications to RSVP'd attendees.
 *
 * Vercel cron config in vercel.json:
 *   { "path": "/api/cron/event-reminders", "schedule": "*/5 * * * *" }
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { createNotification } from '@/lib/notification-service';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const now = new Date();
  const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000);
  const thirtyFiveMinFromNow = new Date(now.getTime() + 35 * 60 * 1000);

  try {
    // Find events starting in 30-35 minutes (5-minute window to match cron interval)
    const eventsSnapshot = await dbAdmin
      .collection('events')
      .where('startDate', '>=', thirtyMinFromNow)
      .where('startDate', '<', thirtyFiveMinFromNow)
      .get();

    if (eventsSnapshot.empty) {
      return NextResponse.json({ message: 'No events to remind about', count: 0 });
    }

    let remindersSent = 0;

    for (const eventDoc of eventsSnapshot.docs) {
      const event = eventDoc.data();
      const eventId = eventDoc.id;
      const spaceId = event.spaceId;

      // Check if reminder already sent
      const reminderKey = `reminder_30_${eventId}`;
      const existing = await dbAdmin.collection('sentReminders').doc(reminderKey).get();
      if (existing.exists) continue;

      // Get RSVP'd attendees
      const rsvpsSnapshot = await dbAdmin
        .collection('rsvps')
        .where('eventId', '==', eventId)
        .where('status', 'in', ['going', 'maybe'])
        .get();

      if (rsvpsSnapshot.empty) continue;

      const attendeeIds = rsvpsSnapshot.docs.map(d => d.data().userId);

      // Get space name for notification
      let spaceName = '';
      if (spaceId) {
        const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
        spaceName = spaceDoc.data()?.name || '';
      }

      const eventTitle = event.title || 'Event';
      const actionUrl = spaceId
        ? `/s/${spaceId}/events/${eventId}`
        : `/events/${eventId}`;

      // Send notification to each attendee
      for (const attendeeId of attendeeIds) {
        try {
          await createNotification({
            userId: attendeeId,
            type: 'event_reminder',
            category: 'events',
            title: `⏰ ${eventTitle} starts in 30 minutes`,
            body: spaceName ? `In ${spaceName} — don't miss it!` : "Don't miss it!",
            actionUrl,
            metadata: {
              eventId,
              eventTitle,
              spaceId: spaceId || '',
              spaceName,
              reminderMinutes: 30,
            },
          });
          remindersSent++;
        } catch (err) {
          logger.warn('Failed to send event reminder', {
            error: err instanceof Error ? err.message : String(err),
            eventId,
            attendeeId,
          });
        }
      }

      // Mark reminder as sent
      await dbAdmin.collection('sentReminders').doc(reminderKey).set({
        eventId,
        spaceId: spaceId || null,
        beforeMinutes: 30,
        sentAt: new Date().toISOString(),
        attendeeCount: attendeeIds.length,
      });

      logger.info('Event reminders sent', {
        eventId,
        eventTitle,
        attendeeCount: attendeeIds.length,
      });
    }

    return NextResponse.json({
      message: `Event reminders processed`,
      eventsChecked: eventsSnapshot.size,
      remindersSent,
    });
  } catch (error) {
    logger.error('Event reminder cron failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

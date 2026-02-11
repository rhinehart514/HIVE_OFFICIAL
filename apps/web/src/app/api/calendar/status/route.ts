/**
 * Calendar Status API Route
 *
 * GET /api/calendar/status
 *
 * Returns the user's calendar connection status.
 *
 * DELETE /api/calendar/status
 *
 * Disconnects the user's calendar.
 *
 * @author HIVE Backend Team
 * @version 1.0.0
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';
import { isCalendarOAuthConfigured } from '@/lib/calendar/google-oauth';
import { logger } from '@/lib/structured-logger';
import { withCache } from '../../../../lib/cache-headers';

// Zod schema for calendar sharing update
const CalendarSharingSchema = z.object({
  sharing: z.object({
    enabled: z.boolean(),
    spaceIds: z.array(z.string()).optional().default([]),
  }),
});

async function _GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if feature is available
    if (!isCalendarOAuthConfigured()) {
      return NextResponse.json({
        available: false,
        connected: false,
        message: 'Calendar integration not configured',
      });
    }

    // Check for existing connection
    const connectionDoc = await dbAdmin
      .collection('calendar_connections')
      .doc(session.userId)
      .get();

    if (!connectionDoc.exists) {
      return NextResponse.json({
        available: true,
        connected: false,
      });
    }

    const data = connectionDoc.data();

    return NextResponse.json({
      available: true,
      connected: data?.isActive ?? false,
      provider: data?.provider,
      connectedAt: data?.connectedAt?.toDate?.()?.toISOString() ?? null,
      lastSyncedAt: data?.lastSyncedAt?.toDate?.()?.toISOString() ?? null,
      sharing: data?.sharing ?? { enabled: true, spaceIds: [] },
    });
  } catch (error) {
    logger.error('Calendar status error', { component: 'calendar-status' }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the connection
    await dbAdmin
      .collection('calendar_connections')
      .doc(session.userId)
      .delete();

    // Also delete any availability data
    await dbAdmin
      .collection('availability')
      .doc(session.userId)
      .delete();

    logger.info('Calendar disconnected', {
      userId: session.userId,
      component: 'calendar-status',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Calendar disconnect error', { component: 'calendar-status' }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sharing } = CalendarSharingSchema.parse(await request.json());

    // Update sharing preferences
    await dbAdmin
      .collection('calendar_connections')
      .doc(session.userId)
      .update({
        sharing: {
          enabled: sharing.enabled,
          spaceIds: sharing.spaceIds,
        },
      });

    logger.info('Calendar sharing settings updated', {
      userId: session.userId,
      enabled: sharing.enabled,
      component: 'calendar-status',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Invalid sharing settings' }, { status: 400 });
    }
    logger.error('Calendar sharing update error', { component: 'calendar-status' }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withCache(_GET, 'PRIVATE');

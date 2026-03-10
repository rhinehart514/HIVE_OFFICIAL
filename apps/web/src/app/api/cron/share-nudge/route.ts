/**
 * Cron: Zero-response 4-hour share nudge
 *
 * If an app has 0 responses 4 hours after creation, nudge the creator
 * to share the link and get their first responses.
 *
 * Runs every 2 hours via Vercel cron.
 * Vercel cron config in vercel.json:
 *   { "path": "/api/cron/share-nudge", "schedule": "0 0,2,4,6,8,10,12,14,16,18,20,22 * * *" }
 */

import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { createNotification } from '@/lib/notification-service';
import { sendPushToUser } from '@/lib/server-push-notifications';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000);
  const fiveHoursAgo = new Date(now - 5 * 60 * 60 * 1000);

  try {
    // Find tools created 3-5 hours ago
    const toolsSnapshot = await dbAdmin
      .collection('tools')
      .where('createdAt', '>=', fiveHoursAgo)
      .where('createdAt', '<=', threeHoursAgo)
      .get();

    if (toolsSnapshot.empty) {
      return NextResponse.json({ message: 'No candidates found', nudgesSent: 0 });
    }

    const rtdb = admin.database();
    let nudgesSent = 0;

    for (const doc of toolsSnapshot.docs) {
      const toolId = doc.id;
      const data = doc.data();
      const creatorId = (data.ownerId ?? data.creatorId ?? data.createdBy) as string | undefined;
      if (!creatorId) continue;

      const toolName = (data.name as string) ?? 'your app';

      // Idempotency check
      const nudgeKey = `share_nudge_sent/${toolId}`;
      const alreadySent = await rtdb.ref(nudgeKey).once('value');
      if (alreadySent.exists()) continue;

      // Check RTDB for zero responses (no votes and no attendees)
      const [votesSnap, attendeesSnap] = await Promise.all([
        rtdb.ref(`shell_states/${toolId}/votes`).once('value'),
        rtdb.ref(`shell_states/${toolId}/attendees`).once('value'),
      ]);

      const hasResponses = votesSnap.exists() || attendeesSnap.exists();
      if (hasResponses) continue;

      // Mark as sent
      await rtdb.ref(nudgeKey).set({ sentAt: Date.now() });

      const title = `No one's seen ${toolName} yet — share the link to get responses`;

      await createNotification({
        userId: creatorId,
        type: 'system',
        category: 'tools',
        title,
        actionUrl: `/t/${toolId}`,
        metadata: {
          toolId,
          toolName,
          nudgeType: 'share_reminder',
          timestamp: new Date().toISOString(),
        },
      });

      sendPushToUser(creatorId, {
        title,
        data: {
          type: 'share_nudge',
          toolId,
          actionUrl: `/t/${toolId}`,
        },
      }).catch(() => {});

      nudgesSent++;

      logger.info('Share nudge sent', { toolId, creatorId });
    }

    return NextResponse.json({
      message: 'Share nudges processed',
      toolsChecked: toolsSnapshot.size,
      nudgesSent,
    });
  } catch (error) {
    logger.error('Share nudge cron failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

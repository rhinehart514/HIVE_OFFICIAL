/**
 * Cron: 72-hour second-creation nudge
 *
 * If a creator's first app got 5+ responses and they haven't created
 * a second within 72 hours, nudge them to create again.
 *
 * Runs every 6 hours via Vercel cron.
 * Vercel cron config in vercel.json:
 *   { "path": "/api/cron/creation-nudge", "schedule": "0 0,6,12,18 * * *" }
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
  const sixtyHoursAgo = new Date(now - 60 * 60 * 60 * 1000);
  const eightyFourHoursAgo = new Date(now - 84 * 60 * 60 * 1000);

  try {
    // Find users with exactly 1 tool created 60-84h ago
    // Query tools created in the window, then group by creator
    const toolsSnapshot = await dbAdmin
      .collection('tools')
      .where('createdAt', '>=', eightyFourHoursAgo)
      .where('createdAt', '<=', sixtyHoursAgo)
      .get();

    if (toolsSnapshot.empty) {
      return NextResponse.json({ message: 'No candidates found', nudgesSent: 0 });
    }

    // Group tools by creator
    const creatorTools: Record<string, Array<{ id: string; name: string; createdAt: Date }>> = {};
    for (const doc of toolsSnapshot.docs) {
      const data = doc.data();
      const creatorId = (data.ownerId ?? data.creatorId ?? data.createdBy) as string | undefined;
      if (!creatorId) continue;

      if (!creatorTools[creatorId]) {
        creatorTools[creatorId] = [];
      }
      const createdAt = data.createdAt instanceof admin.firestore.Timestamp
        ? data.createdAt.toDate()
        : new Date(data.createdAt as string);
      creatorTools[creatorId].push({
        id: doc.id,
        name: (data.name as string) ?? 'your app',
        createdAt,
      });
    }

    const rtdb = admin.database();
    let nudgesSent = 0;

    for (const [creatorId, tools] of Object.entries(creatorTools)) {
      // Check if user has only 1 tool total (not just 1 in the window)
      const allToolsSnap = await dbAdmin
        .collection('tools')
        .where('ownerId', '==', creatorId)
        .limit(2)
        .get();

      // Also check createdBy field for backwards compat
      let totalTools = allToolsSnap.size;
      if (totalTools < 2) {
        const altSnap = await dbAdmin
          .collection('tools')
          .where('createdBy', '==', creatorId)
          .limit(2)
          .get();
        // Deduplicate
        const allIds = new Set([
          ...allToolsSnap.docs.map(d => d.id),
          ...altSnap.docs.map(d => d.id),
        ]);
        totalTools = allIds.size;
      }

      if (totalTools > 1) continue; // Already created a second tool

      // Idempotency check
      const nudgeKey = `creation_nudge_sent/${creatorId}`;
      const alreadySent = await rtdb.ref(nudgeKey).once('value');
      if (alreadySent.exists()) continue;

      // Check response count for their tool
      const tool = tools[0];
      const votesSnap = await rtdb.ref(`shell_states/${tool.id}/votes`).once('value');
      const attendeesSnap = await rtdb.ref(`shell_states/${tool.id}/attendees`).once('value');
      const responseCount =
        (votesSnap.exists() ? Object.keys(votesSnap.val() ?? {}).length : 0) +
        (attendeesSnap.exists() ? Object.keys(attendeesSnap.val() ?? {}).length : 0);

      if (responseCount < 5) continue;

      // Mark as sent
      await rtdb.ref(nudgeKey).set({ sentAt: Date.now(), toolId: tool.id });

      const title = `${tool.name} got ${responseCount} responses — what will you make next?`;

      await createNotification({
        userId: creatorId,
        type: 'system',
        category: 'tools',
        title,
        actionUrl: '/build',
        metadata: {
          toolId: tool.id,
          toolName: tool.name,
          responseCount,
          nudgeType: 'second_creation',
          timestamp: new Date().toISOString(),
        },
      });

      sendPushToUser(creatorId, {
        title,
        data: {
          type: 'creation_nudge',
          actionUrl: '/build',
        },
      }).catch(() => {});

      nudgesSent++;

      logger.info('Creation nudge sent', {
        creatorId,
        toolId: tool.id,
        responseCount,
      });
    }

    return NextResponse.json({
      message: 'Creation nudges processed',
      candidatesChecked: Object.keys(creatorTools).length,
      nudgesSent,
    });
  } catch (error) {
    logger.error('Creation nudge cron failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

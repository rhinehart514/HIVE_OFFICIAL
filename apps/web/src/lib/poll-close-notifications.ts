/**
 * Poll-Close Notifications
 *
 * When a poll is closed by its creator, notify everyone who voted
 * with the winning result. Closes the engagement loop — "You voted,
 * here's what won."
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { createBulkNotifications } from '@/lib/notification-service';
import { sendPushToUser } from '@/lib/server-push-notifications';

/**
 * Notify all voters that a poll has closed with the result.
 * Idempotent — checks RTDB flag before sending.
 */
export async function notifyPollClosed(toolId: string): Promise<void> {
  const rtdb = admin.database();

  try {
    // Idempotency: skip if already sent
    const alreadySent = await rtdb.ref(`poll_close_sent/${toolId}`).once('value');
    if (alreadySent.exists()) return;

    // Mark as sent immediately to prevent duplicates
    await rtdb.ref(`poll_close_sent/${toolId}`).set({ sentAt: Date.now() });

    // Fetch tool metadata from Firestore
    const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();
    if (!toolDoc.exists) return;

    const toolData = toolDoc.data();
    const toolName = (toolData?.name as string) ?? 'a poll';

    // Fetch all votes from RTDB
    const votesSnap = await rtdb.ref(`shell_states/${toolId}/votes`).once('value');
    const votes = votesSnap.val();
    if (!votes) return;

    // Extract unique authenticated user IDs (skip anon: prefixed)
    const voterIds = new Set<string>();
    const optionCounts: Record<number, number> = {};

    for (const vote of Object.values(votes) as Array<{ userId?: string; optionIndex?: number }>) {
      if (vote.userId && !vote.userId.startsWith('anon:')) {
        voterIds.add(vote.userId);
      }
      if (typeof vote.optionIndex === 'number') {
        optionCounts[vote.optionIndex] = (optionCounts[vote.optionIndex] ?? 0) + 1;
      }
    }

    if (voterIds.size === 0) return;

    // Determine winning option
    const totalVotes = Object.values(optionCounts).reduce((sum, c) => sum + c, 0);
    const winningIndex = Object.entries(optionCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    // Try to get the option label from the tool's elements
    let winningLabel = `Option ${Number(winningIndex) + 1}`;
    const elements = toolData?.elements as Array<{ options?: string[] }> | undefined;
    if (elements) {
      for (const el of elements) {
        if (el.options && Array.isArray(el.options) && el.options[Number(winningIndex)]) {
          winningLabel = el.options[Number(winningIndex)];
          break;
        }
      }
    }

    const winningVotes = optionCounts[Number(winningIndex)] ?? 0;
    const title = `Results are in: ${winningLabel} won with ${winningVotes} vote${winningVotes === 1 ? '' : 's'} on ${toolName}`;

    // Create in-app notifications for all voters
    const userIdArray = Array.from(voterIds);
    await createBulkNotifications(userIdArray, {
      type: 'tool.social_proof',
      category: 'tools',
      title,
      body: `${totalVotes} total vote${totalVotes === 1 ? '' : 's'} were cast`,
      actionUrl: `/t/${toolId}`,
      metadata: {
        toolId,
        event: 'poll_closed',
        winningOption: winningLabel,
        winningVotes,
        totalVotes,
        timestamp: new Date().toISOString(),
      },
    });

    // Send push notifications (fire-and-forget per user)
    for (const userId of userIdArray) {
      sendPushToUser(userId, {
        title,
        body: `${totalVotes} total vote${totalVotes === 1 ? '' : 's'} were cast`,
        data: {
          type: 'poll_closed',
          toolId,
          actionUrl: `/t/${toolId}`,
        },
      }).catch(() => {
        // Non-critical — push is best-effort
      });
    }

    logger.info('Poll-close notifications sent', {
      toolId,
      voterCount: userIdArray.length,
      totalVotes,
      winningOption: winningLabel,
    });
  } catch (error) {
    logger.error('Poll-close notification failed', {
      toolId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

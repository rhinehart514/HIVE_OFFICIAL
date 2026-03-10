/**
 * Social-Proof & Milestone Notifications
 *
 * When an app hits engagement thresholds (5, 15, 50, 100 responses),
 * notify the creator with social-proof copy:
 * "Jordan and 4 others voted on your poll"
 *
 * When it hits milestone thresholds (10, 50, 100, 500, 1000),
 * notify with milestone copy:
 * "Your Best Study Spot hit 100 responses!"
 *
 * This is the primary pull-back mechanism — the reason a creator returns.
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { createNotification } from '@/lib/notification-service';
import { sendPushToUser } from '@/lib/server-push-notifications';
import { notifyToolMilestone, TOOL_MILESTONE_THRESHOLDS } from '@/lib/tool-notifications';

const SOCIAL_PROOF_THRESHOLDS = [5, 15, 50, 100] as const;

const ACTION_VERBS: Record<string, string> = {
  poll_vote: 'voted on',
  bracket_vote: 'voted on',
  rsvp_toggle: "RSVP'd to",
};

/**
 * Check if a tool just crossed a social-proof or milestone threshold
 * and notify the creator. Called fire-and-forget after each engagement action.
 */
export async function checkSocialProofThreshold(
  toolId: string,
  actionType: string,
  latestParticipantName?: string,
): Promise<void> {
  const rtdb = admin.database();

  // Count unique participants based on action type
  let participantCount = 0;
  let participantNames: string[] = [];

  try {
    const basePath = `shell_states/${toolId}`;

    if (actionType === 'poll_vote') {
      const votesSnap = await rtdb.ref(`${basePath}/votes`).once('value');
      const votes = votesSnap.val();
      if (votes) {
        const entries = Object.values(votes) as Array<{ userId?: string; displayName?: string }>;
        participantCount = entries.length;
        participantNames = entries
          .filter((v) => v.displayName && !v.userId?.startsWith('anon:'))
          .map((v) => v.displayName as string)
          .slice(-3);
      }
    } else if (actionType === 'rsvp_toggle') {
      const attendeesSnap = await rtdb.ref(`${basePath}/attendees`).once('value');
      const attendees = attendeesSnap.val();
      if (attendees) {
        const entries = Object.values(attendees) as Array<{ displayName?: string }>;
        participantCount = entries.length;
        participantNames = entries
          .filter((a) => a.displayName && a.displayName !== 'Guest')
          .map((a) => a.displayName as string)
          .slice(-3);
      }
    } else if (actionType === 'bracket_vote') {
      const stateSnap = await rtdb.ref(basePath).once('value');
      const state = stateSnap.val();
      const voterSet = new Set<string>();
      if (state?.matchups) {
        for (const matchup of Object.values(state.matchups) as Array<{ votes?: Record<string, string> }>) {
          if (matchup?.votes) {
            for (const oderId of Object.keys(matchup.votes)) {
              voterSet.add(oderId);
            }
          }
        }
      }
      participantCount = voterSet.size;
    }

    if (participantCount === 0) return;

    // Look up the tool creator (needed for both social proof and milestones)
    const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();
    if (!toolDoc.exists) return;

    const toolData = toolDoc.data();
    const creatorId = (toolData?.ownerId ?? toolData?.creatorId ?? toolData?.createdBy) as string | undefined;
    if (!creatorId) return;

    const toolName = (toolData?.name as string) ?? 'your app';
    const toolFormat = (toolData?.format as string) ?? 'app';

    // --- Social-proof threshold check ---
    const hitThreshold = SOCIAL_PROOF_THRESHOLDS.find((t) => participantCount === t);
    if (hitThreshold) {
      const notifKey = `social_proof_sent/${toolId}/${hitThreshold}`;
      const alreadySent = await rtdb.ref(notifKey).once('value');
      if (!alreadySent.exists()) {
        await rtdb.ref(notifKey).set({ sentAt: Date.now() });

        const verb = ACTION_VERBS[actionType] ?? 'used';
        const formatLabel = toolFormat === 'poll' ? 'poll'
          : toolFormat === 'bracket' ? 'bracket'
          : toolFormat === 'rsvp' ? 'RSVP'
          : 'app';

        const leadName = latestParticipantName
          || (participantNames.length > 0 ? participantNames[participantNames.length - 1] : null);

        const othersCount = participantCount - 1;
        const title = leadName
          ? `${leadName} and ${othersCount} other${othersCount === 1 ? '' : 's'} ${verb} your ${formatLabel}`
          : `${participantCount} people ${verb} your ${formatLabel}`;

        const body = `"${toolName}" is getting responses — check it out`;

        await createNotification({
          userId: creatorId,
          type: 'tool.social_proof',
          category: 'tools',
          title,
          body,
          actionUrl: `/t/${toolId}`,
          metadata: {
            toolId,
            threshold: hitThreshold,
            participantCount,
            timestamp: new Date().toISOString(),
          },
        });

        await sendPushToUser(creatorId, {
          title,
          body,
          data: {
            type: 'social_proof',
            toolId,
            actionUrl: `/t/${toolId}`,
          },
        });

        logger.info('Social-proof notification sent', {
          toolId,
          creatorId,
          threshold: hitThreshold,
          participantCount,
        });
      }
    }

    // --- Milestone threshold check (independent from social proof) ---
    const hitMilestone = TOOL_MILESTONE_THRESHOLDS.find((t) => participantCount === t);
    if (hitMilestone) {
      const milestoneKey = `milestone_sent/${toolId}/${hitMilestone}`;
      const milestoneAlreadySent = await rtdb.ref(milestoneKey).once('value');
      if (!milestoneAlreadySent.exists()) {
        await rtdb.ref(milestoneKey).set({ sentAt: Date.now() });
        await notifyToolMilestone({
          creatorId,
          toolId,
          toolName,
          milestone: hitMilestone,
        });
        logger.info('Milestone notification sent', { toolId, creatorId, milestone: hitMilestone });
      }
    }
  } catch (error) {
    logger.error('Social-proof threshold check failed', {
      toolId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

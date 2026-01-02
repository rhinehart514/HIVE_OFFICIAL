import { z } from "zod";
import { RitualEngineService } from "@hive/core";
import { logger } from "@/lib/logger";
import { dbAdmin } from "@/lib/firebase-admin";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { isRitualsEnabled } from "@/lib/feature-flags";
import { FieldValue } from "firebase-admin/firestore";

interface RouteParams {
  params: Promise<{ ritualId: string }>;
}

const participateSchema = z.object({
  action: z.string().min(1).max(100),
  points: z.number().min(0).max(1000).default(10),
  metadata: z.record(z.unknown()).optional(),
});

type ParticipateData = z.output<typeof participateSchema>;

/**
 * POST /api/rituals/[ritualId]/participate - Record a participation action
 *
 * Awards points and updates streak for the user.
 */
export const POST = withAuthValidationAndErrors(
  participateSchema as unknown as z.ZodType<ParticipateData>,
  async (request, context: RouteParams, body: ParticipateData, respond) => {
    const req = request as AuthenticatedRequest;
    const userId = getUserId(req);
    const campusId = getCampusId(req);
    const { ritualId } = await context.params;

    // Check feature flag
    const ritualsEnabled = await isRitualsEnabled({ userId, schoolId: campusId });
    if (!ritualsEnabled) {
      return respond.error("Rituals feature is not enabled", "FEATURE_DISABLED", {
        status: 403,
      });
    }

    try {
      const service = new RitualEngineService(undefined, { campusId });

      // Verify ritual exists and is active
      const ritualResult = await service.getRitual(ritualId);
      if (ritualResult.isFailure) {
        return respond.error("Ritual not found", "NOT_FOUND", { status: 404 });
      }

      const ritual = ritualResult.getValue();

      if (ritual.phase !== "active") {
        return respond.error(
          "Ritual is not currently active",
          "NOT_ACTIVE",
          { status: 400 }
        );
      }

      // Check if participating
      const participantRef = dbAdmin
        .collection("ritual_participants")
        .doc(`${ritualId}_${userId}`);

      const participantDoc = await participantRef.get();

      if (!participantDoc.exists || participantDoc.data()?.status !== "active") {
        return respond.error(
          "Must join ritual before participating",
          "NOT_JOINED",
          { status: 400 }
        );
      }

      const now = new Date().toISOString();
      const participant = participantDoc.data()!;

      // Calculate streak
      const lastParticipated = participant.lastParticipatedAt
        ? new Date(participant.lastParticipatedAt)
        : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let newStreak = participant.streakCount || 0;
      if (lastParticipated) {
        const lastDate = new Date(lastParticipated);
        lastDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor(
          (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          // Consecutive day - increment streak
          newStreak += 1;
        } else if (daysDiff > 1) {
          // Streak broken - reset
          newStreak = 1;
        }
        // daysDiff === 0 means same day, keep current streak
      } else {
        newStreak = 1;
      }

      // Update participation record
      await participantRef.update({
        lastParticipatedAt: now,
        completionCount: FieldValue.increment(1),
        streakCount: newStreak,
        totalPoints: FieldValue.increment(body.points),
        [`actions.${body.action}`]: FieldValue.increment(1),
      });

      // Log participation action
      await dbAdmin.collection("ritual_actions").add({
        ritualId,
        userId,
        campusId,
        action: body.action,
        points: body.points,
        metadata: body.metadata || {},
        timestamp: now,
      });

      logger.info("Recorded ritual participation", {
        ritualId,
        userId,
        action: body.action,
        points: body.points,
        streak: newStreak,
      });

      return respond.success({
        recorded: true,
        points: body.points,
        streak: newStreak,
        totalPoints: (participant.totalPoints || 0) + body.points,
      });
    } catch (error) {
      logger.error("Error recording participation", {
        error: error instanceof Error ? error.message : String(error),
        ritualId,
        userId,
      });
      return respond.error("Failed to record participation", "INTERNAL_ERROR", {
        status: 500,
      });
    }
  }
);

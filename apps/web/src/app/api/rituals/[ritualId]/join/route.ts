import { RitualEngineService } from "@hive/core";
import { logger } from "@/lib/logger";
import { dbAdmin } from "@/lib/firebase-admin";
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { isRitualsEnabled } from "@/lib/feature-flags";
import { notifyRitualJoined } from "@/lib/notification-service";

interface RouteParams {
  params: Promise<{ ritualId: string }>;
}

/**
 * POST /api/rituals/[ritualId]/join - Join a ritual
 *
 * Creates a participation record for the user.
 * Some archetypes have capacity limits (e.g., FoundingClass).
 */
export const POST = withAuthAndErrors(
  async (request, context: RouteParams, respond) => {
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

      // Verify ritual exists and is joinable
      const ritualResult = await service.getRitual(ritualId);
      if (ritualResult.isFailure) {
        return respond.error("Ritual not found", "NOT_FOUND", { status: 404 });
      }

      const ritual = ritualResult.getValue();

      // Check if ritual is in joinable phase
      if (!["announced", "active"].includes(ritual.phase)) {
        return respond.error(
          "Ritual is not currently accepting participants",
          "NOT_JOINABLE",
          { status: 400 }
        );
      }

      // Check capacity for capacity-limited archetypes
      const archetypeStr = String(ritual.archetype).toLowerCase();
      if (archetypeStr === "founding_class" || archetypeStr === "FOUNDING_CLASS".toLowerCase()) {
        const config = ritual.config as { totalSlots?: number; founding?: { limit?: number } };
        const totalSlots = config?.totalSlots || 100;

        // Count current participants
        const participantsSnapshot = await dbAdmin
          .collection("ritual_participants")
          .where("ritualId", "==", ritualId)
          .where("status", "==", "active")
          .count()
          .get();

        const currentCount = participantsSnapshot.data().count;

        if (currentCount >= totalSlots) {
          return respond.error(
            "Ritual has reached capacity",
            "CAPACITY_REACHED",
            { status: 400 }
          );
        }
      }

      // Check if already joined
      const existingDoc = await dbAdmin
        .collection("ritual_participants")
        .doc(`${ritualId}_${userId}`)
        .get();

      if (existingDoc.exists) {
        const data = existingDoc.data();
        if (data?.status === "active") {
          return respond.error(
            "Already joined this ritual",
            "ALREADY_JOINED",
            { status: 400 }
          );
        }
      }

      // Create participation record
      const now = new Date().toISOString();
      const participantData = {
        ritualId,
        userId,
        campusId,
        status: "active",
        joinedAt: now,
        lastParticipatedAt: now,
        completionCount: 0,
        streakCount: 0,
        totalPoints: 0,
        achievements: [],
        metadata: {},
      };

      await dbAdmin
        .collection("ritual_participants")
        .doc(`${ritualId}_${userId}`)
        .set(participantData);

      logger.info("User joined ritual", {
        ritualId,
        userId,
        archetype: ritual.archetype,
        campusId,
      });

      // Send welcome notification (non-blocking)
      notifyRitualJoined({
        userId,
        ritualId,
        ritualName: ritual.title,
        ritualSlug: ritual.slug || ritualId,
      }).catch((err) => {
        logger.warn("Failed to send ritual join notification", {
          error: err instanceof Error ? err.message : String(err),
          ritualId,
          userId,
        });
      });

      return respond.success({
        joined: true,
        participation: participantData,
      });
    } catch (error) {
      logger.error("Error joining ritual", {
        error: error instanceof Error ? error.message : String(error),
        ritualId,
        userId,
      });
      return respond.error("Failed to join ritual", "INTERNAL_ERROR", {
        status: 500,
      });
    }
  }
);

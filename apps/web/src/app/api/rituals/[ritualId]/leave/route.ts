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

interface RouteParams {
  params: Promise<{ ritualId: string }>;
}

/**
 * POST /api/rituals/[ritualId]/leave - Leave a ritual
 *
 * Marks participation as inactive. Some archetypes may not allow leaving.
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

      // Verify ritual exists
      const ritualResult = await service.getRitual(ritualId);
      if (ritualResult.isFailure) {
        return respond.error("Ritual not found", "NOT_FOUND", { status: 404 });
      }

      const ritual = ritualResult.getValue();

      // Some archetypes don't allow leaving (e.g., founding_class once joined)
      const archetypeStr = String(ritual.archetype).toLowerCase();
      if (archetypeStr === "founding_class") {
        return respond.error(
          "Cannot leave a Founding Class ritual",
          "LEAVE_NOT_ALLOWED",
          { status: 400 }
        );
      }

      // Check if participating
      const participantDoc = await dbAdmin
        .collection("ritual_participants")
        .doc(`${ritualId}_${userId}`)
        .get();

      if (!participantDoc.exists || participantDoc.data()?.status !== "active") {
        return respond.error(
          "Not currently participating in this ritual",
          "NOT_PARTICIPATING",
          { status: 400 }
        );
      }

      // Mark as inactive
      await dbAdmin
        .collection("ritual_participants")
        .doc(`${ritualId}_${userId}`)
        .update({
          status: "left",
          leftAt: new Date().toISOString(),
        });

      logger.info("User left ritual", {
        ritualId,
        userId,
        archetype: ritual.archetype,
        campusId,
      });

      return respond.success({ left: true });
    } catch (error) {
      logger.error("Error leaving ritual", {
        error: error instanceof Error ? error.message : String(error),
        ritualId,
        userId,
      });
      return respond.error("Failed to leave ritual", "INTERNAL_ERROR", {
        status: 500,
      });
    }
  }
);

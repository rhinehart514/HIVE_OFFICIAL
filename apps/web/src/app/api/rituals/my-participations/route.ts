import { logger } from "@/lib/logger";
import { dbAdmin } from "@/lib/firebase-admin";
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { isRitualsEnabled } from "@/lib/feature-flags";

/**
 * GET /api/rituals/my-participations - Get user's ritual participations
 *
 * Returns ritual IDs and participation stats for all rituals the user has joined.
 */
export const GET = withAuthAndErrors(async (request, context, respond) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = getCampusId(req);

  // Check feature flag
  const ritualsEnabled = await isRitualsEnabled({ userId, schoolId: campusId });
  if (!ritualsEnabled) {
    return respond.error("Rituals feature is not enabled", "FEATURE_DISABLED", {
      status: 403,
    });
  }

  try {
    // Query all active participations for this user
    const participationsSnap = await dbAdmin
      .collection("ritual_participants")
      .where("userId", "==", userId)
      .where("campusId", "==", campusId)
      .where("status", "==", "active")
      .get();

    const participations = participationsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        ritualId: data.ritualId,
        joinedAt: data.joinedAt,
        lastParticipatedAt: data.lastParticipatedAt,
        completionCount: data.completionCount || 0,
        streakCount: data.streakCount || 0,
        totalPoints: data.totalPoints || 0,
      };
    });

    // Build a simple map of ritualId -> true for quick lookup
    const participatingIds = participations.map((p) => p.ritualId);

    logger.info("Fetched user participations", {
      userId,
      campusId,
      count: participations.length,
    });

    return respond.success({
      participations,
      participatingIds,
    });
  } catch (error) {
    logger.error("Error fetching user participations", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      campusId,
    });
    return respond.error("Failed to fetch participations", "INTERNAL_ERROR", {
      status: 500,
    });
  }
});

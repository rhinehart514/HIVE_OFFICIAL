import { RitualEngineService } from "@hive/core";
import { logger } from "@/lib/logger";
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { isRitualsEnabled } from "@/lib/feature-flags";

/**
 * GET /api/rituals/active - Get active rituals for the campus
 *
 * Returns rituals that are currently in "announced" or "active" phase.
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
    const service = new RitualEngineService(undefined, { campusId });
    const result = await service.listActiveRituals(campusId);

    if (result.isFailure) {
      logger.error("Failed to list active rituals", {
        error: result.error,
        campusId,
      });
      return respond.error(
        "Failed to load active rituals",
        "INTERNAL_ERROR",
        { status: 500 }
      );
    }

    const rituals = result.getValue();

    logger.info("Listed active rituals", {
      count: rituals.length,
      campusId,
    });

    return respond.success({ rituals });
  } catch (error) {
    logger.error("Error listing active rituals", {
      error: error instanceof Error ? error.message : String(error),
      campusId,
    });
    return respond.error("Failed to load active rituals", "INTERNAL_ERROR", {
      status: 500,
    });
  }
});

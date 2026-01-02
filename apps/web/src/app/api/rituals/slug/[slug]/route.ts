import { RitualEngineService } from "@hive/core";
import { logger } from "@/lib/logger";
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { isRitualsEnabled } from "@/lib/feature-flags";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/rituals/slug/[slug] - Get a ritual by its slug
 *
 * Slugs are human-readable identifiers for rituals (e.g., "founding-class-2025")
 */
export const GET = withAuthAndErrors(
  async (request, context: RouteParams, respond) => {
    const req = request as AuthenticatedRequest;
    const userId = getUserId(req);
    const campusId = getCampusId(req);
    const { slug } = await context.params;

    // Check feature flag
    const ritualsEnabled = await isRitualsEnabled({ userId, schoolId: campusId });
    if (!ritualsEnabled) {
      return respond.error("Rituals feature is not enabled", "FEATURE_DISABLED", {
        status: 403,
      });
    }

    try {
      const service = new RitualEngineService(undefined, { campusId });
      const result = await service.getRitualBySlug(slug, campusId);

      if (result.isFailure) {
        return respond.error("Ritual not found", "NOT_FOUND", { status: 404 });
      }

      const ritual = result.getValue();

      // Check visibility
      if (ritual.visibility === "secret" && ritual.campusId !== campusId) {
        return respond.error("Ritual not found", "NOT_FOUND", { status: 404 });
      }

      logger.info("Fetched ritual by slug", { slug, ritualId: ritual.id, campusId });

      return respond.success({ ritual });
    } catch (error) {
      logger.error("Error fetching ritual by slug", {
        error: error instanceof Error ? error.message : String(error),
        slug,
        campusId,
      });
      return respond.error("Failed to load ritual", "INTERNAL_ERROR", {
        status: 500,
      });
    }
  }
);

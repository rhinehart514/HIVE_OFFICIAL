import { z } from "zod";
import { RitualEngineService, type UpsertRitualInput } from "@hive/core";
import { logger } from "@/lib/logger";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { isRitualsEnabled } from "@/lib/feature-flags";
import { isAdmin as checkIsAdmin } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ ritualId: string }>;
}

/**
 * GET /api/rituals/[ritualId] - Get a specific ritual
 */
export const GET = withAuthAndErrors(
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
      const result = await service.getRitual(ritualId);

      if (result.isFailure) {
        return respond.error("Ritual not found", "NOT_FOUND", { status: 404 });
      }

      const ritual = result.getValue();

      // Check visibility
      if (ritual.visibility === "secret" && ritual.campusId !== campusId) {
        return respond.error("Ritual not found", "NOT_FOUND", { status: 404 });
      }

      logger.info("Fetched ritual", { ritualId, campusId });

      return respond.success({ ritual });
    } catch (error) {
      logger.error("Error fetching ritual", {
        error: error instanceof Error ? error.message : String(error),
        ritualId,
        campusId,
      });
      return respond.error("Failed to load ritual", "INTERNAL_ERROR", {
        status: 500,
      });
    }
  }
);

/**
 * PATCH /api/rituals/[ritualId] - Update a ritual (admin only)
 */
const updateRitualSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  phase: z.enum(["draft", "announced", "active", "cooldown", "ended"]).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  visibility: z.enum(["public", "invite_only", "secret"]).optional(),
  slug: z.string().max(100).optional(),
  presentation: z.record(z.unknown()).optional(),
  metrics: z.record(z.unknown()).optional(),
  config: z.record(z.unknown()).optional(),
});

type UpdateRitualData = z.infer<typeof updateRitualSchema>;

export const PATCH = withAuthValidationAndErrors(
  updateRitualSchema,
  async (request, context: RouteParams, body: UpdateRitualData, respond) => {
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

    // Check admin permission
    const isAdmin = await checkIsAdmin(userId);
    if (!isAdmin) {
      return respond.error("Admin access required", "FORBIDDEN", { status: 403 });
    }

    try {
      const service = new RitualEngineService(undefined, { campusId });

      // Check ritual exists
      const existing = await service.getRitual(ritualId);
      if (existing.isFailure) {
        return respond.error("Ritual not found", "NOT_FOUND", { status: 404 });
      }

      const result = await service.updateRitual(ritualId, body as unknown as Partial<UpsertRitualInput>);

      if (result.isFailure) {
        logger.error("Failed to update ritual", {
          error: result.error,
          ritualId,
          userId,
        });
        return respond.error(
          result.error as string,
          "VALIDATION_ERROR",
          { status: 400 }
        );
      }

      const ritual = result.getValue();

      logger.info("Updated ritual", {
        ritualId,
        userId,
        campusId,
      });

      return respond.success({ ritual });
    } catch (error) {
      logger.error("Error updating ritual", {
        error: error instanceof Error ? error.message : String(error),
        ritualId,
        userId,
      });
      return respond.error("Failed to update ritual", "INTERNAL_ERROR", {
        status: 500,
      });
    }
  }
);

/**
 * DELETE /api/rituals/[ritualId] - Delete a ritual (admin only)
 */
export const DELETE = withAuthAndErrors(
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

    // Check admin permission
    const isAdmin = await checkIsAdmin(userId);
    if (!isAdmin) {
      return respond.error("Admin access required", "FORBIDDEN", { status: 403 });
    }

    try {
      const service = new RitualEngineService(undefined, { campusId });

      const result = await service.deleteRitual(ritualId);

      if (result.isFailure) {
        logger.error("Failed to delete ritual", {
          error: result.error,
          ritualId,
          userId,
        });
        return respond.error(
          result.error as string,
          "NOT_FOUND",
          { status: 404 }
        );
      }

      logger.info("Deleted ritual", {
        ritualId,
        userId,
        campusId,
      });

      return respond.success({ deleted: true });
    } catch (error) {
      logger.error("Error deleting ritual", {
        error: error instanceof Error ? error.message : String(error),
        ritualId,
        userId,
      });
      return respond.error("Failed to delete ritual", "INTERNAL_ERROR", {
        status: 500,
      });
    }
  }
);

import { z } from "zod";
import { RitualEngineService, type UpsertRitualInput } from "@hive/core";
import { RitualArchetype, RitualPhase } from "@hive/core";
import { logger } from "@/lib/logger";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { isRitualsEnabled, isRitualsLeadersOnly } from "@/lib/feature-flags";
import { isAdmin as checkIsAdmin } from "@/lib/admin-auth";
import { dbAdmin } from "@/lib/firebase-admin";

// Archetype enum values and their lowercase equivalents
const VALID_ARCHETYPES = [
  RitualArchetype.FoundingClass,
  RitualArchetype.LaunchCountdown,
  RitualArchetype.BetaLottery,
  RitualArchetype.UnlockChallenge,
  RitualArchetype.Survival,
  RitualArchetype.Leak,
  RitualArchetype.Tournament,
  RitualArchetype.FeatureDrop,
  RitualArchetype.RuleInversion,
] as const;

// Map lowercase string inputs to enum values
const ARCHETYPE_MAP: Record<string, RitualArchetype> = {
  founding_class: RitualArchetype.FoundingClass,
  launch_countdown: RitualArchetype.LaunchCountdown,
  beta_lottery: RitualArchetype.BetaLottery,
  unlock_challenge: RitualArchetype.UnlockChallenge,
  survival: RitualArchetype.Survival,
  leak: RitualArchetype.Leak,
  tournament: RitualArchetype.Tournament,
  feature_drop: RitualArchetype.FeatureDrop,
  rule_inversion: RitualArchetype.RuleInversion,
};

const VALID_PHASES: RitualPhase[] = [
  "draft",
  "announced",
  "active",
  "cooldown",
  "ended",
];

/**
 * Check if a user is a space leader (owner or admin of any space)
 */
async function isSpaceLeader(userId: string, campusId: string): Promise<boolean> {
  try {
    // Check for spaces where user is owner
    const ownedSpaces = await dbAdmin
      .collection("spaces")
      .where("campusId", "==", campusId)
      .where("ownerId", "==", userId)
      .limit(1)
      .get();

    if (!ownedSpaces.empty) return true;

    // Check for spaces where user is admin
    const adminSpaces = await dbAdmin
      .collection("spaces")
      .where("campusId", "==", campusId)
      .where("adminIds", "array-contains", userId)
      .limit(1)
      .get();

    return !adminSpaces.empty;
  } catch {
    return false;
  }
}

/**
 * GET /api/rituals - List rituals for the campus
 *
 * Query params:
 * - phase: Filter by phase(s), comma-separated (e.g., "active,announced")
 * - archetype: Filter by archetype
 * - limit: Max results (default 50)
 */
export const GET = withAuthAndErrors(async (request, context, respond) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = getCampusId(req);
  const { searchParams } = new URL(request.url);

  // Check feature flag
  const ritualsEnabled = await isRitualsEnabled({ userId, schoolId: campusId });
  if (!ritualsEnabled) {
    return respond.error("Rituals feature is not enabled", "FEATURE_DISABLED", {
      status: 403,
    });
  }

  // Check if rituals are leaders-only (January mode)
  const leadersOnly = await isRitualsLeadersOnly({ userId, schoolId: campusId });
  if (leadersOnly) {
    const isAdmin = await checkIsAdmin(userId);
    const isLeader = await isSpaceLeader(userId, campusId);

    if (!isAdmin && !isLeader) {
      return respond.error(
        "Rituals are currently only available to space leaders",
        "LEADER_REQUIRED",
        { status: 403 }
      );
    }
  }

  const phaseParam = searchParams.get("phase");
  const archetype = searchParams.get("archetype") as RitualArchetype | null;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  // Parse phases if provided
  let phases: RitualPhase[] | undefined;
  if (phaseParam) {
    phases = phaseParam.split(",").filter((p): p is RitualPhase =>
      VALID_PHASES.includes(p as RitualPhase)
    );
  }

  try {
    const service = new RitualEngineService(undefined, { campusId });

    let result;
    if (archetype && VALID_ARCHETYPES.includes(archetype)) {
      result = await service.listRitualsByArchetype(campusId, archetype);
    } else {
      result = await service.listRituals(campusId, phases);
    }

    if (result.isFailure) {
      logger.error("Failed to list rituals", {
        error: result.error,
        campusId,
      });
      return respond.error(
        "Failed to load rituals",
        "INTERNAL_ERROR",
        { status: 500 }
      );
    }

    const rituals = result.getValue().slice(0, limit);

    logger.info("Listed rituals", {
      count: rituals.length,
      campusId,
      phases,
      archetype,
    });

    return respond.success({
      rituals,
      pagination: {
        limit,
        count: rituals.length,
        hasMore: result.getValue().length > limit,
      },
    });
  } catch (error) {
    logger.error("Error listing rituals", {
      error: error instanceof Error ? error.message : String(error),
      campusId,
    });
    return respond.error("Failed to load rituals", "INTERNAL_ERROR", {
      status: 500,
    });
  }
});

/**
 * POST /api/rituals - Create a new ritual (admin only)
 */
const createRitualSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  archetype: z.enum([
    "founding_class",
    "launch_countdown",
    "beta_lottery",
    "unlock_challenge",
    "survival",
    "leak",
    "tournament",
    "feature_drop",
    "rule_inversion",
  ]),
  phase: z.enum(["draft", "announced", "active", "cooldown", "ended"]).default("draft"),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  visibility: z.enum(["public", "invite_only", "secret"]).default("public"),
  slug: z.string().max(100).optional(),
  presentation: z.record(z.unknown()).optional(),
  config: z.record(z.unknown()),
});

type CreateRitualData = z.output<typeof createRitualSchema>;

export const POST = withAuthValidationAndErrors(
  createRitualSchema as unknown as z.ZodType<CreateRitualData>,
  async (request, context, body: CreateRitualData, respond) => {
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

    // Check admin permission
    const isAdmin = await checkIsAdmin(userId);
    if (!isAdmin) {
      return respond.error("Admin access required", "FORBIDDEN", { status: 403 });
    }

    try {
      const service = new RitualEngineService(undefined, { campusId });

      // Transform lowercase archetype to enum value
      const archetypeEnum = ARCHETYPE_MAP[body.archetype];
      if (!archetypeEnum) {
        return respond.error(`Invalid archetype: ${body.archetype}`, "VALIDATION_ERROR", {
          status: 400,
        });
      }

      const input = {
        ...body,
        archetype: archetypeEnum,
        campusId,
      } as UpsertRitualInput;

      const result = await service.createRitual(input);

      if (result.isFailure) {
        logger.error("Failed to create ritual", {
          error: result.error,
          userId,
          campusId,
        });
        return respond.error(
          result.error as string,
          "VALIDATION_ERROR",
          { status: 400 }
        );
      }

      const ritual = result.getValue();

      logger.info("Created ritual", {
        ritualId: ritual.id,
        archetype: ritual.archetype,
        userId,
        campusId,
      });

      return respond.success({ ritual }, { status: 201 });
    } catch (error) {
      logger.error("Error creating ritual", {
        error: error instanceof Error ? error.message : String(error),
        userId,
        campusId,
      });
      return respond.error("Failed to create ritual", "INTERNAL_ERROR", {
        status: 500,
      });
    }
  }
);

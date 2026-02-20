import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from "@/lib/middleware";
import { logger } from "@/lib/structured-logger";
import { withCache } from "../../../../lib/cache-headers";

/**
 * Builder level thresholds.
 *
 * Levels:
 *   creator  (0 XP)      — Seedling
 *   builder  (100 XP)    — Hammer
 *   architect (500 XP)   — Blueprint
 *   innovator (2000 XP)  — Rocket (max)
 */
const LEVELS = [
  { key: "creator", label: "Creator", minXp: 0 },
  { key: "builder", label: "Builder", minXp: 100 },
  { key: "architect", label: "Architect", minXp: 500 },
  { key: "innovator", label: "Innovator", minXp: 2000 },
] as const;

type Level = (typeof LEVELS)[number];

function resolveLevel(xp: number) {
  let current: Level = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
    else break;
  }
  const idx = LEVELS.indexOf(current);
  const next = idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  const isMax = next === null;

  return {
    level: current.key,
    levelLabel: current.label,
    currentLevelMinXp: current.minXp,
    nextLevelXp: next?.minXp ?? null,
    nextLevelName: next?.label ?? null,
    xpToNextLevel: next ? next.minXp - xp : 0,
    progressPercent: next
      ? Math.min(
          100,
          Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100)
        )
      : 100,
    isMaxLevel: isMax,
  };
}

/**
 * XP calculation:
 *   - 10 XP per tool created
 *   - 25 XP per tool published
 *   - 15 XP per deployment to a space
 *   - Profile-stored XP (from rituals, etc.) is added on top
 */
async function computeXp(userId: string): Promise<{ xp: number; achievements: string[] }> {
  const achievements: string[] = [];

  // 1. Profile XP (stored by rituals / manual grants)
  const profileDoc = await dbAdmin.collection("profiles").doc(userId).get();
  const profileXp = (profileDoc.data()?.xp as number) || 0;
  const builderLevel = profileDoc.data()?.builderLevel as string | undefined;

  // 2. Count tools
  const toolsSnap = await dbAdmin
    .collection("tools")
    .where("ownerId", "==", userId)
    .get();

  const toolCount = toolsSnap.size;
  let publishedCount = 0;

  for (const doc of toolsSnap.docs) {
    const status = doc.data().status as string;
    if (status === "published") publishedCount++;
  }

  // 3. Count deployments (placedTools canonical)
  const toolIds = toolsSnap.docs.map((d) => d.id);
  let deploymentCount = 0;

  if (toolIds.length > 0) {
    const chunks: string[][] = [];
    for (let i = 0; i < toolIds.length; i += 30) {
      chunks.push(toolIds.slice(i, i + 30));
    }
    for (const chunk of chunks) {
      const snap = await dbAdmin
        .collection("placedTools")
        .where("toolId", "in", chunk)
        .get();
      deploymentCount += snap.size;
    }
  }

  // Calculate XP
  const earnedXp =
    toolCount * 10 +
    publishedCount * 25 +
    deploymentCount * 15;

  const totalXp = profileXp + earnedXp;

  // Derive achievements
  if (toolCount >= 1) achievements.push("first_tool");
  if (toolCount >= 5) achievements.push("five_tools");
  if (toolCount >= 10) achievements.push("ten_tools");
  if (publishedCount >= 1) achievements.push("first_publish");
  if (deploymentCount >= 1) achievements.push("first_deploy");
  if (deploymentCount >= 5) achievements.push("five_deploys");
  if (builderLevel === "innovator") achievements.push("max_level");

  return { xp: totalXp, achievements };
}

/**
 * GET /api/tools/builder-profile
 *
 * Returns the authenticated user's builder level, XP, progress, and achievements.
 * Used by the BuilderLevel component on the lab dashboard.
 */
const _GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);

  logger.info("[builder-profile] GET", { userId });

  try {
    const { xp, achievements } = await computeXp(userId);
    const levelInfo = resolveLevel(xp);

    return respond.success({
      ...levelInfo,
      xp,
      achievements,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("[builder-profile] GET failed", { userId, error: msg });
    return respond.error(
      "Failed to fetch builder profile",
      "INTERNAL_ERROR",
      { status: 500 }
    );
  }
});

export const GET = withCache(_GET, "SHORT");

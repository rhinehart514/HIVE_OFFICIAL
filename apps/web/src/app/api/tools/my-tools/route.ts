import * as admin from "firebase-admin";
import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from "@/lib/middleware";
import { logger } from "@/lib/structured-logger";
import { withCache } from "../../../../lib/cache-headers";

/**
 * GET /api/tools/my-tools
 *
 * Returns the authenticated user's tools with per-tool stats (deployments, WAU,
 * weekly interactions) plus an aggregate stats object for the StatsBar component.
 */
const _GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);

  logger.info("[my-tools] GET", { userId });

  try {
    // Fetch all tools owned by this user (check both ownerId and createdBy for compat)
    // Avoid orderBy to prevent composite index requirements — sort in memory instead
    const [byOwner, byCreator] = await Promise.all([
      dbAdmin
        .collection("tools")
        .where("ownerId", "==", userId)
        .get(),
      dbAdmin
        .collection("tools")
        .where("createdBy", "==", userId)
        .get(),
    ]);

    // Dedupe across both queries
    const toolMap = new Map<string, admin.firestore.QueryDocumentSnapshot>();
    for (const doc of byOwner.docs) toolMap.set(doc.id, doc);
    for (const doc of byCreator.docs) {
      if (!toolMap.has(doc.id)) toolMap.set(doc.id, doc);
    }

    const toolDocs = Array.from(toolMap.values());

    // Early return for users with zero tools — no need to query placements
    if (toolDocs.length === 0) {
      return respond.success({
        tools: [],
        stats: { totalTools: 0, totalUsers: 0, weeklyInteractions: 0 },
      });
    }

    const toolIds = toolDocs.map((d) => d.id);

    // Batch-fetch placement counts from placedTools (canonical) collection
    const deploymentCounts = new Map<string, number>();
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

        for (const doc of snap.docs) {
          const tid = doc.data().toolId as string;
          deploymentCounts.set(tid, (deploymentCounts.get(tid) || 0) + 1);
        }

        // Also check legacy deployedTools for tools that may only exist there
        const legacySnap = await dbAdmin
          .collection("deployedTools")
          .where("toolId", "in", chunk)
          .get();

        for (const doc of legacySnap.docs) {
          const tid = doc.data().toolId as string;
          if (!deploymentCounts.has(tid)) {
            deploymentCounts.set(tid, 1);
          }
        }
      }
    }

    // Build response tools array matching the MyTool interface
    let totalUsers = 0;
    let weeklyInteractions = 0;

    const tools = toolDocs.map((doc) => {
      const data = doc.data();
      const useCount = (data.useCount as number) || 0;
      const deployments = deploymentCounts.get(doc.id) || 0;
      // WAU and weekly interactions from analytics metadata if available,
      // otherwise derive from useCount as a rough proxy
      const wau = (data.wau as number) || 0;
      const toolWeekly = (data.weeklyInteractions as number) || 0;

      totalUsers += wau;
      weeklyInteractions += toolWeekly;

      // Determine effective status — tools placed in spaces are "deployed"
      let status = (data.status as string) || "draft";
      if (deployments > 0 && status === "published") {
        status = "deployed";
      }

      const updatedAt = data.updatedAt instanceof admin.firestore.Timestamp
        ? data.updatedAt.toDate().toISOString()
        : typeof data.updatedAt === "string"
          ? data.updatedAt
          : new Date().toISOString();

      const createdAt = data.createdAt instanceof admin.firestore.Timestamp
        ? data.createdAt.toDate().toISOString()
        : typeof data.createdAt === "string"
          ? data.createdAt
          : updatedAt;

      return {
        id: doc.id,
        name: (data.name as string) || "Untitled Tool",
        description: (data.description as string) || "",
        status,
        updatedAt,
        createdAt,
        useCount,
        deployments,
        wau,
        weeklyInteractions: toolWeekly,
        templateId: (data.metadata as Record<string, unknown>)?.templateId as string | null ?? null,
      };
    });

    // Sort by updatedAt descending (we skip Firestore orderBy to avoid index requirements)
    tools.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const stats = {
      totalTools: tools.length,
      totalUsers,
      weeklyInteractions,
    };

    return respond.success({ tools, stats });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("[my-tools] GET failed", { userId, error: msg });
    return respond.error("Failed to fetch tools", "INTERNAL_ERROR", { status: 500 });
  }
});

export const GET = withCache(_GET, "SHORT");

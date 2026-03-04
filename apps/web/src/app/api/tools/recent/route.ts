import * as admin from "firebase-admin";
import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthAndErrors, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { withCache } from "../../../../lib/cache-headers";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function toISOString(value: unknown): string {
  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return new Date(0).toISOString();
}

/**
 * GET /api/tools/recent
 *
 * Returns recently created published tools for the user's campus,
 * sorted by createdAt descending. Supports cursor-based pagination.
 */
const _GET = withAuthAndErrors(async (request, _context, respond) => {
  const req = request as AuthenticatedRequest;
  const campusId = getCampusId(req);
  const { searchParams } = new URL(request.url);

  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const cursor = searchParams.get("cursor") || null;

  let query = dbAdmin
    .collection("tools")
    .where("status", "==", "published")
    .orderBy("createdAt", "desc")
    .limit(limit);

  // Apply cursor-based pagination
  if (cursor) {
    const cursorDoc = await dbAdmin.collection("tools").doc(cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.get();

  // Filter by campusId in memory to avoid composite index requirements
  const filtered = snapshot.docs.filter((doc) => {
    const data = doc.data();
    if (!campusId) return true;
    const toolCampusId = data.campusId as string | undefined;
    return !toolCampusId || toolCampusId === campusId;
  });

  // Batch-fetch first deployment per tool to get source space context
  const toolIds = filtered.map((doc) => doc.id);
  const deploymentMap = new Map<string, { spaceId: string; spaceName: string }>();

  if (toolIds.length > 0) {
    const chunks: string[][] = [];
    for (let i = 0; i < toolIds.length; i += 30) {
      chunks.push(toolIds.slice(i, i + 30));
    }
    for (const chunk of chunks) {
      const deplSnap = await dbAdmin
        .collection("tool_deployments")
        .where("toolId", "in", chunk)
        .limit(chunk.length)
        .get();
      for (const d of deplSnap.docs) {
        const dd = d.data();
        const tid = dd.toolId as string;
        if (!deploymentMap.has(tid)) {
          deploymentMap.set(tid, {
            spaceId: (dd.targetId as string) || (dd.spaceId as string) || "",
            spaceName: (dd.spaceName as string) || "",
          });
        }
      }
    }

    // Resolve missing space names
    const needNames = new Set<string>();
    for (const [, dep] of deploymentMap) {
      if (dep.spaceId && (!dep.spaceName || dep.spaceName === "Space")) {
        needNames.add(dep.spaceId);
      }
    }
    if (needNames.size > 0) {
      const spaceRefs = Array.from(needNames).map((id) =>
        dbAdmin.collection("spaces").doc(id)
      );
      const spaceDocs = await dbAdmin.getAll(...spaceRefs);
      const names = new Map<string, string>();
      for (const sd of spaceDocs) {
        if (sd.exists) names.set(sd.id, (sd.data()?.name as string) || "");
      }
      for (const [, dep] of deploymentMap) {
        if (needNames.has(dep.spaceId)) {
          dep.spaceName = names.get(dep.spaceId) || dep.spaceName;
        }
      }
    }
  }

  const tools = filtered.map((doc) => {
    const data = doc.data();
    const useCount = (data.useCount as number | undefined) ?? 0;
    const viewCount = (data.viewCount as number | undefined) ?? 0;
    const deployment = deploymentMap.get(doc.id);

    return {
      id: doc.id,
      name: (data.name as string | undefined) ?? "Untitled",
      description: (data.description as string | undefined) ?? "",
      shellFormat: (data.shellFormat as string | undefined) ?? null,
      shellConfig: (data.shellConfig as Record<string, unknown> | undefined) ?? null,
      type: (data.type as string | undefined) ?? "visual",
      ownerId: (data.ownerId as string | undefined) ?? null,
      ownerName: (data.creatorName as string | undefined) ?? null,
      createdAt: toISOString(data.createdAt),
      createdBy: (data.createdBy as string | undefined) ?? null,
      useCount,
      viewCount,
      spaceId: deployment?.spaceId ?? null,
      spaceName: deployment?.spaceName ?? null,
    };
  });

  const nextCursor = filtered.length === limit ? filtered[filtered.length - 1].id : null;

  return respond.success({
    tools,
    pagination: {
      limit,
      cursor: nextCursor,
      hasMore: nextCursor !== null,
    },
  });
});

export const GET = withCache(_GET, "SHORT");

import { dbAdmin } from "@/lib/firebase-admin";
import {
  withAuthAndErrors,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";

// GET /api/tools/[toolId]/remixes - List tools remixed from this tool
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond,
) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { toolId } = await params;

  // Verify the source tool exists and is in the same campus
  const sourceDoc = await dbAdmin.collection("tools").doc(toolId).get();
  if (!sourceDoc.exists) {
    return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  const sourceData = sourceDoc.data();
  if (sourceData?.campusId !== campusId) {
    return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  // Query tools where remixedFrom.toolId matches
  const remixesSnapshot = await dbAdmin
    .collection("tools")
    .where("campusId", "==", campusId)
    .where("remixedFrom.toolId", "==", toolId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  const remixes = remixesSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      toolId: doc.id,
      toolName: data.name,
      creatorName: data.creatorName || null,
      creatorId: data.ownerId,
      status: data.status,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
    };
  });

  // Batch fetch creator names for remixes that don't have creatorName cached
  const creatorIds = [...new Set(remixes.filter(r => !r.creatorName).map(r => r.creatorId))];
  if (creatorIds.length > 0) {
    const creatorRefs = creatorIds.map(id => dbAdmin.collection("users").doc(id));
    const creatorDocs = await dbAdmin.getAll(...creatorRefs);
    const nameMap = new Map<string, string>();
    for (const doc of creatorDocs) {
      if (doc.exists) {
        const data = doc.data();
        nameMap.set(doc.id, (data?.displayName || data?.fullName || "Unknown") as string);
      }
    }
    for (const remix of remixes) {
      if (!remix.creatorName && nameMap.has(remix.creatorId)) {
        remix.creatorName = nameMap.get(remix.creatorId)!;
      }
    }
  }

  return respond.success({
    remixes,
    total: remixes.length,
    sourceToolId: toolId,
  });
});

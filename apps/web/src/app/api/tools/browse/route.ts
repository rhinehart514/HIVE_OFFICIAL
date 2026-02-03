"use server";

import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import {
  withOptionalAuth,
  getUser,
} from "@/lib/middleware";

const VALID_STATUSES = new Set(["draft", "published", "archived"]);

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parseInteger(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export const GET = withOptionalAuth(async (
  request,
  _context,
  respond,
) => {
  try {
    // Optional auth: get user if authenticated, null otherwise
    const user = getUser(request as import("next/server").NextRequest);
    const viewerId = user?.uid || null;
    const campusId = user?.campusId || 'ub-buffalo'; // Default campus for public
    const searchParams = new URL(request.url).searchParams;

    const requestedUserId = searchParams.get("userId") ?? undefined;
    const statusParam = searchParams.get("status") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const type = searchParams.get("type") ?? undefined;
    const featured = searchParams.get("featured") === "true";
    const limit = Math.min(
      parseInteger(searchParams.get("limit"), DEFAULT_LIMIT),
      MAX_LIMIT,
    );
    const offset = parseInteger(searchParams.get("offset"), 0);
    const search = searchParams.get("search") ?? undefined;

    let query = dbAdmin
      .collection("tools")
      .where("campusId", "==", campusId);

    if (requestedUserId) {
      if (requestedUserId === viewerId) {
        query = query.where("ownerId", "==", requestedUserId);
      } else {
        query = query
          .where("ownerId", "==", requestedUserId)
          .where("isPublic", "==", true)
          .where("status", "==", "published");
      }
    } else {
      query = query
        .where("isPublic", "==", true)
        .where("status", "==", "published");
    }

    if (
      statusParam &&
      VALID_STATUSES.has(statusParam) &&
      requestedUserId === viewerId
    ) {
      query = query.where("status", "==", statusParam);
    }

    if (category && category !== "all") {
      query = query.where("category", "==", category);
    }

    if (type && type !== "all") {
      query = query.where("metadata.toolType", "==", type);
    }

    if (featured) {
      query = query.where("metadata.featured", "==", true);
    }

    query = query.orderBy("createdAt", "desc");

    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get();
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    query = query.limit(limit);
    const snapshot = await query.get();

    const tools = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const toolData = doc.data();

        let createdByName = "Anonymous";
        try {
          const ownerDoc = await dbAdmin
            .collection("users")
            .doc(toolData.ownerId)
            .get();
          if (ownerDoc.exists) {
            const ownerData = ownerDoc.data();
            createdByName =
              normalizeText(ownerData?.displayName) ||
              normalizeText(ownerData?.name) ||
              `${normalizeText(ownerData?.firstName)} ${normalizeText(
                ownerData?.lastName,
              )}`.trim() ||
              "Anonymous";
          }
        } catch (error) {
          logger.warn("Failed to fetch tool creator", {
            toolOwnerId: toolData.ownerId,
            error: { error: error instanceof Error ? error.message : String(error) },
            endpoint: "/api/tools/browse",
          });
        }

        if (search) {
          const queryLower = search.toLowerCase();
          const matchesSearch =
            toolData.name?.toLowerCase().includes(queryLower) ||
            toolData.description?.toLowerCase().includes(queryLower) ||
            (toolData.tags || []).some((tag: string) =>
              tag.toLowerCase().includes(queryLower),
            );

          if (!matchesSearch) {
            return null;
          }
        }

        // Fetch active deployments for this tool to show which spaces use it
        let deployedSpaces: { id: string; name: string; handle: string }[] = [];
        let deploymentCount = toolData.deploymentCount || 0;
        try {
          const deploymentsSnapshot = await dbAdmin
            .collection("deployedTools")
            .where("toolId", "==", doc.id)
            .where("campusId", "==", campusId)
            .where("status", "==", "active")
            .where("deployedTo", "==", "space")
            .limit(10)
            .get();

          if (!deploymentsSnapshot.empty) {
            // Use the actual active deployment count if we have it
            if (deploymentCount < deploymentsSnapshot.size) {
              deploymentCount = deploymentsSnapshot.size;
            }

            // Collect unique space IDs
            const spaceIds = new Set<string>();
            for (const depDoc of deploymentsSnapshot.docs) {
              const depData = depDoc.data();
              if (depData.targetId) {
                spaceIds.add(depData.targetId);
              }
            }

            // Fetch space names in parallel
            const spaceEntries = await Promise.all(
              Array.from(spaceIds).slice(0, 5).map(async (spaceId) => {
                try {
                  const spaceDoc = await dbAdmin.collection("spaces").doc(spaceId).get();
                  if (spaceDoc.exists) {
                    const spaceData = spaceDoc.data();
                    return {
                      id: spaceId,
                      name: normalizeText(spaceData?.name) || "Unknown Space",
                      handle: normalizeText(spaceData?.slug) || normalizeText(spaceData?.handle) || spaceId,
                    };
                  }
                } catch {
                  // Skip spaces that fail to load
                }
                return null;
              })
            );

            deployedSpaces = spaceEntries.filter(
              (s): s is NonNullable<typeof s> => s !== null
            );
          }
        } catch (error) {
          logger.warn("Failed to fetch tool deployments", {
            toolId: doc.id,
            error: { error: error instanceof Error ? error.message : String(error) },
            endpoint: "/api/tools/browse",
          });
        }

        return {
          id: doc.id,
          ...toolData,
          createdByName,
          deploymentCount,
          deployedSpaces,
          stats: {
            views: 0,
            uses: 0,
            likes: 0,
            installs: 0,
            shares: 0,
            ...toolData.stats,
          },
          metadata: {
            version: "1.0.0",
            difficulty: "beginner",
            featured: false,
            toolType: toolData.type || "visual",
            ...toolData.metadata,
          },
          tags: toolData.tags || [],
          collaborators: toolData.collaborators || [],
          createdAt:
            toolData.createdAt?.toDate?.()?.toISOString() ||
            toolData.createdAt,
          updatedAt:
            toolData.updatedAt?.toDate?.()?.toISOString() ||
            toolData.updatedAt,
        };
      }),
    );

    const filteredTools = tools.filter(
      (tool): tool is NonNullable<typeof tool> => tool !== null,
    );

    let total = filteredTools.length;
    if (offset === 0) {
      try {
        let countQuery = dbAdmin
          .collection("tools")
          .where("campusId", "==", campusId);

        if (requestedUserId) {
          if (requestedUserId === viewerId) {
            countQuery = countQuery.where("ownerId", "==", requestedUserId);
          } else {
            countQuery = countQuery
              .where("ownerId", "==", requestedUserId)
              .where("isPublic", "==", true)
              .where("status", "==", "published");
          }
        } else {
          countQuery = countQuery
            .where("isPublic", "==", true)
            .where("status", "==", "published");
        }

        const countSnapshot = await countQuery.count().get();
        total = countSnapshot.data().count;
      } catch (error) {
        logger.warn("Failed to count tools for browse", {
          error: { error: error instanceof Error ? error.message : String(error) },
          endpoint: "/api/tools/browse",
        });
      }
    }

    return respond.success({
      tools: filteredTools,
      pagination: {
        total,
        limit,
        offset,
        hasMore: filteredTools.length === limit,
        returned: filteredTools.length,
      },
    });
  } catch (error) {
    logger.error(
      "Error browsing tools",
      { error: error instanceof Error ? error.message : String(error) },
    );
    return respond.error("Failed to browse tools", "INTERNAL_ERROR", {
      status: 500,
    });
  }
});

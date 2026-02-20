/**
 * GET /api/tools/[toolId]/with-state
 *
 * Returns tool definition + current sharedState + userState for a given deploymentId.
 * Used by useToolRuntime to hydrate the canvas in both standalone and deployed contexts.
 *
 * For standalone deployments (deploymentId starts with "standalone:"),
 * space/campus validation is skipped — any authenticated user can read their own tool.
 *
 * Doc ID format matches execute route:
 *   sharedState: tool_states/{toolId}_{deploymentId}_shared
 *   userState:   tool_states/{toolId}_{deploymentId}_{userId}
 */

import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from "@/lib/middleware";

const EMPTY_SHARED_STATE = {
  counters: {},
  collections: {},
  timeline: [],
  computed: {},
  version: 0,
  lastModified: new Date().toISOString(),
};

const EMPTY_USER_STATE = {};

function sharedDocId(toolId: string, deploymentId: string): string {
  return `${toolId}_${deploymentId}_shared`;
}

function userDocId(toolId: string, deploymentId: string, userId: string): string {
  return `${toolId}_${deploymentId}_${userId}`;
}

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { toolId } = await params;
  const searchParams = new URL(request.url).searchParams;
  const deploymentId = searchParams.get("deploymentId") ?? `standalone:${toolId}`;

  const db = dbAdmin;

  // ── Fetch tool definition ──────────────────────────────────────────────────
  const toolDoc = await db.collection("tools").doc(toolId).get();
  if (!toolDoc.exists) {
    return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }
  const tool = { id: toolDoc.id, ...toolDoc.data() };

  // ── Authorization ──────────────────────────────────────────────────────────
  // For standalone tools: owner-only (or dev bypass)
  // For deployed tools: skip additional checks here (deployment already guards access)
  const isStandalone = deploymentId.startsWith("standalone:");
  if (isStandalone) {
    const toolData = toolDoc.data();
    const isOwner = toolData?.ownerId === userId || toolData?.creatorId === userId;
    const isDevBypass = process.env.HIVE_DEV_BYPASS === "true" && process.env.NODE_ENV === "development";
    if (!isOwner && !isDevBypass) {
      return respond.error("Access denied", "FORBIDDEN", { status: 403 });
    }
  }

  // ── Fetch shared state ─────────────────────────────────────────────────────
  // NOTE: The execute route uses set({merge:true}) with dotted key names like
  // "counters.poll_001:Library". Firestore treats these as LITERAL top-level
  // field names (not nested paths) when using set+merge. We normalize them back
  // into the expected nested structure here.
  const sharedDocRef = db.collection("tool_states").doc(sharedDocId(toolId, deploymentId));
  const sharedDoc = await sharedDocRef.get();

  let sharedState = EMPTY_SHARED_STATE;
  if (sharedDoc.exists) {
    const raw = sharedDoc.data() ?? {};
    const counters: Record<string, number> = {};
    const collections: Record<string, Record<string, unknown>> = {};
    const remaining: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(raw)) {
      if (key.startsWith("counters.")) {
        // "counters.poll_001:Library" → counters["poll_001:Library"] = value
        counters[key.slice("counters.".length)] = value as number;
      } else if (key.startsWith("collections.")) {
        // "collections.rsvp_001:attendees" → collections["rsvp_001:attendees"] = value
        collections[key.slice("collections.".length)] = value as Record<string, unknown>;
      } else if (key !== "counters" && key !== "collections") {
        remaining[key] = value;
      }
    }

    sharedState = {
      ...EMPTY_SHARED_STATE,
      ...remaining,
      counters: { ...(raw.counters as Record<string, number> ?? {}), ...counters },
      collections: { ...(raw.collections as Record<string, Record<string, unknown>> ?? {}), ...collections },
    };
  }

  // ── Fetch user state ───────────────────────────────────────────────────────
  const userDocRef = db.collection("tool_states").doc(userDocId(toolId, deploymentId, userId));
  const userDoc = await userDocRef.get();
  const userState = userDoc.exists ? userDoc.data() ?? EMPTY_USER_STATE : EMPTY_USER_STATE;

  return respond.success({
    tool,
    sharedState,
    userState,
    deploymentId,
    meta: {
      isStandalone,
      resolvedAt: new Date().toISOString(),
    },
  });
});

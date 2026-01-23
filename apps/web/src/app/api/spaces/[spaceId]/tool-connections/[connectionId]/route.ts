import { z } from "zod";
import {
  withAuthValidationAndErrors,
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/structured-logger";
import { dbAdmin } from "@/lib/firebase-admin";
import {
  CONNECTIONS_COLLECTION,
  type ToolConnection,
  type DataTransform,
} from "@hive/core";

/**
 * Single Tool Connection API - Sprint 3: Tool-to-Tool Connections
 *
 * GET /api/spaces/[spaceId]/tool-connections/[connectionId] - Get connection details
 * PATCH /api/spaces/[spaceId]/tool-connections/[connectionId] - Update connection
 * DELETE /api/spaces/[spaceId]/tool-connections/[connectionId] - Delete connection
 */

// ============================================================================
// SCHEMAS
// ============================================================================

const DataTransformSchema = z.enum([
  'toArray',
  'toCount',
  'toBoolean',
  'toSorted',
  'toTop5',
  'toKeys',
  'toValues',
  'flatten',
  'unique',
]);

const UpdateConnectionSchema = z.object({
  enabled: z.boolean().optional(),
  transform: DataTransformSchema.optional().nullable(),
  label: z.string().max(100).optional().nullable(),
});

type UpdateConnectionData = z.output<typeof UpdateConnectionSchema>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get a connection document
 */
async function getConnection(
  spaceId: string,
  connectionId: string
): Promise<ToolConnection | null> {
  const doc = await dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection(CONNECTIONS_COLLECTION)
    .doc(connectionId)
    .get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    spaceId: data.spaceId,
    source: data.source,
    target: data.target,
    transform: data.transform,
    enabled: data.enabled,
    createdAt: data.createdAt,
    createdBy: data.createdBy,
    updatedAt: data.updatedAt,
    label: data.label,
  };
}

// ============================================================================
// GET - Get Connection Details
// ============================================================================

export const GET = withAuthAndErrors(
  async (
    request: Request,
    { params }: { params: Promise<{ spaceId: string; connectionId: string }> },
    respond
  ) => {
    const { spaceId, connectionId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);

    if (!spaceId || !connectionId) {
      return respond.error(
        "Space ID and Connection ID are required",
        "INVALID_INPUT",
        { status: 400 }
      );
    }

    // Check member permission
    const permCheck = await checkSpacePermission(spaceId, userId, 'member');
    if (!permCheck.hasPermission) {
      return respond.error("Access denied", "FORBIDDEN", { status: 403 });
    }

    // Get the connection
    const connection = await getConnection(spaceId, connectionId);
    if (!connection) {
      return respond.error(
        "Connection not found",
        "NOT_FOUND",
        { status: 404 }
      );
    }

    return respond.success({ connection });
  }
);

// ============================================================================
// PATCH - Update Connection
// ============================================================================

export const PATCH = withAuthValidationAndErrors(
  UpdateConnectionSchema as z.ZodType<UpdateConnectionData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; connectionId: string }> },
    data: UpdateConnectionData,
    respond
  ) => {
    const { spaceId, connectionId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);

    if (!spaceId || !connectionId) {
      return respond.error(
        "Space ID and Connection ID are required",
        "INVALID_INPUT",
        { status: 400 }
      );
    }

    // Check leader permission
    const permCheck = await checkSpacePermission(spaceId, userId, 'leader');
    if (!permCheck.hasPermission) {
      return respond.error(
        "Only space leaders can update connections",
        "FORBIDDEN",
        { status: 403 }
      );
    }

    // Get the existing connection
    const existing = await getConnection(spaceId, connectionId);
    if (!existing) {
      return respond.error(
        "Connection not found",
        "NOT_FOUND",
        { status: 404 }
      );
    }

    // Build update object
    const updates: Partial<ToolConnection> & { updatedAt: string } = {
      updatedAt: new Date().toISOString(),
    };

    if (data.enabled !== undefined) {
      updates.enabled = data.enabled;
    }

    if (data.transform !== undefined) {
      updates.transform = data.transform as DataTransform | undefined;
    }

    if (data.label !== undefined) {
      updates.label = data.label || undefined;
    }

    // Update the document
    await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection(CONNECTIONS_COLLECTION)
      .doc(connectionId)
      .update(updates);

    logger.info('Tool connection updated', {
      connectionId,
      spaceId,
      userId,
      updates: Object.keys(updates),
    });

    // Return updated connection
    const updated = await getConnection(spaceId, connectionId);

    return respond.success({
      connection: updated,
      message: "Connection updated successfully",
    });
  }
);

// ============================================================================
// DELETE - Delete Connection
// ============================================================================

export const DELETE = withAuthAndErrors(
  async (
    request: Request,
    { params }: { params: Promise<{ spaceId: string; connectionId: string }> },
    respond
  ) => {
    const { spaceId, connectionId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);

    if (!spaceId || !connectionId) {
      return respond.error(
        "Space ID and Connection ID are required",
        "INVALID_INPUT",
        { status: 400 }
      );
    }

    // Check leader permission
    const permCheck = await checkSpacePermission(spaceId, userId, 'leader');
    if (!permCheck.hasPermission) {
      return respond.error(
        "Only space leaders can delete connections",
        "FORBIDDEN",
        { status: 403 }
      );
    }

    // Verify the connection exists
    const existing = await getConnection(spaceId, connectionId);
    if (!existing) {
      return respond.error(
        "Connection not found",
        "NOT_FOUND",
        { status: 404 }
      );
    }

    // Delete the connection
    await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection(CONNECTIONS_COLLECTION)
      .doc(connectionId)
      .delete();

    logger.info('Tool connection deleted', {
      connectionId,
      spaceId,
      userId,
      sourceDeploymentId: existing.source.deploymentId,
      targetDeploymentId: existing.target.deploymentId,
    });

    return respond.success({
      deleted: true,
      message: "Connection deleted successfully",
    });
  }
);

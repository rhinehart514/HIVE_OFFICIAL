import { z } from "zod";
import {
  withAuthValidationAndErrors,
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { logger } from "@/lib/structured-logger";
import { dbAdmin } from "@/lib/firebase-admin";
import { v4 as uuidv4 } from "uuid";
import {
  MAX_CONNECTIONS_PER_TOOL,
  CONNECTIONS_COLLECTION,
  type ToolConnection,
  type DataTransform,
} from "@hive/core";

/**
 * Tool Connections API - Sprint 3: Tool-to-Tool Connections
 *
 * POST /api/spaces/[spaceId]/tool-connections - Create a new connection
 * GET /api/spaces/[spaceId]/tool-connections - List connections in a space
 *
 * Connections enable data flow between tools within a space.
 */

// ============================================================================
// SCHEMAS
// ============================================================================

const ConnectionSourceSchema = z.object({
  deploymentId: z.string().min(1, "Source deployment ID is required"),
  path: z.string().min(1, "Source path is required"),
});

const ConnectionTargetSchema = z.object({
  deploymentId: z.string().min(1, "Target deployment ID is required"),
  elementId: z.string().min(1, "Target element ID is required"),
  inputPath: z.string().min(1, "Target input path is required"),
});

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

const CreateConnectionSchema = z.object({
  source: ConnectionSourceSchema,
  target: ConnectionTargetSchema,
  transform: DataTransformSchema.optional(),
  label: z.string().max(100).optional(),
});

type CreateConnectionData = z.output<typeof CreateConnectionSchema>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verify that a tool deployment exists and belongs to the space
 */
async function verifyDeployment(
  deploymentId: string,
  spaceId: string
): Promise<{ exists: boolean; name?: string }> {
  const deploymentDoc = await dbAdmin
    .collection('deployedTools')
    .doc(deploymentId)
    .get();

  if (!deploymentDoc.exists) {
    return { exists: false };
  }

  const data = deploymentDoc.data();
  if (data?.spaceId !== spaceId) {
    return { exists: false };
  }

  return { exists: true, name: data?.name || 'Unnamed Tool' };
}

/**
 * Count existing connections for a target deployment
 */
async function countConnectionsForTarget(
  spaceId: string,
  targetDeploymentId: string
): Promise<number> {
  const snapshot = await dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection(CONNECTIONS_COLLECTION)
    .where('target.deploymentId', '==', targetDeploymentId)
    .count()
    .get();

  return snapshot.data().count;
}

// ============================================================================
// POST - Create Connection
// ============================================================================

export const POST = withAuthValidationAndErrors(
  CreateConnectionSchema as z.ZodType<CreateConnectionData>,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    data: CreateConnectionData,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Check leader permission (only leaders can create connections)
    const permCheck = await checkSpacePermission(spaceId, userId, 'leader');
    if (!permCheck.hasPermission) {
      return respond.error(
        "Only space leaders can create tool connections",
        "FORBIDDEN",
        { status: 403 }
      );
    }

    // Verify source deployment exists and belongs to this space
    const sourceCheck = await verifyDeployment(data.source.deploymentId, spaceId);
    if (!sourceCheck.exists) {
      return respond.error(
        "Source tool not found in this space",
        "SOURCE_NOT_FOUND",
        { status: 404 }
      );
    }

    // Verify target deployment exists and belongs to this space
    const targetCheck = await verifyDeployment(data.target.deploymentId, spaceId);
    if (!targetCheck.exists) {
      return respond.error(
        "Target tool not found in this space",
        "TARGET_NOT_FOUND",
        { status: 404 }
      );
    }

    // Prevent self-connection
    if (data.source.deploymentId === data.target.deploymentId) {
      return respond.error(
        "Cannot create a connection from a tool to itself",
        "CIRCULAR_CONNECTION",
        { status: 400 }
      );
    }

    // Check connection limit
    const existingCount = await countConnectionsForTarget(
      spaceId,
      data.target.deploymentId
    );
    if (existingCount >= MAX_CONNECTIONS_PER_TOOL) {
      return respond.error(
        `Target tool has reached the maximum of ${MAX_CONNECTIONS_PER_TOOL} connections`,
        "CONNECTION_LIMIT_REACHED",
        { status: 400 }
      );
    }

    // Check for duplicate connection (same source path to same target element/input)
    const duplicateCheck = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection(CONNECTIONS_COLLECTION)
      .where('source.deploymentId', '==', data.source.deploymentId)
      .where('source.path', '==', data.source.path)
      .where('target.deploymentId', '==', data.target.deploymentId)
      .where('target.elementId', '==', data.target.elementId)
      .where('target.inputPath', '==', data.target.inputPath)
      .limit(1)
      .get();

    if (!duplicateCheck.empty) {
      return respond.error(
        "A connection with the same source and target already exists",
        "DUPLICATE_CONNECTION",
        { status: 409 }
      );
    }

    // Create the connection
    const connectionId = uuidv4();
    const now = new Date();

    const connectionDoc: ToolConnection = {
      id: connectionId,
      spaceId,
      source: data.source,
      target: data.target,
      transform: data.transform as DataTransform | undefined,
      enabled: true,
      createdAt: now.toISOString(),
      createdBy: userId,
      label: data.label,
    };

    await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection(CONNECTIONS_COLLECTION)
      .doc(connectionId)
      .set(connectionDoc);

    logger.info('Tool connection created', {
      connectionId,
      spaceId,
      userId,
      sourceDeploymentId: data.source.deploymentId,
      targetDeploymentId: data.target.deploymentId,
    });

    return respond.success({
      connection: connectionDoc,
      message: "Connection created successfully",
    });
  }
);

// ============================================================================
// GET - List Connections
// ============================================================================

export const GET = withAuthAndErrors(
  async (
    request: Request,
    { params }: { params: Promise<{ spaceId: string }> },
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const url = new URL(request.url);

    // Query params for filtering
    const sourceDeploymentId = url.searchParams.get('sourceDeploymentId');
    const targetDeploymentId = url.searchParams.get('targetDeploymentId');
    const enabledOnly = url.searchParams.get('enabledOnly') === 'true';

    if (!spaceId) {
      return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
    }

    // Check member permission (any member can view connections)
    const permCheck = await checkSpacePermission(spaceId, userId, 'member');
    if (!permCheck.hasPermission) {
      return respond.error("Access denied", "FORBIDDEN", { status: 403 });
    }

    const isLeader = ['owner', 'admin', 'leader', 'moderator'].includes(
      permCheck.role || ''
    );

    // Build query
    let query = dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection(CONNECTIONS_COLLECTION) as FirebaseFirestore.Query;

    if (sourceDeploymentId) {
      query = query.where('source.deploymentId', '==', sourceDeploymentId);
    }

    if (targetDeploymentId) {
      query = query.where('target.deploymentId', '==', targetDeploymentId);
    }

    if (enabledOnly) {
      query = query.where('enabled', '==', true);
    }

    const snapshot = await query.limit(100).get();

    const connections: ToolConnection[] = snapshot.docs.map((doc) => {
      const data = doc.data();
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
    });

    return respond.success({
      connections,
      total: connections.length,
      isLeader,
    });
  }
);

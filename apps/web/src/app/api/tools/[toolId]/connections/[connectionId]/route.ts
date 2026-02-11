/**
 * Single Connection API Route
 *
 * Sprint 3: Tool-to-Tool Connections
 *
 * Endpoints:
 * - GET: Fetch connection details
 * - PATCH: Update connection (enable/disable, update transform)
 * - DELETE: Remove connection
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { z } from 'zod';
import type { ToolConnection } from '@hive/core';
import { withCache } from '../../../../../../lib/cache-headers';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateConnectionSchema = z.object({
  enabled: z.boolean().optional(),
  transform: z.enum([
    'toArray', 'toCount', 'toBoolean', 'toSorted', 'toTop5',
    'toKeys', 'toValues', 'flatten', 'unique'
  ] as const).nullable().optional(),
  label: z.string().max(100).nullable().optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

async function verifyToolAccess(
  deploymentId: string,
  userId: string,
  requireOfficer = false
): Promise<{ allowed: boolean; error?: string; spaceId?: string }> {
  const deploymentRef = dbAdmin.collection('deployedTools').doc(deploymentId);
  const deploymentDoc = await deploymentRef.get();

  if (!deploymentDoc.exists) {
    return { allowed: false, error: 'Tool not found' };
  }

  const deploymentData = deploymentDoc.data();
  const toolOwnerId = deploymentData?.createdBy || deploymentData?.ownerId;
  const spaceId = deploymentData?.targetId;

  if (deploymentData?.deployedTo !== 'space' || !spaceId) {
    return { allowed: false, error: 'Tool must be deployed to a space' };
  }

  // Check space membership using composite key pattern
  const compositeId = `${spaceId}_${userId}`;
  const memberDoc = await dbAdmin.collection('spaceMembers').doc(compositeId).get();
  let memberData = memberDoc.exists ? memberDoc.data() : null;

  if (!memberDoc.exists && toolOwnerId !== userId) {
    // Fallback to query pattern for legacy data
    const memberQuery = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (memberQuery.empty && toolOwnerId !== userId) {
      return { allowed: false, error: 'Access denied' };
    }

    if (!memberQuery.empty) {
      memberData = memberQuery.docs[0].data();
    }
  }

  if (requireOfficer) {
    const isOfficer = memberData?.role === 'officer' || memberData?.role === 'leader';
    const isOwner = toolOwnerId === userId;

    if (!isOfficer && !isOwner) {
      return { allowed: false, error: 'Only officers can modify connections' };
    }
  }

  return { allowed: true, spaceId };
}

async function getConnection(
  spaceId: string,
  connectionId: string
): Promise<ToolConnection | null> {
  const doc = await dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('toolConnections')
    .doc(connectionId)
    .get();

  if (!doc.exists) return null;

  const data = doc.data()!;
  return {
    id: doc.id,
    spaceId,
    source: data.source,
    target: data.target,
    transform: data.transform,
    enabled: data.enabled !== false,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
    createdBy: data.createdBy,
    label: data.label,
  };
}

// ============================================================================
// GET - Fetch Connection
// ============================================================================

async function handleGet(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ toolId: string; connectionId: string }> }
) {
  const { toolId: deploymentId, connectionId } = await params;
  const userId = getUserId(request);

  try {
    const access = await verifyToolAccess(deploymentId, userId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.error === 'Tool not found' ? 404 : 403 }
      );
    }

    const connection = await getConnection(access.spaceId!, connectionId);

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Verify the connection involves this tool
    if (connection.source.deploymentId !== deploymentId &&
        connection.target.deploymentId !== deploymentId) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ connection });
  } catch (error) {
    logger.error('[connection] Error fetching connection', {
      deploymentId,
      connectionId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to fetch connection' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Connection
// ============================================================================

async function handlePatch(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ toolId: string; connectionId: string }> }
) {
  const { toolId: deploymentId, connectionId } = await params;
  const userId = getUserId(request);

  try {
    // Require officer role for modifications
    const access = await verifyToolAccess(deploymentId, userId, true);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.error === 'Tool not found' ? 404 : 403 }
      );
    }

    const spaceId = access.spaceId!;

    // Parse and validate body
    const body = await request.json();
    const parsed = UpdateConnectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const connectionRef = dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('toolConnections')
      .doc(connectionId);

    const connectionDoc = await connectionRef.get();

    if (!connectionDoc.exists) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    const connectionData = connectionDoc.data()!;

    // Verify the connection involves this tool
    if (connectionData.source.deploymentId !== deploymentId &&
        connectionData.target.deploymentId !== deploymentId) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    if (parsed.data.enabled !== undefined) {
      updates.enabled = parsed.data.enabled;
    }

    if (parsed.data.transform !== undefined) {
      updates.transform = parsed.data.transform; // Can be null to remove
    }

    if (parsed.data.label !== undefined) {
      updates.label = parsed.data.label; // Can be null to remove
    }

    await connectionRef.update(updates);

    // Fetch updated connection
    const updatedDoc = await connectionRef.get();
    const data = updatedDoc.data()!;

    const connection: ToolConnection = {
      id: connectionId,
      spaceId,
      source: data.source,
      target: data.target,
      transform: data.transform,
      enabled: data.enabled !== false,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
      createdBy: data.createdBy,
      label: data.label,
    };

    logger.info('[connection] Updated connection', {
      connectionId,
      spaceId,
      updates: Object.keys(updates),
      userId,
    });

    return NextResponse.json({
      connection,
      message: 'Connection updated successfully',
    });
  } catch (error) {
    logger.error('[connection] Error updating connection', {
      deploymentId,
      connectionId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Remove Connection
// ============================================================================

async function handleDelete(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ toolId: string; connectionId: string }> }
) {
  const { toolId: deploymentId, connectionId } = await params;
  const userId = getUserId(request);

  try {
    // Require officer role for deletion
    const access = await verifyToolAccess(deploymentId, userId, true);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.error === 'Tool not found' ? 404 : 403 }
      );
    }

    const spaceId = access.spaceId!;

    const connectionRef = dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('toolConnections')
      .doc(connectionId);

    const connectionDoc = await connectionRef.get();

    if (!connectionDoc.exists) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    const connectionData = connectionDoc.data()!;

    // Verify the connection involves this tool
    if (connectionData.source.deploymentId !== deploymentId &&
        connectionData.target.deploymentId !== deploymentId) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Delete the connection
    await connectionRef.delete();

    logger.info('[connection] Deleted connection', {
      connectionId,
      spaceId,
      sourceDeploymentId: connectionData.source.deploymentId,
      targetDeploymentId: connectionData.target.deploymentId,
      userId,
    });

    return NextResponse.json({
      message: 'Connection deleted successfully',
      connectionId,
    });
  } catch (error) {
    logger.error('[connection] Error deleting connection', {
      deploymentId,
      connectionId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

const _GET = withAuthAndErrors(handleGet);
export const PATCH = withAuthAndErrors(handlePatch);
export const DELETE = withAuthAndErrors(handleDelete);

export const GET = withCache(_GET, 'SHORT');

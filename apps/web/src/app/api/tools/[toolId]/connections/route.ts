/**
 * Tool Connections API Route
 *
 * Sprint 3: Tool-to-Tool Connections
 *
 * Endpoints:
 * - GET: List all connections for a tool (incoming and outgoing)
 * - POST: Create a new connection
 *
 * Firestore Path: spaces/{spaceId}/toolConnections/{connectionId}
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
import type { ToolConnection, DataTransform } from '@hive/core';
import { MAX_CONNECTIONS_PER_TOOL } from '@hive/core';
import { withCache } from '../../../../../lib/cache-headers';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SourceSchema = z.object({
  deploymentId: z.string().min(1, 'Source deployment ID required'),
  path: z.string().min(1, 'Source path required'),
});

const TargetSchema = z.object({
  deploymentId: z.string().min(1, 'Target deployment ID required'),
  elementId: z.string().min(1, 'Target element ID required'),
  inputPath: z.string().min(1, 'Target input path required'),
});

const CreateConnectionSchema = z.object({
  source: SourceSchema,
  target: TargetSchema,
  transform: z.enum([
    'toArray', 'toCount', 'toBoolean', 'toSorted', 'toTop5',
    'toKeys', 'toValues', 'flatten', 'unique'
  ] as const).optional(),
  label: z.string().max(100).optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

async function verifyToolAccess(
  deploymentId: string,
  userId: string
): Promise<{ allowed: boolean; error?: string; spaceId?: string; deployment?: FirebaseFirestore.DocumentSnapshot }> {
  const deploymentRef = dbAdmin.collection('deployedTools').doc(deploymentId);
  const deploymentDoc = await deploymentRef.get();

  if (!deploymentDoc.exists) {
    return { allowed: false, error: 'Tool not found' };
  }

  const deploymentData = deploymentDoc.data();
  const toolOwnerId = deploymentData?.createdBy || deploymentData?.ownerId;
  const spaceId = deploymentData?.targetId;

  // Must be deployed to a space for connections
  if (deploymentData?.deployedTo !== 'space' || !spaceId) {
    return { allowed: false, error: 'Tool must be deployed to a space for connections' };
  }

  // Check space membership using composite key pattern
  const compositeId = `${spaceId}_${userId}`;
  const memberDoc = await dbAdmin.collection('spaceMembers').doc(compositeId).get();

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
  }

  return { allowed: true, spaceId, deployment: deploymentDoc };
}

async function verifyBothToolsInSameSpace(
  sourceDeploymentId: string,
  targetDeploymentId: string
): Promise<{ valid: boolean; error?: string; spaceId?: string }> {
  const [sourceDoc, targetDoc] = await Promise.all([
    dbAdmin.collection('deployedTools').doc(sourceDeploymentId).get(),
    dbAdmin.collection('deployedTools').doc(targetDeploymentId).get(),
  ]);

  if (!sourceDoc.exists) {
    return { valid: false, error: 'Source tool not found' };
  }
  if (!targetDoc.exists) {
    return { valid: false, error: 'Target tool not found' };
  }

  const sourceData = sourceDoc.data();
  const targetData = targetDoc.data();

  if (sourceData?.deployedTo !== 'space' || targetData?.deployedTo !== 'space') {
    return { valid: false, error: 'Both tools must be deployed to a space' };
  }

  const sourceSpaceId = sourceData?.targetId;
  const targetSpaceId = targetData?.targetId;

  if (sourceSpaceId !== targetSpaceId) {
    return { valid: false, error: 'Tools must be in the same space' };
  }

  return { valid: true, spaceId: sourceSpaceId };
}

async function checkCircularDependency(
  spaceId: string,
  sourceDeploymentId: string,
  targetDeploymentId: string
): Promise<boolean> {
  // Check if target already connects back to source (would create a loop)
  const existingConnections = await dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('toolConnections')
    .where('source.deploymentId', '==', targetDeploymentId)
    .where('target.deploymentId', '==', sourceDeploymentId)
    .limit(1)
    .get();

  return !existingConnections.empty;
}

async function countToolConnections(spaceId: string, deploymentId: string): Promise<number> {
  // Count connections where this tool is either source or target
  const [asSource, asTarget] = await Promise.all([
    dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('toolConnections')
      .where('source.deploymentId', '==', deploymentId)
      .count()
      .get(),
    dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('toolConnections')
      .where('target.deploymentId', '==', deploymentId)
      .count()
      .get(),
  ]);

  return asSource.data().count + asTarget.data().count;
}

// ============================================================================
// GET - List Connections
// ============================================================================

async function handleGet(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const { toolId: deploymentId } = await params;
  const userId = getUserId(request);

  try {
    const access = await verifyToolAccess(deploymentId, userId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.error === 'Tool not found' ? 404 : 403 }
      );
    }

    const spaceId = access.spaceId!;

    // Get connections where this tool is source OR target
    const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
      dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('toolConnections')
        .where('source.deploymentId', '==', deploymentId)
        .get(),
      dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('toolConnections')
        .where('target.deploymentId', '==', deploymentId)
        .get(),
    ]);

    const connections: ToolConnection[] = [];
    const seenIds = new Set<string>();

    // Process outgoing connections
    outgoingSnapshot.docs.forEach((doc) => {
      if (!seenIds.has(doc.id)) {
        seenIds.add(doc.id);
        const data = doc.data();
        connections.push({
          id: doc.id,
          spaceId,
          source: data.source,
          target: data.target,
          transform: data.transform,
          enabled: data.enabled !== false,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
          createdBy: data.createdBy,
          label: data.label,
        } as ToolConnection);
      }
    });

    // Process incoming connections
    incomingSnapshot.docs.forEach((doc) => {
      if (!seenIds.has(doc.id)) {
        seenIds.add(doc.id);
        const data = doc.data();
        connections.push({
          id: doc.id,
          spaceId,
          source: data.source,
          target: data.target,
          transform: data.transform,
          enabled: data.enabled !== false,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
          createdBy: data.createdBy,
          label: data.label,
        } as ToolConnection);
      }
    });

    // Sort by creation date (newest first)
    connections.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      connections,
      outgoing: connections.filter(c => c.source.deploymentId === deploymentId).length,
      incoming: connections.filter(c => c.target.deploymentId === deploymentId).length,
    });
  } catch (error) {
    logger.error('[connections] Error listing connections', {
      deploymentId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to list connections' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Connection
// ============================================================================

async function handlePost(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const { toolId: deploymentId } = await params;
  const userId = getUserId(request);

  try {
    // Parse and validate body
    const body = await request.json();
    const parsed = CreateConnectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid connection data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { source, target, transform, label } = parsed.data;

    // Target must be the current tool (we're creating a connection TO this tool)
    if (target.deploymentId !== deploymentId) {
      return NextResponse.json(
        { error: 'Target must be the current tool' },
        { status: 400 }
      );
    }

    // Verify user has access to target tool
    const access = await verifyToolAccess(deploymentId, userId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.error === 'Tool not found' ? 404 : 403 }
      );
    }

    // Verify both tools are in the same space
    const spaceCheck = await verifyBothToolsInSameSpace(source.deploymentId, target.deploymentId);
    if (!spaceCheck.valid) {
      return NextResponse.json(
        { error: spaceCheck.error },
        { status: 400 }
      );
    }

    const spaceId = spaceCheck.spaceId!;

    // Check for circular dependencies
    const hasCircular = await checkCircularDependency(spaceId, source.deploymentId, target.deploymentId);
    if (hasCircular) {
      return NextResponse.json(
        { error: 'This connection would create a circular dependency' },
        { status: 400 }
      );
    }

    // Check connection limits
    const currentCount = await countToolConnections(spaceId, deploymentId);
    if (currentCount >= MAX_CONNECTIONS_PER_TOOL) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_CONNECTIONS_PER_TOOL} connections per tool reached` },
        { status: 400 }
      );
    }

    // Check for duplicate connection
    const existingConnection = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('toolConnections')
      .where('source.deploymentId', '==', source.deploymentId)
      .where('source.path', '==', source.path)
      .where('target.deploymentId', '==', target.deploymentId)
      .where('target.elementId', '==', target.elementId)
      .where('target.inputPath', '==', target.inputPath)
      .limit(1)
      .get();

    if (!existingConnection.empty) {
      return NextResponse.json(
        { error: 'This connection already exists' },
        { status: 409 }
      );
    }

    // Create the connection
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const connectionData: Omit<ToolConnection, 'id'> = {
      spaceId,
      source,
      target,
      transform: transform as DataTransform | undefined,
      enabled: true,
      createdAt: now,
      createdBy: userId,
      label,
    };

    await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('toolConnections')
      .doc(connectionId)
      .set(connectionData);

    const connection: ToolConnection = {
      id: connectionId,
      ...connectionData,
    };

    logger.info('[connections] Created connection', {
      connectionId,
      spaceId,
      sourceDeploymentId: source.deploymentId,
      targetDeploymentId: target.deploymentId,
      userId,
    });

    return NextResponse.json({
      connection,
      message: 'Connection created successfully',
    }, { status: 201 });
  } catch (error) {
    logger.error('[connections] Error creating connection', {
      deploymentId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

const _GET = withAuthAndErrors(handleGet);
export const POST = withAuthAndErrors(handlePost);

export const GET = withCache(_GET, 'SHORT');

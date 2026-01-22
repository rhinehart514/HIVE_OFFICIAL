/**
 * Tool Version Restore API
 *
 * POST /api/tools/[toolId]/versions/[version]/restore - Restore tool to a specific version
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { dbAdmin } from '@/lib/firebase-admin';

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// ============================================================================
// Helper: Get authenticated user
// ============================================================================

async function getAuthenticatedUser(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

// ============================================================================
// POST /api/tools/[toolId]/versions/[version]/restore
// ============================================================================

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ toolId: string; version: string }> },
) {
  try {
    const { toolId, version } = await context.params;

    if (!toolId || !version) {
      return errorResponse('Tool ID and version are required', 400);
    }

    // Check authentication
    const session = await getAuthenticatedUser();
    if (!session) {
      return errorResponse('Not authenticated', 401);
    }

    const { userId } = session;

    // Get the tool document
    const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();

    if (!toolDoc.exists) {
      return errorResponse('Tool not found', 404);
    }

    const toolData = toolDoc.data();

    // Check authorization - only owner can restore
    if (toolData?.ownerId !== userId) {
      return errorResponse('Not authorized to restore this tool', 403);
    }

    // Get the version to restore
    const versionDoc = await dbAdmin
      .collection('tools')
      .doc(toolId)
      .collection('versions')
      .doc(version)
      .get();

    if (!versionDoc.exists) {
      return errorResponse(`Version "${version}" not found`, 404);
    }

    const versionData = versionDoc.data();
    const snapshot = versionData?.snapshot;

    if (!snapshot) {
      return errorResponse(`Version "${version}" has no snapshot to restore`, 400);
    }

    const now = new Date();

    // Create a new version snapshot of current state before restoring
    const currentElements = toolData?.elements || [];
    const currentConnections = toolData?.connections || [];
    const currentConfig = toolData?.config || {};

    const backupVersion = `backup_${Date.now()}`;
    await dbAdmin
      .collection('tools')
      .doc(toolId)
      .collection('versions')
      .doc(backupVersion)
      .set({
        version: backupVersion,
        changelog: `Auto-backup before restoring to version ${version}`,
        createdAt: now,
        createdBy: userId,
        isStable: false,
        snapshot: {
          elements: currentElements,
          connections: currentConnections,
          config: currentConfig,
        },
      });

    // Restore the tool to the selected version
    await dbAdmin.collection('tools').doc(toolId).update({
      elements: snapshot.elements || [],
      connections: snapshot.connections || [],
      config: snapshot.config || {},
      'metadata.currentVersion': version,
      'metadata.restoredFrom': version,
      'metadata.restoredAt': now.toISOString(),
      updatedAt: now,
    });

    // Create a new version entry for the restore action
    const newVersion = `${version}_restored_${Date.now()}`;
    await dbAdmin
      .collection('tools')
      .doc(toolId)
      .collection('versions')
      .doc(newVersion)
      .set({
        version: newVersion,
        changelog: `Restored from version ${version}`,
        createdAt: now,
        createdBy: userId,
        isStable: false,
        snapshot: {
          elements: snapshot.elements || [],
          connections: snapshot.connections || [],
          config: snapshot.config || {},
        },
      });

    // Track analytics
    await dbAdmin.collection('analytics_events').add({
      eventType: 'tool_version_restored',
      userId,
      toolId,
      timestamp: now,
      metadata: {
        restoredVersion: version,
        backupVersion,
        newVersion,
      },
    });

    return jsonResponse({
      message: `Tool restored to version "${version}"`,
      backupVersion,
      newVersion,
    });
  } catch (error) {
    console.error('Error restoring tool version:', error);
    return errorResponse('Failed to restore tool version', 500);
  }
}

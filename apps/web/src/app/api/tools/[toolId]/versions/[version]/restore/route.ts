/**
 * Version Restore API
 *
 * POST /api/tools/[toolId]/versions/[version]/restore — Restore tool to a previous version
 */

import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { getNextVersion } from '@hive/core';
import { createHash } from 'crypto';

function hashComposition(data: Record<string, unknown>): string {
  const relevant = {
    elements: data.elements,
    connections: data.connections,
    pages: data.pages,
    layout: data.layout,
    config: data.config,
    name: data.name,
    description: data.description,
  };
  const json = JSON.stringify(relevant, Object.keys(relevant).sort());
  return createHash('sha256').update(json).digest('hex').slice(0, 16);
}

export const POST = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string; version: string }> },
  respond
) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const { toolId, version } = await params;

  // Verify ownership
  const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();
  if (!toolDoc.exists) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }
  const tool = toolDoc.data()!;
  if (tool.ownerId !== userId && tool.createdBy !== userId) {
    return respond.error('Access denied', 'FORBIDDEN', { status: 403 });
  }

  // Fetch the version to restore
  const versionDoc = await toolDoc.ref
    .collection('versions')
    .doc(version)
    .get();

  if (!versionDoc.exists) {
    return respond.error('Version not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }

  const versionData = versionDoc.data()!;

  // Verify the version has a full snapshot (elements at minimum)
  if (!versionData.elements || !Array.isArray(versionData.elements)) {
    return respond.error(
      'This version does not contain a full snapshot and cannot be restored',
      'INVALID_INPUT',
      { status: 400 }
    );
  }

  // Build the restore payload
  const restoreData: Record<string, unknown> = {
    elements: versionData.elements,
    connections: versionData.connections || [],
    name: versionData.name || tool.name,
    description: versionData.description || tool.description,
    updatedAt: new Date(),
  };

  if (versionData.pages) restoreData.pages = versionData.pages;
  if (versionData.layout) restoreData.layout = versionData.layout;
  if (versionData.config) restoreData.config = versionData.config;

  // Bump version number for the restore
  const currentVersion = (tool.currentVersion as string) || '1.0.0';
  const newVersion = getNextVersion(currentVersion);
  const compositionHash = hashComposition(restoreData);

  restoreData.currentVersion = newVersion;
  restoreData.compositionHash = compositionHash;

  // Update the tool document
  await toolDoc.ref.update(restoreData);

  // Create a new version entry documenting the restore
  const now = new Date();
  await toolDoc.ref.collection('versions').doc(newVersion).set({
    version: newVersion,
    changelog: `Restored from version ${version}`,
    createdAt: now,
    createdBy: userId,
    isStable: false,
    compositionHash,
    restoredFrom: version,
    elements: versionData.elements,
    connections: versionData.connections || [],
    pages: versionData.pages,
    layout: versionData.layout,
    config: versionData.config,
    name: restoreData.name,
    description: restoreData.description,
    elementCount: versionData.elements.length,
  });

  return respond.success({
    success: true,
    restoredFrom: version,
    newVersion,
  });
});

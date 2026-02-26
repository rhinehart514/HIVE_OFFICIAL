/**
 * Version History API
 *
 * GET /api/tools/[toolId]/versions — List all versions (lightweight)
 * GET /api/tools/[toolId]/versions?version={n} — Get full composition for specific version
 */

import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const { toolId } = await params;

  // Verify ownership
  const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();
  if (!toolDoc.exists) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }
  const tool = toolDoc.data();
  if (tool?.ownerId !== userId && tool?.createdBy !== userId) {
    return respond.error('Access denied', 'FORBIDDEN', { status: 403 });
  }

  const url = new URL(request.url);
  const specificVersion = url.searchParams.get('version');

  if (specificVersion) {
    // Return full composition for a specific version
    const versionDoc = await toolDoc.ref
      .collection('versions')
      .doc(specificVersion)
      .get();

    if (!versionDoc.exists) {
      return respond.error('Version not found', 'RESOURCE_NOT_FOUND', { status: 404 });
    }

    return respond.success({
      version: { id: versionDoc.id, ...versionDoc.data() },
    });
  }

  // List all versions (lightweight — exclude full composition data)
  const versionsSnapshot = await toolDoc.ref
    .collection('versions')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  const versions = versionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      version: doc.id,
      createdAt: data.createdAt,
      createdBy: data.createdBy,
      changelog: data.changelog,
      elementCount: data.elementCount || (Array.isArray(data.elements) ? data.elements.length : undefined),
      compositionHash: data.compositionHash,
      isStable: data.isStable,
    };
  });

  return respond.success({ versions });
});

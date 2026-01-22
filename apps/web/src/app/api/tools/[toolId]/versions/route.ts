/**
 * Tool Versions API
 *
 * GET /api/tools/[toolId]/versions - List all versions of a tool
 */

import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';

// ============================================================================
// Version DTO
// ============================================================================

interface VersionDTO {
  version: string;
  changelog: string;
  createdAt: string;
  createdBy: string;
  isStable: boolean;
  isCurrent: boolean;
  elementCount?: number;
  connectionCount?: number;
}

// ============================================================================
// GET /api/tools/[toolId]/versions
// ============================================================================

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { toolId } = await params;

  if (!toolId) {
    return respond.error('Tool ID is required', 'INVALID_INPUT', { status: 400 });
  }

  // Get the tool document
  const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();

  if (!toolDoc.exists) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }

  const toolData = toolDoc.data();

  // Campus isolation check
  if (toolData?.campusId !== campusId) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }

  // Check authorization - must be owner or tool must be published
  if (toolData?.ownerId !== userId && toolData?.status !== 'published') {
    return respond.error('Not authorized to view this tool', 'FORBIDDEN', { status: 403 });
  }

  // Get all versions
  const versionsSnapshot = await dbAdmin
    .collection('tools')
    .doc(toolId)
    .collection('versions')
    .orderBy('createdAt', 'desc')
    .get();

  // Get current version from tool metadata
  const currentVersion = toolData?.metadata?.currentVersion || '1.0.0';

  // Map to DTOs
  const versions: VersionDTO[] = versionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      version: doc.id,
      changelog: data.changelog || '',
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      createdBy: data.createdBy || '',
      isStable: data.isStable || false,
      isCurrent: doc.id === currentVersion,
      elementCount: data.snapshot?.elements?.length,
      connectionCount: data.snapshot?.connections?.length,
    };
  });

  return respond.success({
    versions,
    currentVersion,
    total: versions.length,
  });
});

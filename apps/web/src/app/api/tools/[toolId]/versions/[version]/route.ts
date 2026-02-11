/**
 * Tool Version Detail API
 *
 * GET /api/tools/[toolId]/versions/[version] - Get specific version details
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { withCache } from '../../../../../../lib/cache-headers';

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
// Version Detail DTO
// ============================================================================

interface VersionDetailDTO {
  version: string;
  changelog: string;
  createdAt: string;
  createdBy: string;
  isStable: boolean;
  isCurrent: boolean;
  snapshot?: {
    elements: unknown[];
    connections: unknown[];
    config: Record<string, unknown>;
  };
}

// ============================================================================
// GET /api/tools/[toolId]/versions/[version]
// ============================================================================

async function _GET(
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

    // Check authorization
    if (toolData?.ownerId !== userId && toolData?.status !== 'published') {
      return errorResponse('Not authorized to view this tool', 403);
    }

    // Get the specific version
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
    const currentVersion = toolData?.metadata?.currentVersion || '1.0.0';

    const dto: VersionDetailDTO = {
      version: versionDoc.id,
      changelog: versionData?.changelog || '',
      createdAt: versionData?.createdAt?.toDate?.()?.toISOString() || versionData?.createdAt,
      createdBy: versionData?.createdBy || '',
      isStable: versionData?.isStable || false,
      isCurrent: versionDoc.id === currentVersion,
      snapshot: versionData?.snapshot,
    };

    return jsonResponse({ version: dto });
  } catch (error) {
    logger.error('Error getting tool version', error instanceof Error ? error : new Error(String(error)));
    return errorResponse('Failed to get tool version', 500);
  }
}

export const GET = withCache(_GET, 'SHORT');

/**
 * Tool Versions API
 *
 * GET /api/tools/[toolId]/versions - List all versions of a tool
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { dbAdmin } from '@/lib/firebase-admin';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ toolId: string }> },
) {
  try {
    const { toolId } = await context.params;

    if (!toolId) {
      return errorResponse('Tool ID is required', 400);
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

    // Check authorization - must be owner or tool must be published
    if (toolData?.ownerId !== userId && toolData?.status !== 'published') {
      return errorResponse('Not authorized to view this tool', 403);
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

    return jsonResponse({
      versions,
      currentVersion,
      total: versions.length,
    });
  } catch (error) {
    console.error('Error listing tool versions:', error);
    return errorResponse('Failed to list tool versions', 500);
  }
}

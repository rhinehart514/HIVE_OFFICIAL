/**
 * Setup Deployments API
 *
 * GET /api/setups/deployments - List user's setup deployments
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getServerSetupDeploymentRepository,
  toSetupDeploymentListDTO,
} from '@hive/core/server';

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
// GET /api/setups/deployments
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return errorResponse('Not authenticated', 401);
    }

    // Parse session
    let session: { userId: string; campusId: string };
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return errorResponse('Invalid session', 401);
    }

    const { userId, campusId } = session;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId') || undefined;
    const status = searchParams.get('status') as 'active' | 'paused' | 'completed' | 'archived' | undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor') || undefined;

    // Get repository
    const deploymentRepo = getServerSetupDeploymentRepository();

    // Query deployments
    const result = await deploymentRepo.findMany({
      deployedBy: userId,
      campusId,
      spaceId,
      status,
      orderBy: 'deployedAt',
      orderDirection: 'desc',
      limit,
      cursor,
    });

    if (result.isFailure) {
      return errorResponse(result.error ?? 'Failed to fetch deployments', 500);
    }

    const { items, hasMore, nextCursor } = result.getValue();

    // Convert to DTOs
    const deployments = items.map(toSetupDeploymentListDTO);

    return jsonResponse({
      deployments,
      total: deployments.length,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error('[API] Error fetching deployments:', error);
    return errorResponse('Failed to fetch deployments', 500);
  }
}

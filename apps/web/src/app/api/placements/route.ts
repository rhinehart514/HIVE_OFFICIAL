/**
 * Placement API
 *
 * GET /api/placements - Query tool placements
 *
 * Provides first-class API for PlacedTool entities, independent of deploy flow.
 * Supports filtering by spaceId, profileId, toolId, and status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// ============================================================================
// Query Parameters
// ============================================================================

interface PlacementQuery {
  spaceId?: string;
  profileId?: string;
  toolId?: string;
  status?: 'active' | 'paused' | 'disabled';
  limit?: number;
  offset?: number;
}

function parseQuery(searchParams: URLSearchParams): PlacementQuery {
  return {
    spaceId: searchParams.get('spaceId') || undefined,
    profileId: searchParams.get('profileId') || undefined,
    toolId: searchParams.get('toolId') || undefined,
    status: (searchParams.get('status') as PlacementQuery['status']) || undefined,
    limit: Math.min(parseInt(searchParams.get('limit') || '50', 10), 100),
    offset: parseInt(searchParams.get('offset') || '0', 10),
  };
}

// ============================================================================
// Permission Checks
// ============================================================================

async function canViewSpacePlacements(userId: string, spaceId: string): Promise<boolean> {
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  if (!spaceDoc.exists) return false;

  const spaceData = spaceDoc.data();
  if (spaceData?.campusId && spaceData.campusId !== CURRENT_CAMPUS_ID) {
    return false;
  }

  // Any member can view placements
  return !!spaceData?.members?.[userId];
}

// ============================================================================
// GET /api/placements
// ============================================================================

export const GET = withAuthAndErrors(async (request, _context, respond) => {
  try {
    const userId = getUserId(request as AuthenticatedRequest);
    const searchParams = new URL(request.url).searchParams;
    const query = parseQuery(searchParams);

    // Must specify either spaceId or profileId
    if (!query.spaceId && !query.profileId) {
      return respond.error(
        'Either spaceId or profileId is required',
        'INVALID_INPUT',
        { status: 400 }
      );
    }

    // Permission check
    if (query.spaceId) {
      const canView = await canViewSpacePlacements(userId, query.spaceId);
      if (!canView) {
        return respond.error(
          'Access denied to space placements',
          'FORBIDDEN',
          { status: 403 }
        );
      }
    }

    if (query.profileId && query.profileId !== userId) {
      // Can only view own profile placements
      return respond.error(
        'Can only view your own profile placements',
        'FORBIDDEN',
        { status: 403 }
      );
    }

    // Build query path
    const collectionPath = query.spaceId
      ? `spaces/${query.spaceId}/placed_tools`
      : `users/${query.profileId}/placed_tools`;

    let placementsQuery = dbAdmin.collection(collectionPath).orderBy('order', 'asc');

    // Filter by toolId if provided
    if (query.toolId) {
      placementsQuery = placementsQuery.where('toolId', '==', query.toolId);
    }

    // Filter by status (isActive field)
    if (query.status) {
      if (query.status === 'active') {
        placementsQuery = placementsQuery.where('isActive', '==', true);
      } else if (query.status === 'paused' || query.status === 'disabled') {
        placementsQuery = placementsQuery.where('isActive', '==', false);
      }
    }

    // Pagination
    if (query.offset && query.offset > 0) {
      placementsQuery = placementsQuery.offset(query.offset);
    }
    placementsQuery = placementsQuery.limit(query.limit || 50);

    const snapshot = await placementsQuery.get();

    // Enrich with tool data
    const placements = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const placementData = doc.data();
        const toolId = placementData.toolId as string;

        // Fetch tool info
        let toolInfo = null;
        try {
          const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();
          if (toolDoc.exists) {
            const toolData = toolDoc.data();
            toolInfo = {
              id: toolDoc.id,
              name: toolData?.name,
              description: toolData?.description,
              icon: toolData?.icon,
              category: toolData?.category,
            };
          }
        } catch {
          // Tool may have been deleted
        }

        // Get deployment record for governance info
        let governanceInfo = null;
        if (placementData.deploymentId) {
          try {
            const deploymentDoc = await dbAdmin
              .collection('deployedTools')
              .where('placementId', '==', doc.id)
              .limit(1)
              .get();

            if (!deploymentDoc.empty) {
              const deploymentData = deploymentDoc.docs[0].data();
              governanceInfo = {
                capabilityLane: deploymentData.capabilityLane,
                capabilities: deploymentData.capabilities,
                budgets: deploymentData.budgets,
                status: deploymentData.status,
                experimental: deploymentData.experimental,
                surfaceModes: deploymentData.surfaceModes,
              };
            }
          } catch {
            // Deployment may not exist
          }
        }

        return {
          id: doc.id,
          toolId: placementData.toolId,
          placement: placementData.placement,
          order: placementData.order,
          isActive: placementData.isActive,
          source: placementData.source,
          placedBy: placementData.placedBy,
          placedAt: placementData.placedAt?.toDate?.()?.toISOString() || placementData.placedAt,
          configOverrides: placementData.configOverrides || {},
          visibility: placementData.visibility,
          titleOverride: placementData.titleOverride,
          isEditable: placementData.isEditable,
          state: placementData.state || {},
          stateUpdatedAt: placementData.stateUpdatedAt?.toDate?.()?.toISOString() || placementData.stateUpdatedAt,
          // Enrichments
          tool: toolInfo,
          governance: governanceInfo,
          // Context
          context: {
            type: query.spaceId ? 'space' : 'profile',
            id: query.spaceId || query.profileId,
          },
        };
      })
    );

    return respond.success({
      placements,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        returned: placements.length,
        hasMore: placements.length === query.limit,
      },
    });
  } catch (error) {
    logger.error('Error fetching placements', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch placements', 'INTERNAL_ERROR', {
      status: 500,
    });
  }
});

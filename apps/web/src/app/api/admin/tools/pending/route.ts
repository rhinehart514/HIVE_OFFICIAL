/**
 * Admin Pending Tools API
 *
 * GET: Fetch tools awaiting review
 *
 * This is a P1 cross-slice integration endpoint connecting Admin with HiveLab.
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../../lib/cache-headers';

const PendingQuerySchema = z.object({
  sortBy: z.enum(['createdAt', 'toolName', 'creator']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 50),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
});

interface PendingTool {
  id: string;
  requestId: string;
  toolId: string;
  toolName: string;
  toolDescription?: string;
  toolCategory?: string;
  creatorId: string;
  creatorName?: string;
  creatorHandle?: string;
  targetSpaceId?: string;
  targetSpaceName?: string;
  status: 'pending' | 'in_review';
  aiQualityScore?: number;
  aiFlags?: string[];
  elementCount: number;
  previewUrl?: string;
  createdAt: string;
  lastUpdated?: string;
}

/**
 * GET /api/admin/tools/pending
 * Fetch tools awaiting review
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = PendingQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const query = queryResult.data;

  try {
    // Fetch pending publish requests
    const requestsQuery = dbAdmin
      .collection('toolPublishRequests')
      .where('campusId', '==', campusId)
      .where('status', 'in', ['pending', 'in_review'])
      .orderBy('createdAt', 'desc');

    const requestsSnapshot = await requestsQuery.limit(200).get();

    const pendingTools: PendingTool[] = [];

    for (const requestDoc of requestsSnapshot.docs) {
      const requestData = requestDoc.data();

      // Fetch tool details
      let toolData: Record<string, unknown> = {};
      if (requestData.toolId) {
        const toolDoc = await dbAdmin.collection('tools').doc(requestData.toolId).get();
        if (toolDoc.exists) {
          toolData = toolDoc.data() || {};
        }
      }

      // Fetch creator info
      let creatorData: Record<string, unknown> = {};
      if (requestData.userId) {
        const creatorDoc = await dbAdmin.collection('profiles').doc(requestData.userId).get();
        if (creatorDoc.exists) {
          creatorData = creatorDoc.data() || {};
        }
      }

      // Fetch target space info
      let spaceData: Record<string, unknown> = {};
      if (requestData.targetSpaceId) {
        const spaceDoc = await dbAdmin.collection('spaces').doc(requestData.targetSpaceId).get();
        if (spaceDoc.exists) {
          spaceData = spaceDoc.data() || {};
        }
      }

      pendingTools.push({
        id: requestData.toolId || requestDoc.id,
        requestId: requestDoc.id,
        toolId: requestData.toolId,
        toolName: (toolData.name as string) || requestData.toolName || 'Unnamed Tool',
        toolDescription: (toolData.description as string) || requestData.description,
        toolCategory: (toolData.category as string) || requestData.category,
        creatorId: requestData.userId,
        creatorName: (creatorData.displayName as string) || undefined,
        creatorHandle: (creatorData.handle as string) || undefined,
        targetSpaceId: requestData.targetSpaceId,
        targetSpaceName: (spaceData.name as string) || undefined,
        status: requestData.status,
        aiQualityScore: requestData.aiQualityScore,
        aiFlags: requestData.aiFlags,
        elementCount: (toolData.elements as unknown[])?.length || 0,
        previewUrl: toolData.previewUrl as string,
        createdAt: requestData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastUpdated: requestData.updatedAt?.toDate?.()?.toISOString(),
      });
    }

    // Sort
    pendingTools.sort((a, b) => {
      let comparison = 0;
      switch (query.sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'toolName':
          comparison = a.toolName.localeCompare(b.toolName);
          break;
        case 'creator':
          comparison = (a.creatorName || '').localeCompare(b.creatorName || '');
          break;
      }
      return query.sortOrder === 'desc' ? -comparison : comparison;
    });

    // Get summary stats
    const stats = {
      total: pendingTools.length,
      pending: pendingTools.filter(t => t.status === 'pending').length,
      inReview: pendingTools.filter(t => t.status === 'in_review').length,
      withFlags: pendingTools.filter(t => t.aiFlags && t.aiFlags.length > 0).length,
      avgQualityScore: pendingTools.length > 0
        ? Math.round(
            pendingTools
              .filter(t => t.aiQualityScore !== undefined)
              .reduce((sum, t) => sum + (t.aiQualityScore || 0), 0) /
            pendingTools.filter(t => t.aiQualityScore !== undefined).length
          )
        : 0,
    };

    // Apply pagination
    const total = pendingTools.length;
    const paginatedTools = pendingTools.slice(query.offset, query.offset + query.limit);

    logger.info('Pending tools fetched', {
      total,
    });

    return respond.success({
      tools: paginatedTools,
      stats,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + paginatedTools.length < total,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch pending tools', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch pending tools', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'PRIVATE');

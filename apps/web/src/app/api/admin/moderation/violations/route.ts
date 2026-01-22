/**
 * Admin Violations API
 *
 * GET: Fetch user violation history
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';

const ViolationsQuerySchema = z.object({
  userId: z.string().optional(),
  type: z.enum(['all', 'warning', 'suspension', 'ban', 'content_removal']).optional().default('all'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 50),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
});

interface Violation {
  id: string;
  userId: string;
  userName?: string;
  userHandle?: string;
  type: 'warning' | 'suspension' | 'ban' | 'content_removal';
  reason: string;
  reportId?: string;
  issuedBy: string;
  issuedByName?: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

/**
 * GET /api/admin/moderation/violations
 * Fetch violation history
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = ViolationsQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const query = queryResult.data;

  try {
    const violations: Violation[] = [];

    // Fetch warnings
    if (query.type === 'all' || query.type === 'warning') {
      let warningsQuery = dbAdmin.collection('userWarnings').orderBy('createdAt', 'desc');

      if (query.userId) {
        warningsQuery = warningsQuery.where('userId', '==', query.userId);
      }

      const warningsSnapshot = await warningsQuery.limit(100).get();

      for (const doc of warningsSnapshot.docs) {
        const data = doc.data();
        violations.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userHandle: data.userHandle,
          type: 'warning',
          reason: data.reason,
          reportId: data.reportId,
          issuedBy: data.issuedBy,
          issuedByName: data.issuedByName,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          isActive: true,
        });
      }
    }

    // Fetch suspensions and bans from profiles
    if (query.type === 'all' || query.type === 'suspension' || query.type === 'ban') {
      let profilesQuery = dbAdmin
        .collection('profiles')
        .where('campusId', '==', campusId)
        .where('status', 'in', ['suspended', 'banned']);

      if (query.userId) {
        profilesQuery = dbAdmin.collection('profiles').where('__name__', '==', query.userId);
      }

      const profilesSnapshot = await profilesQuery.limit(100).get();

      for (const doc of profilesSnapshot.docs) {
        const data = doc.data();

        if (data.status === 'suspended' && (query.type === 'all' || query.type === 'suspension')) {
          const isActive = !data.suspendedUntil || new Date(data.suspendedUntil.toDate()) > new Date();
          violations.push({
            id: `suspension-${doc.id}`,
            userId: doc.id,
            userName: data.displayName,
            userHandle: data.handle,
            type: 'suspension',
            reason: data.suspendedReason || 'No reason provided',
            issuedBy: data.suspendedBy,
            createdAt: data.suspendedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            expiresAt: data.suspendedUntil?.toDate?.()?.toISOString(),
            isActive,
          });
        }

        if (data.status === 'banned' && (query.type === 'all' || query.type === 'ban')) {
          violations.push({
            id: `ban-${doc.id}`,
            userId: doc.id,
            userName: data.displayName,
            userHandle: data.handle,
            type: 'ban',
            reason: data.bannedReason || 'No reason provided',
            issuedBy: data.bannedBy,
            createdAt: data.bannedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            isActive: true,
          });
        }
      }
    }

    // Fetch content removals
    if (query.type === 'all' || query.type === 'content_removal') {
      let removalsQuery = dbAdmin
        .collection('contentReports')
        .where('campusId', '==', campusId)
        .where('actionTaken', '==', 'remove_content')
        .orderBy('resolvedAt', 'desc');

      if (query.userId) {
        removalsQuery = removalsQuery.where('targetUserId', '==', query.userId);
      }

      const removalsSnapshot = await removalsQuery.limit(100).get();

      for (const doc of removalsSnapshot.docs) {
        const data = doc.data();
        violations.push({
          id: `removal-${doc.id}`,
          userId: data.targetUserId,
          userName: data.targetUserName,
          type: 'content_removal',
          reason: data.resolution || 'Content removed',
          reportId: doc.id,
          issuedBy: data.resolvedBy,
          createdAt: data.resolvedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          isActive: false,
        });
      }
    }

    // Apply date filters
    let filteredViolations = violations;

    if (query.startDate) {
      const startDate = new Date(query.startDate);
      filteredViolations = filteredViolations.filter(v => new Date(v.createdAt) >= startDate);
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      filteredViolations = filteredViolations.filter(v => new Date(v.createdAt) <= endDate);
    }

    // Sort by date descending
    filteredViolations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const total = filteredViolations.length;
    const paginatedViolations = filteredViolations.slice(query.offset, query.offset + query.limit);

    // Get summary stats
    const stats = {
      total: violations.length,
      warnings: violations.filter(v => v.type === 'warning').length,
      activeSuspensions: violations.filter(v => v.type === 'suspension' && v.isActive).length,
      bans: violations.filter(v => v.type === 'ban').length,
      contentRemovals: violations.filter(v => v.type === 'content_removal').length,
    };

    logger.info('Violations fetched', {
      total,
      filters: query,
    });

    return respond.success({
      violations: paginatedViolations,
      stats,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + paginatedViolations.length < total,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch violations', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch violations', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

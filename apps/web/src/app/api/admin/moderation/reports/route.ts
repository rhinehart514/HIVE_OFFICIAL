/**
 * Admin Moderation Reports API
 *
 * GET: Fetch all content reports with filtering
 * POST: Create a new report (admin-initiated)
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { logAdminActivity } from '@/lib/admin-activity';
import { withCache } from '../../../../../lib/cache-headers';

const ListQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'reviewed', 'resolved', 'dismissed']).optional().default('all'),
  contentType: z.enum(['all', 'message', 'space', 'tool', 'profile', 'post']).optional().default('all'),
  reportType: z.enum(['all', 'spam', 'harassment', 'inappropriate', 'other']).optional().default('all'),
  targetUserId: z.string().optional(),
  spaceId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'priority', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 50),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
});

const CreateReportSchema = z.object({
  contentType: z.enum(['message', 'space', 'tool', 'profile', 'post']),
  contentId: z.string().min(1),
  contentPreview: z.string().max(500).optional(),
  reportType: z.enum(['spam', 'harassment', 'inappropriate', 'other']),
  targetUserId: z.string().optional(),
  reason: z.string().min(1).max(1000),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  spaceId: z.string().optional(),
});

/**
 * GET /api/admin/moderation/reports
 * Fetch all reports with filtering
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const queryResult = ListQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const query = queryResult.data;

  try {
    // Build base query
    let reportsQuery = dbAdmin
      .collection('contentReports')
      .where('campusId', '==', campusId);

    // Apply status filter
    if (query.status !== 'all') {
      reportsQuery = reportsQuery.where('status', '==', query.status);
    }

    // Apply content type filter
    if (query.contentType !== 'all') {
      reportsQuery = reportsQuery.where('contentType', '==', query.contentType);
    }

    // Apply target user filter
    if (query.targetUserId) {
      reportsQuery = reportsQuery.where('targetUserId', '==', query.targetUserId);
    }

    // Apply space filter
    if (query.spaceId) {
      reportsQuery = reportsQuery.where('spaceId', '==', query.spaceId);
    }

    // Sort
    reportsQuery = reportsQuery.orderBy(query.sortBy, query.sortOrder);

    // Execute query
    const snapshot = await reportsQuery.limit(200).get();

    let reports = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        contentType: data.contentType,
        contentId: data.contentId,
        contentPreview: data.contentPreview || '',
        reportType: data.reportType,
        reportedBy: data.reportedBy,
        reportedByName: data.reportedByName,
        targetUserId: data.targetUserId,
        targetUserName: data.targetUserName,
        spaceId: data.spaceId,
        spaceName: data.spaceName,
        reason: data.reason,
        status: data.status,
        priority: data.priority || 'medium',
        aiScore: data.aiScore,
        aiFlags: data.aiFlags || [],
        resolution: data.resolution,
        resolvedBy: data.resolvedBy,
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString(),
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
      };
    });

    // Apply in-memory filters for report type (if not supported by composite index)
    if (query.reportType !== 'all') {
      reports = reports.filter(r => r.reportType === query.reportType);
    }

    // Apply date filters
    if (query.startDate) {
      const startDate = new Date(query.startDate);
      reports = reports.filter(r => new Date(r.createdAt) >= startDate);
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      reports = reports.filter(r => new Date(r.createdAt) <= endDate);
    }

    // Apply pagination
    const total = reports.length;
    reports = reports.slice(query.offset, query.offset + query.limit);

    // Get summary stats
    const statsSnapshot = await dbAdmin
      .collection('contentReports')
      .where('campusId', '==', campusId)
      .get();

    const allReports = statsSnapshot.docs.map(d => d.data());
    const stats = {
      total: allReports.length,
      pending: allReports.filter(r => r.status === 'pending').length,
      resolved: allReports.filter(r => r.status === 'resolved').length,
      dismissed: allReports.filter(r => r.status === 'dismissed').length,
      byType: {
        spam: allReports.filter(r => r.reportType === 'spam').length,
        harassment: allReports.filter(r => r.reportType === 'harassment').length,
        inappropriate: allReports.filter(r => r.reportType === 'inappropriate').length,
        other: allReports.filter(r => r.reportType === 'other').length,
      },
    };

    logger.info('Reports list fetched', {
      total,
      filters: query,
    });

    return respond.success({
      reports,
      stats,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + reports.length < total,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch reports', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch reports', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * POST /api/admin/moderation/reports
 * Create a new admin-initiated report
 */
export const POST = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  try {
    const body = await request.json();
    const parseResult = CreateReportSchema.safeParse(body);

    if (!parseResult.success) {
      return respond.error('Invalid request body', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
        details: parseResult.error.flatten(),
      });
    }

    const reportData = parseResult.data;

    // Create the report
    const reportDoc = {
      ...reportData,
      campusId,
      reportedBy: adminId,
      reportedByName: 'Admin',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await dbAdmin.collection('contentReports').add(reportDoc);

    // Log admin activity
    await logAdminActivity({
      adminId,
      action: 'report_created',
      targetType: 'content',
      targetId: reportData.contentId,
      details: {
        reportId: docRef.id,
        contentType: reportData.contentType,
        reportType: reportData.reportType,
        priority: reportData.priority,
      },
    });

    logger.info('Admin report created', {
      adminId,
      reportId: docRef.id,
      contentType: reportData.contentType,
    });

    return respond.success({
      message: 'Report created successfully',
      reportId: docRef.id,
    });
  } catch (error) {
    logger.error('Failed to create report', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
    });
    return respond.error('Failed to create report', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'PRIVATE');

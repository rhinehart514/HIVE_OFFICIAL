/**
 * Admin Users API Routes
 *
 * Platform-level user administration endpoints:
 * - GET: List all users with filters, search, and pagination
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

// Query params schema
const ListQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['user', 'builder', 'admin', 'super_admin']).optional(),
  status: z.enum(['active', 'suspended', 'pending']).optional(),
  sortBy: z.enum(['createdAt', 'lastActive', 'displayName']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 50),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
});

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  campusId: string;
  createdAt: FirebaseFirestore.Timestamp;
  lastActive: FirebaseFirestore.Timestamp | null;
  onboardingCompleted: boolean;
  spaceMemberships: string[];
}

/**
 * GET /api/admin/users
 * List all users with admin-level filters
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
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
    // Build Firestore query
    let usersQuery = dbAdmin
      .collection('profiles')
      .where('campusId', '==', campusId);

    // Apply filters
    if (query.status) {
      usersQuery = usersQuery.where('status', '==', query.status);
    }

    if (query.role) {
      usersQuery = usersQuery.where('role', '==', query.role);
    }

    // Execute query
    const snapshot = await usersQuery
      .orderBy(query.sortBy, query.sortOrder)
      .limit(query.limit + 1) // +1 to check if there are more
      .offset(query.offset)
      .get();

    let users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        displayName: data.displayName || '',
        handle: data.handle || '',
        avatarUrl: data.avatarUrl || null,
        role: data.role || 'user',
        status: data.status || 'active',
        campusId: data.campusId,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        lastActive: data.lastActive?.toDate?.()?.toISOString() || null,
        onboardingCompleted: data.onboardingCompleted || false,
        spaceMemberships: data.spaceMemberships || [],
      };
    });

    // Apply client-side search filter if provided (Firestore doesn't support full-text search)
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      users = users.filter(user =>
        user.displayName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.handle.toLowerCase().includes(searchLower)
      );
    }

    // Check if there are more results
    const hasMore = users.length > query.limit;
    if (hasMore) {
      users = users.slice(0, query.limit);
    }

    // Get summary counts
    const summarySnapshot = await dbAdmin
      .collection('profiles')
      .where('campusId', '==', campusId)
      .get();

    const summary = {
      total: summarySnapshot.size,
      active: 0,
      suspended: 0,
      pending: 0,
      builders: 0,
      admins: 0,
    };

    summarySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'suspended') summary.suspended++;
      else if (data.status === 'pending') summary.pending++;
      else summary.active++;

      if (data.role === 'builder') summary.builders++;
      if (data.role === 'admin' || data.role === 'super_admin') summary.admins++;
    });

    logger.info('Admin users list', {
      adminId,
      filters: query,
      resultCount: users.length,
    });

    return respond.success({
      users,
      summary,
      pagination: {
        offset: query.offset,
        limit: query.limit,
        hasMore,
      },
    });
  } catch (error) {
    logger.error('Admin users list failed', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
    });
    return respond.error('Failed to list users', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

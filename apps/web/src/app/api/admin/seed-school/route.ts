import { dbAdmin } from '@/lib/firebase-admin';
import { currentEnvironment } from '@/lib/env';
import { logger } from '@/lib/logger';
import { withAdminAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';

/**
 * Development-only endpoint to seed the ub-buffalo school
 * POST /api/admin/seed-school
 *
 * Protected by withAdminAuthAndErrors:
 * - Requires admin authentication
 * - CSRF protection enabled
 * - Rate limited (50 req/min)
 */
export const POST = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);

  // Only allow in development (additional safety layer)
  if (currentEnvironment === 'production') {
    logger.warn('Attempted seed-school in production', { adminId });
    return respond.error('Not available in production', 'FORBIDDEN', {
      status: HttpStatus.FORBIDDEN
    });
  }

  try {
    const schoolData = {
      id: 'ub-buffalo',
      name: 'University at Buffalo',
      domain: 'buffalo.edu',
      active: true,
      campusId: 'ub-buffalo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        allowedEmailDomains: ['buffalo.edu'],
        features: {
          spaces: true,
          hiveLab: true
        }
      }
    };

    await dbAdmin.collection('schools').doc('ub-buffalo').set(schoolData, { merge: true });

    logger.info('School seeded successfully', { adminId, schoolId: 'ub-buffalo' });

    return respond.success({
      message: 'School ub-buffalo created successfully',
      data: schoolData
    });
  } catch (error) {
    logger.error('Failed to seed school', { adminId }, error instanceof Error ? error : new Error(String(error)));
    return respond.error(
      'Failed to seed school',
      'INTERNAL_ERROR',
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
});

/**
 * GET endpoint to check if school exists
 * Also protected by admin auth
 */
export const GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);

  try {
    const schoolDoc = await dbAdmin.collection('schools').doc('ub-buffalo').get();

    if (schoolDoc.exists) {
      return respond.success({
        exists: true,
        data: schoolDoc.data()
      });
    }

    return respond.success({
      exists: false,
      message: 'School ub-buffalo does not exist. POST to this endpoint to create it.'
    });
  } catch (error) {
    logger.error('Failed to check school', { adminId }, error instanceof Error ? error : new Error(String(error)));
    return respond.error(
      'Failed to check school',
      'INTERNAL_ERROR',
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
});

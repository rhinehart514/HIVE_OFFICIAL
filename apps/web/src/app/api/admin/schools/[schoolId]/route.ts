/**
 * Admin School Detail API
 * Individual school management operations
 *
 * GET    /api/admin/schools/[schoolId] - Get school details
 * PATCH  /api/admin/schools/[schoolId] - Update school
 * DELETE /api/admin/schools/[schoolId] - Delete school (soft)
 */

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { withAdminAuthAndErrors, getUserId } from '@/lib/middleware';
import { logger } from '@/lib/logger';
import { clearDomainCache } from '@/lib/campus-context';
import { withCache } from '../../../../../lib/cache-headers';

// Validation schema for updating a school
const updateSchoolSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  shortName: z.string().min(1).max(20).optional(),
  emailDomains: z.object({
    student: z.array(z.string()),
    faculty: z.array(z.string()).optional(),
    staff: z.array(z.string()).optional(),
    alumni: z.array(z.string()).optional(),
  }).optional(),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string(),
  }).optional(),
  eventSources: z.array(z.object({
    type: z.enum(['campuslabs', 'presence', 'generic_rss', 'atom']),
    url: z.string().url(),
    enabled: z.boolean(),
    syncFrequency: z.enum(['daily', 'weekly']),
    hostMatchField: z.string().optional(),
    lastSyncAt: z.any().optional(),
  })).optional(),
  status: z.enum(['waitlist', 'beta', 'active', 'suspended']).optional(),
  brandColors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
  maxUsers: z.number().positive().optional(),
  welcomeMessage: z.string().max(500).optional(),
});

interface RouteContext {
  params: Promise<{ schoolId: string }>;
}

/**
 * GET /api/admin/schools/[schoolId]
 * Get school details
 */
const _GET = withAdminAuthAndErrors<RouteContext>(async (_request, context, respond) => {
  const { schoolId } = await context.params;

  const schoolDoc = await dbAdmin.collection('schools').doc(schoolId).get();

  if (!schoolDoc.exists) {
    return respond.error('School not found', 'NOT_FOUND', { status: 404 });
  }

  return respond.success({ school: { id: schoolDoc.id, ...schoolDoc.data() } });
});

/**
 * PATCH /api/admin/schools/[schoolId]
 * Update school configuration
 */
export const PATCH = withAdminAuthAndErrors<RouteContext>(async (request, context, respond) => {
  const adminId = getUserId(request);
  const { schoolId } = await context.params;

  const schoolRef = dbAdmin.collection('schools').doc(schoolId);
  const schoolDoc = await schoolRef.get();

  if (!schoolDoc.exists) {
    return respond.error('School not found', 'NOT_FOUND', { status: 404 });
  }

  const body = await (request as Request).json();
  const parsed = updateSchoolSchema.safeParse(body);

  if (!parsed.success) {
    return respond.error('Invalid update data', 'INVALID_INPUT', { status: 400 });
  }

  const updates = {
    ...parsed.data,
    isActive: parsed.data.status === 'active',
    updatedAt: new Date(),
    updatedBy: adminId,
  };

  await schoolRef.update(updates);
  clearDomainCache();

  logger.info('School updated', {
    component: 'admin-schools',
    schoolId,
    updatedBy: adminId,
    fields: Object.keys(parsed.data),
  });

  const updatedDoc = await schoolRef.get();
  return respond.success({ school: { id: updatedDoc.id, ...updatedDoc.data() } });
});

/**
 * DELETE /api/admin/schools/[schoolId]
 * Soft delete school (sets status to suspended)
 */
export const DELETE = withAdminAuthAndErrors<RouteContext>(async (request, context, respond) => {
  const adminId = getUserId(request);
  const { schoolId } = await context.params;

  // Prevent deletion of UB
  if (schoolId === 'ub-buffalo') {
    return respond.error('Cannot delete primary school', 'FORBIDDEN', { status: 403 });
  }

  const schoolRef = dbAdmin.collection('schools').doc(schoolId);
  const schoolDoc = await schoolRef.get();

  if (!schoolDoc.exists) {
    return respond.error('School not found', 'NOT_FOUND', { status: 404 });
  }

  // Soft delete - set status to suspended
  await schoolRef.update({
    status: 'suspended',
    isActive: false,
    suspendedAt: new Date(),
    suspendedBy: adminId,
    updatedAt: new Date(),
  });

  clearDomainCache();

  logger.info('School suspended', {
    component: 'admin-schools',
    schoolId,
    suspendedBy: adminId,
  });

  return respond.success({ message: 'School suspended' });
});

export const GET = withCache(_GET, 'PRIVATE');

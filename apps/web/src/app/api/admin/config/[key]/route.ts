/**
 * Admin App Config Single Key API Routes
 *
 * GET: Returns single config by key
 * PUT: Updates single config
 * DELETE: Deletes config
 */

import {
  withAdminAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

type RouteContext = { params: Promise<{ key: string }> };

/**
 * GET /api/admin/config/[key]
 */
export const GET = withAdminAuthAndErrors<RouteContext>(async (_request, context, respond) => {
  const { key } = await context.params;
  const doc = await dbAdmin.collection('app_config').doc(key).get();

  if (!doc.exists) {
    return respond.error(`Config "${key}" not found`, 'NOT_FOUND', { status: 404 });
  }

  return respond.success({ config: { key: doc.id, ...doc.data() } });
});

/**
 * PUT /api/admin/config/[key]
 */
export const PUT = withAdminAuthAndErrors<RouteContext>(async (request, context, respond) => {
  const { key } = await context.params;
  const adminId = getUserId(request as AuthenticatedRequest);
  const body = await request.json();
  const { value, description, category } = body;

  if (value === undefined) {
    return respond.error('Missing required field: value', 'VALIDATION_ERROR', { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    value,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: adminId,
  };

  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;

  await dbAdmin.collection('app_config').doc(key).update(updateData);

  return respond.success({ config: { key, ...updateData, updatedAt: new Date().toISOString() } });
});

/**
 * DELETE /api/admin/config/[key]
 */
export const DELETE = withAdminAuthAndErrors<RouteContext>(async (_request, context, respond) => {
  const { key } = await context.params;
  await dbAdmin.collection('app_config').doc(key).delete();
  return respond.success({ deleted: key });
});

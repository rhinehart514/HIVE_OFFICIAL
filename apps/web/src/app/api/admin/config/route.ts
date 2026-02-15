/**
 * Admin App Config API Routes
 *
 * GET: Returns all config documents from `app_config` collection
 * POST: Creates/updates a config document
 */

import {
  withAdminAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

/**
 * GET /api/admin/config
 * List all app config entries
 */
export const GET = withAdminAuthAndErrors(async (_request: AuthenticatedRequest, _context: unknown, respond) => {
  const snapshot = await dbAdmin.collection('app_config').get();
  const configs = snapshot.docs.map((doc) => ({
    key: doc.id,
    ...doc.data(),
  }));

  return respond.success({ configs, total: configs.length });
});

/**
 * POST /api/admin/config
 * Create or update a config document
 */
export const POST = withAdminAuthAndErrors(async (request: AuthenticatedRequest, _context: unknown, respond) => {
  const adminId = getUserId(request);
  const body = await request.json();
  const { key, value, description, category } = body;

  if (!key || value === undefined || !description || !category) {
    return respond.error('Missing required fields: key, value, description, category', 'VALIDATION_ERROR', { status: 400 });
  }

  const validCategories = ['access', 'ui', 'features', 'testing'];
  if (!validCategories.includes(category)) {
    return respond.error(`Invalid category. Must be one of: ${validCategories.join(', ')}`, 'VALIDATION_ERROR', { status: 400 });
  }

  const configData = {
    key,
    value,
    description,
    category,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: adminId,
  };

  await dbAdmin.collection('app_config').doc(key).set(configData, { merge: true });

  return respond.success({ config: { ...configData, updatedAt: new Date().toISOString() } });
});

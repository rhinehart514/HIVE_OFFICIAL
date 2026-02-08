import {
  withAdminAuthAndErrors,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';

/**
 * GET /api/admin/toolbar/impersonate/search?q=...
 * Search users by email or name for impersonation
 */
export const GET = withAdminAuthAndErrors(async (request, context, respond) => {
  const req = request as AuthenticatedRequest;
  const campusId = getCampusId(req);

  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() || '';

  if (query.length < 2) {
    return respond.error('Search query must be at least 2 characters', 'VALIDATION_ERROR');
  }

  // Search profiles by email prefix or displayName
  // Firestore doesn't support full-text search, so we use prefix matching on email
  const queryLower = query.toLowerCase();

  // Search by email prefix
  const emailResults = await dbAdmin
    .collection('profiles')
    .where('campusId', '==', campusId)
    .where('email', '>=', queryLower)
    .where('email', '<=', queryLower + '\uf8ff')
    .limit(10)
    .get();

  // Also search by handle if it looks like a handle
  const handleResults = await dbAdmin
    .collection('profiles')
    .where('campusId', '==', campusId)
    .where('handle', '>=', queryLower)
    .where('handle', '<=', queryLower + '\uf8ff')
    .limit(10)
    .get();

  // Merge and deduplicate
  const seen = new Set<string>();
  const results: Array<{
    id: string;
    displayName: string | null;
    email: string | null;
    handle: string | null;
    avatarUrl: string | null;
  }> = [];

  for (const doc of [...emailResults.docs, ...handleResults.docs]) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);

    const data = doc.data();
    results.push({
      id: doc.id,
      displayName: data.displayName || data.fullName || null,
      email: data.email || null,
      handle: data.handle || null,
      avatarUrl: data.avatarUrl || null,
    });

    if (results.length >= 10) break;
  }

  return respond.success({ users: results });
});

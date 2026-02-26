/**
 * Automation Runs API
 *
 * GET /api/tools/[toolId]/automations/[automationId]/runs — List execution history
 */

import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string; automationId: string }> },
  respond
) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const { toolId, automationId } = await params;

  // Verify access
  const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();
  if (!toolDoc.exists) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }
  const tool = toolDoc.data();
  if (tool?.ownerId !== userId && tool?.createdBy !== userId) {
    return respond.error('Access denied', 'FORBIDDEN', { status: 403 });
  }

  // Verify automation belongs to tool
  const automationDoc = await dbAdmin.collection('tool_automations').doc(automationId).get();
  if (!automationDoc.exists || automationDoc.data()?.toolId !== toolId) {
    return respond.error('Automation not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }

  // Parse limit from query
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

  // Fetch runs from subcollection
  const runsSnapshot = await dbAdmin
    .collection('tool_automations')
    .doc(automationId)
    .collection('runs')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  const runs = runsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return respond.success({ runs });
});

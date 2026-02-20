import { withAuthAndErrors, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../../lib/cache-headers';

const DEFAULT_TABS = ['feed', 'events', 'tools', 'members'];

/**
 * GET /api/spaces/[spaceId]/tabs
 * Returns the space's tab configuration.
 * Falls back to default tabs if none configured.
 */
const _GET = withAuthAndErrors(async (
  _request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;

  if (!spaceId) {
    return respond.error('Space ID is required', 'INVALID_INPUT', { status: 400 });
  }

  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  if (!spaceDoc.exists) {
    return respond.error('Space not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }

  const spaceData = spaceDoc.data();

  // Check both possible locations for tabs
  const tabs: string[] =
    spaceData?.tabs ||
    spaceData?.structure?.tabs ||
    DEFAULT_TABS;

  return respond.success({
    spaceId,
    tabs,
  });
});

export const GET = withCache(_GET, 'SHORT');

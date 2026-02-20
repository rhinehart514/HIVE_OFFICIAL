import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../../lib/cache-headers';

const DEFAULT_STRUCTURE = {
  tabs: ['feed', 'events', 'tools', 'members'],
  pinnedToolId: null,
};

/**
 * GET /api/spaces/[spaceId]/structure
 * Returns the space's layout/structure config.
 */
const _GET = withAuthAndErrors(async (
  request,
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
  const structure = spaceData?.structure || DEFAULT_STRUCTURE;

  return respond.success({
    spaceId,
    structure,
  });
});

export const GET = withCache(_GET, 'SHORT');

/**
 * PUT /api/spaces/[spaceId]/structure
 * Update the space's layout/structure config. Requires leader or admin role.
 */
export const PUT = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  if (!spaceId) {
    return respond.error('Space ID is required', 'INVALID_INPUT', { status: 400 });
  }

  // Verify space exists
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  if (!spaceDoc.exists) {
    return respond.error('Space not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }

  // Check leader/admin role via composite key
  const memberDoc = await dbAdmin.collection('spaceMembers').doc(`${spaceId}_${userId}`).get();
  if (!memberDoc.exists) {
    // Also try querying by fields (some docs may not use composite key)
    const memberQuery = await dbAdmin.collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (memberQuery.empty) {
      return respond.error('You are not a member of this space', 'FORBIDDEN', { status: 403 });
    }

    const role = (memberQuery.docs[0].data().role as string || 'member').toLowerCase();
    if (role !== 'leader' && role !== 'admin' && role !== 'owner') {
      return respond.error('Only leaders and admins can update space structure', 'FORBIDDEN', { status: 403 });
    }
  } else {
    const role = (memberDoc.data()?.role as string || 'member').toLowerCase();
    if (role !== 'leader' && role !== 'admin' && role !== 'owner') {
      return respond.error('Only leaders and admins can update space structure', 'FORBIDDEN', { status: 403 });
    }
  }

  // Parse and validate the structure payload
  const body = await request.json();
  const structure = body.structure;

  if (!structure || typeof structure !== 'object') {
    return respond.error('Invalid structure payload', 'INVALID_INPUT', { status: 400 });
  }

  // Validate tabs array if provided
  if (structure.tabs && !Array.isArray(structure.tabs)) {
    return respond.error('tabs must be an array', 'INVALID_INPUT', { status: 400 });
  }

  const validTabs = ['feed', 'events', 'tools', 'members', 'chat', 'boards', 'about'];
  if (structure.tabs) {
    for (const tab of structure.tabs) {
      if (!validTabs.includes(tab)) {
        return respond.error(`Invalid tab: ${tab}. Valid tabs: ${validTabs.join(', ')}`, 'INVALID_INPUT', { status: 400 });
      }
    }
  }

  // Update the space document
  await dbAdmin.collection('spaces').doc(spaceId).update({
    structure: {
      tabs: structure.tabs || DEFAULT_STRUCTURE.tabs,
      pinnedToolId: structure.pinnedToolId ?? null,
      ...structure,
    },
    updatedAt: new Date().toISOString(),
  });

  return respond.success({
    spaceId,
    structure: {
      tabs: structure.tabs || DEFAULT_STRUCTURE.tabs,
      pinnedToolId: structure.pinnedToolId ?? null,
      ...structure,
    },
  });
});

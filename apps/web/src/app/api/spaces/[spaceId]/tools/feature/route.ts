import { z } from 'zod';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthValidationAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { logger } from '@/lib/logger';
import { getServerSpaceRepository } from '@hive/core/server';
import { enforceSpaceRules } from '@/lib/space-rules-middleware';

const FeatureToolSchema = z.object({
  toolId: z.string().min(1)
});

/**
 * Validate space using DDD repository and check membership
 */
async function validateSpaceAndMembership(spaceId: string, userId: string, campusId: string) {
  const spaceRepo = getServerSpaceRepository();
  const spaceResult = await spaceRepo.findById(spaceId);

  if (spaceResult.isFailure) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: 'Space not found' };
  }

  const space = spaceResult.getValue();

  if (space.campusId.id !== campusId) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: 'Access denied' };
  }

  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', campusId)
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    if (!space.isPublic) {
      return { ok: false as const, status: HttpStatus.FORBIDDEN, message: 'Membership required' };
    }
    return { ok: true as const, space, membership: { role: 'guest' } };
  }

  return { ok: true as const, space, membership: membershipSnapshot.docs[0].data() };
}

// POST /api/spaces/[spaceId]/tools/feature - Feature a tool in a space (server-side)
export const POST = withAuthValidationAndErrors(
  FeatureToolSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    { toolId }: z.infer<typeof FeatureToolSchema>,
    respond
  ) => {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    // Validate space membership and permissions using DDD repository
    const validation = await validateSpaceAndMembership(spaceId, userId, campusId);
    if (!validation.ok) {
      const code = validation.status === HttpStatus.NOT_FOUND ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
      return respond.error(validation.message, code, { status: validation.status });
    }

    const configurePermission = await enforceSpaceRules(spaceId, userId, 'tools:configure');
    if (!configurePermission.allowed) {
      return respond.error(configurePermission.reason || 'Insufficient permissions to feature tools', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
      });
    }

    // Validate tool exists
    const toolRef = dbAdmin.collection('tools').doc(toolId);
    const toolSnap = await toolRef.get();
    if (!toolSnap.exists) {
      return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: HttpStatus.NOT_FOUND });
    }
    const toolData = toolSnap.data() || {};
    if (toolData.campusId && toolData.campusId !== campusId) {
      return respond.error('Access denied for this campus', 'FORBIDDEN', { status: HttpStatus.FORBIDDEN });
    }

    // Ensure active deployment exists for this space
    const existingDeployments = await dbAdmin
      .collection('deployments')
      .where('toolId', '==', toolId)
      .where('spaceId', '==', spaceId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    let deploymentId: string;
    if (existingDeployments.empty) {
      const deployment = {
        toolId,
        spaceId,
        userId,
        status: 'active',
        version: toolData.version || '1.0.0',
        configuration: {},
        isShared: true,
        permissions: { canEdit: [], canView: [], isPublic: true },
        deployedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUsed: null,
        isFeatured: true,
        campusId: campusId,
      };
      const ref = await dbAdmin.collection('deployments').add(deployment);
      deploymentId = ref.id;
    } else {
      deploymentId = existingDeployments.docs[0].id;
      await existingDeployments.docs[0].ref.set({ isFeatured: true }, { merge: true });
    }

    // Update space featured tools metadata
    await dbAdmin.collection('spaces').doc(spaceId).set(
      {
        featuredTools: admin.firestore.FieldValue.arrayUnion({
          toolId,
          deploymentId,
          featuredAt: admin.firestore.FieldValue.serverTimestamp(),
          featuredBy: userId,
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    logger.info('Tool featured via API', { spaceId, toolId, userId, deploymentId });

    return respond.success({
      message: 'Tool featured successfully',
      deploymentId,
      toolId,
      spaceId,
    });
  }
);

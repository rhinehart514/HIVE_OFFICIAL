import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { createPlacementDocument } from '@/lib/tool-placement';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { generateCustomBlock } from '@hive/core/server';

const CreateCustomBlockSchema = z.object({
  prompt: z.string().min(1).max(4000),
  spaceId: z.string().min(1).optional(),
  spaceName: z.string().min(1).optional(),
  spaceType: z.string().min(1).optional(),
});

interface SpaceContextResult {
  name: string;
  type: string;
  memberCount: number;
}

async function resolveSpaceContext(
  spaceId: string,
  explicitName: string | undefined,
  explicitType: string | undefined,
  campusId: string | undefined
): Promise<SpaceContextResult> {
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  if (!spaceDoc.exists) {
    throw new Error('Space not found');
  }

  const spaceData = spaceDoc.data() || {};

  if (campusId && spaceData.campusId && spaceData.campusId !== campusId) {
    throw new Error('Space is outside your campus');
  }

  const members = spaceData.members;
  const memberCount =
    typeof spaceData.memberCount === 'number'
      ? spaceData.memberCount
      : members && typeof members === 'object'
        ? Object.keys(members as Record<string, unknown>).length
        : 0;

  return {
    name: explicitName || (spaceData.name as string) || 'Space',
    type: explicitType || (spaceData.type as string) || (spaceData.category as string) || 'general',
    memberCount,
  };
}

async function assertMemberAccess(
  userId: string,
  spaceId: string,
  campusId: string | undefined
): Promise<void> {
  let membershipQuery = dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true);

  if (campusId) {
    membershipQuery = membershipQuery.where('campusId', '==', campusId);
  }

  const membership = await membershipQuery.limit(1).get();
  if (membership.empty) {
    throw new Error('Membership required to deploy to this space');
  }
}

export const POST = withAuthAndErrors(async (request, _context, respond) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = getCampusId(req);

  let body: z.infer<typeof CreateCustomBlockSchema>;
  try {
    body = CreateCustomBlockSchema.parse(await request.json());
  } catch {
    return respond.error('Invalid request body', 'INVALID_INPUT', { status: 400 });
  }

  try {
    let spaceContext: SpaceContextResult | undefined;
    if (body.spaceId) {
      await assertMemberAccess(userId, body.spaceId, campusId);
      spaceContext = await resolveSpaceContext(
        body.spaceId,
        body.spaceName,
        body.spaceType,
        campusId
      );
    }

    const { config, explanation } = await generateCustomBlock({
      prompt: body.prompt,
      spaceContext,
    });

    const now = new Date();
    const toolDoc = {
      name: config.metadata.name || 'Custom Block Tool',
      description: config.metadata.description || 'AI-generated custom block',
      status: 'draft',
      type: 'custom-block',
      elements: [
        {
          elementId: 'custom-block',
          instanceId: 'custom_block_1',
          config,
          position: { x: 0, y: 0 },
          size: { width: 400, height: 300 },
        },
      ],
      connections: [],
      ownerId: userId,
      campusId,
      createdAt: now,
      updatedAt: now,
      metadata: {
        generatedFrom: 'custom-block-generator',
        prompt: body.prompt,
        explanation,
      },
    };

    const toolRef = await dbAdmin.collection('tools').add(toolDoc);

    if (body.spaceId) {
      const deploymentId = `space:${body.spaceId}_${toolRef.id}`;
      await createPlacementDocument({
        deployedTo: 'space',
        targetId: body.spaceId,
        toolId: toolRef.id,
        deploymentId,
        placedBy: userId,
        campusId,
        placement: 'sidebar',
        order: 0,
        visibility: 'all',
        name: toolDoc.name,
        description: toolDoc.description,
      });
    }

    return respond.success(
      {
        tool: {
          id: toolRef.id,
          name: toolDoc.name,
          description: toolDoc.description,
          status: toolDoc.status,
        },
        customBlock: {
          config,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create custom block';
    if (message.includes('not found')) {
      return respond.error(message, 'NOT_FOUND', { status: 404 });
    }
    if (message.includes('Membership required') || message.includes('outside your campus')) {
      return respond.error(message, 'FORBIDDEN', { status: 403 });
    }
    return respond.error(message, 'INTERNAL_ERROR', { status: 500 });
  }
});

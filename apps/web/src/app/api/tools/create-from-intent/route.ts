import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { createPlacementDocument } from '@/lib/tool-placement';
import { generateTool } from '@/lib/goose-server';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { ELEMENT_CATALOG } from '@hive/core/hivelab/goose';
import { generateCustomBlock } from '@hive/core/server';

const CreateFromIntentSchema = z.object({
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

interface CatalogMatch {
  elementId: string;
  score: number;
  matchedKeywords: string[];
}

function findCatalogMatch(prompt: string): CatalogMatch | null {
  const text = prompt.toLowerCase();
  let best: CatalogMatch | null = null;

  for (const [elementId, entry] of Object.entries(ELEMENT_CATALOG)) {
    const normalizedElementHint = elementId.replace(/-/g, ' ');
    const keywords = [normalizedElementHint, ...entry.use_for.map((value) => value.toLowerCase())];
    const matchedKeywords = keywords.filter((keyword) => text.includes(keyword));

    const baseScore = matchedKeywords.length;
    const exactElementBonus = text.includes(normalizedElementHint) ? 1.5 : 0;
    const score = baseScore + exactElementBonus;

    if (!best || score > best.score) {
      best = { elementId, score, matchedKeywords };
    }
  }

  if (!best) return null;

  // High-confidence intent threshold:
  // - At least 2 matched catalog keywords, or
  // - Explicit element hint match plus one supporting signal.
  const highConfidence =
    best.matchedKeywords.length >= 2 ||
    (best.score >= 2.5 && best.matchedKeywords.length >= 1);

  return highConfidence ? best : null;
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

async function createPlacementIfNeeded(opts: {
  spaceId?: string;
  toolId: string;
  userId: string;
  campusId: string;
  toolName: string;
  toolDescription: string;
}): Promise<void> {
  if (!opts.spaceId) return;

  const deploymentId = `space:${opts.spaceId}_${opts.toolId}`;
  await createPlacementDocument({
    deployedTo: 'space',
    targetId: opts.spaceId,
    toolId: opts.toolId,
    deploymentId,
    placedBy: opts.userId,
    campusId: opts.campusId,
    placement: 'sidebar',
    order: 0,
    visibility: 'all',
    name: opts.toolName,
    description: opts.toolDescription,
  });
}

export const POST = withAuthAndErrors(async (request, _context, respond) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = getCampusId(req);

  let body: z.infer<typeof CreateFromIntentSchema>;
  try {
    body = CreateFromIntentSchema.parse(await request.json());
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

    const catalogMatch = findCatalogMatch(body.prompt);
    const now = new Date();

    if (catalogMatch) {
      const composition = await generateTool({ prompt: body.prompt });

      const toolDoc = {
        name: composition.name || 'Generated Tool',
        description: composition.description || body.prompt.slice(0, 160),
        status: 'draft',
        type: 'visual',
        elements: (composition.elements || []).map((element) => ({
          elementId: element.type,
          instanceId: element.instanceId,
          config: element.config || {},
          position: element.position || { x: 0, y: 0 },
          size: element.size || { width: 320, height: 240 },
        })),
        connections: (composition.connections || []).map((connection) => ({
          from: {
            instanceId: connection.from.instanceId,
            output: connection.from.port,
          },
          to: {
            instanceId: connection.to.instanceId,
            input: connection.to.port,
          },
        })),
        ownerId: userId,
        campusId,
        createdAt: now,
        updatedAt: now,
        metadata: {
          generatedFrom: 'intent-composition',
          prompt: body.prompt,
          intentElement: catalogMatch.elementId,
          intentScore: catalogMatch.score,
        },
      };

      const toolRef = await dbAdmin.collection('tools').add(toolDoc);
      await createPlacementIfNeeded({
        spaceId: body.spaceId,
        toolId: toolRef.id,
        userId,
        campusId,
        toolName: toolDoc.name,
        toolDescription: toolDoc.description,
      });

      return respond.success(
        {
          tool: {
            id: toolRef.id,
            name: toolDoc.name,
            description: toolDoc.description,
          },
          creationType: 'composition',
        },
        { status: 201 }
      );
    }

    const { config } = await generateCustomBlock({
      prompt: body.prompt,
      spaceContext,
    });

    const toolDoc = {
      name: config.metadata.name || 'Custom Block Tool',
      description: config.metadata.description || body.prompt.slice(0, 160),
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
        generatedFrom: 'intent-custom-block-fallback',
        prompt: body.prompt,
      },
    };

    const toolRef = await dbAdmin.collection('tools').add(toolDoc);
    await createPlacementIfNeeded({
      spaceId: body.spaceId,
      toolId: toolRef.id,
      userId,
      campusId,
      toolName: toolDoc.name,
      toolDescription: toolDoc.description,
    });

    return respond.success(
      {
        tool: {
          id: toolRef.id,
          name: toolDoc.name,
          description: toolDoc.description,
        },
        creationType: 'custom-block',
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create tool from intent';
    if (message.includes('not found')) {
      return respond.error(message, 'NOT_FOUND', { status: 404 });
    }
    if (message.includes('Membership required') || message.includes('outside your campus')) {
      return respond.error(message, 'FORBIDDEN', { status: 403 });
    }
    return respond.error(message, 'INTERNAL_ERROR', { status: 500 });
  }
});

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { createPlacementDocument } from '@/lib/tool-placement';
import { generateTool, validateGroqConfig } from '@/lib/goose-server';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { detectIntent, type Intent } from '@/lib/ai-generator/intent-detection';
import {
  getPatternForIntent,
  enrichPatternForSpace,
} from '@/lib/ai-generator/composition-patterns';
import { canGenerate, recordGeneration } from '@/lib/ai-usage-tracker';
import { aiGenerationRateLimit } from '@/lib/rate-limit-simple';
import { logger } from '@/lib/logger';
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

const INTENT_TO_ELEMENT: Record<Intent, string> = {
  'enable-voting': 'poll-element',
  'coordinate-people': 'rsvp-button',
  'track-time': 'countdown-timer',
  'broadcast': 'announcement',
  'collect-input': 'form-builder',
  'rank-items': 'leaderboard',
  'show-results': 'result-list',
  'search-filter': 'search-input',
  'visualize-data': 'chart-display',
  'discover-events': 'personalized-event-feed',
  'find-food': 'dining-picker',
  'find-study-spot': 'study-spot-finder',
  'photo-challenge': 'composition',
  'attendance-tracking': 'composition',
  'resource-management': 'composition',
  'multi-vote': 'composition',
  'event-series': 'composition',
  'suggestion-triage': 'composition',
  'group-matching': 'composition',
  'competition-goals': 'composition',
  'custom-visual': 'custom-block',
};

interface IntentMatch {
  intent: Intent;
  elementId: string;
  confidence: number;
  keywords: string[];
}

function findIntentMatch(prompt: string): IntentMatch | null {
  const detected = detectIntent(prompt);
  if (detected.confidence < 0.3) {
    return null;
  }

  const elementId = INTENT_TO_ELEMENT[detected.primary];
  if (!elementId) {
    return null;
  }

  return {
    intent: detected.primary,
    elementId,
    confidence: detected.confidence,
    keywords: detected.keywords,
  };
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
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const rateLimitKey = userId ? `user:${userId}` : `ip:${clientIp}`;
  const rateLimitResult = aiGenerationRateLimit.check(rateLimitKey);
  if (!rateLimitResult.success) {
    return respond.error(
      'Too many generation requests. Please wait before trying again.',
      'RATE_LIMITED',
      { status: 429 }
    );
  }

  const usage = await canGenerate(userId);
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: 'Daily generation limit reached',
        resetAt: usage.resetAt.toISOString(),
      },
      { status: 429 }
    );
  }

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

    const intentMatch = findIntentMatch(body.prompt);
    const now = new Date();

    if (intentMatch?.elementId === 'composition') {
      const pattern = getPatternForIntent(
        intentMatch.intent,
        body.prompt,
        spaceContext?.type || body.spaceType
      );

      if (pattern) {
        const resolvedPattern = spaceContext
          ? enrichPatternForSpace(pattern, spaceContext)
          : pattern;

        const toolDoc = {
          name: resolvedPattern.name,
          description: resolvedPattern.description || body.prompt.slice(0, 160),
          status: 'draft',
          type: 'visual',
          elements: resolvedPattern.elements.map((element) => ({
            elementId: element.elementId,
            instanceId: element.instanceId,
            config: element.config,
            position: element.position,
            size: element.size,
          })),
          connections: resolvedPattern.connections.map((connection) => ({
            from: {
              instanceId: connection.fromElement,
              output: connection.fromPort,
            },
            to: {
              instanceId: connection.toElement,
              input: connection.toPort,
            },
          })),
          ownerId: userId,
          campusId,
          createdAt: now,
          updatedAt: now,
          metadata: {
            generatedFrom: 'composition-pattern',
            patternId: resolvedPattern.id,
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

        try {
          await recordGeneration(userId, 500);
        } catch (error) {
          logger.warn('Failed to record AI generation usage', {
            component: 'tools-create-from-intent',
            userId,
            error: error instanceof Error ? error.message : String(error),
          });
        }

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
    }

    if (intentMatch && intentMatch.elementId !== 'custom-block') {
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
          intent: intentMatch.intent,
          intentElement: intentMatch.elementId,
          intentScore: intentMatch.confidence,
          intentKeywords: intentMatch.keywords,
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

      try {
        await recordGeneration(userId, 500);
      } catch (error) {
        logger.warn('Failed to record AI generation usage', {
          component: 'tools-create-from-intent',
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

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

    if (!validateGroqConfig()) {
      return NextResponse.json(
        { error: 'AI generation not configured', code: 'GROQ_NOT_CONFIGURED' },
        { status: 503 }
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

    try {
      await recordGeneration(userId, 500);
    } catch (error) {
      logger.warn('Failed to record AI generation usage', {
        component: 'tools-create-from-intent',
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

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

/**
 * Setup Templates API
 *
 * GET /api/setups/templates - List available setup templates
 * POST /api/setups/templates - Create a new custom setup template
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  getServerSetupTemplateRepository,
  toSetupTemplateListDTO,
  toSetupTemplateDetailDTO,
  SetupTemplate,
  type SetupCategory,
  type OrchestrationRule,
} from '@hive/core/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { deriveCampusFromEmail } from '@/lib/middleware';

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// ============================================================================
// GET /api/setups/templates
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category = searchParams.get('category') as SetupCategory | null;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const featuredOnly = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor') || undefined;

    // Get repository
    const repo = getServerSetupTemplateRepository();

    // Query templates
    const result = await repo.findMany({
      category: category || undefined,
      tags,
      featuredOnly,
      includeSystemTemplates: true,
      orderBy: 'deploymentCount',
      orderDirection: 'desc',
      limit,
      cursor,
    });

    if (result.isFailure) {
      return errorResponse(result.error ?? 'Unknown error', 500);
    }

    const { items, hasMore, nextCursor } = result.getValue();

    // Convert to DTOs
    const templates = items.map(toSetupTemplateListDTO);

    return jsonResponse({
      templates,
      hasMore,
      nextCursor,
    });
  } catch {
    return errorResponse('Failed to list setup templates', 500);
  }
}

// ============================================================================
// Request Validation
// ============================================================================

const SetupToolSlotSchema = z.object({
  slotId: z.string().min(1),
  name: z.string().min(1).max(100),
  templateId: z.string().optional(),
  composition: z.object({
    elements: z.array(z.object({
      elementId: z.string(),
      instanceId: z.string(),
      config: z.record(z.unknown()),
      position: z.object({ x: z.number(), y: z.number() }),
      size: z.object({ width: z.number(), height: z.number() }),
    })),
    connections: z.array(z.object({
      from: z.object({ instanceId: z.string(), output: z.string() }),
      to: z.object({ instanceId: z.string(), input: z.string() }),
    })),
    layout: z.enum(['grid', 'flow', 'tabs', 'sidebar']),
  }).optional(),
  defaultConfig: z.record(z.unknown()),
  placement: z.enum(['sidebar', 'inline', 'modal', 'tab']),
  initiallyVisible: z.boolean(),
  description: z.string().optional(),
  icon: z.string().optional(),
});

const OrchestrationRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  trigger: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('tool_event'),
      sourceSlotId: z.string(),
      eventType: z.string(),
    }),
    z.object({
      type: z.literal('time_relative'),
      referenceField: z.string(),
      offsetMinutes: z.number(),
    }),
    z.object({
      type: z.literal('data_condition'),
      dataPath: z.string(),
      operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'exists']),
      value: z.unknown(),
    }),
    z.object({
      type: z.literal('manual'),
      buttonLabel: z.string(),
      confirmMessage: z.string().optional(),
    }),
  ]),
  actions: z.array(z.discriminatedUnion('type', [
    z.object({
      type: z.literal('data_flow'),
      sourceSlotId: z.string(),
      sourceOutput: z.string(),
      targetSlotId: z.string(),
      targetInput: z.string(),
      transform: z.string().optional(),
    }),
    z.object({
      type: z.literal('visibility'),
      targetSlotId: z.string(),
      visible: z.boolean(),
    }),
    z.object({
      type: z.literal('config'),
      targetSlotId: z.string(),
      updates: z.record(z.unknown()),
    }),
    z.object({
      type: z.literal('notification'),
      recipients: z.string(),
      title: z.string(),
      body: z.string(),
      actionUrl: z.string().optional(),
    }),
    z.object({
      type: z.literal('state'),
      targetSlotId: z.string(),
      updates: z.record(z.unknown()),
      merge: z.boolean(),
    }),
  ])),
  enabled: z.boolean(),
  runOnce: z.boolean().optional(),
});

const ConfigFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'textarea', 'number', 'date', 'datetime', 'select', 'multiselect', 'boolean']),
  required: z.boolean(),
  defaultValue: z.unknown().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  helpText: z.string().optional(),
  placeholder: z.string().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
});

const CreateSetupTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  icon: z.string().min(1),
  category: z.enum(['event', 'campaign', 'workflow', 'engagement', 'governance']),
  tools: z.array(SetupToolSlotSchema).min(1),
  orchestration: z.array(OrchestrationRuleSchema).optional(),
  sharedDataSchema: z.record(z.unknown()).optional(),
  configFields: z.array(ConfigFieldSchema).optional(),
  requiredCapabilities: z.record(z.boolean()).optional(),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().optional(),
});

// ============================================================================
// POST /api/setups/templates
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return errorResponse('Not authenticated', 401);
    }

    // Parse session
    let session: { userId: string; campusId?: string; email?: string };
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return errorResponse('Invalid session', 401);
    }

    const { userId } = session;

    // Derive campusId from session or email
    const campusId = session.campusId || (session.email ? deriveCampusFromEmail(session.email) : null);
    if (!campusId) {
      return errorResponse('Campus identification required', 401);
    }

    // Get user profile for creator name
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const creatorName = userData?.displayName || userData?.name || 'Unknown';

    // Parse and validate request body
    const body = await request.json();
    const parseResult = CreateSetupTemplateSchema.safeParse(body);

    if (!parseResult.success) {
      return jsonResponse(
        {
          error: 'Validation failed',
          details: parseResult.error.errors,
        },
        400,
      );
    }

    const data = parseResult.data;

    // Generate unique template ID
    const templateId = `setup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create SetupTemplate entity
    const templateResult = SetupTemplate.create({
      id: templateId,
      name: data.name,
      description: data.description,
      icon: data.icon,
      category: data.category,
      source: 'community',
      tools: data.tools,
      orchestration: (data.orchestration || []) as OrchestrationRule[],
      sharedDataSchema: data.sharedDataSchema || {},
      configFields: data.configFields || [],
      requiredCapabilities: data.requiredCapabilities || {},
      tags: data.tags || [],
      isSystem: false,
      isFeatured: false,
      creatorId: userId,
      creatorName,
      campusId,
      thumbnailUrl: data.thumbnailUrl,
    });

    if (templateResult.isFailure) {
      return errorResponse(templateResult.error ?? 'Failed to create template', 400);
    }

    const template = templateResult.getValue();

    // Save to repository
    const repo = getServerSetupTemplateRepository();
    const saveResult = await repo.save(template);

    if (saveResult.isFailure) {
      return errorResponse(saveResult.error ?? 'Failed to save template', 500);
    }

    // Return created template
    const dto = toSetupTemplateDetailDTO(template);

    return jsonResponse(
      {
        template: dto,
        message: `Setup template "${data.name}" created successfully`,
      },
      201,
    );
  } catch (error) {
    console.error('Error creating setup template:', error);
    return errorResponse('Failed to create setup template', 500);
  }
}

/**
 * Setup Template Detail API
 *
 * GET /api/setups/templates/[id] - Get template details
 * PUT /api/setups/templates/[id] - Update template metadata (owner only)
 * PATCH /api/setups/templates/[id] - Update orchestration rules (owner only)
 * DELETE /api/setups/templates/[id] - Delete template (owner only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  getServerSetupTemplateRepository,
  toSetupTemplateDetailDTO,
} from '@hive/core/server';
import type { OrchestrationRule } from '@hive/core';
import { logger } from '@/lib/logger';

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
// GET /api/setups/templates/[id]
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return errorResponse('Template ID is required', 400);
    }

    // Get repository
    const repo = getServerSetupTemplateRepository();

    // Find template
    const result = await repo.findById(id);

    if (result.isFailure) {
      return errorResponse('Template not found', 404);
    }

    const template = result.getValue();

    // Convert to DTO
    const dto = toSetupTemplateDetailDTO(template);

    return jsonResponse({ template: dto });
  } catch {
    return errorResponse('Failed to get setup template', 500);
  }
}

// ============================================================================
// Request Validation
// ============================================================================

const UpdateSetupTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  icon: z.string().min(1).optional(),
  category: z.enum(['event', 'campaign', 'workflow', 'engagement', 'governance']).optional(),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
});

// Schema for orchestration rule actions
const OrchestrationActionSchema = z.object({
  type: z.enum(['visibility', 'notification', 'data_flow', 'state', 'config']),
  targetSlotId: z.string().optional(),
  sourceSlotId: z.string().optional(),
  sourceOutput: z.string().optional(),
  targetInput: z.string().optional(),
  visible: z.boolean().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  recipients: z.string().optional(),
  updates: z.record(z.unknown()).optional(),
  merge: z.boolean().optional(),
});

// Schema for orchestration rule triggers
const OrchestrationTriggerSchema = z.object({
  type: z.enum(['tool_event', 'time_relative', 'data_condition', 'manual']),
  sourceSlotId: z.string().optional(),
  eventType: z.string().optional(),
  buttonLabel: z.string().optional(),
  offsetMinutes: z.number().optional(),
  referenceField: z.string().optional(),
  dataPath: z.string().optional(),
  operator: z.string().optional(),
  value: z.unknown().optional(),
});

// Schema for a single orchestration rule
const OrchestrationRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trigger: OrchestrationTriggerSchema,
  actions: z.array(OrchestrationActionSchema),
  enabled: z.boolean(),
  runOnce: z.boolean().optional(),
});

// Schema for PATCH request (orchestration updates)
const PatchOrchestrationSchema = z.object({
  orchestration: z.array(OrchestrationRuleSchema),
});

// ============================================================================
// Helper: Get authenticated user
// ============================================================================

async function getAuthenticatedUser(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

// ============================================================================
// PUT /api/setups/templates/[id]
// ============================================================================

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return errorResponse('Template ID is required', 400);
    }

    // Check authentication
    const session = await getAuthenticatedUser();
    if (!session) {
      return errorResponse('Not authenticated', 401);
    }

    const { userId } = session;

    // Get repository
    const repo = getServerSetupTemplateRepository();

    // Find template
    const result = await repo.findById(id);

    if (result.isFailure) {
      return errorResponse('Template not found', 404);
    }

    const template = result.getValue();

    // Check authorization - only creator can update
    if (!template.canEdit(userId)) {
      return errorResponse('Not authorized to update this template', 403);
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = UpdateSetupTemplateSchema.safeParse(body);

    if (!parseResult.success) {
      return jsonResponse(
        {
          error: 'Validation failed',
          details: parseResult.error.errors,
        },
        400,
      );
    }

    const updates = parseResult.data;

    // Update template
    template.update({
      name: updates.name,
      description: updates.description,
      icon: updates.icon,
      category: updates.category,
      tags: updates.tags,
      thumbnailUrl: updates.thumbnailUrl ?? undefined,
    });

    // Save changes
    const saveResult = await repo.save(template);

    if (saveResult.isFailure) {
      return errorResponse(saveResult.error ?? 'Failed to save template', 500);
    }

    // Return updated template
    const dto = toSetupTemplateDetailDTO(template);

    return jsonResponse({
      template: dto,
      message: 'Template updated successfully',
    });
  } catch (error) {
    logger.error('Error updating setup template', {
      action: 'setup_template_update',
      endpoint: '/api/setups/templates/[id]',
    }, error instanceof Error ? error : undefined);
    return errorResponse('Failed to update setup template', 500);
  }
}

// ============================================================================
// PATCH /api/setups/templates/[id] - Update orchestration rules
// ============================================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return errorResponse('Template ID is required', 400);
    }

    // Check authentication
    const session = await getAuthenticatedUser();
    if (!session) {
      return errorResponse('Not authenticated', 401);
    }

    const { userId } = session;

    // Get repository
    const repo = getServerSetupTemplateRepository();

    // Find template
    const result = await repo.findById(id);

    if (result.isFailure) {
      return errorResponse('Template not found', 404);
    }

    const template = result.getValue();

    // System templates cannot be edited
    if (template.isSystem) {
      return errorResponse('System templates cannot be edited', 403);
    }

    // Check authorization - only creator can update
    if (!template.canEdit(userId)) {
      return errorResponse('Not authorized to update this template', 403);
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = PatchOrchestrationSchema.safeParse(body);

    if (!parseResult.success) {
      return jsonResponse(
        {
          error: 'Validation failed',
          details: parseResult.error.errors,
        },
        400,
      );
    }

    const { orchestration } = parseResult.data;

    // Update orchestration rules on the template
    // Cast to OrchestrationRule[] - Zod schema validates structure, types are compatible
    template.updateOrchestration(orchestration as unknown as OrchestrationRule[]);

    // Save changes
    const saveResult = await repo.save(template);

    if (saveResult.isFailure) {
      return errorResponse(saveResult.error ?? 'Failed to save orchestration', 500);
    }

    // Return updated template
    const dto = toSetupTemplateDetailDTO(template);

    return jsonResponse({
      template: dto,
      message: 'Orchestration rules updated successfully',
    });
  } catch (error) {
    logger.error('Error updating orchestration rules', {
      action: 'orchestration_rules_update',
      endpoint: '/api/setups/templates/[id]',
    }, error instanceof Error ? error : undefined);
    return errorResponse('Failed to update orchestration rules', 500);
  }
}

// ============================================================================
// DELETE /api/setups/templates/[id]
// ============================================================================

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return errorResponse('Template ID is required', 400);
    }

    // Check authentication
    const session = await getAuthenticatedUser();
    if (!session) {
      return errorResponse('Not authenticated', 401);
    }

    const { userId } = session;

    // Get repository
    const repo = getServerSetupTemplateRepository();

    // Find template first to check authorization
    const result = await repo.findById(id);

    if (result.isFailure) {
      return errorResponse('Template not found', 404);
    }

    const template = result.getValue();

    // System templates cannot be deleted
    if (template.isSystem) {
      return errorResponse('System templates cannot be deleted', 403);
    }

    // Only creator can delete
    if (template.creatorId !== userId) {
      return errorResponse('Not authorized to delete this template', 403);
    }

    // Delete template
    const deleteResult = await repo.delete(id);

    if (deleteResult.isFailure) {
      return errorResponse(deleteResult.error ?? 'Failed to delete template', 500);
    }

    return jsonResponse({
      message: `Template "${template.name}" deleted successfully`,
    });
  } catch (error) {
    logger.error('Error deleting setup template', {
      action: 'setup_template_delete',
      endpoint: '/api/setups/templates/[id]',
    }, error instanceof Error ? error : undefined);
    return errorResponse('Failed to delete setup template', 500);
  }
}

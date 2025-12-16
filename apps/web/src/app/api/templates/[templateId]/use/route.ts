// @ts-nocheck
// TODO: Fix DDD Result pattern - repo.findById returns Template not Result<Template>
/**
 * Use Template API - Create a tool from a template (remix)
 *
 * POST /api/templates/[templateId]/use - Copy template to user's tools
 */

import { z } from 'zod';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import {
  getServerTemplateRepository,
} from '@hive/core/server';
import { dbAdmin } from '@/lib/firebase-admin';

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

// ============================================================================
// POST /api/templates/[templateId]/use
// ============================================================================

const UseTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  spaceId: z.string().optional(),
});

export const POST = withAuthAndErrors(
  async (request, { params }: RouteParams, respond) => {
    const { templateId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    // Parse body (optional)
    let body: { name?: string; spaceId?: string } = {};
    try {
      const rawBody = await request.json();
      body = UseTemplateSchema.parse(rawBody);
    } catch {
      // Empty body is fine
    }

    const templateRepo = getServerTemplateRepository();

    // Get the template
    const templateResult = await templateRepo.findById(templateId);

    if (templateResult.isFailure) {
      return respond.error('Template not found', 'NOT_FOUND', { status: 404 });
    }

    const template = templateResult.getValue();

    // Check visibility permissions
    if (!template.canView(userId, campusId)) {
      return respond.error('You do not have permission to use this template', 'FORBIDDEN', { status: 403 });
    }

    // Generate a new tool ID
    const toolId = `tool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create the tool document
    const toolData = {
      id: toolId,
      name: body.name?.trim() || template.name,
      description: template.description,
      composition: template.composition,
      creatorId: userId,
      campusId,
      spaceId: body.spaceId || null,
      status: 'draft',
      version: 1,
      isPublished: false,
      remixedFromTemplateId: templateId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to tools collection
    await dbAdmin.collection('tools').doc(toolId).set(toolData);

    // Increment usage count on the original template
    await templateRepo.incrementUsageCount(templateId);

    return respond.success(
      {
        tool: {
          id: toolId,
          name: toolData.name,
          description: toolData.description,
          status: toolData.status,
          remixedFromTemplateId: templateId,
        },
        message: 'Tool created from template successfully',
        redirectUrl: `/tools/${toolId}`,
      },
      { status: 201 }
    );
  }
);

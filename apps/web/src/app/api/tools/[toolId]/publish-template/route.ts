/**
 * Publish Tool as Template API
 *
 * POST /api/tools/[toolId]/publish-template - Save a tool as a community template
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
  Template,
  toTemplateDetailDTO,
  type TemplateCategory,
  type TemplateVisibility,
  type TemplateComposition,
} from '@hive/core/server';
import { dbAdmin } from '@/lib/firebase-admin';

interface RouteParams {
  params: Promise<{ toolId: string }>;
}

// ============================================================================
// POST /api/tools/[toolId]/publish-template
// ============================================================================

const PublishTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.enum(['engagement', 'events', 'organization', 'analytics', 'communication', 'academic', 'social', 'productivity']),
  visibility: z.enum(['private', 'campus', 'public']),
  tags: z.array(z.string().max(20)).max(5).optional(),
});

export const POST = withAuthAndErrors(
  async (request, { params }: RouteParams, respond) => {
    const { toolId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    // Parse and validate body
    let body;
    try {
      const rawBody = await request.json();
      body = PublishTemplateSchema.parse(rawBody);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return respond.error(`Validation error: ${err.errors.map(e => e.message).join(', ')}`, 'VALIDATION_ERROR', { status: 400 });
      }
      return respond.error('Invalid request body', 'INVALID_INPUT', { status: 400 });
    }

    // Fetch the tool
    const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();

    if (!toolDoc.exists) {
      return respond.error('Tool not found', 'NOT_FOUND', { status: 404 });
    }

    const toolData = toolDoc.data() as {
      name: string;
      description: string;
      composition: TemplateComposition;
      creatorId: string;
      spaceId?: string;
    };

    // Check ownership - only the tool creator can publish as template
    if (toolData.creatorId !== userId) {
      return respond.error('Only the tool creator can publish it as a template', 'FORBIDDEN', { status: 403 });
    }

    // Validate tool has a composition
    if (!toolData.composition || !toolData.composition.elements || toolData.composition.elements.length === 0) {
      return respond.error('Tool must have at least one element to be published as a template', 'INVALID_INPUT', { status: 400 });
    }

    // Generate template ID
    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create the template entity
    const templateResult = Template.create({
      id: templateId,
      name: body.name.trim(),
      description: body.description.trim(),
      category: body.category as TemplateCategory,
      composition: toolData.composition,
      source: 'community',
      visibility: body.visibility as TemplateVisibility,
      creatorId: userId,
      campusId,
      tags: body.tags || [],
      spaceId: toolData.spaceId,
    });

    if (templateResult.isFailure) {
      return respond.error(templateResult.error ?? 'Failed to create template', 'CREATION_ERROR', { status: 400 });
    }

    const template = templateResult.getValue();
    const repo = getServerTemplateRepository();

    // Save to Firestore
    const saveResult = await repo.save(template);

    if (saveResult.isFailure) {
      return respond.error(saveResult.error ?? 'Failed to save template', 'SAVE_ERROR', { status: 500 });
    }

    // Update the tool to track that it was published as a template
    await dbAdmin.collection('tools').doc(toolId).update({
      publishedAsTemplateId: templateId,
      publishedAsTemplateAt: new Date(),
      updatedAt: new Date(),
    });

    return respond.success(
      {
        template: toTemplateDetailDTO(template),
        message: 'Tool published as template successfully',
      },
      { status: 201 }
    );
  }
);

/**
 * Template Detail API
 *
 * GET /api/templates/[templateId] - Get template details
 * PATCH /api/templates/[templateId] - Update template (creator only)
 * DELETE /api/templates/[templateId] - Delete template (creator only)
 */

import { z } from 'zod';
import {
  withAuthAndErrors,
  withErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import {
  getServerTemplateRepository,
  toTemplateDetailDTO,
  type TemplateCategory,
  type TemplateVisibility,
} from '@hive/core/server';

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

// ============================================================================
// GET /api/templates/[templateId]
// ============================================================================

export const GET = withErrors(
  async (request, { params }: RouteParams, respond) => {
    const { templateId } = await params;

    // Try to get user info for visibility check (optional auth)
    let userId: string | undefined;
    let userCampusId: string | undefined;
    try {
      const authRequest = request as AuthenticatedRequest;
      if (authRequest.user?.uid) {
        userId = authRequest.user.uid;
        userCampusId = authRequest.user.campusId;
      }
    } catch {
      // Not authenticated - that's fine for public templates
    }

    const repo = getServerTemplateRepository();
    const result = await repo.findById(templateId);

    if (result.isFailure) {
      return respond.error('Template not found', 'NOT_FOUND', { status: 404 });
    }

    const template = result.getValue();

    // Check visibility
    if (!template.canView(userId || '', userCampusId)) {
      return respond.error('Template not found', 'NOT_FOUND', { status: 404 });
    }

    return respond.success({
      template: toTemplateDetailDTO(template),
    });
  }
);

// ============================================================================
// PATCH /api/templates/[templateId]
// ============================================================================

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  category: z.enum(['engagement', 'events', 'organization', 'analytics', 'communication', 'academic', 'social', 'productivity']).optional(),
  visibility: z.enum(['private', 'campus', 'public']).optional(),
  tags: z.array(z.string().max(20)).max(5).optional(),
});

export const PATCH = withAuthAndErrors(
  async (request, { params }: RouteParams, respond) => {
    const { templateId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);

    // Parse and validate body
    let body;
    try {
      const rawBody = await request.json();
      body = UpdateTemplateSchema.parse(rawBody);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return respond.error(`Validation error: ${err.errors.map(e => e.message).join(', ')}`, 'VALIDATION_ERROR', { status: 400 });
      }
      return respond.error('Invalid request body', 'INVALID_INPUT', { status: 400 });
    }

    const repo = getServerTemplateRepository();
    const result = await repo.findById(templateId);

    if (result.isFailure) {
      return respond.error('Template not found', 'NOT_FOUND', { status: 404 });
    }

    const template = result.getValue();

    // Check ownership
    if (!template.canEdit(userId)) {
      return respond.error('Only the template creator can update it', 'FORBIDDEN', { status: 403 });
    }

    // Code-defined templates cannot be modified
    if (template.source === 'code') {
      return respond.error('Built-in templates cannot be modified', 'FORBIDDEN', { status: 403 });
    }

    // Apply updates using the update method
    template.update({
      name: body.name?.trim(),
      description: body.description?.trim(),
      category: body.category as TemplateCategory | undefined,
      visibility: body.visibility as TemplateVisibility | undefined,
      tags: body.tags,
    });

    const saveResult = await repo.save(template);

    if (saveResult.isFailure) {
      return respond.error(saveResult.error ?? 'Failed to update template', 'SAVE_ERROR', { status: 500 });
    }

    return respond.success({
      template: toTemplateDetailDTO(template),
      message: 'Template updated successfully',
    });
  }
);

// ============================================================================
// DELETE /api/templates/[templateId]
// ============================================================================

export const DELETE = withAuthAndErrors(
  async (request, { params }: RouteParams, respond) => {
    const { templateId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);

    const repo = getServerTemplateRepository();
    const result = await repo.findById(templateId);

    if (result.isFailure) {
      return respond.error('Template not found', 'NOT_FOUND', { status: 404 });
    }

    const template = result.getValue();

    // Check ownership
    if (!template.canEdit(userId)) {
      return respond.error('Only the template creator can delete it', 'FORBIDDEN', { status: 403 });
    }

    // Code-defined templates cannot be deleted
    if (template.source === 'code') {
      return respond.error('Built-in templates cannot be deleted', 'FORBIDDEN', { status: 403 });
    }

    const deleteResult = await repo.delete(templateId);

    if (deleteResult.isFailure) {
      return respond.error(deleteResult.error ?? 'Failed to delete template', 'DELETE_ERROR', { status: 500 });
    }

    return respond.success({
      message: 'Template deleted successfully',
    });
  }
);

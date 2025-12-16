// @ts-nocheck
// TODO: Implement full template repository with Result pattern - requires DDD Template entity
/**
 * Templates API - List and Create Templates
 *
 * GET /api/templates - List templates (with filtering)
 * POST /api/templates - Create a new template from a tool
 */

import { z } from 'zod';
import {
  withAuthAndErrors,
  withErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import {
  getServerTemplateRepository,
  toTemplateListItemDTO,
  toTemplateDetailDTO,
  Template,
  type TemplateCategory,
  type TemplateVisibility,
  type TemplateComposition,
} from '@hive/core/server';

// ============================================================================
// GET /api/templates - Public route with optional auth
// ============================================================================

export const GET = withErrors(
  async (request, _context, respond) => {
    const searchParams = new URL(request.url).searchParams;

    // Parse query params
    const category = searchParams.get('category') as TemplateCategory | null;
    const visibility = searchParams.get('visibility') as TemplateVisibility | null;
    const campusId = searchParams.get('campusId');
    const creatorId = searchParams.get('creatorId');
    const spaceId = searchParams.get('spaceId');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const featuredOnly = searchParams.get('featured') === 'true';
    const includeCodeTemplates = searchParams.get('includeCode') !== 'false';
    const orderBy = (searchParams.get('orderBy') || 'createdAt') as 'createdAt' | 'usageCount' | 'name';
    const orderDirection = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const cursor = searchParams.get('cursor') || undefined;

    // Try to get user info for visibility filtering (optional auth)
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

    const result = await repo.findMany({
      category: category || undefined,
      visibility: visibility || undefined,
      campusId: campusId || userCampusId || undefined,
      creatorId: creatorId || undefined,
      spaceId: spaceId || undefined,
      tags,
      featuredOnly,
      includeCodeTemplates,
      orderBy,
      orderDirection,
      limit,
      cursor,
    });

    if (result.isFailure) {
      return respond.error(result.error ?? 'Failed to fetch templates', 'FETCH_ERROR', { status: 500 });
    }

    const { items, hasMore, nextCursor } = result.getValue();

    // Filter by visibility for the current user
    const visibleTemplates = items.filter(template => {
      // Public templates are always visible
      if (template.visibility === 'public') return true;

      // Private templates only visible to creator
      if (template.visibility === 'private') {
        return template.creatorId === userId;
      }

      // Campus templates visible to same campus or creator
      if (template.visibility === 'campus') {
        return template.campusId === userCampusId || template.creatorId === userId;
      }

      return false;
    });

    return respond.success({
      templates: visibleTemplates.map(toTemplateListItemDTO),
      hasMore,
      nextCursor,
    });
  }
);

// ============================================================================
// POST /api/templates - Requires auth
// ============================================================================

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.enum(['engagement', 'events', 'organization', 'analytics', 'communication', 'academic', 'social', 'productivity']),
  visibility: z.enum(['private', 'campus', 'public']).default('private'),
  composition: z.object({
    elements: z.array(z.any()).min(1),
    connections: z.array(z.any()).optional(),
    layout: z.any().optional(),
    settings: z.any().optional(),
  }),
  tags: z.array(z.string().max(20)).max(5).optional(),
  spaceId: z.string().optional(),
  sourceToolId: z.string().optional(),
});

export const POST = withAuthAndErrors(
  async (request, _context, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    // Parse and validate body
    let body;
    try {
      const rawBody = await request.json();
      body = CreateTemplateSchema.parse(rawBody);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return respond.error(`Validation error: ${err.errors.map(e => e.message).join(', ')}`, 'VALIDATION_ERROR', { status: 400 });
      }
      return respond.error('Invalid request body', 'INVALID_INPUT', { status: 400 });
    }

    // Generate template ID
    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create the template entity
    const templateResult = Template.create({
      id: templateId,
      name: body.name.trim(),
      description: body.description.trim(),
      category: body.category as TemplateCategory,
      composition: body.composition as TemplateComposition,
      source: 'community',
      visibility: body.visibility as TemplateVisibility,
      creatorId: userId,
      campusId,
      tags: body.tags || [],
      spaceId: body.spaceId,
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

    return respond.success(
      {
        template: toTemplateDetailDTO(template),
        message: 'Template created successfully',
      },
      { status: 201 }
    );
  }
);

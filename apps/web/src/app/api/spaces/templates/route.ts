"use server";

import {
  getAllSpaceTemplates,
  getSpaceTemplateById,
  getSpaceTemplatesByCategory,
  getTemplatesSuggestedFor,
  searchSpaceTemplates,
  type SpaceTemplateCategory,
  type SpaceTemplate,
} from "@hive/core";
import { logger } from "@/lib/structured-logger";
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from "@/lib/middleware";

/**
 * GET /api/spaces/templates
 *
 * List available space templates with optional filtering
 *
 * Query params:
 *   category: Filter by template category ('academic' | 'social' | 'professional' | 'community' | 'events')
 *   suggestedFor: Filter by space type this template is good for (e.g., 'student_org')
 *   search: Search templates by name, description, or tags
 *   id: Get a specific template by ID
 */
export const GET = withAuthAndErrors(async (request, context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category") as SpaceTemplateCategory | null;
  const suggestedFor = searchParams.get("suggestedFor");
  const searchQuery = searchParams.get("search");
  const templateId = searchParams.get("id");

  // Get specific template by ID
  if (templateId) {
    const template = getSpaceTemplateById(templateId);

    if (!template) {
      return respond.error("Template not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    logger.info("Template fetched", {
      userId,
      templateId,
      endpoint: "/api/spaces/templates",
    });

    return respond.success({ template });
  }

  // Get filtered or all templates
  let templates: SpaceTemplate[];

  if (searchQuery) {
    templates = searchSpaceTemplates(searchQuery);
  } else if (category) {
    templates = getSpaceTemplatesByCategory(category);
  } else if (suggestedFor) {
    templates = getTemplatesSuggestedFor(suggestedFor);
  } else {
    templates = getAllSpaceTemplates();
  }

  // Transform for API response (include only metadata for list view)
  const templateSummaries = templates.map((template: SpaceTemplate) => ({
    id: template.metadata.id,
    name: template.metadata.name,
    description: template.metadata.description,
    category: template.metadata.category,
    icon: template.metadata.icon,
    difficulty: template.metadata.difficulty,
    estimatedSetupTime: template.metadata.estimatedSetupTime,
    tags: template.metadata.tags,
    tabCount: template.tabs.length,
    widgetCount: template.widgets.length,
    suggestedFor: template.metadata.suggestedFor,
  }));

  logger.info("Templates listed", {
    userId,
    count: templateSummaries.length,
    category,
    suggestedFor,
    searchQuery,
    endpoint: "/api/spaces/templates",
  });

  return respond.success({
    templates: templateSummaries,
    total: templateSummaries.length,
    categories: ["academic", "social", "professional", "community", "events"] as SpaceTemplateCategory[],
  });
});

import { NextResponse } from "next/server";
import {
  getAllAutomationTemplates as getAllTemplates,
  getTemplatesByCategory,
  getAutomationTemplateById as getTemplateById,
  getTemplateCategories,
} from "@hive/core";

/**
 * GET /api/automations/templates
 *
 * Get automation templates, optionally filtered by category.
 *
 * Query params:
 * - category: Filter by category (engagement, events, moderation, notifications)
 * - id: Get a single template by ID
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const id = url.searchParams.get("id");

    // Get single template by ID
    if (id) {
      const template = getTemplateById(id);
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ template });
    }

    // Get templates by category or all
    const templates = category
      ? getTemplatesByCategory(category as 'engagement' | 'events' | 'moderation' | 'notifications')
      : getAllTemplates();

    const categories = getTemplateCategories();

    return NextResponse.json({
      templates,
      categories,
      total: templates.length,
    });
  } catch (error) {
    console.error("Error fetching automation templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * Template Entity - Domain model for community tool templates
 *
 * Templates are reusable tool compositions that can be:
 * - Created by leaders who want to share their tools
 * - Browsed by anyone in the template gallery
 * - "Remixed" (copied) by users to create their own version
 *
 * There are two sources of templates:
 * 1. Code-defined templates (TOOL_TEMPLATES from element-system.ts)
 * 2. Community templates (stored in Firestore)
 */

import { Result } from '../../shared/base/Result';

// ============================================================================
// Types
// ============================================================================

export type TemplateCategory =
  | 'engagement'     // Polls, quizzes, reactions
  | 'events'         // RSVPs, calendars, countdowns
  | 'organization'   // Sign-ups, rosters, schedules
  | 'analytics'      // Dashboards, stats, leaderboards
  | 'communication'  // Announcements, notifications
  | 'academic'       // Study tools, course-related
  | 'social'         // Games, icebreakers, fun tools
  | 'productivity';  // Forms, checklists, task management

export type TemplateVisibility =
  | 'private'   // Only visible to creator
  | 'campus'    // Visible to same campus
  | 'public';   // Visible to everyone

export type TemplateSource =
  | 'code'      // Defined in TOOL_TEMPLATES constant
  | 'community' // User-created, stored in Firestore
  | 'featured'; // Curated by HIVE team

/**
 * Canvas element in a template composition
 */
export interface TemplateElement {
  /** Element type ID (e.g., 'poll-element', 'countdown-timer') */
  elementId: string;
  /** Unique instance ID within the template */
  instanceId: string;
  /** Element configuration */
  config: Record<string, unknown>;
  /** Position on canvas grid */
  position: { x: number; y: number };
  /** Size in grid units */
  size: { width: number; height: number };
}

/**
 * Connection between elements (data flow)
 */
export interface TemplateConnection {
  from: { instanceId: string; output: string };
  to: { instanceId: string; input: string };
}

/**
 * Complete template composition structure
 */
export interface TemplateComposition {
  elements: TemplateElement[];
  connections: TemplateConnection[];
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
}

/**
 * Template entity properties
 */
export interface TemplateProps {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  composition: TemplateComposition;
  source: TemplateSource;
  visibility: TemplateVisibility;

  // Metadata
  creatorId: string;
  creatorName?: string;
  campusId?: string;

  // Discovery
  tags: string[];
  isFeatured: boolean;
  usageCount: number;

  // Dates
  createdAt: Date;
  updatedAt: Date;

  // Optional: link to original if this is a remix
  remixedFromId?: string;

  // Optional: thumbnail/preview image URL
  thumbnailUrl?: string;

  // Optional: space this template is associated with
  spaceId?: string;
}

// ============================================================================
// Template Entity
// ============================================================================

export class Template {
  private constructor(private readonly props: TemplateProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get category(): TemplateCategory {
    return this.props.category;
  }

  get composition(): TemplateComposition {
    return this.props.composition;
  }

  get source(): TemplateSource {
    return this.props.source;
  }

  get visibility(): TemplateVisibility {
    return this.props.visibility;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get creatorName(): string | undefined {
    return this.props.creatorName;
  }

  get campusId(): string | undefined {
    return this.props.campusId;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  get usageCount(): number {
    return this.props.usageCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get remixedFromId(): string | undefined {
    return this.props.remixedFromId;
  }

  get thumbnailUrl(): string | undefined {
    return this.props.thumbnailUrl;
  }

  get spaceId(): string | undefined {
    return this.props.spaceId;
  }

  get elementCount(): number {
    return this.props.composition.elements.length;
  }

  get connectionCount(): number {
    return this.props.composition.connections.length;
  }

  /**
   * Check if a user can view this template
   */
  canView(userId: string, userCampusId?: string): boolean {
    // Public templates are visible to everyone
    if (this.props.visibility === 'public') {
      return true;
    }

    // Private templates only visible to creator
    if (this.props.visibility === 'private') {
      return this.props.creatorId === userId;
    }

    // Campus templates visible to same campus
    if (this.props.visibility === 'campus') {
      return this.props.campusId === userCampusId || this.props.creatorId === userId;
    }

    return false;
  }

  /**
   * Check if a user can edit this template
   */
  canEdit(userId: string): boolean {
    return this.props.creatorId === userId;
  }

  /**
   * Update template metadata
   */
  update(updates: Partial<Pick<TemplateProps, 'name' | 'description' | 'category' | 'visibility' | 'tags' | 'thumbnailUrl'>>): void {
    if (updates.name !== undefined) {
      this.props.name = updates.name;
    }
    if (updates.description !== undefined) {
      this.props.description = updates.description;
    }
    if (updates.category !== undefined) {
      this.props.category = updates.category;
    }
    if (updates.visibility !== undefined) {
      this.props.visibility = updates.visibility;
    }
    if (updates.tags !== undefined) {
      this.props.tags = [...updates.tags];
    }
    if (updates.thumbnailUrl !== undefined) {
      this.props.thumbnailUrl = updates.thumbnailUrl;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Update the composition
   */
  updateComposition(composition: TemplateComposition): void {
    this.props.composition = composition;
    this.props.updatedAt = new Date();
  }

  /**
   * Increment usage count (when someone remixes this template)
   */
  incrementUsageCount(): void {
    this.props.usageCount += 1;
  }

  /**
   * Mark as featured
   */
  setFeatured(featured: boolean): void {
    this.props.isFeatured = featured;
    this.props.updatedAt = new Date();
  }

  /**
   * Get all props for persistence
   */
  toProps(): TemplateProps {
    return { ...this.props };
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create a new template
   */
  static create(props: Omit<TemplateProps, 'createdAt' | 'updatedAt' | 'usageCount' | 'isFeatured'> & {
    createdAt?: Date;
    updatedAt?: Date;
    usageCount?: number;
    isFeatured?: boolean;
  }): Result<Template> {
    // Validation
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail<Template>('Template ID is required');
    }

    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<Template>('Template name is required');
    }

    if (props.name.length > 100) {
      return Result.fail<Template>('Template name must be 100 characters or less');
    }

    if (!props.description) {
      return Result.fail<Template>('Template description is required');
    }

    if (props.description.length > 500) {
      return Result.fail<Template>('Template description must be 500 characters or less');
    }

    if (!props.composition || !props.composition.elements || props.composition.elements.length === 0) {
      return Result.fail<Template>('Template must have at least one element');
    }

    if (!props.creatorId) {
      return Result.fail<Template>('Creator ID is required');
    }

    const now = new Date();

    const template = new Template({
      ...props,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
      usageCount: props.usageCount ?? 0,
      isFeatured: props.isFeatured ?? false,
      tags: props.tags ?? [],
    });

    return Result.ok<Template>(template);
  }

  /**
   * Create a template from an existing tool (for "Save as Template" flow)
   */
  static createFromTool(
    tool: {
      id: string;
      name: string;
      description: string;
      composition: TemplateComposition;
    },
    creatorId: string,
    options: {
      templateName?: string;
      description?: string;
      category: TemplateCategory;
      visibility: TemplateVisibility;
      tags?: string[];
      campusId?: string;
    }
  ): Result<Template> {
    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return Template.create({
      id: templateId,
      name: options.templateName || `${tool.name} Template`,
      description: options.description || tool.description,
      category: options.category,
      composition: tool.composition,
      source: 'community',
      visibility: options.visibility,
      creatorId,
      campusId: options.campusId,
      tags: options.tags || [],
      remixedFromId: undefined, // This is a new template, not a remix
    });
  }

  /**
   * Create a remix (copy) of a template for a user
   */
  static createRemix(
    original: Template,
    newCreatorId: string,
    options: {
      name?: string;
      campusId?: string;
    }
  ): Result<Template> {
    const remixId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Increment usage on original
    original.incrementUsageCount();

    return Template.create({
      id: remixId,
      name: options.name || `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      composition: JSON.parse(JSON.stringify(original.composition)), // Deep copy
      source: 'community',
      visibility: 'private', // Remixes start as private
      creatorId: newCreatorId,
      campusId: options.campusId,
      tags: [...original.tags],
      remixedFromId: original.id,
    });
  }

  /**
   * Reconstitute from persistence (skip validation for trusted data)
   */
  static reconstitute(props: TemplateProps): Template {
    return new Template(props);
  }
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * Template list item DTO (for gallery browsing)
 */
export interface TemplateListItemDTO {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  source: TemplateSource;
  elementCount: number;
  connectionCount: number;
  tags: string[];
  isFeatured: boolean;
  usageCount: number;
  creatorName?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

/**
 * Template detail DTO (for template page)
 */
export interface TemplateDetailDTO extends TemplateListItemDTO {
  composition: TemplateComposition;
  visibility: TemplateVisibility;
  creatorId: string;
  campusId?: string;
  remixedFromId?: string;
  spaceId?: string;
  updatedAt: string;
}

/**
 * Convert Template entity to list item DTO
 */
export function toTemplateListItemDTO(template: Template): TemplateListItemDTO {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    source: template.source,
    elementCount: template.elementCount,
    connectionCount: template.connectionCount,
    tags: template.tags,
    isFeatured: template.isFeatured,
    usageCount: template.usageCount,
    creatorName: template.creatorName,
    thumbnailUrl: template.thumbnailUrl,
    createdAt: template.createdAt.toISOString(),
  };
}

/**
 * Convert Template entity to detail DTO
 */
export function toTemplateDetailDTO(template: Template): TemplateDetailDTO {
  return {
    ...toTemplateListItemDTO(template),
    composition: template.composition,
    visibility: template.visibility,
    creatorId: template.creatorId,
    campusId: template.campusId,
    remixedFromId: template.remixedFromId,
    spaceId: template.spaceId,
    updatedAt: template.updatedAt.toISOString(),
  };
}

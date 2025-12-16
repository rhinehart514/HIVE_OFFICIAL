/**
 * Template Entity
 *
 * Represents a reusable tool/composition template that can be shared
 * and installed by other users.
 */

import { Result } from '../shared/base/Result';

// ============================================================================
// TYPES
// ============================================================================

export type TemplateCategory =
  | 'engagement'
  | 'events'
  | 'organization'
  | 'analytics'
  | 'communication'
  | 'academic'
  | 'social'
  | 'productivity';

export type TemplateVisibility = 'private' | 'campus' | 'public';

export type TemplateSource = 'official' | 'community' | 'user';

export interface TemplateComposition {
  elements: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
    position?: { x: number; y: number };
  }>;
  connections?: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  layout?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface TemplateProps {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  composition: TemplateComposition;
  source: TemplateSource;
  visibility: TemplateVisibility;
  creatorId: string;
  campusId: string;
  tags: string[];
  spaceId?: string;
  sourceToolId?: string;
  usageCount: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ENTITY
// ============================================================================

export class Template {
  private constructor(private readonly props: TemplateProps) {}

  // Getters
  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get description(): string { return this.props.description; }
  get category(): TemplateCategory { return this.props.category; }
  get composition(): TemplateComposition { return this.props.composition; }
  get source(): TemplateSource { return this.props.source; }
  get visibility(): TemplateVisibility { return this.props.visibility; }
  get creatorId(): string { return this.props.creatorId; }
  get campusId(): string { return this.props.campusId; }
  get tags(): string[] { return this.props.tags; }
  get spaceId(): string | undefined { return this.props.spaceId; }
  get sourceToolId(): string | undefined { return this.props.sourceToolId; }
  get usageCount(): number { return this.props.usageCount; }
  get isFeatured(): boolean { return this.props.isFeatured; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /**
   * Create a new Template
   */
  static create(props: Omit<TemplateProps, 'usageCount' | 'isFeatured' | 'createdAt' | 'updatedAt'> & {
    usageCount?: number;
    isFeatured?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<Template> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail('Template name is required');
    }

    if (!props.description || props.description.trim().length === 0) {
      return Result.fail('Template description is required');
    }

    if (!props.composition?.elements?.length) {
      return Result.fail('Template must have at least one element');
    }

    const now = new Date();
    const template = new Template({
      ...props,
      usageCount: props.usageCount ?? 0,
      isFeatured: props.isFeatured ?? false,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });

    return Result.ok(template);
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: TemplateProps): Template {
    return new Template(props);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): TemplateProps {
    return { ...this.props };
  }

  /**
   * Increment usage count
   */
  incrementUsage(): void {
    (this.props as { usageCount: number }).usageCount += 1;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }

  /**
   * Check if a user can view this template
   */
  canView(userId: string, userCampusId?: string): boolean {
    // Public templates are visible to everyone
    if (this.visibility === 'public') return true;

    // Creator can always view
    if (this.creatorId === userId) return true;

    // Campus templates visible to same campus
    if (this.visibility === 'campus' && userCampusId === this.campusId) return true;

    return false;
  }

  /**
   * Check if a user can edit this template
   */
  canEdit(userId: string): boolean {
    // Only creator can edit
    return this.creatorId === userId;
  }

  /**
   * Update template properties
   */
  update(props: Partial<Pick<TemplateProps, 'name' | 'description' | 'category' | 'visibility' | 'composition' | 'tags'>>): void {
    if (props.name !== undefined) {
      (this.props as { name: string }).name = props.name;
    }
    if (props.description !== undefined) {
      (this.props as { description: string }).description = props.description;
    }
    if (props.category !== undefined) {
      (this.props as { category: TemplateCategory }).category = props.category;
    }
    if (props.visibility !== undefined) {
      (this.props as { visibility: TemplateVisibility }).visibility = props.visibility;
    }
    if (props.composition !== undefined) {
      (this.props as { composition: TemplateComposition }).composition = props.composition;
    }
    if (props.tags !== undefined) {
      (this.props as { tags: string[] }).tags = props.tags;
    }
    (this.props as { updatedAt: Date }).updatedAt = new Date();
  }
}

// ============================================================================
// DTOs
// ============================================================================

export interface TemplateListItemDTO {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  source: TemplateSource;
  visibility: TemplateVisibility;
  creatorId: string;
  tags: string[];
  usageCount: number;
  isFeatured: boolean;
  createdAt: string;
}

export interface TemplateDetailDTO extends TemplateListItemDTO {
  composition: TemplateComposition;
  campusId: string;
  spaceId?: string;
  sourceToolId?: string;
  updatedAt: string;
}

export function toTemplateListItemDTO(template: Template): TemplateListItemDTO {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    source: template.source,
    visibility: template.visibility,
    creatorId: template.creatorId,
    tags: template.tags,
    usageCount: template.usageCount,
    isFeatured: template.isFeatured,
    createdAt: template.createdAt.toISOString(),
  };
}

export function toTemplateDetailDTO(template: Template): TemplateDetailDTO {
  return {
    ...toTemplateListItemDTO(template),
    composition: template.composition,
    campusId: template.campusId,
    spaceId: template.spaceId,
    sourceToolId: template.sourceToolId,
    updatedAt: template.updatedAt.toISOString(),
  };
}

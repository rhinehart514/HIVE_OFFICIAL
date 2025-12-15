/**
 * Server-side only exports (Firebase Admin SDK)
 *
 * Import from '@hive/core/server' in API routes and server components.
 * Do NOT import these in client-side code.
 */

// Internal imports for factory functions
import { SpaceManagementService, type SaveSpaceMemberFn } from './application/space-management.service';
import { getServerSpaceRepository, getServerBoardRepository, getServerMessageRepository } from './infrastructure/repositories/firebase-admin';
import { getServerInlineComponentRepository } from './infrastructure/repositories/firebase-admin/inline-component.repository';
import { SpaceChatService } from './application/spaces/space-chat.service';

// Firebase Admin SDK
export * from './firebase-admin';

// Firestore Collection Paths (centralized configuration)
export * from './infrastructure/firestore-collections';

// Server-side Repositories
export {
  // Profile
  FirebaseAdminProfileRepository,
  getServerProfileRepository,
  resetServerProfileRepository,
  type ProfileDocument,
  type BentoCardConfig,
  type BentoCardType,
  // Space
  FirebaseAdminSpaceRepository,
  getServerSpaceRepository,
  resetServerSpaceRepository,
  type SpaceDocument,
  type SpacePersistenceData,
  // Unit of Work
  FirebaseAdminUnitOfWork,
  getServerUnitOfWork,
  resetServerUnitOfWork,
  // Chat (Boards + Messages)
  FirebaseAdminBoardRepository,
  FirebaseAdminMessageRepository,
  createChatRepositories,
  getServerBoardRepository,
  getServerMessageRepository,
  type IBoardRepository,
  type IMessageRepository,
} from './infrastructure/repositories/firebase-admin';

// Inline Component Repository
export {
  FirebaseAdminInlineComponentRepository,
  getServerInlineComponentRepository,
  createInlineComponentRepository,
  type IInlineComponentRepository,
} from './infrastructure/repositories/firebase-admin/inline-component.repository';

// Inline Component Domain Entity
export {
  InlineComponent,
  type InlineComponentType,
  type PollConfig,
  type CountdownConfig,
  type RsvpConfig,
  type CustomConfig,
  type ComponentConfig,
  type SharedState,
  type ParticipantRecord,
  type AggregationDelta,
  type ComponentDisplayState,
} from './domain/spaces/entities/inline-component';

// Re-export domain types needed for server operations
export { PrivacyLevel, ProfilePrivacy } from './domain/profile/value-objects/profile-privacy.value';
export type { EnhancedProfile } from './domain/profile/aggregates/enhanced-profile';
export type { EnhancedSpace } from './domain/spaces/aggregates/enhanced-space';
export type { SpaceMemberRole } from './domain/spaces/aggregates/enhanced-space';
export type { IProfileRepository, ISpaceRepository, IUnitOfWork } from './infrastructure/repositories/interfaces';

// Space Value Objects (for validation)
export { SpaceSlug } from './domain/spaces/value-objects/space-slug.value';
export { SpaceCategory, SpaceCategoryEnum, CAMPUSLABS_BRANCH_MAP, CATEGORY_LABELS, CATEGORY_ICONS } from './domain/spaces/value-objects/space-category.value';
export { SPACE_CATEGORIES, normalizeCategory, isValidCategory } from './domain/spaces/constants/space-categories';
export type { SpaceCategoryValue } from './domain/spaces/constants/space-categories';
export { SpaceName } from './domain/spaces/value-objects/space-name.value';
export { SpaceDescription } from './domain/spaces/value-objects/space-description.value';
export { SpaceId } from './domain/spaces/value-objects/space-id.value';

// Application Services for server-side use
export {
  SpaceManagementService,
  // Space CRUD types
  type CreateSpaceInput,
  type CreateSpaceResult,
  type UpdateSpaceInput,
  // Leader request types
  type LeaderRequestInput,
  type LeaderRequestResult,
  type LeaderRequestDecision,
  type LeaderRequestDecisionResult,
  // Member management types
  type SpaceMemberData,
  type SaveSpaceMemberFn,
  type UpdateSpaceMemberFn,
  type FindSpaceMemberFn,
  type UpdateSpaceMetricsFn,
  type JoinSpaceInput,
  type JoinSpaceResult,
  type LeaveSpaceInput,
  type LeaveSpaceResult,
  type InviteMemberInput,
  type RemoveMemberInput,
  type RoleChangeInput,
  type OwnershipTransferInput,
  type SuspendMemberInput,
  type SuspendMemberResult,
  // Tab operation types (Phase 4 - DDD Foundation)
  type AddTabInput,
  type UpdateTabInput,
  type RemoveTabInput,
  type ReorderTabsInput,
  type TabOperationResult,
  // Widget operation types (Phase 4 - DDD Foundation)
  type AddWidgetInput,
  type UpdateWidgetInput,
  type RemoveWidgetInput,
  type WidgetTabInput,
  type WidgetOperationResult
} from './application/space-management.service';

// Domain Events (Phase 1 - DDD Foundation)
export {
  SpaceUpdatedEvent,
  TabCreatedEvent,
  TabUpdatedEvent,
  TabRemovedEvent,
  TabsReorderedEvent,
  WidgetCreatedEvent,
  WidgetUpdatedEvent,
  WidgetRemovedEvent,
  WidgetAttachedToTabEvent,
  WidgetDetachedFromTabEvent,
  ToolPlacedEvent,
  PlacedToolUpdatedEvent,
  ToolRemovedEvent,
  PlacedToolActivatedEvent,
  PlacedToolDeactivatedEvent,
  PlacedToolsReorderedEvent,
} from './domain/spaces/events';

export {
  SpaceDiscoveryService,
  createSpaceDiscoveryService,
} from './application/spaces/space-discovery.service';

export {
  SpaceDeploymentService,
  createSpaceDeploymentService,
} from './application/spaces/space-deployment.service';

export type {
  PlaceToolInput,
  PlaceToolResult,
  UpdatePlacedToolInput,
  RemovePlacedToolInput,
  ReorderPlacedToolsInput,
  AutoDeployInput,
  AutoDeployResult,
  SpaceDeploymentCallbacks,
  PlacedToolData,
} from './application/spaces/space-deployment.service';

// Domain Event Infrastructure
export {
  DomainEventPublisher,
  getDomainEventPublisher,
  LoggingEventHandler,
  createLoggingEventHandler,
  type IDomainEventHandler,
  type IEventSubscriber,
  type IEventLogger,
} from './infrastructure/events';

// Space DTOs and Presenters
export type {
  SpaceBaseDTO,
  SpaceBrowseDTO,
  SpaceDetailDTO,
  SpaceMembershipDTO,
  SpaceWithMembersDTO,
  SpaceWithToolsDTO,
  MembershipDTO,
  SpaceActivityDTO,
  SpaceWidgetStatsDTO,
  SpaceMemberDTO,
  TabSummaryDTO,
  TabDetailDTO,
  WidgetSummaryDTO,
  WidgetDetailDTO,
  PlacedToolDTO,
} from './application/spaces';

export {
  toSpaceBrowseDTO,
  toSpaceDetailDTO,
  toSpaceMembershipDTO,
  toSpaceWithMembersDTO,
  toSpaceWithToolsDTO,
  toSpaceBrowseDTOList,
  toSpaceMembershipDTOList,
} from './application/spaces';

// Chat Service (Boards + Messages)
export {
  SpaceChatService,
  createSpaceChatService,
} from './application/spaces/space-chat.service';

export type {
  CreateBoardInput,
  UpdateBoardInput,
  SendMessageInput,
  ReactionInput,
  BoardResult,
  MessageResult,
  ListMessagesOptions,
  ListMessagesResult,
  CheckPermissionFn,
  GetUserProfileFn,
  // Inline component types
  CreateInlineComponentInput,
  InlineComponentResult,
  SubmitParticipationInput,
  IInlineComponentRepository as IInlineComponentRepositoryService,
  // Search types
  SearchMessagesOptions,
  SearchMessagesResult,
} from './application/spaces/space-chat.service';

// Board and ChatMessage domain events
export {
  BoardCreatedEvent,
  BoardUpdatedEvent,
  BoardArchivedEvent,
  BoardDeletedEvent,
  MessageSentEvent,
  MessageEditedEvent,
  MessageDeletedEvent,
  MessagePinnedEvent,
  ReactionAddedEvent,
  ParticipationSubmittedEvent,
  InlineComponentClosedEvent,
} from './domain/spaces/events';

// Profile Value Objects
export { ProfileId } from './domain/profile/value-objects/profile-id.value';
export { CampusId } from './domain/profile/value-objects/campus-id.value';
export { GraduationYear } from './domain/profile/value-objects/graduation-year.value';
export { Major, AcademicSchool, MAJOR_CATALOG } from './domain/profile/value-objects/major.value';
export {
  Interest,
  InterestCollection,
  InterestCategory,
  INTEREST_SUGGESTIONS
} from './domain/profile/value-objects/interest.value';
export {
  ConnectionStrength,
  ConnectionTier,
  type ConnectionFactors
} from './domain/profile/value-objects/connection-strength.value';
export {
  CampusEmail,
  EmailType,
  CAMPUS_EMAIL_CONFIGS,
  type CampusEmailConfig
} from './domain/profile/value-objects/campus-email.value';

/**
 * Callbacks for cross-collection operations in SpaceManagementService
 */
export interface SpaceServiceCallbacks {
  saveSpaceMember?: import('./application/space-management.service').SaveSpaceMemberFn;
  updateSpaceMember?: import('./application/space-management.service').UpdateSpaceMemberFn;
  findSpaceMember?: import('./application/space-management.service').FindSpaceMemberFn;
  updateSpaceMetrics?: import('./application/space-management.service').UpdateSpaceMetricsFn;
}

/**
 * Factory function to create SpaceManagementService with server repository
 */
export function createServerSpaceManagementService(
  context: { userId?: string; campusId: string },
  callbacks?: SpaceServiceCallbacks | SaveSpaceMemberFn
): SpaceManagementService {
  // Support both old signature (just saveSpaceMember) and new signature (callbacks object)
  const callbacksObj: SpaceServiceCallbacks = typeof callbacks === 'function'
    ? { saveSpaceMember: callbacks }
    : callbacks || {};

  return new SpaceManagementService(
    {
      userId: context.userId,
      campusId: context.campusId,
      timestamp: new Date()
    },
    getServerSpaceRepository(),
    callbacksObj
  );
}

/**
 * Factory function to create SpaceDeploymentService with server repository
 */
export function createServerSpaceDeploymentService(
  context: { userId?: string; campusId: string },
  callbacks: import('./application/spaces/space-deployment.service').SpaceDeploymentCallbacks
): import('./application/spaces/space-deployment.service').SpaceDeploymentService {
  const { SpaceDeploymentService } = require('./application/spaces/space-deployment.service');
  return new SpaceDeploymentService(
    {
      userId: context.userId,
      campusId: context.campusId,
      timestamp: new Date()
    },
    getServerSpaceRepository(),
    callbacks
  );
}

/**
 * Callbacks for SpaceChatService cross-collection operations
 */
export interface SpaceChatServiceCallbacks {
  checkPermission: import('./application/spaces/space-chat.service').CheckPermissionFn;
  getUserProfile: import('./application/spaces/space-chat.service').GetUserProfileFn;
}

/**
 * Factory function to create SpaceChatService with server repositories
 */
export function createServerSpaceChatService(
  context: { userId?: string; campusId: string },
  callbacks: SpaceChatServiceCallbacks
): SpaceChatService {
  // Use singleton getters - imported statically at top of file
  const boardRepo = getServerBoardRepository();
  const messageRepo = getServerMessageRepository();
  const inlineComponentRepo = getServerInlineComponentRepository();

  return new SpaceChatService(
    {
      userId: context.userId,
      campusId: context.campusId,
      timestamp: new Date()
    },
    { boardRepo, messageRepo, inlineComponentRepo },
    callbacks
  );
}

// ============================================================
// Category Rules and Leadership Functions
// ============================================================

/**
 * Category-based permission rules for spaces
 */
export interface CategoryRules {
  /** Maximum number of leaders allowed */
  maxLeaders: number;
  /** Whether the space requires moderation */
  requiresModeration: boolean;
  /** Whether members can self-promote to leader */
  allowSelfPromotion: boolean;
  /** Whether the category is hidden from browse */
  isHidden: boolean;
  /** Minimum membership duration (days) before requesting leadership */
  minMembershipDays: number;
  /** Description of leadership requirements for this category */
  leadershipDescription: string;
}

const DEFAULT_CATEGORY_RULES: CategoryRules = {
  maxLeaders: 10,
  requiresModeration: false,
  allowSelfPromotion: true,
  isHidden: false,
  minMembershipDays: 7,
  leadershipDescription: 'Be an active member and help grow the community.',
};

const CATEGORY_RULES_MAP: Record<string, Partial<CategoryRules>> = {
  residential: {
    isHidden: true,
    allowSelfPromotion: false,
    requiresModeration: true,
    leadershipDescription: 'Residential spaces are managed by RAs only.',
  },
  university_org: {
    requiresModeration: true,
    maxLeaders: 20,
    leadershipDescription: 'Official university organizations require admin approval for leadership.',
  },
  greek_life: {
    maxLeaders: 15,
    minMembershipDays: 30,
    leadershipDescription: 'Greek life organizations require 30 days of membership before leadership requests.',
  },
  academic: {
    requiresModeration: true,
    leadershipDescription: 'Academic spaces require moderator review for leadership positions.',
  },
};

/**
 * Get category-specific rules for a space
 */
export function getCategoryRules(category: string): CategoryRules {
  const overrides = CATEGORY_RULES_MAP[category] || {};
  return { ...DEFAULT_CATEGORY_RULES, ...overrides };
}

/**
 * Check if leaders can be removed from a space based on category rules
 * When called with just category, returns whether the category allows leader removal.
 * When called with all arguments, performs full permission check.
 */
export function canRemoveLeaders(
  category: string,
  currentLeaderCount?: number,
  removerRole?: string
): boolean {
  const rules = getCategoryRules(category);

  // If called with just category, check if category allows removal at all
  if (currentLeaderCount === undefined || removerRole === undefined) {
    // Categories that don't allow self-promotion typically don't allow member-initiated removal
    return rules.allowSelfPromotion;
  }

  // Full permission check
  // Owner can always remove leaders
  if (removerRole === 'owner') return true;
  // Admins can remove if there will still be at least one leader
  if (removerRole === 'admin' && currentLeaderCount > 1) return true;
  return false;
}

/**
 * Check if a user can request leadership for a space
 * When called with just category, checks if category allows self-promotion.
 */
export function canRequestLeadership(
  category: string,
  membershipDays?: number,
  currentLeaderCount?: number
): { allowed: boolean; reason?: string } {
  const rules = getCategoryRules(category);

  if (!rules.allowSelfPromotion) {
    return { allowed: false, reason: 'This space category does not allow self-promotion to leader' };
  }

  // If only category is provided, just check if self-promotion is allowed
  if (membershipDays === undefined || currentLeaderCount === undefined) {
    return { allowed: true };
  }

  if (membershipDays < rules.minMembershipDays) {
    return {
      allowed: false,
      reason: `You must be a member for at least ${rules.minMembershipDays} days before requesting leadership`
    };
  }

  if (currentLeaderCount >= rules.maxLeaders) {
    return { allowed: false, reason: 'This space has reached the maximum number of leaders' };
  }

  return { allowed: true };
}

/**
 * Check if a space has reached its leader limit
 */
export function hasReachedLeaderLimit(category: string, currentLeaderCount: number): boolean {
  const rules = getCategoryRules(category);
  return currentLeaderCount >= rules.maxLeaders;
}

// ============================================================
// HiveLab Tool Templates (Stubs - TODO: Full implementation)
// ============================================================

export type TemplateCategory = 'engagement' | 'events' | 'organization' | 'analytics' | 'communication' | 'academic' | 'social' | 'productivity' | 'custom';
export type TemplateVisibility = 'public' | 'campus' | 'private';
export type TemplateSource = 'code' | 'user' | 'community';

export interface TemplateComposition {
  elements: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
    position: { x: number; y: number };
  }>;
  connections: Array<{
    from: string;
    to: string;
    type: string;
  }>;
}

export interface TemplateProps {
  id?: string;
  name: string;
  description: string;
  category: TemplateCategory;
  visibility: TemplateVisibility;
  composition: TemplateComposition;
  creatorId: string;
  campusId: string;
  usageCount?: number;
  tags?: string[];
  source?: TemplateSource;
  spaceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TemplateUpdateProps {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  visibility?: TemplateVisibility;
  tags?: string[];
}

/**
 * Result type for repository operations
 */
export type TemplateResult<T> =
  | { isSuccess: true; isFailure: false; getValue: () => T }
  | { isSuccess: false; isFailure: true; error: string };

function successResult<T>(value: T): TemplateResult<T> {
  return { isSuccess: true, isFailure: false, getValue: () => value };
}

function failureResult<T>(error: string): TemplateResult<T> {
  return { isSuccess: false, isFailure: true, error };
}

export class Template {
  readonly id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  visibility: TemplateVisibility;
  readonly composition: TemplateComposition;
  readonly creatorId: string;
  readonly campusId: string;
  usageCount: number;
  tags: string[];
  readonly source: TemplateSource;
  readonly spaceId?: string;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: TemplateProps) {
    this.id = props.id || `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.name = props.name;
    this.description = props.description;
    this.category = props.category;
    this.visibility = props.visibility;
    this.composition = props.composition;
    this.creatorId = props.creatorId;
    this.campusId = props.campusId;
    this.usageCount = props.usageCount || 0;
    this.tags = props.tags || [];
    this.source = props.source || 'user';
    this.spaceId = props.spaceId;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  static create(props: TemplateProps): TemplateResult<Template> {
    if (!props.name || props.name.trim().length === 0) {
      return failureResult('Template name is required');
    }
    if (!props.description || props.description.trim().length === 0) {
      return failureResult('Template description is required');
    }
    if (!props.creatorId) {
      return failureResult('Creator ID is required');
    }
    if (!props.campusId) {
      return failureResult('Campus ID is required');
    }

    const template = new Template(props);
    return successResult(template);
  }

  /**
   * Check if a user can view this template based on visibility
   */
  canView(userId: string, userCampusId?: string): boolean {
    // Public templates are visible to everyone
    if (this.visibility === 'public') return true;
    // Creator can always view their own templates
    if (this.creatorId === userId) return true;
    // Campus templates are visible to users on the same campus
    if (this.visibility === 'campus' && userCampusId === this.campusId) return true;
    // Private templates are only visible to creator
    return false;
  }

  /**
   * Check if a user can edit this template
   */
  canEdit(userId: string): boolean {
    return this.creatorId === userId;
  }

  /**
   * Update template properties
   */
  update(props: TemplateUpdateProps): void {
    if (props.name !== undefined) this.name = props.name;
    if (props.description !== undefined) this.description = props.description;
    if (props.category !== undefined) this.category = props.category;
    if (props.visibility !== undefined) this.visibility = props.visibility;
    if (props.tags !== undefined) this.tags = props.tags;
    this.updatedAt = new Date();
  }

  /**
   * Increment usage count
   */
  incrementUsage(): void {
    this.usageCount += 1;
    this.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      visibility: this.visibility,
      composition: this.composition,
      creatorId: this.creatorId,
      campusId: this.campusId,
      usageCount: this.usageCount,
      tags: this.tags,
      source: this.source,
      spaceId: this.spaceId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

export interface TemplateListItemDTO {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  usageCount: number;
  tags: string[];
}

export interface TemplateDetailDTO {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  visibility: TemplateVisibility;
  composition: TemplateComposition;
  creatorId: string;
  campusId: string;
  usageCount: number;
  tags: string[];
  source: TemplateSource;
  spaceId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Options for findMany query
 */
export interface FindManyTemplatesOptions {
  category?: TemplateCategory;
  visibility?: TemplateVisibility;
  campusId?: string;
  creatorId?: string;
  spaceId?: string;
  tags?: string[];
  featuredOnly?: boolean;
  includeCodeTemplates?: boolean;
  orderBy?: 'createdAt' | 'usageCount' | 'name';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

/**
 * Paginated result for findMany
 */
export interface FindManyTemplatesResult {
  items: Template[];
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Template repository interface with Result pattern
 */
export interface ITemplateRepository {
  findById(id: string): Promise<TemplateResult<Template>>;
  findAll(options?: { category?: TemplateCategory; campusId?: string; visibility?: TemplateVisibility }): Promise<TemplateResult<Template[]>>;
  findMany(options?: FindManyTemplatesOptions): Promise<TemplateResult<FindManyTemplatesResult>>;
  save(template: Template): Promise<TemplateResult<void>>;
  delete(id: string): Promise<TemplateResult<void>>;
  incrementUsageCount(id: string): Promise<TemplateResult<void>>;
}

// Stub repository implementation
class StubTemplateRepository implements ITemplateRepository {
  private templates: Map<string, Template> = new Map();

  async findById(id: string): Promise<TemplateResult<Template>> {
    const template = this.templates.get(id);
    if (!template) {
      return failureResult('Template not found');
    }
    return successResult(template);
  }

  async findAll(_options?: { category?: TemplateCategory; campusId?: string; visibility?: TemplateVisibility }): Promise<TemplateResult<Template[]>> {
    const templates = Array.from(this.templates.values());
    // Apply filters if provided
    let filtered = templates;
    if (_options?.category) {
      filtered = filtered.filter(t => t.category === _options.category);
    }
    if (_options?.campusId) {
      filtered = filtered.filter(t => t.campusId === _options.campusId || t.visibility === 'public');
    }
    if (_options?.visibility) {
      filtered = filtered.filter(t => t.visibility === _options.visibility);
    }
    return successResult(filtered);
  }

  async findMany(options?: FindManyTemplatesOptions): Promise<TemplateResult<FindManyTemplatesResult>> {
    let templates = Array.from(this.templates.values());

    // Apply filters
    if (options?.category) {
      templates = templates.filter(t => t.category === options.category);
    }
    if (options?.visibility) {
      templates = templates.filter(t => t.visibility === options.visibility);
    }
    if (options?.campusId) {
      templates = templates.filter(t => t.campusId === options.campusId || t.visibility === 'public');
    }
    if (options?.creatorId) {
      templates = templates.filter(t => t.creatorId === options.creatorId);
    }
    if (options?.spaceId) {
      templates = templates.filter(t => t.spaceId === options.spaceId);
    }
    if (options?.tags && options.tags.length > 0) {
      templates = templates.filter(t => options.tags!.some(tag => t.tags.includes(tag)));
    }
    if (options?.includeCodeTemplates === false) {
      templates = templates.filter(t => t.source !== 'code');
    }

    // Apply sorting
    const orderBy = options?.orderBy || 'createdAt';
    const orderDirection = options?.orderDirection || 'desc';
    templates.sort((a, b) => {
      let comparison = 0;
      if (orderBy === 'createdAt') {
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
      } else if (orderBy === 'usageCount') {
        comparison = a.usageCount - b.usageCount;
      } else if (orderBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      }
      return orderDirection === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    const limit = options?.limit || 50;
    const startIndex = options?.cursor ? templates.findIndex(t => t.id === options.cursor) + 1 : 0;
    const paginatedTemplates = templates.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < templates.length;
    const nextCursor = hasMore ? paginatedTemplates[paginatedTemplates.length - 1]?.id : undefined;

    return successResult({
      items: paginatedTemplates,
      hasMore,
      nextCursor,
    });
  }

  async save(template: Template): Promise<TemplateResult<void>> {
    this.templates.set(template.id, template);
    return successResult(undefined);
  }

  async delete(id: string): Promise<TemplateResult<void>> {
    if (!this.templates.has(id)) {
      return failureResult('Template not found');
    }
    this.templates.delete(id);
    return successResult(undefined);
  }

  async incrementUsageCount(id: string): Promise<TemplateResult<void>> {
    const template = this.templates.get(id);
    if (!template) {
      return failureResult('Template not found');
    }
    template.incrementUsage();
    return successResult(undefined);
  }
}

let templateRepoSingleton: ITemplateRepository | null = null;

/**
 * Get the server template repository (stub)
 */
export function getServerTemplateRepository(): ITemplateRepository {
  if (!templateRepoSingleton) {
    templateRepoSingleton = new StubTemplateRepository();
  }
  return templateRepoSingleton;
}

/**
 * Convert template to list item DTO
 */
export function toTemplateListItemDTO(template: Template): TemplateListItemDTO {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    usageCount: template.usageCount,
    tags: template.tags,
  };
}

/**
 * Convert template to detail DTO
 */
export function toTemplateDetailDTO(template: Template): TemplateDetailDTO {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    visibility: template.visibility,
    composition: template.composition,
    creatorId: template.creatorId,
    campusId: template.campusId,
    usageCount: template.usageCount,
    tags: template.tags,
    source: template.source,
    spaceId: template.spaceId,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
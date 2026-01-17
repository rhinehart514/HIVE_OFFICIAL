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

// Setup System Repositories (Orchestrated Tool Bundles)
// Firebase Admin implementations - import directly from repository file
export {
  FirebaseAdminSetupTemplateRepository,
  getServerSetupTemplateRepository,
  FirebaseAdminSetupDeploymentRepository,
  getServerSetupDeploymentRepository,
  resetSetupRepositories,
} from './domain/hivelab/setup/setup.repository';

// Setup types and entities - import from main setup exports
export {
  // Types
  type ISetupTemplateRepository,
  type SetupTemplateQueryOptions,
  type ISetupDeploymentRepository,
  type SetupDeploymentQueryOptions,
  type PaginatedResult as SetupPaginatedResult,
  // Entities
  SetupTemplate,
  SetupDeployment,
  // DTOs
  toSetupTemplateListDTO,
  toSetupTemplateDetailDTO,
  toSetupDeploymentListDTO,
  toSetupDeploymentDetailDTO,
  // Types
  type SetupCategory,
  type SetupDeploymentStatus,
} from './domain/hivelab/setup';

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
  SpaceBrowseEnrichment,
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

// ============================================================================
// Category Rules & Leadership Functions
// ============================================================================

export interface CategoryRules {
  category: string;
  maxLeaders: number;
  allowSelfRequest: boolean;
  requireApproval: boolean;
  allowPublicJoin: boolean;
  leadershipDescription?: string;
}

const DEFAULT_CATEGORY_RULES: Record<string, CategoryRules> = {
  student_org: {
    category: 'student_org',
    maxLeaders: 10,
    allowSelfRequest: true,
    requireApproval: true,
    allowPublicJoin: true,
  },
  greek_life: {
    category: 'greek_life',
    maxLeaders: 5,
    allowSelfRequest: false,
    requireApproval: true,
    allowPublicJoin: false,
  },
  academic: {
    category: 'academic',
    maxLeaders: 5,
    allowSelfRequest: true,
    requireApproval: false,
    allowPublicJoin: true,
  },
  residential: {
    category: 'residential',
    maxLeaders: 3,
    allowSelfRequest: false,
    requireApproval: true,
    allowPublicJoin: false,
  },
  university_org: {
    category: 'university_org',
    maxLeaders: 10,
    allowSelfRequest: false,
    requireApproval: true,
    allowPublicJoin: true,
  },
};

/**
 * Get rules for a space category
 */
export function getCategoryRules(category: string): CategoryRules {
  return DEFAULT_CATEGORY_RULES[category] || DEFAULT_CATEGORY_RULES.student_org;
}

/**
 * Check if a user can request leadership of a space
 */
export function canRequestLeadership(
  _userId: string,
  _spaceId: string,
  category: string
): boolean {
  const rules = getCategoryRules(category);
  return rules.allowSelfRequest;
}

/**
 * Check if a space has reached its leader limit
 */
export function hasReachedLeaderLimit(
  leaderCount: number,
  category: string
): boolean {
  const rules = getCategoryRules(category);
  return leaderCount >= rules.maxLeaders;
}

/**
 * Check if leaders can be removed from a space (based on category rules)
 */
export function canRemoveLeaders(category: string): boolean {
  // All categories allow removing leaders, but some require minimum leaders
  const rules = getCategoryRules(category);
  return rules.maxLeaders > 1;
}

// ============================================================================
// Template Repository & DTOs (Real DDD implementation)
// ============================================================================

export {
  // Entity
  Template,
  // Types
  type TemplateProps,
  type TemplateCategory,
  type TemplateVisibility,
  type TemplateSource,
  type TemplateElement,
  type TemplateConnection,
  type TemplateComposition,
  // DTOs
  type TemplateListItemDTO,
  type TemplateDetailDTO,
  toTemplateListItemDTO,
  toTemplateDetailDTO,
} from './domain/hivelab/templates/template.entity';

export {
  // Repository
  type ITemplateRepository,
  type TemplateQueryOptions,
  type PaginatedResult,
  FirebaseAdminTemplateRepository,
  getServerTemplateRepository,
  resetServerTemplateRepository,
} from './domain/hivelab/templates/template.repository'; 
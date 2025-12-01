/**
 * Server-side only exports (Firebase Admin SDK)
 *
 * Import from '@hive/core/server' in API routes and server components.
 * Do NOT import these in client-side code.
 */

// Firebase Admin SDK
export * from './firebase-admin';

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
  resetServerUnitOfWork
} from './infrastructure/repositories/firebase-admin';

// Re-export domain types needed for server operations
export { PrivacyLevel, ProfilePrivacy } from './domain/profile/value-objects/profile-privacy.value';
export type { EnhancedProfile } from './domain/profile/aggregates/enhanced-profile';
export type { EnhancedSpace } from './domain/spaces/aggregates/enhanced-space';
export type { SpaceMemberRole } from './domain/spaces/aggregates/enhanced-space';
export type { IProfileRepository, ISpaceRepository, IUnitOfWork } from './infrastructure/repositories/interfaces';

// Space Value Objects (for validation)
export { SpaceSlug } from './domain/spaces/value-objects/space-slug.value';
export { SpaceCategory, SpaceCategoryEnum, ApiCategoryEnum } from './domain/spaces/value-objects/space-category.value';
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
  WidgetDetachedFromTabEvent
} from './domain/spaces/events';

export {
  SpaceDiscoveryService,
  createSpaceDiscoveryService,
} from './application/spaces/space-discovery.service';

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
  MembershipDTO,
  SpaceActivityDTO,
  SpaceWidgetStatsDTO,
  SpaceMemberDTO,
  TabSummaryDTO,
  TabDetailDTO,
  WidgetSummaryDTO,
  WidgetDetailDTO,
} from './application/spaces';

export {
  toSpaceBrowseDTO,
  toSpaceDetailDTO,
  toSpaceMembershipDTO,
  toSpaceWithMembersDTO,
  toSpaceBrowseDTOList,
  toSpaceMembershipDTOList,
} from './application/spaces';

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
  callbacks?: SpaceServiceCallbacks | import('./application/space-management.service').SaveSpaceMemberFn
): import('./application/space-management.service').SpaceManagementService {
  const { SpaceManagementService } = require('./application/space-management.service');
  const { getServerSpaceRepository } = require('./infrastructure/repositories/firebase-admin');

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
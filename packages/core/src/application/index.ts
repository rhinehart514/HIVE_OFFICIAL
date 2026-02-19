/**
 * Application Services Layer
 * Orchestrates domain models and provides use cases for the UI
 */

// Base service infrastructure
export {
  BaseApplicationService
} from './base.service';

export type {
  ApplicationServiceContext,
  ServiceResult,
  ServiceError
} from './base.service';

// CQRS Infrastructure - Temporarily removed during DDD refactor
// Will be rebuilt with proper CQRS implementation

// Commands & Queries - Temporarily removed during DDD refactor
// Will be rebuilt with proper domain model structure

// Cross-Domain Sagas removed in favor of simpler command handlers

// Legacy Profile domain services (existing)
export {
  ProfileOnboardingService
} from './profile-onboarding.service';

export type {
  OnboardingData,
  OnboardingResult
} from './profile-onboarding.service';

// Space Discovery Service (query operations)
export {
  SpaceDiscoveryService,
  createSpaceDiscoveryService,
} from './spaces/space-discovery.service';

export type {
  BrowseSpacesInput,
  BrowseSpacesResult,
  SearchSpacesInput,
  RecommendedSpacesInput,
  UserSpacesInput,
  CheckMembershipFn,
  GetMembershipsFn,
} from './spaces/space-discovery.service';

// Space Deployment Service (HiveLab → Spaces integration)
export {
  SpaceDeploymentService,
  createSpaceDeploymentService,
} from './spaces/space-deployment.service';

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
} from './spaces/space-deployment.service';

// Space DTOs and Presenters
export type {
  SpaceBaseDTO,
  SpaceBrowseDTO,
  SpaceBrowseEnrichment,
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
} from './spaces';

export {
  toSpaceBrowseDTO,
  toSpaceDetailDTO,
  toSpaceMembershipDTO,
  toSpaceWithMembersDTO,
  toSpaceBrowseDTOList,
  toSpaceMembershipDTOList,
} from './spaces';

export {
  SpaceManagementService
} from './space-management.service';

export type {
  CreateSpaceInput,
  CreateSpaceResult,
  LeaderRequestInput,
  LeaderRequestResult,
  LeaderRequestDecision,
  LeaderRequestDecisionResult,
  RoleChangeInput,
  OwnershipTransferInput
} from './space-management.service';

// Feed domain services (stub - not yet implemented)
// export { } from './feed.service';

// Feed types (stub)
export type FeedGenerationOptions = Record<string, unknown>;
export type FeedInsights = Record<string, unknown>;
export type FeedContent = Record<string, unknown>;

// Ritual domain services
export {
  EnhancedRitualParticipationService
} from './ritual-participation.service';

export type {
  EnhancedRitualCreationData,
  EnhancedRitualProgress,
  LeaderboardEntry
} from './ritual-participation.service';

export {
  RitualEngineService
} from './rituals/ritual-engine.service';

export type {
  UpsertRitualInput,
  TransitionOptions
} from './rituals/ritual-engine.service';

export {
  toFeedBanner,
  toDetailView,
} from './rituals/ritual-presenter';

export type {
  RitualFeedBanner,
  RitualDetailView,
  RitualDetailStatus,
} from './rituals/ritual-presenter';

// Service Factory temporarily removed - will be rebuilt with proper DDD structure

// Webhook services
export * from './webhooks';

/**
 * @hive/core - Main export file
 * Domain-Driven Design architecture with proper bounded contexts
 */

// Domain Models - Specific exports to avoid conflicts
export { EnhancedProfile } from "./domain/profile/aggregates/enhanced-profile";
export type { SpecCompliantProfile } from "./domain/profile/spec-compliant-profile";
export { isProfileComplete, getProfileCompletionPercentage, createDefaultProfile } from "./domain/profile/spec-compliant-profile";
export { Connection, ConnectionType, ConnectionSource } from "./domain/profile/aggregates/connection";
export { SpaceId } from "./domain/spaces/value-objects/space-id.value";
export { SpaceName } from "./domain/spaces/value-objects/space-name.value";
export { SpaceDescription } from "./domain/spaces/value-objects/space-description.value";
export { SpaceCategory } from "./domain/spaces/value-objects/space-category.value";
export { EnhancedSpace } from "./domain/spaces/aggregates/enhanced-space";
export { Tab } from "./domain/spaces/entities/tab";
export { Widget } from "./domain/spaces/entities/widget";
export { RitualId } from "./domain/rituals/value-objects/ritual-id.value";
export { EnhancedRitual } from "./domain/rituals/aggregates/enhanced-ritual";
export { FeedItem } from "./domain/feed/feed-item";
export { EnhancedFeed } from "./domain/feed/enhanced-feed";
export {
  RitualArchetype,
  type RitualPhase,
  type RitualPresentation,
  type RitualMetricsSnapshot,
  type BaseRitual,
  type FoundingClassRitual,
  type LaunchCountdownRitual,
  type BetaLotteryRitual,
  type UnlockChallengeRitual,
  type SurvivalRitual,
  type LeakRitual,
  type TournamentRitual,
  type FeatureDropRitual,
  type RuleInversionRitual,
  type RitualUnion,
  type FoundingClassConfig,
  type LaunchCountdownConfig,
  type BetaLotteryConfig,
  type UnlockChallengeConfig,
  type SurvivalConfig,
  type LeakConfig,
  type TournamentConfig,
  type TournamentMatchup,
  type FeatureDropConfig,
  type FeatureDropAnalyticsMetric,
  type FeatureDropSurveyQuestion,
  type RuleInversionConfig,
  type RuleInversionGuardrail,
  RitualSchema,
  RitualUnionSchema,
  parseRitualUnion,
} from "./domain/rituals/archetypes";

export * from "./domain/rituals/events";
export {
  RitualComposerSchema,
  createDefaultConfig,
  type RitualComposerInput,
} from "./domain/rituals/composer";

// Ritual Templates
export {
  RITUAL_TEMPLATES,
  getAvailableTemplates,
  getTemplate,
  getTemplatesByCategory,
  getTemplatesByArchetype,
  type RitualTemplate,
  type RitualTemplateMetadata,
  type RitualTemplateId,
} from "./domain/rituals/templates";

// HiveLab Domain Types
export type {
  ToolComposition,
  CanvasElement,
  ElementConnection,
  ElementDefinition,
  ElementCategory
} from "./domain/hivelab/tool-composition.types";

// HiveLab Services - MOVED TO @hive/core/server for client/server separation
// Import from '@hive/core/server' for server-side usage
// export { AIToolGeneratorService, createAIToolGenerator } from "./application/hivelab/ai-tool-generator.service";
// export type {
//   AIGeneratorConfig,
//   GenerateToolOptions,
//   GenerateToolResult,
//   StreamingChunk
// } from "./application/hivelab/ai-tool-generator.service";
export {
  ELEMENT_CATALOG,
  SYSTEM_PROMPT,
  DEMO_PROMPTS,
  generateInstanceId,
  type StreamingMessage
} from "./application/hivelab/prompts/tool-generation.prompt";

// Application Services - Use Case Orchestration
export * from "./application";

// Repository Pattern - Data Access Layer
export * from "./infrastructure/repositories/interfaces";
export * from "./infrastructure/repositories/factory";
export { FirebaseUnitOfWork } from "./infrastructure/repositories/firebase/unit-of-work";

// DTOs and Mappers
export * from "./application/identity/dtos/profile.dto";
export * from "./infrastructure/mappers/profile.firebase-mapper";

// Services
export { presenceService } from "./services/presence-service";
export type { PresenceData, PresenceStatus } from "./services/presence-service";

// Constants
export * from "./constants/majors";
export * from "./constants/onboarding-interests";

// Stores
export * from "./stores/useAppStore";

// Feature Flags
export * from "./feature-flags";

// Firebase Configuration - re-exported from @hive/firebase
export { app, db, auth, storage, validateCampusAccess, checkRateLimit } from "@hive/firebase";
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Analytics } from "@hive/firebase";

// NOTE: Firebase Admin SDK exports are NOT included here to prevent client-side bundling issues
// Server-side code should import from '@hive/core/server' or directly from the firebase-admin module

// Server-side utilities - MOVED TO @hive/core/server
// Import from '@hive/core/server' for server-side usage
// export * from "./server";

// Types and Interfaces - Specific exports to avoid conflicts
export type { ProfileSystem, HiveProfile, UnifiedHiveProfile, GridSize, BentoGridLayout, Friend } from "./types/profile-system";
// Re-export with aliases to avoid conflicts with domain aggregates
export type { Connection as ProfileSystemConnection, Badge as ProfileBadge } from "./types/profile-system";
export { ConnectionType as ProfileSystemConnectionType } from "./types/profile-system";

// Loading state types
export type {
  HiveQueryState,
  HiveMutationState,
  HiveQueryConfig,
  HiveMutationConfig,
  QueryKey,
  CacheEntry,
  LoadingContextValue,
  PaginationCursor,
  PaginatedResponse,
  RealtimeUpdateType,
  RealtimeUpdate,
  OfflineQueueEntry,
  LoadingAnalyticsEvent,
} from "./types/loading-state.types";

// Error types
export { ErrorCategory, ErrorSeverity } from "./types/error.types";
export type { HiveError } from "./types/error.types";

// Utilities
export * from "./utils/activity-tracker";
export * from "./utils/privacy-utils";
export * from "./utils/profile-aggregator";

// Analytics convenience functions (for backwards compatibility)
export * from "./analytics-temp-exports";

// Realtime and Query exports
export { feedListener } from "./infrastructure/realtime/feed-listener";
export type { FeedUpdate, FeedListenerOptions } from "./infrastructure/realtime/feed-listener";
export { GetFeedQueryHandler } from "./application/feed/queries/get-feed.query";
export type { GetFeedQuery, GetFeedQueryResult } from "./application/feed/queries/get-feed.query";
export { SearchType, SearchQueryHandler } from "./application/search/queries/search.query";
export type { SearchResultItem, SearchQuery, SearchQueryResult } from "./application/search/queries/search.query";

// Temporary backward compatibility (will be removed)
export * from "./application/shared/temporary-types";

// Schemas
export * from "./schemas/admin/dashboard";
